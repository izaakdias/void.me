#!/bin/bash

echo "🚀 Configurando e gerando APK para vo1d..."

# Parar o processo anterior se estiver rodando
pkill -f "expo start" || true

# Configurar o projeto EAS
echo "⚙️ Configurando projeto EAS..."
eas init --force --non-interactive

# Configurar credenciais Android
echo "🔐 Configurando credenciais Android..."
echo "y" | eas credentials --platform android

# Gerar APK
echo "📱 Gerando APK..."
eas build --platform android --profile preview

echo "✅ Build iniciado!"
echo "📧 Você receberá um email quando o APK estiver pronto"
echo "🌐 Ou acesse: https://expo.dev/accounts/leaf-app/projects/vo1d"





