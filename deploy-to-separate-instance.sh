#!/bin/bash

echo "🚀 Configurable Frontend Deployment"
echo "==================================="

# Load configuration
source config.env

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${BLUE}🔧 $1${NC}"; }

# Check configuration
if [ "$FRONTEND_EC2_HOST" = "YOUR_NEW_FRONTEND_IP" ]; then
    log_error "Please update config.env with your actual frontend EC2 IP address"
    log_warn "Edit config.env and replace YOUR_NEW_FRONTEND_IP with your instance IP"
    exit 1
fi

log_info "Configuration loaded:"
log_info "Frontend Instance: $FRONTEND_EC2_HOST"
log_info "Backend API: $BACKEND_API_URL"
log_info "Frontend Domain: $FRONTEND_DOMAIN"

if [ "$SEPARATE_INSTANCE" = "true" ]; then
    log_info "Deploying to SEPARATE instance"
else
    log_info "Deploying to SAME instance as backend"
fi

# Check if key file exists
if [ ! -f "$FRONTEND_KEY_PATH" ]; then
    log_error "Key file not found: $FRONTEND_KEY_PATH"
    exit 1
fi

log_step "Step 1: Building frontend..."

# Build the frontend
npm run build:prod

if [ $? -ne 0 ]; then
    log_error "Frontend build failed!"
    exit 1
fi

log_step "Step 2: Creating deployment package..."

# Create deployment package
tar -czf frontend-deploy.tar.gz build/ src/ public/ package*.json .env.production *.config.js 2>/dev/null || tar -czf frontend-deploy.tar.gz build/ src/ public/ package*.json .env.production

log_step "Step 3: Testing connection..."

# Test SSH connection
ssh -i "$FRONTEND_KEY_PATH" -o ConnectTimeout=10 $FRONTEND_EC2_USER@$FRONTEND_EC2_HOST "echo 'Connection successful'"

if [ $? -ne 0 ]; then
    log_error "Cannot connect to frontend instance"
    log_warn "Please check:"
    log_warn "1. Instance is running"
    log_warn "2. Security group allows SSH"
    log_warn "3. IP address is correct"
    exit 1
fi

log_step "Step 4: Uploading files..."

# Upload deployment package
scp -i "$FRONTEND_KEY_PATH" frontend-deploy.tar.gz $FRONTEND_EC2_USER@$FRONTEND_EC2_HOST:/tmp/

log_step "Step 5: Deploying on frontend instance..."

# Deploy on frontend instance
ssh -i "$FRONTEND_KEY_PATH" $FRONTEND_EC2_USER@$FRONTEND_EC2_HOST << EOF
set -e

echo "🔧 Setting up frontend on separate instance..."

# Create frontend directory
sudo mkdir -p /home/ec2-user/hetasinglar-frontend
sudo chown ec2-user:ec2-user /home/ec2-user/hetasinglar-frontend

# Extract deployment package
cd /home/ec2-user/hetasinglar-frontend
tar -xzf /tmp/frontend-deploy.tar.gz
rm /tmp/frontend-deploy.tar.gz

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo dnf install -y nodejs
fi

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo dnf install -y nginx
fi

# Install dependencies
npm install --production

# Create nginx configuration for separate instance
sudo tee /etc/nginx/conf.d/hetasinglar-frontend.conf > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    listen [::]:80;
    server_name $FRONTEND_DOMAIN www.$FRONTEND_DOMAIN;
    
    root /home/ec2-user/hetasinglar-frontend/build;
    index index.html index.htm;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    # Handle React Router (SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # CORS headers for API requests
    location ~* \.(js|css)$ {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range";
    }
}
NGINX_EOF

# Remove default nginx config if it exists
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test and start nginx
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "✅ Frontend deployment completed on separate instance!"
EOF

log_step "Step 6: Cleaning up..."
rm -f frontend-deploy.tar.gz

log_step "Step 7: Updating DNS (if needed)..."
log_warn "Don't forget to update your DNS settings:"
log_warn "1. Point $FRONTEND_DOMAIN to $FRONTEND_EC2_HOST"
log_warn "2. Update DuckDNS if using duckdns.org"

echo ""
echo "=============================================="
log_info "🎉 Frontend Deployment Complete!"
echo "=============================================="
echo ""
echo "🌐 Frontend URLs:"
echo "   Main: http://$FRONTEND_DOMAIN"
echo "   IP:   http://$FRONTEND_EC2_HOST"
echo ""
echo "🔗 Backend API: $BACKEND_API_URL"
echo ""
echo "📋 Next Steps:"
echo "1. Update DNS to point $FRONTEND_DOMAIN to $FRONTEND_EC2_HOST"
echo "2. Set up SSL: sudo certbot --nginx -d $FRONTEND_DOMAIN"
echo "3. Test the application"
echo ""
echo "🔧 Instance Details:"
echo "   Frontend: $FRONTEND_EC2_HOST"
echo "   Backend:  apihetasinglar.duckdns.org"
EOF