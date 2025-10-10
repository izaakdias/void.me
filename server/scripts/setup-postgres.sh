#!/bin/bash

# Script para configurar PostgreSQL e Redis para vo1d
set -e

echo "🐘 Configurando PostgreSQL..."

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL não está instalado. Instalando..."
    
    # Ubuntu/Debian
    if command -v apt &> /dev/null; then
        sudo apt update
        sudo apt install -y postgresql postgresql-contrib
    # CentOS/RHEL
    elif command -v yum &> /dev/null; then
        sudo yum install -y postgresql postgresql-server postgresql-contrib
        sudo postgresql-setup initdb
        sudo systemctl enable postgresql
        sudo systemctl start postgresql
    # macOS
    elif command -v brew &> /dev/null; then
        brew install postgresql
        brew services start postgresql
    else
        echo "❌ Sistema operacional não suportado. Instale PostgreSQL manualmente."
        exit 1
    fi
fi

echo "✅ PostgreSQL encontrado"

# Iniciar PostgreSQL se não estiver rodando
if command -v systemctl &> /dev/null; then
    sudo systemctl start postgresql
elif command -v brew &> /dev/null; then
    brew services start postgresql
fi

# Criar banco de dados e usuário
echo "🔧 Criando banco de dados e usuário..."

sudo -u postgres psql -c "CREATE DATABASE vo1d;" 2>/dev/null || echo "Banco vo1d já existe"
sudo -u postgres psql -c "CREATE USER vo1d WITH ENCRYPTED PASSWORD 'vo1d123';" 2>/dev/null || echo "Usuário vo1d já existe"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vo1d TO vo1d;" 2>/dev/null || echo "Privilégios já concedidos"
sudo -u postgres psql -c "ALTER USER vo1d CREATEDB;" 2>/dev/null || echo "Privilégio CREATEDB já concedido"

echo "✅ Banco de dados PostgreSQL configurado"

# Executar schema
echo "📋 Executando schema do banco..."
PGPASSWORD=vo1d123 psql -h localhost -U vo1d -d vo1d -f schema.sql

echo "🎉 PostgreSQL configurado com sucesso!"

