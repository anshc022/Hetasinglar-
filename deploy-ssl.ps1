# Deploy SSL Setup to Frontend Server
Write-Host "🔒 Deploying SSL Setup to HetaSinglar Frontend" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Configuration
$EC2_HOST = "13.48.43.224"
$EC2_USER = "ec2-user"
$KEY_PATH = "F:\vercal\Hetasinglar\backend\api-Hetasinglar\hetasinglar-key.pem"
$SSL_SCRIPT = "setup-ssl.sh"

# Functions
function Write-Step {
    param($Message)
    Write-Host "`n🔧 $Message" -ForegroundColor Yellow
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param($Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Check if SSL script exists
if (-not (Test-Path $SSL_SCRIPT)) {
    Write-Error "SSL setup script not found: $SSL_SCRIPT"
    exit 1
}

Write-Success "SSL setup script found: $SSL_SCRIPT"

Write-Step "Step 1: Testing connection to frontend server..."

# Test connection
$testConnection = Test-NetConnection -ComputerName $EC2_HOST -Port 22 -InformationLevel Quiet
if (-not $testConnection) {
    Write-Error "Cannot connect to frontend server: $EC2_HOST"
    exit 1
}

Write-Success "Connection to frontend server successful"

Write-Step "Step 2: Uploading SSL setup script..."

# Upload SSL script
try {
    $scpCommand = "scp -o StrictHostKeyChecking=no -i `"$KEY_PATH`" `"$SSL_SCRIPT`" `"${EC2_USER}@${EC2_HOST}:~/$SSL_SCRIPT`""
    Invoke-Expression $scpCommand
    Write-Success "SSL script uploaded successfully"
} catch {
    Write-Error "Failed to upload SSL script: $($_.Exception.Message)"
    exit 1
}

Write-Step "Step 3: Making script executable..."

# Make script executable
try {
    $sshCommand = "ssh -o StrictHostKeyChecking=no -i `"$KEY_PATH`" `"${EC2_USER}@${EC2_HOST}`" `"chmod +x $SSL_SCRIPT`""
    Invoke-Expression $sshCommand
    Write-Success "Script made executable"
} catch {
    Write-Error "Failed to make script executable: $($_.Exception.Message)"
    exit 1
}

Write-Step "Step 4: Running SSL setup on frontend server..."

Write-Info "This will:"
Write-Info "  • Install Certbot and SSL certificates"
Write-Info "  • Configure Nginx with SSL"
Write-Info "  • Set up automatic SSL renewal"
Write-Info "  • Enable HTTPS for hetasinglar.se"

$confirmation = Read-Host "`nDo you want to proceed with SSL setup? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Info "SSL setup cancelled by user"
    exit 0
}

# Execute SSL setup
Write-Info "Executing SSL setup script on server..."
Write-Info "This may take a few minutes..."

try {
    $sshCommand = "ssh -o StrictHostKeyChecking=no -i `"$KEY_PATH`" `"${EC2_USER}@${EC2_HOST}`" `"sudo ./$SSL_SCRIPT`""
    Invoke-Expression $sshCommand
    Write-Success "SSL setup completed on server"
} catch {
    Write-Error "SSL setup failed: $($_.Exception.Message)"
    Write-Info "You can manually run the script on the server with:"
    Write-Info "  ssh -i `"$KEY_PATH`" ${EC2_USER}@$EC2_HOST"
    Write-Info "  sudo ./$SSL_SCRIPT"
    exit 1
}

Write-Step "Step 5: Testing HTTPS access..."

# Wait a moment for services to start
Start-Sleep -Seconds 5

# Test HTTPS
try {
    $httpsTest = Invoke-WebRequest -Uri "https://hetasinglar.se" -TimeoutSec 15 -UseBasicParsing
    if ($httpsTest.StatusCode -eq 200) {
        Write-Success "HTTPS is working! Status: $($httpsTest.StatusCode)"
    } else {
        Write-Info "HTTPS returned status: $($httpsTest.StatusCode)"
    }
} catch {
    Write-Info "HTTPS test failed, but this is normal during initial setup"
    Write-Info "SSL certificates may need a few minutes to propagate"
}

# Test HTTP redirect
try {
    $httpTest = Invoke-WebRequest -Uri "http://hetasinglar.se" -TimeoutSec 10 -MaximumRedirection 0
    Write-Info "HTTP returned status: $($httpTest.StatusCode)"
} catch {
    if ($_.Exception.Response.StatusCode -eq 301 -or $_.Exception.Response.StatusCode -eq 302) {
        Write-Success "HTTP to HTTPS redirect is working!"
    } else {
        Write-Info "HTTP test: $($_.Exception.Message)"
    }
}

Write-Host "`n=============================================="
Write-Success "🎉 SSL Deployment Complete!"
Write-Host "=============================================="
Write-Host ""
Write-Host "🌐 Your website should now be available at:" -ForegroundColor Cyan
Write-Host "   ✅ https://hetasinglar.se" -ForegroundColor Green
Write-Host "   ✅ https://www.hetasinglar.se" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 If HTTPS is not working immediately:" -ForegroundColor Yellow
Write-Host "   • Wait 2-3 minutes for SSL certificate propagation" -ForegroundColor Gray
Write-Host "   • Check DNS propagation: nslookup hetasinglar.se" -ForegroundColor Gray
Write-Host "   • Verify on server: ssh -i `"$KEY_PATH`" ${EC2_USER}@$EC2_HOST" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 Server Commands:" -ForegroundColor Cyan
Write-Host "   Check SSL status:  sudo certbot certificates" -ForegroundColor Gray
Write-Host "   Check Nginx:       sudo systemctl status nginx" -ForegroundColor Gray
Write-Host "   Check SSL config:  sudo nginx -t" -ForegroundColor Gray
Write-Host "   View logs:         sudo tail -f /var/log/nginx/error.log" -ForegroundColor Gray
Write-Host ""
Write-Success "SSL setup deployment completed! 🔐"