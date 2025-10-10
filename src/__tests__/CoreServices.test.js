import {describe, it, expect, beforeEach, afterEach} from '@jest/globals';
import RealE2EEncryption from '../services/RealE2EEncryption';
import MonitoringService from '../services/MonitoringService';
import OneSignalNotificationService from '../services/OneSignalNotificationService';

describe('vo1d Core Services', () => {
  let encryptionService;
  let monitoringService;
  let notificationService;

  beforeEach(() => {
    encryptionService = RealE2EEncryption.getInstance();
    monitoringService = MonitoringService.getInstance();
    notificationService = NotificationService.getInstance();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('RealE2EEncryption', () => {
    it('should generate key pair', async () => {
      const keyPair = await encryptionService.generateKeyPair();
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair.privateKey).toHaveLength(64);
      expect(keyPair.publicKey).toHaveLength(64);
    });

    it('should encrypt and decrypt messages', async () => {
      const keyPair = await encryptionService.generateKeyPair();
      const message = 'Test message';
      
      const encrypted = await encryptionService.encryptMessage(message, keyPair.publicKey);
      expect(encrypted).toHaveProperty('encryptedMessage');
      expect(encrypted).toHaveProperty('encryptedSessionKey');
      
      const decrypted = await encryptionService.decryptMessage(encrypted);
      expect(decrypted).toBe(message);
    });

    it('should verify message integrity', () => {
      const message = 'Test message';
      const hash = encryptionService.generateMessageHash(message);
      const isValid = encryptionService.verifyMessageIntegrity(message, hash);
      expect(isValid).toBe(true);
    });
  });

  describe('MonitoringService', () => {
    it('should log messages', () => {
      monitoringService.info('Test log message');
      const logs = monitoringService.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Test log message');
    });

    it('should track metrics', () => {
      monitoringService.incrementMetric('messagesSent');
      const metrics = monitoringService.getAllMetrics();
      expect(metrics.messagesSent).toBe(1);
    });

    it('should perform health check', async () => {
      const health = await monitoringService.healthCheck();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('metrics');
    });
  });

  describe('OneSignalNotificationService', () => {
    it('should initialize', () => {
      expect(notificationService).toBeDefined();
    });

    it('should send local notification', () => {
      expect(() => {
        OneSignalNotificationService.sendLocalNotification('Test', 'Test message');
      }).not.toThrow();
    });
  });
});
