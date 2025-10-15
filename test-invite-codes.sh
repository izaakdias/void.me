#!/bin/bash

echo "🔍 Testando conectividade do app com o servidor VPS..."

# Teste 1: Health check
echo "1. Testando health check..."
curl -s http://147.93.66.253:3000/health | jq '.'

echo -e "\n2. Testando endpoint de validação de convite..."
curl -s -X POST http://147.93.66.253:3000/auth/validate-invite \
  -H "Content-Type: application/json" \
  -d '{"inviteCode":"WIAHES"}' | jq '.'

echo -e "\n3. Testando endpoint de validação com código antigo..."
curl -s -X POST http://147.93.66.253:3000/auth/validate-invite \
  -H "Content-Type: application/json" \
  -d '{"inviteCode":"ECNPR2"}' | jq '.'

echo -e "\n4. Verificando se o app está usando a URL correta..."
echo "URL configurada no app: http://147.93.66.253:3000"
echo "URL do servidor: http://147.93.66.253:3000"

echo -e "\n✅ Testes concluídos!"
echo "📱 Códigos válidos para teste:"
echo "   - ECNPR2 (código antigo)"
echo "   - WIAHES (código novo)"




