#!/bin/bash

echo "🔔 Testando OneSignal no vo1d..."

# Verificar se OneSignal está configurado
if [ ! -f "onesignal-config.json" ]; then
    echo "❌ Arquivo onesignal-config.json não encontrado"
    echo "📋 Execute primeiro: ./setup-complete.sh"
    exit 1
fi

# Ler configuração
ONESIGNAL_APP_ID=$(grep -o '"app_id": "[^"]*"' onesignal-config.json | cut -d'"' -f4)
ONESIGNAL_REST_API_KEY=$(grep -o '"rest_api_key": "[^"]*"' onesignal-config.json | cut -d'"' -f4)

if [ "$ONESIGNAL_APP_ID" = "your_onesignal_app_id_here" ]; then
    echo "❌ OneSignal App ID não configurado"
    echo "📋 Configure o App ID em onesignal-config.json"
    exit 1
fi

echo "📱 App ID: $ONESIGNAL_APP_ID"

# Testar envio de notificação
echo "🧪 Enviando notificação de teste..."

RESPONSE=$(curl -s -X POST "https://onesignal.com/api/v1/notifications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $ONESIGNAL_REST_API_KEY" \
  -d "{
    \"app_id\": \"$ONESIGNAL_APP_ID\",
    \"included_segments\": [\"All\"],
    \"headings\": {\"en\": \"Teste vo1d\"},
    \"contents\": {\"en\": \"Notificação de teste funcionando! 🎉\"},
    \"data\": {
      \"type\": \"test\",
      \"timestamp\": $(date +%s)
    }
  }")

if [[ "$RESPONSE" == *"id"* ]]; then
    echo "✅ Notificação enviada com sucesso!"
    echo "📊 Resposta: $RESPONSE"
else
    echo "❌ Erro ao enviar notificação"
    echo "📊 Resposta: $RESPONSE"
fi

# Testar API de estatísticas
echo "📊 Obtendo estatísticas..."

STATS_RESPONSE=$(curl -s -X GET "https://onesignal.com/api/v1/apps/$ONESIGNAL_APP_ID" \
  -H "Authorization: Basic $ONESIGNAL_REST_API_KEY")

if [[ "$STATS_RESPONSE" == *"name"* ]]; then
    echo "✅ Estatísticas obtidas com sucesso!"
    echo "📊 App: $(echo $STATS_RESPONSE | grep -o '"name":"[^"]*"' | cut -d'"' -f4)"
else
    echo "❌ Erro ao obter estatísticas"
fi

echo ""
echo "🎉 Teste OneSignal concluído!"
echo ""
echo "📱 Para testar no app:"
echo "   1. Execute o app no dispositivo"
echo "   2. Envie uma mensagem efêmera"
echo "   3. Verifique se a notificação push chega"
echo ""
echo "🔧 Para configurar:"
echo "   1. Acesse: https://onesignal.com"
echo "   2. Dashboard > Settings > Keys & IDs"
echo "   3. Copie o App ID para onesignal-config.json"
echo "   4. Configure no src/App.js"

