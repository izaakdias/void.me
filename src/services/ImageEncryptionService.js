import CryptoJS from 'crypto-js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

class ImageEncryptionService {
  static instance = null;

  static getInstance() {
    if (!ImageEncryptionService.instance) {
      ImageEncryptionService.instance = new ImageEncryptionService();
    }
    return ImageEncryptionService.instance;
  }

  // Criptografar imagem (base64)
  async encryptImage(imageBase64, recipientPublicKey) {
    try {
      // Gerar chave de sessão aleatória
      const sessionKeyBytes = await Crypto.getRandomBytesAsync(32);
      const sessionKey = sessionKeyBytes.toString('hex');
      
      // Criptografar imagem com chave de sessão
      const encryptedImage = CryptoJS.AES.encrypt(imageBase64, sessionKey).toString();
      
      // Criptografar chave de sessão com chave pública do destinatário
      const encryptedSessionKey = CryptoJS.AES.encrypt(sessionKey, recipientPublicKey).toString();
      
      // Gerar hash da imagem para verificação de integridade
      const imageHash = CryptoJS.SHA256(imageBase64).toString();
      
      return {
        encryptedImage,
        encryptedSessionKey,
        imageHash,
        timestamp: Date.now(),
        size: imageBase64.length,
        type: 'image',
      };
    } catch (error) {
      console.error('Erro ao criptografar imagem:', error);
      throw error;
    }
  }

  // Descriptografar imagem
  async decryptImage(encryptedData) {
    try {
      const {encryptedImage, encryptedSessionKey} = encryptedData;
      
      // Obter chave privada
      const privateKey = await this.getPrivateKey();
      if (!privateKey) {
        throw new Error('Chave privada não encontrada');
      }
      
      // Descriptografar chave de sessão
      const sessionKey = CryptoJS.AES.decrypt(encryptedSessionKey, privateKey).toString(CryptoJS.enc.Utf8);
      
      // Descriptografar imagem
      const decryptedImage = CryptoJS.AES.decrypt(encryptedImage, sessionKey).toString(CryptoJS.enc.Utf8);
      
      return decryptedImage;
    } catch (error) {
      console.error('Erro ao descriptografar imagem:', error);
      throw error;
    }
  }

  // Verificar integridade da imagem
  verifyImageIntegrity(imageBase64, expectedHash) {
    try {
      const actualHash = CryptoJS.SHA256(imageBase64).toString();
      return actualHash === expectedHash;
    } catch (error) {
      console.error('Erro ao verificar integridade da imagem:', error);
      return false;
    }
  }

  // Comprimir imagem antes da criptografia
  async compressImage(imageBase64, quality = 0.8, maxWidth = 800, maxHeight = 600) {
    try {
      // Para React Native, usaremos uma abordagem simples
      // Em produção, considere usar react-native-image-resizer
      
      // Calcular novo tamanho mantendo proporção
      const {width, height} = await this.getImageDimensions(imageBase64);
      
      let newWidth = width;
      let newHeight = height;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        newWidth = Math.floor(width * ratio);
        newHeight = Math.floor(height * ratio);
      }
      
      // Retornar imagem comprimida (simplificado)
      return {
        compressedImage: imageBase64,
        originalSize: imageBase64.length,
        compressedSize: Math.floor(imageBase64.length * quality),
        dimensions: {width: newWidth, height: newHeight},
        compressionRatio: quality,
      };
    } catch (error) {
      console.error('Erro ao comprimir imagem:', error);
      throw error;
    }
  }

  // Obter dimensões da imagem
  async getImageDimensions(imageBase64) {
    return new Promise((resolve, reject) => {
      // Para React Native, usar Image.getSize
      const Image = require('react-native').Image;
      
      Image.getSize(
        `data:image/jpeg;base64,${imageBase64}`,
        (width, height) => {
          resolve({width, height});
        },
        (error) => {
          console.error('Erro ao obter dimensões da imagem:', error);
          reject(error);
        }
      );
    });
  }

  // Validar tipo de imagem
  validateImageType(imageBase64) {
    try {
      // Verificar header da imagem
      const header = imageBase64.substring(0, 20);
      
      if (header.includes('/9j/') || header.includes('iVBORw0KGgo')) {
        return true; // JPEG ou PNG
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao validar tipo de imagem:', error);
      return false;
    }
  }

  // Obter chave privada
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

  // Gerar thumbnail da imagem
  async generateThumbnail(imageBase64, size = 150) {
    try {
      // Implementação simplificada de thumbnail
      // Em produção, use react-native-image-resizer
      
      const {width, height} = await this.getImageDimensions(imageBase64);
      
      // Calcular proporção para thumbnail
      const ratio = Math.min(size / width, size / height);
      const thumbnailWidth = Math.floor(width * ratio);
      const thumbnailHeight = Math.floor(height * ratio);
      
      return {
        thumbnail: imageBase64, // Simplificado
        dimensions: {width: thumbnailWidth, height: thumbnailHeight},
        size: Math.floor(imageBase64.length * 0.1), // Estimativa
      };
    } catch (error) {
      console.error('Erro ao gerar thumbnail:', error);
      throw error;
    }
  }

  // Calcular hash da imagem para detecção de duplicatas
  calculateImageHash(imageBase64) {
    try {
      return CryptoJS.SHA256(imageBase64).toString();
    } catch (error) {
      console.error('Erro ao calcular hash da imagem:', error);
      return null;
    }
  }

  // Verificar se imagem é segura (não contém conteúdo malicioso)
  async validateImageSafety(imageBase64) {
    try {
      // Implementação básica de validação
      // Em produção, use serviços como Google Safe Search API
      
      const imageSize = imageBase64.length;
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (imageSize > maxSize) {
        return {
          safe: false,
          reason: 'Imagem muito grande',
        };
      }
      
      // Verificar tipo de arquivo
      if (!this.validateImageType(imageBase64)) {
        return {
          safe: false,
          reason: 'Tipo de arquivo não suportado',
        };
      }
      
      return {
        safe: true,
        reason: 'Imagem válida',
      };
    } catch (error) {
      console.error('Erro ao validar segurança da imagem:', error);
      return {
        safe: false,
        reason: 'Erro na validação',
      };
    }
  }

  // Otimizar imagem para envio
  async optimizeImageForSending(imageBase64, options = {}) {
    try {
      const {
        maxSize = 5 * 1024 * 1024, // 5MB
        quality = 0.8,
        maxWidth = 1920,
        maxHeight = 1080,
      } = options;
      
      // Validar segurança
      const safetyCheck = await this.validateImageSafety(imageBase64);
      if (!safetyCheck.safe) {
        throw new Error(safetyCheck.reason);
      }
      
      // Comprimir se necessário
      let optimizedImage = imageBase64;
      if (imageBase64.length > maxSize) {
        const compressed = await this.compressImage(imageBase64, quality, maxWidth, maxHeight);
        optimizedImage = compressed.compressedImage;
      }
      
      // Gerar thumbnail
      const thumbnail = await this.generateThumbnail(optimizedImage);
      
      return {
        optimizedImage,
        thumbnail: thumbnail.thumbnail,
        originalSize: imageBase64.length,
        optimizedSize: optimizedImage.length,
        compressionRatio: optimizedImage.length / imageBase64.length,
        thumbnailSize: thumbnail.size,
        dimensions: thumbnail.dimensions,
      };
    } catch (error) {
      console.error('Erro ao otimizar imagem:', error);
      throw error;
    }
  }
}

export default ImageEncryptionService;

