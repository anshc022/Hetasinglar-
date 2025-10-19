# HetaSinglar Frontend AWS Deployment (PowerShell)
# ================================================

Write-Host "📤 HetaSinglar Frontend Upload to AWS EC2" -ForegroundColor Blue
Write-Host "==========================================" -ForegroundColor Blue

# Configuration - Update these with your AWS details
$EC2_HOST = "16.171.8.139"  # Your new frontend EC2 instance IP
$EC2_USER = "ec2-user"
$KEY_PATH = "f:\vercal\Hetasinglar\backend\api-Hetasinglar\hetasinglar-key.pem"  # Full path to your EC2 key file
$REMOTE_DIR = "/home/ec2-user/hetasinglar-frontend"

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

function Write-Step($message) {
    Write-Host "🔧 $message" -ForegroundColor Cyan
}

# Check if key file exists
if (-not (Test-Path $KEY_PATH)) {
    Write-Error "EC2 key file not found: $KEY_PATH"
    Write-Warning "Please update KEY_PATH in this script with the correct path to your .pem file"
    Write-Warning "Example: C:\Users\YourName\.ssh\your-key.pem"
    exit 1
}

Write-Step "Step 1: Building frontend for production..."

# Build the frontend
npm run build:prod

if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed!"
    exit 1
}

Write-Success "Frontend build completed"

Write-Step "Step 2: Preparing files for upload..."

# Create a temporary directory with all files to upload
$TEMP_DIR = ".\temp-deployment"
if (Test-Path $TEMP_DIR) {
    Remove-Item -Recurse -Force $TEMP_DIR
}
New-Item -ItemType Directory -Path $TEMP_DIR | Out-Null

# Copy essential files
Copy-Item -Recurse "build" "$TEMP_DIR\"
Copy-Item -Recurse "src" "$TEMP_DIR\"
Copy-Item -Recurse "public" "$TEMP_DIR\"
Copy-Item "package*.json" "$TEMP_DIR\"
Copy-Item ".env.production" "$TEMP_DIR\"

# Copy config files if they exist
if (Test-Path "tailwind.config.js") { Copy-Item "tailwind.config.js" "$TEMP_DIR\" }
if (Test-Path "postcss.config.js") { Copy-Item "postcss.config.js" "$TEMP_DIR\" }

# Copy the deployment script
Copy-Item "deploy-frontend-aws.sh" "$TEMP_DIR\"

Write-Success "Files prepared for upload"

Write-Step "Step 3: Creating remote directory..."

# Create remote directory using SSH
$sshCommand = "ssh -i `"$KEY_PATH`" $EC2_USER@$EC2_HOST `"sudo mkdir -p $REMOTE_DIR && sudo chown $EC2_USER`:$EC2_USER $REMOTE_DIR`""
Invoke-Expression $sshCommand

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to create remote directory"
    exit 1
}

Write-Step "Step 4: Uploading files to EC2..."

# Check if we have WSL with rsync, otherwise use SCP
if (Get-Command wsl -ErrorAction SilentlyContinue) {
    Write-Host "Using WSL rsync for upload..." -ForegroundColor Yellow
    $rsyncCommand = "wsl rsync -avz -e `"ssh -i $KEY_PATH`" $TEMP_DIR/ $EC2_USER@$EC2_HOST`:$REMOTE_DIR/"
    Invoke-Expression $rsyncCommand
} else {
    Write-Host "Using SCP for upload (may be slower)..." -ForegroundColor Yellow
    $scpCommand = "scp -i `"$KEY_PATH`" -r `"$TEMP_DIR\*`" $EC2_USER@$EC2_HOST`:$REMOTE_DIR/"
    Invoke-Expression $scpCommand
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "File upload failed!"
    Write-Warning "Make sure you have SSH client installed and configured"
    Write-Warning "You can also manually copy files using WinSCP or similar tools"
    exit 1
}

Write-Success "Files uploaded successfully"

Write-Step "Step 5: Running deployment script on EC2..."

# Execute the deployment script on the remote server
$deployCommand = "ssh -i `"$KEY_PATH`" $EC2_USER@$EC2_HOST `"cd $REMOTE_DIR && chmod +x deploy-frontend-aws.sh && ./deploy-frontend-aws.sh`""
Invoke-Expression $deployCommand

if ($LASTEXITCODE -ne 0) {
    Write-Error "Remote deployment script failed!"
    Write-Warning "You may need to manually run the deployment script on the EC2 server"
    exit 1
}

Write-Step "Step 6: Cleaning up..."

# Remove temporary directory
Remove-Item -Recurse -Force $TEMP_DIR

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Success "🎉 Frontend Deployment to AWS Complete!"
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your frontend should now be available at:" -ForegroundColor Cyan
Write-Host "   http://hetasinglar.duckdns.org" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔒 To enable HTTPS, run on your EC2 server:" -ForegroundColor Cyan
Write-Host "   sudo certbot --nginx -d hetasinglar.duckdns.org -d www.hetasinglar.duckdns.org" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 To update the frontend in the future:" -ForegroundColor Cyan
Write-Host "   1. Run this script again: .\upload-frontend-aws.ps1" -ForegroundColor Yellow
Write-Host "   2. Or SSH to EC2 and run: ./update-frontend.sh" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 EC2 Server: $EC2_HOST" -ForegroundColor Cyan
Write-Host "📁 Remote Directory: $REMOTE_DIR" -ForegroundColor Cyan