const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const redis = require('redis');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { Expo } = require('expo-server-sdk');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configurações
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-encryption-key';
const MESSAGE_TTL = parseInt(process.env.MESSAGE_TTL) || 5;

// Expo Push SDK
const expo = new Expo();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Muitas tentativas, tente novamente mais tarde'
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(limiter);
app.use(express.json({ limit: '50mb' })); // Aumentado para imagens
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Test PostgreSQL connection
app.get('/test-db', async (req, res) => {
  try {
    if (!isPostgres) {
      return res.json({ error: 'Not using PostgreSQL' });
    }
    
    const client = await db.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    
    res.json({
      status: 'PostgreSQL connected',
      current_time: result.rows[0].current_time,
      isPostgres: isPostgres
    });
  } catch (error) {
    res.status(500).json({
      error: 'PostgreSQL connection failed',
      message: error.message
    });
  }
});

// Conexão com Redis
let redisClient;
let redisConnected = false;

async function connectRedis() {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
      redisConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('🔄 Conectando ao Redis...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Conectado ao Redis');
      redisConnected = true;
    });

    redisClient.on('end', () => {
      console.log('❌ Conexão Redis encerrada');
      redisConnected = false;
    });

    await redisClient.connect();
  } catch (err) {
    console.error('❌ Erro ao conectar com Redis:', err);
    redisConnected = false;
  }
}

// Configuração do banco de dados
let db;
let isPostgres = false;
let dbPath = '';

if (process.env.DATABASE_URL) {
  // Produção - PostgreSQL
  isPostgres = true;
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  console.log('✅ Conectado ao PostgreSQL');
  
  // Criar tabelas automaticamente
  createTables().catch(err => {
    console.error('❌ Erro ao criar tabelas:', err);
  });
} else {
  // Desenvolvimento - SQLite
  dbPath = path.join(__dirname, 'data', 'vo1d.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Erro ao conectar com SQLite:', err);
    } else {
      console.log('✅ Conectado ao SQLite');
    }
  });
}

