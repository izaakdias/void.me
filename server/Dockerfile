# Dockerfile para o servidor vo1d
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    curl \
    postgresql-client \
    redis-tools

# Criar diretório da aplicação
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código da aplicação
COPY . .

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S vo1d -u 1001

# Alterar propriedade dos arquivos
RUN chown -R vo1d:nodejs /app
USER vo1d

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Comando para iniciar a aplicação
CMD ["node", "index.js"]


