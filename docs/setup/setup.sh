#!/bin/bash

# Script de inicialização do vo1d
# Configura e inicia todos os serviços necessários

set -e

echo "🚀 Iniciando configuração do vo1d..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker não está instalado. Por favor, instale o Docker primeiro."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
        exit 1
    fi
    
    print_success "Docker e Docker Compose encontrados"
}

# Verificar se Node.js está instalado
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js não está instalado. Por favor, instale o Node.js 18+ primeiro."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js versão 18+ é necessário. Versão atual: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) encontrado"
}

# Verificar se React Native CLI está instalado
check_react_native() {
    if ! command -v react-native &> /dev/null; then
        print_warning "React Native CLI não encontrado. Instalando..."
        npm install -g react-native-cli
    fi
    
    print_success "React Native CLI encontrado"
}

# Configurar variáveis de ambiente
setup_environment() {
    print_status "Configurando variáveis de ambiente..."
    
    # Criar arquivo .env para o servidor se não existir
    if [ ! -f "server/.env" ]; then
        cp server/.env.example server/.env 2>/dev/null || {
            cat > server/.env << EOF
# Configurações do servidor vo1d
NODE_ENV=development
PORT=3000

# Banco de Dados
POSTGRES_URL=postgresql://vo1d:vo1d123@localhost:5432/vo1d
REDIS_URL=redis://localhost:6379

# Segurança
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# SMS (Twilio) - Configure com suas credenciais
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Configurações do App
MESSAGE_TTL=5
MAX_MESSAGE_LENGTH=1000
MAX_CONTACTS_PER_USER=50
EOF
        }
        print_success "Arquivo .env criado para o servidor"
    fi
    
    # Criar arquivo config.env para o frontend se não existir
    if [ ! -f "config.env" ]; then
        cat > config.env << EOF
# Configurações do cliente vo1d
SERVER_URL=http://localhost:3000
MESSAGE_TTL=5
MAX_MESSAGE_LENGTH=1000
DEBUG=true
EOF
        print_success "Arquivo config.env criado para o frontend"
    fi
}

# Instalar dependências do servidor
install_server_deps() {
    print_status "Instalando dependências do servidor..."
    cd server
    npm install
    cd ..
    print_success "Dependências do servidor instaladas"
}

# Instalar dependências do frontend
install_frontend_deps() {
    print_status "Instalando dependências do frontend..."
    npm install
    print_success "Dependências do frontend instaladas"
}

# Configurar banco de dados
setup_database() {
    print_status "Configurando banco de dados..."
    
    # Iniciar PostgreSQL e Redis via Docker
    docker-compose up -d postgres redis
    
    # Aguardar serviços ficarem prontos
    print_status "Aguardando serviços ficarem prontos..."
    sleep 10
    
    # Executar script de configuração do banco
    cd server
    npm run setup-db
    cd ..
    
    print_success "Banco de dados configurado"
}

# Iniciar servidor
start_server() {
    print_status "Iniciando servidor..."
    cd server
    npm run dev &
    SERVER_PID=$!
    cd ..
    
    # Aguardar servidor ficar pronto
    print_status "Aguardando servidor ficar pronto..."
    sleep 5
    
    # Verificar se servidor está rodando
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_success "Servidor iniciado com sucesso"
    else
        print_error "Falha ao iniciar servidor"
        exit 1
    fi
}

# Função principal
main() {
    echo "🔐 vo1d - Mensagens Efêmeras com Criptografia E2E"
    echo "=================================================="
    
    # Verificações
    check_docker
    check_nodejs
    check_react_native
    
    # Configuração
    setup_environment
    install_server_deps
    install_frontend_deps
    setup_database
    
    # Iniciar serviços
    start_server
    
    echo ""
    print_success "🎉 vo1d configurado com sucesso!"
    echo ""
    echo "📱 Para executar o aplicativo:"
    echo "   npm run android    # Android"
    echo "   npm run ios        # iOS"
    echo ""
    echo "🌐 Servidor rodando em: http://localhost:3000"
    echo "📊 Health check: http://localhost:3000/health"
    echo ""
    echo "🔧 Para parar os serviços:"
    echo "   docker-compose down"
    echo ""
    echo "📖 Consulte o README.md para mais informações"
}

# Executar função principal
main "$@"


