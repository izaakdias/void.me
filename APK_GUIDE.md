# 🚀 Guia para Gerar APK do vo1d

## Opção 1: Teste Rápido com Expo Go (Recomendado para testes imediatos)

1. **Instale o Expo Go no seu dispositivo Android:**
   - Baixe na Google Play Store: [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Execute o projeto localmente:**
   ```bash
   cd /home/izaak-dias/Downloads/vo1d-expo-new
   npx expo start --tunnel
   ```

3. **Escaneie o QR code** que aparecerá no terminal com o Expo Go

## Opção 2: Gerar APK Standalone (Para distribuição)

### Método Automático (Recomendado)

Execute o script que criei:
```bash
cd /home/izaak-dias/Downloads/vo1d-expo-new
./build-apk.sh
```

### Método Manual

1. **Configure o projeto EAS:**
   ```bash
   eas init --force
   ```

2. **Configure credenciais Android:**
   ```bash
   eas credentials --platform android
   ```
   - Escolha "preview" quando perguntado
   - Escolha "Generate a new Android Keystore" quando perguntado

3. **Gere o APK:**
   ```bash
   eas build --platform android --profile preview
   ```

4. **Aguarde o build** (pode levar 10-15 minutos)

5. **Baixe o APK** do link que será fornecido

## Opção 3: Build Local (Avançado)

Se você quiser gerar o APK localmente:

1. **Instale o Android Studio**
2. **Configure o ambiente Android**
3. **Use o comando:**
   ```bash
   npx expo run:android --variant release
   ```

## 📱 Informações do Projeto

- **Nome:** vo1d
- **Package:** com.vo1d.app
- **Versão:** 1.0.0
- **Projeto EAS:** @leaf-app/vo1d
- **URL do projeto:** https://expo.dev/accounts/leaf-app/projects/vo1d

## 🔧 Configurações Atuais

- ✅ Expo CLI instalado
- ✅ EAS CLI instalado
- ✅ Projeto EAS configurado
- ✅ Dependências instaladas
- ✅ Configuração Android pronta

## 📞 Suporte

Se encontrar problemas:
1. Verifique se está logado: `npx expo whoami`
2. Verifique o projeto: `eas project:info`
3. Consulte a documentação: https://docs.expo.dev/build/introduction/