// Função para criar tabelas no PostgreSQL
async function createTables() {
  if (!isPostgres) {
    console.log('⚠️  Não é PostgreSQL, pulando criação de tabelas');
    return;
  }

  console.log('🔄 Iniciando criação de tabelas PostgreSQL...');
  
  try {
    const client = await db.connect();
    
    // Criar tabela waitlist
    await client.query(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending'
      )
    `);
    
    // Criar tabela users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        username VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Criar tabela invite_codes
    await client.query(`
      CREATE TABLE IF NOT EXISTS invite_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        used_by VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP
      )
    `);
    
    console.log('✅ Tabelas criadas/verificadas');
    
    client.release();
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  }
}

// Função para executar queries
async function dbQuery(query, params = []) {
  if (isPostgres) {
    const client = await db.connect();
    try {
      const result = await client.query(query, params);
      return result;
    } finally {
      client.release();
    }
  } else {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ rows });
      });
    });
  }
}

// Função para executar queries que modificam dados
async function dbRun(query, params = []) {
  if (isPostgres) {
    const client = await db.connect();
    try {
      const result = await client.query(query, params);
      return { lastID: result.rows[0]?.id || 0, changes: result.rowCount };
    } finally {
      client.release();
    }
  } else {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
}

// Endpoint para adicionar à waitlist
app.post('/api/waitlist', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Número de telefone é obrigatório' 
      });
    }
    
    // Verificar se já existe
    const existing = await dbQuery(
      isPostgres ? 'SELECT id FROM waitlist WHERE phone = $1' : 'SELECT id FROM waitlist WHERE phone_number = ?',
      [phone]
    );
    
    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Este número já existe na waitlist'
      });
    }
    
    // Adicionar à waitlist
    if (isPostgres) {
      await dbRun(
        'INSERT INTO waitlist (phone) VALUES ($1)',
        [phone]
      );
    } else {
      await dbRun(
        'INSERT INTO waitlist (phone_number) VALUES (?)',
        [phone]
      );
    }
    
    console.log(`✅ Novo número adicionado à waitlist: ${phone}`);
    
    res.json({
      success: true,
      message: 'Número adicionado à waitlist com sucesso!'
    });
    
  } catch (error) {
    console.error('❌ Erro no endpoint waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint para listar waitlist (admin)
app.get('/api/waitlist', async (req, res) => {
  try {
    const result = await dbQuery(
      'SELECT phone, created_at, status FROM waitlist ORDER BY created_at DESC'
    );
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint para verificar código de convite
app.post('/api/verify-invite', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código de convite é obrigatório' 
      });
    }
    
    const result = await dbQuery(
      'SELECT * FROM invite_codes WHERE code = $1',
      [code.toUpperCase()]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Código de convite inválido'
      });
    }
    
    const inviteCode = result.rows[0];
    
    if (inviteCode.used) {
      return res.json({
        success: false,
        message: 'Código de convite já foi usado'
      });
    }
    
    res.json({
      success: true,
      message: 'Código de convite válido'
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar código:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint para registrar usuário
app.post('/api/register', async (req, res) => {
  try {
    const { phone, username, inviteCode } = req.body;
    
    if (!phone || !username || !inviteCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      });
    }
    
    // Verificar código de convite
    const inviteResult = await dbQuery(
      'SELECT * FROM invite_codes WHERE code = $1',
      [inviteCode.toUpperCase()]
    );
    
    if (inviteResult.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Código de convite inválido'
      });
    }
    
    const invite = inviteResult.rows[0];
    
    if (invite.used) {
      return res.json({
        success: false,
        message: 'Código de convite já foi usado'
      });
    }
    
    // Verificar se usuário já existe
    const existingUser = await dbQuery(
      'SELECT id FROM users WHERE phone = $1',
      [phone]
    );
    
    if (existingUser.rows.length > 0) {
      return res.json({
        success: false,
        message: 'Usuário já existe'
      });
    }
    
    // Criar usuário
    await dbRun(
      'INSERT INTO users (phone, username) VALUES ($1, $2)',
      [phone, username]
    );
    
    // Marcar código como usado
    await dbRun(
      'UPDATE invite_codes SET used = TRUE, used_by = $1, used_at = CURRENT_TIMESTAMP WHERE code = $2',
      [phone, inviteCode.toUpperCase()]
    );
    
    console.log(`✅ Novo usuário registrado: ${username} (${phone})`);
    
    res.json({
      success: true,
      message: 'Usuário registrado com sucesso!'
    });
    
  } catch (error) {
    console.error('❌ Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint para enviar mensagem
app.post('/api/send-message', async (req, res) => {
  try {
    const { to, message, type = 'text' } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Destinatário e mensagem são obrigatórios' 
      });
    }
    
    if (!redisConnected) {
      return res.status(500).json({
        success: false,
        message: 'Redis não está conectado'
      });
    }
    
    const messageId = crypto.randomUUID();
    const messageData = {
      id: messageId,
      to,
      message,
      type,
      timestamp: new Date().toISOString(),
      ttl: MESSAGE_TTL
    };
    
    // Armazenar mensagem no Redis com TTL
    await redisClient.setEx(
      `message:${messageId}`,
      MESSAGE_TTL * 60, // TTL em segundos
      JSON.stringify(messageData)
    );
    
    console.log(`✅ Mensagem enviada: ${messageId} para ${to}`);
    
    res.json({
      success: true,
      messageId,
      message: 'Mensagem enviada com sucesso!'
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint para buscar mensagens
app.get('/api/messages/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    
    if (!redisConnected) {
      return res.status(500).json({
        success: false,
        message: 'Redis não está conectado'
      });
    }
    
    // Buscar todas as mensagens para o usuário
    const keys = await redisClient.keys('message:*');
    const messages = [];
    
    for (const key of keys) {
      const messageData = await redisClient.get(key);
      if (messageData) {
        const message = JSON.parse(messageData);
        if (message.to === phone) {
          messages.push(message);
        }
      }
    }
    
    res.json({
      success: true,
      messages: messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar mensagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Socket.IO para mensagens em tempo real
io.on('connection', (socket) => {
  console.log('👤 Usuário conectado:', socket.id);
  
  socket.on('join', (phone) => {
    socket.join(phone);
    console.log(`👤 Usuário ${phone} entrou na sala`);
  });
  
  socket.on('message', async (data) => {
    try {
      const { to, message, type = 'text' } = data;
      
      if (!redisConnected) {
        socket.emit('error', { message: 'Redis não está conectado' });
        return;
      }
      
      const messageId = crypto.randomUUID();
      const messageData = {
        id: messageId,
        to,
        message,
        type,
        timestamp: new Date().toISOString(),
        ttl: MESSAGE_TTL
      };
      
      // Armazenar mensagem no Redis com TTL
      await redisClient.setEx(
        `message:${messageId}`,
        MESSAGE_TTL * 60, // TTL em segundos
        JSON.stringify(messageData)
      );
      
      // Enviar para o destinatário
      socket.to(to).emit('newMessage', messageData);
      
      console.log(`📨 Mensagem enviada via socket: ${messageId} para ${to}`);
      
    } catch (error) {
      console.error('❌ Erro no socket message:', error);
      socket.emit('error', { message: 'Erro ao enviar mensagem' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('👤 Usuário desconectado:', socket.id);
  });
});

// Inicializar conexões
async function initialize() {
  console.log('🚀 Inicializando servidor...');
  
  // Conectar ao Redis
  await connectRedis();
  
  // Aguardar um pouco para garantir que as conexões estejam prontas
  setTimeout(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Servidor vo1d rodando na porta ${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Banco: ${isPostgres ? 'PostgreSQL' : 'SQLite'}`);
      console.log(`🔴 Redis: ${redisConnected ? 'Conectado' : 'Desconectado'}`);
    });
  }, 1000);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  if (redisClient) {
    await redisClient.quit();
  }
  if (db && isPostgres) {
    await db.end();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  if (redisClient) {
    await redisClient.quit();
  }
  if (db && isPostgres) {
    await db.end();
  }
  process.exit(0);
});

// Inicializar
initialize().catch(console.error);