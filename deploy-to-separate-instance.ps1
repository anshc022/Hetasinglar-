# Configurable Frontend Deployment (PowerShell)
# =============================================

Write-Host "🚀 Configurable Frontend Deployment" -ForegroundColor Blue
Write-Host "====================================" -ForegroundColor Blue

# Load configuration from config.env (convert to PowerShell variables)
if (Test-Path "config.env") {
    Get-Content "config.env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            Set-Variable -Name $name -Value $value
        }
    }
} else {
    Write-Host "❌ config.env file not found!" -ForegroundColor Red
    Write-Host "Please create config.env with your instance details" -ForegroundColor Yellow
    exit 1
}

function Write-Success($message) { Write-Host "✅ $message" -ForegroundColor Green }
function Write-Warning($message) { Write-Host "⚠️  $message" -ForegroundColor Yellow }
function Write-Error($message) { Write-Host "❌ $message" -ForegroundColor Red }
function Write-Step($message) { Write-Host "🔧 $message" -ForegroundColor Cyan }

# Check configuration
if ($FRONTEND_EC2_HOST -eq "YOUR_NEW_FRONTEND_IP") {
    Write-Error "Please update config.env with your actual frontend EC2 IP address"
    Write-Warning "Edit config.env and replace YOUR_NEW_FRONTEND_IP with your instance IP"
    exit 1
}

Write-Success "Configuration loaded:"
Write-Success "Frontend Instance: $FRONTEND_EC2_HOST"
Write-Success "Backend API: $BACKEND_API_URL" 
Write-Success "Frontend Domain: $FRONTEND_DOMAIN"

if ($SEPARATE_INSTANCE -eq "true") {
    Write-Success "Deploying to SEPARATE instance"
} else {
    Write-Success "Deploying to SAME instance as backend"
}

# Check if key file exists
if (-not (Test-Path $FRONTEND_KEY_PATH)) {
    Write-Error "Key file not found: $FRONTEND_KEY_PATH"
    exit 1
}

Write-Step "Step 1: Building frontend..."

# Build the frontend
npm run build:prod

if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed!"
    exit 1
}

Write-Step "Step 2: Creating deployment package..."

# Create deployment package
$files = @("build", "src", "public", "package*.json", ".env.production")
$existingFiles = $files | Where-Object { Test-Path $_ }

if (Get-Command tar -ErrorAction SilentlyContinue) {
    tar -czf frontend-deploy.tar.gz @existingFiles
} else {
    # Fallback: create zip file
    Compress-Archive -Path $existingFiles -DestinationPath "frontend-deploy.zip" -Force
    $deployFile = "frontend-deploy.zip"
}

Write-Step "Step 3: Testing connection..."

# Test SSH connection
$testCommand = "ssh -i `"$FRONTEND_KEY_PATH`" -o ConnectTimeout=10 $FRONTEND_EC2_USER@$FRONTEND_EC2_HOST `"echo 'Connection successful'`""
$result = Invoke-Expression $testCommand 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Error "Cannot connect to frontend instance"
    Write-Warning "Please check:"
    Write-Warning "1. Instance is running"
    Write-Warning "2. Security group allows SSH"
    Write-Warning "3. IP address is correct"
    exit 1
}

Write-Step "Step 4: Uploading files..."

# Upload deployment package
$uploadFile = if (Test-Path "frontend-deploy.tar.gz") { "frontend-deploy.tar.gz" } else { "frontend-deploy.zip" }
$scpCommand = "scp -i `"$FRONTEND_KEY_PATH`" $uploadFile $FRONTEND_EC2_USER@$FRONTEND_EC2_HOST`:/tmp/"
Invoke-Expression $scpCommand

if ($LASTEXITCODE -ne 0) {
    Write-Error "File upload failed!"
    exit 1
}

Write-Step "Step 5: Deploying on frontend instance..."

# Create deployment script for remote execution
$deployScript = @"
set -e
echo "🔧 Setting up frontend on separate instance..."

# Create frontend directory
sudo mkdir -p /home/ec2-user/hetasinglar-frontend
sudo chown ec2-user:ec2-user /home/ec2-user/hetasinglar-frontend

# Extract deployment package
cd /home/ec2-user/hetasinglar-frontend
if [ -f /tmp/frontend-deploy.tar.gz ]; then
    tar -xzf /tmp/frontend-deploy.tar.gz
    rm /tmp/frontend-deploy.tar.gz
elif [ -f /tmp/frontend-deploy.zip ]; then
    unzip -o /tmp/frontend-deploy.zip
    rm /tmp/frontend-deploy.zip
fi

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

# Create nginx configuration
sudo tee /etc/nginx/conf.d/hetasinglar-frontend.conf > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name $FRONTEND_DOMAIN www.$FRONTEND_DOMAIN;
    
    root /home/ec2-user/hetasinglar-frontend/build;
    index index.html index.htm;
    
    location / {
        try_files \`$uri \`$uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "✅ Frontend deployment completed!"
"@

# Execute deployment on remote server
$sshCommand = "ssh -i `"$FRONTEND_KEY_PATH`" $FRONTEND_EC2_USER@$FRONTEND_EC2_HOST `"$deployScript`""
Invoke-Expression $sshCommand

Write-Step "Step 6: Cleaning up..."

# Remove deployment files
Remove-Item "frontend-deploy.*" -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Success "🎉 Frontend Deployment Complete!"
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend URLs:" -ForegroundColor Cyan
Write-Host "   Main: http://$FRONTEND_DOMAIN" -ForegroundColor Yellow
Write-Host "   IP:   http://$FRONTEND_EC2_HOST" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔗 Backend API: $BACKEND_API_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update DNS to point $FRONTEND_DOMAIN to $FRONTEND_EC2_HOST" -ForegroundColor Yellow
Write-Host "2. Set up SSL: sudo certbot --nginx -d $FRONTEND_DOMAIN" -ForegroundColor Yellow
Write-Host "3. Test the application" -ForegroundColor Yellow