# Configuração OneSignal para vo1d

## 🔔 **VANTAGENS DO ONESIGNAL:**

### ✅ **Gratuito até 30k usuários**
- Sem custos para começar
- Escalável conforme crescimento

### ✅ **Fácil integração**
- SDK nativo para React Native
- Configuração simples
- Documentação excelente

### ✅ **Recursos avançados**
- Segmentação de usuários
- A/B testing
- Analytics detalhados
- Suporte a múltiplas plataformas

### ✅ **Perfeito para vo1d**
- Notificações efêmeras
- Mensagens em tempo real
- Integração com WebSocket
- Suporte a tags personalizadas

## 🚀 **CONFIGURAÇÃO:**

### 1. **Criar conta OneSignal**
```bash
# Acesse: https://onesignal.com
# Crie uma conta gratuita
# Crie um novo app: "vo1d"
```

### 2. **Obter App ID**
```bash
# No dashboard OneSignal:
# Settings > Keys & IDs
# Copie o "OneSignal App ID"
```

### 3. **Configurar no app**
```javascript
// Em src/App.js, substitua:
OneSignalNotificationService.initialize('YOUR_ONESIGNAL_APP_ID');

// Por:
OneSignalNotificationService.initialize('12345678-1234-1234-1234-123456789012');
```

### 4. **Configurar Android**
```xml
<!-- Em android/app/src/main/AndroidManifest.xml -->
<application>
    <meta-data android:name="onesignal_app_id" 
               android:value="YOUR_ONESIGNAL_APP_ID" />
</application>
```

### 5. **Configurar iOS**
```xml
<!-- Em ios/vo1d/Info.plist -->
<key>OneSignal_AppID</key>
<string>YOUR_ONESIGNAL_APP_ID</string>
```

## 📱 **FUNCIONALIDADES IMPLEMENTADAS:**

### ✅ **Notificações de mensagens efêmeras**
- Notificação quando nova mensagem chega
- Destruição automática em 5 segundos
- Sem conteúdo na notificação (segurança)

### ✅ **Notificações de convites**
- Notificação quando recebe convite
- Código de convite na notificação
- Link direto para aceitar convite

### ✅ **Notificações de OTP**
- Código de verificação via push
- Backup para SMS
- Validação automática

### ✅ **Segmentação de usuários**
- Tags por tipo de mensagem
- Tags por plataforma
- Tags por versão do app

## 🔧 **COMANDOS ÚTEIS:**

### **Testar notificações**
```bash
# Enviar notificação de teste
curl -X POST "https://onesignal.com/api/v1/notifications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YOUR_REST_API_KEY" \
  -d '{
    "app_id": "YOUR_ONESIGNAL_APP_ID",
    "included_segments": ["All"],
    "headings": {"en": "Teste vo1d"},
    "contents": {"en": "Notificação de teste funcionando!"}
  }'
```

### **Verificar estatísticas**
```bash
# No dashboard OneSignal:
# Analytics > Overview
# Ver métricas de entrega, abertura, etc.
```

## 🎯 **PRÓXIMOS PASSOS:**

1. **Configurar OneSignal:**
   - Criar conta em onesignal.com
   - Obter App ID
   - Configurar no app

2. **Testar notificações:**
   - Enviar mensagem efêmera
   - Verificar notificação push
   - Testar em dispositivos reais

3. **Otimizar:**
   - Configurar segmentação
   - A/B testing de mensagens
   - Analytics detalhados

## 🔐 **SEGURANÇA:**

### ✅ **Dados protegidos**
- OneSignal não vê conteúdo das mensagens
- Apenas notificações de evento
- Criptografia E2E mantida

### ✅ **Privacidade**
- Sem tracking de conteúdo
- Apenas metadados necessários
- Conformidade com LGPD/GDPR

---

**OneSignal é a escolha perfeita para vo1d!** 🎉

Mais simples que Firebase, mais barato, e com todos os recursos necessários para mensagens efêmeras.

