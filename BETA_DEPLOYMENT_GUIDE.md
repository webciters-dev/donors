# Beta Deployment Guide: beta.aircrew.nl

Complete deployment guide for deploying AWAKE Connect to the beta.aircrew.nl subdomain.

---

## Overview

This guide covers:
1. Creating the `beta.aircrew.nl` subdomain
2. Setting up DNS records
3. Deploying the application
4. Configuring SSL/TLS
5. Setting up Nginx reverse proxy
6. Database configuration
7. Verification and testing

---

## PART 1: SUBDOMAIN CREATION

### 1.1 Create Subdomain at Hosting Provider

**At Vimexx or your hosting control panel:**

1. Log in to your hosting/DNS management panel
2. Navigate to **DNS Management** or **Domains**
3. Select **aircrew.nl**
4. Add a new DNS record:
   - **Type:** A Record
   - **Name:** beta
   - **Value:** [Your VPS IP Address]
   - **TTL:** 3600 (1 hour)

5. Add additional DNS records for email/MX (if needed):
   - Type: MX Record
   - Name: beta.aircrew.nl
   - Priority: 10
   - Value: mail.aircrew.nl

**Note:** DNS propagation may take 24-48 hours.

### 1.2 Verify DNS Setup

Test DNS resolution:
```bash
nslookup beta.aircrew.nl
# Should return your VPS IP address
```

---

## PART 2: VPS PREPARATION

### 2.1 SSH into Your VPS

```bash
ssh username@your_vps_ip
# Or via control panel terminal
```

### 2.2 Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### 2.3 Install Required Software

```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 (process manager)
sudo npm install -g pm2

# Nginx (web server)
sudo apt-get install -y nginx

# PostgreSQL client (if DB is remote)
sudo apt-get install -y postgresql-client

# Certbot (SSL/TLS)
sudo apt-get install -y certbot python3-certbot-nginx

# Git
sudo apt-get install -y git
```

### 2.4 Verify Installations

```bash
node --version  # Should show v18.x or higher
npm --version
pm2 --version
nginx -v
```

---

## PART 3: APPLICATION SETUP

### 3.1 Create Application Directory

```bash
# Create directory
sudo mkdir -p /home/beta-app
sudo chown $USER:$USER /home/beta-app

# Navigate to it
cd /home/beta-app
```

### 3.2 Clone or Upload Project

**Option A: Clone from GitHub**
```bash
git clone https://github.com/webciters-dev/donors.git beta
cd beta
```

**Option B: Upload via SCP**
```bash
# From your local machine:
scp -r c:\projects\donor username@your_vps_ip:/home/beta-app/beta
```

### 3.3 Install Dependencies

```bash
cd /home/beta-app/beta

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3.4 Build Frontend

```bash
npm run build
# Output will be in /home/beta-app/beta/dist
```

---

## PART 4: ENVIRONMENT CONFIGURATION

### 4.1 Create Backend Environment File

```bash
# Create production environment file for backend
cat > /home/beta-app/beta/server/.env.production << 'EOF'
# ==========================================
# AWAKE Connect - Beta Deployment
# ==========================================

# Node Environment
NODE_ENV=production
PORT=3001

# Database Configuration
# If using same database as production:
DATABASE_URL="postgresql://your_db_user:your_db_password@localhost:5432/awake_db"

# If using separate beta database:
# DATABASE_URL="postgresql://beta_user:beta_password@localhost:5432/awake_beta"

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_generated_jwt_secret_here

# Frontend URLs
FRONTEND_URL=https://beta.aircrew.nl
FRONTEND_URLS=https://beta.aircrew.nl

# Email Configuration (aircrew.nl)
EMAIL_HOST=mail.aircrew.nl
EMAIL_PORT=587
EMAIL_USER=noreply@aircrew.nl
EMAIL_PASS=RoG*741#NoR
EMAIL_FROM=AWAKE Connect (Beta) <noreply@aircrew.nl>

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/home/beta-app/beta/server/uploads

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_...

