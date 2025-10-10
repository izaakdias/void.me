#!/bin/bash

# Script simplificado para configurar banco SQLite (desenvolvimento)
set -e

echo "🗄️ Configurando banco SQLite para desenvolvimento..."

# Criar diretório de dados
mkdir -p data

# Criar banco SQLite
echo "🔧 Criando banco SQLite..."
sqlite3 data/vo1d.db << 'EOF'
-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT UNIQUE NOT NULL,
    name TEXT,
    public_key TEXT,
    private_key_hash TEXT,
    inviter_id INTEGER,
    needs_invite_code BOOLEAN DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inviter_id) REFERENCES users(id)
);

-- Tabela de códigos de convite
CREATE TABLE IF NOT EXISTS invite_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    used_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME DEFAULT (datetime('now', '+30 days')),
    used_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (used_by) REFERENCES users(id)
);

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    last_message_time DATETIME,
    last_message_content TEXT,
    has_unread_messages BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id),
    UNIQUE(user1_id, user2_id)
);

-- Tabela de mensagens (metadados)
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    message_type TEXT DEFAULT 'text',
    is_read BOOLEAN DEFAULT 0,
    is_destroyed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    destroyed_at DATETIME,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
);

-- Tabela de sessões ativas
CREATE TABLE IF NOT EXISTS active_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    device_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME DEFAULT (datetime('now', '+7 days')),
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de logs de segurança
CREATE TABLE IF NOT EXISTS security_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_inviter ON users(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_user ON invite_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_time);

-- Inserir usuário admin para testes
INSERT OR IGNORE INTO users (phone_number, name, needs_invite_code) 
VALUES ('5511999999999', 'Admin', 0);

-- Inserir código de convite para testes
INSERT OR IGNORE INTO invite_codes (code, user_id, is_active) 
VALUES ('ADMIN123', 1, 1);

EOF

echo "✅ Banco SQLite criado com sucesso!"
echo "📊 Arquivo: data/vo1d.db"
echo "🔑 Código de convite de teste: ADMIN123"

