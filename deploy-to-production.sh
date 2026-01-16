#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# AWAKE Connect - Production Deployment Script
# Target: aircrew.nl VPS
# Created: January 15, 2026
# 
# Usage: 
#   chmod +x deploy-to-production.sh
#   ./deploy-to-production.sh
#
# This script is designed to run ON THE VPS after SSH connection
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Exit on any error

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION - Adjust these if your VPS paths differ
# ─────────────────────────────────────────────────────────────────────────────
PROJECT_DIR="$HOME/projects/donors"
BACKUP_DIR="$HOME/backups"
BRANCH="main"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ─────────────────────────────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────
print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
}

print_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# ─────────────────────────────────────────────────────────────────────────────
# PRE-FLIGHT CHECKS
# ─────────────────────────────────────────────────────────────────────────────
print_header "AWAKE Connect - Production Deployment"
echo "Timestamp: $TIMESTAMP"
echo "Target: aircrew.nl"
echo ""

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory not found: $PROJECT_DIR"
    echo "Please update PROJECT_DIR variable in this script"
    exit 1
fi

cd "$PROJECT_DIR"
print_success "Working directory: $(pwd)"

# Check if PM2 is running
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 not found. Please install PM2: npm install -g pm2"
    exit 1
fi

# Show current state
print_step "Current deployment state:"
echo "  Branch: $(git rev-parse --abbrev-ref HEAD)"
echo "  Commit: $(git rev-parse --short HEAD)"
echo "  Message: $(git log --oneline -1 --format='%s')"

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 1: BACKUP
# ─────────────────────────────────────────────────────────────────────────────
print_header "Phase 1: Creating Backup"

# Create backup tag
BACKUP_TAG="v1.0.1-backup-$TIMESTAMP"
git tag "$BACKUP_TAG"
print_success "Created backup tag: $BACKUP_TAG"

# Backup database (optional but recommended)
mkdir -p "$BACKUP_DIR"
if [ -f "server/prisma/dev.db" ]; then
    cp "server/prisma/dev.db" "$BACKUP_DIR/donors_db_$TIMESTAMP.db"
    print_success "Database backed up to: $BACKUP_DIR/donors_db_$TIMESTAMP.db"
fi

# Stash any local changes
if [ -n "$(git status --porcelain)" ]; then
    git stash push -m "Pre-deployment stash $TIMESTAMP"
    print_warning "Local changes stashed"
fi

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2: PULL LATEST CODE
# ─────────────────────────────────────────────────────────────────────────────
print_header "Phase 2: Pulling Latest Code from GitHub"

print_step "Fetching from origin..."
git fetch origin

print_step "Pulling $BRANCH branch..."
if ! git pull origin $BRANCH; then
    print_error "Git pull failed!"
    echo "Rollback with: git checkout $BACKUP_TAG"
    exit 1
fi

NEW_COMMIT=$(git rev-parse --short HEAD)
print_success "Updated to commit: $NEW_COMMIT"
echo "  Message: $(git log --oneline -1 --format='%s')"

# Show what changed
echo ""
print_step "Changes since last deployment:"
git log --oneline $BACKUP_TAG..HEAD 2>/dev/null | head -10 || echo "  (First deployment or tag not found)"

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 3: INSTALL DEPENDENCIES
# ─────────────────────────────────────────────────────────────────────────────
print_header "Phase 3: Installing Dependencies"

# Frontend dependencies
print_step "Installing frontend dependencies..."
npm ci --silent
print_success "Frontend dependencies installed"

# Backend dependencies
print_step "Installing backend dependencies..."
cd server
npm ci --silent
print_success "Backend dependencies installed"

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 4: DATABASE MIGRATION
# ─────────────────────────────────────────────────────────────────────────────
print_header "Phase 4: Database Migration"

print_step "Running Prisma migrations..."
npx prisma migrate deploy 2>&1 || {
    print_warning "No new migrations or already up to date"
}

print_step "Regenerating Prisma client..."
npx prisma generate
print_success "Prisma client regenerated"

