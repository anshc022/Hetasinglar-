#!/bin/bash

echo "🚀 Quick Frontend Deployment Test"
echo "================================="

# Configuration
EC2_HOST="13.51.56.220"
EC2_USER="ec2-user"
KEY_PATH="../backend/api-Hetasinglar/hetasinglar-key.pem"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Testing connection to EC2...${NC}"

# Test SSH connection
ssh -i "$KEY_PATH" -o ConnectTimeout=10 $EC2_USER@$EC2_HOST "echo 'SSH connection successful!'"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSH connection works!${NC}"
    echo -e "${GREEN}✅ You can now push to GitHub for automatic deployment${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set up GitHub secrets (see GITHUB_DEPLOYMENT_SETUP.md)"
    echo "2. Push your code: git push origin main"
    echo "3. Watch deployment in GitHub Actions tab"
else
    echo -e "${RED}❌ SSH connection failed${NC}"
    echo "Please check:"
    echo "- EC2 instance is running"
    echo "- Key file path is correct"
    echo "- Security group allows SSH (port 22)"
fi