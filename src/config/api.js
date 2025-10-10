// Configuração da API
const API_CONFIG = {
  // URLs do backend
  LOCAL: 'http://localhost:3000',
  RAILWAY: 'https://vo1d-expo-new-production-b90a.up.railway.app',
  
  // Ambiente atual (mudar para 'production' quando deployar)
  ENVIRONMENT: 'production', // 'development' ou 'production'
  
  // Timeout das requisições
  TIMEOUT: 10000,
  
  // Headers padrão
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  }
};

// Função para obter a URL base
export const getBaseURL = () => {
  return API_CONFIG.ENVIRONMENT === 'production' 
    ? API_CONFIG.RAILWAY 
    : API_CONFIG.LOCAL;
};

// Função para fazer requisições HTTP
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${getBaseURL()}${endpoint}`;
  
  const config = {
    method: 'GET',
    headers: {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...options.headers,
    },
    timeout: API_CONFIG.TIMEOUT,
    ...options,
  };
  
  try {
    console.log(`🌐 API Request: ${config.method} ${url}`);
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ API Response: ${url}`, data);
    
    return data;
  } catch (error) {
    console.error(`❌ API Error: ${url}`, error);
    throw error;
  }
};

// Funções específicas da API
export const api = {
  // Health check
  health: () => apiRequest('/health'),
  
  // Waitlist
  addToWaitlist: (phone) => 
    apiRequest('/api/waitlist', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
  
  // Mensagens
  sendMessage: (to, message, type = 'text') =>
    apiRequest('/api/send-message', {
      method: 'POST',
      body: JSON.stringify({ to, message, type }),
    }),
  
  getMessages: (phone) =>
    apiRequest(`/api/messages/${encodeURIComponent(phone)}`),
  
  // Autenticação
  verifyInviteCode: (code) =>
    apiRequest('/api/verify-invite', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  
  // Socket.IO
  getSocketURL: () => getBaseURL(),
};

export default API_CONFIG;
