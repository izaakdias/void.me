import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import SplashScreen from 'react-native-splash-screen';
import LinearGradient from 'react-native-linear-gradient';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import PhoneAuthScreen from './src/screens/PhoneAuthScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import InviteCodeScreen from './src/screens/InviteCodeScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Services
import {AuthService} from './src/services/AuthService';
import {EncryptionService} from './src/services/EncryptionService';
import ExpoPushNotificationService from './src/services/ExpoPushNotificationService';
import MonitoringService from './src/services/MonitoringService';

const Stack = createStackNavigator();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Inicializar monitoramento
      MonitoringService.initialize();
      MonitoringService.info('App inicializando');
      
      // Inicializar serviços
      await EncryptionService.initialize();
      
      // Inicializar Expo Push Notifications
      ExpoPushNotificationService.initialize();
      
      // Configurar listeners de notificação
      ExpoPushNotificationService.setupNotificationListeners();
      
      // Verificar se usuário já está autenticado
      const authStatus = await AuthService.checkAuthStatus();
      setIsAuthenticated(authStatus);
      
      MonitoringService.info('App inicializado com sucesso');
      
      // Esconder splash screen
      SplashScreen.hide();
    } catch (error) {
      console.error('Erro ao inicializar app:', error);
      MonitoringService.error('Erro ao inicializar app', {error: error.message});
      Alert.alert('Erro', 'Falha ao inicializar o aplicativo');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={styles.appTitle}>vo1d</Text>
          <Text style={styles.loadingText}>Inicializando...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: {backgroundColor: '#1a1a2e'},
          }}>
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
              <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
              <Stack.Screen name="InviteCode" component={InviteCodeScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="ChatList" component={ChatListScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textShadowColor: '#0f3460',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 10,
  },
  loadingText: {
    fontSize: 16,
    color: '#a0a0a0',
  },
});

export default App;

