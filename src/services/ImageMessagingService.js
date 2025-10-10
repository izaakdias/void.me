import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import ImageEncryptionService from './ImageEncryptionService';
import {AuthService} from './AuthService';
import MonitoringService from './MonitoringService';
import Constants from 'expo-constants';

class ImageMessagingService {
  static instance = null;

  static getInstance() {
    if (!ImageMessagingService.instance) {
      ImageMessagingService.instance = new ImageMessagingService();
    }
    return ImageMessagingService.instance;
  }

  // Enviar imagem efêmera
  static async sendEphemeralImage(recipientId, imageBase64, options = {}) {
    try {
      const {
        ttl = 5, // 5 segundos por padrão
        quality = 0.8,
        maxSize = 5 * 1024 * 1024, // 5MB
      } = options;

      MonitoringService.startTimer('image_send');

      // Obter chave pública do destinatário
      const recipientPublicKey = await this.getRecipientPublicKey(recipientId);
      
      // Otimizar imagem
      const imageEncryptionService = ImageEncryptionService.getInstance();
      const optimizedImage = await imageEncryptionService.optimizeImageForSending(imageBase64, {
        maxSize,
        quality,
      });

      // Criptografar imagem
      const encryptedImageData = await imageEncryptionService.encryptImage(
        optimizedImage.optimizedImage,
        recipientPublicKey
      );

      // Preparar dados da mensagem
      const messageData = {
        recipientId,
        messageType: 'image',
        encryptedImage: encryptedImageData.encryptedImage,
        encryptedSessionKey: encryptedImageData.encryptedSessionKey,
        imageHash: encryptedImageData.imageHash,
        thumbnail: optimizedImage.thumbnail,
        dimensions: optimizedImage.dimensions,
        originalSize: optimizedImage.originalSize,
        optimizedSize: optimizedImage.optimizedSize,
        compressionRatio: optimizedImage.compressionRatio,
        timestamp: Date.now(),
        ttl,
      };

      // Enviar via API
      const response = await axios.post(`${Config.SERVER_URL || 'http://192.168.0.33:3000'}/messages/send-image`, messageData, {
        headers: {
          'Authorization': `Bearer ${await AuthService.getAuthToken()}`,
          'Content-Type': 'application/json',
        },
      });

      const sendDuration = MonitoringService.endTimer('image_send');
      
      // Log para monitoramento
      MonitoringService.logMessage('sent', {
        messageType: 'image',
        recipientId,
        imageSize: optimizedImage.optimizedSize,
        compressionRatio: optimizedImage.compressionRatio,
        sendDuration,
      });

      return {
        success: true,
        message: 'Imagem enviada com sucesso',
        messageId: response.data.messageId,
        ttl,
      };
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      MonitoringService.error('Erro ao enviar imagem', {
        recipientId,
        error: error.message,
      });
      throw error;
    }
  }

