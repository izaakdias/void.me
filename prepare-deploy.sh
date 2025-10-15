#!/bin/bash

echo "🚀 Preparando deploy do vo1d para VPS..."

# Verificar se estamos no diretório correto
if [ ! -f "server/index.js" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Criar arquivo de configuração para deploy
echo "📝 Criando arquivo de configuração..."
cat > deploy-config.env << EOF
# Configuração para deploy na VPS
NODE_ENV=production
PORT=3000
JWT_SECRET=your-production-secret-key
ENCRYPTION_KEY=your-production-encryption-key
MESSAGE_TTL=5

# Banco de dados PostgreSQL (VPS)
DATABASE_URL=postgresql://usuario:senha@localhost:5432/vo1d

# Redis (VPS)
REDIS_URL=redis://localhost:6379

# Twilio (se configurado)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=!@#$%I02rd182
EOF

# Criar script de deploy
echo "📦 Criando script de deploy..."
cat > deploy-to-vps.sh << 'EOF'
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
EOF

chmod +x deploy-to-vps.sh

# Criar script de verificação
echo "🔍 Criando script de verificação..."
cat > verify-deploy.sh << 'EOF'
#!/bin/bash

echo "🔍 Verificando deploy na VPS..."

VPS_URL="http://147.93.66.253:3000"

# Testar health check
echo "🏥 Testando health check..."
curl -s $VPS_URL/health | jq '.' || echo "❌ Health check falhou"

# Testar login
echo "🔐 Testando login..."
TOKEN=$(curl -s -X POST $VPS_URL/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"!@#$%I02rd182"}' | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo "✅ Login funcionando"
    
    # Testar monitoramento
    echo "📊 Testando monitoramento..."
    curl -s $VPS_URL/api/monitor -H "Authorization: Bearer $TOKEN" | jq '.' || echo "❌ Monitor falhou"
    
    # Testar logs
    echo "📝 Testando logs..."
    curl -s $VPS_URL/api/logs -H "Authorization: Bearer $TOKEN" | jq '.' || echo "❌ Logs falharam"
else
    echo "❌ Login falhou"
fi

echo ""
echo "🎯 URLs para testar:"
echo "📊 Dashboard: $VPS_URL/dashboard.html"
echo "🔍 Monitor: $VPS_URL/monitor.html"
echo "🏥 Health: $VPS_URL/health"
EOF

chmod +x verify-deploy.sh

echo ""
echo "✅ Arquivos de deploy criados!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as credenciais SSH da VPS"
echo "2. Edite o arquivo deploy-to-vps.sh com seus dados"
echo "3. Execute: ./deploy-to-vps.sh"
echo "4. Verifique com: ./verify-deploy.sh"
echo ""
echo "📁 Arquivos criados:"
echo "   - deploy-config.env (configurações)"
echo "   - deploy-to-vps.sh (script de deploy)"
echo "   - verify-deploy.sh (verificação)"





