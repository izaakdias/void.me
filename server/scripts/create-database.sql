# Configuração do PostgreSQL para vo1d
# Criar usuário e banco de dados

-- Conectar como superusuário (postgres)
-- CREATE USER vo1d WITH PASSWORD 'vo1d123';
-- CREATE DATABASE vo1d OWNER vo1d;
-- GRANT ALL PRIVILEGES ON DATABASE vo1d TO vo1d;

-- Ou usar comandos SQL diretos:
CREATE DATABASE vo1d;
CREATE USER vo1d WITH ENCRYPTED PASSWORD 'vo1d123';
GRANT ALL PRIVILEGES ON DATABASE vo1d TO vo1d;
ALTER USER vo1d CREATEDB;

