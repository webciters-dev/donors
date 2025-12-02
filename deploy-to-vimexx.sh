# Complete AWAKE Connect Deployment on Vimexx VPS
#!/bin/bash
set -e

echo " Deploying AWAKE Connect to Vimexx VPS..."

# Variables - CUSTOMIZE THESE
VPS_USER="your_vps_username"  # Your Vimexx VPS username
DOMAIN="awake.webciters.dev"
DB_PASSWORD="your_secure_db_password_here"  # Change this!

# 1. Install Node.js (if not already installed)
echo " Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# 2. Install PM2 process manager
sudo npm install -g pm2

# 3. Create application directory
sudo mkdir -p /var/www/awake
sudo chown $USER:$USER /var/www/awake

# 4. Clone or upload your project
echo " Setting up application files..."
cd /var/www/awake

# If you have git access (recommended)
# git clone https://github.com/webciters/awake.git .
# OR manually upload your project files to /var/www/awake

echo "️  Please upload your project files to /var/www/awake/"
echo "   You can use SCP, SFTP, or your hosting panel file manager"

# 5. Install dependencies (run after uploading files)
echo " Installing application dependencies..."
# npm install
# cd server && npm install

# 6. Create environment file
echo "️ Creating environment configuration..."
cat > /var/www/awake/server/.env.production << EOF
# Database Configuration
DATABASE_URL="postgresql://awake_user:${DB_PASSWORD}@localhost:5432/awake_production"

# Server Configuration  
NODE_ENV=production
PORT=3001

# Frontend URL
FRONTEND_URL=https://${DOMAIN}
FRONTEND_URLS=https://${DOMAIN},https://www.${DOMAIN}

# JWT Secret (generate a strong one!)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "\\n")

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/var/www/awake/server/uploads

# Email (Professional aircrew.nl configuration)
EMAIL_HOST=mail.aircrew.nl
EMAIL_PORT=587
EMAIL_USER=noreply@aircrew.nl
EMAIL_PASS=RoG*741#NoR
EMAIL_FROM=AWAKE Connect <noreply@aircrew.nl>
EOF

echo " Environment file created at /var/www/awake/server/.env.production"

# 7. Create PM2 ecosystem file
cat > /var/www/awake/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'awake-backend',
    script: './server/src/server.js',
    cwd: '/var/www/awake',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_file: './server/.env.production',
    instances: 1, // Adjust based on your VPS CPU cores
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '512M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# 8. Create logs directory
mkdir -p /var/www/awake/logs
mkdir -p /var/www/awake/server/uploads

echo " Basic setup completed!"
echo ""
echo " NEXT STEPS:"
echo "1. Upload your project files to /var/www/awake/"
echo "2. Run: cd /var/www/awake && npm install"
echo "3. Run: cd /var/www/awake/server && npm install"  
echo "4. Run database migrations: cd /var/www/awake/server && npx prisma migrate deploy"
echo "5. Build frontend: cd /var/www/awake && npm run build"
echo "6. Start backend: pm2 start ecosystem.config.js"
echo "7. Configure Nginx to serve frontend and proxy API calls"
echo ""
echo " Database URL: postgresql://awake_user:${DB_PASSWORD}@localhost:5432/awake_production"