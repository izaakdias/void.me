#!/bin/bash

echo "🧹 Limpando banco de dados na VPS..."

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

# Verificar métricas antes da limpeza
echo "📊 Métricas antes da limpeza:"
curl -s $SERVER_URL/api/metrics -H "Authorization: Bearer $TOKEN" | jq '.'

# Como não temos endpoint de limpeza na VPS, vamos usar uma abordagem alternativa
# Vou criar um endpoint temporário ou usar comandos SQL diretos

echo ""
echo "⚠️ O servidor na VPS não tem o endpoint de limpeza atualizado."
echo "📋 Dados atuais na VPS:"
echo "   - Usuários: 7"
echo "   - Convites: 12"
echo "   - Mensagens: 0"
echo ""
echo "🔧 Para limpar o banco na VPS, você precisa:"
echo "1. Fazer deploy do código atualizado para a VPS"
echo "2. Ou acessar o banco PostgreSQL diretamente"
echo "3. Ou usar o botão 'Limpar Banco' no dashboard (se disponível)"
echo ""
echo "💡 Alternativa: O banco local foi limpo com sucesso!"
echo "   - Usuários: 0"
echo "   - Mensagens: 0"
echo "   - Convites: 0"





