import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AuthService } from '../services/AuthService';

const {width, height} = Dimensions.get('window');

const PhoneAuthScreen = ({navigation, route}) => {
  const { inviteCode } = route.params || {};
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationId, setVerificationId] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState({
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    dialCode: '+1',
    mask: '(###) ###-####'
  });
  
  // Gerar username baseado no código de convite específico
  const [inviteText] = useState(() => {
    if (!inviteCode) {
      return "You're invited to the new era of privacy";
    }
    
    // Em desenvolvimento, simular códigos especiais
    if (inviteCode === 'VO1D2024' || inviteCode === 'ADMIN' || inviteCode === 'BETA') {
      return "You're invited to the new era of privacy";
    }
    
    // Mapear códigos específicos para usuários específicos
    const inviteCodeToUser = {
      'ABC123': 'Maria',
      'XYZ789': 'João',
      'DEF456': 'Sophia',
      'GHI789': 'Lucas',
      'JKL012': 'Alex',
      'MNO345': 'Ana',
      'PQR678': 'Carlos',
      'STU901': 'Laura',
      'VWX234': 'Pedro',
      'YZA567': 'Isabel'
    };
    
    const inviterName = inviteCodeToUser[inviteCode];
    
    if (inviterName) {
      return `You're invited by ${inviterName} to the new era of privacy`;
    } else {
      // Para códigos não mapeados, usar hash do código para consistência
      const mockUsernames = ['alex', 'maria', 'joao', 'sophia', 'lucas'];
      const hash = inviteCode.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const randomUsername = mockUsernames[Math.abs(hash) % mockUsernames.length];
      
      return `You're invited by ${randomUsername} to the new era of privacy`;
    }
  });
  
  const countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', mask: '(###) ###-####' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', mask: '(###) ###-####' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54', mask: '### ###-####' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', mask: '(##) #####-####' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52', mask: '### ###-####' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', mask: '#### ### ####' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', mask: '### ########' },
    { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', mask: '## ## ## ## ##' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34', mask: '### ## ## ##' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39', mask: '### ### ####' },
  ];

  const handleCountrySelect = (countryCode) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      setPhoneNumber(''); // Limpar o número quando trocar de país
    }
  };

  const handlePhoneNumberChange = (text) => {
    // Se nenhum país estiver selecionado, apenas limpar caracteres não numéricos
    if (!selectedCountry.mask) {
      const numbers = text.replace(/\D/g, '');
      setPhoneNumber(numbers);
      return;
    }
    
    // Remover caracteres não numéricos
    const numbers = text.replace(/\D/g, '');
    
    // Aplicar máscara baseada no país selecionado
    let maskedNumber = '';
    let maskIndex = 0;
    
    for (let i = 0; i < numbers.length && maskIndex < selectedCountry.mask.length; i++) {
      if (selectedCountry.mask[maskIndex] === '#') {
        maskedNumber += numbers[i];
        maskIndex++;
      } else {
        maskedNumber += selectedCountry.mask[maskIndex];
        maskIndex++;
        i--; // Não avançar no número
      }
    }
    
    setPhoneNumber(maskedNumber);
  };

  const validatePhoneNumber = () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 8 && selectedCountry.code !== ''; // Validação mais flexível + país selecionado
  };

  const handleSendOTP = async () => {
    console.log('🚀 handleSendOTP iniciado');
    console.log('📱 Phone number:', phoneNumber);
    console.log('🌍 Selected country:', selectedCountry);
    
    if (!validatePhoneNumber()) {
      console.log('❌ Validação falhou');
      Alert.alert('Erro', 'Por favor, insira um número de telefone válido');
      return;
    }

    console.log('✅ Validação passou');
    setIsLoading(true);
    
    try {
      console.log('📦 AuthService já importado');
      
      const fullPhoneNumber = selectedCountry.dialCode + phoneNumber;
      console.log('📞 Número completo:', fullPhoneNumber);
      
      console.log('🔥 Chamando Twilio sendOTP...');
      const result = await AuthService.sendOTP(fullPhoneNumber);
      console.log('📨 Resultado do sendOTP:', result);
      
      if (result.success) {
        console.log('✅ OTP enviado com sucesso');
        setVerificationId(result.verificationId);
        
        // Navegar para a tela de verificação OTP
        console.log('🧭 Navegando para OTPVerification...');
        navigation.navigate('OTPVerification', {
          phoneNumber: fullPhoneNumber,
          inviteCode: inviteCode,
          sessionId: result.confirmation
        });
      } else {
        console.log('❌ Falha no envio do OTP');
      }
    } catch (error) {
      console.error('💥 Erro no handleSendOTP:', error);
      console.error('💥 Error message:', error.message);
      console.error('💥 Error stack:', error.stack);
      Alert.alert('Erro', error.message || 'Erro ao enviar código OTP');
    } finally {
      console.log('🏁 Finalizando handleSendOTP');
      setIsLoading(false);
    }
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
            {/* Texto de convite */}
            <Text style={styles.inviteText}>{inviteText}</Text>
            
            <Text style={styles.title}>Enter your phone number</Text>
            
            {/* Seleção de País */}
            <View style={styles.countrySelector}>
              <Picker
                selectedValue={selectedCountry.code}
                onValueChange={handleCountrySelect}
                style={styles.picker}
                itemStyle={styles.pickerItem}>
                {countries.map((country) => (
                  <Picker.Item
                    key={country.code}
                    label={`${country.flag} ${country.name} (${country.dialCode})`}
                    value={country.code}
                  />
                ))}
              </Picker>
            </View>

            {/* Campo de Telefone */}
            <TextInput
              style={styles.phoneInput}
              placeholder="Phone number"
              placeholderTextColor="#8E8E93"
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              keyboardType="phone-pad"
            />

            {/* Botão Send */}
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!validatePhoneNumber() || isLoading) && styles.sendButtonDisabled,
              ]} 
              onPress={handleSendOTP}
              disabled={!validatePhoneNumber() || isLoading}
            >
              <Text style={styles.sendButtonText}>
                {isLoading ? 'Sending...' : 'Send'}
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
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 160,
  },
  inviteText: {
    fontSize: 36,
    color: '#000000',
    textAlign: 'left',
    lineHeight: 42,
    opacity: 0.9,
    paddingHorizontal: 0,
    position: 'absolute',
    top: 10,
    left: 0,
    right: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 15,
  },
  countrySelector: {
    backgroundColor: '#F2F2F7',
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    width: '100%',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#000000',
  },
  pickerItem: {
    fontSize: 16,
    color: '#000000',
  },
  phoneInput: {
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
    fontWeight: '400',
  },
  sendButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default PhoneAuthScreen;