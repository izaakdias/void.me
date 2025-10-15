#!/bin/bash

echo "🚀 Gerando APK para o vo1d..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Instalar dependências se necessário
echo "📦 Verificando dependências..."
npm install

# Configurar EAS se necessário
echo "⚙️ Configurando EAS..."
eas init --force --non-interactive

# Tentar gerar o APK
echo "🔨 Gerando APK..."
echo "Escolha uma opção:"
echo "1) Build de desenvolvimento (requer Expo Go)"
echo "2) Build de preview (APK standalone)"
echo "3) Build de produção (APK para Play Store)"

read -p "Digite sua escolha (1-3): " choice

case $choice in
    1)
        echo "🔧 Gerando build de desenvolvimento..."
        eas build --platform android --profile development
        ;;
    2)
        echo "📱 Gerando build de preview..."
        eas build --platform android --profile preview
        ;;
    3)
        echo "🏪 Gerando build de produção..."
        eas build --platform android --profile production
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo "✅ Build iniciado! Você receberá um link para download quando estiver pronto."
echo "📧 Verifique seu email ou acesse: https://expo.dev/accounts/leaf-app/projects/vo1d"





