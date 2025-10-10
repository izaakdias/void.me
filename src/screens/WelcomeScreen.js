import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { api } from '../config/api';

const {width, height} = Dimensions.get('window');

const WelcomeScreen = ({navigation}) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState({
    code: 'BR',
    name: 'Brazil',
    flag: '🇧🇷',
    dialCode: '+55',
    mask: '(##) #####-####'
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  
  const countries = [
    { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', mask: '(##) #####-####' },
    { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', mask: '(###) ###-####' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54', mask: '### ###-####' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52', mask: '### ###-####' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', mask: '(###) ###-####' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', mask: '#### ### ####' },
    { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', mask: '## ## ## ## ##' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', mask: '### ########' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34', mask: '### ## ## ##' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39', mask: '### ### ####' },
  ];

  const handleInviteCodeChange = (text) => {
    // Converter para maiúsculo e limitar a 10 caracteres
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setInviteCode(cleaned);
  };

  const handleContinue = async () => {
    if (inviteCode.length < 3) {
      Alert.alert('Erro', 'Por favor, insira um código de convite válido');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🎫 Validando código de convite:', inviteCode);
      
      // Validar código de convite no backend
      const result = await api.verifyInviteCode(inviteCode);
      
      if (result.success) {
        console.log('✅ Código de convite válido!');
        Alert.alert(
          'Sucesso!', 
          `Código de convite válido!\n\nCódigo: ${inviteCode}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('PhoneAuth', { inviteCode })
            }
          ]
        );
      } else {
        throw new Error(result.message || 'Código de convite inválido');
      }
    } catch (error) {
      console.error('❌ Erro ao validar código de convite:', error);
      Alert.alert(
        'Código Inválido', 
        'Este código de convite não é válido ou já foi usado.\n\nPor favor, verifique o código ou entre em contato com quem te convidou.',
        [
          {
            text: 'OK',
            onPress: () => setInviteCode('')
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinWaitlist = () => {
    setShowWaitlistModal(true);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setPhoneNumber(''); // Limpar o número quando trocar de país
    setShowCountryPicker(false);
  };

  const handlePhoneNumberChange = (text) => {
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

  const handleJoinSubmit = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu número de telefone');
      return;
    }

    const fullPhoneNumber = `${selectedCountry.dialCode}${phoneNumber.replace(/\D/g, '')}`;
    
    try {
      console.log('📱 Adicionando à waitlist:', fullPhoneNumber);
      
      const result = await api.addToWaitlist(fullPhoneNumber);
      
      if (result.success) {
        Alert.alert(
          'Sucesso!',
          `Você foi adicionado à lista de espera!\n\nNúmero: ${fullPhoneNumber}\n\nVocê receberá uma notificação quando o vo1d estiver disponível.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowWaitlistModal(false);
                setPhoneNumber('');
              }
            }
          ]
        );
      } else {
        throw new Error(result.message || 'Erro ao adicionar à waitlist');
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar à waitlist:', error);
      Alert.alert(
        'Erro',
        'Não foi possível adicionar seu número à lista de espera. Tente novamente.',
        [
          {
            text: 'OK',
            onPress: () => setPhoneNumber('')
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        
        <View style={styles.content}>
          {/* Logo da Vo1d */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/white-icon.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Campo de código de convite */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Enter your invite code:</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inviteInput}
                placeholder="TESTRDK9IZ"
                placeholderTextColor="#8E8E93"
                value={inviteCode}
                onChangeText={handleInviteCodeChange}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={10}
              />
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={handleContinue}
                activeOpacity={0.8}>
                <Text style={styles.arrowText}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Link para QR Code */}
            <TouchableOpacity 
              style={styles.qrCodeLink}
              onPress={() => Alert.alert('QR Code', 'QR Code scanner will be implemented')}
              activeOpacity={0.7}>
              <Text style={styles.qrCodeText}>I have a QR Code</Text>
            </TouchableOpacity>

            {/* Link para waitlist */}
            <TouchableOpacity style={styles.waitlistLink} onPress={handleJoinWaitlist}>
              <Text style={styles.waitlistText}>Join the waitlist</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal para Waitlist */}
      <Modal
        visible={showWaitlistModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWaitlistModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.waitlistModalContent}>
            <Text style={styles.waitlistModalTitle}>Join the Waitlist</Text>
            
            {/* Seleção de País */}
            <TouchableOpacity 
              style={styles.countrySelector} 
              onPress={() => setShowCountryPicker(true)}
            >
              <Text style={styles.countryName}>{selectedCountry.name}</Text>
            </TouchableOpacity>

            {/* Campo de Telefone */}
            <TextInput
              style={styles.phoneInput}
              placeholder="Phone number"
              placeholderTextColor="#666"
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              keyboardType="phone-pad"
              autoFocus
            />

            {/* Botão Join */}
            <TouchableOpacity style={styles.joinButton} onPress={handleJoinSubmit}>
              <Text style={styles.joinButtonText}>Confirm</Text>
            </TouchableOpacity>

            {/* Botão Cancelar */}
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowWaitlistModal(false)}
            >
              <Text style={styles.cancelButtonText}>Return</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para Seleção de País */}
      <Modal
        visible={showCountryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar País</Text>
            <ScrollView style={styles.countryList}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={styles.countryItem}
                  onPress={() => handleCountrySelect(country)}
                >
                  <Text style={styles.countryItemFlag}>{country.flag}</Text>
                  <Text style={styles.countryItemName}>{country.name}</Text>
                  <Text style={styles.countryItemCode}>{country.dialCode}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCountryPicker(false)}
            >
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  logoImage: {
    width: 216,
    height: 216,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 340,
  },
  title: {
    fontSize: 18,
    color: '#000000',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    fontWeight: '500',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
    position: 'relative',
  },
  inviteInput: {
    width: '100%',
    backgroundColor: '#F2F2F7',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingRight: 60,
    fontSize: 20,
    color: '#000000',
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    textAlign: 'center',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    fontWeight: '500',
  },
  arrowButton: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: '#8E8E93',
    fontWeight: '600',
  },
      qrCodeLink: {
        marginTop: 5,
        paddingVertical: 10,
        paddingHorizontal: 20,
      },
      waitlistLink: {
        marginTop: 5,
        paddingVertical: 10,
        paddingHorizontal: 20,
      },
  qrCodeText: {
    fontSize: 16,
    color: '#8E8E93',
    textDecorationLine: 'underline',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    fontWeight: '500',
  },
  waitlistText: {
    fontSize: 16,
    color: '#8E8E93',
    textDecorationLine: 'underline',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    fontWeight: '500',
  },
  // Modal Waitlist Styles
  waitlistModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    marginTop: 'auto',
    height: 400,
  },
  waitlistModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
  },
  countrySelector: {
    backgroundColor: '#F2F2F7',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryName: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    fontWeight: '500',
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    fontWeight: '400',
  },
  joinButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8E8E93',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f161b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  countryList: {
    maxHeight: 300,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  countryItemFlag: {
    fontSize: 20,
    marginRight: 15,
  },
  countryItemName: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  countryItemCode: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: '#ffffff',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
});

export default WelcomeScreen;