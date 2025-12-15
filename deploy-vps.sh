#!/bin/bash
# AWAKE Connect - Automated Deployment Script for VPS
# Usage: ./deploy-vps.sh or chmod +x deploy-vps.sh && ./deploy-vps.sh

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="$HOME/projects/donors"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         AWAKE CONNECT VPS DEPLOYMENT SCRIPT                   ║"
echo "║         Automated: Git Pull → Build → Deploy                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to print step headers
print_step() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
  echo -e "${RED}✗ Project directory not found: $PROJECT_DIR${NC}"
  exit 1
fi

cd "$PROJECT_DIR"

# Step 1: Git Status and Pull
print_step "Step 1: Pulling Latest Code from GitHub"
echo "Current branch: $(git rev-parse --abbrev-ref HEAD)"
echo "Current commit: $(git rev-parse --short HEAD)"

if ! git pull origin main; then
  echo -e "${RED}✗ Git pull failed. Please check network and try again.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Code pulled successfully${NC}"

# Step 2: Display new commit
print_step "Step 2: Latest Commit Info"
git log --oneline -1

# Step 3: Clean build directories
print_step "Step 3: Cleaning Build Cache and Old Artifacts"
echo "Removing: dist/, .vite/, .esbuild/"
rm -rf dist/ node_modules/.vite node_modules/.esbuild 2>/dev/null || true
echo -e "${GREEN}✓ Build cache cleaned${NC}"

# Step 4: Fresh install dependencies
print_step "Step 4: Installing Dependencies (Fresh Install)"
if ! npm ci; then
  echo -e "${RED}✗ npm ci failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 5: Build application
print_step "Step 5: Building Application with Vite"
echo "This will take 20-45 seconds..."
if ! npm run build; then
  echo -e "${RED}✗ Build failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Build completed successfully${NC}"

# Step 6: Verify build output
print_step "Step 6: Verifying Build Output"
if [ -d "dist" ]; then
  DIST_SIZE=$(du -sh dist/ | cut -f1)
  FILES=$(find dist/assets -type f | wc -l)
  echo -e "${GREEN}✓ dist/ folder created${NC}"
  echo "  Size: $DIST_SIZE"
  echo "  Asset files: $FILES"
  echo ""
  echo "Asset files:"
  ls -lh dist/assets/ | awk '{print "  " $9 " (" $5 ")"}'
else
  echo -e "${RED}✗ dist/ folder not found${NC}"
  exit 1
fi

# Step 7: Verify key code sections in compiled output
print_step "Step 7: Verifying Application Code in Compiled Build"
COMPILED_JS=$(find dist/assets -name "index-*.js" | head -1)

if [ -z "$COMPILED_JS" ]; then
  echo -e "${RED}✗ No compiled JavaScript found in dist/assets/${NC}"
  exit 1
fi

echo "Checking compiled file: $(basename $COMPILED_JS)"

# Count key messages
STEP3_COUNT=$(grep -o "Step 3 Complete" "$COMPILED_JS" 2>/dev/null | wc -l)
SUBMIT_COUNT=$(grep -o "Application submitted successfully" "$COMPILED_JS" 2>/dev/null | wc -l)

echo ""
echo "Message verification:"
echo "  ApplicationForm - 'Step 3 Complete': $STEP3_COUNT"
echo "  StudentDashboard - 'Application submitted successfully': $SUBMIT_COUNT"

if [ "$STEP3_COUNT" -eq 1 ] && [ "$SUBMIT_COUNT" -eq 1 ]; then
  echo -e "${GREEN}✓ Both required messages found in compiled code${NC}"
else
  echo -e "${YELLOW}⚠ Warning: Expected 1 each, found $STEP3_COUNT and $SUBMIT_COUNT${NC}"
fi

# Step 8: Verify source files match GitHub
print_step "Step 8: Verifying Source Files Match GitHub"
echo "Checking ApplicationForm.jsx:"
LOCAL_HASH=$(md5sum src/pages/ApplicationForm.jsx | awk '{print $1}')
GITHUB_HASH=$(git show origin/main:src/pages/ApplicationForm.jsx | md5sum | awk '{print $1}')
if [ "$LOCAL_HASH" = "$GITHUB_HASH" ]; then
  echo -e "${GREEN}✓ ApplicationForm.jsx matches GitHub${NC}"
else
  echo -e "${YELLOW}⚠ ApplicationForm.jsx differs from GitHub${NC}"
fi

echo ""
echo "Checking StudentDashboard.jsx:"
LOCAL_HASH=$(md5sum src/pages/StudentDashboard.jsx | awk '{print $1}')
GITHUB_HASH=$(git show origin/main:src/pages/StudentDashboard.jsx | md5sum | awk '{print $1}')
if [ "$LOCAL_HASH" = "$GITHUB_HASH" ]; then
  echo -e "${GREEN}✓ StudentDashboard.jsx matches GitHub${NC}"
else
  echo -e "${YELLOW}⚠ StudentDashboard.jsx differs from GitHub${NC}"
fi

# Step 9: Restart PM2
print_step "Step 9: Restarting PM2 Processes"
if ! pm2 restart all; then
  echo -e "${RED}✗ PM2 restart failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ PM2 processes restarted${NC}"

# Step 10: Show PM2 status
print_step "Step 10: PM2 Status"
pm2 status

# Step 11: Show recent logs
print_step "Step 11: Application Startup Logs"
pm2 logs awake-backend --lines 3 --nostream 2>/dev/null || echo "No logs yet"

# Final summary
echo ""
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo -e "║${GREEN}✓ DEPLOYMENT COMPLETE - APPLICATION IS LIVE${NC}${BLUE}                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo "1. Clear browser cache (Ctrl+Shift+Delete)"
echo "2. Hard refresh the application (Ctrl+Shift+R)"
echo "3. Test the application at: http://aircrew.nl"
echo ""
echo "To view live logs:"
echo "  pm2 logs awake-backend"
echo ""
echo "To check application status:"
echo "  pm2 status"
echo ""
echo "Deployment completed at: $(date '+%Y-%m-%d %H:%M:%S')"
