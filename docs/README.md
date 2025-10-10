# README.md para vo1d
# Mensagens Efêmeras com Criptografia E2E

## 🚀 Sobre o vo1d

O **vo1d** é um aplicativo de mensagens efêmeras que prioriza a privacidade total. As mensagens se auto-destroem após 5 segundos de serem abertas, sem deixar rastros ou histórico.

### ✨ Características Principais

- 🔐 **Criptografia End-to-End**: Mensagens criptografadas de ponta a ponta
- ⏰ **Auto-destruição**: Mensagens desaparecem em 5 segundos
- 🔒 **Rede Fechada**: Acesso apenas via código de convite
- 📱 **Autenticação por Telefone**: Login via OTP (SMS)
- 🚫 **Sem Histórico**: Nenhuma mensagem é armazenada permanentemente
- 🛡️ **Anti-rastro**: Totalmente sem rastro e sem backup
- ⚡ **Tempo Real**: WebSocket para mensagens instantâneas

## 🏗️ Arquitetura

### Frontend (React Native)
- **Autenticação**: OTP via SMS
- **Criptografia**: Chaves E2E geradas localmente
- **Interface**: Design moderno e intuitivo
- **Segurança**: Chaves armazenadas no Keychain

### Backend (Node.js + Express)
- **API REST**: Endpoints para autenticação e gerenciamento
- **WebSocket**: Mensagens em tempo real
- **Rate Limiting**: Proteção contra spam
- **JWT**: Autenticação segura
- **OneSignal**: Notificações push (alternativa ao Firebase)

### Banco de Dados
- **PostgreSQL**: Usuários, conversas e metadados
- **Redis**: Mensagens efêmeras com TTL
- **Criptografia**: Chaves E2E por dispositivo

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- React Native CLI
- PostgreSQL 15+
- Redis 7+
- Docker e Docker Compose (opcional)

### 1. Configuração do Backend

```bash
# Entrar no diretório do servidor
cd server

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Configurar banco de dados
npm run setup-db

# Iniciar servidor
npm run dev
```

### 2. Configuração do Frontend

```bash
# Instalar dependências do React Native
npm install

# Configurar Android
cd android && ./gradlew clean && cd ..

# Configurar iOS
cd ios && pod install && cd ..

# Iniciar Metro bundler
npm start

# Executar no Android
npm run android

# Executar no iOS
npm run ios
```

### 3. Usando Docker Compose

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

## 🔧 Configuração

### Variáveis de Ambiente

#### Backend (.env)
```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados
POSTGRES_URL=postgresql://vo1d:vo1d123@localhost:5432/vo1d
REDIS_URL=redis://localhost:6379

# Segurança
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-super-secret-encryption-key-32-chars

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Configurações do App
MESSAGE_TTL=5
MAX_MESSAGE_LENGTH=1000
MAX_CONTACTS_PER_USER=50
```

#### Frontend (config.env)
```env
# Servidor
SERVER_URL=http://localhost:3000

# Configurações
MESSAGE_TTL=5
MAX_MESSAGE_LENGTH=1000
```

## 📱 Uso do Aplicativo

### 1. Primeiro Acesso
1. Abra o aplicativo vo1d
2. Digite seu número de telefone
3. Receba o código OTP por SMS
4. Digite o código de convite (fornecido por outro usuário)
5. Complete seu perfil

### 2. Convidando Usuários
1. Vá em Configurações
2. Toque em "Gerar Código de Convite"
3. Compartilhe o código com quem deseja convidar

### 3. Enviando Mensagens
1. Selecione uma conversa
2. Digite sua mensagem
3. A mensagem será criptografada e enviada
4. Após 5 segundos de ser aberta, será destruída

## 🔒 Segurança

### Criptografia
- **Chaves E2E**: Geradas localmente em cada dispositivo
- **Algoritmo**: AES-256 para mensagens, SHA-256 para hashes
- **Armazenamento**: Chaves no Keychain (iOS) / Keystore (Android)

### Privacidade
- **Sem Histórico**: Mensagens não são armazenadas permanentemente
- **TTL**: Auto-destruição automática via Redis
- **Logs Mínimos**: Apenas logs de segurança essenciais
- **Dados Locais**: Criptografados no dispositivo

### Rede
- **HTTPS**: Todas as comunicações criptografadas
- **WebSocket**: Conexão segura para mensagens em tempo real
- **Rate Limiting**: Proteção contra ataques de força bruta

## 🛠️ Desenvolvimento

### Estrutura do Projeto

```
vo1d/
├── src/                    # Código React Native
│   ├── screens/           # Telas do aplicativo
│   ├── services/          # Serviços (Auth, Messaging, Encryption)
│   └── components/        # Componentes reutilizáveis
├── server/                # Backend Node.js
│   ├── scripts/           # Scripts de banco de dados
│   ├── schema.sql         # Schema do PostgreSQL
│   └── index.js          # Servidor principal
├── docker-compose.yml     # Configuração Docker
└── README.md             # Este arquivo
```

### Scripts Disponíveis

#### Backend
```bash
npm start          # Iniciar servidor
npm run dev        # Modo desenvolvimento
npm run setup-db   # Configurar banco de dados
npm test           # Executar testes
```

#### Frontend
```bash
npm start          # Metro bundler
npm run android    # Executar no Android
npm run ios        # Executar no iOS
npm run build      # Build de produção
```

## 🧪 Testes

```bash
# Testes do backend
cd server && npm test

# Testes do frontend
npm test
```

## 📊 Monitoramento

### Health Checks
- **Backend**: `GET /health`
- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`

### Logs
- **Desenvolvimento**: Console logs
- **Produção**: Arquivos de log estruturados
- **Segurança**: Logs de auditoria no banco

## 🚀 Deploy

### Produção
1. Configure variáveis de ambiente de produção
2. Use HTTPS com certificados SSL válidos
3. Configure backup do PostgreSQL
4. Monitore logs e métricas
5. Configure rate limiting adequado

### Docker
```bash
# Build da imagem
docker build -t vo1d-server ./server

# Executar container
docker run -p 3000:3000 --env-file .env vo1d-server
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

- **Issues**: Use o GitHub Issues
- **Documentação**: Consulte este README
- **Segurança**: Reporte vulnerabilidades em privado

## 🔮 Roadmap

- [ ] Suporte a mídia (imagens, áudio)
- [ ] Mensagens de grupo
- [ ] Notificações push
- [ ] Modo escuro/claro
- [ ] Backup de chaves (opcional)
- [ ] Integração com outros apps de mensagem

---

**vo1d** - Mensagens que desaparecem, privacidade que permanece. 🔐✨

