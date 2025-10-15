#!/bin/bash

# 🚀 Script para Upload Automático do APK para VPS
# Este script gera o APK e faz upload para a VPS automaticamente

set -e

echo "🚀 Iniciando processo de build e upload do APK..."

# Configurações
PROJECT_DIR="/home/izaak-dias/Downloads/vo1d-expo-new"
VPS_HOST="seu-dominio.com"  # Substitua pelo seu domínio
VPS_USER="root"             # Substitua pelo seu usuário
VPS_PATH="/var/www/html"    # Caminho onde está hospedada a landing page
APK_NAME="vo1d-v1.0.4.apk"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

# Verificar se está no diretório correto
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    error "Execute este script a partir do diretório raiz do projeto"
    exit 1
fi

cd "$PROJECT_DIR"

# 1. Parar processos anteriores
log "Parando processos anteriores..."
pkill -f "expo start" || true

# 2. Instalar dependências se necessário
log "Verificando dependências..."
if [ ! -d "node_modules" ]; then
    log "Instalando dependências..."
    npm install
fi

# 3. Gerar APK usando EAS
log "Gerando APK com EAS..."
if ! command -v eas &> /dev/null; then
    error "EAS CLI não encontrado. Instale com: npm install -g @expo/eas-cli"
    exit 1
fi

# Configurar EAS se necessário
if [ ! -f "eas.json" ]; then
    log "Configurando EAS..."
    eas init --force --non-interactive
fi

# Gerar APK
log "Iniciando build do APK..."
BUILD_OUTPUT=$(eas build --platform android --profile preview --non-interactive 2>&1)

# Extrair URL do APK do output
APK_URL=$(echo "$BUILD_OUTPUT" | grep -o 'https://expo.dev/artifacts/[^[:space:]]*' | head -1)

if [ -z "$APK_URL" ]; then
    error "Não foi possível obter a URL do APK. Verifique o output do EAS:"
    echo "$BUILD_OUTPUT"
    exit 1
fi

success "APK gerado com sucesso!"
log "URL do APK: $APK_URL"

# 4. Baixar APK
log "Baixando APK..."
TEMP_APK="/tmp/$APK_NAME"
curl -L -o "$TEMP_APK" "$APK_URL"

if [ ! -f "$TEMP_APK" ]; then
    error "Falha ao baixar o APK"
    exit 1
fi

success "APK baixado com sucesso!"

# 5. Criar diretório downloads na VPS (se não existir)
log "Criando diretório downloads na VPS..."
ssh "$VPS_USER@$VPS_HOST" "mkdir -p $VPS_PATH/downloads"

# 6. Upload do APK para VPS
log "Fazendo upload do APK para VPS..."
scp "$TEMP_APK" "$VPS_USER@$VPS_HOST:$VPS_PATH/downloads/"

if [ $? -eq 0 ]; then
    success "APK enviado para VPS com sucesso!"
else
    error "Falha no upload para VPS"
    exit 1
fi

# 7. Configurar permissões
log "Configurando permissões..."
ssh "$VPS_USER@$VPS_HOST" "chmod 644 $VPS_PATH/downloads/$APK_NAME"

# 8. Criar página de download na VPS (se não existir)
log "Criando página de download na VPS..."
scp "$PROJECT_DIR/landing/download.html" "$VPS_USER@$VPS_HOST:$VPS_PATH/"

# 9. Limpar arquivo temporário
rm -f "$TEMP_APK"

# 10. Informações finais
success "🎉 Processo concluído com sucesso!"
echo ""
echo "📱 APK disponível em: https://$VPS_HOST/downloads/$APK_NAME"
echo "🌐 Página de download: https://$VPS_HOST/download.html"
echo ""
echo "📋 Próximos passos:"
echo "1. Teste o download em: https://$VPS_HOST/download.html"
echo "2. Adicione o botão de download na página principal"
echo "3. Configure analytics para tracking de downloads"
echo ""

# 11. Opcional: Abrir página de download no navegador
if command -v xdg-open &> /dev/null; then
    read -p "Deseja abrir a página de download no navegador? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open "https://$VPS_HOST/download.html"
    fi
fi

echo "✅ Script finalizado!"

