#!/bin/bash

echo "🧪 Testando funcionalidades do vo1d na VPS..."

# URL do servidor na VPS
SERVER_URL="http://147.93.66.253:3000"

# Verificar se o servidor está rodando
echo "🔍 Verificando servidor na VPS..."
if curl -s $SERVER_URL/health > /dev/null; then
    echo "✅ Servidor está rodando na VPS"
else
    echo "❌ Servidor não está acessível na VPS"
    exit 1
fi

# Testar health check
echo "📊 Health check:"
curl -s $SERVER_URL/health | jq '.' || echo "❌ Health check falhou"

# Testar endpoint de waitlist (público)
echo "📝 Testando endpoint de waitlist:"
curl -s $SERVER_URL/api/waitlist | jq '.' || echo "❌ Waitlist falhou"

# Testar endpoint de registro de usuário
echo "👤 Testando endpoint de registro:"
curl -s -X POST $SERVER_URL/api/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"+5511999999999","username":"teste","inviteCode":"TEST123"}' | jq '.' || echo "❌ Registro falhou"

# Verificar banco de dados local (se existir)
echo "🗄️ Verificando banco local (se existir)..."
if [ -f "server/data/vo1d.db" ]; then
    echo "✅ Banco SQLite local encontrado"
    
    # Verificar contadores
    echo "📊 Contadores locais:"
    sqlite3 server/data/vo1d.db << EOF
SELECT 'Usuários:', COUNT(*) FROM users;
SELECT 'Mensagens:', COUNT(*) FROM messages;
SELECT 'Conversas:', COUNT(*) FROM conversations;
SELECT 'Convites:', COUNT(*) FROM invite_codes;
SELECT 'Waitlist:', COUNT(*) FROM waitlist;
EOF
else
    echo "ℹ️ Banco local não encontrado (usando PostgreSQL na VPS)"
fi

echo ""
echo "🎯 URLs importantes:"
echo "📊 Dashboard: $SERVER_URL/dashboard.html"
echo "🏠 Landing Page: $SERVER_URL/"
echo "🔧 Health Check: $SERVER_URL/health"
echo ""
echo "📱 Para testar o app:"
echo "1. Acesse o dashboard para ver as métricas"
echo "2. Use o botão 'Limpar Banco' para resetar os dados"
echo "3. Teste o registro de usuários"
echo "4. Teste o envio de mensagens"
echo ""
echo "✅ Teste concluído!"





