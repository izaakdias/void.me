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

// Conexão com Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.connect().then(() => {
  console.log('Conectado ao Redis');
}).catch(err => {
  console.error('Erro ao conectar com Redis:', err);
});

// Configuração do banco de dados
let db;
let isPostgres = false;

if (process.env.DATABASE_URL) {
  // Produção - PostgreSQL
  isPostgres = true;
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  console.log('Conectado ao PostgreSQL');
  
  // Criar tabelas automaticamente
  createTables();
} else {
  // Desenvolvimento - SQLite
  const dbPath = path.join(__dirname, 'data', 'vo1d.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Erro ao conectar com SQLite:', err);
    } else {
      console.log('Conectado ao SQLite');
    }
  });
}

// Função para criar tabelas no PostgreSQL
async function createTables() {
  if (!isPostgres) return;
  
  try {
    const client = await db.connect();
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        username VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        invite_code VARCHAR(20),
        invited_by VARCHAR(20),
        is_admin BOOLEAN DEFAULT FALSE
      )
    `);
    
    // Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        encrypted_content TEXT,
        message_type VARCHAR(20) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        is_read BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (sender_id) REFERENCES users (id),
        FOREIGN KEY (receiver_id) REFERENCES users (id)
      )
    `);
    
    // Invite codes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invite_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        created_by INTEGER NOT NULL,
        used_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (created_by) REFERENCES users (id),
        FOREIGN KEY (used_by) REFERENCES users (id)
      )
    `);
    
    // Waitlist table
    await client.query(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        invited_at TIMESTAMP,
        invite_code VARCHAR(20)
      )
    `);
    
    // Push tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        platform VARCHAR(20) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    
    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_waitlist_phone ON waitlist(phone_number)');
    
    client.release();
    console.log('✅ Tabelas criadas com sucesso no PostgreSQL');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  }
}

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso necessário' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Utilitários
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateInviteCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

const formatPhoneNumber = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (!cleaned.startsWith('55') && cleaned.length === 11) {
    return '55' + cleaned;
  }
  return cleaned;
};

// Função para executar queries SQLite
const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Rotas de autenticação (gambiarra removida - usando Firebase)

