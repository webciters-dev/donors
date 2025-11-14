// server/src/routes/auth.js (ESM)
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../prismaClient.js";
import { sendStudentWelcomeEmail, sendDonorWelcomeEmail, sendPasswordResetEmail } from "../lib/emailService.js";
import { requireStrictRecaptcha } from "../middleware/recaptcha.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/* =========================
   GENERIC REGISTER (optional)
   body: { email, password, role: "ADMIN" | "DONOR" | "STUDENT" }
========================= */
router.post("/register", async (req, res) => {
  try {
    const { email, password, role = "STUDENT" } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required." });
    }
    if (!["ADMIN", "DONOR", "STUDENT"].includes(role)) {
      return res.status(400).json({ error: "Invalid role." });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered." });

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await prisma.user.create({
      data: { email, passwordHash, role },
      select: { id: true, email: true, role: true },
    });

    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    res.json({ token, user });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/* =========================
   LOGIN
   body: { email, password }
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials." });

    const ok = await bcrypt.compare(String(password), String(user.passwordHash || ""));
    if (!ok) return res.status(401).json({ error: "Invalid credentials." });

    // Get name and additional profile data from the appropriate profile record
    let userName = user.name; // Default to user.name (for backwards compatibility)
    let studentPhase = null; // Only for students
    
    if (user.role === "STUDENT" && user.studentId) {
      const student = await prisma.student.findUnique({ where: { id: user.studentId } });
      if (student?.name) {
        userName = student.name;
      }
      studentPhase = student?.studentPhase || 'APPLICATION'; // Default to APPLICATION if not set
    } else if (user.role === "DONOR" && user.donorId) {
      const donor = await prisma.donor.findUnique({ where: { id: user.donorId } });
      if (donor?.name) {
        userName = donor.name;
      }
    }

    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    const userData = { 
      id: user.id, 
      name: userName, 
      email: user.email, 
      role: user.role, 
      studentId: user.studentId, 
      donorId: user.donorId 
    };
    
    // Add studentPhase for students only
    if (user.role === "STUDENT") {
      userData.studentPhase = studentPhase;
    }
    
    res.json({
      token,
      user: userData,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/* =========================
   STUDENT SELF-REGISTER (used by ApplicationForm)
   body: { name, email, password, university, program, gender, country, city, province, gpa, gradYear, amount, currency, field }
========================= */
router.post("/register-student", requireStrictRecaptcha, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      university,
      program,
      gender,
      country,
      city,
      province,
      gpa,
      gradYear,
      amount,
      currency,
      field,
      degreeLevel,
      personalIntroduction,
      photoUrl,
      photoThumbnailUrl,
      photoUploadedAt,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }

    // 1) Check if email is already registered (prevent duplicates)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ 
        error: "Email address is already registered. Please use a different email or sign in to your existing account." 
      });
    }

    const existingStudent = await prisma.student.findUnique({ where: { email } });
    if (existingStudent) {
      return res.status(409).json({ 
        error: "A student account with this email already exists. Please use a different email or sign in." 
      });
    }

    // 2) Create new student (no upsert - prevent duplicates)
    const student = await prisma.student.create({
      data: {
        name,
        email,
        university: university ?? "",
        program: program ?? "",
        gender: gender ?? "",
        country: country ?? "Pakistan",
        city: city ?? "",
        province: province ?? "",
        gpa: typeof gpa === "number" ? gpa : 0,
        gradYear: typeof gradYear === "number" ? gradYear : new Date().getFullYear() + 1,
        field: field ?? "",
        degreeLevel: degreeLevel ?? "",
        personalIntroduction: personalIntroduction ?? "",
        photoUrl: photoUrl ?? null,
        photoThumbnailUrl: photoThumbnailUrl ?? null,
        photoUploadedAt: photoUploadedAt ? new Date(photoUploadedAt) : null,
      },
    });

    // 3) Create new user account
    const passwordHash = await bcrypt.hash(String(password), 10);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "STUDENT",
        studentId: student.id,
      },
    });
    
    // Send welcome email to new student (async, don't block response)
    sendStudentWelcomeEmail({
      email: email,
      name: name
    }).catch(emailError => {
      console.error('Failed to send student welcome email:', emailError);
    });

    return res.status(201).json({
      ok: true,
      studentId: student.id,
      message: "Student account created successfully",
    });
  } catch (err) {
    console.error("register-student failed:", err);
    console.error("Full error details:", err.message, err.stack);
    return res.status(500).json({ 
      error: "Failed to register student",
      details: err.message // Add error details for debugging
    });
  }
});

/* =========================
   DONOR REGISTER
   body: { name, email, password, organization? }
========================= */
router.post("/register-donor", async (req, res) => {
  try {
    const { name, email, password, organization, country, phone } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    // Create Donor (or ensure none exists with same email via user table)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(409).json({ error: "Email already registered." });

    const donor = await prisma.donor.create({
      data: {
        name,
        email,
        organization: organization || null,
        country: country || null,
        phone: phone || null,
      },
    });

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "DONOR",
        donorId: donor.id,
      },
      select: { id: true, email: true, role: true },
    });

    // Send welcome email to new donor (async, don't block response)
    sendDonorWelcomeEmail({
      email: email,
      name: name,
      organization: organization
    }).catch(emailError => {
      console.error('Failed to send donor welcome email:', emailError);
    });

    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    return res.status(201).json({
      token,
      user,
      donor: { id: donor.id, name: donor.name, email: donor.email, organization: donor.organization },
    });
  } catch (err) {
    console.error("register-donor failed:", err);
    return res.status(500).json({ error: "Failed to register donor" });
  }
});

/* =========================
   PASSWORD RESET — request
   body: { email }
   (In production you’d email the token. Here we return it for testing.)
========================= */
router.post("/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "email required" });

    const user = await prisma.user.findUnique({ where: { email } });
    // Don’t reveal if user exists (privacy). Return ok either way.
    if (!user) return res.json({ ok: true });

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send password reset email (async, don't block response)
    sendPasswordResetEmail({
      email: email,
      name: user.name || 'User',
      resetToken: token,
      userRole: user.role
    }).catch(emailError => {
      console.error('Failed to send password reset email:', emailError);
    });

    // In dev: return token so you can paste it in the reset form.
    return res.json({ ok: true, token });
  } catch (err) {
    console.error("request-password-reset failed:", err);
    return res.status(500).json({ error: "Failed to start reset" });
  }
});

/* =========================
   PASSWORD RESET — confirm
   body: { token, password }
========================= */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ error: "token and password required" });
    }

    const pr = await prisma.passwordReset.findUnique({ where: { token } });
    if (!pr || pr.used || pr.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: pr.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { token },
        data: { used: true },
      }),
    ]);

    return res.json({ ok: true, message: "Password updated" });
  } catch (err) {
    console.error("reset-password failed:", err);
    return res.status(500).json({ error: "Failed to reset password" });
  }
});

export default router;
