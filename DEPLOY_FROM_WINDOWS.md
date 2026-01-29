# Deploying from Windows PowerShell

This guide will help you deploy the AWAKE Connect project from Windows PowerShell to your VPS.

## Prerequisites

- PowerShell (Windows 10/11)
- SSH access to VPS (you've already connected)
- Git installed (optional, for cloning)

## Step 1: Transfer Files to VPS

You have several options to transfer files:

### Option A: Using SCP (Secure Copy) from PowerShell

```powershell
# Navigate to your local project directory
cd D:\donors

# Transfer entire project (excluding node_modules)
scp -r -o StrictHostKeyChecking=no . sohail@136.144.175.93:/home/sohail/projects/donors/

# Or transfer specific files/folders
scp -r server sohail@136.144.175.93:/home/sohail/projects/donors/
scp -r src sohail@136.144.175.93:/home/sohail/projects/donors/
scp package.json vite.config.js tailwind.config.js postcss.config.js sohail@136.144.175.93:/home/sohail/projects/donors/
```

### Option B: Using Git (Recommended)

If your project is in a Git repository:

```powershell
# On VPS (via SSH)
ssh sohail@136.144.175.93
cd /home/sohail/projects/donors
git clone <your-repo-url> .
# Or if already cloned:
git pull
```

### Option C: Using WinSCP or FileZilla (GUI)

1. Download WinSCP or FileZilla
2. Connect to: `sohail@136.144.175.93`
3. Navigate to `/home/sohail/projects/donors`
4. Upload project files

## Step 2: Connect to VPS and Set Up

Once files are transferred, connect via SSH:

```powershell
ssh sohail@136.144.175.93
# Password: RoG*5259#VpS
```

## Step 3: Install Node.js (if not installed)

```bash
# Check if Node.js is installed
node --version

# If not installed, use NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 4: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

## Step 5: Set Up Environment Variables

### Backend Environment

```bash
cd /home/sohail/projects/donors/server
nano .env.production
```

Copy and paste this content (update with your values):

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com
FRONTEND_URLS=https://yourdomain.com,http://136.144.175.93

DATABASE_URL=postgresql://sohail:RoG*741#PoS@localhost:5432/awake_db?schema=public

JWT_SECRET=CHANGE_THIS_TO_A_RANDOM_STRING
RECAPTCHA_SECRET_KEY=your-recaptcha-secret
RECAPTCHA_SITE_KEY=your-recaptcha-site-key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

UPLOAD_DIR=/home/sohail/projects/donors/server/uploads
MAX_FILE_SIZE=10485760

ENABLE_STRUCTURED_LOGGING=true
ENABLE_RATE_LIMITING=true
```

**Important**: Generate a secure JWT_SECRET:
```bash
openssl rand -base64 32
```
Copy the output and use it as JWT_SECRET.

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### Frontend Environment

```bash
cd /home/sohail/projects/donors
nano .env.production
```

Copy and paste:

```env
VITE_API_URL=https://yourdomain.com/api
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
VITE_APP_NAME=AWAKE Connect
VITE_ENV=production
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

## Step 6: Install Dependencies

```bash
# Backend dependencies
cd /home/sohail/projects/donors/server
npm install --production

# Frontend dependencies
cd /home/sohail/projects/donors
npm install
```

## Step 7: Set Up Database

```bash
cd /home/sohail/projects/donors/server

# Generate Prisma Client
npm run db:generate

# Run migrations (creates tables)
npm run db:migrate

# Optional: Seed database with initial data
npm run seed
```

## Step 8: Build Frontend

```bash
cd /home/sohail/projects/donors
npm run build
```

This creates a `dist` folder with production-ready files.

## Step 9: Create Upload Directory

```bash
mkdir -p /home/sohail/projects/donors/server/uploads
chmod 755 /home/sohail/projects/donors/server/uploads
```

## Step 10: Start Backend with PM2

```bash
cd /home/sohail/projects/donors/server
pm2 start src/server.js --name "awake-backend" --node-args="--max-old-space-size=2048"
pm2 save
pm2 startup
```

Follow the instructions from `pm2 startup` to enable auto-start on boot.

## Step 11: Configure Nginx

### Install Nginx (if not installed)

```bash
sudo apt-get update
sudo apt-get install nginx -y
```

### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/awake-connect
```

Copy and paste (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 50M;

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
        
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Uploads
    location /uploads {
        alias /home/sohail/projects/donors/server/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Frontend
    location / {
        root /home/sohail/projects/donors/dist;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Save and exit, then:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/awake-connect /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 12: Set Up SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts
# Auto-renewal is set up automatically
```

## Step 13: Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (if not already)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

## Step 14: Verify Deployment

```bash
# Check backend status
pm2 list
pm2 logs awake-backend

# Check Nginx status
sudo systemctl status nginx

# Test API
curl http://localhost:3001/api/health
```

## Useful Commands

### PM2 Commands
```bash
pm2 list              # View all processes
pm2 logs awake-backend # View logs
pm2 restart awake-backend # Restart backend
pm2 stop awake-backend    # Stop backend
pm2 monit             # Monitor resources
```

### Update Deployment
```bash
cd /home/sohail/projects/donors
git pull              # If using git
npm run build         # Rebuild frontend
cd server
pm2 restart awake-backend # Restart backend
```

### View Logs
```bash
# Backend logs
pm2 logs awake-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Troubleshooting

### Backend not starting
```bash
pm2 logs awake-backend
# Check for errors in logs
```

### Frontend not loading
```bash
sudo tail -f /var/log/nginx/error.log
# Check Nginx error logs
```

### Database connection issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U sohail -d awake_db
```

### Permission issues
```bash
# Fix upload directory permissions
sudo chown -R sohail:sohail /home/sohail/projects/donors/server/uploads
chmod 755 /home/sohail/projects/donors/server/uploads
```

## Next Steps

1. Point your domain DNS to the server IP: `136.144.175.93`
2. Update domain name in environment variables
3. Set up regular database backups
4. Monitor logs regularly

