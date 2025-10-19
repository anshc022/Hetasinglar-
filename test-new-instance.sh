#!/bin/bash

echo "🧪 Testing New Frontend Instance Connection"
echo "==========================================="

# Configuration
EC2_HOST="16.171.8.139"
EC2_USER="ec2-user"
KEY_PATH="../backend/api-Hetasinglar/hetasinglar-key.pem"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Testing connection to new frontend instance...${NC}"
echo "Instance ID: i-05c27abbe72e1855a"
echo "Public IP: $EC2_HOST"
echo "Private IP: 172.31.32.199"
echo ""

# Test SSH connection
echo "Testing SSH connection..."
ssh -i "$KEY_PATH" -o ConnectTimeout=10 $EC2_USER@$EC2_HOST "echo 'SSH connection successful to frontend instance!'"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ SSH connection works!${NC}"
    
    # Get instance info
    echo ""
    echo "Getting instance information..."
    ssh -i "$KEY_PATH" $EC2_USER@$EC2_HOST << 'EOF'
echo "📊 Instance Details:"
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
echo "Kernel: $(uname -r)"
echo "Architecture: $(uname -m)"
echo "Uptime: $(uptime -p)"
echo ""
echo "🔧 Installed Software:"
node --version 2>/dev/null && echo "Node.js: $(node --version)" || echo "Node.js: Not installed"
npm --version 2>/dev/null && echo "npm: $(npm --version)" || echo "npm: Not installed"
nginx -v 2>/dev/null && echo "Nginx: $(nginx -v 2>&1)" || echo "Nginx: Not installed"
echo ""
echo "💾 Disk Space:"
df -h / | tail -n 1
echo ""
echo "🧠 Memory:"
free -h | grep Mem
EOF
    
    echo ""
    echo -e "${GREEN}✅ Ready for deployment!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run deployment: ./deploy-to-separate-instance.sh"
    echo "2. Or use PowerShell: ./deploy-to-separate-instance.ps1"
    echo "3. Update DNS to point hetasinglar.duckdns.org to 16.171.8.139"
else
    echo -e "${RED}❌ SSH connection failed${NC}"
    echo ""
    echo "Please check:"
    echo "1. Security Group allows SSH (port 22) from your IP"
    echo "2. Instance is running"
    echo "3. Key file permissions: chmod 600 $KEY_PATH"
    echo ""
    echo "Security Group should allow:"
    echo "- SSH (22) from your IP or 0.0.0.0/0"
    echo "- HTTP (80) from 0.0.0.0/0"
    echo "- HTTPS (443) from 0.0.0.0/0"
fi