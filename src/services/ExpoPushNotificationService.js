import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

class ExpoPushNotificationService {
  static instance = null;

  static getInstance() {
    if (!ExpoPushNotificationService.instance) {
      ExpoPushNotificationService.instance = new ExpoPushNotificationService();
    }
    return ExpoPushNotificationService.instance;
  }

  static initialize() {
    const notificationService = ExpoPushNotificationService.getInstance();
    notificationService.setup();
    return notificationService;
  }

  setup() {
    console.log('🔔 Configurando Expo Push Notifications...');
    
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
        console.log('❌ Permissão de notificação negada');
        return null;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('✅ Token de notificação obtido:', token);
      
      // Salvar token no backend
      await this.saveTokenToBackend(token);
    } else {
      console.log('⚠️ Deve usar dispositivo físico para notificações push');
    }

    return token;
  }

  async saveTokenToBackend(token) {
    try {
      const { AuthService } = await import('./AuthService');
      const user = AuthService.currentUser;
      
      if (user) {
        // Enviar token para o backend
        const response = await fetch('http://localhost:3000/api/save-push-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await AuthService.getToken()}`
          },
          body: JSON.stringify({
            userId: user.id,
            pushToken: token,
            platform: Platform.OS
          })
        });

        if (response.ok) {
          console.log('✅ Token salvo no backend');
        } else {
          console.log('⚠️ Erro ao salvar token no backend');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao salvar token:', error);
    }
  }

  static setupNotificationListeners() {
    console.log('🔔 Configurando listeners de notificação...');
    
    // Listener para notificações recebidas
    Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notificação recebida:', notification);
      
      // Processar diferentes tipos de notificação
      const data = notification.request.content.data;
      if (data) {
        switch (data.type) {
          case 'ephemeral_message':
            console.log('💬 Nova mensagem efêmera de:', data.senderName);
            break;
          case 'system_announcement':
            console.log('📢 Anúncio do sistema:', data.message);
            break;
          case 'invite_accepted':
            console.log('🎉 Convite aceito por:', data.inviterName);
            break;
          default:
            console.log('📨 Notificação:', data);
        }
      }
    });

    // Listener para interações com notificações
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Usuário interagiu com notificação:', response);
      
      const data = response.notification.request.content.data;
      if (data) {
        // Navegar para tela específica baseada no tipo
        switch (data.type) {
          case 'ephemeral_message':
            // Navegar para chat
            break;
          case 'system_announcement':
            // Navegar para anúncios
            break;
          case 'invite_accepted':
            // Navegar para convites
            break;
        }
      }
    });
  }

  // Método para enviar notificação local (para testes)
  static async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'local',
            ...data
          },
        },
        trigger: null, // Enviar imediatamente
      });
      
      console.log('✅ Notificação local enviada:', title);
    } catch (error) {
      console.error('❌ Erro ao enviar notificação local:', error);
    }
  }

  // Método para enviar notificação efêmera
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
        trigger: null,
      });
      
      console.log('✅ Notificação efêmera enviada para:', recipientId);
    } catch (error) {
      console.error('❌ Erro ao enviar notificação efêmera:', error);
    }
  }
}

export default ExpoPushNotificationService;
