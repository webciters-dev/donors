#!/bin/bash

# AWAKE Connect Deployment Script
# Run this script on your VPS server to deploy the application

set -e  # Exit on error

echo "🚀 Starting AWAKE Connect Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/sohail/projects/donors"
BACKEND_DIR="$PROJECT_DIR/server"
FRONTEND_DIR="$PROJECT_DIR"

# Check if running as correct user
if [ "$USER" != "sohail" ]; then
    echo -e "${YELLOW}Warning: Not running as user 'sohail'. Some commands may fail.${NC}"
fi

# Step 1: Navigate to project directory
echo -e "${GREEN}Step 1: Navigating to project directory...${NC}"
cd "$PROJECT_DIR" || exit 1

# Step 2: Install/Update dependencies
echo -e "${GREEN}Step 2: Installing dependencies...${NC}"

# Backend dependencies
echo "Installing backend dependencies..."
cd "$BACKEND_DIR"
npm install --production

# Frontend dependencies
echo "Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install

# Step 3: Generate Prisma Client
echo -e "${GREEN}Step 3: Generating Prisma Client...${NC}"
cd "$BACKEND_DIR"
npm run db:generate

# Step 4: Run database migrations
echo -e "${GREEN}Step 4: Running database migrations...${NC}"
cd "$BACKEND_DIR"
npm run db:migrate || echo -e "${YELLOW}Migration may have failed or already applied. Continuing...${NC}"

# Step 5: Build frontend
echo -e "${GREEN}Step 5: Building frontend...${NC}"
cd "$FRONTEND_DIR"
npm run build

# Step 6: Create upload directory if it doesn't exist
echo -e "${GREEN}Step 6: Creating upload directory...${NC}"
mkdir -p "$BACKEND_DIR/uploads"
chmod 755 "$BACKEND_DIR/uploads"

# Step 7: Restart backend with PM2
echo -e "${GREEN}Step 7: Restarting backend server...${NC}"
cd "$BACKEND_DIR"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 not found. Installing PM2...${NC}"
    npm install -g pm2
fi

# Stop existing process if running
pm2 stop awake-backend 2>/dev/null || true
pm2 delete awake-backend 2>/dev/null || true

# Start backend
NODE_ENV=production pm2 start src/server.js --name "awake-backend" --node-args="--max-old-space-size=2048"

# Save PM2 configuration
pm2 save

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Check backend logs: pm2 logs awake-backend"
echo "2. Verify backend is running: pm2 list"
echo "3. Test API: curl http://localhost:3001/api/health"
echo "4. Reload Nginx: sudo systemctl reload nginx"


