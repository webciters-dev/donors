# Deploy Now - Step by Step Commands

Since you're already connected to your VPS via PowerShell, follow these commands in order.

## Step 1: Transfer Your Project Files

**From your local Windows PowerShell** (open a NEW PowerShell window, keep the SSH one open):

```powershell
# Navigate to your project
cd D:\donors

# Transfer files using SCP
scp -r server sohail@136.144.175.93:/home/sohail/projects/donors/
scp -r src sohail@136.144.175.93:/home/sohail/projects/donors/
scp -r public sohail@136.144.175.93:/home/sohail/projects/donors/
scp package.json vite.config.js tailwind.config.js postcss.config.js index.html sohail@136.144.175.93:/home/sohail/projects/donors/
```

**OR use the PowerShell script:**
```powershell
cd D:\donors
.\transfer-files.ps1
```

## Step 2: On Your VPS (SSH Session)

Run these commands one by one:

### 2.1 Navigate to Project
```bash
cd /home/sohail/projects/donors
```

### 2.2 Check Node.js (install if needed)
```bash
node --version
# If not installed:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2.3 Install PM2
```bash
sudo npm install -g pm2
```

### 2.4 Create Backend Environment File
```bash
cd server
nano .env.production
```

**Paste this** (press `Ctrl+Shift+V` to paste in nano, or right-click):
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://136.144.175.93
FRONTEND_URLS=http://136.144.175.93

DATABASE_URL=postgresql://sohail:RoG*741#PoS@localhost:5432/awake_db?schema=public

JWT_SECRET=CHANGE_THIS_TO_RANDOM_STRING
RECAPTCHA_SECRET_KEY=
RECAPTCHA_SITE_KEY=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@awakeconnect.org

UPLOAD_DIR=/home/sohail/projects/donors/server/uploads
MAX_FILE_SIZE=10485760

ENABLE_STRUCTURED_LOGGING=true
ENABLE_RATE_LIMITING=true
```

**Generate JWT_SECRET:**
```bash
openssl rand -base64 32
```
Copy the output and replace `CHANGE_THIS_TO_RANDOM_STRING` in the .env file.

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

### 2.5 Create Frontend Environment File
```bash
cd ..
nano .env.production
```

**Paste this:**
```env
VITE_API_URL=http://136.144.175.93/api
VITE_RECAPTCHA_SITE_KEY=
VITE_APP_NAME=AWAKE Connect
VITE_ENV=production
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

### 2.6 Install Dependencies
```bash
# Backend
cd server
npm install --production

# Frontend
cd ..
npm install
```

### 2.7 Set Up Database
```bash
cd server

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate
```

### 2.8 Build Frontend
```bash
cd ..
npm run build
```

### 2.9 Create Upload Directory
```bash
mkdir -p server/uploads
chmod 755 server/uploads
```

### 2.10 Start Backend
```bash
cd server
pm2 start src/server.js --name "awake-backend"
pm2 save
pm2 startup
# Follow the command it shows you
```

### 2.11 Install and Configure Nginx
```bash
# Install Nginx
sudo apt-get update
sudo apt-get install nginx -y

# Create config file
sudo nano /etc/nginx/sites-available/awake-connect
```

**Paste this config:**
```nginx
server {
    listen 80;
    server_name 136.144.175.93;

    client_max_body_size 50M;

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

    location /uploads {
        alias /home/sohail/projects/donors/server/uploads;
        expires 1y;
        add_header Cache-Control "public";
    }

    location / {
        root /home/sohail/projects/donors/dist;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

**Enable and test:**
```bash
sudo ln -s /etc/nginx/sites-available/awake-connect /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 2.12 Configure Firewall
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## Step 3: Verify Everything Works

```bash
# Check backend
pm2 list
pm2 logs awake-backend

# Check if site is accessible
curl http://localhost:3001/api/health
```

## Step 4: Access Your Site

Open your browser and go to:
- **Frontend**: `http://136.144.175.93`
- **API**: `http://136.144.175.93/api`

## Troubleshooting

### Backend not running?
```bash
pm2 logs awake-backend
# Check for errors
```

### Frontend not loading?
```bash
sudo tail -f /var/log/nginx/error.log
# Check Nginx errors
```

### Database connection error?
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U sohail -d awake_db
```

## Next Steps (Optional)

1. **Set up domain**: Point your domain DNS to `136.144.175.93`
2. **SSL Certificate**: Run `sudo certbot --nginx -d yourdomain.com`
3. **Update environment**: Change `FRONTEND_URL` to your domain

