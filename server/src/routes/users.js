// server/src/routes/users.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, onlyRoles } from "../middleware/auth.js";
import bcrypt from "bcryptjs";
import { sendFieldOfficerWelcomeEmail } from "../lib/emailService.js";

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/users?role=FIELD_OFFICER
// Admin-only listing of users, optionally filtered by role
router.get("/", requireAuth, onlyRoles("ADMIN"), async (req, res) => {
  try {
    const role = req.query.role ? String(req.query.role) : undefined;
    const where = role ? { role } : {};
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

// POST /api/users/field-officers
// Admin creates a FIELD_OFFICER with name, email, password
router.post("/field-officers", requireAuth, onlyRoles("ADMIN"), async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: { name: name || null, email, passwordHash, role: "FIELD_OFFICER" },
      select: { id: true, name: true, email: true, role: true }
    });

    // Send welcome email to new field officer (async, don't block response)
    sendFieldOfficerWelcomeEmail({
      email: email,
      name: name || 'Field Officer',
      password: password, // Send the original password since it's their first login
      applicationId: 'N/A - General Access',
      studentName: 'You will be assigned applications by administrators'
    }).catch(emailError => {
      console.error('Failed to send sub admin welcome email:', emailError);
      // Don't fail the request if email fails
    });

    return res.status(201).json({ user });
  } catch (e) {
    console.error("POST /api/users/field-officers failed:", e);
    return res.status(500).json({ error: e?.message || "Failed to create field officer" });
  }
});

// PATCH /api/users/:id
// Admin can update a user's name/email/password/role (limited to FIELD_OFFICER/DONOR/STUDENT, not elevating to ADMIN here unless already admin)
router.patch( "/:id", requireAuth, onlyRoles("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body || {};
    const data = {};
    if (name !== undefined) data.name = name || null;
    if (email !== undefined) data.email = String(email);
    if (password) data.passwordHash = await bcrypt.hash(String(password), 10);
    if (role && ["FIELD_OFFICER","DONOR","STUDENT","ADMIN"].includes(role)) data.role = role;

    const updated = await prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true } });
    return res.json({ user: updated });
  } catch (e) {
    console.error("PATCH /api/users/:id failed:", e);
    if (e.code === "P2025") return res.status(404).json({ error: "User not found" });
    if (String(e.message || "").includes("Unique constraint")) return res.status(409).json({ error: "Email already in use" });
    return res.status(500).json({ error: e?.message || "Failed to update user" });
  }
});

export default router;