# reCAPTCHA Configuration (for beta.aircrew.nl)
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
RECAPTCHA_SITE_KEY=6LfaDQosAAAAAKt69ylVQkfo5Qa8jhEIRsCSfSkX

# Logging
LOG_LEVEL=info
LOG_DIR=/home/beta-app/beta/logs

# Enable debugging for beta (optional)
DEBUG=false
EOF

chmod 600 /home/beta-app/beta/server/.env.production
```

### 4.2 Create Frontend Environment File

```bash
# Create .env.production for Vite frontend
cat > /home/beta-app/beta/.env.production << 'EOF'
VITE_API_URL=https://beta.aircrew.nl
VITE_USE_API=true
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SEV0FBA3ZdfR2SVu37soBBcIPSWRQVRBgVsf7RTwk8bdTPZgC0TIfH3chTcOZ0RAmL7hj04UbqhXjY7SvY5Q0b600PUp0wKlQ
VITE_RECAPTCHA_SITE_KEY=6LfaDQosAAAAAKt69ylVQkfo5Qa8jhEIRsCSfSkX
EOF

chmod 600 /home/beta-app/beta/.env.production
```

### 4.3 Create PM2 Ecosystem File

```bash
cat > /home/beta-app/beta/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'beta-backend',
    script: './server/src/server.js',
    cwd: '/home/beta-app/beta',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_file: './server/.env.production',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_file: './logs/combined.log',
    time: true,
    restart_delay: 4000,
    max_restarts: 10,
    merge_logs: true,
    autorestart: true,
    shutdown_with_message: true,
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
EOF
```

### 4.4 Create Logs Directory

```bash
mkdir -p /home/beta-app/beta/logs
mkdir -p /home/beta-app/beta/server/uploads
chmod 755 /home/beta-app/beta/logs
chmod 755 /home/beta-app/beta/server/uploads
```

---

## PART 5: DATABASE SETUP

### 5.1 Option A: Use Existing Production Database

If using the same database, ensure your DATABASE_URL in `.env.production` points to it.

### 5.2 Option B: Create Separate Beta Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create beta database and user
CREATE DATABASE awake_beta;
CREATE USER beta_user WITH ENCRYPTED PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE awake_beta TO beta_user;

# Exit psql
\q
```

### 5.3 Run Database Migrations

```bash
cd /home/beta-app/beta
npx prisma migrate deploy --skip-generate
```

### 5.4 Seed Database (Optional)

If you have seed scripts:
```bash
npx prisma db seed
```

---

## PART 6: SSL/TLS CERTIFICATE

### 6.1 Generate SSL Certificate with Let's Encrypt

```bash
# First, temporarily disable Nginx if needed
sudo systemctl stop nginx

# Generate certificate
sudo certbot certonly --standalone -d beta.aircrew.nl

# When prompted:
# - Enter your email
# - Accept terms
# - Enter domain: beta.aircrew.nl

# Restart Nginx
sudo systemctl start nginx
```

### 6.2 Verify Certificate

```bash
sudo ls -la /etc/letsencrypt/live/beta.aircrew.nl/
# Should show: cert.pem, chain.pem, fullchain.pem, privkey.pem
```

---

## PART 7: NGINX CONFIGURATION

### 7.1 Create Nginx Configuration

```bash
# Create new Nginx configuration
sudo tee /etc/nginx/sites-available/beta.aircrew.nl > /dev/null << 'EOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name beta.aircrew.nl;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name beta.aircrew.nl;

    # SSL Certificate Configuration
    ssl_certificate /etc/letsencrypt/live/beta.aircrew.nl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/beta.aircrew.nl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;

    # File upload size
    client_max_body_size 500M;

    # Access and error logs
    access_log /var/log/nginx/beta.aircrew.nl.access.log;
    error_log /var/log/nginx/beta.aircrew.nl.error.log;

    # Serve static frontend files
    root /home/beta-app/beta/dist;
    index index.html index.htm;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }

    # Serve uploaded files
    location /uploads/ {
        alias /home/beta-app/beta/server/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Serve manual files
    location /manuals/ {
        alias /home/beta-app/beta/manuals/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Frontend routing (React Router)
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
```

