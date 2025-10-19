#!/bin/bash

echo "🚀 HetaSinglar Frontend AWS Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${BLUE}🔧 $1${NC}"; }

# Configuration
FRONTEND_DIR="/home/ec2-user/hetasinglar-frontend"
NGINX_CONF="/etc/nginx/conf.d/hetasinglar.conf"
DOMAIN="hetasinglar.duckdns.org"
API_DOMAIN="apihetasinglar.duckdns.org"

# Check if running as ec2-user
if [ "$USER" != "ec2-user" ]; then
    log_error "Please run this as ec2-user, not root"
    exit 1
fi

log_step "Step 1: Installing system dependencies..."

# Install Node.js and npm if not already installed
if ! command -v node &> /dev/null; then
    log_info "Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo dnf install -y nodejs
fi

# Install nginx if not already installed
if ! command -v nginx &> /dev/null; then
    log_info "Installing Nginx..."
    sudo dnf install -y nginx
fi

# Verify installations
node_version=$(node --version 2>/dev/null || echo "Not installed")
npm_version=$(npm --version 2>/dev/null || echo "Not installed")
nginx_version=$(nginx -v 2>&1 | cut -d' ' -f3 || echo "Not installed")

log_info "Node.js version: $node_version"
log_info "npm version: $npm_version"
log_info "Nginx version: $nginx_version"

log_step "Step 2: Setting up frontend directory..."

# Create frontend directory
sudo mkdir -p $FRONTEND_DIR
sudo chown ec2-user:ec2-user $FRONTEND_DIR

# Navigate to frontend directory
cd $FRONTEND_DIR

log_step "Step 3: Cloning/updating frontend code..."

# If this is a fresh deployment, you would clone the repo here
# For now, we'll assume the code is being uploaded/copied

# Create package.json if it doesn't exist (template)
if [ ! -f "package.json" ]; then
    log_info "Creating package.json template..."
    cat > package.json << 'EOF'
{
  "name": "hetasinglar-frontend",
  "version": "0.1.0",
  "private": true,
  "homepage": "https://hetasinglar.duckdns.org",
  "dependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.10.0",
    "browser-image-compression": "^2.0.2",
    "chart.js": "^4.5.0",
    "date-fns": "^4.1.0",
    "dompurify": "^3.2.6",
    "env-cmd": "^10.1.0",
    "framer-motion": "^12.18.1",
    "react": "^19.0.0",
    "react-chartjs-2": "^5.3.0",
    "react-dom": "^19.0.0",
    "react-icons": "^5.5.0",
    "react-router-dom": "^7.1.5",
    "react-scripts": "5.0.1",
    "recharts": "^2.15.3",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "build:prod": "env-cmd -f .env.production react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.21",
    "tailwindcss": "^3.3.0"
  }
}
EOF
fi

log_step "Step 4: Creating production environment file..."

# Create production environment file
cat > .env.production << 'EOF'
# Production Environment Configuration for AWS
PORT=3000
NODE_ENV=production
REACT_APP_API_URL=https://apihetasinglar.duckdns.org/api
REACT_APP_WS_URL=wss://apihetasinglar.duckdns.org
REACT_APP_FRONTEND_URL=https://hetasinglar.duckdns.org

# Build Configuration
GENERATE_SOURCEMAP=false
DISABLE_ESLINT_PLUGIN=false

# Production Settings
REACT_APP_ENV=production
PUBLIC_URL=https://hetasinglar.duckdns.org
SKIP_PREFLIGHT_CHECK=true
BROWSER=none
EOF

chmod 600 .env.production
log_info "Created .env.production with AWS domain configuration"

log_step "Step 5: Installing frontend dependencies..."

# Install dependencies with increased timeout
npm install --timeout=300000 --maxsockets=1

if [ $? -ne 0 ]; then
    log_error "npm install failed!"
    log_warn "Trying with --legacy-peer-deps..."
    npm install --legacy-peer-deps --timeout=300000
