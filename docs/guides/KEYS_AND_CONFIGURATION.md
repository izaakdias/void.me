# 🔑 CONFIGURAÇÕES E CHAVES NECESSÁRIAS - vo1d

## 🚨 **OBRIGATÓRIO - Para funcionamento:**

### **1. OneSignal (Notificações Push)**
```bash
# Arquivo: onesignal-config.json
{
  "app_id": "YOUR_ONESIGNAL_APP_ID",           # ⚠️ OBRIGATÓRIO
  "rest_api_key": "YOUR_REST_API_KEY",         # ⚠️ OBRIGATÓRIO
  "project_name": "vo1d"
}

# Configurar em: src/App.js
OneSignalNotificationService.initialize('YOUR_ONESIGNAL_APP_ID');
```

**Como obter:**
1. Acesse: https://onesignal.com
2. Crie uma conta gratuita
3. Crie um novo app: "vo1d"
4. Vá em Settings > Keys & IDs
5. Copie o "OneSignal App ID"

### **2. Twilio (SMS OTP)**
```bash
# Arquivo: server/.env.twilio
TWILIO_ACCOUNT_SID=your_account_sid_here      # ⚠️ OBRIGATÓRIO
TWILIO_AUTH_TOKEN=your_auth_token_here        # ⚠️ OBRIGATÓRIO
TWILIO_PHONE_NUMBER=your_phone_number_here    # ⚠️ OBRIGATÓRIO
```

**Como obter:**
1. Acesse: https://twilio.com
2. Crie uma conta gratuita
3. Vá em Console > Account Info
4. Copie Account SID e Auth Token
5. Compre um número de telefone

### **3. JWT Secret (Segurança)**
```bash
# Arquivo: server/config.env
JWT_SECRET=your_jwt_secret_key                # ⚠️ OBRIGATÓRIO
```

**Como gerar:**
```bash
openssl rand -base64 32
```

## ⚠️ **IMPORTANTE - Para produção:**

### **4. Certificados iOS**
- Apple Developer Account ($99/ano)
- Certificado de desenvolvimento
- Certificado de produção
- Provisioning Profile
- Configurar em Xcode

### **5. Certificados Android**
- Keystore para assinatura
- Chave de assinatura
- Configurar em `android/app/build.gradle`
- Upload para Google Play

### **6. Servidor de Produção**
- Servidor configurado
- SSL/HTTPS configurado
- Domínio configurado
- Backup configurado
- Monitoramento configurado

## 🔧 **CONFIGURAÇÃO AUTOMÁTICA:**

### **Script de Configuração**
```bash
# Configurar todas as chaves automaticamente
./configure-keys.sh
```

### **Configuração Completa**
```bash
# Configuração completa do sistema
./setup-complete.sh
```

### **Testes**
```bash
# Testar sistema completo
./test-system.sh

# Testar OneSignal
./test-onesignal.sh
```

## 📱 **ARQUIVOS DE CONFIGURAÇÃO:**

### **Cliente (React Native)**
- `config.env` - Configurações do cliente
- `onesignal-config.json` - OneSignal
- `src/App.js` - App ID do OneSignal

### **Servidor (Node.js)**
- `server/config.env` - Configurações do servidor
- `server/.env.twilio` - Twilio
- `server/data/vo1d.db` - Banco SQLite

### **Android**
- `android/app/build.gradle` - Configuração Android
- `android/app/src/main/AndroidManifest.xml` - Permissões

### **iOS**
- `ios/vo1d/Info.plist` - Configuração iOS
- `ios/Podfile` - Dependências iOS

## 🔐 **SEGURANÇA:**

### **Arquivos Protegidos (.gitignore)**
```bash
# API Keys e Secrets
onesignal-config.json
server/.env.twilio
server/config.env
.env.*
*.env

# Certificados
*.pem
*.key
*.crt
*.p12
*.mobileprovision
keystore.properties
android/app/keystore.jks

# Banco de dados
server/data/
*.db
*.sqlite
*.sqlite3
```

### **Boas Práticas**
- ✅ Não commitar arquivos .env
- ✅ Usar variáveis de ambiente
- ✅ Rotacionar chaves regularmente
- ✅ Monitorar acesso
- ✅ Backup das chaves

## 🧪 **TESTES:**

### **Testes Básicos**
```bash
# App abre sem erros
npm run android

# Autenticação funciona
# Mensagens são enviadas
# Notificações chegam
# Criptografia funciona
```

### **Testes em Dispositivos**
- Android físico
- iOS físico
- Diferentes versões
- Diferentes tamanhos de tela

### **Testes de Rede**
- WiFi
- 4G/5G
- Sem conexão
- Conexão lenta

## 🎯 **STATUS ATUAL:**

- ✅ **Desenvolvimento**: 100% configurado
- ⚠️ **Produção**: Precisa de certificados
- ⚠️ **Notificações**: Precisa de OneSignal
- ⚠️ **SMS**: Precisa de Twilio
- ✅ **Banco**: SQLite funcionando
- ✅ **Redis**: Funcionando
- ✅ **Criptografia**: Implementada
- ✅ **Interface**: Completa

## 🏆 **PRÓXIMOS PASSOS:**

1. **Execute**: `./configure-keys.sh`
2. **Configure**: OneSignal e Twilio
3. **Teste**: Em dispositivos reais
4. **Prepare**: Para produção
5. **Deploy**: Nas stores

## 💰 **CUSTOS:**

### **Gratuito:**
- OneSignal (até 30k usuários)
- Twilio (créditos gratuitos)
- SQLite (desenvolvimento)
- Redis (desenvolvimento)

### **Pago:**
- Apple Developer Account ($99/ano)
- Google Play Developer ($25 uma vez)
- Servidor de produção ($5-50/mês)
- Twilio SMS ($0.0075/SMS)

## 🚀 **COMANDOS ÚTEIS:**

### **Desenvolvimento**
```bash
# Instalar dependências
npm install
cd server && npm install

# Iniciar servidor
cd server && npm run dev

# Iniciar app
npm run android
npm run ios
```

### **Produção**
```bash
# Build Android
cd android && ./gradlew assembleRelease

# Build iOS
cd ios && xcodebuild -workspace vo1d.xcworkspace -scheme vo1d -configuration Release

# Deploy
docker-compose up -d
```

---

**vo1d está 95% pronto! Só falta configurar as chaves externas.** 🎉

**Execute `./configure-keys.sh` para configurar automaticamente!** 🚀

