#!/bin/bash

# Script para configurar PostgreSQL e Redis usando Docker
set -e

echo "🐳 Configurando PostgreSQL e Redis com Docker..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Instalando..."
    
    # Ubuntu/Debian
    if command -v apt &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        sudo usermod -aG docker $USER
    else
        echo "❌ Instale Docker manualmente: https://docs.docker.com/get-docker/"
        exit 1
    fi
fi

echo "✅ Docker encontrado"

# Parar containers existentes se houver
docker-compose down 2>/dev/null || true

# Iniciar PostgreSQL e Redis
echo "🚀 Iniciando PostgreSQL e Redis..."
docker-compose up -d postgres redis

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# Verificar se PostgreSQL está rodando
echo "🔍 Verificando PostgreSQL..."
docker exec vo1d-postgres pg_isready -U vo1d -d vo1d

# Executar schema
echo "📋 Executando schema do banco..."
docker exec -i vo1d-postgres psql -U vo1d -d vo1d < schema.sql

echo "🎉 PostgreSQL e Redis configurados com sucesso!"
echo "📊 PostgreSQL: localhost:5432"
echo "🔴 Redis: localhost:6379"

