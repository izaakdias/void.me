# Configuração do Twilio

## Variáveis de Ambiente Necessárias:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

## Como Configurar:

1. **Criar conta no Twilio**: https://www.twilio.com/
2. **Obter Account SID**: Dashboard → Account Info
3. **Obter Auth Token**: Dashboard → Account Info
4. **Comprar número de telefone**: Phone Numbers → Buy a number
5. **Configurar variáveis**: Adicionar no .env do servidor

## Teste de Configuração:

```bash
# Testar se as variáveis estão configuradas
curl -X POST "http://147.93.66.253:3000/api/send-invite" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+5511999999999"}'
```

## Logs Esperados:

```
📱 SMS enviado via Twilio para +5511999999999: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Fallback:

Se o Twilio não estiver configurado, o sistema usa SMS simulado:
```
📱 SMS simulado para +5511999999999: Seu código de convite para void. é: ABC123
```
