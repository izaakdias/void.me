const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const redis = require('redis');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { Expo } = require('expo-server-sdk');
const { Pool } = require('pg');
const twilio = require('twilio');
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

// Twilio Client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Muitas tentativas, tente novamente mais tarde'
});

// Middleware de segurança
app.use(cors({
  origin: ['http://147.93.66.253:3000', 'https://vo1d.me'],
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos
app.use(express.static('public'));

// Middleware de autenticação para endpoints sensíveis
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token de acesso necessário' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
}

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Login endpoint para gerar token de acesso
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Credenciais hardcoded para admin (em produção, usar banco de dados)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '!@#$%I02rd182';
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { 
          username: username, 
          role: 'admin',
          iat: Math.floor(Date.now() / 1000)
        }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        token: token,
        message: 'Login realizado com sucesso'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Waitlist stats endpoint - PROTEGIDO
app.get('/api/waitlist/stats', requireAuth, async (req, res) => {
  try {
    // Buscar estatísticas gerais
    const statsResult = await dbQuery(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today,
        COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') THEN 1 END) as thisWeek,
        MIN(created_at) as first_signup,
        MAX(created_at) as last_signup
      FROM waitlist
    `);

    // Buscar lista completa da waitlist
    const waitlistResult = await dbQuery(`
      SELECT 
        phone_number as phone,
        created_at,
        status
      FROM waitlist 
      ORDER BY created_at ASC
      LIMIT 100
    `);

    res.json({
      success: true,
      stats: statsResult.rows?.[0] || { total: 0, today: 0, thisWeek: 0 },
      waitlist: waitlistResult.rows || []
    });

  } catch (error) {
    console.error('❌ Erro ao buscar stats da waitlist:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Metrics endpoint for dashboard - PROTEGIDO
app.get('/api/metrics', requireAuth, async (req, res) => {
  try {
    // Contar usuários registrados
    const usersResult = await dbQuery('SELECT COUNT(*) as count FROM users');
    const totalUsers = usersResult.rows?.[0]?.count || 0;

    // Contar mensagens enviadas
    const messagesResult = await dbQuery('SELECT COUNT(*) as count FROM messages');
    const totalMessages = messagesResult.rows?.[0]?.count || 0;

    // Contar mensagens por tipo (enviadas vs recebidas)
    const messagesByTypeResult = await dbQuery(`
      SELECT 
        COUNT(*) as total_sent,
        COUNT(CASE WHEN sender_id IS NOT NULL THEN 1 END) as sent_by_users,
        COUNT(CASE WHEN recipient_id IS NOT NULL THEN 1 END) as received_by_users
      FROM messages
    `);
    const messagesStats = messagesByTypeResult.rows?.[0] || { total_sent: 0, sent_by_users: 0, received_by_users: 0 };

    // Contar convites enviados
    const invitesResult = await dbQuery('SELECT COUNT(*) as count FROM invite_codes');
    const totalInvites = invitesResult.rows?.[0]?.count || 0;

    // Contar conversas ativas
    const conversationsResult = await dbQuery('SELECT COUNT(*) as count FROM conversations');
    const totalConversations = conversationsResult.rows?.[0]?.count || 0;

    // Verificar status do Redis
    let redisConnected = false;
    let redisMessageCount = 0;
    try {
      if (redisClient) {
        await redisClient.ping();
        redisConnected = true;
        
        // Contar mensagens no Redis
        const redisKeys = await redisClient.keys('message:*');
        redisMessageCount = redisKeys.length;
      }
    } catch (error) {
      redisConnected = false;
    }

    // Informações do sistema
    const systemInfo = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    };

    res.json({
      success: true,
      totalUsers,
      totalMessages,
      totalInvites,
      totalConversations,
      messagesStats: {
        totalSent: messagesStats.total_sent,
        sentByUsers: messagesStats.sent_by_users,
        receivedByUsers: messagesStats.received_by_users,
        redisMessages: redisMessageCount
      },
      redisConnected,
      systemInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar métricas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Users list endpoint - PROTEGIDO
app.get('/api/users', requireAuth, async (req, res) => {
  try {
    const usersResult = await dbQuery(`
      SELECT 
        u.phone_number as phone,
        u.name,
        u.created_at,
        COUNT(ic.id) as invites_sent,
        COUNT(ic2.id) as invites_used
      FROM users u 
      LEFT JOIN invite_codes ic ON u.id = ic.user_id
      LEFT JOIN invite_codes ic2 ON u.id = ic2.used_by
      GROUP BY u.id 
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      users: usersResult.rows || []
    });

  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Validate invite code endpoint
app.post('/auth/validate-invite', async (req, res) => {
  try {
    const { inviteCode } = req.body;
    
    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Código de convite é obrigatório'
      });
    }
    
    // Verificar código de convite no banco
    console.log('🔍 Validando código:', inviteCode.toUpperCase());
    const inviteResult = await dbQuery(
      'SELECT * FROM invite_codes WHERE code = ? AND is_active = 1 AND expires_at > datetime("now")',
      [inviteCode.toUpperCase()]
    );
    
    console.log('📊 Resultado da query:', inviteResult);
    console.log('📊 Número de resultados:', inviteResult.rows.length);
    
    if (inviteResult.rows.length === 0) {
      console.log('❌ Código não encontrado ou expirado');
      return res.json({
        success: false,
        message: 'Código de convite inválido ou expirado'
      });
    }
    
    const invite = inviteResult.rows[0];
    console.log('📋 Convite encontrado:', invite);
    
    if (invite.used_by) {
      return res.json({
        success: false,
        message: 'Código de convite já foi usado'
      });
    }
    
    // Buscar dados do usuário que criou o convite
    const inviterResult = await dbQuery(
      'SELECT id, phone_number, name FROM users WHERE id = ?',
      [invite.user_id]
    );
    
    const inviter = inviterResult.rows[0] || { id: invite.user_id, phone_number: 'Admin', name: 'Admin' };
    
    res.json({
      success: true,
      message: 'Código de convite válido',
      inviter: {
        id: inviter.id,
        phone: inviter.phone_number,
        name: inviter.name
      }
    });

  } catch (error) {
    console.error('❌ Erro ao validar código de convite:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Complete registration endpoint
app.post('/auth/complete-registration', async (req, res) => {
  try {
    const { inviteCode, userData } = req.body;
    
    if (!inviteCode || !userData) {
      return res.status(400).json({
        success: false,
        message: 'Código de convite e dados do usuário são obrigatórios'
      });
    }
    
    // Verificar código de convite novamente
    const inviteResult = await dbQuery(
      'SELECT * FROM invite_codes WHERE code = ? AND is_active = 1 AND expires_at > datetime("now")',
      [inviteCode.toUpperCase()]
    );
    
    if (inviteResult.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Código de convite inválido ou expirado'
      });
    }
    
    const invite = inviteResult.rows[0];
    
    if (invite.used_by) {
      return res.json({
        success: false,
        message: 'Código de convite já foi usado'
      });
    }
    
    // Verificar se usuário já existe
    const existingUser = await dbQuery(
      'SELECT id FROM users WHERE phone_number = ?',
      [userData.phoneNumber]
    );
    
    if (existingUser.rows.length > 0) {
      return res.json({
        success: false,
        message: 'Usuário já existe'
      });
    }
    
    // Criar usuário
    const newUserResult = await dbQuery(
      'INSERT INTO users (phone_number, name, inviter_id, needs_invite_code, is_active) VALUES (?, ?, ?, 0, 1)',
      [userData.phoneNumber, userData.name || 'User', invite.user_id]
    );
    
    const newUser = {
      id: newUserResult.lastID,
      phone_number: userData.phoneNumber,
      name: userData.name || 'User',
      created_at: new Date().toISOString()
    };
    
    // Marcar código como usado
    await dbQuery(
      'UPDATE invite_codes SET used_by = ?, used_at = datetime("now") WHERE code = ?',
      [newUser.id, inviteCode.toUpperCase()]
    );
    
    console.log(`✅ Novo usuário registrado: ${newUser.name} (${newUser.phone_number})`);
    
    res.json({
      success: true,
      message: 'Registro concluído com sucesso',
      user: {
        id: newUser.id,
        phoneNumber: newUser.phone_number,
        name: newUser.name,
        createdAt: newUser.created_at
      }
    });

  } catch (error) {
    console.error('❌ Erro ao completar registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Generate invite code endpoint
app.post('/auth/generate-invite', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId || 1; // Fallback para admin
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Inserir código de convite
    await dbRun(
      'INSERT INTO invite_codes (id, code, user_id, is_active) VALUES (?, ?, ?, ?)',
      [`invite_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`, inviteCode, userId, 1]
    );

    res.json({
      success: true,
      message: 'Código de convite gerado com sucesso',
      inviteCode
    });

  } catch (error) {
    console.error('❌ Erro ao gerar código de convite:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Refresh token endpoint
app.post('/auth/refresh', requireAuth, async (req, res) => {
  try {
    const newToken = jwt.sign(
      { 
        userId: req.user.userId,
        phoneNumber: req.user.phoneNumber,
        role: req.user.role,
        iat: Math.floor(Date.now() / 1000)
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token: newToken,
      message: 'Token renovado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao renovar token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Send OTP endpoint - PROTEGIDO
app.post('/api/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Número de telefone é obrigatório'
      });
    }

    // Gerar código OTP de 6 dígitos
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Formatar número de telefone (remover parênteses e espaços)
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
    
    // Enviar SMS via Twilio
    try {
      if (twilioClient && TWILIO_PHONE_NUMBER) {
        const message = await twilioClient.messages.create({
          body: `Your OTP code is: ${otpCode}`,
          from: TWILIO_PHONE_NUMBER,
          to: formattedPhone
        });
        
        console.log(`📱 OTP enviado via Twilio para ${formattedPhone}: ${message.sid}`);
      } else {
        console.log(`📱 OTP simulado para ${formattedPhone}: ${otpCode}`);
      }
    } catch (twilioError) {
      console.error('❌ Erro ao enviar OTP via Twilio:', twilioError);
      console.log(`📱 OTP simulado para ${formattedPhone}: ${otpCode}`);
    }
    
    // Salvar OTP no Redis com expiração de 10 minutos
    if (redisClient && redisClient.isOpen) {
      await redisClient.setEx(`otp:${formattedPhone}`, 600, otpCode);
      console.log(`✅ OTP salvo no Redis: ${formattedPhone} -> ${otpCode}`);
    } else {
      console.log(`❌ Redis não conectado! OTP não foi salvo: ${otpCode}`);
    }
    
    res.json({
      success: true,
      message: 'OTP enviado com sucesso',
      sessionId: `session_${Date.now()}`
    });

  } catch (error) {
    console.error('❌ Erro ao enviar OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Verify OTP endpoint - PROTEGIDO
app.post('/api/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otpCode, sessionId } = req.body;
    
    if (!phoneNumber || !otpCode) {
      return res.status(400).json({
        success: false,
        message: 'Número de telefone e código OTP são obrigatórios'
      });
    }

    // Formatar número de telefone (remover parênteses e espaços)
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
    
    // Verificar OTP no Redis
    let storedOTP = null;
    if (redisClient && redisClient.isOpen) {
      storedOTP = await redisClient.get(`otp:${formattedPhone}`);
      console.log(`🔍 Verificando OTP no Redis: ${formattedPhone} -> ${storedOTP}`);
      console.log(`🔢 OTP recebido: ${otpCode}`);
      console.log(`✅ OTPs coincidem: ${storedOTP === otpCode}`);
    } else {
      console.log(`❌ Redis não conectado! Não é possível verificar OTP`);
    }
    
    if (!storedOTP || storedOTP !== otpCode) {
      console.log(`❌ OTP inválido ou expirado para ${formattedPhone}`);
      return res.status(400).json({
        success: false,
        message: 'Código OTP inválido ou expirado'
      });
    }
    
    // Remover OTP do Redis após verificação
    if (redisClient && redisClient.isOpen) {
      await redisClient.del(`otp:${formattedPhone}`);
      console.log(`🗑️ OTP removido do Redis: ${formattedPhone}`);
    }
    
    // Gerar token JWT
    const token = jwt.sign(
      { 
        phoneNumber: phoneNumber,
        role: 'user',
        iat: Math.floor(Date.now() / 1000)
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'OTP verificado com sucesso',
      token: token,
      user: {
        phoneNumber: phoneNumber
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Send invite endpoint - PROTEGIDO
app.post('/api/send-invite', requireAuth, async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Telefone é obrigatório'
      });
    }

    // Gerar código de convite único
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Salvar convite no banco
    const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await dbRun(`
      INSERT INTO invite_codes (id, code, user_id, is_active)
      VALUES (?, ?, ?, ?)
    `, [inviteId, inviteCode, 'admin-1', 1]);

    // Enviar SMS via Twilio
    try {
      if (twilioClient && TWILIO_PHONE_NUMBER) {
        const message = await twilioClient.messages.create({
          body: `Your invite code to Void is: ${inviteCode}\nWelcome to next era of privacy.`,
          from: TWILIO_PHONE_NUMBER,
          to: phone
        });
        
        console.log(`📱 SMS enviado via Twilio para ${phone}: ${message.sid}`);
      } else {
        console.log(`📱 SMS simulado para ${phone}: Your invite code to Void is: ${inviteCode}\nWelcome to next era of privacy.`);
      }
    } catch (twilioError) {
      console.error('❌ Erro ao enviar SMS via Twilio:', twilioError);
      console.log(`📱 SMS simulado para ${phone}: Your invite code to Void is: ${inviteCode}\nWelcome to next era of privacy.`);
    }
    
    // Atualizar status na waitlist
    await dbQuery(`
      UPDATE waitlist 
      SET status = 'invited' 
      WHERE phone_number = ?
    `, [phone]);

    res.json({
      success: true,
      message: 'Convite enviado com sucesso!',
      inviteCode: inviteCode
    });

  } catch (error) {
    console.error('❌ Erro ao enviar convite:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
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

// Clear database endpoint - PROTEGIDO (apenas para desenvolvimento)
app.post('/api/clear-database', requireAuth, async (req, res) => {
  try {
    // Verificar se é ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Limpeza de banco não permitida em produção'
      });
    }

    console.log('🧹 Iniciando limpeza do banco de dados...');

    // Limpar tabelas na ordem correta (respeitando foreign keys)
    await dbRun('DELETE FROM messages');
    await dbRun('DELETE FROM conversations');
    await dbRun('DELETE FROM active_sessions');
    await dbRun('DELETE FROM security_logs');
    await dbRun('DELETE FROM invite_codes');
    await dbRun('DELETE FROM users WHERE phone_number != "+1234567890"');
    await dbRun('DELETE FROM waitlist');

    // Limpar Redis se conectado
    if (redisClient && redisClient.isOpen) {
      const keys = await redisClient.keys('message:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`🗑️ Removidas ${keys.length} mensagens do Redis`);
      }
    }

    console.log('✅ Banco de dados limpo com sucesso');

    res.json({
      success: true,
      message: 'Banco de dados limpo com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar banco de dados'
    });
  }
});

// Conexão com Redis
let redisClient;
let redisConnected = false;

async function connectRedis() {
  try {
    // Usar IPv4 explicitamente para evitar problemas com IPv6
    const redisUrl = process.env.REDIS_URL || 'redis://:leaf_redis_2024@127.0.0.1:6379';
    console.log('🔄 Conectando ao Redis:', redisUrl);
    
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        family: 4 // Forçar IPv4
      }
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

// Variáveis para monitoramento em tempo real
let requestCount = 0;
let startTime = Date.now();
let activeConnections = 0;
let errorCount = 0;
let messageCount = 0;

// Middleware para contar requests
app.use((req, res, next) => {
  requestCount++;
  next();
});

// Endpoint para monitoramento em tempo real
app.get('/api/monitor', requireAuth, async (req, res) => {
  try {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const requestsPerMinute = Math.floor((requestCount / uptime) * 60);
    
    // Contar mensagens no Redis
    let redisMessageCount = 0;
    if (redisClient && redisClient.isOpen) {
      const keys = await redisClient.keys('message:*');
      redisMessageCount = keys.length;
    }

    res.json({
      success: true,
      requestsPerMinute,
      activeConnections,
      totalRequests: requestCount,
      errorCount,
      messageCount,
      redisMessageCount,
      uptime,
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro no monitor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados de monitoramento'
    });
  }
});

// Endpoint para logs em tempo real
app.get('/api/logs', requireAuth, async (req, res) => {
  try {
    // Simular logs (em produção, você usaria um sistema de logging real)
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Request #${requestCount} processado`,
        source: 'api'
      },
      {
        timestamp: new Date(Date.now() - 5000).toISOString(),
        level: 'info',
        message: 'Conexão WebSocket estabelecida',
        source: 'websocket'
      },
      {
        timestamp: new Date(Date.now() - 10000).toISOString(),
        level: 'info',
        message: 'Mensagem enviada via Redis',
        source: 'redis'
      }
    ];

    res.json({
      success: true,
      logs: logs.slice(0, 50) // Últimos 50 logs
    });

  } catch (error) {
    console.error('❌ Erro ao buscar logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar logs'
    });
  }
});

// WebSocket para monitoramento em tempo real
io.on('connection', (socket) => {
  activeConnections++;
  console.log(`👤 Usuário conectado: ${socket.id} (Total: ${activeConnections})`);
  
  // Enviar dados de monitoramento para clientes conectados
  const sendMonitorData = async () => {
    try {
      const uptime = Math.floor((Date.now() - startTime) / 1000);
      const requestsPerMinute = Math.floor((requestCount / uptime) * 60);
      
      let redisMessageCount = 0;
      if (redisClient && redisClient.isOpen) {
        const keys = await redisClient.keys('message:*');
        redisMessageCount = keys.length;
      }

      socket.emit('monitorData', {
        requestsPerMinute,
        activeConnections,
        totalRequests: requestCount,
        errorCount,
        messageCount,
        redisMessageCount,
        uptime,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao enviar dados de monitor:', error);
    }
  };

  // Enviar dados a cada 5 segundos
  const monitorInterval = setInterval(sendMonitorData, 5000);
  
  socket.on('join', (phone) => {
    socket.join(phone);
    console.log(`👤 Usuário ${phone} entrou na sala`);
  });
  
  socket.on('message', async (data) => {
    try {
      const { to, message, type = 'text' } = data;
      
      if (!redisConnected) {
        socket.emit('error', { message: 'Redis não está conectado' });
        errorCount++;
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
      
      messageCount++;
      console.log(`📨 Mensagem enviada via socket: ${messageId} para ${to}`);

    } catch (error) {
      console.error('❌ Erro no socket message:', error);
      errorCount++;
      socket.emit('error', { message: 'Erro ao enviar mensagem' });
    }
  });
  
  socket.on('disconnect', () => {
    activeConnections--;
    clearInterval(monitorInterval);
    console.log(`👤 Usuário desconectado: ${socket.id} (Total: ${activeConnections})`);
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