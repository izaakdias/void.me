import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

class OneSignalNotificationService {
  static instance = null;

  static getInstance() {
    if (!OneSignalNotificationService.instance) {
      OneSignalNotificationService.instance = new OneSignalNotificationService();
    }
    return OneSignalNotificationService.instance;
  }

  static initialize(appId) {
    const notificationService = OneSignalNotificationService.getInstance();
    notificationService.setup(appId);
    return notificationService;
  }

  setup(appId) {
    console.log('Configurando Expo Notifications...');
    
    // Configurar comportamento das notificações
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    this.registerForPushNotificationsAsync();
  }

  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Permissão de notificação negada');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Token de notificação:', token);
    } else {
      console.log('Deve usar dispositivo físico para notificações push');
    }

    return token;
  }

  static setupEphemeralNotifications() {
    console.log('Configurando notificações efêmeras...');
    
    // Configurar listener para notificações recebidas
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificação recebida:', notification);
    });

    // Configurar listener para interações com notificações
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Resposta à notificação:', response);
    });
  }

  static async sendEphemeralMessageNotification(recipientId, senderName) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'vo1d',
          body: `Nova mensagem efêmera de ${senderName}`,
          data: { 
            type: 'ephemeral_message',
            recipientId,
            senderName 
          },
        },
        trigger: null, // Enviar imediatamente
      });
      
      console.log('Notificação efêmera enviada para:', recipientId);
    } catch (error) {
      console.error('Erro ao enviar notificação efêmera:', error);
    }
  }

  static async sendLocalNotification(title, message, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data,
        },
        trigger: null, // Enviar imediatamente
      });
      
      console.log('Notificação local enviada:', title);
    } catch (error) {
      console.error('Erro ao enviar notificação local:', error);
    }
  }

  static async sendInviteNotification(inviterName, inviteCode) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Convite vo1d',
          body: `${inviterName} te convidou para o vo1d! Código: ${inviteCode}`,
          data: { 
            type: 'invite',
            inviterName,
            inviteCode 
          },
        },
        trigger: null,
      });
      
      console.log('Notificação de convite enviada');
    } catch (error) {
      console.error('Erro ao enviar notificação de convite:', error);
    }
  }

  static async sendMessageDestroyedNotification(senderId, messageId) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'vo1d',
          body: 'Mensagem destruída',
          data: { 
            type: 'message_destroyed',
            senderId,
            messageId 
          },
        },
        trigger: null,
      });
      
      console.log('Notificação de mensagem destruída enviada');
    } catch (error) {
      console.error('Erro ao enviar notificação de mensagem destruída:', error);
    }
  }

  static async sendImageNotification(recipientId, senderName) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'vo1d',
          body: `Nova imagem efêmera de ${senderName}`,
          data: { 
            type: 'ephemeral_image',
            recipientId,
            senderName 
          },
        },
        trigger: null,
      });
      
      console.log('Notificação de imagem enviada para:', recipientId);
    } catch (error) {
      console.error('Erro ao enviar notificação de imagem:', error);
    }
  }

  static async sendOTPNotification(phoneNumber) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'vo1d',
          body: `Código OTP enviado para ${phoneNumber}`,
          data: { 
            type: 'otp_sent',
            phoneNumber 
          },
        },
        trigger: null,
      });
      
      console.log('Notificação OTP enviada');
    } catch (error) {
      console.error('Erro ao enviar notificação OTP:', error);
    }
  }

  static async sendAuthSuccessNotification(userName) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'vo1d',
          body: `Bem-vindo ao vo1d, ${userName}!`,
          data: { 
            type: 'auth_success',
            userName 
          },
        },
        trigger: null,
      });
      
      console.log('Notificação de sucesso de autenticação enviada');
    } catch (error) {
      console.error('Erro ao enviar notificação de sucesso:', error);
    }
  }

  static async sendErrorNotification(errorMessage) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'vo1d - Erro',
          body: errorMessage,
          data: { 
            type: 'error',
            errorMessage 
          },
        },
        trigger: null,
      });
      
      console.log('Notificação de erro enviada');
    } catch (error) {
      console.error('Erro ao enviar notificação de erro:', error);
    }
  }

  static async sendSystemNotification(message) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'vo1d',
          body: message,
          data: { 
            type: 'system',
            message 
          },
        },
        trigger: null,
      });
      
      console.log('Notificação do sistema enviada');
    } catch (error) {
      console.error('Erro ao enviar notificação do sistema:', error);
    }
  }

  static async clearAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('Todas as notificações foram limpas');
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  }

  static async getNotificationPermissions() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }

  static async requestNotificationPermissions() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      return false;
    }
  }
}

export default OneSignalNotificationService;