### 7.2 Enable Nginx Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/beta.aircrew.nl /etc/nginx/sites-enabled/

# Remove default site if it exists
sudo rm /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## PART 8: APPLICATION STARTUP

### 8.1 Start Backend with PM2

```bash
cd /home/beta-app/beta

# Start application
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs beta-backend
```

### 8.2 Enable PM2 Auto-restart on Boot

```bash
# Generate startup script
pm2 startup systemd -u $USER --hp /home/$USER

# Save PM2 process list
pm2 save

# Verify
pm2 startup
```

### 8.3 Verify Backend is Running

```bash
# Check if backend is responding
curl http://localhost:3001/api/health

# Should return: {"ok":true}
```

---

## PART 9: VERIFICATION AND TESTING

### 9.1 Test HTTPS Access

```bash
# Test from your local machine or VPS
curl -I https://beta.aircrew.nl

# Should return 200 OK
```

### 9.2 Test API Endpoints

```bash
# Health check
curl https://beta.aircrew.nl/api/health

# Should return: {"ok":true}
```

### 9.3 Test Frontend

Open browser and visit:
```
https://beta.aircrew.nl
```

Verify:
- ✅ Page loads
- ✅ No SSL warnings
- ✅ Navigation works
- ✅ API calls work

### 9.4 Check Logs

```bash
# Backend logs
pm2 logs beta-backend

# Nginx access logs
tail -f /var/log/nginx/beta.aircrew.nl.access.log

# Nginx error logs
tail -f /var/log/nginx/beta.aircrew.nl.error.log
```

---

## PART 10: MONITORING & MAINTENANCE

### 10.1 PM2 Commands

```bash
# View all processes
pm2 list

# Monitor
pm2 monit

# Restart application
pm2 restart beta-backend

# Stop application
pm2 stop beta-backend

# Start application
pm2 start beta-backend

# View real-time logs
pm2 logs beta-backend --tail 100

# Clear logs
pm2 flush
```

### 10.2 SSL Certificate Renewal

```bash
# Manual renewal
sudo certbot renew --dry-run

# Auto-renewal is set up by certbot
# Check renewal timer
sudo systemctl status certbot.timer
```

### 10.3 System Monitoring

```bash
# Check disk space
df -h

# Check memory
free -h

# Check CPU
top

# Check uptime
uptime
```

---

## PART 11: TROUBLESHOOTING

### Issue: DNS Not Resolving

```bash
# Check DNS
nslookup beta.aircrew.nl
dig beta.aircrew.nl

# If not working:
# 1. Verify DNS record in hosting panel
# 2. Wait for TTL to expire (24-48 hours)
# 3. Try from different network
```

### Issue: SSL Certificate Error

```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/beta.aircrew.nl/cert.pem -text -noout

# Regenerate if needed
sudo certbot delete --cert-name beta.aircrew.nl
sudo certbot certonly --standalone -d beta.aircrew.nl
```

### Issue: Backend Not Starting

```bash
# Check logs
pm2 logs beta-backend

# Check if port 3001 is in use
sudo lsof -i :3001

# Check environment file
cat /home/beta-app/beta/server/.env.production

# Test connection to database
psql -U your_db_user -d awake_db -c "SELECT 1;"
```

### Issue: Nginx 502 Bad Gateway

```bash
# Backend not running - check PM2
pm2 status

# Port not accessible - check firewall
sudo ufw status

# Allow port 3001 if needed
sudo ufw allow 3001

# Check Nginx logs
tail -f /var/log/nginx/beta.aircrew.nl.error.log
```

### Issue: High Memory Usage

```bash
# Check memory
free -h

# Restart application
pm2 restart beta-backend

# Increase max memory threshold in ecosystem.config.js
# Change max_memory_restart to higher value (e.g., '2G')
```

---

## PART 12: SECURITY HARDENING

### 12.1 Firewall Configuration

