#!/bin/bash

# Fixed SSL Setup Script for HetaSinglar Frontend
echo "🔒 Setting up SSL for HetaSinglar Frontend (Fixed)"
echo "================================================"

# Configuration
DOMAIN="hetasinglar.se"
NGINX_CONF="/etc/nginx/conf.d/hetasinglar.conf"
EMAIL="contact@hetasinglar.se"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root or with sudo"
   exit 1
fi

log_info "Step 1: Installing Certbot..."

# Install EPEL repository and Certbot
if ! command -v certbot &> /dev/null; then
    log_info "Installing EPEL and Certbot..."
    dnf install -y epel-release
    dnf install -y certbot python3-certbot-nginx
    log_success "Certbot installed successfully"
else
    log_success "Certbot is already installed"
fi

log_info "Step 2: Checking Nginx configuration..."

# Verify nginx is running
if ! systemctl is-active --quiet nginx; then
    log_error "Nginx is not running. Please start nginx first."
    exit 1
fi

log_success "Nginx is running"

log_info "Step 3: Backing up current Nginx configuration..."

# Backup current nginx config
cp $NGINX_CONF ${NGINX_CONF}.backup
log_success "Configuration backed up to ${NGINX_CONF}.backup"

log_info "Step 4: Creating temporary configuration for SSL certificate..."

# Create web root for certbot validation
mkdir -p /var/www/html
chown -R nginx:nginx /var/www/html

# Temporarily simple config for certbot
cat > $NGINX_CONF << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name hetasinglar.se www.hetasinglar.se;
    
    root /var/www/html;
    index index.html;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        root /home/ec2-user/hetasinglar-frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Test and reload nginx
if nginx -t; then
    systemctl reload nginx
    log_success "Temporary configuration loaded"
else
    log_error "Nginx configuration test failed"
    exit 1
fi

log_info "Step 5: Obtaining SSL certificate..."

# Get SSL certificate
if certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect; then
    log_success "SSL certificate obtained and installed successfully!"
else
    log_error "Failed to obtain SSL certificate"
    log_warning "Restoring original configuration..."
    cp ${NGINX_CONF}.backup $NGINX_CONF
    systemctl reload nginx
    exit 1
fi

log_info "Step 6: Setting up automatic renewal..."

# Set up automatic renewal
systemctl enable certbot-renew.timer
systemctl start certbot-renew.timer

log_success "Automatic SSL renewal configured"

log_info "Step 7: Creating optimized SSL configuration..."

# Apply the final optimized SSL configuration
cat > $NGINX_CONF << 'EOF'
# HetaSinglar Frontend Configuration with SSL
server {
    listen 80;
    listen [::]:80;
    server_name hetasinglar.se www.hetasinglar.se;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name hetasinglar.se www.hetasinglar.se;
    
    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/hetasinglar.se/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hetasinglar.se/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Frontend application
    root /home/ec2-user/hetasinglar-frontend/build;
    index index.html index.htm;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
    
    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # API proxy (if needed)
    location /api/ {
        proxy_pass https://apihetasinglar.duckdns.org/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Test and reload nginx
if nginx -t; then
    systemctl reload nginx
    log_success "Final SSL configuration applied successfully!"
else
    log_error "Final configuration has errors, trying Certbot-managed config..."
    # Fallback to certbot-managed configuration
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --redirect --non-interactive
    if nginx -t; then
        systemctl reload nginx
        log_success "Certbot-managed SSL configuration applied!"
    else
        log_error "Configuration still has errors"
        exit 1
    fi
fi

echo ""
echo "=============================================="
log_success "🎉 SSL Setup Complete!"
echo "=============================================="
echo ""
echo "🌐 Your website is now available at:"
echo "   ✅ https://hetasinglar.se"
echo "   ✅ https://www.hetasinglar.se"
echo ""
echo "🔒 SSL Certificate Details:"
certbot certificates
echo ""
echo "📋 Useful Commands:"
echo "   Check SSL status:  sudo certbot certificates"
echo "   Renew SSL:         sudo certbot renew"
echo "   Test renewal:      sudo certbot renew --dry-run"
echo "   Nginx status:      sudo systemctl status nginx"
echo "   Nginx reload:      sudo systemctl reload nginx"
echo ""
log_success "SSL setup completed successfully! Your site is now secure. 🔐"