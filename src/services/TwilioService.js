import axios from 'axios';

class TwilioService {
  static instance = null;

  static getInstance() {
    if (!TwilioService.instance) {
      TwilioService.instance = new TwilioService();
    }
    return TwilioService.instance;
  }

  // Enviar código OTP via Twilio (REAL)
  static async sendOTP(phoneNumber) {
    console.log('🔥 TwilioService.sendOTP iniciado');
    console.log('📞 Phone number:', phoneNumber);
    
    try {
      console.log('📱 Chamando backend Twilio REAL...');
      
      // Chamar backend que usa Twilio
      const response = await axios.post(`http://192.168.0.33:3000/auth/send-otp`, {
        phoneNumber: phoneNumber
      });
      
      console.log('📨 Resultado do Twilio:', response.data);
      
      return {
        success: true,
        message: response.data.message,
        sessionId: response.data.sessionId,
      };
    } catch (error) {
      console.error('💥 Erro no TwilioService.sendOTP:', error);
      console.error('💥 Error message:', error.message);
      throw error;
    }
  }

  // Verificar código OTP via Twilio (REAL)
  static async verifyOTP(phoneNumber, otpCode, sessionId) {
    console.log('🔥 TwilioService.verifyOTP iniciado');
    console.log('📞 Phone number:', phoneNumber);
    console.log('🔢 OTP Code:', otpCode);
    console.log('🆔 Session ID:', sessionId);
    
    try {
      console.log('📱 Chamando backend Twilio REAL...');
      
      // Chamar backend que usa Twilio
      const response = await axios.post(`http://192.168.0.33:3000/auth/verify-otp`, {
        phoneNumber: phoneNumber,
        otpCode: otpCode,
        sessionId: sessionId
      });
      
      console.log('📨 Resultado do Twilio:', response.data);
      
      return {
        success: response.data.success,
        message: response.data.message,
        user: response.data.user,
        token: response.data.token,
      };
    } catch (error) {
      console.error('💥 Erro no TwilioService.verifyOTP:', error);
      console.error('💥 Error message:', error.message);
      throw error;
    }
  }
}

export { TwilioService };

