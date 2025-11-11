#!/bin/bash
# Deploy to aircrew.nl server
# Usage: ./deploy-aircrew.sh

set -e

echo "🚀 Deploying to aircrew.nl..."

# Configuration - CUSTOMIZE THESE
SERVER_HOST="aircrew.nl"
SERVER_USER="ssh sohail@136.144.175.93"  # Replace with your SSH username
APP_PATH="/path/to/your/app"  # Replace with your app path on server

# SSH into server and run deployment commands
ssh $SERVER_USER@$SERVER_HOST << 'EOF'
  echo "📥 Pulling latest code..."
  cd /path/to/your/app
  git pull origin main
  
  echo "📦 Installing dependencies..."
  npm install
  cd server && npm install && cd ..
  
  echo "🏗️ Building production version..."
  npm run build
  
  echo "🔄 Restarting services..."
  pm2 reload all
  
  echo "🏥 Health check..."
  sleep 3
  curl -f https://aircrew.nl/api/health && echo "✅ Deployment successful!"
EOF

echo "🎉 Deployment to aircrew.nl completed!"