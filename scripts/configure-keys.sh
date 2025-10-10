#!/bin/bash

echo "🔑 Configurando chaves e credenciais para vo1d..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto vo1d"
    exit 1
fi

echo ""
echo "🚨 CONFIGURAÇÕES OBRIGATÓRIAS:"
echo ""

# 1. OneSignal
echo "🔔 1. ONESIGNAL (Notificações Push)"
echo "   📋 Instruções:"
echo "   1. Acesse: https://onesignal.com"
echo "   2. Crie uma conta gratuita"
echo "   3. Crie um novo app: 'vo1d'"
echo "   4. Vá em Settings > Keys & IDs"
echo "   5. Copie o 'OneSignal App ID'"
echo ""

read -p "   Digite o OneSignal App ID: " ONESIGNAL_APP_ID
if [ -z "$ONESIGNAL_APP_ID" ]; then
    echo "   ⚠️ OneSignal App ID não fornecido. Configure manualmente depois."
    ONESIGNAL_APP_ID="your_onesignal_app_id_here"
fi

read -p "   Digite o OneSignal REST API Key: " ONESIGNAL_REST_API_KEY
if [ -z "$ONESIGNAL_REST_API_KEY" ]; then
    echo "   ⚠️ OneSignal REST API Key não fornecido. Configure manualmente depois."
    ONESIGNAL_REST_API_KEY="your_rest_api_key_here"
fi

# 2. Twilio
echo ""
echo "📞 2. TWILIO (SMS OTP)"
echo "   📋 Instruções:"
echo "   1. Acesse: https://twilio.com"
echo "   2. Crie uma conta gratuita"
echo "   3. Vá em Console > Account Info"
echo "   4. Copie Account SID e Auth Token"
echo "   5. Compre um número de telefone"
echo ""

read -p "   Digite o Twilio Account SID: " TWILIO_ACCOUNT_SID
if [ -z "$TWILIO_ACCOUNT_SID" ]; then
    echo "   ⚠️ Twilio Account SID não fornecido. Configure manualmente depois."
    TWILIO_ACCOUNT_SID="your_account_sid_here"
fi

read -p "   Digite o Twilio Auth Token: " TWILIO_AUTH_TOKEN
if [ -z "$TWILIO_AUTH_TOKEN" ]; then
    echo "   ⚠️ Twilio Auth Token não fornecido. Configure manualmente depois."
    TWILIO_AUTH_TOKEN="your_auth_token_here"
fi

read -p "   Digite o Twilio Phone Number (+1234567890): " TWILIO_PHONE_NUMBER
if [ -z "$TWILIO_PHONE_NUMBER" ]; then
    echo "   ⚠️ Twilio Phone Number não fornecido. Configure manualmente depois."
    TWILIO_PHONE_NUMBER="your_phone_number_here"
fi

# 3. JWT Secret
echo ""
echo "🔐 3. JWT SECRET (Segurança)"
echo "   📋 Gerando chave JWT segura..."

JWT_SECRET=$(openssl rand -base64 32)
echo "   ✅ JWT Secret gerado: $JWT_SECRET"

# 4. Encryption Key
echo ""
echo "🔒 4. ENCRYPTION KEY (Criptografia)"
echo "   📋 Gerando chave de criptografia..."

ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "   ✅ Encryption Key gerado: $ENCRYPTION_KEY"

# Criar arquivos de configuração
echo ""
echo "📝 Criando arquivos de configuração..."

# OneSignal
cat > onesignal-config.json << EOF
{
  "app_id": "$ONESIGNAL_APP_ID",
  "rest_api_key": "$ONESIGNAL_REST_API_KEY",
  "project_name": "vo1d"
}
EOF

# Twilio
cat > server/.env.twilio << EOF
TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=$TWILIO_PHONE_NUMBER
EOF

# Servidor
cat > server/config.env << EOF
PORT=3000
NODE_ENV=development
JWT_SECRET=$JWT_SECRET
TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=$TWILIO_PHONE_NUMBER
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
DATABASE_URL=sqlite://data/vo1d.db
EOF

# Cliente
cat > config.env << EOF
# Configurações do cliente vo1d
SERVER_URL=http://192.168.0.33:3000
MESSAGE_TTL=5
MAX_MESSAGE_LENGTH=1000
DEBUG=true
ONESIGNAL_APP_ID=$ONESIGNAL_APP_ID
EOF

# Atualizar App.js com OneSignal App ID
if [ "$ONESIGNAL_APP_ID" != "your_onesignal_app_id_here" ]; then
    sed -i "s/YOUR_ONESIGNAL_APP_ID/$ONESIGNAL_APP_ID/g" src/App.js
    echo "   ✅ App.js atualizado com OneSignal App ID"
fi

echo ""
echo "✅ Arquivos de configuração criados:"
echo "   📄 onesignal-config.json"
echo "   📄 server/.env.twilio"
echo "   📄 server/config.env"
echo "   📄 config.env"
echo "   📄 src/App.js (atualizado)"

echo ""
echo "🧪 Testando configurações..."

# Testar OneSignal
if [ "$ONESIGNAL_APP_ID" != "your_onesignal_app_id_here" ]; then
    echo "🔔 Testando OneSignal..."
    ./test-onesignal.sh
fi

# Testar sistema
echo "🔍 Testando sistema completo..."
./test-system.sh

echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📱 Próximos passos:"
echo "   1. Teste o app: npm run android"
echo "   2. Teste notificações push"
echo "   3. Teste SMS OTP"
echo "   4. Configure certificados para produção"
echo ""
echo "🔑 Código de convite de teste: ADMIN123"
echo ""
echo "⚠️ IMPORTANTE:"
echo "   - Mantenha as chaves seguras"
echo "   - Não commite arquivos .env no git"
echo "   - Configure certificados para produção"
echo "   - Teste em dispositivos reais"

