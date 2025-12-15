#!/bin/bash
# Deploy fixed backend code to VPS
# This script updates auth.js and server.js with the ES module hoisting fixes

set -e

PROJECT_DIR="/home/sohail/projects/donors"
SERVER_DIR="$PROJECT_DIR/server"

echo "🚀 Deploying VPS Backend Fixes..."
echo ""

# Step 1: Backup original files
echo "Step 1: Backing up original files..."
cp "$SERVER_DIR/src/middleware/auth.js" "$SERVER_DIR/src/middleware/auth.js.backup"
cp "$SERVER_DIR/src/server.js" "$SERVER_DIR/src/server.js.backup"
echo "✅ Backups created"
echo ""

# Step 2: Update auth.js with lazy-loaded JWT_SECRET
echo "Step 2: Updating auth.js with lazy-loaded JWT_SECRET..."
cat > "$SERVER_DIR/src/middleware/auth.js" << 'EOFAUTH'
// server/src/middleware/auth.js
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

// Get JWT_SECRET - validate at runtime when first used, not at import time
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is required. " +
      "Please set it in your .env file before starting the server."
    );
  }
  return secret;
}

/**
 * Reads the JWT from the Authorization header and verifies it.
 * - Expected header: "Authorization: Bearer <token>"
 * - On success: attaches { id, role, email } to req.user and calls next()
 * - On failure: returns 401
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Missing token" });
    }

    const payload = jwt.verify(token, getJwtSecret());
    // payload should have { sub, role, email } because that's how we signed it
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };

    // Enrich with linked studentId/donorId for role-based checks
    try {
      const u = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { studentId: true, donorId: true },
      });
      if (u) {
        req.user.studentId = u.studentId || null;
        req.user.donorId = u.donorId || null;
      }
    } catch (_e) {
      // ignore enrichment failure; basic auth still holds
    }

    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * Ensures the authenticated user has a specific role.
 * Usage: app.get("/admin", requireAuth, requireRole("ADMIN"), handler)
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== role) return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}

/**
 * Ensures the authenticated user has admin privileges (ADMIN or SUPER_ADMIN).
 * Usage: app.get("/admin-area", requireAuth, requireAdminOrSuperAdmin(), handler)
 */
export function requireAdminOrSuperAdmin() {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Forbidden: requires admin privileges" });
    }
    return next();
  };
}

/**
 * Ensures the authenticated user is specifically SUPER_ADMIN.
 * Usage: app.get("/super-admin", requireAuth, requireSuperAdmin(), handler)
 */
export function requireSuperAdmin() {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Forbidden: requires super admin privileges" });
    }
    return next();
  };
}

/**
 * Usage:
 *   router.get("/admin", requireAuth, onlyRoles("admin"), handler)
 *
 * Assumes requireAuth has already set req.user (e.g., from your JWT).
 * If you call onlyRoles() with no arguments, it will pass for any logged-in user.
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

/**
 * Optional auth: if a valid Bearer token is present, attach req.user; otherwise continue.
 */
export function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme === "Bearer" && token) {
      const payload = jwt.verify(token, getJwtSecret());
      req.user = { id: payload.sub, role: payload.role, email: payload.email };
    }
  } catch (e) {
    // ignore invalid token and proceed as unauthenticated
  } finally {
    next();
  }
}
EOFAUTH
echo "✅ auth.js updated with lazy JWT_SECRET loading"
echo ""

# Step 3: Update server.js with absolute path resolution
echo "Step 3: Updating server.js with absolute path resolution..."

# Create a temporary Python script to update server.js
python3 << 'EOFPYTHON'
import re

file_path = "/home/sohail/projects/donors/server/src/server.js"

with open(file_path, 'r') as f:
    content = f.read()

# Find and replace the dotenv imports and config section
old_pattern = r'''// server/src/server\.js \(ESM\)
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of this file
const __filename = fileURLToPath\(import\.meta\.url\);
const __dirname = path\.dirname\(__filename\);
const serverDir = path\.join\(__dirname, "\.\."\);

// Load environment variables FIRST before importing anything that needs them
const envFile = process\.env\.NODE_ENV === "production" \? "\.env\.production" : "\.env";
const envPath = path\.join\(serverDir, envFile\);
dotenv\.config\(\{ path: envPath \}\);'''

new_code = '''// server/src/server.js (ESM)
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.join(__dirname, "..");

// Load environment variables FIRST before importing anything that needs them
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
const envPath = path.join(serverDir, envFile);
dotenv.config({ path: envPath });'''

new_content = re.sub(old_pattern, new_code, content, flags=re.MULTILINE | re.DOTALL)

# If the above didn't work, the file already has the right format
if new_content == content:
    print("✅ server.js already has correct path resolution")
else:
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("✅ server.js updated with absolute path resolution")

EOFPYTHON

echo ""

# Step 4: Stop running instances
echo "Step 4: Stopping PM2 instances..."
pm2 delete awake-backend 2>/dev/null || true
echo "✅ PM2 cleaned up"
echo ""

# Step 5: Start the server
echo "Step 5: Starting server with new code..."
cd "$SERVER_DIR"
export NODE_ENV=production
pm2 start "$PROJECT_DIR/ecosystem.config.js" --env production

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Verify startup:"
echo "   pm2 status"
echo "   pm2 logs awake-backend --lines 50"
echo ""
