#!/bin/bash

echo "🧹 Tentando limpar banco na VPS via API..."

# URL do servidor
SERVER_URL="http://147.93.66.253:3000"

# Fazer login e obter token
echo "🔐 Fazendo login..."
TOKEN=$(curl -s -X POST $SERVER_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"!@#$%I02rd182"}' | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Falha no login"
    exit 1
fi

echo "✅ Login realizado com sucesso"

# Verificar métricas antes
echo "📊 Métricas ANTES da limpeza:"
curl -s $SERVER_URL/api/metrics -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "🔧 Tentando limpar via endpoints existentes..."

# Tentar limpar waitlist (se existir endpoint)
echo "🗑️ Limpando waitlist..."
curl -s -X DELETE $SERVER_URL/api/waitlist -H "Authorization: Bearer $TOKEN" || echo "Endpoint não disponível"

# Tentar limpar usuários (se existir endpoint)
echo "👥 Limpando usuários..."
curl -s -X DELETE $SERVER_URL/api/users -H "Authorization: Bearer $TOKEN" || echo "Endpoint não disponível"

# Verificar métricas depois
echo ""
echo "📊 Métricas DEPOIS da tentativa de limpeza:"
curl -s $SERVER_URL/api/metrics -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "💡 SOLUÇÃO ALTERNATIVA:"
echo "1. Acesse o dashboard: $SERVER_URL/dashboard.html"
echo "2. Faça login com admin/!@#$%I02rd182"
echo "3. Use o botão 'Limpar Banco' se disponível"
echo "4. Ou execute o SQL diretamente no PostgreSQL da VPS"
echo ""
echo "📄 SQL para executar no PostgreSQL:"
echo "cat clean-vps-postgres.sql"





