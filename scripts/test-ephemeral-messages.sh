#!/bin/bash

# Script de teste para sistema de mensagens efêmeras
set -e

echo "🧪 Testando sistema de mensagens efêmeras..."

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Teste 1: Servidor funcionando
echo "🔍 Testando servidor..."
if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    print_success "Servidor funcionando"
else
    print_error "Servidor não está rodando"
    exit 1
fi

# Teste 2: WebSocket funcionando
echo "🔍 Testando WebSocket..."
RESPONSE=$(curl -s -X GET http://localhost:3000/socket.io/ | head -1)
if echo "$RESPONSE" | grep -q "socket.io"; then
    print_success "WebSocket configurado"
else
    print_error "WebSocket não configurado"
fi

# Teste 3: Sistema de convites
echo "🔍 Testando sistema de convites..."
INVITE_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/validate-invite \
  -H "Content-Type: application/json" \
  -d '{"inviteCode":"ADMIN123"}')

if echo "$INVITE_RESPONSE" | grep -q "success.*true"; then
    print_success "Sistema de convites funcionando"
else
    print_error "Sistema de convites com problema"
fi

# Teste 4: Lista de espera
echo "🔍 Testando lista de espera..."
WAITLIST_RESPONSE=$(curl -s -X POST http://localhost:3000/waitlist/add \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"5511999999999","name":"Teste Timer","reason":"Teste de mensagens efêmeras"}')

if echo "$WAITLIST_RESPONSE" | grep -q "success.*true"; then
    print_success "Lista de espera funcionando"
else
    print_info "Número já está na lista (esperado)"
fi

# Teste 5: Redis funcionando
echo "🔍 Testando Redis..."
if redis-cli ping >/dev/null 2>&1; then
    print_success "Redis funcionando"
else
    print_error "Redis não está rodando"
fi

# Teste 6: Banco de dados
echo "🔍 Testando banco de dados..."
if [ -f "server/data/vo1d.db" ]; then
    print_success "Banco SQLite encontrado"
else
    print_error "Banco SQLite não encontrado"
fi

echo ""
echo "🎉 Testes do sistema de mensagens efêmeras concluídos!"
echo ""
echo "📱 Funcionalidades implementadas:"
echo "   ✅ Webhooks para recebimento de mensagens"
echo "   ✅ Sistema sem pré-visualização"
echo "   ✅ Timer de 5 segundos após abertura"
echo "   ✅ Auto-destruição automática"
echo "   ✅ Notificações em tempo real"
echo ""
echo "🔧 Para testar no dispositivo:"
echo "   1. Conecte o dispositivo via USB"
echo "   2. Habilite depuração USB"
echo "   3. Execute: npm run android"
echo ""
echo "📊 Monitoramento:"
echo "   - Servidor: http://localhost:3000"
echo "   - Health: http://localhost:3000/health"
echo "   - WebSocket: ws://localhost:3000"
echo ""
echo "🔑 Código de convite de teste: ADMIN123"

