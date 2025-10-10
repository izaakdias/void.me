# 🔍 DEBUG - MONITORAMENTO DE LOGS

## 📱 **COMO MONITORAR OS LOGS:**

### **1. No Expo Dev Tools:**
- Abra o terminal onde rodou `npx expo start --android`
- Os logs aparecerão automaticamente

### **2. No Metro Bundler:**
- Pressione `r` para reload
- Pressione `d` para abrir dev menu
- Selecione "Debug Remote JS"

### **3. No Chrome DevTools:**
- Abra Chrome
- Vá para `chrome://inspect`
- Clique em "inspect" no seu dispositivo

## 🚀 **TESTE AGORA:**

1. **Abra o app** no Android
2. **Digite código:** `ABC123`
3. **Digite seu número:** `+5511999999999`
4. **Clique Send**
5. **Monitore os logs** no terminal

## 📋 **LOGS ESPERADOS:**

```
🚀 handleSendOTP iniciado
📱 Phone number: 999999999
🌍 Selected country: {code: "BR", dialCode: "+55", ...}
✅ Validação passou
📦 Importando AuthService...
✅ AuthService importado
📞 Número completo: +5511999999999
🔥 Chamando Firebase sendOTP...
🔥 AuthService.sendOTP iniciado
📞 Phone number recebido: +5511999999999
✅ Número de telefone válido
📦 Importando FirebaseAuthService...
✅ FirebaseAuthService importado
🚀 Chamando FirebaseAuthService.sendOTP...
🔥 FirebaseAuthService.sendOTP iniciado
📞 Phone number: +5511999999999
🔧 Configurando reCAPTCHA...
🔧 FirebaseAuthService.setupRecaptcha iniciado
🆕 Criando novo reCAPTCHA verifier...
✅ reCAPTCHA verifier criado
✅ reCAPTCHA configurado
📱 Chamando signInWithPhoneNumber...
✅ reCAPTCHA resolvido: [response]
✅ signInWithPhoneNumber sucesso
🆔 Verification ID: [verification-id]
📨 Resultado do Firebase: {success: true, verificationId: "...", message: "..."}
📨 Resultado do sendOTP: {success: true, verificationId: "...", message: "..."}
✅ OTP enviado com sucesso
🧭 Navegando para OTPVerification...
🏁 Finalizando handleSendOTP
```

## 🚨 **SE DER ERRO:**

**Me mande o log completo** que aparece no terminal!

**Possíveis erros:**
- `reCAPTCHA not found` → Container não encontrado
- `Phone auth not enabled` → Não habilitado no Firebase
- `Invalid phone number` → Formato incorreto
- `Network error` → Problema de conexão

---

**🔥 TESTE AGORA E ME MANDE OS LOGS!**

