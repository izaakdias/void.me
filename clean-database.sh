#!/bin/bash

echo "🧹 Limpando banco de dados do vo1d..."

# Verificar se estamos no diretório correto
if [ ! -f "server/index.js" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

cd server

# Verificar se o banco SQLite existe
if [ -f "data/vo1d.db" ]; then
    echo "Encontrado banco SQLite local"
    
    # Backup do banco atual
    echo "Criando backup do banco atual..."
    cp data/vo1d.db data/vo1d_backup_$(date +%Y%m%d_%H%M%S).db
    echo "Backup criado"
    
    # Limpar dados das tabelas principais
    echo "Limpando dados das tabelas..."
    
    sqlite3 data/vo1d.db << EOF
-- Limpar mensagens
DELETE FROM messages;

-- Limpar conversas
DELETE FROM conversations;

-- Limpar sessões ativas
DELETE FROM active_sessions;

-- Limpar logs de segurança
DELETE FROM security_logs;

-- Limpar códigos de convite
DELETE FROM invite_codes;

-- Limpar usuários (exceto admin)
DELETE FROM users WHERE phone_number != '+1234567890';

-- Limpar waitlist
DELETE FROM waitlist;

-- Resetar contadores
DELETE FROM sqlite_sequence WHERE name IN ('users', 'messages', 'conversations', 'invite_codes', 'waitlist');

-- Verificar limpeza
SELECT 'Usuários restantes:', COUNT(*) FROM users;
SELECT 'Mensagens restantes:', COUNT(*) FROM messages;
SELECT 'Conversas restantes:', COUNT(*) FROM conversations;
SELECT 'Convites restantes:', COUNT(*) FROM invite_codes;
SELECT 'Waitlist restante:', COUNT(*) FROM waitlist;

VACUUM;
EOF

    echo "Banco SQLite limpo com sucesso!"
    
else
    echo "Banco SQLite não encontrado em data/vo1d.db"
fi

# Se estiver usando PostgreSQL (produção)
if [ ! -z "$DATABASE_URL" ]; then
    echo "Detectado PostgreSQL em produção"
    echo "ATENÇÃO: Limpeza em produção requer confirmação manual"
    echo "Execute os seguintes comandos SQL no seu banco PostgreSQL:"
    echo ""
    echo "-- Limpar dados (CUIDADO EM PRODUÇÃO!)"
    echo "DELETE FROM messages;"
    echo "DELETE FROM conversations;"
    echo "DELETE FROM active_sessions;"
    echo "DELETE FROM security_logs;"
    echo "DELETE FROM invite_codes;"
    echo "DELETE FROM users WHERE phone != '+1234567890';"
    echo "DELETE FROM waitlist;"
    echo ""
    echo "-- Resetar sequências"
    echo "ALTER SEQUENCE users_id_seq RESTART WITH 1;"
    echo "ALTER SEQUENCE messages_id_seq RESTART WITH 1;"
    echo "ALTER SEQUENCE conversations_id_seq RESTART WITH 1;"
    echo "ALTER SEQUENCE invite_codes_id_seq RESTART WITH 1;"
    echo "ALTER SEQUENCE waitlist_id_seq RESTART WITH 1;"
fi

echo ""
echo "Próximos passos:"
echo "1. Reinicie o servidor: npm start"
echo "2. Teste o registro de novos usuários"
echo "3. Teste o envio de mensagens"
echo "4. Verifique o dashboard atualizado"
echo ""
echo "✅ Limpeza concluída!"
