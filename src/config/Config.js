// Configuração centralizada do servidor
const Config = {
  // URL do servidor - mudar aqui para alterar em todo o app
  SERVER_URL: 'http://147.93.66.253:3000',
  
  // URLs alternativas para desenvolvimento
  LOCAL_URL: 'http://192.168.0.33:3000',
  VPS_URL: 'http://147.93.66.253:3000',
  
  // Configurações de timeout
  TIMEOUT: 10000,
  
  // Configurações de mensagem
  MESSAGE_TTL: 5, // minutos
  MAX_MESSAGE_LENGTH: 1000,
  
  // Configurações de imagem
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  IMAGE_QUALITY: 0.8,
};

export default Config;





