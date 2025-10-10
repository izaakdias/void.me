#!/usr/bin/env node

const axios = require('axios');

// Configurações
const SERVER_URL = 'http://localhost:3000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInBob25lTnVtYmVyIjoiNTUxMTk5OTk5OTk5OSIsImlhdCI6MTc2MDA0NTM0MCwiZXhwIjoxNzYwNjUwMTQwfQ.ziAavj07Ya_wQCxRYjM46VncjlO2EwkbhztECfPpiHI';

// Função para enviar push para todos os usuários
async function sendPushToAll(title, body, data = {}) {
  try {
    console.log('📱 Enviando push para todos os usuários...');
    
    const response = await axios.post(`${SERVER_URL}/api/send-push-to-all`, {
      title,
      body,
      data
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Função para enviar push para usuário específico
async function sendPushToUser(userId, title, body, data = {}) {
  try {
    console.log(`📱 Enviando push para usuário ${userId}...`);
    
    const response = await axios.post(`${SERVER_URL}/api/send-push-to-user`, {
      userId,
      title,
      body,
      data
    }, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resposta:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Função principal
async function main() {
  console.log('🚀 Teste de Push Notifications - vo1d');
  console.log('=====================================');
  
  // Exemplo 1: Enviar para todos os usuários
  console.log('\n📢 Teste 1: Enviar para todos os usuários');
  await sendPushToAll(
    '🎉 vo1d Update',
    'Nova versão do app disponível! Baixe agora.',
    { 
      type: 'system_announcement',
      action: 'update_available',
      version: '1.0.0'
    }
  );

  // Exemplo 2: Enviar para usuário específico
  console.log('\n👤 Teste 2: Enviar para usuário específico');
  await sendPushToUser(
    1, // ID do usuário
    '💬 Nova Mensagem',
    'Você recebeu uma nova mensagem efêmera!',
    { 
      type: 'ephemeral_message',
      senderId: 2,
      conversationId: 123
    }
  );

  // Exemplo 3: Notificação de convite aceito
  console.log('\n🎉 Teste 3: Convite aceito');
  await sendPushToAll(
    '🎊 Convite Aceito!',
    'Seu convite foi aceito! Comece a conversar agora.',
    { 
      type: 'invite_accepted',
      inviterName: 'João Silva',
      action: 'start_chat'
    }
  );

  console.log('\n✅ Testes concluídos!');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { sendPushToAll, sendPushToUser };
