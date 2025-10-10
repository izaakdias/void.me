const axios = require('axios');
const io = require('socket.io-client');

// Configurações
const BASE_URL = 'http://localhost:3000';
const TEST_PHONE = '11999999999';
const TEST_PHONE_2 = `1188888${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

class IntegrationTester {
  constructor() {
    this.results = [];
    this.authToken = null;
    this.userId = null;
    this.socket = null;
  }

  async log(test, status, message, data = null) {
    const result = {
      test,
      status,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${test}: ${message}`);
    if (data) console.log(`   Dados: ${JSON.stringify(data, null, 2)}`);
  }

  async testHealthCheck() {
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      if (response.data.status === 'OK') {
        await this.log('Health Check', 'PASS', 'Servidor respondendo corretamente', response.data);
        return true;
      } else {
        await this.log('Health Check', 'FAIL', 'Servidor não está OK', response.data);
        return false;
      }
    } catch (error) {
      await this.log('Health Check', 'FAIL', 'Erro ao conectar com servidor', error.message);
      return false;
    }
  }

  async testOTPSend() {
    try {
      const response = await axios.post(`${BASE_URL}/auth/send-otp`, {
        phoneNumber: TEST_PHONE
      });
      
      if (response.data.success) {
        await this.log('Envio OTP', 'PASS', 'OTP enviado com sucesso', response.data);
        return response.data.sessionId;
      } else {
        await this.log('Envio OTP', 'FAIL', 'Falha ao enviar OTP', response.data);
        return null;
      }
    } catch (error) {
      await this.log('Envio OTP', 'FAIL', 'Erro na requisição', error.message);
      return null;
    }
  }

  async testOTPVerify(sessionId) {
    try {
      // Em desenvolvimento, vamos usar um código fixo para teste
      const otpCode = '123456'; // Código fixo para desenvolvimento
      
      const verifyResponse = await axios.post(`${BASE_URL}/auth/verify-otp`, {
        phoneNumber: TEST_PHONE,
        otpCode: otpCode,
        sessionId: sessionId
      });
      
      if (verifyResponse.data.success) {
        this.authToken = verifyResponse.data.token;
        this.userId = verifyResponse.data.user.id;
        await this.log('Verificação OTP', 'PASS', 'OTP verificado com sucesso', verifyResponse.data);
        return true;
      } else {
        await this.log('Verificação OTP', 'FAIL', 'Falha na verificação', verifyResponse.data);
        return false;
      }
    } catch (error) {
      await this.log('Verificação OTP', 'FAIL', 'Erro na verificação', error.message);
      return false;
    }
  }

  async testInviteCodeGeneration() {
    try {
      const response = await axios.post(`${BASE_URL}/auth/generate-invite`, {}, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (response.data.success) {
        await this.log('Geração Convite', 'PASS', 'Código de convite gerado', response.data);
        return response.data.inviteCode;
      } else {
        await this.log('Geração Convite', 'FAIL', 'Falha ao gerar convite', response.data);
        return null;
      }
    } catch (error) {
      await this.log('Geração Convite', 'FAIL', 'Erro ao gerar convite', error.message);
      return null;
    }
  }

  async testInviteCodeValidation(inviteCode) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/validate-invite`, {
        inviteCode: inviteCode
      });
      
      if (response.data.success) {
        await this.log('Validação Convite', 'PASS', 'Código de convite válido', response.data);
        return true;
      } else {
        await this.log('Validação Convite', 'FAIL', 'Código de convite inválido', response.data);
        return false;
      }
    } catch (error) {
      await this.log('Validação Convite', 'FAIL', 'Erro na validação', error.message);
      return false;
    }
  }

  async testCompleteRegistration(inviteCode) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/complete-registration`, {
        inviteCode: inviteCode,
        userData: { name: 'Usuário Teste' }
      }, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (response.data.success) {
        await this.log('Registro Completo', 'PASS', 'Registro concluído com sucesso', response.data);
        return true;
      } else {
        await this.log('Registro Completo', 'FAIL', 'Falha no registro', response.data);
        return false;
      }
    } catch (error) {
      await this.log('Registro Completo', 'FAIL', 'Erro no registro', error.message);
      return false;
    }
  }

  async testConversationsList() {
    try {
      const response = await axios.get(`${BASE_URL}/conversations`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (response.data.success) {
        await this.log('Lista Conversas', 'PASS', 'Conversas obtidas com sucesso', response.data);
        return true;
      } else {
        await this.log('Lista Conversas', 'FAIL', 'Falha ao obter conversas', response.data);
        return false;
      }
    } catch (error) {
      await this.log('Lista Conversas', 'FAIL', 'Erro ao obter conversas', error.message);
      return false;
    }
  }

  async testWebSocketConnection() {
    return new Promise((resolve) => {
      try {
        this.socket = io(BASE_URL, {
          auth: { token: this.authToken }
        });

        this.socket.on('connect', async () => {
          await this.log('WebSocket', 'PASS', 'Conectado com sucesso');
          resolve(true);
        });

        this.socket.on('connect_error', async (error) => {
          await this.log('WebSocket', 'FAIL', 'Erro de conexão', error.message);
          resolve(false);
        });

        // Timeout de 5 segundos
        setTimeout(async () => {
          if (!this.socket.connected) {
            await this.log('WebSocket', 'FAIL', 'Timeout de conexão');
            resolve(false);
          }
        }, 5000);

      } catch (error) {
        this.log('WebSocket', 'FAIL', 'Erro ao criar conexão', error.message);
        resolve(false);
      }
    });
  }

  async testMessageSending() {
    return new Promise((resolve) => {
      try {
        const testMessage = {
          recipientId: this.userId, // Usar o próprio usuário para teste
          message: 'Teste de mensagem efêmera',
          messageType: 'text',
          timestamp: Date.now(),
          ttl: 5
        };

        this.socket.emit('send_message', testMessage);

        this.socket.on('message_sent', async (data) => {
          await this.log('Envio Mensagem', 'PASS', 'Mensagem enviada via WebSocket', data);
          resolve(true);
        });

        this.socket.on('message_error', async (data) => {
          await this.log('Envio Mensagem', 'FAIL', 'Erro ao enviar mensagem', data);
          resolve(false);
        });

        // Timeout de 3 segundos
        setTimeout(async () => {
          await this.log('Envio Mensagem', 'FAIL', 'Timeout no envio de mensagem');
          resolve(false);
        }, 3000);

      } catch (error) {
        this.log('Envio Mensagem', 'FAIL', 'Erro no teste de envio', error.message);
        resolve(false);
      }
    });
  }

  async testImageUpload() {
    try {
      // Simular dados de imagem criptografada
      const imageData = {
        recipientId: this.userId, // Usar o próprio usuário para teste
        encryptedImage: 'encrypted_image_data_base64',
        encryptedSessionKey: 'encrypted_session_key',
        imageHash: 'sha256_hash_of_image',
        thumbnail: 'thumbnail_base64',
        dimensions: { width: 800, height: 600 },
        originalSize: 1024000,
        optimizedSize: 512000,
        compressionRatio: 0.5,
        ttl: 5
      };

      const response = await axios.post(`${BASE_URL}/messages/send-image`, imageData, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (response.data.success) {
        await this.log('Upload Imagem', 'PASS', 'Imagem enviada com sucesso', response.data);
        return response.data.messageId;
      } else {
        await this.log('Upload Imagem', 'FAIL', 'Falha no upload', response.data);
        return null;
      }
    } catch (error) {
      await this.log('Upload Imagem', 'FAIL', 'Erro no upload', error.message);
      return null;
    }
  }

  async testDatabasePersistence() {
    try {
      // Testar se os dados estão sendo persistidos no banco
      const response = await axios.get(`${BASE_URL}/invites/my-codes`, {
        headers: { Authorization: `Bearer ${this.authToken}` }
      });
      
      if (response.data.success) {
        await this.log('Persistência BD', 'PASS', 'Dados persistidos no banco', response.data);
        return true;
      } else {
        await this.log('Persistência BD', 'FAIL', 'Falha na persistência', response.data);
        return false;
      }
    } catch (error) {
      await this.log('Persistência BD', 'FAIL', 'Erro na persistência', error.message);
      return false;
    }
  }

  async testWaitlist() {
    try {
      const response = await axios.post(`${BASE_URL}/waitlist/add`, {
        phoneNumber: TEST_PHONE_2,
        name: 'Usuário Lista Espera',
        reason: 'Teste de integração'
      });
      
      if (response.data.success) {
        await this.log('Lista Espera', 'PASS', 'Adicionado à lista de espera', response.data);
        return true;
      } else {
        await this.log('Lista Espera', 'FAIL', 'Falha na lista de espera', response.data);
        return false;
      }
    } catch (error) {
      await this.log('Lista Espera', 'FAIL', 'Erro na lista de espera', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Iniciando testes de integração...\n');

    // 1. Health Check
    const healthOk = await this.testHealthCheck();
    if (!healthOk) {
      console.log('❌ Servidor não está funcionando. Abortando testes.');
      return;
    }

    // 2. Autenticação
    console.log('\n📱 Testando autenticação...');
    const sessionId = await this.testOTPSend();
    if (!sessionId) return;

    const otpOk = await this.testOTPVerify(sessionId);
    if (!otpOk) return;

    // 3. Sistema de convites
    console.log('\n🎫 Testando sistema de convites...');
    const inviteCode = await this.testInviteCodeGeneration();
    if (!inviteCode) return;

    await this.testInviteCodeValidation(inviteCode);
    await this.testCompleteRegistration(inviteCode);

    // 4. Conversas
    console.log('\n💬 Testando conversas...');
    await this.testConversationsList();

    // 5. WebSocket
    console.log('\n🔌 Testando WebSocket...');
    const wsOk = await this.testWebSocketConnection();
    if (wsOk) {
      await this.testMessageSending();
    }

    // 6. Imagens
    console.log('\n🖼️ Testando imagens...');
    await this.testImageUpload();

    // 7. Persistência
    console.log('\n💾 Testando persistência...');
    await this.testDatabasePersistence();

    // 8. Lista de espera
    console.log('\n⏳ Testando lista de espera...');
    await this.testWaitlist();

    // Fechar conexão WebSocket
    if (this.socket) {
      this.socket.disconnect();
    }

    // Resumo dos testes
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log(`✅ Passou: ${passed}/${total}`);
    console.log(`❌ Falhou: ${failed}/${total}`);
    console.log(`📈 Taxa de sucesso: ${Math.round((passed/total)*100)}%`);
    
    if (failed > 0) {
      console.log('\n❌ TESTES QUE FALHARAM:');
      this.results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`   - ${r.test}: ${r.message}`);
      });
    }
    
    console.log('\n🎉 Testes de integração concluídos!');
  }
}

// Executar testes
const tester = new IntegrationTester();
tester.runAllTests().catch(console.error);
