// server/src/routes/auth.js (ESM)
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../prismaClient.js";
import { sendStudentWelcomeEmail, sendDonorWelcomeEmail, sendPasswordResetEmail } from "../lib/emailService.js";
import { requireStrictRecaptcha, requireMediumRecaptcha } from "../middleware/recaptcha.js";
import { authRateLimiter, passwordResetRateLimiter } from "../middleware/rateLimiter.js";
import { 
  validateRegistration, 
  validateLogin, 
  validatePasswordReset, 
  validatePasswordResetConfirm,
  handleValidationErrors 
} from "../middleware/validators.js";
import { ErrorCodes } from "../lib/errorCodes.js";
import { logError } from "../lib/errorLogger.js";
import { createValidationError, createConflictError, handlePrismaError, createInternalError, createAuthError } from "../lib/enhancedError.js";

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
router.post("/register", authRateLimiter, validateRegistration, handleValidationErrors, async (req, res) => {
  try {
    const { email, password, role = "STUDENT" } = req.body;
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!email || !password) {
      const error = createValidationError("Email and password are required", { fields: ["email", "password"] }, requestId);
      logError(new Error("Missing email or password"), { route: "/register", action: "register_validation" });
      return res.status(error.statusCode).json(error);
    }
    if (!["ADMIN", "DONOR", "STUDENT"].includes(role)) {
      const error = createValidationError("Invalid role provided", { field: "role", value: role }, requestId);
      logError(new Error("Invalid role"), { route: "/register", action: "register_role_validation" });
      return res.status(error.statusCode).json(error);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const error = createConflictError("Email already registered", { field: "email", existingEmail: email }, requestId);
      logError(new Error("Duplicate email registration"), { route: "/register", action: "register_duplicate", body: { email } });
      return res.status(error.statusCode).json(error);
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await prisma.user.create({
      data: { email, passwordHash, role },
      select: { id: true, email: true, role: true },
    });

    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    res.json({ success: true, token, user });
  } catch (err) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logError(err, { route: "/register", action: "register_exception", method: "POST" });
    const error = handlePrismaError(err, requestId) || createInternalError("Failed to register", { error: err.message }, requestId);
    res.status(error.statusCode).json(error);
  }
});

/* =========================
   LOGIN
   body: { email, password }
========================= */
router.post("/login", authRateLimiter, validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!email || !password) {
      const error = createValidationError("Email and password are required", { fields: ["email", "password"] }, requestId);
      logError(new Error("Missing login credentials"), { route: "/login", action: "login_validation" });
      return res.status(error.statusCode).json(error);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const error = createAuthError("Invalid email or password", ErrorCodes.AUTH_INVALID_CREDENTIALS, requestId);
      logError(new Error("User not found during login: " + email), { route: "/login", action: "login_not_found", body: { email } });
      return res.status(error.statusCode).json(error);
    }

    const ok = await bcrypt.compare(String(password), String(user.passwordHash || ""));
    if (!ok) {
      const error = createAuthError("Invalid email or password", ErrorCodes.AUTH_INVALID_CREDENTIALS, requestId);
      logError(new Error("Password mismatch during login: " + email), { route: "/login", action: "login_invalid_password", body: { email } });
      return res.status(error.statusCode).json(error);
    }

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
      success: true,
      token,
      user: userData,
    });
  } catch (err) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logError(err, { route: "/login", action: "login_exception", method: "POST" });
    const error = handlePrismaError(err, requestId) || createInternalError("Login failed", { error: err.message }, requestId);
    res.status(error.statusCode).json(error);
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
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!name || !email || !password) {
      const error = createValidationError("Name, email, and password are required", { fields: ["name", "email", "password"] }, requestId);
      logError(new Error("Missing required student registration fields"), { route: "/register-student", action: "register_student_validation" });
      return res.status(error.statusCode).json(error);
    }

    // 1) Check if email is already registered (prevent duplicates)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const error = createConflictError("Email address is already registered", { field: "email", reason: "existing_user" }, requestId);
      logError(new Error("Duplicate user email in student registration"), { route: "/register-student", action: "register_student_duplicate_user", body: { email } });
      return res.status(error.statusCode).json(error);
    }

    const existingStudent = await prisma.student.findUnique({ where: { email } });
    if (existingStudent) {
      const error = createConflictError("A student account with this email already exists", { field: "email", reason: "existing_student" }, requestId);
      logError(new Error("Duplicate student email in registration"), { route: "/register-student", action: "register_student_duplicate_student", body: { email } });
      return res.status(error.statusCode).json(error);
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
      logError(emailError, { route: "/register-student", action: "student_welcome_email_failed" });
    });

    return res.status(201).json({
      success: true,
      ok: true,
      studentId: student.id,
      message: "Student account created successfully",
    });
  } catch (err) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logError(err, { route: "/register-student", action: "register_student_exception", method: "POST" });
    const error = handlePrismaError(err, requestId) || createInternalError("Failed to register student", { error: err.message }, requestId);
    return res.status(error.statusCode).json(error);
  }
});

