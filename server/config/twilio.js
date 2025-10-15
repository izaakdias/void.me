// Configuração do Twilio
const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  authToken: process.env.TWILIO_AUTH_TOKEN || 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  phoneNumber: process.env.TWILIO_PHONE_NUMBER || '+1234567890'
};

module.exports = twilioConfig;