fi

log_step "Step 6: Building production frontend..."

# Build the frontend for production
npm run build:prod

if [ $? -ne 0 ]; then
    log_error "Frontend build failed!"
    exit 1
fi

log_info "Frontend build completed successfully"

log_step "Step 7: Configuring Nginx..."

# Create Nginx configuration
sudo tee $NGINX_CONF > /dev/null << EOF
# HetaSinglar Frontend Configuration
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (you'll need to add SSL certificates)
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # For now, let's serve HTTP until SSL is configured
    # Remove this block and uncomment SSL when ready
}

# HTTP configuration for now (until SSL is configured)
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    
    root $FRONTEND_DIR/build;
    index index.html index.htm;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Handle React Router (SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

log_info "Nginx configuration created"

log_step "Step 8: Testing and starting Nginx..."

# Test Nginx configuration
sudo nginx -t

if [ $? -ne 0 ]; then
    log_error "Nginx configuration test failed!"
    exit 1
fi

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl restart nginx

# Check if Nginx is running
if sudo systemctl is-active --quiet nginx; then
    log_info "Nginx is running successfully"
else
    log_error "Nginx failed to start"
    sudo systemctl status nginx --no-pager
    exit 1
fi

log_step "Step 9: Setting up SSL (Let's Encrypt)..."

# Install certbot for SSL
if ! command -v certbot &> /dev/null; then
    log_info "Installing Certbot for SSL..."
    sudo dnf install -y certbot python3-certbot-nginx
fi

log_warn "SSL certificate setup:"
log_warn "Run this command to get SSL certificate:"
log_warn "sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"

log_step "Step 10: Creating deployment scripts..."

# Create update script
cat > update-frontend.sh << 'EOF'
#!/bin/bash
echo "🔄 Updating HetaSinglar Frontend..."

cd /home/ec2-user/hetasinglar-frontend

# Pull latest changes (if using git)
# git pull origin main

# Install any new dependencies
npm install

# Build the updated frontend
npm run build:prod

# Restart nginx to serve new build
sudo systemctl reload nginx

echo "✅ Frontend updated successfully!"
EOF

chmod +x update-frontend.sh

log_info "Created update-frontend.sh script"

log_step "Step 11: Final configuration..."

# Create a systemd service for auto-updating (optional)
sudo tee /etc/systemd/system/hetasinglar-frontend-watcher.service > /dev/null << EOF
[Unit]
Description=HetaSinglar Frontend File Watcher
After=network.target

[Service]
Type=oneshot
User=ec2-user
WorkingDirectory=$FRONTEND_DIR
ExecStart=/bin/bash $FRONTEND_DIR/update-frontend.sh

[Install]
WantedBy=multi-user.target
EOF

# Set proper permissions
sudo chown -R ec2-user:ec2-user $FRONTEND_DIR
sudo chmod -R 755 $FRONTEND_DIR/build

echo ""
echo "=============================================="
log_info "🎉 Frontend Deployment Complete!"
echo "=============================================="
echo ""
echo "📊 Service Status:"
sudo systemctl status nginx --no-pager
echo ""
echo "🌐 Frontend URLs:"
echo "   Main site: http://$DOMAIN"
echo "   With SSL:  https://$DOMAIN (after SSL setup)"
echo ""
echo "📋 Useful Commands:"
echo "   Update frontend:   ./update-frontend.sh"
echo "   Nginx status:      sudo systemctl status nginx"
echo "   Nginx reload:      sudo systemctl reload nginx"
echo "   Nginx logs:        sudo tail -f /var/log/nginx/access.log"
echo "   Error logs:        sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🔒 SSL Setup:"
echo "   Run: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "📁 Frontend Directory: $FRONTEND_DIR"
echo "📁 Build Directory: $FRONTEND_DIR/build"
echo ""
echo "🚀 Your frontend is now served by Nginx on AWS!"