# 🚀 Comandos para Upload Manual para VPS

## 📋 Passo a Passo:

### 1. Configure suas credenciais VPS:
```bash
# Substitua pelos seus dados reais:
VPS_HOST="seu-dominio.com"     # Ex: meusite.com.br
VPS_USER="seu-usuario"         # Ex: root, ubuntu, etc
VPS_PATH="/var/www/html"       # Caminho da sua landing page
```

### 2. Execute os comandos de upload:
```bash
# Upload do index.html atualizado (com o link "Download here")
scp landing/index.html $VPS_USER@$VPS_HOST:$VPS_PATH/

# Upload do styles.css atualizado
scp landing/styles.css $VPS_USER@$VPS_HOST:$VPS_PATH/
```

### 3. Exemplo prático:
```bash
# Se sua VPS for meusite.com.br com usuário root:
scp landing/index.html root@meusite.com.br:/var/www/html/
scp landing/styles.css root@meusite.com.br:/var/www/html/
```

### 4. Verificar se funcionou:
- Acesse seu site: https://seu-dominio.com
- Procure por "Download here" acima do "Follow us"
- Se não aparecer, limpe o cache (Ctrl+F5)

## 🔧 Alternativa: Script Automático

Se preferir, configure e execute:
```bash
# Edite o arquivo upload-to-vps.sh com suas credenciais
nano upload-to-vps.sh

# Execute o script
./upload-to-vps.sh
```

## ✅ O que foi alterado:

1. **index.html**: Adicionado link "Download here" acima do "Follow us"
2. **styles.css**: Mantido os estilos existentes (não precisou alterar)

O link "Download here" vai baixar diretamente o APK quando clicado!

