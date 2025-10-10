import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

// Importar nossas telas
import WelcomeScreen from './src/screens/WelcomeScreen';
import PhoneAuthScreen from './src/screens/PhoneAuthScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import InviteCodeScreen from './src/screens/InviteCodeScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Importar nossos serviços
import MonitoringService from './src/services/MonitoringService';
import OneSignalNotificationService from './src/services/OneSignalNotificationService';

const Stack = createStackNavigator();

// Manter a splash screen visível enquanto carregamos
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Inicializar serviços de monitoramento
      MonitoringService.initialize();
      MonitoringService.info('vo1d Expo App', 'Inicializando aplicativo...');

      // Inicializar Expo Notifications
      OneSignalNotificationService.initialize('expo-notifications');
      OneSignalNotificationService.setupEphemeralNotifications();

      // Esconder splash screen após inicialização
      await SplashScreen.hideAsync();
      
      MonitoringService.info('vo1d Expo App', 'Aplicativo inicializado com sucesso!');
    } catch (error) {
      console.error('Erro ao inicializar app:', error);
      MonitoringService.error('vo1d Expo App', 'Erro na inicialização', error);
      await SplashScreen.hideAsync();
    }
  };

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator 
        initialRouteName="Welcome"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen} 
          options={{ title: 'vo1d' }}
        />
        <Stack.Screen 
          name="PhoneAuth" 
          component={PhoneAuthScreen} 
          options={{ title: 'Autenticação' }}
        />
        <Stack.Screen 
          name="OTPVerification" 
          component={OTPVerificationScreen} 
          options={{ title: 'Verificação OTP' }}
        />
        <Stack.Screen 
          name="InviteCode" 
          component={InviteCodeScreen} 
          options={{ title: 'Código de Convite' }}
        />
        <Stack.Screen 
          name="ChatList" 
          component={ChatListScreen} 
          options={{ title: 'Conversas' }}
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={{ title: 'Chat' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Configurações' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}