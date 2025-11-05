#!/bin/bash

echo "🔧 Fixing React Router + Static Files Issue"
echo "=========================================="

# This script fixes the common issue where nested routes (like /agent/login) 
# fail to load static assets in React applications

echo "Problem: Static files (CSS, JS) fail to load on nested routes like:"
echo "❌ https://hetasinglar.se/agent/login"
echo "❌ https://hetasinglar.se/admin/login"
echo ""

echo "✅ Root routes work fine:"
echo "✅ https://hetasinglar.se/"
echo "✅ https://hetasinglar.se/login"
echo ""

echo "🎯 Solutions Applied:"
echo ""

echo "1. 📝 Fixed PUBLIC_URL configuration"
echo "   Changed from: PUBLIC_URL=. (relative)"
echo "   Changed to:   PUBLIC_URL=/ (absolute)"
echo ""

echo "2. 🔧 Web Server Configuration Needed:"
echo ""

echo "If using NGINX, add this to your server config:"
echo "----------------------------------------"
cat << 'EOF'
server {
    listen 80;
    server_name hetasinglar.se www.hetasinglar.se;
    
    root /var/www/hetasinglar;
    index index.html;
    
    # Handle React Router - all routes should serve index.html  
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # Handle API proxy (if needed)
    location /api/ {
        proxy_pass http://13.48.194.178:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
echo "----------------------------------------"
echo ""

echo "If using Apache, add this to .htaccess:"
echo "----------------------------------------"
cat << 'EOF'
Options -MultiViews
RewriteEngine On

# Handle React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Cache static assets
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, immutable"
</FilesMatch>
EOF
echo "----------------------------------------"
echo ""

echo "3. 🏗️ Rebuild Your Frontend"
echo ""
echo "Run this command to rebuild with fixed configuration:"
echo "npm run build:prod"
echo ""

echo "4. 🚀 Deploy Updated Build"
echo ""
echo "Upload the new build files to your web server."
echo ""

echo "✅ After these fixes, all routes should work:"
echo "✅ https://hetasinglar.se/"
echo "✅ https://hetasinglar.se/login"  
echo "✅ https://hetasinglar.se/agent/login"
echo "✅ https://hetasinglar.se/admin/login"
echo ""

echo "🎉 Problem should be resolved!"