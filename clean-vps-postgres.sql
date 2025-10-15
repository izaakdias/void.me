-- Script SQL para limpar o banco PostgreSQL na VPS
-- Execute este script no banco PostgreSQL da VPS

-- Limpar tabelas na ordem correta (respeitando foreign keys)
DELETE FROM messages;
DELETE FROM conversations;
DELETE FROM active_sessions;
DELETE FROM security_logs;
DELETE FROM invite_codes;
DELETE FROM users WHERE phone_number != '+1234567890';
DELETE FROM waitlist;

-- Resetar sequências (se existirem)
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE messages_id_seq RESTART WITH 1;
ALTER SEQUENCE conversations_id_seq RESTART WITH 1;
ALTER SEQUENCE invite_codes_id_seq RESTART WITH 1;
ALTER SEQUENCE waitlist_id_seq RESTART WITH 1;

-- Verificar limpeza
SELECT 'Usuários restantes:', COUNT(*) FROM users;
SELECT 'Mensagens restantes:', COUNT(*) FROM messages;
SELECT 'Conversas restantes:', COUNT(*) FROM conversations;
SELECT 'Convites restantes:', COUNT(*) FROM invite_codes;
SELECT 'Waitlist restante:', COUNT(*) FROM waitlist;





