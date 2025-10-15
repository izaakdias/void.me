#!/bin/bash

echo "🚀 Fazendo deploy do vo1d para VPS..."

# Configurações da VPS
VPS_HOST="147.93.66.253"
VPS_USER="seu_usuario"
VPS_PATH="/caminho/do/projeto"

# Arquivos para upload
FILES_TO_UPLOAD=(
    "server/index.js"
    "server/package.json"
    "server/package-lock.json"
    "landing/monitor.html"
    "landing/dashboard.html"
    "deploy-config.env"
)

echo "📤 Fazendo upload dos arquivos..."

# Upload dos arquivos
for file in "${FILES_TO_UPLOAD[@]}"; do
    echo "📁 Enviando $file..."
    scp "$file" $VPS_USER@$VPS_HOST:$VPS_PATH/
done

echo "🔧 Configurando servidor na VPS..."

# Comandos para executar na VPS
ssh $VPS_USER@$VPS_HOST << 'VPS_COMMANDS'
    cd /caminho/do/projeto
    
    # Instalar dependências
    npm install
    
    # Configurar variáveis de ambiente
    cp deploy-config.env .env
    
    # Reiniciar serviço
    pm2 restart vo1d || pm2 start server/index.js --name vo1d
    
    echo "✅ Deploy concluído!"
VPS_COMMANDS

echo "🎉 Deploy finalizado!"
