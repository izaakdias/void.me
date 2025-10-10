#!/bin/bash

# Script de teste completo do vo1d
set -e

echo "🧪 Testando sistema vo1d..."

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Teste 1: Servidor backend
echo "🔍 Testando servidor backend..."
if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    print_success "Servidor backend funcionando"
else
    print_error "Servidor backend não está rodando"
    echo "💡 Execute: cd server && node index.js"
    exit 1
fi

# Teste 2: Banco de dados
echo "🔍 Testando banco de dados..."
if [ -f "server/data/vo1d.db" ]; then
    print_success "Banco SQLite encontrado"
else
    print_error "Banco SQLite não encontrado"
    echo "💡 Execute: cd server/scripts && ./setup-sqlite.sh"
    exit 1
fi

# Teste 3: Redis
echo "🔍 Testando Redis..."
if redis-cli ping >/dev/null 2>&1; then
    print_success "Redis funcionando"
else
    print_error "Redis não está rodando"
    echo "💡 Execute: redis-server"
    exit 1
fi

# Teste 4: Sistema de convites
echo "🔍 Testando sistema de convites..."
RESPONSE=$(curl -s -X POST http://localhost:3000/waitlist/add \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"5511999999999","name":"Teste","reason":"Teste do sistema"}')

if echo "$RESPONSE" | grep -q "success.*true"; then
    print_success "Sistema de convites funcionando"
else
    print_error "Sistema de convites com problema"
    echo "Resposta: $RESPONSE"
fi

# Teste 5: Dependências React Native
echo "🔍 Testando dependências React Native..."
if [ -d "node_modules" ]; then
    print_success "Dependências React Native instaladas"
else
    print_error "Dependências React Native não instaladas"
    echo "💡 Execute: npm install"
    exit 1
fi

# Teste 6: Configuração de rede
echo "🔍 Testando configuração de rede..."
IP=$(hostname -I | awk '{print $1}')
if curl -f http://${IP}:3000/health >/dev/null 2>&1; then
    print_success "Servidor acessível via rede: ${IP}:3000"
else
    print_warning "Servidor não acessível via rede"
    echo "💡 Configure firewall ou use localhost"
fi

echo ""
echo "🎉 Testes concluídos!"
echo ""
echo "📱 Para executar no dispositivo:"
echo "   1. Conecte o dispositivo via USB"
echo "   2. Habilite depuração USB"
echo "   3. Execute: npm run android"
echo ""
echo "🔧 Para desenvolvimento:"
echo "   - Servidor: http://localhost:3000"
echo "   - Rede: http://${IP}:3000"
echo "   - Banco: server/data/vo1d.db"
echo "   - Redis: localhost:6379"
echo ""
echo "🔑 Código de convite de teste: ADMIN123"

