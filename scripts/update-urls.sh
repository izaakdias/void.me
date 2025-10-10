#!/bin/bash

# Script para atualizar URLs do servidor para dispositivo físico
set -e

IP="192.168.0.33"
PORT="3000"
SERVER_URL="http://${IP}:${PORT}"

echo "🔧 Atualizando URLs para dispositivo físico..."
echo "📱 Servidor: ${SERVER_URL}"

# Atualizar AuthService
sed -i "s|Config.SERVER_URL|'${SERVER_URL}'|g" src/services/AuthService.js
sed -i "s|\${Config.SERVER_URL}|${SERVER_URL}|g" src/services/AuthService.js

# Atualizar MessagingService
sed -i "s|Config.SERVER_URL|'${SERVER_URL}'|g" src/services/MessagingService.js
sed -i "s|\${Config.SERVER_URL}|${SERVER_URL}|g" src/services/MessagingService.js

# Atualizar config.env
echo "SERVER_URL=${SERVER_URL}" > config.env
echo "MESSAGE_TTL=5" >> config.env
echo "MAX_MESSAGE_LENGTH=1000" >> config.env
echo "DEBUG=true" >> config.env

echo "✅ URLs atualizadas com sucesso!"
echo "📱 Configure o dispositivo para usar: ${SERVER_URL}"
echo ""
echo "🔧 Para Android:"
echo "   adb reverse tcp:3000 tcp:3000"
echo ""
echo "📱 Para iOS (simulador):"
echo "   Use localhost:3000"
echo ""
echo "📱 Para dispositivo físico:"
echo "   Certifique-se que o dispositivo está na mesma rede WiFi"
echo "   IP: ${IP}"

