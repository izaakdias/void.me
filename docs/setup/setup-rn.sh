#!/bin/bash

# Script para inicializar projeto React Native vo1d
set -e

echo "📱 Inicializando projeto React Native vo1d..."

# Verificar se React Native CLI está instalado
if ! command -v react-native &> /dev/null; then
    echo "❌ React Native CLI não encontrado. Instalando..."
    npm install -g react-native-cli
fi

echo "✅ React Native CLI encontrado"

# Verificar se Android SDK está configurado
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  ANDROID_HOME não configurado"
    echo "💡 Configure o Android SDK:"
    echo "   export ANDROID_HOME=/path/to/android/sdk"
    echo "   export PATH=\$PATH:\$ANDROID_HOME/tools:\$ANDROID_HOME/platform-tools"
fi

# Verificar se Java está instalado
if ! command -v java &> /dev/null; then
    echo "❌ Java não encontrado. Instale o JDK 11 ou superior"
    exit 1
fi

echo "✅ Java encontrado: $(java -version 2>&1 | head -1)"

# Criar projeto React Native se não existir
if [ ! -d "android" ]; then
    echo "🔧 Criando projeto React Native..."
    npx react-native init vo1d --template react-native-template-typescript
    echo "✅ Projeto React Native criado"
else
    echo "✅ Projeto React Native já existe"
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Configurar Android
if [ -d "android" ]; then
    echo "🤖 Configurando Android..."
    cd android
    
    # Configurar Gradle
    echo "org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8" >> gradle.properties
    
    cd ..
    echo "✅ Android configurado"
fi

# Configurar iOS (se estiver no macOS)
if [[ "$OSTYPE" == "darwin"* ]] && [ -d "ios" ]; then
    echo "🍎 Configurando iOS..."
    cd ios
    pod install
    cd ..
    echo "✅ iOS configurado"
fi

echo ""
echo "🎉 Projeto React Native configurado com sucesso!"
echo ""
echo "📱 Para executar:"
echo "   npm run android    # Android"
echo "   npm run ios        # iOS (macOS apenas)"
echo "   npm start          # Metro bundler"
echo ""
echo "🔧 Certifique-se que o servidor está rodando:"
echo "   cd server && node index.js"
echo ""
echo "📱 Para dispositivo físico:"
echo "   - Conecte o dispositivo via USB"
echo "   - Habilite depuração USB"
echo "   - Execute: npm run android"

