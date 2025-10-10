-- Schema SQLite para vo1d com Firebase Auth
-- Mensagens efêmeras com criptografia E2E

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    firebase_uid TEXT UNIQUE,
    phone_number TEXT UNIQUE NOT NULL,
    display_name TEXT,
    public_key TEXT,
    private_key_hash TEXT,
    inviter_id TEXT REFERENCES users(id),
    needs_invite_code BOOLEAN DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    is_verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de códigos de convite
CREATE TABLE IF NOT EXISTS invite_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT 1,
    used_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME DEFAULT (datetime('now', '+30 days')),
    used_at DATETIME
);

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_time DATETIME,
    last_message_content TEXT,
    has_unread_messages BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id)
);

-- Tabela de mensagens (apenas para metadados, conteúdo fica no Redis)
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type TEXT DEFAULT 'text',
    is_read BOOLEAN DEFAULT 0,
    is_destroyed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    destroyed_at DATETIME
);

-- Tabela de sessões ativas
CREATE TABLE IF NOT EXISTS active_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME DEFAULT (datetime('now', '+7 days')),
    is_active BOOLEAN DEFAULT 1
);

-- Tabela de logs de segurança
CREATE TABLE IF NOT EXISTS security_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT, -- JSON como string
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user ON security_logs(user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_conversations_updated_at 
    AFTER UPDATE ON conversations
    BEGIN
        UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

