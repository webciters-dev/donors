# Quick Start Deployment Guide

## Step-by-Step Deployment Instructions

### 1. Connect to Your Server

```bash
ssh sohail@136.144.175.93
# Password: RoG*5259#VpS
```

### 2. Navigate to Project Directory

```bash
cd /home/sohail/projects/donors
```

### 3. Set Up Environment Variables

#### Backend Environment

```bash
cd server
nano .env.production
```

Copy the content from `env.template.backend` and update with your actual values:
- Replace `yourdomain.com` with your actual domain
- Generate a strong JWT_SECRET: `openssl rand -base64 32`
- Add your reCAPTCHA keys
- Add your email SMTP credentials
- Update DATABASE_URL if needed

#### Frontend Environment

```bash
cd ..
nano .env.production
```

Copy the content from `env.template.frontend` and update:
- Replace `yourdomain.com` with your actual domain
- Add your reCAPTCHA site key

### 4. Run Deployment Script

```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

Or manually:

```bash
# Install dependencies
cd server && npm install --production
cd .. && npm install

# Generate Prisma Client
cd server && npm run db:generate

# Run migrations
npm run db:migrate

# Build frontend
cd .. && npm run build

# Start backend with PM2
cd server
pm2 start src/server.js --name "awake-backend" --node-args="--max-old-space-size=2048"
pm2 save
```

### 5. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/awake-connect
```

Copy content from `nginx.conf.example` and update:
- Replace `yourdomain.com` with your actual domain
- Update paths if different

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/awake-connect /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 6. Set Up SSL (Let's Encrypt)

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 7. Verify Deployment

```bash
# Check backend
pm2 list
pm2 logs awake-backend

# Check Nginx
sudo systemctl status nginx

# Test API
curl http://localhost:3001/api/health
```

## Important Notes

1. **Database**: Make sure PostgreSQL is running and the database exists
2. **Firewall**: Open ports 80 and 443
3. **Domain**: Point your domain DNS to the server IP (136.144.175.93)
4. **Backups**: Set up regular database backups

## Troubleshooting

- **Backend not starting**: Check `pm2 logs awake-backend`
- **Frontend not loading**: Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- **Database errors**: Verify DATABASE_URL and PostgreSQL is running


