#!/bin/bash

echo "🚀 Testando sistema de monitoramento do vo1d..."

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

# Testar endpoint de monitoramento
echo "📊 Testando endpoint de monitoramento..."
curl -s $SERVER_URL/api/monitor -H "Authorization: Bearer $TOKEN" | jq '.'

# Testar endpoint de logs
echo "📝 Testando endpoint de logs..."
curl -s $SERVER_URL/api/logs -H "Authorization: Bearer $TOKEN" | jq '.'

# Testar health check
echo "🏥 Testando health check..."
curl -s $SERVER_URL/health | jq '.'

echo ""
echo "🎯 URLs do sistema de monitoramento:"
echo "📊 Dashboard Principal: $SERVER_URL/dashboard.html"
echo "🔍 Monitor em Tempo Real: $SERVER_URL/monitor.html"
echo "🏥 Health Check: $SERVER_URL/health"
echo "📈 API Monitor: $SERVER_URL/api/monitor"
echo "📝 API Logs: $SERVER_URL/api/logs"
echo ""
echo "💡 Para usar o monitoramento:"
echo "1. Acesse: $SERVER_URL/monitor.html"
echo "2. Clique em 'Iniciar Monitoramento'"
echo "3. Veja os dados em tempo real"
echo "4. Monitore requests, conexões e erros"
echo ""
echo "✅ Teste concluído!"





