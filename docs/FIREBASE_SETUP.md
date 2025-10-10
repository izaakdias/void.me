# Configuração Firebase para vo1d
# Copie este arquivo para firebase-config.js e preencha com suas credenciais

// 1. Acesse: https://console.firebase.google.com/
// 2. Crie um novo projeto ou selecione um existente
// 3. Vá em "Project Settings" > "General" > "Your apps"
// 4. Adicione um app Web
// 5. Copie as credenciais abaixo

export const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Para o backend (Firebase Admin SDK):
// 1. Vá em "Project Settings" > "Service accounts"
// 2. Clique em "Generate new private key"
// 3. Baixe o arquivo JSON
// 4. Copie o conteúdo para server/config/firebase.js

export const firebaseAdminConfig = {
  type: "service_account",
  project_id: "seu-projeto-id",
  private_key_id: "abcdef1234567890abcdef1234567890abcdef12",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-xxxxx@seu-projeto-id.iam.gserviceaccount.com",
  client_id: "123456789012345678901",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40seu-projeto-id.iam.gserviceaccount.com"
};

// Configurações de autenticação
export const authConfig = {
  // Habilitar autenticação por telefone
  enablePhoneAuth: true,
  
  // Configurar reCAPTCHA
  recaptchaConfig: {
    size: 'invisible',
    badge: 'bottomright'
  },
  
  // Configurações de OTP
  otpConfig: {
    timeout: 60, // segundos
    maxAttempts: 3,
    resendCooldown: 30 // segundos
  }
};

