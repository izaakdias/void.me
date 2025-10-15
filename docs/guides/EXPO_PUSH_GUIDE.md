# 📱 Expo Push Notifications - Guia Completo

## 🎯 **Como Enviar Notificações Push para Todos os Usuários**

### **📋 Resumo:**
- ✅ **Expo Push API** integrada
- ✅ **Backend** configurado
- ✅ **Frontend** configurado
- ✅ **Banco de dados** para tokens
- ✅ **Endpoints** prontos

---

## 🚀 **Como Funciona:**

### **1. Registro Automático:**
```javascript
// Quando o usuário faz login, o token é salvo automaticamente
ExpoPushNotificationService.initialize();
// Token é enviado para: POST /api/save-push-token
```

### **2. Envio de Notificações:**
```javascript
// Para todos os usuários
POST /api/send-push-to-all
{
  "title": "Título da notificação",
  "body": "Corpo da mensagem",
  "data": { "custom": "data" }
}

// Para usuário específico
POST /api/send-push-to-user
{
  "userId": 123,
  "title": "Título",
  "body": "Corpo",
  "data": { "custom": "data" }
}
```

---

## 🛠️ **Como Usar:**

### **Opção 1: Via API (Recomendado)**
```bash
# Instalar axios
npm install axios

# Executar teste
node test-push-notifications.js
```

### **Opção 2: Via cURL**
```bash
# Enviar para todos
curl -X POST http://localhost:3000/api/send-push-to-all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🎉 vo1d Update",
    "body": "Nova versão disponível!",
    "data": {"type": "update"}
  }'
```

### **Opção 3: Via Frontend**
```javascript
// No seu app React Native
const sendPushToAll = async () => {
  const response = await fetch('http://localhost:3000/api/send-push-to-all', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Nova mensagem!',
      body: 'Você tem uma nova mensagem efêmera',
      data: { type: 'ephemeral_message' }
    })
  });
  
  const result = await response.json();
  console.log('Push enviado:', result);
};
```

---

## 📱 **Tipos de Notificação:**

### **1. Mensagens Efêmeras:**
```javascript
{
  "title": "vo1d",
  "body": "Nova mensagem efêmera de João",
  "data": {
    "type": "ephemeral_message",
    "senderId": 123,
    "senderName": "João"
  }
}
```

### **2. Anúncios do Sistema:**
```javascript
{
  "title": "🎉 vo1d Update",
  "body": "Nova versão disponível!",
  "data": {
    "type": "system_announcement",
    "action": "update_available"
  }
}
```

### **3. Convites Aceitos:**
```javascript
{
  "title": "🎊 Convite Aceito!",
  "body": "Seu convite foi aceito!",
  "data": {
    "type": "invite_accepted",
    "inviterName": "Maria"
  }
}
```

---

## 🔧 **Configuração:**

### **1. Backend (já configurado):**
- ✅ Expo SDK instalado
- ✅ Endpoints criados
- ✅ Banco de dados configurado
- ✅ Autenticação JWT

### **2. Frontend (já configurado):**
- ✅ Serviço criado
- ✅ Listeners configurados
- ✅ Token automático
- ✅ Integração com App.js

---

## 🧪 **Testando:**

### **1. Teste Básico:**
```bash
# 1. Fazer login no app
# 2. Verificar se token foi salvo no banco
# 3. Executar script de teste
node test-push-notifications.js
```

### **2. Verificar Logs:**
```bash
# No terminal do servidor, você verá:
✅ Push token salvo para usuário 1: ExponentPushToken[xxx]
📱 Enviando push para 5 dispositivos...
✅ Push enviado para 5 dispositivos
```

### **3. Verificar no App:**
- Notificação aparece na tela
- Som de notificação
- Dados customizados disponíveis

---

## 📊 **Monitoramento:**

### **1. Banco de Dados:**
```sql
-- Ver tokens salvos
SELECT * FROM push_tokens WHERE is_active = 1;

-- Contar usuários com push
SELECT COUNT(DISTINCT user_id) FROM push_tokens WHERE is_active = 1;
```

### **2. Logs do Servidor:**
```bash
# Ver logs em tempo real
tail -f server/logs/app.log
```

---

## 🚨 **Troubleshooting:**

### **Problema: Token não é salvo**
```bash
# Verificar se usuário está logado
# Verificar se token é válido
# Verificar logs do servidor
```

### **Problema: Push não chega**
```bash
# Verificar se dispositivo está físico (não emulador)
# Verificar permissões de notificação
# Verificar se token está ativo no banco
```

### **Problema: Erro 401**
```bash
# Verificar se JWT token é válido
# Verificar se usuário está autenticado
```

---

## 🎯 **Exemplos Práticos:**

### **1. Notificar Nova Versão:**
```javascript
await sendPushToAll(
  '🎉 Nova Versão!',
  'vo1d v2.0 disponível com novas funcionalidades!',
  { type: 'update', version: '2.0.0' }
);
```

### **2. Notificar Manutenção:**
```javascript
await sendPushToAll(
  '🔧 Manutenção Programada',
  'Sistema será atualizado em 30 minutos',
  { type: 'maintenance', time: '30min' }
);
```

### **3. Notificar Mensagem:**
```javascript
await sendPushToUser(
  userId,
  '💬 Nova Mensagem',
  `${senderName} enviou uma mensagem efêmera`,
  { type: 'message', senderId, conversationId }
);
```

---

## 🚀 **Para Produção:**

### **1. Configurar URL do Servidor:**
```javascript
// Alterar localhost para seu domínio
const SERVER_URL = 'https://seu-dominio.com';
```

### **2. Configurar HTTPS:**
```bash
# Obrigatório para produção
# Expo só funciona com HTTPS
```

### **3. Monitorar Quotas:**
```bash
# Expo tem limite de 1000 push/hora
# Monitorar uso no dashboard
```

---

**🎉 Pronto! Agora você pode enviar notificações push para todos os usuários do vo1d!**

**Para testar:**
1. Faça login no app
2. Execute: `node test-push-notifications.js`
3. Veja a notificação chegar! 📱