```bash
# Check current rules
sudo ufw status

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

### 12.2 Fail2Ban (Optional)

```bash
# Install
sudo apt-get install -y fail2ban

# Start service
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

# Check status
sudo fail2ban-client status
```

### 12.3 Backup Strategy

```bash
# Backup database
pg_dump -U your_db_user awake_db > /home/beta-app/backups/awake_db_$(date +%Y%m%d).sql

# Backup uploads
tar -czf /home/beta-app/backups/uploads_$(date +%Y%m%d).tar.gz /home/beta-app/beta/server/uploads/

# Automate with cron
crontab -e

# Add:
# 0 2 * * * pg_dump -U your_db_user awake_db > /home/beta-app/backups/awake_db_$(date +\%Y\%m\%d).sql
# 0 3 * * * tar -czf /home/beta-app/backups/uploads_$(date +\%Y\%m\%d).tar.gz /home/beta-app/beta/server/uploads/
```

---

## PART 13: PERFORMANCE OPTIMIZATION

### 13.1 Nginx Performance Tuning

```bash
# Edit /etc/nginx/nginx.conf
sudo nano /etc/nginx/nginx.conf

# Increase worker connections (in events block)
worker_connections 2048;

# Enable caching
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;
```

### 13.2 Node.js Performance

```bash
# In ecosystem.config.js, set instances to 'max' (already done)
# This uses all available CPU cores

# Increase Node memory limit if needed
export NODE_OPTIONS="--max-old-space-size=2048"
```

---

## DEPLOYMENT CHECKLIST

Before going live on beta.aircrew.nl:

- [ ] DNS A record created (beta.aircrew.nl → VPS IP)
- [ ] System updated and dependencies installed
- [ ] Application cloned/uploaded to /home/beta-app/beta
- [ ] Backend dependencies installed (npm install in server/)
- [ ] Frontend built (npm run build)
- [ ] .env.production created with correct values
- [ ] ecosystem.config.js configured
- [ ] Database migrations run (npx prisma migrate deploy)
- [ ] SSL certificate generated (Let's Encrypt)
- [ ] Nginx configured for beta.aircrew.nl
- [ ] Nginx configuration tested (nginx -t)
- [ ] Nginx reloaded (sudo systemctl reload nginx)
- [ ] PM2 started (pm2 start ecosystem.config.js)
- [ ] Backend health check passes (curl /api/health)
- [ ] Frontend accessible (https://beta.aircrew.nl)
- [ ] API calls working
- [ ] Logs being generated
- [ ] Firewall configured
- [ ] SSL auto-renewal enabled
- [ ] Backup strategy in place
- [ ] Monitoring setup complete

---

## QUICK REFERENCE COMMANDS

```bash
# Connection
ssh username@vps_ip

# Check status
pm2 status
pm2 logs beta-backend
sudo systemctl status nginx

# Restart services
pm2 restart beta-backend
sudo systemctl reload nginx

# Check application
curl https://beta.aircrew.nl/api/health
curl -I https://beta.aircrew.nl

# Database
psql -U your_db_user -d awake_db

# Logs
tail -f /var/log/nginx/beta.aircrew.nl.access.log
tail -f /var/log/nginx/beta.aircrew.nl.error.log

# System info
df -h        # Disk space
free -h      # Memory
uptime       # Uptime
```

---

## NEXT STEPS

1. **Follow the deployment steps** in order (Parts 1-9)
2. **Test thoroughly** before promoting to production
3. **Monitor logs** for first 24 hours
4. **Set up automated backups** (Part 12.3)
5. **Document your DNS records** and credentials
6. **Create runbook** for future deployments
7. **Plan migration path** from beta to production

---

## SUPPORT & DOCUMENTATION

For issues or questions:
- Check the troubleshooting section (Part 11)
- Review Nginx/PM2 documentation
- Check application logs (pm2 logs)
- Verify environment variables
- Review COMPREHENSIVE_AUDIT_REPORT.md

---

**Deployment Guide for beta.aircrew.nl**  
Created: January 2025  
Version: 1.0  
Status: Ready for deployment
