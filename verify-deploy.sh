#!/bin/bash

echo "🔍 Verificando deploy na VPS..."

VPS_URL="http://147.93.66.253:3000"

# Testar health check
echo "🏥 Testando health check..."
curl -s $VPS_URL/health | jq '.' || echo "❌ Health check falhou"

# Testar login
echo "🔐 Testando login..."
TOKEN=$(curl -s -X POST $VPS_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"!@#$%I02rd182"}' | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo "✅ Login funcionando"
    
    # Testar monitoramento
    echo "📊 Testando monitoramento..."
    curl -s $VPS_URL/api/monitor -H "Authorization: Bearer $TOKEN" | jq '.' || echo "❌ Monitor falhou"
    
    # Testar logs
    echo "📝 Testando logs..."
    curl -s $VPS_URL/api/logs -H "Authorization: Bearer $TOKEN" | jq '.' || echo "❌ Logs falharam"
else
    echo "❌ Login falhou"
fi

echo ""
echo "🎯 URLs para testar:"
echo "📊 Dashboard: $VPS_URL/dashboard.html"
echo "🔍 Monitor: $VPS_URL/monitor.html"
echo "🏥 Health: $VPS_URL/health"
