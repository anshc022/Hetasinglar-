# Environment Configuration Guide

This guide explains how to properly configure environment variables for the Hetasinglar frontend application.

## Environment Files

### 📁 Available Environment Files

- **`.env`** - Local development (default)
- **`.env.local`** - Local production testing
- **`.env.production`** - Production deployment
- **`.env.development`** - Development overrides
- **`.env.vercel`** - Vercel-specific settings

### 🔧 Environment Priority

React loads environment files in this order (highest priority first):
1. `.env.local`
2. `.env.production` (when NODE_ENV=production)
3. `.env.development` (when NODE_ENV=development)
4. `.env`

## Configuration Details

### 🌍 API Endpoints

| Environment | API URL | WebSocket URL |
|-------------|---------|---------------|
| Local Dev | `http://localhost:5000/api` | `ws://localhost:5000` |
| Production | `https://apihetasinglar.duckdns.org/api` | `wss://apihetasinglar.duckdns.org` |

### 🚀 Performance Settings

```bash
# Build optimizations
GENERATE_SOURCEMAP=false          # Reduces build size
REACT_APP_CACHE_ENABLED=true      # Enable client-side caching
REACT_APP_API_TIMEOUT=30000       # API request timeout (30s)
```

### 🔒 Security Settings

```bash
# Production security
REACT_APP_SECURE_COOKIES=true     # HTTPS-only cookies
REACT_APP_DEBUG_MODE=false        # Disable debug logs
REACT_APP_LOG_LEVEL=error         # Minimal logging
```

## Usage Instructions

### 🖥️ Local Development
```bash
# Uses .env file
npm start
```

### 🧪 Local Production Testing
```bash
# Uses .env.local file
npm run build
npm run serve
```

### 🌐 Production Deployment
```bash
# Uses .env.production file
NODE_ENV=production npm run build
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API base URL | `https://apihetasinglar.duckdns.org/api` |
| `REACT_APP_WS_URL` | WebSocket server URL | `wss://apihetasinglar.duckdns.org` |
| `REACT_APP_FRONTEND_URL` | Frontend application URL | `https://hetasinglar.vercel.app` |
| `REACT_APP_ENVIRONMENT` | Current environment | `production` or `development` |
| `PORT` | Development server port | `8000` |

## Troubleshooting

### 🔧 Common Issues

1. **CORS Errors**: Ensure your backend CORS settings include your frontend URL
2. **WebSocket Connection Fails**: Check if WebSocket URL matches your backend
3. **API Calls Fail**: Verify API URL is correct and backend is running

### 🔍 Debug Mode

To enable debug mode for troubleshooting:
```bash
REACT_APP_DEBUG_MODE=true
REACT_APP_LOG_LEVEL=debug
```

## Deployment Notes

- **Vercel**: Automatically uses `.env.production`
- **Local Testing**: Use `.env.local` to test production settings locally
- **Security**: Never commit sensitive data to environment files

---

*Last updated: August 28, 2025*
