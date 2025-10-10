import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {EncryptionService} from './EncryptionService';
import {TwilioService} from './TwilioService';
import axios from 'axios';
import Constants from 'expo-constants';

class AuthService {
  static instance = null;
  static currentUser = null;

  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Helper para salvar dados com fallback
  static async safeSetItem(key, value) {
    try {
      console.log(`🔐 Tentando salvar ${key} no SecureStore...`);
      await SecureStore.setItemAsync(key, value);
      console.log(`✅ ${key} salvo no SecureStore com sucesso`);
    } catch (error) {
      console.warn(`⚠️ Erro no SecureStore, usando AsyncStorage para ${key}:`, error.message);
      try {
        await AsyncStorage.setItem(key, value);
        console.log(`✅ ${key} salvo no AsyncStorage com sucesso`);
      } catch (asyncError) {
        console.error(`❌ Erro ao salvar ${key} em ambos os storages:`, asyncError);
        throw asyncError;
      }
    }
  }

  // Verificar status de autenticação
  static async checkAuthStatus() {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userData = await SecureStore.getItemAsync('user_data');
      
      if (token && userData) {
        const userDataObject = JSON.parse(userData);
        AuthService.currentUser = userDataObject;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao verificar status de autenticação:', error);
      return false;
    }
  }

  // Enviar código OTP para o telefone
  static async sendOTP(phoneNumber) {
    console.log('🔥 AuthService.sendOTP iniciado');
    console.log('📞 Phone number recebido:', phoneNumber);
    
    try {
      // Validar formato do telefone
      if (!this.validatePhoneNumber(phoneNumber)) {
        console.log('❌ Número de telefone inválido');
        throw new Error('Número de telefone inválido');
      }

      console.log('✅ Número de telefone válido');
      console.log('🔥 Chamando Twilio REAL...');
      
      // Usar Twilio REAL (envia SMS real)
      const result = await TwilioService.sendOTP(this.formatPhoneNumber(phoneNumber));
      console.log('📨 Resultado do Firebase:', result);
      
      return {
        success: true,
        message: result.message,
        confirmation: result.sessionId,
      };
    } catch (error) {
      console.error('💥 Erro no AuthService.sendOTP:', error);
      console.error('💥 Error message:', error.message);
      console.error('💥 Error stack:', error.stack);
      throw error;
    }
  }

  // Verificar código OTP
  static async verifyOTP(phoneNumber, otpCode, sessionId) {
    console.log('🔥 AuthService.verifyOTP iniciado');
    console.log('📞 Phone number:', phoneNumber);
    console.log('🔢 OTP Code:', otpCode);
    console.log('🆔 Session ID:', sessionId);
    
    try {
      console.log('🔥 Verificando com Twilio REAL...');
      
      // Usar Twilio REAL
      const result = await TwilioService.verifyOTP(phoneNumber, otpCode, sessionId);
      console.log('📨 Resultado do Twilio:', result);
      
      if (result.success) {
        const { user, token } = result;
        
        // Inicializar EncryptionService se necessário
        try {
          await EncryptionService.initialize();
          console.log('✅ EncryptionService inicializado');
        } catch (error) {
          console.warn('⚠️ Erro ao inicializar EncryptionService:', error.message);
        }
        
        // Armazenar token e dados do usuário
        console.log('🔐 Token recebido:', token);
        console.log('🔐 Tipo do token:', typeof token);
        console.log('🔐 Token é string?', typeof token === 'string');
        console.log('🔐 Token length:', token ? token.length : 'undefined');
        
        // Garantir que o token é uma string
        const tokenString = typeof token === 'string' ? token : String(token);
        console.log('🔐 Token final:', tokenString);
        
        // Salvar usando função helper com fallback
        await AuthService.safeSetItem('auth_token', tokenString);
        
        console.log('🔐 Salvando dados do usuário como JSON...');
        const userDataString = JSON.stringify(user);
        console.log('🔐 Tipo do userDataString:', typeof userDataString);
        await AuthService.safeSetItem('user_data', userDataString);
        
        AuthService.currentUser = user;
        
        return {
          success: true,
          message: 'Autenticação realizada com sucesso',
          user,
        };
      } else {
        throw new Error(result.message || 'Código OTP inválido');
      }
    } catch (error) {
      console.error('Erro ao verificar OTP:', error);
      throw error;
    }
  }

