#!/bin/bash

echo "🧪 Testando funcionalidades do vo1d..."

# Verificar se estamos no diretório correto
if [ ! -f "server/index.js" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o servidor está rodando
echo "🔍 Verificando se o servidor está rodando..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Servidor está rodando"
else
    echo "❌ Servidor não está rodando. Inicie com: cd server && npm start"
    exit 1
fi

# Testar endpoints básicos
echo "🔍 Testando endpoints..."

# Testar health check
echo "📊 Health check:"
curl -s http://localhost:3000/health | jq '.' || echo "❌ Health check falhou"

# Testar métricas (sem auth por enquanto)
echo "📈 Métricas do sistema:"
curl -s http://localhost:3000/api/metrics | jq '.' || echo "❌ Métricas falharam"

# Verificar banco de dados
echo "🗄️ Verificando banco de dados..."
cd server
if [ -f "data/vo1d.db" ]; then
    echo "✅ Banco SQLite encontrado"
    
    # Verificar contadores
    echo "📊 Contadores atuais:"
    sqlite3 data/vo1d.db << EOF
SELECT 'Usuários:', COUNT(*) FROM users;
SELECT 'Mensagens:', COUNT(*) FROM messages;
SELECT 'Conversas:', COUNT(*) FROM conversations;
SELECT 'Convites:', COUNT(*) FROM invite_codes;
SELECT 'Waitlist:', COUNT(*) FROM waitlist;
EOF
else
    echo "❌ Banco SQLite não encontrado"
fi

cd ..

echo ""
echo "🎯 Próximos passos para teste:"
echo "1. Acesse o dashboard: http://localhost:3000/dashboard.html"
echo "2. Teste o registro de usuários"
echo "3. Teste o envio de mensagens"
echo "4. Verifique os contadores no dashboard"
echo ""
echo "✅ Teste concluído!"





