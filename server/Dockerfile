FROM node:18-alpine

WORKDIR /app

# Copiar package.json do server
COPY server/package*.json ./

# Instalar dependências
RUN npm install

# Copiar código do server
COPY server/ .

# Expor porta
EXPOSE 3000

# Comando para iniciar
CMD ["node", "index.js"]