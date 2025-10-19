# AWS Frontend Deployment Guide

## 🚀 Deploy HetaSinglar Frontend to AWS EC2

This guide will help you deploy your React frontend to the same AWS EC2 server as your backend.

### Prerequisites

1. **AWS EC2 Instance**: Your backend server (13.51.56.220)
2. **SSH Access**: Your EC2 key file (.pem)
3. **Node.js**: Installed on your local machine
4. **Domain**: hetasinglar.duckdns.org pointing to your EC2

### Option 1: Automated Deployment (Recommended)

#### For Windows Users:
```powershell
# 1. Update the KEY_PATH in upload-frontend-aws.ps1
# 2. Run the PowerShell script
.\upload-frontend-aws.ps1
```

#### For Linux/Mac Users:
```bash
# 1. Update the KEY_PATH in upload-frontend-aws.sh
# 2. Make it executable and run
chmod +x upload-frontend-aws.sh
./upload-frontend-aws.sh
```

### Option 2: Manual Deployment

#### Step 1: Build Frontend Locally
```bash
# Navigate to frontend directory
cd frontend/Hetasinglar-

# Install dependencies
npm install

# Build for production
npm run build:prod
```

#### Step 2: Upload Files to EC2
```bash
# Replace YOUR_KEY.pem with your actual key file
scp -i "YOUR_KEY.pem" -r build/ ec2-user@13.51.56.220:/home/ec2-user/
scp -i "YOUR_KEY.pem" -r src/ ec2-user@13.51.56.220:/home/ec2-user/
scp -i "YOUR_KEY.pem" package*.json ec2-user@13.51.56.220:/home/ec2-user/
scp -i "YOUR_KEY.pem" .env.production ec2-user@13.51.56.220:/home/ec2-user/
scp -i "YOUR_KEY.pem" deploy-frontend-aws.sh ec2-user@13.51.56.220:/home/ec2-user/
```

#### Step 3: SSH to EC2 and Run Deployment
```bash
# SSH to your EC2 instance
ssh -i "YOUR_KEY.pem" ec2-user@13.51.56.220

# Navigate to uploaded files
cd /home/ec2-user

# Make deployment script executable
chmod +x deploy-frontend-aws.sh

# Run deployment
./deploy-frontend-aws.sh
```

### What the Deployment Does

1. **Installs Dependencies**: Node.js, npm, Nginx
2. **Sets up Frontend**: Copies your React build to `/home/ec2-user/hetasinglar-frontend`
3. **Configures Nginx**: Sets up web server to serve your frontend
4. **Sets up Routing**: Configures React Router support
5. **Proxies API**: Routes `/api/*` requests to your backend on port 5000
6. **Enables WebSocket**: Proxies WebSocket connections for real-time features

### After Deployment

Your frontend will be available at:
- **HTTP**: http://hetasinglar.duckdns.org
- **HTTPS**: https://hetasinglar.duckdns.org (after SSL setup)

### SSL Setup (Recommended)

To enable HTTPS, run this on your EC2 server:
```bash
sudo certbot --nginx -d hetasinglar.duckdns.org -d www.hetasinglar.duckdns.org
```

### File Structure on EC2

```
/home/ec2-user/hetasinglar-frontend/
├── build/              # Production React build
├── src/                # Source code (for reference)
├── public/            # Public assets
├── package.json       # Dependencies
├── .env.production    # Production environment
└── update-frontend.sh # Update script
```

### Updating Frontend

To update your frontend after changes:

1. **Quick Update**: Run the upload script again
2. **Manual Update**: SSH to EC2 and run `./update-frontend.sh`

### Troubleshooting

#### Frontend Not Loading
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

#### API Calls Failing
```bash
# Check if backend is running
sudo systemctl status hetasinglar-backend

# Check backend logs
sudo journalctl -u hetasinglar-backend -f
```

#### Build Errors
```bash
# Check Node.js version
node --version

# Reinstall dependencies
cd /home/ec2-user/hetasinglar-frontend
npm install
npm run build:prod
```

### Architecture

```
Internet
    ↓
[DuckDNS Domain] hetasinglar.duckdns.org
    ↓
[AWS EC2] 13.51.56.220
    ├── [Nginx :80/443] → Frontend (React)
    │   └── /api/* → Backend (Node.js :5000)
    └── [Backend :5000] → MongoDB Atlas
```

### Benefits of AWS Deployment

1. **Full Control**: Complete control over your hosting environment
2. **Performance**: Faster loading times with optimized server configuration
3. **Cost-Effective**: More economical than multiple separate services
4. **Integration**: Frontend and backend on same server for better performance
5. **SSL**: Easy SSL certificate setup with Let's Encrypt
6. **Scalability**: Can easily upgrade server resources as needed

### Support

If you encounter issues:
1. Check the deployment logs
2. Verify all prerequisites are met
3. Ensure your EC2 security groups allow HTTP/HTTPS traffic
4. Confirm your domain DNS settings point to the correct IP

Your frontend will now be served by AWS EC2 with professional-grade performance! 🚀