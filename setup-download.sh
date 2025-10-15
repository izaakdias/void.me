#!/bin/bash

# 🔧 Script de Configuração Manual para Download do APK
# Execute este script para configurar o download do APK na sua VPS

echo "🔧 Configuração Manual do Download do APK"
echo "=========================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📋 Instruções para configurar o download do APK:${NC}"
echo ""
echo "1. ${YELLOW}Configure suas credenciais VPS:${NC}"
echo "   Edite o arquivo upload-apk-to-vps.sh e altere:"
echo "   - VPS_HOST='seu-dominio.com'"
echo "   - VPS_USER='seu-usuario'"
echo "   - VPS_PATH='/caminho/para/sua/landing'"
echo ""
echo "2. ${YELLOW}Gere o APK:${NC}"
echo "   ./build-apk.sh"
echo ""
echo "3. ${YELLOW}Faça upload manual para VPS:${NC}"
echo "   scp /caminho/para/vo1d-v1.0.4.apk usuario@dominio.com:/var/www/html/downloads/"
echo ""
echo "4. ${YELLOW}Configure a estrutura na VPS:${NC}"
echo "   mkdir -p /var/www/html/downloads"
echo "   chmod 755 /var/www/html/downloads"
echo ""
echo "5. ${YELLOW}Teste o download:${NC}"
echo "   https://seu-dominio.com/download.html"
echo ""

echo -e "${GREEN}📁 Arquivos criados:${NC}"
echo "✅ landing/download.html - Página de download"
echo "✅ upload-apk-to-vps.sh - Script automático"
echo "✅ landing/index.html - Atualizado com botão de download"
echo "✅ landing/styles.css - Estilos para botão de download"
echo ""

echo -e "${BLUE}🚀 Próximos passos:${NC}"
echo "1. Configure suas credenciais VPS"
echo "2. Execute: ./build-apk.sh"
echo "3. Faça upload do APK para VPS"
echo "4. Teste o download"
echo ""

echo -e "${YELLOW}💡 Dicas importantes:${NC}"
echo "• O APK deve estar em: /var/www/html/downloads/"
echo "• Configure HTTPS para downloads seguros"
echo "• Adicione analytics para tracking de downloads"
echo "• Considere usar CDN para downloads mais rápidos"
echo ""

read -p "Pressione Enter para continuar..."

