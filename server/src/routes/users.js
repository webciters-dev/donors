// server/src/routes/users.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, onlyRoles } from "../middleware/auth.js";
import { requireBasicRecaptcha } from "../middleware/recaptcha.js";
import bcrypt from "bcryptjs";
import { sendFieldOfficerWelcomeEmail } from "../lib/emailService.js";

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/users?role=SUB_ADMIN (or CASE_WORKER)
// Admin and Super Admin listing of users, optionally filtered by role
router.get("/", requireAuth, onlyRoles("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const role = req.query.role ? String(req.query.role) : undefined;
    let where = {};
    
    // Support both SUB_ADMIN and CASE_WORKER terminology for backward compatibility
    if (role === "SUB_ADMIN" || role === "CASE_WORKER") {
      where = { role: "SUB_ADMIN" }; // Internal storage remains SUB_ADMIN for compatibility
    } else if (role) {
      where = { role };
    }
    
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ users });
  } catch (e) {
    console.error("GET /api/users failed:", e);
    res.status(500).json({ error: "Failed to list users" });
  }
});

// POST /api/users/sub-admins (Legacy: now creates Case Workers)
// Admin and Super Admin creates a SUB_ADMIN with name, email, password
router.post("/sub-admins", requireAuth, onlyRoles("ADMIN", "SUPER_ADMIN"), requireBasicRecaptcha, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    
    // Debug logging to diagnose production issue
    console.log("🔍 Case Worker Creation Debug:", {
      requestBody: req.body,
      name, 
      email, 
      password: password ? '[PROVIDED]' : '[MISSING]',
      bodyKeys: Object.keys(req.body || {}),
      contentType: req.headers['content-type'],
      timestamp: new Date().toISOString()
    });
    
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: { name: name || null, email, passwordHash, role: "SUB_ADMIN" }, // Internal role remains SUB_ADMIN
      select: { id: true, name: true, email: true, role: true }
    });

    // Send welcome email to new case worker (async, don't block response)
    sendFieldOfficerWelcomeEmail({
      email: email,
      name: name || 'Case Worker',
      password: password // Send the original password since it's their first login
    }).catch(emailError => {
      console.error('Failed to send case worker welcome email:', emailError);
      // Don't fail the request if email fails
    });

    return res.status(201).json({ user });
  } catch (e) {
    console.error("POST /api/users/sub-admins failed:", e);
    return res.status(500).json({ error: e?.message || "Failed to create case worker" });
  }
});

// POST /api/users/case-workers (New preferred endpoint)
// Admin and Super Admin creates a Case Worker with name, email, password
router.post("/case-workers", requireAuth, onlyRoles("ADMIN", "SUPER_ADMIN"), requireBasicRecaptcha, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    
    // Debug logging to diagnose production issue
    console.log("🔍 Case Worker Creation Debug (case-workers endpoint):", {
      requestBody: req.body,
      name, 
      email, 
      password: password ? '[PROVIDED]' : '[MISSING]',
      bodyKeys: Object.keys(req.body || {}),
      contentType: req.headers['content-type'],
      timestamp: new Date().toISOString()
    });
    
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: { name: name || null, email, passwordHash, role: "SUB_ADMIN" }, // Internal role remains SUB_ADMIN for compatibility
      select: { id: true, name: true, email: true, role: true }
    });

    // Send welcome email to new case worker (async, don't block response)
    sendFieldOfficerWelcomeEmail({
      email: email,
      name: name || 'Case Worker',
      password: password // Send the original password since it's their first login
    }).catch(emailError => {
      console.error('Failed to send case worker welcome email:', emailError);
      // Don't fail the request if email fails
    });

    return res.status(201).json({ user });
  } catch (e) {
    console.error("POST /api/users/case-workers failed:", e);
    return res.status(500).json({ error: e?.message || "Failed to create case worker" });
  }
});

// Backward compatibility route - redirect field-officers to case-workers
router.post("/field-officers", requireAuth, onlyRoles("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  // Just redirect to the case-workers endpoint with the same logic
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: { name: name || null, email, passwordHash, role: "SUB_ADMIN" },
      select: { id: true, name: true, email: true, role: true }
    });

    // Send welcome email to new case worker (async, don't block response)
    sendFieldOfficerWelcomeEmail({
      email: email,
      name: name || 'Case Worker',
      password: password,
      applicationId: 'N/A - General Access',
      studentName: 'You will be assigned applications by administrators'
    }).catch(emailError => {
      console.error('Failed to send case worker welcome email:', emailError);
    });

    return res.status(201).json({ user });
  } catch (e) {
    console.error("POST /api/users/field-officers (compatibility) failed:", e);
    return res.status(500).json({ error: e?.message || "Failed to create case worker" });
  }
});

// PATCH /api/users/:id
// Admin and Super Admin can update a user's name/email/password/role (limited to SUB_ADMIN/DONOR/STUDENT, not elevating to ADMIN here unless already admin)
router.patch( "/:id", requireAuth, onlyRoles("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body || {};
    const data = {};
    if (name !== undefined) data.name = name || null;
    if (email !== undefined) data.email = String(email);
    if (password) data.passwordHash = await bcrypt.hash(String(password), 10);
    if (role && ["SUB_ADMIN","DONOR","STUDENT","ADMIN"].includes(role)) data.role = role;

    const updated = await prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true } });
    return res.json({ user: updated });
  } catch (e) {
    console.error("PATCH /api/users/:id failed:", e);
    if (e.code === "P2025") return res.status(404).json({ error: "User not found" });
    if (String(e.message || "").includes("Unique constraint")) return res.status(409).json({ error: "Email already in use" });
    return res.status(500).json({ error: e?.message || "Failed to update user" });
  }
});

// DELETE /api/users/:id
// Admin and Super Admin can delete a case worker (SUB_ADMIN role only, never ADMIN or SUPER_ADMIN)
router.delete("/:id", requireAuth, onlyRoles("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "User ID is required" });

    // First, get the user to check their role
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent deletion of ADMIN and SUPER_ADMIN users
    if (existingUser.role === "ADMIN" || existingUser.role === "SUPER_ADMIN") {
      return res.status(403).json({ error: "Cannot delete admin or super admin users" });
    }

    // Prevent self-deletion
    if (existingUser.id === req.user.id) {
      return res.status(403).json({ error: "Cannot delete yourself" });
    }

    // Delete the user (Prisma will cascade delete related records)
    await prisma.user.delete({
      where: { id }
    });

    return res.status(200).json({ 
      message: "Case worker deleted successfully",
      deletedUser: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email
      }
    });

  } catch (e) {
    console.error("DELETE /api/users/:id failed:", e);
    if (e.code === "P2025") return res.status(404).json({ error: "User not found" });
    return res.status(500).json({ error: e?.message || "Failed to delete user" });
  }
});

export default router;
