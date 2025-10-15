#!/bin/bash

# 🚀 Script para Upload das Alterações para VPS
# Configure suas credenciais VPS abaixo

# CONFIGURAÇÕES DA VPS - ALTERE AQUI
VPS_HOST="seu-dominio.com"        # Substitua pelo seu domínio
VPS_USER="root"                   # Substitua pelo seu usuário
VPS_PATH="/var/www/html"          # Caminho onde está hospedada a landing page

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Fazendo upload das alterações para VPS...${NC}"
echo ""

# Verificar se as credenciais foram configuradas
if [ "$VPS_HOST" = "seu-dominio.com" ]; then
    echo -e "${RED}❌ ERRO: Configure suas credenciais VPS primeiro!${NC}"
    echo ""
    echo -e "${YELLOW}📝 Edite este script e altere:${NC}"
    echo "   VPS_HOST='seu-dominio.com'"
    echo "   VPS_USER='seu-usuario'"
    echo "   VPS_PATH='/caminho/para/sua/landing'"
    echo ""
    echo -e "${BLUE}💡 Exemplo:${NC}"
    echo "   VPS_HOST='meusite.com.br'"
    echo "   VPS_USER='root'"
    echo "   VPS_PATH='/var/www/html'"
    exit 1
fi

echo -e "${BLUE}📁 Fazendo upload dos arquivos atualizados...${NC}"

# Upload do index.html atualizado
echo "📄 Enviando index.html..."
scp landing/index.html $VPS_USER@$VPS_HOST:$VPS_PATH/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ index.html enviado com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao enviar index.html${NC}"
    exit 1
fi

# Upload do styles.css atualizado
echo "🎨 Enviando styles.css..."
scp landing/styles.css $VPS_USER@$VPS_HOST:$VPS_PATH/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ styles.css enviado com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao enviar styles.css${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Upload concluído com sucesso!${NC}"
echo ""
echo -e "${BLUE}🌐 Acesse seu site em:${NC}"
echo "   https://$VPS_HOST"
echo ""
echo -e "${YELLOW}📱 O link 'Download here' deve aparecer agora acima do 'Follow us'${NC}"
echo ""
echo -e "${BLUE}💡 Se não aparecer, limpe o cache do navegador (Ctrl+F5)${NC}"

