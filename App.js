import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';

// Importar nossas telas
import WelcomeScreen from './src/screens/WelcomeScreen';
import PhoneAuthScreen from './src/screens/PhoneAuthScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import InviteCodeScreen from './src/screens/InviteCodeScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Manter a splash screen visível enquanto carregamos
SplashScreen.preventAutoHideAsync();

// Tab Navigator para as telas principais
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: 'rgba(0, 0, 0, 0.1)',
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 58,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: 'rgba(0, 0, 0, 0.4)',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            activeOpacity={0.6}
            style={[
              props.style,
              {
                borderRadius: 8,
                marginHorizontal: 4,
                paddingVertical: 4,
              }
            ]}
          />
        ),
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#000000',
            headerTitleStyle: {
              fontWeight: '600',
              fontSize: 24,
              textAlign: 'center',
            },
      }}
    >
      <Tab.Screen 
        name="Messages" 
        component={ChatListScreen}
        options={{
          title: 'Messages',
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Invites" 
        component={InviteCodeScreen}
        options={{
          title: 'Invites',
          tabBarLabel: 'Invites',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mail-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Inicializando app vo1d...');
      
      // Configurar navigation bar do Android
      if (Platform.OS === 'android') {
        await NavigationBar.setVisibilityAsync('hidden');
        await NavigationBar.setBehaviorAsync('overlay-swipe');
      }
      
      // Aguardar um pouco para garantir que tudo carregue
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Esconder splash screen
      await SplashScreen.hideAsync();
      
      setIsLoading(false);
      console.log('✅ App inicializado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao inicializar app:', error);
      setError(error.message);
      await SplashScreen.hideAsync();
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Carregando vo1d...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar style="light" />
        <Text style={styles.errorTitle}>Erro</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

      return (
        <NavigationContainer>
          <StatusBar style="dark" />
      <Stack.Navigator 
        initialRouteName="Welcome"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#000000',
              headerTitleStyle: {
                fontWeight: '600',
                textAlign: 'center',
              },
        }}
      >
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen} 
          options={{ headerShown: false }}
        />
            <Stack.Screen 
              name="PhoneAuth" 
              component={PhoneAuthScreen} 
              options={{ title: 'Authentication' }}
            />
            <Stack.Screen 
              name="OTPVerification" 
              component={OTPVerificationScreen} 
              options={{ title: 'Confirm your number' }}
            />
        <Stack.Screen 
          name="InviteCode" 
          component={InviteCodeScreen} 
          options={{ title: 'Código de Convite' }}
        />
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs} 
              options={{ headerShown: false }}
            />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={{ title: 'Chat' }}
        />
      </Stack.Navigator>
        {/* Container para reCAPTCHA do Firebase */}
        <View id="recaptcha-container" style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1, opacity: 0 }} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#F44336',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
});