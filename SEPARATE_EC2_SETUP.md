# Frontend EC2 Instance Setup Guide

## 🚀 Setting Up Separate EC2 Instance for Frontend

### Step 1: Create New EC2 Instance

1. **Launch new EC2 instance:**
   - Instance type: t2.micro (free tier) or t3.small
   - AMI: Amazon Linux 2
   - Security Group: Allow HTTP (80), HTTPS (443), SSH (22)
   - Key pair: Use same hetasinglar-key.pem or create new one

2. **Security Group Rules:**
   ```
   Type        Protocol    Port Range    Source
   SSH         TCP         22           Your IP / 0.0.0.0/0
   HTTP        TCP         80           0.0.0.0/0
   HTTPS       TCP         443          0.0.0.0/0
   Custom TCP  TCP         3000         0.0.0.0/0 (for development)
   ```

3. **Get the new IP address** (example: 1.2.3.4)

### Step 2: Set up DuckDNS subdomain

Option A: New subdomain
- frontend.hetasinglar.duckdns.org → New Frontend IP
- api.hetasinglar.duckdns.org → Backend IP (13.51.56.220)

Option B: Main domain on frontend
- hetasinglar.duckdns.org → New Frontend IP  
- apihetasinglar.duckdns.org → Backend IP (13.51.56.220)

### Step 3: Update Configuration Files

Update these files with your new frontend IP:

#### Update GitHub Secrets:
- `FRONTEND_EC2_HOST` = Your new frontend instance IP
- `FRONTEND_EC2_USER` = ec2-user
- `FRONTEND_EC2_KEY` = Same or new private key

#### Update Environment Files:
```bash
# .env.production
REACT_APP_API_URL=https://apihetasinglar.duckdns.org/api
REACT_APP_WS_URL=wss://apihetasinglar.duckdns.org
REACT_APP_FRONTEND_URL=https://hetasinglar.duckdns.org
```

### Architecture After Separation:

```
Frontend Instance (New IP)     Backend Instance (13.51.56.220)
┌─────────────────────────┐    ┌─────────────────────────┐
│ Nginx + React Build     │    │ Node.js API + MongoDB  │
│ Port 80/443             │────│ Port 5000              │
│ hetasinglar.duckdns.org │    │ apihetasinglar.duckdns │
└─────────────────────────┘    └─────────────────────────┘
```

### Benefits of Separate Instances:

✅ **Independent Scaling**: Scale frontend and backend separately
✅ **Better Resource Management**: Dedicated resources for each service
✅ **Easier Maintenance**: Deploy and restart services independently
✅ **Security**: Better isolation between frontend and backend
✅ **Cost Optimization**: Use appropriate instance sizes for each service

### Would you like me to:

1. **Update deployment scripts** for new instance IP?
2. **Create launch script** for new EC2 instance?
3. **Update DNS configuration** guide?
4. **Modify GitHub workflow** for separate deployment?

Just provide your new frontend instance IP address and I'll update all the configurations! 🚀