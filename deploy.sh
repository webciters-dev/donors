#!/bin/bash
# Production deployment script for AWAKE Connect
# Run as: ./deploy.sh

set -e  # Exit on any error

echo "🚀 Starting AWAKE Connect deployment..."

# Variables
APP_DIR="/home/awake-app/awake"
BACKUP_DIR="/home/awake-app/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
echo "📦 Creating backup..."
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump awake_production > $BACKUP_DIR/db_backup_$DATE.sql

# Pull latest code
echo "📥 Pulling latest code..."
cd $APP_DIR
sudo -u awake-app git pull origin main

# Install/update dependencies
echo "📦 Installing dependencies..."
sudo -u awake-app npm ci --production
cd server && sudo -u awake-app npm ci --production

# Run database migrations
echo "🗄️ Running database migrations..."
sudo -u awake-app npx prisma migrate deploy
sudo -u awake-app npx prisma generate

# Build frontend
echo "🏗️ Building frontend..."
cd $APP_DIR
sudo -u awake-app npm run build

# Restart services
echo "🔄 Restarting services..."
sudo -u awake-app pm2 reload ecosystem.config.json
sudo systemctl reload nginx

# Health check
echo "🏥 Running health check..."
sleep 5
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend health check: PASSED"
else
    echo "❌ Backend health check: FAILED"
    echo "🔄 Rolling back..."
    sudo -u awake-app pm2 restart awake-backend
    exit 1
fi

if curl -f https://awake.webciters.dev > /dev/null 2>&1; then
    echo "✅ Frontend health check: PASSED"
else
    echo "⚠️ Frontend health check: WARNING (might need SSL setup)"
fi

echo "🎉 Deployment completed successfully!"
echo "🌐 Visit: https://awake.webciters.dev"
echo "🔐 Admin login: admin@awake.com / admin123"