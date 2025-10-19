# Simple Frontend Deployment Script
# =================================

Write-Host "Deploying Frontend to AWS EC2" -ForegroundColor Blue
Write-Host "=============================" -ForegroundColor Blue

# Configuration
$EC2_HOST = "16.171.8.139"
$EC2_USER = "ec2-user"
$KEY_PATH = "f:\vercal\Hetasinglar\backend\api-Hetasinglar\hetasinglar-key.pem"

Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build:prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Creating deployment package..." -ForegroundColor Yellow
if (Test-Path "frontend-deploy.zip") { Remove-Item "frontend-deploy.zip" }
Compress-Archive -Path "build", "package.json", ".env.production" -DestinationPath "frontend-deploy.zip"

Write-Host "Testing connection..." -ForegroundColor Yellow
$testResult = ssh -i "$KEY_PATH" -o ConnectTimeout=10 $EC2_USER@$EC2_HOST "echo 'OK'" 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Connection failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Uploading files..." -ForegroundColor Yellow
scp -i "$KEY_PATH" "frontend-deploy.zip" "${EC2_USER}@${EC2_HOST}:/tmp/"

Write-Host "Deploying on EC2..." -ForegroundColor Yellow
ssh -i "$KEY_PATH" $EC2_USER@$EC2_HOST @"
sudo mkdir -p /home/ec2-user/hetasinglar-frontend
sudo chown ec2-user:ec2-user /home/ec2-user/hetasinglar-frontend
cd /home/ec2-user/hetasinglar-frontend
unzip -o /tmp/frontend-deploy.zip
rm /tmp/frontend-deploy.zip

# Install Node.js if needed
if ! command -v node > /dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo dnf install -y nodejs
fi

# Install nginx if needed
if ! command -v nginx > /dev/null; then
    sudo dnf install -y nginx
fi

# Create nginx config
sudo tee /etc/nginx/conf.d/hetasinglar.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name hetasinglar.duckdns.org;
    root /home/ec2-user/hetasinglar-frontend/build;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

sudo nginx -t && sudo systemctl enable nginx && sudo systemctl restart nginx
echo "Deployment completed!"
"@

Write-Host "Cleaning up..." -ForegroundColor Yellow
Remove-Item "frontend-deploy.zip" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "SUCCESS!" -ForegroundColor Green
Write-Host "========" -ForegroundColor Green
Write-Host "Frontend deployed to: http://$EC2_HOST" -ForegroundColor Yellow
Write-Host "Update DNS to point hetasinglar.duckdns.org to $EC2_HOST" -ForegroundColor Yellow