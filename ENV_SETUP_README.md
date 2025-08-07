# HetaSinglar Frontend Environment Configuration

## Environment Setup

This frontend is configured to work with both development and production environments using environment variables.

### Environment Files

- `.env` - Main environment file (currently set to production)
- `.env.development` - Development environment configuration
- `.env.production` - Production environment configuration

### Available Scripts

#### Development Mode
```bash
npm run start:dev    # Start with development environment (.env.development)
npm run build:dev    # Build with development environment
```

#### Production Mode
```bash
npm run start:prod   # Start with production environment (.env.production)
npm run build:prod   # Build with production environment
```

#### Default Mode
```bash
npm start           # Uses .env file (currently production settings)
npm run build       # Uses .env file (currently production settings)
```

### Environment Variables

#### API Configuration
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_WS_URL` - WebSocket server URL
- `REACT_APP_FRONTEND_URL` - Frontend URL (for affiliate links)

#### Current Settings

**Production (.env.production):**
- API: `https://api-hetasinglar.onrender.com/api`
- WebSocket: `wss://api-hetasinglar.onrender.com`
- Frontend: `https://hetasinglar.onrender.com`

**Development (.env.development):**
- API: `http://localhost:5000/api`
- WebSocket: `ws://localhost:5000`
- Frontend: `http://localhost:8000`

### Quick Environment Switching

To switch between environments, you can either:

1. **Use specific scripts:**
   ```bash
   npm run start:dev    # For development
   npm run start:prod   # For production
   ```

2. **Modify the main .env file:**
   - Comment/uncomment the appropriate lines in `.env`
   - Run `npm start` or `npm run build`

### Installation

Make sure to install the required dependencies:
```bash
npm install
```

This will install `env-cmd` which is required for environment-specific scripts.

### Deployment

For production deployment, the app will automatically use the production environment settings defined in `.env.production` when `NODE_ENV=production` is set.
