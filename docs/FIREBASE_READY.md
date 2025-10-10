# 🔥 FIREBASE AUTH - CONFIGURAÇÃO COMPLETA

## ✅ **O QUE JÁ ESTÁ PRONTO:**

1. **Frontend configurado** com suas credenciais Firebase
2. **Backend funcionando** na porta 3000
3. **Integração completa** entre Firebase e AuthService
4. **Telas atualizadas** para usar Firebase Auth

## 🚨 **O QUE VOCÊ PRECISA FAZER AGORA:**

### **1. 🔐 Habilitar Phone Authentication no Firebase:**

1. Acesse: https://console.firebase.google.com/
2. Selecione seu projeto: **void-project-6e18f**
3. No menu lateral: **Authentication**
4. Clique **"Get started"**
5. Aba **"Sign-in method"**
6. Clique em **"Phone"**
7. **Habilitar** e **Salvar**

### **2. 🔑 Baixar Service Account (Backend):**

1. **Configurações do projeto** (ícone engrenagem)
2. Aba **"Service accounts"**
3. Clique **"Generate new private key"**
4. Baixe o arquivo JSON
5. Copie o conteúdo para `server/config/firebase.js`

### **3. 🗄️ Configurar Banco de Dados:**

```bash
cd server
npm run setup-db
```

### **4. 🚀 Testar:**

```bash
# Terminal 1 - Backend
cd server && npm start

# Terminal 2 - Frontend
npx expo start --android
```

## 📱 **COMO TESTAR:**

1. **Abra o app** no Android
2. **Digite um código de convite** (ex: ABC123)
3. **Digite seu número** com código do país
4. **Clique Send** → Firebase enviará SMS
5. **Digite o código** recebido
6. **Sucesso!** → Vai para tela principal

## 🔧 **CONFIGURAÇÕES ATUAIS:**

- **Projeto Firebase:** void-project-6e18f
- **Backend:** http://localhost:3000
- **Frontend:** Expo React Native
- **Banco:** SQLite (local)
- **Cache:** Redis (local)

## 🆘 **PROBLEMAS COMUNS:**

1. **"Phone auth not enabled"** → Habilite no Firebase Console
2. **"Service account error"** → Baixe e configure o JSON
3. **"Database error"** → Execute `npm run setup-db`
4. **"Network error"** → Verifique se backend está rodando

## 🎯 **PRÓXIMOS PASSOS:**

Depois que funcionar:
1. **Redis** para mensagens efêmeras
2. **OneSignal** para notificações push
3. **Testes** de integração completos

---

**🔥 ESTÁ PRONTO PARA TESTAR!**

