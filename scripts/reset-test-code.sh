#!/bin/bash

echo "🔄 Resetando dados de teste do vo1d..."

# Ir para o diretório do servidor
cd /home/izaak-dias/Downloads/vo1d-expo-new/server/scripts

# Executar o script de reset
node reset-test-data.js

echo ""
echo "✅ Reset concluído!"
echo "🚀 Agora você pode testar com o novo código gerado!"
