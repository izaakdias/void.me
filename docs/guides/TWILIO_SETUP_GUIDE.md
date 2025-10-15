# 🔧 CONFIGURAÇÃO TWILIO - vo1d

## 📋 **Passo a Passo para Configurar Twilio:**

### **1. Criar Conta Twilio**
1. Acesse: https://www.twilio.com
2. Crie uma conta gratuita
3. Confirme seu número de telefone

### **2. Obter Credenciais**
1. Vá para: Console → Account Info
2. Copie:
   - **Account SID** (começa com AC...)
   - **Auth Token** (string longa)

### **3. Comprar Número de Telefone**
1. Vá para: Phone Numbers → Manage → Buy a number
2. Escolha um número (recomendado: +1 para EUA/Canadá)
3. Compre o número (custa ~$1/mês)

### **4. Configurar Variáveis de Ambiente**
Edite o arquivo `server/config.env`:

```bash
# Substitua pelos valores reais:
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### **5. Testar Configuração**
```bash
cd server
npm start
```

## 🚨 **IMPORTANTE:**
- **NUNCA** commite credenciais reais no Git
- Use `.env` local ou variáveis de ambiente do servidor
- Para desenvolvimento, você pode usar o modo de teste

## 💡 **Modo de Desenvolvimento (Alternativa)**
Se não quiser configurar Twilio agora, posso implementar um modo de desenvolvimento que simula o envio de SMS.
