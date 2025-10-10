#!/bin/bash

# 🧪 Script de Teste - Sistema Twilio vo1d
# Testa o envio e verificação de OTP

echo "🧪 TESTANDO SISTEMA TWILIO vo1d"
echo "================================"

# Verificar se o servidor está rodando
echo "🔍 Verificando se o servidor está rodando..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Servidor está rodando!"
else
    echo "❌ Servidor não está rodando. Inicie com: cd server && npm start"
    exit 1
fi

echo ""
echo "📱 TESTE 1: Enviar OTP"
echo "----------------------"

# Testar envio de OTP
PHONE="5521998991886"
echo "📞 Enviando OTP para: $PHONE"

RESPONSE=$(curl -s -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"$PHONE\"}")

echo "📨 Resposta do servidor:"
echo "$RESPONSE" | jq '.'

# Extrair sessionId da resposta
SESSION_ID=$(echo "$RESPONSE" | jq -r '.sessionId // empty')

if [ -z "$SESSION_ID" ]; then
    echo "❌ Erro: Não foi possível obter sessionId"
    exit 1
fi

echo ""
echo "🔢 TESTE 2: Verificar OTP"
echo "-------------------------"

# Testar verificação de OTP (usar código fixo 123456 para desenvolvimento)
OTP_CODE="123456"
echo "🔐 Verificando OTP: $OTP_CODE"
echo "🆔 Session ID: $SESSION_ID"

VERIFY_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{
    \"phoneNumber\": \"$PHONE\",
    \"otpCode\": \"$OTP_CODE\",
    \"sessionId\": \"$SESSION_ID\"
  }")

echo "📨 Resposta da verificação:"
echo "$VERIFY_RESPONSE" | jq '.'

# Verificar se a autenticação foi bem-sucedida
SUCCESS=$(echo "$VERIFY_RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
    echo ""
    echo "🎉 TESTE CONCLUÍDO COM SUCESSO!"
    echo "✅ OTP enviado e verificado corretamente"
    echo "🔑 Token JWT gerado"
else
    echo ""
    echo "❌ TESTE FALHOU!"
    echo "💥 Erro na verificação do OTP"
fi

echo ""
echo "📋 RESUMO:"
echo "- Modo de desenvolvimento ativo"
echo "- Use sempre o código 123456 para testar"
echo "- Sistema funciona sem credenciais Twilio reais"
echo "- Para produção, configure credenciais Twilio reais"
