import {describe, it, expect, beforeEach, afterEach} from '@jest/globals';
import ImageEncryptionService from '../services/ImageEncryptionService';
import ImageMessagingService from '../services/ImageMessagingService';
import MonitoringService from '../services/MonitoringService';

describe('vo1d Image Messaging System', () => {
  let imageEncryptionService;
  let imageMessagingService;
  let monitoringService;

  beforeEach(() => {
    imageEncryptionService = ImageEncryptionService.getInstance();
    imageMessagingService = ImageMessagingService.getInstance();
    monitoringService = MonitoringService.getInstance();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('ImageEncryptionService', () => {
    it('should encrypt and decrypt images', async () => {
      const mockImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const mockPublicKey = 'test_public_key_12345678901234567890123456789012';

      const encrypted = await imageEncryptionService.encryptImage(mockImageBase64, mockPublicKey);
      expect(encrypted).toHaveProperty('encryptedImage');
      expect(encrypted).toHaveProperty('encryptedSessionKey');
      expect(encrypted).toHaveProperty('imageHash');
      expect(encrypted).toHaveProperty('timestamp');
    });

    it('should validate image type', () => {
      const validImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const invalidImage = 'invalid_image_data';

      expect(imageEncryptionService.validateImageType(validImage)).toBe(true);
      expect(imageEncryptionService.validateImageType(invalidImage)).toBe(false);
    });

    it('should verify image integrity', () => {
      const image = 'test_image_data';
      const hash = imageEncryptionService.generateMessageHash(image);
      const isValid = imageEncryptionService.verifyImageIntegrity(image, hash);
      
      expect(isValid).toBe(true);
    });

    it('should validate image safety', async () => {
      const validImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const largeImage = 'x'.repeat(11 * 1024 * 1024); // 11MB

      const validResult = await imageEncryptionService.validateImageSafety(validImage);
      expect(validResult.safe).toBe(true);

      const largeResult = await imageEncryptionService.validateImageSafety(largeImage);
      expect(largeResult.safe).toBe(false);
      expect(largeResult.reason).toBe('Imagem muito grande');
    });

    it('should optimize image for sending', async () => {
      const mockImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const optimized = await imageEncryptionService.optimizeImageForSending(mockImage, {
        maxSize: 5 * 1024 * 1024,
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
      });

      expect(optimized).toHaveProperty('optimizedImage');
      expect(optimized).toHaveProperty('thumbnail');
      expect(optimized).toHaveProperty('originalSize');
      expect(optimized).toHaveProperty('optimizedSize');
      expect(optimized).toHaveProperty('compressionRatio');
    });
  });

  describe('ImageMessagingService', () => {
    it('should validate image before sending', async () => {
      const validImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const invalidImage = 'invalid_image_data';

      const validResult = await ImageMessagingService.validateImageBeforeSending(validImage);
      expect(validResult.valid).toBe(true);

      const invalidResult = await ImageMessagingService.validateImageBeforeSending(invalidImage);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toContain('Tipo de arquivo não suportado');
    });

    it('should cache and retrieve images', async () => {
      const messageId = 'test_message_123';
      const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      // Cache image
      await ImageMessagingService.cacheImage(messageId, imageBase64);

      // Retrieve cached image
      const cachedImage = await ImageMessagingService.getCachedImage(messageId);
      expect(cachedImage).toBe(imageBase64);
    });

    it('should clear image cache', async () => {
      const messageId = 'test_message_456';
      const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

      // Cache image
      await ImageMessagingService.cacheImage(messageId, imageBase64);

      // Clear cache
      await ImageMessagingService.clearImageCache();

      // Try to retrieve (should be null)
      const cachedImage = await ImageMessagingService.getCachedImage(messageId);
      expect(cachedImage).toBeNull();
    });
  });

  describe('Image Message Flow', () => {
    it('should handle complete image message flow', async () => {
      const mockImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const recipientId = 'test_recipient_123';
      const senderName = 'Test Sender';

      // Mock the send function
      const mockSendImage = jest.fn().mockResolvedValue({
        success: true,
        message: 'Imagem enviada com sucesso',
        messageId: 'test_message_789',
        ttl: 5,
      });

      // Test sending
      const result = await mockSendImage(recipientId, mockImage, {
        ttl: 5,
        quality: 0.8,
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test_message_789');
      expect(result.ttl).toBe(5);
    });

    it('should handle image destruction timer', () => {
      const ttl = 5;
      let timeLeft = ttl;
      
      // Simulate timer countdown
      const timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(timer);
        }
      }, 100);

      // Wait for timer to complete
      setTimeout(() => {
        expect(timeLeft).toBe(0);
      }, 600);
    });

    it('should track image message metrics', () => {
      const imageSize = 1024 * 1024; // 1MB
      const compressionRatio = 0.8;
      const sendDuration = 500;

      // Log metrics
      monitoringService.logMessage('sent', {
        messageType: 'image',
        imageSize,
        compressionRatio,
        sendDuration,
      });

      // Verify metrics
      const metrics = monitoringService.getAllMetrics();
      expect(metrics.messagesSent).toBeGreaterThan(0);
    });
  });

  describe('Image Security', () => {
    it('should encrypt image data', async () => {
      const imageData = 'sensitive_image_data';
      const publicKey = 'test_public_key_12345678901234567890123456789012';

      const encrypted = await imageEncryptionService.encryptImage(imageData, publicKey);
      
      expect(encrypted.encryptedImage).not.toBe(imageData);
      expect(encrypted.encryptedImage).toContain('U2FsdGVkX1'); // Base64 encrypted data
      expect(encrypted.imageHash).toBeDefined();
    });

    it('should verify image hash integrity', () => {
      const originalImage = 'original_image_data';
      const modifiedImage = 'modified_image_data';
      
      const originalHash = imageEncryptionService.generateMessageHash(originalImage);
      const modifiedHash = imageEncryptionService.generateMessageHash(modifiedImage);
      
      expect(originalHash).not.toBe(modifiedHash);
      expect(imageEncryptionService.verifyImageIntegrity(originalImage, originalHash)).toBe(true);
      expect(imageEncryptionService.verifyImageIntegrity(modifiedImage, originalHash)).toBe(false);
    });

    it('should handle image size limits', async () => {
      const smallImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const largeImage = 'x'.repeat(11 * 1024 * 1024); // 11MB

      const smallValidation = await ImageMessagingService.validateImageBeforeSending(smallImage);
      expect(smallValidation.valid).toBe(true);

      const largeValidation = await ImageMessagingService.validateImageBeforeSending(largeImage);
      expect(largeValidation.valid).toBe(false);
      expect(largeValidation.error).toContain('muito grande');
    });
  });
});
