# vo1d - Secure Messaging App

> **High-level privacy chat with ephemeral messages and end-to-end encryption**

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Start backend server
cd server && npm install && npm start
```

## Project Structure

```
vo1d/
├── src/                    # React Native app source
│   ├── components/         # Reusable components
│   ├── screens/           # App screens
│   ├── services/          # API services
│   ├── config/            # App configuration
│   └── assets/            # App assets
├── server/                 # Backend API server
│   ├── config/            # Server configuration
│   ├── scripts/           # Database scripts
│   └── data/              # Database files
├── landing/                # Landing page
├── docs/                   # Documentation
│   ├── guides/            # Setup guides
│   ├── api/               # API documentation
│   └── setup/             # Setup scripts
└── config/                 # Global configuration
```

## Tech Stack

- **Frontend:** React Native + Expo
- **Backend:** Node.js + Express
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Push Notifications:** Expo Push API
- **SMS:** Twilio
- **Encryption:** AES-256 + SHA-256
- **Landing Page:** Vanilla HTML/CSS/JS

## Documentation

- [Setup Guide](docs/guides/SETUP.md)
- [API Documentation](docs/api/)
- [Production Guide](docs/guides/PRODUCTION.md)
- [Push Notifications](docs/guides/EXPO_PUSH_GUIDE.md)

## Development Scripts

```bash
# Test system integration
node scripts/test-integration.js

# Test push notifications
node scripts/test-push-notifications.js

# Reset test data
node scripts/reset-test-data.js
```

## Production Deployment

See [Production Setup Guide](docs/guides/PRODUCTION.md) for deployment instructions.

## License

MIT License - see [LICENSE](LICENSE) for details.