  // Validar código de convite
  static async validateInviteCode(inviteCode) {
    try {
      const response = await axios.post(`${'http://192.168.0.33:3000'}/auth/validate-invite`, {
        inviteCode: inviteCode.toUpperCase(),
      });

      if (response.data.success) {
        return {
          success: true,
          inviter: response.data.inviter,
          message: 'Código de convite válido',
        };
      } else {
        throw new Error(response.data.message || 'Código de convite inválido');
      }
    } catch (error) {
      console.error('Erro ao validar código de convite:', error);
      throw error;
    }
  }

  // Finalizar registro com código de convite
  static async completeRegistration(inviteCode, userData) {
    try {
      const response = await axios.post(`${'http://192.168.0.33:3000'}/auth/complete-registration`, {
        inviteCode: inviteCode.toUpperCase(),
        userData,
      }, {
        headers: {
          'Authorization': `Bearer ${await SecureStore.getItemAsync('auth_token')}`,
        },
      });

      if (response.data.success) {
        // Atualizar dados do usuário
        const encryptedUserData = EncryptionService.getInstance().encryptLocalData(response.data.user);
        await SecureStore.setItemAsync('user_data', encryptedUserData);
        AuthService.currentUser = response.data.user;
        
        return {
          success: true,
          message: 'Registro concluído com sucesso',
          user: response.data.user,
        };
      } else {
        throw new Error(response.data.message || 'Erro ao completar registro');
      }
    } catch (error) {
      console.error('Erro ao completar registro:', error);
      throw error;
    }
  }

  // Gerar código de convite para o usuário atual
  static async generateInviteCode() {
    try {
      const response = await axios.post(`${'http://192.168.0.33:3000'}/auth/generate-invite`, {}, {
        headers: {
          'Authorization': `Bearer ${await SecureStore.getItemAsync('auth_token')}`,
        },
      });

      if (response.data.success) {
        return {
          success: true,
          inviteCode: response.data.inviteCode,
          message: 'Código de convite gerado com sucesso',
        };
      } else {
        throw new Error(response.data.message || 'Erro ao gerar código de convite');
      }
    } catch (error) {
      console.error('Erro ao gerar código de convite:', error);
      throw error;
    }
  }

  // Logout
  static async logout() {
    try {
      // Logout simples (Twilio não precisa de logout)
      
      // Limpar dados locais
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');
      
      // Limpar chaves de criptografia
      await EncryptionService.getInstance().clearKeys();
      
      // Limpar usuário atual
      AuthService.currentUser = null;
      
      console.log('Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  }

  // Obter usuário atual
  static getCurrentUser() {
    return AuthService.currentUser;
  }

  // Obter token de autenticação
  static async getAuthToken() {
    return await SecureStore.getItemAsync('auth_token');
  }

  // Validar formato do telefone
  static validatePhoneNumber(phoneNumber) {
    // Remover caracteres não numéricos
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Validar se tem pelo menos 10 dígitos
    return cleanNumber.length >= 10 && cleanNumber.length <= 15;
  }

  // Formatar número de telefone
  static formatPhoneNumber(phoneNumber) {
    // Remover caracteres não numéricos
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Adicionar código do país se não tiver
    if (!cleanNumber.startsWith('55') && cleanNumber.length === 11) {
      cleanNumber = '55' + cleanNumber;
    }
    
    return cleanNumber;
  }

  // Verificar se usuário está autenticado
  static isAuthenticated() {
    return AuthService.currentUser !== null;
  }

  // Renovar token
  static async refreshToken() {
    try {
      const response = await axios.post(`${'http://192.168.0.33:3000'}/auth/refresh`, {}, {
        headers: {
          'Authorization': `Bearer ${await SecureStore.getItemAsync('auth_token')}`,
        },
      });

      if (response.data.success) {
        await SecureStore.setItemAsync('auth_token', response.data.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return false;
    }
  }
}

export {AuthService};

