#!/bin/bash
# Production deployment script for AWAKE Connect

set -e

PROJECT_DIR="/home/sohail/projects/donors"
cd "$PROJECT_DIR"

echo "🚀 Starting AWAKE Connect Backend with PM2..."

# Set production environment
export NODE_ENV=production

# Kill any existing PM2 processes
pm2 delete all 2>/dev/null || true

# Clean logs
rm -f logs/*.log

# Start the backend with ecosystem.config.js
pm2 start ecosystem.config.js --env production

# Setup PM2 to start on boot
pm2 startup systemd -u sohail --hp /home/sohail
pm2 save

echo "✅ Backend started successfully"
echo "📊 View logs with: pm2 logs awake-backend"
echo "📊 View all processes: pm2 status"