app.post('/auth/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otpCode, sessionId } = req.body;

    if (!phoneNumber || !otpCode || !sessionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados obrigatórios não fornecidos' 
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const storedOTP = await redisClient.get(`otp:${formattedPhone}:${sessionId}`);

    // Verificar se estamos em modo de desenvolvimento
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         process.env.TWILIO_ACCOUNT_SID === 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' ||
                         !process.env.TWILIO_ACCOUNT_SID;

    // Em desenvolvimento, aceitar código fixo 123456 sempre
    const isValidOTP = storedOTP === otpCode || (isDevelopment && otpCode === '123456');
    
    if (!isValidOTP) {
      console.log('❌ OTP inválido:', { 
        received: otpCode, 
        stored: storedOTP, 
        isDevelopment,
        sessionId 
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Código OTP inválido ou expirado' 
      });
    }

    console.log('✅ OTP válido! Removendo da cache...');
    
    // Remover OTP usado
    await redisClient.del(`otp:${formattedPhone}:${sessionId}`);

    // Verificar se usuário existe
    const users = await dbQuery('SELECT * FROM users WHERE phone_number = ?', [formattedPhone]);

    let user;
    if (users.length === 0) {
      console.log('👤 Criando novo usuário...');
      // Criar novo usuário
      const result = await dbRun(
        'INSERT INTO users (phone_number, created_at, needs_invite_code) VALUES (?, datetime("now"), 1)',
        [formattedPhone]
      );
      user = { id: result.id, phone_number: formattedPhone, needs_invite_code: true };
    } else {
      console.log('👤 Usuário existente encontrado');
      user = users[0];
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        phoneNumber: formattedPhone 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🎉 Autenticação bem-sucedida!');

    res.json({
      success: true,
      message: 'Autenticação realizada com sucesso',
      token,
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        name: user.name,
        needsInviteCode: user.needs_invite_code,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Erro ao verificar OTP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

app.post('/auth/validate-invite', async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código de convite é obrigatório' 
      });
    }

    const inviteQuery = `
      SELECT u.* FROM invite_codes ic
      JOIN users u ON ic.user_id = u.id
      WHERE ic.code = ? AND ic.is_active = 1
    `;
    const invites = await dbQuery(inviteQuery, [inviteCode.toUpperCase()]);

    if (invites.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código de convite inválido' 
      });
    }

    const inviter = invites[0];

    res.json({
      success: true,
      message: 'Código de convite válido',
      inviter: {
        id: inviter.id,
        name: inviter.name,
        phoneNumber: inviter.phone_number
      }
    });

  } catch (error) {
    console.error('Erro ao validar código de convite:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

app.post('/auth/complete-registration', authenticateToken, async (req, res) => {
  try {
    const { inviteCode, userData } = req.body;
    const userId = req.user.userId;

    if (!inviteCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código de convite é obrigatório' 
      });
    }

    // Validar código de convite novamente
    const invites = await dbQuery(
      'SELECT * FROM invite_codes WHERE code = ? AND is_active = 1',
      [inviteCode.toUpperCase()]
    );

    if (invites.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código de convite inválido' 
      });
    }

    const invite = invites[0];

    // Atualizar usuário
    await dbRun(
      'UPDATE users SET name = ?, needs_invite_code = 0, inviter_id = ?, updated_at = datetime("now") WHERE id = ?',
      [userData.name || null, invite.user_id, userId]
    );

    // Desativar código de convite
    await dbRun(
      'UPDATE invite_codes SET is_active = 0 WHERE id = ?',
      [invite.id]
    );

    // Buscar usuário atualizado
    const users = await dbQuery('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];

    res.json({
      success: true,
      message: 'Registro concluído com sucesso',
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        name: user.name,
        needsInviteCode: user.needs_invite_code,
        inviterId: user.inviter_id,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Erro ao completar registro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

app.post('/auth/generate-invite', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const inviteCode = generateInviteCode();

    // Inserir código de convite
    await dbRun(
      'INSERT INTO invite_codes (code, user_id, created_at, expires_at) VALUES (?, ?, datetime("now"), datetime("now", "+30 days"))',
      [inviteCode, userId]
    );

    res.json({
      success: true,
      message: 'Código de convite gerado com sucesso',
      inviteCode
    });

  } catch (error) {
    console.error('Erro ao gerar código de convite:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Rotas de usuários
app.get('/users/:userId/public-key', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const users = await dbQuery('SELECT public_key FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }

    res.json({
      success: true,
      publicKey: users[0].public_key || 'default-public-key'
    });

  } catch (error) {
    console.error('Erro ao obter chave pública:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Rotas de conversas
app.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = `
      SELECT DISTINCT 
        CASE 
          WHEN c.user1_id = ? THEN c.user2_id
          ELSE c.user1_id
        END as recipient_id,
        u.name,
        u.phone_number,
        c.id as conversation_id,
        c.last_message_time,
        c.last_message_content,
        c.has_unread_messages
      FROM conversations c
      JOIN users u ON (
        CASE 
          WHEN c.user1_id = ? THEN u.id = c.user2_id
          ELSE u.id = c.user1_id
        END
      )
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.last_message_time DESC
    `;
    const conversations = await dbQuery(query, [userId, userId, userId, userId]);

    const formattedConversations = conversations.map(row => ({
      id: row.conversation_id,
      recipient: {
        id: row.recipient_id,
        name: row.name,
        phoneNumber: row.phone_number
      },
      lastMessageTime: row.last_message_time,
      lastMessage: row.last_message_content,
      hasUnreadMessages: row.has_unread_messages
    }));

    res.json({
      success: true,
      conversations: formattedConversations
    });

  } catch (error) {
    console.error('Erro ao obter conversas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// WebSocket para mensagens em tempo real
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Token de autenticação necessário'));
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Token inválido'));
    }
    socket.userId = decoded.userId;
    socket.phoneNumber = decoded.phoneNumber;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`Usuário conectado: ${socket.userId}`);

  // Entrar na sala do usuário
  socket.join(`user:${socket.userId}`);

  socket.on('send_message', async (data) => {
    try {
      const { recipientId, message, messageType, timestamp, ttl } = data;
      const senderId = socket.userId;

      // Gerar ID único para a mensagem
      const messageId = crypto.randomUUID();

      // Armazenar mensagem no Redis com TTL (sem conteúdo visível)
      const messageData = {
        id: messageId,
        senderId,
        recipientId,
        message, // Conteúdo criptografado
        messageType,
        timestamp,
        ttl,
        conversationId: `${Math.min(senderId, recipientId)}_${Math.max(senderId, recipientId)}`,
        isOpened: false,
        openedAt: null,
        destructionTimer: null
      };

      // Armazenar no Redis com TTL maior (para aguardar abertura)
      await redisClient.setEx(
        `message:${messageId}`,
        ttl * 10, // 50 segundos para aguardar abertura
        JSON.stringify(messageData)
      );

      // Enviar notificação de nova mensagem (SEM conteúdo)
      socket.to(`user:${recipientId}`).emit('new_message_notification', {
        messageId,
        senderId,
        timestamp: Date.now(),
        messageType,
        // NÃO incluir o conteúdo da mensagem
        preview: 'Nova mensagem efêmera',
        ttl
      });

      // Confirmar envio para o remetente
      socket.emit('message_sent', {
        messageId,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      socket.emit('message_error', {
        error: 'Falha ao enviar mensagem'
      });
    }
  });

  // Webhook para abrir mensagem (inicia timer de destruição)
  socket.on('open_message', async (data) => {
    try {
      const { messageId } = data;
      const userId = socket.userId;
      
      // Buscar mensagem no Redis
      const messageData = await redisClient.get(`message:${messageId}`);
      if (!messageData) {
        socket.emit('message_not_found', { messageId });
        return;
      }

      const message = JSON.parse(messageData);
      
      // Verificar se usuário tem permissão para abrir
      if (message.recipientId != userId) {
        socket.emit('message_access_denied', { messageId });
        return;
      }

      // Verificar se já foi aberta
      if (message.isOpened) {
        socket.emit('message_already_opened', { messageId });
        return;
      }

      // Marcar como aberta e iniciar timer
      message.isOpened = true;
      message.openedAt = Date.now();
      
      // Atualizar no Redis
      await redisClient.setEx(
        `message:${messageId}`,
        message.ttl, // 5 segundos para destruição
        JSON.stringify(message)
      );

      // Enviar conteúdo da mensagem para o usuário
      socket.emit('message_content', {
        messageId,
        content: message.message,
        messageType: message.messageType,
        timestamp: message.timestamp,
        ttl: message.ttl,
        openedAt: message.openedAt
      });

      // Notificar remetente que mensagem foi aberta
      socket.to(`user:${message.senderId}`).emit('message_opened', {
        messageId,
        openedAt: message.openedAt
      });

      // Agendar destruição automática
      setTimeout(async () => {
        await destroyMessage(messageId, message.senderId, message.recipientId);
      }, message.ttl * 1000);

    } catch (error) {
      console.error('Erro ao abrir mensagem:', error);
      socket.emit('message_error', {
        error: 'Falha ao abrir mensagem'
      });
    }
  });

  // Webhook para marcar mensagem como lida
  socket.on('message_read', async (data) => {
    try {
      const { messageId } = data;
      
      // Buscar mensagem no Redis
      const messageData = await redisClient.get(`message:${messageId}`);
      if (messageData) {
        const message = JSON.parse(messageData);
        
        // Notificar remetente que mensagem foi lida
        socket.to(`user:${message.senderId}`).emit('message_read', {
          messageId,
          readAt: Date.now()
        });
      }
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
    }
  });

  // Webhook para destruir mensagem manualmente
  socket.on('destroy_message', async (data) => {
    try {
      const { messageId } = data;
      const userId = socket.userId;
      
      // Buscar mensagem no Redis
      const messageData = await redisClient.get(`message:${messageId}`);
      if (!messageData) {
        socket.emit('message_not_found', { messageId });
        return;
      }

      const message = JSON.parse(messageData);
      
      // Verificar permissão (apenas destinatário pode destruir)
      if (message.recipientId != userId) {
        socket.emit('message_access_denied', { messageId });
        return;
      }

      await destroyMessage(messageId, message.senderId, message.recipientId);

    } catch (error) {
      console.error('Erro ao destruir mensagem:', error);
      socket.emit('message_error', {
        error: 'Falha ao destruir mensagem'
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Usuário desconectado: ${socket.userId}`);
  });
});

// Função para destruir mensagem
async function destroyMessage(messageId, senderId, recipientId) {
  try {
    // Remover mensagem do Redis
    await redisClient.del(`message:${messageId}`);
    
    // Notificar ambos os usuários que mensagem foi destruída
    io.to(`user:${senderId}`).emit('message_destroyed', {
      messageId,
      destroyedAt: Date.now()
    });
    
    io.to(`user:${recipientId}`).emit('message_destroyed', {
      messageId,
      destroyedAt: Date.now()
    });
    
    console.log(`Mensagem ${messageId} destruída automaticamente`);
  } catch (error) {
    console.error('Erro ao destruir mensagem:', error);
  }
}

// Sistema de Lista de Espera
app.post('/waitlist/add', async (req, res) => {
  try {
    const { phoneNumber, name, reason } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Número de telefone é obrigatório' 
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Verificar se já está na lista de espera
    const existing = await dbQuery(
      'SELECT * FROM waitlist WHERE phone_number = ?',
      [formattedPhone]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Este número já está na lista de espera' 
      });
    }

    // Adicionar à lista de espera
    await dbRun(
      'INSERT INTO waitlist (phone_number, name, reason, created_at) VALUES (?, ?, ?, datetime("now"))',
      [formattedPhone, name || null, reason || null]
    );

    const position = await getWaitlistPosition(formattedPhone);

    res.json({
      success: true,
      message: 'Adicionado à lista de espera com sucesso',
      position
    });

  } catch (error) {
    console.error('Erro ao adicionar à lista de espera:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

app.get('/waitlist/position/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const formattedPhone = formatPhoneNumber(phoneNumber);

    const position = await getWaitlistPosition(formattedPhone);

    if (position === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Número não encontrado na lista de espera' 
      });
    }

    const total = await getWaitlistTotal();

    res.json({
      success: true,
      position,
      total
    });

  } catch (error) {
    console.error('Erro ao obter posição na lista:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

app.get('/waitlist/stats', authenticateToken, async (req, res) => {
  try {
    const total = await getWaitlistTotal();
    const recent = await dbQuery(
      'SELECT * FROM waitlist ORDER BY created_at DESC LIMIT 10'
    );

    res.json({
      success: true,
      total,
      recent: recent.map(item => ({
        phoneNumber: item.phone_number,
        name: item.name,
        reason: item.reason,
        createdAt: item.created_at
      }))
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas da lista:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Funções auxiliares para lista de espera
const getWaitlistPosition = async (phoneNumber) => {
  const result = await dbQuery(
    'SELECT COUNT(*) as position FROM waitlist WHERE created_at < (SELECT created_at FROM waitlist WHERE phone_number = ?)',
    [phoneNumber]
  );
  return result[0]?.position || -1;
};

const getWaitlistTotal = async () => {
  const result = await dbQuery('SELECT COUNT(*) as total FROM waitlist');
  return result[0]?.total || 0;
};

// Sistema de Convites Melhorado
app.get('/invites/my-codes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const codes = await dbQuery(
      'SELECT * FROM invite_codes WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      codes: codes.map(code => ({
        id: code.id,
        code: code.code,
        isActive: code.is_active,
        usedBy: code.used_by,
        createdAt: code.created_at,
        expiresAt: code.expires_at,
        usedAt: code.used_at
      }))
    });

  } catch (error) {
    console.error('Erro ao obter códigos de convite:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

app.post('/invites/revoke', authenticateToken, async (req, res) => {
  try {
    const { inviteCodeId } = req.body;
    const userId = req.user.userId;

    if (!inviteCodeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID do código de convite é obrigatório' 
      });
    }

    // Verificar se o código pertence ao usuário
    const codes = await dbQuery(
      'SELECT * FROM invite_codes WHERE id = ? AND user_id = ?',
      [inviteCodeId, userId]
    );

    if (codes.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Código de convite não encontrado' 
      });
    }

    // Revogar código
    await dbRun(
      'UPDATE invite_codes SET is_active = 0 WHERE id = ?',
      [inviteCodeId]
    );

    res.json({
      success: true,
      message: 'Código de convite revogado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao revogar código de convite:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Estatísticas de convites
app.get('/invites/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const stats = await dbQuery(`
      SELECT 
        COUNT(*) as total_codes,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_codes,
        SUM(CASE WHEN used_by IS NOT NULL THEN 1 ELSE 0 END) as used_codes
      FROM invite_codes 
      WHERE user_id = ?
    `, [userId]);

    const invitedUsers = await dbQuery(`
      SELECT u.name, u.phone_number, ic.created_at as invited_at
      FROM users u
      JOIN invite_codes ic ON u.inviter_id = ic.user_id
      WHERE ic.user_id = ?
      ORDER BY ic.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      stats: stats[0],
      invitedUsers: invitedUsers.map(user => ({
        name: user.name,
        phoneNumber: user.phone_number,
        invitedAt: user.invited_at
      }))
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas de convites:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Sistema de Mensagens de Imagem Efêmeras
app.post('/messages/send-image', authenticateToken, async (req, res) => {
  try {
    const {
      recipientId,
      encryptedImage,
      encryptedSessionKey,
      imageHash,
      thumbnail,
      dimensions,
      originalSize,
      optimizedSize,
      compressionRatio,
      ttl = 5
    } = req.body;

    const senderId = req.user.userId;

    if (!recipientId || !encryptedImage || !encryptedSessionKey) {
      return res.status(400).json({
        success: false,
        message: 'Dados da imagem são obrigatórios'
      });
    }

    // Verificar se destinatário existe
    const recipient = await dbQuery(
      'SELECT * FROM users WHERE id = ?',
      [recipientId]
    );

    if (recipient.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Destinatário não encontrado'
      });
    }

    // Gerar ID único para a mensagem
    const messageId = crypto.randomUUID();

    // Armazenar imagem no Redis com TTL
    const imageData = {
      messageId,
      senderId,
      recipientId,
      encryptedImage,
      encryptedSessionKey,
      imageHash,
      thumbnail,
      dimensions,
      originalSize,
      optimizedSize,
      compressionRatio,
      messageType: 'image',
      timestamp: Date.now(),
      ttl,
      isOpened: false,
      isDestroyed: false
    };

    // Salvar no Redis com TTL
    await redisClient.setEx(
      `image:${messageId}`,
      ttl + 60, // TTL + 1 minuto de buffer
      JSON.stringify(imageData)
    );

    // Notificar destinatário via WebSocket
    io.to(`user:${recipientId}`).emit('new_image_notification', {
      messageId,
      senderId,
      senderName: req.user.name,
      messageType: 'image',
      timestamp: Date.now(),
      ttl,
      thumbnail,
      dimensions
    });

    res.json({
      success: true,
      message: 'Imagem enviada com sucesso',
      messageId,
      ttl
    });

  } catch (error) {
    console.error('Erro ao enviar imagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter imagem efêmera
app.get('/messages/image/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    // Buscar imagem no Redis
    const imageData = await redisClient.get(`image:${messageId}`);

    if (!imageData) {
      return res.status(404).json({
        success: false,
        message: 'Imagem não encontrada ou já foi destruída'
      });
    }

    const image = JSON.parse(imageData);

    // Verificar se o usuário é o destinatário
    if (image.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Verificar se já foi aberta
    if (image.isOpened) {
      return res.status(410).json({
        success: false,
        message: 'Imagem já foi visualizada'
      });
    }

    // Marcar como aberta
    image.isOpened = true;
    image.openedAt = Date.now();

    // Atualizar no Redis
    await redisClient.setEx(
      `image:${messageId}`,
      image.ttl + 60,
      JSON.stringify(image)
    );

    // Notificar remetente que foi visualizada
    io.to(`user:${image.senderId}`).emit('image_viewed', {
      messageId,
      viewedAt: Date.now()
    });

    res.json({
      success: true,
      encryptedImage: image.encryptedImage,
      encryptedSessionKey: image.encryptedSessionKey,
      imageHash: image.imageHash,
      dimensions: image.dimensions,
      ttl: image.ttl,
      openedAt: image.openedAt
    });

  } catch (error) {
    console.error('Erro ao obter imagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter thumbnail da imagem
app.get('/messages/image/:messageId/thumbnail', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    // Buscar imagem no Redis
    const imageData = await redisClient.get(`image:${messageId}`);

    if (!imageData) {
      return res.status(404).json({
        success: false,
        message: 'Imagem não encontrada'
      });
    }

    const image = JSON.parse(imageData);

    // Verificar se o usuário é o destinatário
    if (image.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    res.json({
      success: true,
      thumbnail: image.thumbnail,
      dimensions: image.dimensions
    });

  } catch (error) {
    console.error('Erro ao obter thumbnail:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Marcar imagem como visualizada
app.post('/messages/image/:messageId/viewed', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    // Buscar imagem no Redis
    const imageData = await redisClient.get(`image:${messageId}`);

    if (!imageData) {
      return res.status(404).json({
        success: false,
        message: 'Imagem não encontrada'
      });
    }

    const image = JSON.parse(imageData);

    // Verificar se o usuário é o destinatário
    if (image.recipientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Marcar como visualizada
    image.isOpened = true;
    image.openedAt = Date.now();

    // Atualizar no Redis
    await redisClient.setEx(
      `image:${messageId}`,
      image.ttl + 60,
      JSON.stringify(image)
    );

    // Notificar remetente
    io.to(`user:${image.senderId}`).emit('image_viewed', {
      messageId,
      viewedAt: Date.now()
    });

    res.json({
      success: true,
      message: 'Imagem marcada como visualizada'
    });

  } catch (error) {
    console.error('Erro ao marcar imagem como visualizada:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Estatísticas de imagens
app.get('/messages/image/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Buscar todas as imagens do usuário no Redis
    const keys = await redisClient.keys(`image:*`);
    let totalImages = 0;
    let totalSize = 0;
    let viewedImages = 0;

    for (const key of keys) {
      const imageData = await redisClient.get(key);
      if (imageData) {
        const image = JSON.parse(imageData);
        if (image.senderId === userId || image.recipientId === userId) {
          totalImages++;
          totalSize += image.optimizedSize || 0;
          if (image.isOpened) {
            viewedImages++;
          }
        }
      }
    }

    res.json({
      success: true,
      stats: {
        totalImages,
        viewedImages,
        totalSize,
        averageSize: totalImages > 0 ? Math.round(totalSize / totalImages) : 0
      }
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas de imagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Rota para enviar OTP via Twilio (REAL ou DEV)
app.post('/auth/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Número de telefone é obrigatório'
      });
    }

    console.log('📱 Enviando OTP para:', phoneNumber);

    // Verificar se estamos em modo de desenvolvimento
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         process.env.TWILIO_ACCOUNT_SID === 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' ||
                         !process.env.TWILIO_ACCOUNT_SID;

    if (isDevelopment) {
      console.log('🔧 MODO DESENVOLVIMENTO - Simulando envio de SMS');
      
      // Gerar código OTP fixo para desenvolvimento
      const otpCode = '123456'; // Código fixo para desenvolvimento
      const sessionId = crypto.randomUUID();
      
      // Armazenar OTP no Redis com TTL de 5 minutos
      await redisClient.setEx(`otp:${phoneNumber}:${sessionId}`, 300, otpCode);
      
      console.log('✅ DEV - OTP simulado gerado:', otpCode);
      console.log('📱 Use o código 123456 para testar');
      
      res.json({
        success: true,
        sessionId: sessionId,
        message: 'Código de verificação enviado! Use 123456 para testar.',
        isDevelopment: true
      });
      
    } else {
      console.log('🔥 MODO PRODUÇÃO - Enviando SMS real via Twilio');
      
      // Twilio REAL - Enviar SMS via Twilio
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      try {
        // Gerar código OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const sessionId = crypto.randomUUID();
        
        // Armazenar OTP no Redis com TTL de 5 minutos
        await redisClient.setEx(`otp:${phoneNumber}:${sessionId}`, 300, otpCode);
        
        // Enviar SMS via Twilio
        const message = await client.messages.create({
          body: `Seu código de verificação vo1d é: ${otpCode}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneNumber
        });
        
        console.log('✅ Twilio REAL - SMS enviado!');
        console.log('📱 Message SID:', message.sid);
        console.log('🔢 OTP gerado:', otpCode);
        
        res.json({
          success: true,
          sessionId: sessionId,
          message: 'SMS enviado via Twilio! Verifique seu telefone.'
        });

      } catch (twilioError) {
        console.error('💥 Erro Twilio:', twilioError);
        console.error('💥 Error code:', twilioError.code);
        console.error('💥 Error message:', twilioError.message);
        
        // Fallback para modo desenvolvimento em caso de erro
        console.log('🔄 Fallback para modo desenvolvimento devido ao erro Twilio');
        
        const otpCode = '123456';
        const sessionId = crypto.randomUUID();
        await redisClient.setEx(`otp:${phoneNumber}:${sessionId}`, 300, otpCode);
        
        res.json({
          success: true,
          sessionId: sessionId,
          message: 'Erro no Twilio. Use código 123456 para testar.',
          isDevelopment: true,
          twilioError: twilioError.message
        });
      }
    }

  } catch (error) {
    console.error('Erro ao enviar OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar OTP: ' + error.message
    });
  }
});

// Rota para verificar OTP via Firebase Admin SDK
app.post('/auth/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otpCode, verificationId } = req.body;

    if (!phoneNumber || !otpCode || !verificationId) {
      return res.status(400).json({
        success: false,
        message: 'Dados obrigatórios não fornecidos'
      });
    }

    console.log('🔢 Verificando OTP REAL via Firebase:', otpCode);
    console.log('📞 Phone:', phoneNumber);
    console.log('🆔 Verification ID:', verificationId);

    // Firebase Admin SDK - Verificar OTP real
    const { auth } = require('./config/firebase');
    
    try {
      console.log('🔥 Verificando com Firebase Admin SDK...');
      
      // Verificar OTP com Firebase Admin SDK
      const decodedToken = await auth.verifyIdToken(verificationId);
      
      console.log('✅ Firebase Admin SDK - OTP verificado com sucesso!');
      console.log('👤 User UID:', decodedToken.uid);
      
      // Criar usuário ou buscar existente
      const userId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Verificar se usuário já existe
      db.get('SELECT * FROM users WHERE phone_number = ?', 
        [phoneNumber], (err, user) => {
          if (err) {
            console.error('Erro ao buscar usuário:', err);
            return res.status(500).json({
              success: false,
              message: 'Erro interno do servidor'
            });
          }

          if (user) {
            // Usuário existe, gerar token
            const token = jwt.sign(
              { userId: user.id, phoneNumber: phoneNumber },
              JWT_SECRET,
              { expiresIn: '7d' }
            );

            return res.json({
              success: true,
              token,
              user: {
                id: user.id,
                phoneNumber: user.phone_number,
                displayName: user.display_name,
                createdAt: user.created_at,
                isVerified: true
              }
            });
          } else {
            // Criar novo usuário
            db.run(
              `INSERT INTO users (id, phone_number, display_name, created_at, is_verified) 
               VALUES (?, ?, ?, ?, ?)`,
              [userId, phoneNumber, 'Usuário', now, true],
              function(err) {
                if (err) {
                  console.error('Erro ao criar usuário:', err);
                  return res.status(500).json({
                    success: false,
                    message: 'Erro ao criar usuário'
                  });
                }

                // Gerar token
                const token = jwt.sign(
                  { userId: userId, phoneNumber: phoneNumber },
                  JWT_SECRET,
                  { expiresIn: '7d' }
                );

                res.json({
                  success: true,
                  token,
                  user: {
                    id: userId,
                    phoneNumber: phoneNumber,
                    displayName: 'Usuário',
                    createdAt: now,
                    isVerified: true
                  }
                });
              }
            );
          }
        });

    } catch (firebaseError) {
      console.error('💥 Erro Firebase Admin na verificação:', firebaseError);
      console.error('💥 Error code:', firebaseError.code);
      console.error('💥 Error message:', firebaseError.message);
      
      res.status(400).json({
        success: false,
        message: 'Código OTP inválido ou expirado'
      });
    }

  } catch (error) {
    console.error('Erro ao verificar OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Rota para login com Firebase (mantida para compatibilidade)
app.post('/auth/firebase-login', async (req, res) => {
  try {
    const { firebaseUid, phoneNumber, userData } = req.body;

    if (!firebaseUid || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Firebase UID e número de telefone são obrigatórios'
      });
    }

    // Verificar se usuário já existe
    db.get('SELECT * FROM users WHERE firebase_uid = ? OR phone_number = ?', 
      [firebaseUid, phoneNumber], (err, user) => {
        if (err) {
          console.error('Erro ao buscar usuário:', err);
          return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
          });
        }

        if (user) {
          // Usuário existe, gerar token
          const token = jwt.sign(
            { userId: user.id, firebaseUid: firebaseUid },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          return res.json({
            success: true,
            token,
            user: {
              id: user.id,
              phoneNumber: user.phone_number,
              displayName: user.display_name,
              createdAt: user.created_at,
              isVerified: true
            }
          });
        } else {
          // Criar novo usuário
          const userId = crypto.randomUUID();
          const now = new Date().toISOString();

          db.run(
            `INSERT INTO users (id, firebase_uid, phone_number, display_name, created_at, is_verified) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, firebaseUid, phoneNumber, userData.displayName || 'Usuário', now, true],
            function(err) {
              if (err) {
                console.error('Erro ao criar usuário:', err);
                return res.status(500).json({
                  success: false,
                  message: 'Erro ao criar usuário'
                });
              }

              // Gerar token
              const token = jwt.sign(
                { userId: userId, firebaseUid: firebaseUid },
                JWT_SECRET,
                { expiresIn: '7d' }
              );

              res.json({
                success: true,
                token,
                user: {
                  id: userId,
                  phoneNumber: phoneNumber,
                  displayName: userData.displayName || 'Usuário',
                  createdAt: now,
                  isVerified: true
                }
              });
            }
          );
        }
      });

  } catch (error) {
    console.error('Erro no login Firebase:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoints para Push Notifications

// Salvar push token do usuário
app.post('/api/save-push-token', authenticateToken, async (req, res) => {
  try {
    const { pushToken, platform } = req.body;
    const userId = req.user.userId;

    if (!pushToken || !platform) {
      return res.status(400).json({ 
        success: false, 
        message: 'Push token e platform são obrigatórios' 
      });
    }

    // Verificar se o token é válido do Expo
    if (!Expo.isExpoPushToken(pushToken)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token de push inválido' 
      });
    }

    // Criar tabela se não existir
    await dbRun(`
      CREATE TABLE IF NOT EXISTS push_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          push_token TEXT NOT NULL,
          platform TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, push_token)
      )
    `);

    // Inserir ou atualizar token
    await dbRun(`
      INSERT OR REPLACE INTO push_tokens (user_id, push_token, platform, is_active, updated_at) 
      VALUES (?, ?, ?, 1, datetime('now'))
    `, [userId, pushToken, platform]);

    console.log(`✅ Push token salvo para usuário ${userId}: ${pushToken}`);

    res.json({ 
      success: true, 
      message: 'Push token salvo com sucesso' 
    });

  } catch (error) {
    console.error('❌ Erro ao salvar push token:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Enviar notificação para todos os usuários
app.post('/api/send-push-to-all', authenticateToken, async (req, res) => {
  try {
    const { title, body, data = {} } = req.body;

    if (!title || !body) {
      return res.status(400).json({ 
        success: false, 
        message: 'Título e corpo são obrigatórios' 
      });
    }

    // Buscar todos os tokens ativos
    const tokens = await dbQuery(`
      SELECT DISTINCT push_token, platform 
      FROM push_tokens 
      WHERE is_active = 1 AND push_token IS NOT NULL
    `);

    if (tokens.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Nenhum token de push encontrado' 
      });
    }

    console.log(`📱 Enviando push para ${tokens.length} dispositivos...`);

    // Criar mensagens para o Expo
    const messages = tokens.map(({ push_token }) => ({
      to: push_token,
      sound: 'default',
      title,
      body,
      data: {
        type: 'system_announcement',
        ...data
      }
    }));

    // Enviar em lotes (Expo limita a 100 por vez)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('❌ Erro ao enviar chunk:', error);
      }
    }

    console.log(`✅ Push enviado para ${tickets.length} dispositivos`);

    res.json({ 
      success: true, 
      message: `Notificação enviada para ${tickets.length} dispositivos`,
      tickets: tickets.length
    });

  } catch (error) {
    console.error('❌ Erro ao enviar push para todos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Enviar notificação para usuário específico
app.post('/api/send-push-to-user', authenticateToken, async (req, res) => {
  try {
    const { userId, title, body, data = {} } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId, título e corpo são obrigatórios' 
      });
    }

    // Buscar tokens do usuário
    const tokens = await dbQuery(`
      SELECT push_token, platform 
      FROM push_tokens 
      WHERE user_id = ? AND is_active = 1 AND push_token IS NOT NULL
    `, [userId]);

    if (tokens.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não possui tokens de push' 
      });
    }

    console.log(`📱 Enviando push para usuário ${userId} (${tokens.length} dispositivos)...`);

    // Criar mensagens
    const messages = tokens.map(({ push_token }) => ({
      to: push_token,
      sound: 'default',
      title,
      body,
      data: {
        type: 'personal_message',
        ...data
      }
    }));

    // Enviar
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('❌ Erro ao enviar chunk:', error);
      }
    }

    console.log(`✅ Push enviado para usuário ${userId}`);

    res.json({ 
      success: true, 
      message: `Notificação enviada para usuário ${userId}`,
      tickets: tickets.length
    });

  } catch (error) {
    console.error('❌ Erro ao enviar push para usuário:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Waitlist endpoint
app.post('/api/waitlist', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || phone.length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Número de telefone inválido' 
      });
    }

    // Verificar se o número já existe
    const existing = await dbQuery(`
      SELECT * FROM waitlist WHERE phone_number = ?
    `, [phone]);

    if (existing.length > 0) {
      return res.json({ 
        success: true, 
        message: 'Este número já existe na waitlist' 
      });
    }

    // Inserir telefone na waitlist
    await dbRun(`
      INSERT INTO waitlist (phone_number, created_at) 
      VALUES (?, datetime('now'))
    `, [phone]);

    console.log(`✅ Telefone adicionado à waitlist: ${phone}`);

    res.json({ 
      success: true, 
      message: 'Telefone adicionado à waitlist com sucesso' 
    });

  } catch (error) {
    console.error('❌ Erro ao adicionar telefone à waitlist:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Get waitlist stats
app.get('/api/waitlist/stats', async (req, res) => {
  try {
    // Buscar estatísticas gerais
    const stats = await dbQuery(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today,
        COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') THEN 1 END) as thisWeek,
        MIN(created_at) as first_signup,
        MAX(created_at) as last_signup
      FROM waitlist
    `);

    // Buscar lista completa da waitlist
    const waitlist = await dbQuery(`
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
      stats: stats[0] || { total: 0, today: 0, thisWeek: 0 },
      waitlist: waitlist || []
    });

  } catch (error) {
    console.error('❌ Erro ao buscar stats da waitlist:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Send invite from waitlist
app.post('/api/waitlist/send-invite', async (req, res) => {
  try {
    const { phone, source = 'waitlist' } = req.body;

    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Telefone é obrigatório' 
      });
    }

    // Gerar código de convite único
    const inviteCode = generateInviteCode();
    
    // Criar usuário admin temporário para o convite
    const adminUser = {
      phone: 'admin-waitlist',
      name: 'Waitlist Admin',
      inviteCode: inviteCode,
      isAdmin: true
    };

    // Salvar no banco de dados
    await dbRun(`
      INSERT OR REPLACE INTO users (phone, name, invite_code, is_admin, created_at) 
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [adminUser.phone, adminUser.name, inviteCode, 1]);

    // Enviar SMS com o código de convite
    const smsMessage = `Here is your invite code to the new era of privacy:
${inviteCode}

Download at: https://void.app
Void team.`;

    try {
      // Enviar SMS via Twilio
      const twilioResponse = await client.messages.create({
        body: smsMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });

      console.log(`📱 SMS enviado para ${phone}: ${twilioResponse.sid}`);
      
      // Opcional: remover da waitlist após enviar convite
      await dbRun(`
        DELETE FROM waitlist WHERE phone_number = ?
      `, [phone]);

      res.json({ 
        success: true, 
        message: 'Convite enviado com sucesso via SMS',
        inviteCode: inviteCode,
        phone: phone,
        smsSid: twilioResponse.sid
      });

    } catch (smsError) {
      console.error('❌ Erro ao enviar SMS:', smsError);
      
      // Se falhar o SMS, ainda salva o código mas não remove da waitlist
      res.json({ 
        success: false, 
        message: 'Código gerado mas falha ao enviar SMS. Tente novamente.',
        inviteCode: inviteCode,
        phone: phone,
        error: 'SMS_FAILED'
      });
    }

  } catch (error) {
    console.error('❌ Erro ao enviar convite:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Send SMS manually (for retry cases)
app.post('/api/waitlist/send-sms', async (req, res) => {
  try {
    const { phone, inviteCode } = req.body;

    if (!phone || !inviteCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Telefone e código são obrigatórios' 
      });
    }

    // Template da mensagem SMS
    const smsMessage = `Here is your invite code to the new era of privacy:
${inviteCode}

Download at: https://void.app
Void team.`;

    try {
      // Enviar SMS via Twilio
      const twilioResponse = await client.messages.create({
        body: smsMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });

      console.log(`📱 SMS reenviado para ${phone}: ${twilioResponse.sid}`);

      res.json({ 
        success: true, 
        message: 'SMS reenviado com sucesso',
        phone: phone,
        inviteCode: inviteCode,
        smsSid: twilioResponse.sid
      });

    } catch (smsError) {
      console.error('❌ Erro ao reenviar SMS:', smsError);
      res.status(500).json({ 
        success: false, 
        message: 'Falha ao enviar SMS. Verifique as credenciais do Twilio.',
        error: smsError.message
      });
    }

  } catch (error) {
    console.error('❌ Erro ao reenviar SMS:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Inicializar servidor
server.listen(PORT, () => {
  console.log(`Servidor vo1d rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Banco: SQLite (${dbPath})`);
  console.log(`Redis: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM, encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Recebido SIGINT, encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});