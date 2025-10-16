# Quick commands to run on your Vimexx VPS
# SSH into your VPS and run these one by one

# 1. Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 2. Create database and user
sudo -u postgres psql -c "CREATE USER awake_user WITH PASSWORD 'ChangeThisPassword123!';"
sudo -u postgres psql -c "CREATE DATABASE awake_production OWNER awake_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE awake_production TO awake_user;"

# 3. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install PM2
sudo npm install -g pm2

# 5. Create application directory  
sudo mkdir -p /var/www/awake
sudo chown $USER:$USER /var/www/awake

# 6. Test database connection
psql "postgresql://awake_user:ChangeThisPassword123!@localhost:5432/awake_production" -c "SELECT 1;"

echo "✅ VPS setup completed!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Upload your AWAKE project files to /var/www/awake/"
echo "2. Create /var/www/awake/server/.env.production with database URL"
echo "3. Install dependencies: cd /var/www/awake && npm install"
echo "4. Run migrations: cd /var/www/awake/server && npx prisma migrate deploy"
echo "5. Build frontend: npm run build"
echo "6. Start backend: pm2 start ecosystem.config.js"
echo "7. Configure nginx to serve frontend and proxy /api calls to :3001"
echo ""
echo "🗄️ Database URL: postgresql://awake_user:ChangeThisPassword123!@localhost:5432/awake_production"