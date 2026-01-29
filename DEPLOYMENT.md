# Deployment Guide for AWAKE Connect Platform

This guide will help you deploy the AWAKE Connect platform to your VPS server.

## Prerequisites

- VPS server with SSH access
- Node.js 18+ installed
- PostgreSQL database
- PM2 installed (for process management)
- Nginx installed (for reverse proxy)

## Server Information

- **SSH**: `ssh sohail@136.144.175.93`
- **Password**: `RoG*5259#VpS`
- **PostgreSQL Password**: `RoG*741#PoS`
- **Project Path**: `/home/sohail/projects/donors`

## Step 1: Connect to Server and Prepare Environment

```bash
# Connect to server
ssh sohail@136.144.175.93

# Navigate to project directory
cd /home/sohail/projects/donors

# Install Node.js if not already installed (check version first)
node --version
# If not installed, use nvm or install from nodejs.org
```

## Step 2: Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ..
npm install
```

## Step 3: Set Up Environment Variables

### Backend Environment (.env.production)

Create `/home/sohail/projects/donors/server/.env.production`:

```env
# Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com
FRONTEND_URLS=https://yourdomain.com,http://136.144.175.93

# Database
DATABASE_URL=postgresql://sohail:RoG*741#PoS@localhost:5432/awake_db?schema=public

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# reCAPTCHA (get from Google reCAPTCHA console)
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
RECAPTCHA_SITE_KEY=your-recaptcha-site-key

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Stripe (if using payments)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# File Upload
UPLOAD_DIR=/home/sohail/projects/donors/server/uploads
MAX_FILE_SIZE=10485760

# Optional: Monitoring
ENABLE_MONITORING=false
ENABLE_STRUCTURED_LOGGING=true
ENABLE_RATE_LIMITING=true
```

### Frontend Environment (.env.production)

Create `/home/sohail/projects/donors/.env.production`:

```env
VITE_API_BASE_URL=https://yourdomain.com/api
# or if using separate API domain:
# VITE_API_BASE_URL=https://api.yourdomain.com

VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

## Step 4: Database Setup

```bash
cd /home/sohail/projects/donors/server

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed database with initial data
npm run seed
```

## Step 5: Build Frontend

```bash
cd /home/sohail/projects/donors

# Build for production
npm run build

# The build output will be in the 'dist' directory
```

## Step 6: Set Up PM2 for Process Management

```bash
# Install PM2 globally if not installed
npm install -g pm2

# Start backend server with PM2
cd /home/sohail/projects/donors/server
pm2 start src/server.js --name "awake-backend" --node-args="--max-old-space-size=2048"

# Save PM2 configuration
pm2 save

# Set up PM2 to start on system boot
pm2 startup
# Follow the instructions it provides
```

## Step 7: Configure Nginx

Create `/etc/nginx/sites-available/awake-connect`:

```nginx
# Backend API
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;

    # API endpoints
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for file uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Frontend static files
    location / {
        root /home/sohail/projects/donors/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # File uploads (if serving directly)
    location /uploads {
        alias /home/sohail/projects/donors/server/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/awake-connect /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Step 8: Set Up SSL (Let's Encrypt)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal is set up automatically
```

## Step 9: Create Upload Directory

```bash
mkdir -p /home/sohail/projects/donors/server/uploads
chmod 755 /home/sohail/projects/donors/server/uploads
```

## Step 10: Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (if not already allowed)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

## Useful Commands

### PM2 Commands
```bash
# View running processes
pm2 list

# View logs
pm2 logs awake-backend

# Restart backend
pm2 restart awake-backend

# Stop backend
pm2 stop awake-backend

# Monitor
pm2 monit
```

### Database Commands
```bash
cd /home/sohail/projects/donors/server

# Run migrations
npm run db:migrate

# Reset database (WARNING: deletes all data)
npm run db:migrate:fresh

# Seed database
npm run seed
```

### Update Deployment
```bash
# Pull latest code (if using git)
cd /home/sohail/projects/donors
git pull

# Rebuild frontend
npm run build

# Restart backend
cd server
pm2 restart awake-backend
```

## Troubleshooting

### Backend not starting
- Check logs: `pm2 logs awake-backend`
- Check environment variables: `cat server/.env.production`
- Check database connection

### Frontend not loading
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify build output exists: `ls -la dist/`
- Check Nginx configuration: `sudo nginx -t`

### Database connection issues
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL in .env.production
- Test connection: `psql -U sohail -d awake_db`

## Security Checklist

- [ ] Change default passwords
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall
- [ ] Set up regular backups
- [ ] Keep dependencies updated
- [ ] Monitor logs regularly
- [ ] Set up fail2ban for SSH protection


