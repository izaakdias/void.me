#!/bin/bash

# Script para iniciar o projeto vo1d
# Resolve problemas comuns do Expo

echo "🚀 Iniciando projeto vo1d..."

# Parar processos existentes
echo "🛑 Parando processos existentes..."
pkill -f "expo start" 2>/dev/null
pkill -f "node index.js" 2>/dev/null
sleep 2

# Limpar cache do Expo
echo "🧹 Limpando cache do Expo..."
npx expo install --fix 2>/dev/null

# Iniciar backend
echo "🔧 Iniciando backend..."
cd server && npm start &
BACKEND_PID=$!
cd ..

# Aguardar backend inicializar
sleep 3

# Verificar se backend está rodando
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Backend rodando na porta 3000"
else
    echo "❌ Erro ao iniciar backend"
    exit 1
fi

# Iniciar Expo
echo "📱 Iniciando Expo..."
npx expo start --clear --android

# Função de limpeza ao sair
cleanup() {
    echo "🛑 Parando processos..."
    kill $BACKEND_PID 2>/dev/null
    pkill -f "expo start" 2>/dev/null
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT SIGTERM

echo "✅ Projeto iniciado com sucesso!"
echo "📱 Expo: http://localhost:8081"
echo "🔧 Backend: http://localhost:3000"
echo "🌐 Landing: http://localhost:8000"
echo ""
echo "Pressione Ctrl+C para parar"
