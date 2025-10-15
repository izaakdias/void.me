# 🚀 Guia de Deploy para VPS - vo1d

## 📋 **Opções de Deploy**

### **Opção 1: Via SSH (Recomendado)**

#### **1.1 Preparar Arquivos**
```bash
# No seu computador local
cd /home/izaak-dias/Downloads/vo1d-expo-new

# Editar o script de deploy
nano deploy-to-vps.sh
```

#### **1.2 Configurar Credenciais**
Edite o arquivo `deploy-to-vps.sh` com suas credenciais:
```bash
VPS_HOST="147.93.66.253"
VPS_USER="seu_usuario_ssh"
VPS_PATH="/caminho/do/projeto/na/vps"
```

#### **1.3 Executar Deploy**
```bash
# Fazer deploy
./deploy-to-vps.sh

# Verificar se funcionou
./verify-deploy.sh
```

### **Opção 2: Via Painel da Hostinger**

#### **2.1 Acessar File Manager**
1. Acesse o painel da Hostinger
2. Vá em "File Manager"
3. Navegue até o diretório do projeto

#### **2.2 Upload dos Arquivos**
Faça upload destes arquivos:
- `server/index.js` (código atualizado)
- `landing/monitor.html` (novo dashboard)
- `landing/dashboard.html` (dashboard atualizado)

#### **2.3 Configurar Variáveis**
Crie/edite o arquivo `.env` na VPS:
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-production-secret
DATABASE_URL=postgresql://usuario:senha@localhost:5432/vo1d
REDIS_URL=redis://localhost:6379
ADMIN_USERNAME=admin
ADMIN_PASSWORD=!@#$%I02rd182
```

#### **2.4 Reiniciar Serviço**
```bash
# Via terminal SSH ou painel
pm2 restart vo1d
# ou
systemctl restart vo1d
```

### **Opção 3: Via Git (Se configurado)**

#### **3.1 Push para Repositório**
```bash
git add .
git commit -m "Add monitoring system"
git push origin main
```

#### **3.2 Pull na VPS**
```bash
# Na VPS
git pull origin main
npm install
pm2 restart vo1d
```

## 🔧 **Arquivos Principais para Deploy**

### **Código do Servidor:**
- ✅ `server/index.js` (com endpoints de monitoramento)
- ✅ `server/package.json` (dependências)

### **Dashboards:**
- ✅ `landing/monitor.html` (monitor em tempo real)
- ✅ `landing/dashboard.html` (dashboard atualizado)

### **Configurações:**
- ✅ `deploy-config.env` (variáveis de ambiente)

## 📊 **Verificação Pós-Deploy**

### **URLs para Testar:**
```bash
# Health check
curl http://147.93.66.253:3000/health

# Login
curl -X POST http://147.93.66.253:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"!@#$%I02rd182"}'

# Monitoramento
curl http://147.93.66.253:3000/api/monitor \
  -H "Authorization: Bearer SEU_TOKEN"
```

### **Dashboards:**
- **Principal:** http://147.93.66.253:3000/dashboard.html
- **Monitor:** http://147.93.66.253:3000/monitor.html

## 🛠️ **Comandos Úteis na VPS**

### **Gerenciar Processo:**
```bash
# Ver processos
pm2 list

# Reiniciar
pm2 restart vo1d

# Ver logs
pm2 logs vo1d

# Parar
pm2 stop vo1d
```

### **Verificar Status:**
```bash
# Status do serviço
systemctl status vo1d

# Portas em uso
netstat -tlnp | grep 3000

# Logs do sistema
journalctl -u vo1d -f
```

## ⚠️ **Problemas Comuns**

### **1. Porta 3000 em uso:**
```bash
# Verificar processo
lsof -i :3000

# Matar processo
kill -9 PID_DO_PROCESSO
```

### **2. Dependências não instaladas:**
```bash
cd /caminho/do/projeto
npm install
```

### **3. Permissões:**
```bash
chmod +x server/index.js
chown -R usuario:usuario /caminho/do/projeto
```

## 🎯 **Checklist de Deploy**

- [ ] Arquivos atualizados na VPS
- [ ] Variáveis de ambiente configuradas
- [ ] Dependências instaladas
- [ ] Serviço reiniciado
- [ ] Health check funcionando
- [ ] Login funcionando
- [ ] Monitoramento funcionando
- [ ] Dashboards acessíveis

---

**🚀 Após o deploy, você terá:**
- ✅ Monitoramento em tempo real
- ✅ Contadores de mensagens
- ✅ Logs detalhados
- ✅ Métricas de performance
- ✅ Dashboard profissional





