// server/src/middleware/auth.js
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

// Require JWT_SECRET environment variable - fail fast if missing
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "FATAL: JWT_SECRET environment variable is required. " +
    "Please set it in your .env file before starting the server."
  );
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

    const payload = jwt.verify(token, JWT_SECRET);
    // payload should have { sub, role, email } because that’s how we signed it
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
// --- Role gatekeeper (append this to server/src/middleware/auth.js) ---

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

// Optional auth: if a valid Bearer token is present, attach req.user; otherwise continue.
export function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme === "Bearer" && token) {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = { id: payload.sub, role: payload.role, email: payload.email };
    }
  } catch (e) {
    // ignore invalid token and proceed as unauthenticated
  } finally {
    next();
  }
}
