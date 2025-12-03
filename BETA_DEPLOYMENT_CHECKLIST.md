# Quick Deployment Checklist for beta.aircrew.nl

## Pre-Deployment (Hosting Provider - DNS Setup)

### DNS Configuration at aircrew.nl

- [ ] Log into hosting control panel (Vimexx or provider)
- [ ] Navigate to Domain Management → aircrew.nl
- [ ] Add DNS A Record:
  - Name: `beta`
  - Type: `A`
  - Value: `[Your VPS IP Address]`
  - TTL: `3600`
- [ ] Verify DNS propagation (wait 24-48 hours if needed)
  ```bash
  nslookup beta.aircrew.nl
  # Should return your VPS IP
  ```

---

## Phase 1: VPS Preparation

### On Your VPS (SSH Connection)

- [ ] Update system:
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```

- [ ] Install Node.js 18+:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

- [ ] Install PM2:
  ```bash
  sudo npm install -g pm2
  ```

- [ ] Install Nginx:
  ```bash
  sudo apt-get install -y nginx
  ```

- [ ] Install Certbot (SSL):
  ```bash
  sudo apt-get install -y certbot python3-certbot-nginx
  ```

- [ ] Create app directory:
  ```bash
  mkdir -p /home/beta-app
  cd /home/beta-app
  ```

- [ ] Verify installations:
  ```bash
  node --version
  npm --version
  pm2 --version
  nginx -v
  ```

---

## Phase 2: Application Deployment

### Upload Application (From Windows)

**Option A: Using SCP**
```cmd
scp -r C:\projects\donor\* username@your_vps_ip:/home/beta-app/beta/
```

**Option B: Using WinSCP**
- Open WinSCP
- Connect to your VPS
- Drag project folder to `/home/beta-app/beta`

### On VPS: Install and Build

- [ ] Navigate to app directory:
  ```bash
  cd /home/beta-app/beta
  ```

- [ ] Install frontend dependencies:
  ```bash
  npm install --production=false
  ```

- [ ] Install backend dependencies:
  ```bash
  cd server && npm install --production=true && cd ..
  ```

- [ ] Build frontend:
  ```bash
  npm run build
  ```

- [ ] Create logs and uploads directories:
  ```bash
  mkdir -p logs
  mkdir -p server/uploads
  chmod 755 logs server/uploads
  ```

---

## Phase 3: Environment Configuration

### Create Backend Environment File

- [ ] Create file: `server/.env.production`
  ```bash
  cat > /home/beta-app/beta/server/.env.production << 'EOF'
  NODE_ENV=production
  PORT=3001
  
  DATABASE_URL="postgresql://your_db_user:password@localhost:5432/awake_db"
  
  JWT_SECRET=your_jwt_secret_here
  
  FRONTEND_URL=https://beta.aircrew.nl
  FRONTEND_URLS=https://beta.aircrew.nl
  
  EMAIL_HOST=mail.aircrew.nl
  EMAIL_PORT=587
  EMAIL_USER=noreply@aircrew.nl
  EMAIL_PASS=RoG*741#NoR
  EMAIL_FROM=AWAKE Connect (Beta) <noreply@aircrew.nl>
  
  MAX_FILE_SIZE=10485760
  UPLOAD_DIR=/home/beta-app/beta/server/uploads
  
  STRIPE_SECRET_KEY=your_stripe_secret_key
  RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
  RECAPTCHA_SITE_KEY=6LfaDQosAAAAAKt69ylVQkfo5Qa8jhEIRsCSfSkX
  
  LOG_LEVEL=info
  LOG_DIR=/home/beta-app/beta/logs
  EOF
  ```

- [ ] Set file permissions:
  ```bash
  chmod 600 /home/beta-app/beta/server/.env.production
  ```

---

## Phase 4: Database

### Database Setup (One Time)

- [ ] Test database connection:
  ```bash
  psql -U your_db_user -d awake_db -c "SELECT 1;"
  ```

- [ ] Run database migrations:
  ```bash
  cd /home/beta-app/beta
  npx prisma migrate deploy --skip-generate
  ```

---

## Phase 5: SSL Certificate

### Generate SSL with Let's Encrypt

- [ ] Stop Nginx temporarily:
  ```bash
  sudo systemctl stop nginx
  ```

- [ ] Generate certificate:
  ```bash
  sudo certbot certonly --standalone -d beta.aircrew.nl
  ```

- [ ] Verify certificate:
  ```bash
  sudo ls -la /etc/letsencrypt/live/beta.aircrew.nl/
  # Should show: cert.pem, chain.pem, fullchain.pem, privkey.pem
  ```

- [ ] Start Nginx:
  ```bash
  sudo systemctl start nginx
  ```

---

## Phase 6: Nginx Configuration

### Configure Nginx Reverse Proxy

- [ ] Create Nginx config:
  ```bash
  sudo tee /etc/nginx/sites-available/beta.aircrew.nl > /dev/null << 'EOF'
  server {
      listen 80;
      server_name beta.aircrew.nl;
      return 301 https://$server_name$request_uri;
  }
  
  server {
      listen 443 ssl http2;
      server_name beta.aircrew.nl;
  
      ssl_certificate /etc/letsencrypt/live/beta.aircrew.nl/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/beta.aircrew.nl/privkey.pem;
      ssl_protocols TLSv1.2 TLSv1.3;
      ssl_ciphers HIGH:!aNULL:!MD5;
  
      client_max_body_size 500M;
      root /home/beta-app/beta/dist;
      index index.html;
  
      location /api/ {
          proxy_pass http://localhost:3001;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  
      location /uploads/ {
          alias /home/beta-app/beta/server/uploads/;
          expires 30d;
      }
  
      location / {
          try_files $uri $uri/ /index.html;
      }
  }
  EOF
  ```

- [ ] Enable site:
  ```bash
  sudo ln -s /etc/nginx/sites-available/beta.aircrew.nl /etc/nginx/sites-enabled/
  ```

- [ ] Test Nginx config:
  ```bash
  sudo nginx -t
  ```

- [ ] Reload Nginx:
  ```bash
  sudo systemctl reload nginx
  ```

---

## Phase 7: Start Application

### PM2 Process Management

- [ ] Start backend with PM2:
  ```bash
  cd /home/beta-app/beta
  pm2 start ecosystem.config.js --name beta-backend
  ```

- [ ] Verify it's running:
  ```bash
  pm2 status
  ```

- [ ] Save PM2 process list:
  ```bash
  pm2 save
  ```

- [ ] Enable auto-restart on boot:
  ```bash
  pm2 startup systemd -u $USER --hp /home/$USER
  ```

---

## Phase 8: Verification

### Test Deployment

- [ ] Backend health check:
  ```bash
  curl http://localhost:3001/api/health
  # Should return: {"ok":true}
  ```

- [ ] Test in browser:
  ```
  https://beta.aircrew.nl
  # Should load without SSL warnings
  ```

- [ ] Check logs:
  ```bash
  pm2 logs beta-backend
  ```

- [ ] Verify Nginx:
  ```bash
  sudo systemctl status nginx
  ```

- [ ] Check disk space:
  ```bash
  df -h
  ```

- [ ] Check memory:
  ```bash
  free -h
  ```

---

## Phase 9: Monitoring (First 24 Hours)

- [ ] Monitor backend logs:
  ```bash
  pm2 logs beta-backend --tail 100
  ```

- [ ] Check Nginx access logs:
  ```bash
  tail -f /var/log/nginx/beta.aircrew.nl.access.log
  ```

- [ ] Check Nginx error logs:
  ```bash
  tail -f /var/log/nginx/beta.aircrew.nl.error.log
  ```

- [ ] Monitor processes:
  ```bash
  pm2 monit
  ```

- [ ] Test key features:
  - [ ] User registration
  - [ ] User login
  - [ ] Application submission
  - [ ] File uploads
  - [ ] API calls

---

## Phase 10: Security Hardening

### Firewall Setup

- [ ] Check firewall status:
  ```bash
  sudo ufw status
  ```

- [ ] Allow necessary ports:
  ```bash
  sudo ufw allow 22/tcp   # SSH
  sudo ufw allow 80/tcp   # HTTP
  sudo ufw allow 443/tcp  # HTTPS
  ```

- [ ] Enable firewall:
  ```bash
  sudo ufw enable
  ```

---

## Phase 11: Backup & Maintenance

### Backup Strategy

- [ ] Create backup directory:
  ```bash
  mkdir -p /home/beta-app/backups
  ```

- [ ] Backup database:
  ```bash
  pg_dump -U your_db_user awake_db > /home/beta-app/backups/awake_db_$(date +%Y%m%d).sql
  ```

- [ ] Backup uploads:
  ```bash
  tar -czf /home/beta-app/backups/uploads_$(date +%Y%m%d).tar.gz /home/beta-app/beta/server/uploads/
  ```

- [ ] Set up cron for automated backups (optional)

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| DNS not resolving | Wait 24-48 hours, check DNS records in hosting panel |
| SSL certificate error | Regenerate: `sudo certbot delete --cert-name beta.aircrew.nl` then retry |
| Backend not starting | Check logs: `pm2 logs beta-backend` |
| Nginx 502 error | Verify backend is running: `pm2 status` |
| High memory usage | Restart backend: `pm2 restart beta-backend` |
| Upload failures | Check permissions: `ls -la /home/beta-app/beta/server/uploads/` |

---

## Success Indicators

✅ All of these should be checked:

- [ ] DNS resolves to VPS IP
- [ ] https://beta.aircrew.nl loads without SSL errors
- [ ] Frontend renders correctly
- [ ] API calls are successful (check network tab in browser)
- [ ] Backend logs show no errors
- [ ] PM2 process is running
- [ ] Nginx is proxying requests correctly
- [ ] File uploads work
- [ ] User registration/login works
- [ ] No memory leaks in first 24 hours

---

## Quick Commands Reference

```bash
# Connection
ssh username@vps_ip

# Status Check
pm2 status
sudo systemctl status nginx
curl https://beta.aircrew.nl/api/health

# Restart Services
pm2 restart beta-backend
sudo systemctl reload nginx

# View Logs
pm2 logs beta-backend
tail -f /var/log/nginx/beta.aircrew.nl.access.log

# Database
psql -U your_db_user -d awake_db

# System Info
df -h
free -h
uptime
```

---

## Support Resources

- Full guide: `BETA_DEPLOYMENT_GUIDE.md`
- Deployment script: `deploy-beta.sh`
- Audit report: `COMPREHENSIVE_AUDIT_REPORT.md`
- GitHub repo: https://github.com/webciters-dev/donors

---

**Deployment Target:** beta.aircrew.nl  
**Status:** Ready for deployment  
**Last Updated:** January 2025
