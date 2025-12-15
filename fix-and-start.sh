#!/bin/bash
# Quick fix script for VPS backend startup issues
# Run on VPS: bash fix-and-start.sh

set -e

PROJECT_DIR="/home/sohail/projects/donors"
cd "$PROJECT_DIR"

echo "🔧 Fixing AWAKE Connect Backend..."
echo ""

# Step 1: Fix onlyRoles export
echo "Step 1: Checking auth.js exports..."
if ! grep -q "export function onlyRoles" server/src/middleware/auth.js; then
  echo "⚠️ onlyRoles not exported, adding it..."
  
  # Check if function exists without export
  if grep -q "^function onlyRoles" server/src/middleware/auth.js; then
    sed -i 's/^function onlyRoles/export function onlyRoles/' server/src/middleware/auth.js
    echo "✅ Converted onlyRoles to export"
  else
    # Add it to the end of the file if missing
    cat >> server/src/middleware/auth.js << 'EOFUNC'

/**
 * Ensures the authenticated user has a specific role.
 * Usage: router.get("/admin", requireAuth, onlyRoles("admin"), handler)
 */
export function onlyRoles(...allowed) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) {
      return res.status(403).json({ message: "Forbidden: role missing" });
    }
    if (allowed.length === 0 || allowed.includes(role)) {
      return next();
    }
    return res.status(403).json({
      message: `Forbidden: requires role ${allowed.join(", ")}`,
    });
  };
}
EOFUNC
    echo "✅ Added onlyRoles function"
  fi
else
  echo "✅ onlyRoles is already exported"
fi
echo ""

# Step 2: Fix server.js to load .env.production
echo "Step 2: Checking server.js environment loading..."
if ! grep -q "const envFile = process.env.NODE_ENV" server/src/server.js; then
  echo "⚠️ NODE_ENV loading not found, updating server.js..."
  
  # Create a Python script to do the replacement properly
  python3 << 'EOFPYTHON'
import re

with open('server/src/server.js', 'r') as f:
    content = f.read()

# Replace the simple dotenv.config() with conditional loading
pattern = r"dotenv\.config\(\);"
replacement = """// Load environment variables from appropriate .env file
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: envFile });"""

new_content = re.sub(pattern, replacement, content)

with open('server/src/server.js', 'w') as f:
    f.write(new_content)

print("✅ Updated server.js to load .env.production in production mode")
EOFPYTHON
else
  echo "✅ server.js already has NODE_ENV loading"
fi
echo ""

# Step 3: Create ecosystem.config.js if missing
echo "Step 3: Setting up PM2 ecosystem config..."
if [ ! -f "ecosystem.config.js" ]; then
  echo "⚠️ ecosystem.config.js missing, creating it..."
  cat > ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [
    {
      name: "awake-backend",
      script: "./server/src/server.js",
      cwd: "./",
      instances: 1,
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      min_uptime: "10s",
      max_restarts: 10,
      autorestart: true,
      kill_timeout: 5000,
    },
  ],
};
EOFPM2
  echo "✅ Created ecosystem.config.js"
else
  echo "✅ ecosystem.config.js already exists"
fi
echo ""

# Step 4: Start the server
echo "Step 4: Starting server..."
export NODE_ENV=production

# Kill any existing instances
pm2 delete awake-backend 2>/dev/null || true

# Start with PM2
pm2 start ecosystem.config.js --env production

echo ""
echo "✅ Backend startup in progress!"
echo ""
echo "📊 Check status:"
echo "   pm2 status"
echo ""
echo "📋 View logs:"
echo "   pm2 logs awake-backend --lines 50 --err"
echo ""
echo "🔍 Check for errors:"
echo "   pm2 logs awake-backend --lines 30 --err | head -50"
