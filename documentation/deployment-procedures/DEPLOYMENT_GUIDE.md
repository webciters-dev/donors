# AWAKE Connect Production Deployment Guide
# Run these commands on your production server

# 1. Update system and install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install nginx postgresql postgresql-contrib nodejs npm git certbot python3-certbot-nginx -y

# 2. Install Node.js 18+ (if needed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install PM2 for process management
sudo npm install -g pm2

# 4. Create application user
sudo adduser awake-app
sudo usermod -aG sudo awake-app

# 5. Setup PostgreSQL
sudo -u postgres createuser --interactive --pwprompt awake_user
sudo -u postgres createdb awake_production -O awake_user

# 6. Clone your repository
sudo -u awake-app git clone https://github.com/webciters/awake.git /home/awake-app/awake
cd /home/awake-app/awake

# 7. Install dependencies
sudo -u awake-app npm install
cd server && sudo -u awake-app npm install

# 8. Setup environment variables
sudo -u awake-app cp server/.env.example server/.env.production