/* =========================
   DONOR REGISTER
   body: { name, email, password, organization? }
========================= */
router.post("/register-donor", requireStrictRecaptcha, async (req, res) => {
  try {
    const { name, email, password, organization, country, phone } = req.body || {};
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!name || !email || !password) {
      const error = createValidationError("Name, email, and password are required", { fields: ["name", "email", "password"] }, requestId);
      logError(new Error("Missing required donor registration fields"), { route: "/register-donor", action: "register_donor_validation" });
      return res.status(error.statusCode).json(error);
    }

    // Create Donor (or ensure none exists with same email via user table)
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const error = createConflictError("Email already registered", { field: "email", existingEmail: email }, requestId);
      logError(new Error("Duplicate donor email registration"), { route: "/register-donor", action: "register_donor_duplicate", body: { email } });
      return res.status(error.statusCode).json(error);
    }

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
      logError(emailError, { route: "/register-donor", action: "donor_welcome_email_failed" });
    });

    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    return res.status(201).json({
      success: true,
      token,
      user,
      donor: { id: donor.id, name: donor.name, email: donor.email, organization: donor.organization },
    });
  } catch (err) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logError(err, { route: "/register-donor", action: "register_donor_exception", method: "POST" });
    const error = handlePrismaError(err, requestId) || createInternalError("Failed to register donor", { error: err.message }, requestId);
    return res.status(error.statusCode).json(error);
  }
});

/* =========================
   PASSWORD RESET — request
   body: { email }
   (In production you'd email the token. Here we return it for testing.)
========================= */
router.post("/request-password-reset", passwordResetRateLimiter, requireMediumRecaptcha, validatePasswordReset, handleValidationErrors, async (req, res) => {
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
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logError(err, { route: "/request-password-reset", action: "password_reset_request_exception", method: "POST" });
    const error = handlePrismaError(err, requestId) || createInternalError("Failed to process password reset request", { error: err.message }, requestId);
    return res.status(error.statusCode).json(error);
  }
});

/* =========================
   PASSWORD RESET — confirm
   body: { token, password }
========================= */
router.post("/reset-password", passwordResetRateLimiter, validatePasswordResetConfirm, handleValidationErrors, async (req, res) => {
  try {
    const { token, password } = req.body || {};
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!token || !password) {
      const error = createValidationError("Token and password are required", { fields: ["token", "password"] }, requestId);
      logError(new Error("Missing token or password in password reset"), { route: "/reset-password", action: "reset_validation" });
      return res.status(error.statusCode).json(error);
    }

    const pr = await prisma.passwordReset.findUnique({ where: { token } });
    
    if (!pr) {
      const error = createAuthError("Invalid or expired token", ErrorCodes.AUTH.TOKEN_INVALID, requestId);
      logError(new Error("Password reset token not found"), { route: "/reset-password", action: "reset_token_not_found" });
      return res.status(error.statusCode).json(error);
    }
    
    if (pr.used) {
      const error = createAuthError("Invalid or expired token (already used)", ErrorCodes.AUTH.TOKEN_INVALID, requestId);
      logError(new Error("Password reset token already used"), { route: "/reset-password", action: "reset_token_already_used" });
      return res.status(error.statusCode).json(error);
    }
    
    if (pr.expiresAt < new Date()) {
      const error = createAuthError("Invalid or expired token (expired)", ErrorCodes.AUTH.TOKEN_EXPIRED, requestId);
      logError(new Error("Password reset token expired"), { route: "/reset-password", action: "reset_token_expired" });
      return res.status(error.statusCode).json(error);
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

    return res.json({ success: true, ok: true, message: "Password updated" });
  } catch (err) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    logError(err, { route: "/reset-password", action: "reset_password_exception", method: "POST" });
    const error = handlePrismaError(err, requestId) || createInternalError("Failed to reset password", { error: err.message }, requestId);
    return res.status(error.statusCode).json(error);
  }
});

export default router;
