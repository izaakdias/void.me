#!/bin/bash

echo "🚀 Configurando vo1d - Sistema Completo..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto vo1d"
    exit 1
fi

# 1. Instalar dependências do cliente
echo "📱 Instalando dependências do cliente..."
npm install

# 2. Instalar dependências do servidor
echo "🖥️ Instalando dependências do servidor..."
cd server
npm install
cd ..

# 3. Configurar banco de dados
echo "🗄️ Configurando banco de dados..."
./server/scripts/setup-sqlite.sh

# 4. Configurar Redis
echo "🔴 Configurando Redis..."
if ! command -v redis-server &> /dev/null; then
    echo "⚠️ Redis não encontrado. Instalando..."
    sudo apt-get update
    sudo apt-get install -y redis-server
fi

# Iniciar Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 5. Configurar Android
echo "🤖 Configurando Android..."
if [ ! -d "android/gradle" ]; then
    echo "📦 Baixando Gradle Wrapper..."
    cd android
    gradle wrapper
    cd ..
fi

# 6. Configurar iOS (se no macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Configurando iOS..."
    cd ios
    pod install
    cd ..
fi

# 7. Configurar notificações push (OneSignal)
echo "🔔 Configurando notificações push com OneSignal..."
# Criar arquivo de configuração OneSignal
cat > onesignal-config.json << EOF
{
  "app_id": "your_onesignal_app_id_here",
  "rest_api_key": "your_rest_api_key_here",
  "project_name": "vo1d"
}
EOF

echo "📋 Instruções para OneSignal:"
echo "   1. Acesse: https://onesignal.com"
echo "   2. Crie uma conta gratuita"
echo "   3. Crie um novo app: 'vo1d'"
echo "   4. Copie o App ID para onesignal-config.json"
echo "   5. Configure no src/App.js"

# 8. Configurar Twilio
echo "📞 Configurando Twilio..."
cat > server/.env.twilio << EOF
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_phone_number_here
EOF

# 9. Executar testes
echo "🧪 Executando testes..."
npm test

# 10. Verificar configuração
echo "✅ Verificando configuração..."
./test-system.sh

echo ""
echo "🎉 Configuração completa!"
echo ""
echo "📱 Para executar no Android:"
echo "   npm run android"
echo ""
echo "🍎 Para executar no iOS:"
echo "   npm run ios"
echo ""
echo "🖥️ Para executar o servidor:"
echo "   cd server && npm run dev"
echo ""
echo "🔧 Próximos passos:"
echo "   1. Configure suas credenciais Twilio em server/.env.twilio"
echo "   2. Configure OneSignal para notificações push"
echo "   3. Teste em dispositivos reais"
echo ""
echo "🔑 Código de convite de teste: ADMIN123"
