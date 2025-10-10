# Landing Page Deploy Guide

## 🚀 Deploy Options

### 1. Netlify (Recomendado - Mais fácil)

1. **Criar conta no Netlify:**
   - Acesse: https://netlify.com
   - Faça login com GitHub

2. **Deploy via Drag & Drop:**
   - Arraste a pasta `landing/` para o Netlify
   - Ou conecte com GitHub para deploy automático

3. **Configurar domínio personalizado:**
   - Site Settings > Domain Management
   - Adicionar domínio personalizado

### 2. Vercel (Alternativa)

1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd landing/
   vercel --prod
   ```

### 3. GitHub Pages

1. **Criar repositório público**
2. **Upload dos arquivos**
3. **Ativar GitHub Pages nas configurações**

## 📊 Métricas e Analytics

### Google Analytics 4 (Já configurado)

**Como ver as métricas:**

1. **Acesse:** https://analytics.google.com
2. **Selecione sua propriedade**
3. **Relatórios disponíveis:**
   - **Tempo Real:** Usuários online agora
   - **Audience:** Demografia, localização, dispositivos
   - **Acquisition:** Como chegaram ao site
   - **Behavior:** Páginas mais visitadas, tempo no site
   - **Conversions:** Cadastros na waitlist

### Métricas específicas da waitlist:

- **Cadastros por dia/semana**
- **Taxa de conversão** (visitantes → cadastros)
- **Origem do tráfego** (Google, redes sociais, etc.)
- **Dispositivos** (mobile vs desktop)
- **Localização geográfica**

## 🔧 Configurações Necessárias

### 1. Backend URL
Atualize no `script.js`:
```javascript
const backendUrl = 'https://seu-backend-url.com';
```

### 2. Google Analytics
Atualize no `index.html`:
```html
<!-- Substitua GA_MEASUREMENT_ID pelo seu ID -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

### 3. Domínio personalizado
Configure DNS apontando para o Netlify/Vercel.

## 📈 Dashboard de Waitlist

Acesse: `https://seu-dominio.com/dashboard.html`

**Funcionalidades:**
- Ver cadastros da waitlist
- Enviar convites via SMS
- Estatísticas básicas
- Gerenciar usuários

## 🎯 Próximos Passos

1. **Deploy da landing page**
2. **Configurar backend em produção**
3. **Testar integração waitlist**
4. **Configurar domínio personalizado**
5. **Monitorar métricas**

## 📱 Teste Mobile

Após o deploy, teste em:
- Desktop
- Mobile (Android/iOS)
- Diferentes navegadores
- Velocidade de carregamento
