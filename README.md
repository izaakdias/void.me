# 📱 vo1d - Secure Messaging App

> **High-level privacy chat with ephemeral messages and end-to-end encryption**

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Start backend server
cd server && npm start
```

## 📁 Project Structure

```
vo1d-expo-new/
├── src/                    # React Native app source
├── server/                 # Backend API server
├── docs/                   # Documentation
├── scripts/                # Utility scripts
├── config/                 # Configuration files
├── assets/                 # App assets
└── backup/                 # Backup files
```

## 🔧 Development

- **Frontend:** React Native + Expo
- **Backend:** Node.js + Express
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Cache:** Redis
- **Push Notifications:** Expo Push API
- **SMS:** Twilio
- **Encryption:** AES-256 + SHA-256

## 📚 Documentation

- [Setup Guide](docs/SETUP.md)
- [API Documentation](docs/API.md)
- [Production Guide](docs/PRODUCTION.md)
- [Push Notifications](docs/EXPO_PUSH_GUIDE.md)

## 🛠️ Scripts

```bash
# Reset test data
./scripts/reset-test-code.sh

# Test push notifications
node scripts/test-push-notifications.js

# Test system integration
./scripts/test-system.sh
```

## 🚀 Production

See [Production Setup Guide](docs/PRODUCTION.md) for deployment instructions.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
