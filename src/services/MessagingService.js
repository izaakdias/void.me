import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {EncryptionService} from './EncryptionService';
import {AuthService} from './AuthService';
import OneSignalNotificationService from './OneSignalNotificationService';
import MonitoringService from './MonitoringService';
import Config from 'react-native-config';

class MessagingService {
  static instance = null;
  static socket = null;
  static messageQueue = [];

  static getInstance() {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  // Inicializar conexão WebSocket
  static async initializeSocket() {
    try {
      const token = await AuthService.getAuthToken();
      
      // Importar Socket.IO dinamicamente
      const io = require('socket.io-client');
      
      MessagingService.socket = io('http://192.168.0.33:3000', {
        auth: {
          token,
        },
        transports: ['websocket'],
      });

      // Eventos do socket
      MessagingService.socket.on('connect', () => {
        console.log('Conectado ao servidor de mensagens');
      });

      MessagingService.socket.on('disconnect', () => {
        console.log('Desconectado do servidor de mensagens');
      });

      // Notificação de nova mensagem (SEM conteúdo)
      MessagingService.socket.on('new_message_notification', (data) => {
        this.handleNewMessageNotification(data);
      });

      // Conteúdo da mensagem após abertura
      MessagingService.socket.on('message_content', (data) => {
        this.handleMessageContent(data);
      });

      // Mensagem foi aberta pelo destinatário
      MessagingService.socket.on('message_opened', (data) => {
        this.handleMessageOpened(data);
      });

      // Mensagem foi lida
      MessagingService.socket.on('message_read', (data) => {
        this.handleMessageRead(data);
      });

      // Mensagem foi destruída
      MessagingService.socket.on('message_destroyed', (data) => {
        this.handleMessageDestroyed(data);
      });

      // Erros
      MessagingService.socket.on('message_error', (data) => {
        this.handleMessageError(data);
      });

      MessagingService.socket.on('message_not_found', (data) => {
        this.handleMessageNotFound(data);
      });

      MessagingService.socket.on('message_access_denied', (data) => {
        this.handleMessageAccessDenied(data);
      });

      MessagingService.socket.on('message_already_opened', (data) => {
        this.handleMessageAlreadyOpened(data);
      });

      return true;
    } catch (error) {
      console.error('Erro ao inicializar socket:', error);
      return false;
    }
  }

  // Enviar mensagem efêmera
  static async sendMessage(recipientId, messageText, messageType = 'text') {
    try {
      const encryptionService = EncryptionService.getInstance();
      const currentUser = AuthService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Obter chave pública do destinatário
      const recipientPublicKey = await this.getRecipientPublicKey(recipientId);
      
      // Criptografar mensagem
      const encryptedMessage = encryptionService.encryptMessage(
        messageText,
        recipientPublicKey,
        currentUser.privateKey
      );

      const messageData = {
        recipientId,
        message: encryptedMessage,
        messageType,
        timestamp: Date.now(),
        ttl: Config.MESSAGE_TTL || 5, // 5 segundos por padrão
      };

      // Enviar via socket
      if (MessagingService.socket && MessagingService.socket.connected) {
        MessagingService.socket.emit('send_message', messageData);
      } else {
        // Adicionar à fila se não conectado
        MessagingService.messageQueue.push(messageData);
      }

      return {
        success: true,
        message: 'Mensagem enviada com sucesso',
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // Obter chave pública do destinatário
  static async getRecipientPublicKey(recipientId) {
    try {
      const response = await axios.get(`${'http://192.168.0.33:3000'}/users/${recipientId}/public-key`, {
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

  // Processar notificação de nova mensagem (SEM conteúdo)
  static async handleNewMessageNotification(data) {
    try {
      const message = {
        id: data.messageId,
        senderId: data.senderId,
        recipientId: AuthService.getCurrentUser().id,
        content: null, // Conteúdo não disponível até ser aberta
        messageType: data.messageType,
        timestamp: data.timestamp,
        ttl: data.ttl,
        isOpened: false,
        isRead: false,
        isDestroyed: false,
        preview: data.preview,
      };

      // Notificar sobre nova mensagem (sem conteúdo)
      this.notifyNewMessageNotification(message);

    } catch (error) {
      console.error('Erro ao processar notificação de mensagem:', error);
    }
  }

  // Processar conteúdo da mensagem após abertura
  static async handleMessageContent(data) {
    try {
      const encryptionService = EncryptionService.getInstance();
      const currentUser = AuthService.getCurrentUser();
      
      // Descriptografar mensagem
      const decryptedMessage = encryptionService.decryptMessage(
        data.content,
        'placeholder', // Será implementado com chaves reais
        currentUser.privateKey
      );

      const message = {
        id: data.messageId,
        content: decryptedMessage.message,
        messageType: data.messageType,
        timestamp: data.timestamp,
        ttl: data.ttl,
        openedAt: data.openedAt,
        isOpened: true,
        isRead: false,
        isDestroyed: false,
      };

      // Notificar sobre conteúdo da mensagem
      this.notifyMessageContent(message);

      // Iniciar timer de destruição
      this.startDestructionTimer(message);

    } catch (error) {
      console.error('Erro ao processar conteúdo da mensagem:', error);
    }
  }

  // Abrir mensagem (solicitar conteúdo)
  static async openMessage(messageId) {
    try {
      if (MessagingService.socket && MessagingService.socket.connected) {
        MessagingService.socket.emit('open_message', { messageId });
      }
    } catch (error) {
      console.error('Erro ao abrir mensagem:', error);
    }
  }

  // Iniciar timer de destruição da mensagem
  static startDestructionTimer(message) {
    setTimeout(() => {
      this.destroyMessage(message.id);
    }, message.ttl * 1000);
  }

  // Destruir mensagem
  static async destroyMessage(messageId) {
    try {
      // Notificar que mensagem foi destruída
      this.notifyMessageDestroyed(messageId);
      
      // Confirmar destruição no servidor
      if (MessagingService.socket && MessagingService.socket.connected) {
        MessagingService.socket.emit('message_destroyed', {messageId});
      }
    } catch (error) {
      console.error('Erro ao destruir mensagem:', error);
    }
  }

  // Marcar mensagem como lida
  static async markMessageAsRead(messageId) {
    try {
      if (MessagingService.socket && MessagingService.socket.connected) {
        MessagingService.socket.emit('message_read', {messageId});
      }
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
    }
  }

  // Obter lista de contatos/conversas
  static async getConversations() {
    try {
      const response = await axios.get(`${'http://192.168.0.33:3000'}/conversations`, {
        headers: {
          'Authorization': `Bearer ${await AuthService.getAuthToken()}`,
        },
      });

      if (response.data.success) {
        return response.data.conversations;
      } else {
        throw new Error('Erro ao obter conversas');
      }
    } catch (error) {
      console.error('Erro ao obter conversas:', error);
      throw error;
    }
  }

  // Obter histórico de mensagens (apenas mensagens não destruídas)
  static async getMessageHistory(conversationId) {
    try {
      const response = await axios.get(`${'http://192.168.0.33:3000'}/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${await AuthService.getAuthToken()}`,
        },
      });

      if (response.data.success) {
        // Descriptografar mensagens
        const encryptionService = EncryptionService.getInstance();
        const decryptedMessages = response.data.messages.map(msg => {
          try {
            const decrypted = encryptionService.decryptMessage(
              msg.content,
              msg.senderPublicKey,
              AuthService.getCurrentUser().privateKey
            );
            return {
              ...msg,
              content: decrypted.message,
            };
          } catch (error) {
            console.error('Erro ao descriptografar mensagem:', error);
            return msg;
          }
        });

        return decryptedMessages;
      } else {
        throw new Error('Erro ao obter histórico de mensagens');
      }
    } catch (error) {
      console.error('Erro ao obter histórico de mensagens:', error);
      throw error;
    }
  }

  // Processar fila de mensagens pendentes
  static async processMessageQueue() {
    try {
      if (MessagingService.socket && MessagingService.socket.connected) {
        while (MessagingService.messageQueue.length > 0) {
          const message = MessagingService.messageQueue.shift();
          MessagingService.socket.emit('send_message', message);
        }
      }
    } catch (error) {
      console.error('Erro ao processar fila de mensagens:', error);
    }
  }

  // Processar mensagem aberta
  static handleMessageOpened(data) {
    console.log('Mensagem aberta pelo destinatário:', data.messageId);
    this.notifyMessageOpened(data);
  }

  // Processar mensagem lida
  static handleMessageRead(data) {
    console.log('Mensagem marcada como lida:', data.messageId);
    this.notifyMessageRead(data);
  }

  // Processar mensagem destruída
  static handleMessageDestroyed(data) {
    console.log('Mensagem destruída:', data.messageId);
    this.notifyMessageDestroyed(data.messageId);
  }

  // Processar erros
  static handleMessageError(data) {
    console.error('Erro na mensagem:', data.error);
    this.notifyMessageError(data);
  }

  static handleMessageNotFound(data) {
    console.error('Mensagem não encontrada:', data.messageId);
    this.notifyMessageNotFound(data);
  }

  static handleMessageAccessDenied(data) {
    console.error('Acesso negado à mensagem:', data.messageId);
    this.notifyMessageAccessDenied(data);
  }

  static handleMessageAlreadyOpened(data) {
    console.error('Mensagem já foi aberta:', data.messageId);
    this.notifyMessageAlreadyOpened(data);
  }

  // Notificações para o UI
  static notifyNewMessageNotification(message) {
    // Enviar notificação push via OneSignal
    OneSignalNotificationService.sendEphemeralMessageNotification(
      message.senderId,
      message.senderName || 'Usuário'
    );
    
    // Log para monitoramento
    MonitoringService.logMessage('received', {
      messageId: message.id,
      senderId: message.senderId,
      messageType: message.messageType,
    });
    
    console.log('Nova mensagem efêmera recebida:', message);
  }

  static notifyMessageContent(message) {
    // Implementar sistema de notificações
    console.log('Conteúdo da mensagem recebido:', message);
  }

  static notifyMessageOpened(data) {
    // Implementar sistema de notificações
    console.log('Mensagem aberta:', data);
  }

  static notifyMessageRead(data) {
    // Implementar sistema de notificações
    console.log('Mensagem lida:', data);
  }

  static notifyMessageDestroyed(messageId) {
    // Implementar sistema de notificações
    console.log('Mensagem destruída:', messageId);
  }

  static notifyMessageError(data) {
    // Implementar sistema de notificações
    console.error('Erro na mensagem:', data);
  }

  static notifyMessageNotFound(data) {
    // Implementar sistema de notificações
    console.error('Mensagem não encontrada:', data);
  }

  static notifyMessageAccessDenied(data) {
    // Implementar sistema de notificações
    console.error('Acesso negado:', data);
  }

  static notifyMessageAlreadyOpened(data) {
    // Implementar sistema de notificações
    console.error('Mensagem já aberta:', data);
  }

  // Desconectar socket
  static disconnect() {
    if (MessagingService.socket) {
      MessagingService.socket.disconnect();
      MessagingService.socket = null;
    }
  }

  // Verificar status da conexão
  static isConnected() {
    return MessagingService.socket && MessagingService.socket.connected;
  }
}

export {MessagingService};