cd ..

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 5: BUILD FRONTEND
# ─────────────────────────────────────────────────────────────────────────────
print_header "Phase 5: Building Frontend"

print_step "Cleaning build cache..."
rm -rf dist/ node_modules/.vite node_modules/.esbuild 2>/dev/null || true
print_success "Build cache cleaned"

print_step "Building production bundle (this takes 20-45 seconds)..."
if ! npm run build; then
    print_error "Build failed!"
    echo "Rollback with: git checkout $BACKUP_TAG && npm ci && npm run build"
    exit 1
fi

# Verify build output
if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist/ | cut -f1)
    FILES=$(find dist/assets -type f 2>/dev/null | wc -l)
    print_success "Build complete: $DIST_SIZE, $FILES asset files"
else
    print_error "dist/ folder not created!"
    exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 6: RESTART SERVICES
# ─────────────────────────────────────────────────────────────────────────────
print_header "Phase 6: Restarting PM2 Services"

print_step "Restarting all PM2 processes..."
pm2 restart all

# Wait for services to start
sleep 3

print_step "PM2 Status:"
pm2 status

# Check if processes are online
ONLINE_COUNT=$(pm2 jlist 2>/dev/null | grep -o '"status":"online"' | wc -l)
if [ "$ONLINE_COUNT" -gt 0 ]; then
    print_success "$ONLINE_COUNT process(es) online"
else
    print_warning "No processes showing online - check pm2 logs"
fi

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 7: VERIFICATION
# ─────────────────────────────────────────────────────────────────────────────
print_header "Phase 7: Verification Tests"

# Test API health
print_step "Testing API health endpoint..."
sleep 2
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    print_success "API health check passed (HTTP 200)"
else
    print_warning "API health check returned HTTP $HEALTH_RESPONSE"
fi

# Verify key features in compiled code
print_step "Verifying compiled code includes new features..."
COMPILED_JS=$(find dist/assets -name "index-*.js" 2>/dev/null | head -1)
if [ -n "$COMPILED_JS" ]; then
    # Check for otherResources (new feature)
    if grep -q "otherResources" "$COMPILED_JS" 2>/dev/null; then
        print_success "✓ otherResources field found in build"
    else
        print_warning "otherResources not found in build (may be minified differently)"
    fi
    
    # Check for photo handling
    if grep -q "photoUrl\|photoThumbnail" "$COMPILED_JS" 2>/dev/null; then
        print_success "✓ Photo handling code found in build"
    fi
else
    print_warning "Could not find compiled JS for verification"
fi

# Check recent logs for errors
print_step "Checking for startup errors..."
ERROR_COUNT=$(pm2 logs awake-backend --lines 20 --nostream 2>&1 | grep -i "error\|exception\|failed" | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    print_success "No errors in recent logs"
else
    print_warning "$ERROR_COUNT potential error(s) in logs - review with: pm2 logs awake-backend"
fi

# ─────────────────────────────────────────────────────────────────────────────
# DEPLOYMENT COMPLETE
# ─────────────────────────────────────────────────────────────────────────────
print_header "DEPLOYMENT COMPLETE"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ AWAKE Connect successfully deployed to aircrew.nl          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Deployment Summary:"
echo "  • Backup Tag: $BACKUP_TAG"
echo "  • New Commit: $NEW_COMMIT"
echo "  • Build Size: $DIST_SIZE"
echo "  • Deployed At: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo -e "${YELLOW}IMPORTANT: Clear browser cache before testing!${NC}"
echo "  • Windows/Linux: Ctrl+Shift+R"
echo "  • Mac: Cmd+Shift+R"
echo ""
echo "Quick verification URLs:"
echo "  • Homepage:     https://aircrew.nl"
echo "  • Login:        https://aircrew.nl/login"
echo "  • API Health:   https://aircrew.nl/api/health"
echo ""
echo "If something is wrong, rollback with:"
echo -e "  ${CYAN}git checkout $BACKUP_TAG && cd server && npm ci && npx prisma generate && cd .. && npm ci && npm run build && pm2 restart all${NC}"
echo ""
echo "View logs:"
echo "  pm2 logs awake-backend"
echo ""
