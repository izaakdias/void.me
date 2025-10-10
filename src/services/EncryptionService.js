import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

class EncryptionService {
  static instance = null;
  static encryptionKey = null;

  static getInstance() {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  static async initialize() {
    try {
      // Gerar ou recuperar chave de criptografia do dispositivo
      let deviceKey = await SecureStore.getItemAsync('device_encryption_key');
      
      if (!deviceKey) {
        // Gerar nova chave de 256 bits
        const keyBytes = await Crypto.getRandomBytesAsync(32);
        deviceKey = keyBytes.toString('hex');
        await SecureStore.setItemAsync('device_encryption_key', deviceKey);
      }
      
      EncryptionService.encryptionKey = deviceKey;
      console.log('Serviço de criptografia inicializado');
    } catch (error) {
      console.error('Erro ao inicializar criptografia:', error);
      throw error;
    }
  }

  // Gerar par de chaves para E2E
  async generateKeyPair() {
    try {
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      const privateKey = randomBytes.toString('hex');
      const publicKey = CryptoJS.SHA256(privateKey).toString();
      
      return {
        privateKey,
        publicKey,
      };
    } catch (error) {
      console.error('Erro ao gerar par de chaves:', error);
      throw error;
    }
  }

  // Criptografar mensagem com chave pública do destinatário
  encryptMessage(message, recipientPublicKey, senderPrivateKey) {
    try {
      // Criar chave compartilhada usando ECDH (simplificado)
      const sharedSecret = this.generateSharedSecret(senderPrivateKey, recipientPublicKey);
      
      // Criptografar mensagem
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify({
          message,
          timestamp: Date.now(),
          sender: senderPrivateKey, // Será substituído por ID do usuário
        }),
        sharedSecret
      ).toString();

      return encrypted;
    } catch (error) {
      console.error('Erro ao criptografar mensagem:', error);
      throw error;
    }
  }

  // Descriptografar mensagem com chave privada do destinatário
  decryptMessage(encryptedMessage, senderPublicKey, recipientPrivateKey) {
    try {
      // Criar chave compartilhada
      const sharedSecret = this.generateSharedSecret(recipientPrivateKey, senderPublicKey);
      
      // Descriptografar mensagem
      const decrypted = CryptoJS.AES.decrypt(encryptedMessage, sharedSecret);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Falha na descriptografia');
      }

      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Erro ao descriptografar mensagem:', error);
      throw error;
    }
  }

  // Gerar chave compartilhada (simplificado - usar ECDH real em produção)
  generateSharedSecret(privateKey, publicKey) {
    try {
      const combined = privateKey + publicKey;
      return CryptoJS.SHA256(combined).toString();
    } catch (error) {
      console.error('Erro ao gerar chave compartilhada:', error);
      throw error;
    }
  }

  // Criptografar dados locais
  encryptLocalData(data) {
    try {
      // Verificar se a chave está inicializada
      if (!EncryptionService.encryptionKey) {
        console.warn('⚠️ Chave de criptografia não inicializada, usando chave padrão');
        EncryptionService.encryptionKey = 'default-encryption-key-dev';
      }
      
      return CryptoJS.AES.encrypt(
        JSON.stringify(data),
        EncryptionService.encryptionKey
      ).toString();
    } catch (error) {
      console.error('Erro ao criptografar dados locais:', error);
      throw error;
    }
  }

  // Descriptografar dados locais
  decryptLocalData(encryptedData) {
    try {
      // Verificar se a chave está inicializada
      if (!EncryptionService.encryptionKey) {
        console.warn('⚠️ Chave de criptografia não inicializada, usando chave padrão');
        EncryptionService.encryptionKey = 'default-encryption-key-dev';
      }
      
      const decrypted = CryptoJS.AES.decrypt(
        encryptedData,
        EncryptionService.encryptionKey
      );
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Falha na descriptografia local');
      }

      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Erro ao descriptografar dados locais:', error);
      throw error;
    }
  }

  // Gerar hash seguro
  generateHash(data) {
    return CryptoJS.SHA256(data).toString();
  }

  // Gerar código de convite seguro
  async generateInviteCode() {
    try {
      const randomBytes = await Crypto.getRandomBytesAsync(16);
      const randomData = randomBytes.toString('hex');
      return CryptoJS.SHA256(randomData).toString().substring(0, 8).toUpperCase();
    } catch (error) {
      console.error('Erro ao gerar código de convite:', error);
      throw error;
    }
  }

  // Limpar chaves (para logout)
  async clearKeys() {
    try {
      await SecureStore.deleteItemAsync('device_encryption_key');
      EncryptionService.encryptionKey = null;
      console.log('Chaves de criptografia removidas');
    } catch (error) {
      console.error('Erro ao limpar chaves:', error);
      throw error;
    }
  }
}

export {EncryptionService};


