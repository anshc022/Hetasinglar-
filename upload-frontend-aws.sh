#!/bin/bash

echo "📤 HetaSinglar Frontend Upload to AWS EC2"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_step() { echo -e "${BLUE}🔧 $1${NC}"; }

# Configuration - Update these with your AWS details
EC2_HOST="16.171.8.139"  # Your new frontend EC2 instance IP
EC2_USER="ec2-user"
KEY_PATH="../backend/api-Hetasinglar/hetasinglar-key.pem"  # Path to your EC2 key file
REMOTE_DIR="/home/ec2-user/hetasinglar-frontend"

# Check if key file exists
if [ ! -f "$KEY_PATH" ]; then
    log_error "EC2 key file not found: $KEY_PATH"
    log_warn "Please update KEY_PATH in this script with the correct path to your .pem file"
    exit 1
fi

log_step "Step 1: Building frontend for production..."

# Build the frontend
npm run build:prod

if [ $? -ne 0 ]; then
    log_error "Frontend build failed!"
    exit 1
fi

log_info "Frontend build completed"

log_step "Step 2: Preparing files for upload..."

# Create a temporary directory with all files to upload
TEMP_DIR="./temp-deployment"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Copy essential files
cp -r build/ $TEMP_DIR/
cp -r src/ $TEMP_DIR/
cp -r public/ $TEMP_DIR/
cp package*.json $TEMP_DIR/
cp .env.production $TEMP_DIR/
cp tailwind.config.js $TEMP_DIR/ 2>/dev/null || true
cp postcss.config.js $TEMP_DIR/ 2>/dev/null || true

# Copy the deployment script
cp deploy-frontend-aws.sh $TEMP_DIR/

log_info "Files prepared for upload"

log_step "Step 3: Creating remote directory..."

# Create remote directory
ssh -i "$KEY_PATH" $EC2_USER@$EC2_HOST "sudo mkdir -p $REMOTE_DIR && sudo chown $EC2_USER:$EC2_USER $REMOTE_DIR"

if [ $? -ne 0 ]; then
    log_error "Failed to create remote directory"
    exit 1
fi

log_step "Step 4: Uploading files to EC2..."

# Upload files using rsync over SSH
rsync -avz -e "ssh -i $KEY_PATH" $TEMP_DIR/ $EC2_USER@$EC2_HOST:$REMOTE_DIR/

if [ $? -ne 0 ]; then
    log_error "File upload failed!"
    exit 1
fi

log_info "Files uploaded successfully"

log_step "Step 5: Running deployment script on EC2..."

# Execute the deployment script on the remote server
ssh -i "$KEY_PATH" $EC2_USER@$EC2_HOST "cd $REMOTE_DIR && chmod +x deploy-frontend-aws.sh && ./deploy-frontend-aws.sh"

if [ $? -ne 0 ]; then
    log_error "Remote deployment script failed!"
    exit 1
fi

log_step "Step 6: Cleaning up..."

# Remove temporary directory
rm -rf $TEMP_DIR

echo ""
echo "=============================================="
log_info "🎉 Frontend Deployment to AWS Complete!"
echo "=============================================="
echo ""
echo "🌐 Your frontend should now be available at:"
echo "   http://hetasinglar.duckdns.org"
echo ""
echo "🔒 To enable HTTPS, run on your EC2 server:"
echo "   sudo certbot --nginx -d hetasinglar.duckdns.org -d www.hetasinglar.duckdns.org"
echo ""
echo "📋 To update the frontend in the future:"
echo "   1. Run this script again: ./upload-frontend-aws.sh"
echo "   2. Or SSH to EC2 and run: ./update-frontend.sh"
echo ""
echo "🔧 EC2 Server: $EC2_HOST"
echo "📁 Remote Directory: $REMOTE_DIR"