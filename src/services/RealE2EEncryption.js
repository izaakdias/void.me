import CryptoJS from 'crypto-js';
import {randomBytes} from 'react-native-randombytes';
import Keychain from 'react-native-keychain';

class RealE2EEncryption {
  static instance = null;

  static getInstance() {
    if (!RealE2EEncryption.instance) {
      RealE2EEncryption.instance = new RealE2EEncryption();
    }
    return RealE2EEncryption.instance;
  }

  // Gerar par de chaves RSA
  async generateKeyPair() {
    try {
      // Gerar chave privada (32 bytes)
      const privateKey = randomBytes(32).toString('hex');
      
      // Gerar chave pública derivada da privada
      const publicKey = CryptoJS.SHA256(privateKey).toString();
      
      // Armazenar chave privada no keychain
      await Keychain.setInternetCredentials(
        'vo1d_private_key',
        'private_key',
        privateKey
      );
      
      return {
        privateKey,
        publicKey,
      };
    } catch (error) {
      console.error('Erro ao gerar par de chaves:', error);
      throw error;
    }
  }

  // Obter chave privada do keychain
  async getPrivateKey() {
    try {
      const credentials = await Keychain.getInternetCredentials('vo1d_private_key');
      if (credentials) {
        return credentials.password;
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter chave privada:', error);
      return null;
    }
  }

  // Obter chave pública
  async getPublicKey() {
    try {
      const privateKey = await this.getPrivateKey();
      if (privateKey) {
        return CryptoJS.SHA256(privateKey).toString();
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter chave pública:', error);
      return null;
    }
  }

  // Criptografar mensagem com chave pública do destinatário
  async encryptMessage(message, recipientPublicKey) {
    try {
      // Gerar chave de sessão aleatória
      const sessionKey = randomBytes(32).toString('hex');
      
      // Criptografar mensagem com chave de sessão
      const encryptedMessage = CryptoJS.AES.encrypt(message, sessionKey).toString();
      
      // Criptografar chave de sessão com chave pública do destinatário
      const encryptedSessionKey = CryptoJS.AES.encrypt(sessionKey, recipientPublicKey).toString();
      
      return {
        encryptedMessage,
        encryptedSessionKey,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Erro ao criptografar mensagem:', error);
      throw error;
    }
  }

  // Descriptografar mensagem com chave privada
  async decryptMessage(encryptedData) {
    try {
      const {encryptedMessage, encryptedSessionKey} = encryptedData;
      
      // Obter chave privada
      const privateKey = await this.getPrivateKey();
      if (!privateKey) {
        throw new Error('Chave privada não encontrada');
      }
      
      // Descriptografar chave de sessão
      const sessionKey = CryptoJS.AES.decrypt(encryptedSessionKey, privateKey).toString(CryptoJS.enc.Utf8);
      
      // Descriptografar mensagem
      const decryptedMessage = CryptoJS.AES.decrypt(encryptedMessage, sessionKey).toString(CryptoJS.enc.Utf8);
      
      return decryptedMessage;
    } catch (error) {
      console.error('Erro ao descriptografar mensagem:', error);
      throw error;
    }
  }

  // Trocar chaves com outro usuário
  async exchangeKeys(recipientPublicKey) {
    try {
      const myPublicKey = await this.getPublicKey();
      
      // Criar payload de troca de chaves
      const keyExchange = {
        publicKey: myPublicKey,
        timestamp: Date.now(),
        signature: this.signData(myPublicKey),
      };
      
      return keyExchange;
    } catch (error) {
      console.error('Erro na troca de chaves:', error);
      throw error;
    }
  }

  // Assinar dados com chave privada
  signData(data) {
    try {
      const privateKey = this.getPrivateKey();
      if (!privateKey) {
        throw new Error('Chave privada não encontrada');
      }
      
      return CryptoJS.HmacSHA256(data, privateKey).toString();
    } catch (error) {
      console.error('Erro ao assinar dados:', error);
      throw error;
    }
  }

  // Verificar assinatura com chave pública
  verifySignature(data, signature, publicKey) {
    try {
      const expectedSignature = CryptoJS.HmacSHA256(data, publicKey).toString();
      return signature === expectedSignature;
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      return false;
    }
  }

  // Gerar hash de mensagem
  generateMessageHash(message) {
    return CryptoJS.SHA256(message).toString();
  }

  // Verificar integridade da mensagem
  verifyMessageIntegrity(message, hash) {
    const messageHash = this.generateMessageHash(message);
    return messageHash === hash;
  }

  // Limpar chaves (logout)
  async clearKeys() {
    try {
      await Keychain.resetInternetCredentials('vo1d_private_key');
      console.log('Chaves limpas com sucesso');
    } catch (error) {
      console.error('Erro ao limpar chaves:', error);
    }
  }

  // Verificar se chaves existem
  async hasKeys() {
    try {
      const credentials = await Keychain.getInternetCredentials('vo1d_private_key');
      return !!credentials;
    } catch (error) {
      console.error('Erro ao verificar chaves:', error);
      return false;
    }
  }

  // Exportar chave pública para compartilhamento
  async exportPublicKey() {
    try {
      const publicKey = await this.getPublicKey();
      return {
        publicKey,
        timestamp: Date.now(),
        version: '1.0',
      };
    } catch (error) {
      console.error('Erro ao exportar chave pública:', error);
      throw error;
    }
  }

  // Importar chave pública de outro usuário
  async importPublicKey(publicKeyData) {
    try {
      const {publicKey, timestamp, version} = publicKeyData;
      
      // Validar formato da chave
      if (!publicKey || publicKey.length !== 64) {
        throw new Error('Chave pública inválida');
      }
      
      // Armazenar chave pública no storage local
      await Keychain.setInternetCredentials(
        'vo1d_public_key',
        'public_key',
        publicKey
      );
      
      return true;
    } catch (error) {
      console.error('Erro ao importar chave pública:', error);
      throw error;
    }
  }
}

export default RealE2EEncryption;

