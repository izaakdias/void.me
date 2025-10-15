#!/bin/bash

echo "🚀 Deploy Simples para VPS - vo1d"

# Configurações (EDITE ESTAS LINHAS COM SUAS CREDENCIAIS)
VPS_HOST="147.93.66.253"
VPS_USER="seu_usuario"  # ← EDITE AQUI
VPS_PATH="/home/seu_usuario/vo1d"  # ← EDITE AQUI

echo "📋 Configurações:"
echo "   Host: $VPS_HOST"
echo "   Usuário: $VPS_USER"
echo "   Caminho: $VPS_PATH"
echo ""

# Verificar se as credenciais foram editadas
if [ "$VPS_USER" = "seu_usuario" ]; then
    echo "❌ ERRO: Você precisa editar as credenciais no script!"
    echo "   Edite o arquivo deploy-simple.sh e configure:"
    echo "   - VPS_USER (seu usuário SSH)"
    echo "   - VPS_PATH (caminho do projeto na VPS)"
    exit 1
fi

echo "🔐 Testando conexão SSH..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_HOST "echo 'Conexão OK'" 2>/dev/null; then
    echo "❌ Não foi possível conectar via SSH"
    echo "💡 Soluções:"
    echo "   1. Verifique se o SSH está habilitado na VPS"
    echo "   2. Configure chave SSH ou senha"
    echo "   3. Verifique o usuário e host"
    echo "   4. Use o painel da Hostinger para upload manual"
    exit 1
fi

echo "✅ Conexão SSH funcionando!"

# Criar diretório na VPS se não existir
echo "📁 Criando diretório na VPS..."
ssh $VPS_USER@$VPS_HOST "mkdir -p $VPS_PATH"

# Upload dos arquivos principais
echo "📤 Fazendo upload dos arquivos..."

echo "   📄 server/index.js"
scp server/index.js $VPS_USER@$VPS_HOST:$VPS_PATH/server/

echo "   📄 server/package.json"
scp server/package.json $VPS_USER@$VPS_HOST:$VPS_PATH/server/

echo "   📄 landing/monitor.html"
scp landing/monitor.html $VPS_USER@$VPS_HOST:$VPS_PATH/landing/

echo "   📄 landing/dashboard.html"
scp landing/dashboard.html $VPS_USER@$VPS_HOST:$VPS_PATH/landing/

# Instalar dependências e reiniciar
echo "🔧 Configurando servidor na VPS..."
ssh $VPS_USER@$VPS_HOST << EOF
    cd $VPS_PATH/server
    
    # Instalar dependências
    echo "📦 Instalando dependências..."
    npm install
    
    # Reiniciar serviço
    echo "🔄 Reiniciando serviço..."
    pm2 restart vo1d 2>/dev/null || pm2 start index.js --name vo1d 2>/dev/null || echo "⚠️ PM2 não encontrado, reinicie manualmente"
    
    echo "✅ Deploy concluído!"
EOF

echo ""
echo "🎉 Deploy finalizado!"
echo ""
echo "🔍 Verificando deploy..."
sleep 3

# Testar se o servidor está funcionando
if curl -s http://$VPS_HOST:3000/health > /dev/null; then
    echo "✅ Servidor funcionando!"
    echo ""
    echo "🎯 URLs para testar:"
    echo "   📊 Dashboard: http://$VPS_HOST:3000/dashboard.html"
    echo "   🔍 Monitor: http://$VPS_HOST:3000/monitor.html"
    echo "   🏥 Health: http://$VPS_HOST:3000/health"
else
    echo "❌ Servidor não está respondendo"
    echo "💡 Verifique os logs: ssh $VPS_USER@$VPS_HOST 'pm2 logs vo1d'"
fi





