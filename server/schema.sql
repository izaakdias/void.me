-- Schema do banco de dados para vo1d
-- Mensagens efêmeras com criptografia E2E

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    public_key TEXT,
    private_key_hash TEXT, -- Hash da chave privada para validação
    inviter_id UUID REFERENCES users(id),
    needs_invite_code BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de códigos de convite
CREATE TABLE IF NOT EXISTS invite_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(8) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    used_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    used_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_time TIMESTAMP WITH TIME ZONE,
    last_message_content TEXT,
    has_unread_messages BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Tabela de mensagens (apenas para metadados, conteúdo fica no Redis)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) DEFAULT 'text',
    is_read BOOLEAN DEFAULT false,
    is_destroyed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    destroyed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de sessões ativas
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    is_active BOOLEAN DEFAULT true
);

-- Tabela de logs de segurança
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas necessárias
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    UPDATE active_sessions 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
    
    DELETE FROM active_sessions 
    WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Função para limpar códigos de convite expirados
CREATE OR REPLACE FUNCTION cleanup_expired_invite_codes()
RETURNS void AS $$
BEGIN
    UPDATE invite_codes 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Função para obter conversas de um usuário
CREATE OR REPLACE FUNCTION get_user_conversations(user_uuid UUID)
RETURNS TABLE (
    conversation_id UUID,
    recipient_id UUID,
    recipient_name VARCHAR(100),
    recipient_phone VARCHAR(20),
    last_message_time TIMESTAMP WITH TIME ZONE,
    last_message_content TEXT,
    has_unread_messages BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as conversation_id,
        CASE 
            WHEN c.user1_id = user_uuid THEN c.user2_id
            ELSE c.user1_id
        END as recipient_id,
        u.name as recipient_name,
        u.phone_number as recipient_phone,
        c.last_message_time,
        c.last_message_content,
        c.has_unread_messages
    FROM conversations c
    JOIN users u ON (
        CASE 
            WHEN c.user1_id = user_uuid THEN u.id = c.user2_id
            ELSE u.id = c.user1_id
        END
    )
    WHERE c.user1_id = user_uuid OR c.user2_id = user_uuid
    ORDER BY c.last_message_time DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Função para criar ou obter conversa entre dois usuários
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_uuid UUID, user2_uuid UUID)
RETURNS UUID AS $$
DECLARE
    conversation_uuid UUID;
BEGIN
    -- Tentar encontrar conversa existente
    SELECT id INTO conversation_uuid
    FROM conversations
    WHERE (user1_id = user1_uuid AND user2_id = user2_uuid)
       OR (user1_id = user2_uuid AND user2_id = user1_uuid);
    
    -- Se não encontrou, criar nova conversa
    IF conversation_uuid IS NULL THEN
        INSERT INTO conversations (user1_id, user2_id)
        VALUES (LEAST(user1_uuid, user2_uuid), GREATEST(user1_uuid, user2_uuid))
        RETURNING id INTO conversation_uuid;
    END IF;
    
    RETURN conversation_uuid;
END;
$$ LANGUAGE plpgsql;

-- Comentários nas tabelas
COMMENT ON TABLE users IS 'Usuários do sistema vo1d';
COMMENT ON TABLE invite_codes IS 'Códigos de convite para acesso ao sistema';
COMMENT ON TABLE conversations IS 'Metadados das conversas entre usuários';
COMMENT ON TABLE messages IS 'Metadados das mensagens (conteúdo fica no Redis)';
COMMENT ON TABLE active_sessions IS 'Sessões ativas dos usuários';
COMMENT ON TABLE security_logs IS 'Logs de segurança e auditoria';

-- Comentários nas colunas importantes
COMMENT ON COLUMN users.public_key IS 'Chave pública para criptografia E2E';
COMMENT ON COLUMN users.private_key_hash IS 'Hash da chave privada para validação';
COMMENT ON COLUMN users.needs_invite_code IS 'Se usuário precisa de código de convite';
COMMENT ON COLUMN invite_codes.code IS 'Código de 8 caracteres para convite';
COMMENT ON COLUMN conversations.last_message_time IS 'Timestamp da última mensagem';
COMMENT ON COLUMN messages.is_destroyed IS 'Se mensagem foi auto-destruída';

-- Políticas de segurança (RLS - Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver seus próprios dados
CREATE POLICY user_own_data ON users
    FOR ALL TO PUBLIC
    USING (id = current_setting('app.current_user_id')::UUID);

-- Política: usuários só podem ver conversas onde participam
CREATE POLICY user_own_conversations ON conversations
    FOR ALL TO PUBLIC
    USING (user1_id = current_setting('app.current_user_id')::UUID 
           OR user2_id = current_setting('app.current_user_id')::UUID);

-- Política: usuários só podem ver mensagens de suas conversas
CREATE POLICY user_own_messages ON messages
    FOR ALL TO PUBLIC
    USING (sender_id = current_setting('app.current_user_id')::UUID 
           OR recipient_id = current_setting('app.current_user_id')::UUID);

-- Política: usuários só podem ver suas próprias sessões
CREATE POLICY user_own_sessions ON active_sessions
    FOR ALL TO PUBLIC
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Configurações de performance
-- Configurar work_mem para operações complexas
-- Configurar shared_buffers para cache
-- Configurar effective_cache_size para otimização de queries

-- Criar usuário específico para a aplicação (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'vo1d_app') THEN
        CREATE ROLE vo1d_app WITH LOGIN PASSWORD 'vo1d_app_password';
    END IF;
END
$$;

-- Conceder permissões ao usuário da aplicação
GRANT CONNECT ON DATABASE vo1d TO vo1d_app;
GRANT USAGE ON SCHEMA public TO vo1d_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vo1d_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO vo1d_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO vo1d_app;

-- Configurar permissões para tabelas futuras
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO vo1d_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO vo1d_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO vo1d_app;


