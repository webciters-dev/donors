// server/src/routes/students.js
import express from "express";
import prisma from "../prismaClient.js";
import { requireAuth, onlyRoles } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { studentProfileAcademicSchema } from "../validation/studentProfileAcademic.schema.js";

const router = express.Router();

/**
 * GET /api/students/approved
 * - Students who have at least one APPROVED application
 * - For each student, return the most recent APPROVED application (submittedAt desc)
 * - Compute remainingNeed = app.needUSD - sum(all sponsorships.amount for that student)
 * - Shape fields for marketplace cards (needUsd/needUSD, isApproved, sponsored, etc.)
 */
router.get("/approved", async (_req, res) => {
  try {
    const students = await prisma.student.findMany({
      where: {
        applications: {
          some: { status: "APPROVED" },
        },
      },
      include: {
        applications: {
          where: { status: "APPROVED" },
          orderBy: { submittedAt: "desc" },
          take: 1,
          select: {
            id: true,
            term: true,
            needUSD: true,
            needPKR: true,
            currency: true,
            status: true,
            submittedAt: true,
          },
        },
        sponsorships: {
          select: { amount: true }, // amounts assumed USD
        },
      },
    });

    const shaped = students.map((s) => {
      const app = s.applications[0] || null;
      // Sum all sponsorships for this student (USD)
      const totalSponsored = s.sponsorships.reduce(
        (sum, sp) => sum + Number(sp.amount || 0),
        0
      );

      // For marketplace, we stick with USD remaining need (no FX in this endpoint).
      const baseNeedUSD = Number(app?.needUSD || 0);
      const remainingNeed = Math.max(0, baseNeedUSD - totalSponsored);

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        university: s.university,
        program: s.program,
        gender: s.gender,
        city: s.city,
        province: s.province,
        gpa: s.gpa,
        gradYear: s.gradYear,

        // application snapshot for card
        application: app
          ? {
              id: app.id,
              term: app.term,
              needUSD: app.needUSD ?? 0,
              needPKR: app.needPKR ?? null,
              currency: app.currency ?? "USD",
              status: app.status,
              submittedAt: app.submittedAt,
            }
          : null,

        // computed fields used by Marketplace UI
        isApproved: true,
        totalSponsored,
        remainingNeed,
        needUsd: remainingNeed,
        needUSD: remainingNeed,
        sponsored: remainingNeed <= 0 || Boolean(s?.sponsored),
      };
    });

    res.json({ students: shaped });
  } catch (e) {
    console.error("GET /students/approved error:", e);
    res.status(500).json({ error: "Failed to load approved students" });
  }
});

/**
 * GET /api/students/me
 * Returns the currently logged-in student's profile (based on token).
 * Roles: STUDENT
 */
router.get("/me", requireAuth, onlyRoles("STUDENT"), async (req, res) => {
  try {
    // Support either req.user.studentId (if your JWT carries that) or fallback to req.user.id
    const studentId = req.user?.studentId ?? req.user?.id;
    if (!studentId) {
      return res
        .status(404)
        .json({ error: "No student attached to this account" });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json({ student });
  } catch (err) {
    console.error("GET /students/me error:", err);
    res.status(500).json({ error: "Failed to load student" });
  }
});

/**
 * PUT /api/students/me
 * Update the current student's profile (validated by Zod).
 * Roles: STUDENT
 */
router.put(
  "/me",
  requireAuth,
  onlyRoles("STUDENT"),
  validate(studentProfileAcademicSchema),
  async (req, res) => {
    try {
      const studentId = req.user?.studentId ?? req.user?.id;
      if (!studentId) {
        return res
          .status(404)
          .json({ error: "No student attached to this account" });
      }

      const {
        cnic,
        dateOfBirth, // optional ISO date string
        guardianName,
        guardianCnic,
        phone,
        address,
        university,
        program,
        gpa, // already coerced to number by validator
        gradYear, // already coerced to number by validator
        city,
        province,
        currentInstitution,
        currentCity,
        currentCompletionYear,
      } = req.body;

      // Ensure the student exists before update
      const existing = await prisma.student.findUnique({
        where: { id: studentId },
      });
      if (!existing) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Minimal validation (when provided): require non-empty strings and numeric year
      if (
        (currentInstitution !== undefined && String(currentInstitution).trim() === "") ||
        (currentCity !== undefined && String(currentCity).trim() === "") ||
        (currentCompletionYear !== undefined && (currentCompletionYear === null || Number.isNaN(Number(currentCompletionYear))))
      ) {
        return res.status(400).json({ error: "Current institution, city and completion year are required" });
      }

      const updated = await prisma.student.update({
        where: { id: studentId },
        data: {
          ...(cnic !== undefined ? { cnic } : {}),
          ...(dateOfBirth
            ? { dateOfBirth: new Date(dateOfBirth) }
            : { dateOfBirth: null }), // if empty/undefined, store null
          ...(guardianName !== undefined ? { guardianName } : {}),
          ...(guardianCnic !== undefined ? { guardianCnic } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(university !== undefined ? { university } : {}),
          ...(program !== undefined ? { program } : {}),
          ...(gpa !== undefined ? { gpa } : {}),
          ...(gradYear !== undefined ? { gradYear } : {}),
          ...(city !== undefined ? { city } : {}),
          ...(province !== undefined ? { province } : {}),
          ...(currentInstitution !== undefined ? { currentInstitution } : {}),
          ...(currentCity !== undefined ? { currentCity } : {}),
          ...(currentCompletionYear !== undefined
            ? { currentCompletionYear: currentCompletionYear ? Number(currentCompletionYear) : null }
            : {}),
        },
      });

      return res.json({ ok: true, student: updated });
    } catch (err) {
      console.error("PUT /students/me error:", err);
      return res.status(500).json({ error: "Failed to update student" });
    }
  }
);

/**
 * PATCH /api/students/:id
 * - STUDENT can update only their own record
 * - ADMIN can update any student
 */
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user?.role;
    const myStudentId = req.user?.studentId ?? req.user?.id;

    if (role !== "ADMIN" && myStudentId !== id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const {
      name,
      gender,
      dateOfBirth, // ISO string
      cnic,
      guardianName,
      guardianCnic,
      phone,
      address,
      university,
      program,
      gpa,
      gradYear,
      city,
      province,
      field,
    } = req.body;

    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
        ...(cnic !== undefined ? { cnic } : {}),
        ...(guardianName !== undefined ? { guardianName } : {}),
        ...(guardianCnic !== undefined ? { guardianCnic } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(university !== undefined ? { university } : {}),
        ...(program !== undefined ? { program } : {}),
        ...(gpa !== undefined
          ? { gpa: gpa === null || gpa === "" ? null : Number(gpa) }
          : {}),
        ...(gradYear !== undefined
          ? {
              gradYear:
                gradYear === null || gradYear === "" ? null : Number(gradYear),
            }
          : {}),
        ...(city !== undefined ? { city } : {}),
        ...(province !== undefined ? { province } : {}),
        ...(field !== undefined ? { field } : {}),
      },
    });

    res.json({ student: updated });
  } catch (err) {
    console.error("PATCH /students/:id error:", err);
    res.status(500).json({ error: "Failed to update student" });
  }
});

export default router;
