# 🚂 Railway Deploy Guide

## 📋 Pré-requisitos

1. **Conta no Railway**: https://railway.app
2. **Conta no Twilio**: https://twilio.com
3. **GitHub Repository**: Código deve estar no GitHub

## 🚀 Passo a Passo

### 1. CONFIGURAR TWILIO

1. Acesse: https://console.twilio.com
2. Copie:
   - **Account SID**
   - **Auth Token**
   - **Phone Number** (verificado)

### 2. DEPLOY NO RAILWAY

1. **Acesse Railway**: https://railway.app
2. **Login com GitHub**
3. **New Project** → **Deploy from GitHub repo**
4. **Selecione seu repositório**
5. **Configure Root Directory**: `server`

### 3. CONFIGURAR SERVIÇOS

#### PostgreSQL Database:
1. **Add Service** → **Database** → **PostgreSQL**
2. Railway criará automaticamente a variável `DATABASE_URL`

#### Redis Cache:
1. **Add Service** → **Database** → **Redis**
2. Railway criará automaticamente a variável `REDIS_URL`

### 4. CONFIGURAR VARIÁVEIS DE AMBIENTE

No Railway Dashboard → **Variables**:

```env
NODE_ENV=production
PORT=3000
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
JWT_SECRET=your_super_secret_jwt_key_here
CORS_ORIGIN=https://vo1d.me
```

### 5. CONFIGURAR BUILD

Railway detectará automaticamente:
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 6. DEPLOY

1. **Deploy** será automático após push no GitHub
2. **Aguarde** o build completar
3. **Teste** o endpoint: `https://your-app.railway.app/health`

## 🔧 CONFIGURAÇÕES ADICIONAIS

### Custom Domain (Opcional):
1. **Settings** → **Domains**
2. **Add Domain**: `api.vo1d.me`
3. **Configure DNS** na Hostinger:
   ```
   Tipo: CNAME
   Nome: api
   Valor: your-app.railway.app
   ```

### Environment Variables:
```env
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Security
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=production

# CORS
CORS_ORIGIN=https://vo1d.me
```

## 🧪 TESTE APÓS DEPLOY

### 1. Health Check:
```bash
curl https://your-app.railway.app/health
```

### 2. Waitlist Test:
```bash
curl -X POST https://your-app.railway.app/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

### 3. Update Landing Page:
Atualize o `backendUrl` em `landing/script.js`:
```javascript
const backendUrl = 'https://your-app.railway.app';
```

## 💰 CUSTOS

- **Railway**: $5/mês (Hobby plan)
- **Twilio**: ~$0.0075 por SMS
- **Total estimado**: $5-10/mês

## 🆘 TROUBLESHOOTING

### Build Failed:
- Verifique se `package.json` está correto
- Confirme se todas as dependências estão listadas

### Database Connection Error:
- Verifique se PostgreSQL service está rodando
- Confirme se `DATABASE_URL` está configurada

### Twilio Errors:
- Verifique se Account SID e Auth Token estão corretos
- Confirme se o número de telefone está verificado

## 📞 SUPORTE

- **Railway Docs**: https://docs.railway.app
- **Twilio Docs**: https://www.twilio.com/docs
- **Discord Railway**: https://discord.gg/railway
