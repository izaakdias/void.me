#!/bin/bash

# Script para configurar banco de dados usando PostgreSQL local
set -e

echo "🐘 Configurando banco de dados vo1d..."

# Tentar diferentes métodos de conexão
echo "🔍 Tentando conectar ao PostgreSQL..."

# Método 1: Usar usuário padrão do sistema
if psql -h localhost -U $USER -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Conectado como usuário do sistema"
    USER_TYPE="system"
elif psql -h localhost -U postgres -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Conectado como postgres"
    USER_TYPE="postgres"
else
    echo "❌ Não foi possível conectar ao PostgreSQL"
    echo "💡 Instale PostgreSQL ou configure acesso:"
    echo "   sudo -u postgres createuser -s $USER"
    echo "   sudo -u postgres createdb $USER"
    exit 1
fi

# Criar banco de dados
echo "🔧 Criando banco de dados vo1d..."
if [ "$USER_TYPE" = "system" ]; then
    psql -h localhost -U $USER -d postgres -c "CREATE DATABASE vo1d;" 2>/dev/null || echo "Banco vo1d já existe"
elif [ "$USER_TYPE" = "postgres" ]; then
    psql -h localhost -U postgres -d postgres -c "CREATE DATABASE vo1d;" 2>/dev/null || echo "Banco vo1d já existe"
fi

# Criar usuário vo1d
echo "👤 Criando usuário vo1d..."
if [ "$USER_TYPE" = "system" ]; then
    psql -h localhost -U $USER -d postgres -c "CREATE USER vo1d WITH PASSWORD 'vo1d123';" 2>/dev/null || echo "Usuário vo1d já existe"
    psql -h localhost -U $USER -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE vo1d TO vo1d;" 2>/dev/null || echo "Privilégios já concedidos"
elif [ "$USER_TYPE" = "postgres" ]; then
    psql -h localhost -U postgres -d postgres -c "CREATE USER vo1d WITH PASSWORD 'vo1d123';" 2>/dev/null || echo "Usuário vo1d já existe"
    psql -h localhost -U postgres -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE vo1d TO vo1d;" 2>/dev/null || echo "Privilégios já concedidos"
fi

# Executar schema
echo "📋 Executando schema do banco..."
if [ "$USER_TYPE" = "system" ]; then
    psql -h localhost -U $USER -d vo1d -f schema.sql
elif [ "$USER_TYPE" = "postgres" ]; then
    psql -h localhost -U postgres -d vo1d -f schema.sql
fi

echo "🎉 Banco de dados configurado com sucesso!"
echo "📊 Conexão: postgresql://vo1d:vo1d123@localhost:5432/vo1d"

