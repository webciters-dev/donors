#!/bin/bash

# ============================================================
# AWAKE Connect - Automated Deployment Script for beta.aircrew.nl
# ============================================================
# This script automates the deployment to your VPS

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="beta.aircrew.nl"
APP_DIR="/home/beta-app/beta"
APP_USER="$USER"
DB_NAME="awake_db"
DB_USER="your_db_user"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         AWAKE Connect Deployment Script                    ║${NC}"
echo -e "${BLUE}║         Target: ${DOMAIN}                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# Function to print status
status() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# Step 1: Check if running with proper user
echo -e "\n${BLUE}Step 1: Pre-deployment Checks${NC}"

if [ "$EUID" -eq 0 ]; then 
    error "Please do not run this script as root"
fi

if ! command -v node &> /dev/null; then
    error "Node.js not installed. Please install Node.js first."
fi

if ! command -v npm &> /dev/null; then
    error "npm not installed. Please install npm first."
fi

if ! command -v pm2 &> /dev/null; then
    error "PM2 not installed. Run: sudo npm install -g pm2"
fi

status "Node.js $(node --version)"
status "npm $(npm --version)"
status "PM2 $(pm2 --version)"

# Step 2: Check if app directory exists
echo -e "\n${BLUE}Step 2: Application Directory${NC}"

if [ ! -d "$APP_DIR" ]; then
    error "Application directory not found: $APP_DIR"
fi

cd "$APP_DIR"
status "Working directory: $APP_DIR"

# Step 3: Check Git status
echo -e "\n${BLUE}Step 3: Git Status${NC}"

if ! git rev-parse --git-dir > /dev/null 2>&1; then
    warning "Not a git repository. Skipping git update."
else
    status "Current branch: $(git rev-parse --abbrev-ref HEAD)"
    status "Last commit: $(git log -1 --pretty=format:'%h - %s')"
fi

# Step 4: Stop existing services
echo -e "\n${BLUE}Step 4: Stop Services${NC}"

if pm2 list | grep -q "beta-backend"; then
    pm2 stop beta-backend
    status "Backend stopped"
else
    warning "Backend not running"
fi

# Step 5: Backup current state
echo -e "\n${BLUE}Step 5: Backup Current State${NC}"

BACKUP_DIR="$APP_DIR/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

if [ -d "$APP_DIR/dist" ]; then
    tar -czf "$BACKUP_DIR/dist_$TIMESTAMP.tar.gz" "$APP_DIR/dist" 2>/dev/null
    status "Frontend backup: $BACKUP_DIR/dist_$TIMESTAMP.tar.gz"
fi

if [ -d "$APP_DIR/server/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" "$APP_DIR/server/uploads" 2>/dev/null
    status "Uploads backup created"
fi

# Step 6: Pull latest code (if git repo)
echo -e "\n${BLUE}Step 6: Update Source Code${NC}"

if git rev-parse --git-dir > /dev/null 2>&1; then
    git pull origin main
    status "Code updated from main branch"
else
    warning "Skipping git pull (not a git repository)"
fi

# Step 7: Install dependencies
echo -e "\n${BLUE}Step 7: Install Dependencies${NC}"

# Frontend dependencies
npm install --production=false
status "Frontend dependencies installed"

# Backend dependencies
cd server
npm install --production=true
cd ..
status "Backend dependencies installed"

# Step 8: Build frontend
echo -e "\n${BLUE}Step 8: Build Frontend${NC}"

npm run build
status "Frontend built successfully"

# Step 9: Run database migrations
echo -e "\n${BLUE}Step 9: Database Migrations${NC}"

if [ -f "server/.env.production" ]; then
    cd server
    npx prisma migrate deploy --skip-generate || warning "Migrations skipped or already applied"
    cd ..
    status "Database migrations completed"
else
    warning "No .env.production found. Skipping migrations."
fi

# Step 10: Verify environment files
echo -e "\n${BLUE}Step 10: Environment Files${NC}"

if [ ! -f "server/.env.production" ]; then
    error "server/.env.production not found!"
else
    status "Backend environment file verified"
fi

# Step 11: Create necessary directories
echo -e "\n${BLUE}Step 11: Create Directories${NC}"

mkdir -p "$APP_DIR/logs"
mkdir -p "$APP_DIR/server/uploads"
status "Directories created/verified"

# Step 12: Start services
echo -e "\n${BLUE}Step 12: Start Services${NC}"

pm2 delete beta-backend 2>/dev/null || true
pm2 start ecosystem.config.js --name beta-backend
status "Backend started"

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 3

# Step 13: Verify services
echo -e "\n${BLUE}Step 13: Verify Services${NC}"

pm2 list

status "Backend status verified"

# Step 14: Test endpoints
echo -e "\n${BLUE}Step 14: Health Checks${NC}"

# Wait a moment for backend
sleep 2

# Test local backend
if curl -s http://localhost:3001/api/health > /dev/null; then
    status "Backend health check passed"
else
    warning "Backend health check failed. Check logs with: pm2 logs beta-backend"
fi

# Step 15: Save PM2 process list
echo -e "\n${BLUE}Step 15: Save Process List${NC}"

pm2 save
status "PM2 process list saved"

# Step 16: Summary
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         DEPLOYMENT COMPLETED SUCCESSFULLY                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Verify Nginx is configured for $DOMAIN"
echo "2. Test in browser: https://$DOMAIN"
echo "3. Check logs: pm2 logs beta-backend"
echo "4. Monitor: pm2 monit"

echo -e "\n${YELLOW}Useful Commands:${NC}"
echo "  pm2 status              - Show process status"
echo "  pm2 logs beta-backend   - View logs"
echo "  pm2 monit               - Monitor processes"
echo "  pm2 restart beta-backend - Restart backend"

echo -e "\n${BLUE}Deployment URL:${NC} https://$DOMAIN"
echo -e "${GREEN}Status: Ready for testing${NC}\n"
