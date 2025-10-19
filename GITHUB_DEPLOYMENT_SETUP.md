# 🚀 GitHub Actions Deployment Setup

This guide will help you set up automatic deployment of your frontend to AWS EC2 using GitHub Actions.

## Prerequisites

- AWS EC2 instance running (13.51.56.220)
- EC2 key file (hetasinglar-key.pem)
- GitHub repository with frontend code

## Step 1: Set Up GitHub Secrets

You need to add these secrets to your GitHub repository:

### Go to your GitHub repository:
1. Navigate to: https://github.com/anshc022/Hetasinglar-
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret**

### Add these secrets:

#### 1. EC2_PRIVATE_KEY
- **Name**: `EC2_PRIVATE_KEY`
- **Value**: Copy the entire content of your `hetasinglar-key.pem` file
```
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAqdkqpryV6JtHdJ+I3jI+/NLVMWXsR45tnlKmglW4Z1QghYcS
S6EEGeFilPYgT3aQVzbpXggSlHE/RN5I7+6yD2qOrSDDo4RFcX4DrBpp2oV9hE1V
... (rest of your key content)
-----END RSA PRIVATE KEY-----
```

#### 2. EC2_HOST
- **Name**: `EC2_HOST`
- **Value**: `16.171.8.139`

#### 3. EC2_USER
- **Name**: `EC2_USER`
- **Value**: `ec2-user`

## Step 2: Push Your Code

Once you've added the secrets, any push to the `main` or `master` branch will trigger the deployment automatically.

```bash
git add .
git commit -m "Deploy frontend to AWS EC2"
git push origin main
```

## Step 3: Monitor Deployment

1. Go to your GitHub repository
2. Click on the **Actions** tab
3. You'll see your deployment workflow running
4. Click on the workflow to see detailed logs

## What the Workflow Does

1. **Builds** your React frontend with production settings
2. **Uploads** the build files to your EC2 server
3. **Configures** Nginx to serve your frontend
4. **Sets up** API proxying to your backend
5. **Enables** React Router support for SPA

## After Deployment

Your frontend will be available at:
- **HTTP**: http://hetasinglar.duckdns.org
- **Direct IP**: http://16.171.8.139

## Manual Deployment (Alternative)

If you prefer to deploy manually, you can also use:

```powershell
# Windows PowerShell
.\upload-frontend-aws.ps1
```

```bash
# Linux/Mac
./upload-frontend-aws.sh
```

## Troubleshooting

### Deployment Fails
1. Check if all GitHub secrets are correctly set
2. Verify your EC2 instance is running
3. Check the Actions logs for specific error messages

### Frontend Not Loading
1. SSH to your EC2: `ssh -i hetasinglar-key.pem ec2-user@13.51.56.220`
2. Check Nginx status: `sudo systemctl status nginx`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`

### API Calls Not Working
1. Verify backend is running: `sudo systemctl status hetasinglar-backend`
2. Check if port 5000 is open on EC2
3. Verify API proxy configuration in Nginx

## Security Notes

- Never commit your private key to the repository
- Use GitHub secrets for sensitive information
- Regularly rotate your EC2 keys
- Consider setting up SSL/HTTPS for production

## File Structure After Deployment

```
/home/ec2-user/hetasinglar-frontend/
├── build/              # React production build
├── src/                # Source code (for reference)
├── public/            # Public assets
├── package.json       # Dependencies
└── .env.production    # Production environment
```

## Nginx Configuration

The workflow automatically configures Nginx with:
- Static file serving for React build
- React Router support (SPA routing)
- API proxy to backend on port 5000
- WebSocket proxy for real-time features
- Gzip compression
- Security headers

Your frontend deployment is now fully automated! 🎉