  // Receber imagem efêmera
  static async receiveEphemeralImage(messageId) {
    try {
      MonitoringService.startTimer('image_receive');

      // Solicitar conteúdo da imagem
      const response = await axios.get(`${Config.SERVER_URL || 'http://192.168.0.33:3000'}/messages/image/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${await AuthService.getAuthToken()}`,
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      const {encryptedImage, encryptedSessionKey, imageHash, dimensions, ttl} = response.data;

      // Descriptografar imagem
      const imageEncryptionService = ImageEncryptionService.getInstance();
      const decryptedImage = await imageEncryptionService.decryptImage({
        encryptedImage,
        encryptedSessionKey,
      });

      // Verificar integridade
      const isValid = imageEncryptionService.verifyImageIntegrity(decryptedImage, imageHash);
      if (!isValid) {
        throw new Error('Imagem corrompida ou alterada');
      }

      const receiveDuration = MonitoringService.endTimer('image_receive');

      // Log para monitoramento
      MonitoringService.logMessage('received', {
        messageType: 'image',
        messageId,
        imageSize: decryptedImage.length,
        receiveDuration,
      });

      return {
        success: true,
        image: decryptedImage,
        dimensions,
        ttl,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Erro ao receber imagem:', error);
      MonitoringService.error('Erro ao receber imagem', {
        messageId,
        error: error.message,
      });
      throw error;
    }
  }

  // Obter chave pública do destinatário
  static async getRecipientPublicKey(recipientId) {
    try {
      const response = await axios.get(`${Config.SERVER_URL || 'http://192.168.0.33:3000'}/users/${recipientId}/public-key`, {
        headers: {
          'Authorization': `Bearer ${await AuthService.getAuthToken()}`,
        },
      });

      if (response.data.success) {
        return response.data.publicKey;
      } else {
        throw new Error('Erro ao obter chave pública do destinatário');
      }
    } catch (error) {
      console.error('Erro ao obter chave pública:', error);
      throw error;
    }
  }

  // Obter thumbnail da imagem
  static async getImageThumbnail(messageId) {
    try {
      const response = await axios.get(`${Config.SERVER_URL || 'http://192.168.0.33:3000'}/messages/image/${messageId}/thumbnail`, {
        headers: {
          'Authorization': `Bearer ${await AuthService.getAuthToken()}`,
        },
      });

      if (response.data.success) {
        return {
          thumbnail: response.data.thumbnail,
          dimensions: response.data.dimensions,
        };
      } else {
        throw new Error('Erro ao obter thumbnail');
      }
    } catch (error) {
      console.error('Erro ao obter thumbnail:', error);
      throw error;
    }
  }

  // Marcar imagem como visualizada
  static async markImageAsViewed(messageId) {
    try {
      await axios.post(`${Config.SERVER_URL || 'http://192.168.0.33:3000'}/messages/image/${messageId}/viewed`, {}, {
        headers: {
          'Authorization': `Bearer ${await AuthService.getAuthToken()}`,
        },
      });
    } catch (error) {
      console.error('Erro ao marcar imagem como visualizada:', error);
    }
  }

  // Obter estatísticas de imagens
  static async getImageStats() {
    try {
      const response = await axios.get(`${Config.SERVER_URL || 'http://192.168.0.33:3000'}/messages/image/stats`, {
        headers: {
          'Authorization': `Bearer ${await AuthService.getAuthToken()}`,
        },
      });

      if (response.data.success) {
        return response.data.stats;
      } else {
        throw new Error('Erro ao obter estatísticas de imagens');
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas de imagens:', error);
      throw error;
    }
  }

  // Limpar cache de imagens
  static async clearImageCache() {
    try {
      // Limpar cache local de imagens
      const keys = await AsyncStorage.getAllKeys();
      const imageKeys = keys.filter(key => key.startsWith('image_cache_'));
      
      if (imageKeys.length > 0) {
        await AsyncStorage.multiRemove(imageKeys);
      }

      console.log('Cache de imagens limpo');
    } catch (error) {
      console.error('Erro ao limpar cache de imagens:', error);
    }
  }

  // Salvar imagem no cache local
  static async cacheImage(messageId, imageBase64) {
    try {
      const cacheKey = `image_cache_${messageId}`;
      await AsyncStorage.setItem(cacheKey, imageBase64);
      
      // Definir TTL para o cache (5 minutos)
      const ttlKey = `image_cache_ttl_${messageId}`;
      await AsyncStorage.setItem(ttlKey, (Date.now() + 5 * 60 * 1000).toString());
    } catch (error) {
      console.error('Erro ao salvar imagem no cache:', error);
    }
  }

  // Obter imagem do cache local
  static async getCachedImage(messageId) {
    try {
      const cacheKey = `image_cache_${messageId}`;
      const ttlKey = `image_cache_ttl_${messageId}`;
      
      const [cachedImage, ttl] = await AsyncStorage.multiGet([cacheKey, ttlKey]);
      
      if (cachedImage[1] && ttl[1]) {
        const expirationTime = parseInt(ttl[1]);
        if (Date.now() < expirationTime) {
          return cachedImage[1];
        } else {
          // Cache expirado, remover
          await AsyncStorage.multiRemove([cacheKey, ttlKey]);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao obter imagem do cache:', error);
      return null;
    }
  }

  // Validar imagem antes do envio
  static async validateImageBeforeSending(imageBase64) {
    try {
      const imageEncryptionService = ImageEncryptionService.getInstance();
      
      // Verificar tipo de arquivo
      if (!imageEncryptionService.validateImageType(imageBase64)) {
        return {
          valid: false,
          error: 'Tipo de arquivo não suportado. Use JPEG ou PNG.',
        };
      }
      
      // Verificar segurança
      const safetyCheck = await imageEncryptionService.validateImageSafety(imageBase64);
      if (!safetyCheck.safe) {
        return {
          valid: false,
          error: safetyCheck.reason,
        };
      }
      
      // Verificar tamanho
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (imageBase64.length > maxSize) {
        return {
          valid: false,
          error: 'Imagem muito grande. Máximo 10MB.',
        };
      }
      
      return {
        valid: true,
        size: imageBase64.length,
        type: 'image',
      };
    } catch (error) {
      console.error('Erro ao validar imagem:', error);
      return {
        valid: false,
        error: 'Erro na validação da imagem',
      };
    }
  }
}

export {ImageMessagingService};

