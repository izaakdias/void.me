import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AuthService } from '../services/AuthService';

const OTPVerificationScreen = ({navigation, route}) => {
  const {phoneNumber, sessionId, inviteCode} = route.params;
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-focus no input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    // Timer de 60 segundos
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOTPChange = (text) => {
    // Aceitar apenas números e limitar a 6 dígitos
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    setOtpCode(cleaned);
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Iniciando verificação OTP...');
      console.log('📞 Phone:', phoneNumber);
      console.log('🔢 OTP:', otpCode);
      console.log('🆔 Session:', sessionId);
      
      console.log('✅ AuthService já importado estaticamente');
      
      const result = await AuthService.verifyOTP(phoneNumber, otpCode, sessionId);
      console.log('✅ Verificação OTP concluída:', result);
      
      if (result.success) {
        console.log('🎉 OTP verificado com sucesso!');
        
        // Se há código de convite, completar o registro
        if (inviteCode) {
          console.log('🎫 Completando registro com código de convite:', inviteCode);
          try {
            await AuthService.completeRegistration(inviteCode, result.user);
            console.log('✅ Registro completado com sucesso!');
          } catch (error) {
            console.error('❌ Erro ao completar registro:', error);
            // Mesmo com erro no registro, permitir continuar
          }
        } else {
          console.log('ℹ️ Nenhum código de convite - prosseguindo normalmente');
        }
        
        // Navegar para a tela principal
        console.log('🧭 Navegando para MainTabs...');
        try {
          navigation.navigate('MainTabs');
          console.log('✅ Navegação realizada com sucesso!');
        } catch (navError) {
          console.error('❌ Erro na navegação:', navError);
          throw navError;
        }
      } else {
        console.log('❌ OTP inválido');
        throw new Error('Código OTP inválido');
      }
    } catch (error) {
      console.error('💥 Erro completo na verificação OTP:', error);
      console.error('💥 Error message:', error.message);
      console.error('💥 Error stack:', error.stack);
      
      Alert.alert(
        'Erro', 
        error.message || 'Erro ao verificar código OTP. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      console.log('🏁 Finalizando verificação OTP');
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    setTimeLeft(60);
    setCanResend(false);
    
    // Reiniciar timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    Alert.alert('Code Sent', 'New OTP code sent! Use: 123456');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.placeholder} />
          </View>

          {/* Formulário */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Enter the One Time Password received:</Text>
            
            {/* Campo de OTP */}
            <TextInput
              ref={inputRef}
              style={styles.otpInput}
              placeholder="123456"
              placeholderTextColor="#8E8E93"
              value={otpCode}
              onChangeText={handleOTPChange}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              autoFocus
            />

            {/* Botão Send */}
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (otpCode.length !== 6 || isLoading) && styles.sendButtonDisabled,
              ]} 
              onPress={handleVerifyOTP}
              disabled={otpCode.length !== 6 || isLoading}
            >
              <Text style={styles.sendButtonText}>
                {isLoading ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>

            {/* Timer / Resend */}
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendOTP}
              disabled={!canResend}
              activeOpacity={0.7}>
              <Text style={[styles.resendButtonText, !canResend && styles.resendButtonDisabled]}>
                {canResend ? 'Request a new code' : `${timeLeft}s`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  placeholder: {
    width: 40,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 15,
  },
  otpInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#000000',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    width: '100%',
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '500',
  },
  sendButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  resendButton: {
    marginBottom: 30,
  },
  resendButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    textDecorationLine: 'underline',
  },
  resendButtonDisabled: {
    opacity: 0.5,
    textDecorationLine: 'none',
  },
});

export default OTPVerificationScreen;