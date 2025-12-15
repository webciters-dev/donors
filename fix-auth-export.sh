#!/bin/bash
# Fix onlyRoles export in auth.js on the VPS
# Run this on the VPS: bash fix-auth-export.sh

FILE="/home/sohail/projects/donors/server/src/middleware/auth.js"

# Check if onlyRoles is already exported
if grep -q "export function onlyRoles" "$FILE"; then
  echo "✅ onlyRoles is already exported"
  exit 0
fi

# Check if the function exists but isn't exported
if grep -q "function onlyRoles" "$FILE"; then
  echo "⚠️ Found onlyRoles function, converting to export..."
  sed -i 's/^function onlyRoles/export function onlyRoles/' "$FILE"
  echo "✅ Fixed onlyRoles export"
  exit 0
fi

# If it doesn't exist at all, we need to add it
if ! grep -q "onlyRoles" "$FILE"; then
  echo "⚠️ onlyRoles function not found, adding it..."
  
  # Find the line with requireSuperAdmin export and add onlyRoles after it
  cat >> "$FILE" << 'EOF'

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
EOF
  
  echo "✅ Added onlyRoles function"
  exit 0
fi
