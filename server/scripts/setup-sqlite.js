const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

async function setupSQLiteDatabase() {
  try {
    console.log('Iniciando configuração do banco SQLite...');

    // Criar diretório data se não existir
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'vo1d.db');
    const db = new sqlite3.Database(dbPath);

    // Criar tabelas
    const createTables = `
      -- Tabela de usuários
      CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone_number TEXT UNIQUE NOT NULL,
          name TEXT,
          public_key TEXT,
          private_key_hash TEXT,
          inviter_id INTEGER REFERENCES users(id),
          needs_invite_code INTEGER DEFAULT 1,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabela de códigos de convite
      CREATE TABLE IF NOT EXISTS invite_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT UNIQUE NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          is_active INTEGER DEFAULT 1,
          used_by INTEGER REFERENCES users(id),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME DEFAULT (datetime('now', '+30 days')),
          used_at DATETIME
      );

      -- Tabela de conversas
      CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          last_message_time DATETIME,
          last_message_content TEXT,
          has_unread_messages INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user1_id, user2_id)
      );

      -- Tabela de mensagens (apenas para metadados, conteúdo fica no Redis)
      CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          message_type TEXT DEFAULT 'text',
          is_read INTEGER DEFAULT 0,
          is_destroyed INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          read_at DATETIME,
          destroyed_at DATETIME
      );

      -- Tabela de sessões ativas
      CREATE TABLE IF NOT EXISTS active_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          device_id TEXT,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME DEFAULT (datetime('now', '+7 days')),
          is_active INTEGER DEFAULT 1
      );

      -- Tabela de logs de segurança
      CREATE TABLE IF NOT EXISTS security_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          action TEXT NOT NULL,
          details TEXT, -- JSON como texto
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabela de lista de espera
      CREATE TABLE IF NOT EXISTS waitlist (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone_number TEXT UNIQUE NOT NULL,
          name TEXT,
          reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Executar criação das tabelas
    db.exec(createTables, (err) => {
      if (err) {
        console.error('❌ Erro ao criar tabelas:', err);
        return;
      }
      console.log('✅ Tabelas criadas com sucesso!');
    });

    // Criar índices para performance
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
      CREATE INDEX IF NOT EXISTS idx_users_inviter ON users(inviter_id);
      CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
      CREATE INDEX IF NOT EXISTS idx_invite_codes_user ON invite_codes(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user1_id, user2_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_time);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_waitlist_phone ON waitlist(phone_number);
    `;

    db.exec(createIndexes, (err) => {
      if (err) {
        console.error('❌ Erro ao criar índices:', err);
        return;
      }
      console.log('✅ Índices criados com sucesso!');
    });

    // Criar trigger para atualizar updated_at
    const createTrigger = `
      CREATE TRIGGER IF NOT EXISTS update_users_updated_at
      AFTER UPDATE ON users
      FOR EACH ROW
      BEGIN
          UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;

      CREATE TRIGGER IF NOT EXISTS update_conversations_updated_at
      AFTER UPDATE ON conversations
      FOR EACH ROW
      BEGIN
          UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `;

    db.exec(createTrigger, (err) => {
      if (err) {
        console.error('❌ Erro ao criar triggers:', err);
        return;
      }
      console.log('✅ Triggers criados com sucesso!');
    });

    // Fechar conexão
    db.close((err) => {
      if (err) {
        console.error('❌ Erro ao fechar banco:', err);
        return;
      }
      console.log('🎉 Configuração do banco SQLite concluída!');
      console.log(`📁 Banco criado em: ${dbPath}`);
    });

  } catch (error) {
    console.error('❌ Erro ao configurar banco SQLite:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupSQLiteDatabase();
}

module.exports = { setupSQLiteDatabase };
