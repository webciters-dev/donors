// server/src/routes/profile.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { buildSnapshot } from "../lib/fx.js";
import { requireAuth, onlyRoles } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = express.Router();

/**
 * Helper: load the currently-authenticated student's record (by user.studentId)
 */
async function getAuthedStudent(req) {
  const user = req.user; // set by auth middleware
  if (!user || !user.studentId) {
    return null;
  }
  const student = await prisma.student.findUnique({
    where: { id: user.studentId },
  });
  return student;
}

/**
 * GET /api/profile
 * Returns { student, application } for the authed student.
 * `application` is the most recent one by submittedAt (or null if none).
 */
router.get("/", requireAuth, onlyRoles("STUDENT"), async (req, res) => {
  try {
    const student = await getAuthedStudent(req);
    if (!student) {
      return res.status(404).json({ error: "Student not found for this account." });
    }

    const application = await prisma.application.findFirst({
      where: { studentId: student.id },
      orderBy: { submittedAt: "desc" },
    });

    res.json({ student, application });
  } catch (err) {
    console.error("GET /api/profile failed:", err);
    res.status(500).json({ error: "Failed to load profile." });
  }
});

/**
 * PUT /api/profile
 * Updates the student's profile fields.
 * Body can include any of:
 *  name, email, gender, university, field, program, gpa, gradYear, city, province,
 *  cnic, dateOfBirth, guardianName, guardianCnic, phone, address
 */
router.put("/", requireAuth, onlyRoles("STUDENT"), async (req, res) => {
  try {
    const student = await getAuthedStudent(req);
    if (!student) {
      return res.status(404).json({ error: "Student not found for this account." });
    }

    // Accept only known editable fields
    const {
      name,
      email,
      gender,
      university,
      field,
      program,
      gpa,
      gradYear,
      city,
      province,
      cnic,
      dateOfBirth, // ISO string
      guardianName,
      guardianCnic,
      phone,
      address,
      // new current education fields
      currentInstitution,
      currentCity,
      currentCompletionYear,
    } = req.body || {};

    // Minimal validation: require current education fields present (non-empty/current year number)
    if (
      (currentInstitution !== undefined && currentInstitution !== null && String(currentInstitution).trim() === "") ||
      (currentCity !== undefined && currentCity !== null && String(currentCity).trim() === "") ||
      (currentCompletionYear !== undefined && currentCompletionYear !== null && Number.isNaN(Number(currentCompletionYear)))
    ) {
      return res.status(400).json({ error: "Current institution, city, and completion year are required" });
    }

    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        ...(name != null ? { name } : {}),
        ...(email != null ? { email } : {}),
        ...(gender != null ? { gender } : {}),
        ...(university != null ? { university } : {}),
        ...(field != null ? { field } : {}),
        ...(program != null ? { program } : {}),
        ...(gpa != null ? { gpa: Number(gpa) } : {}),
        ...(gradYear != null ? { gradYear: Number(gradYear) } : {}),
        ...(city != null ? { city } : {}),
        ...(province != null ? { province } : {}),
        ...(cnic != null ? { cnic } : {}),
        ...(dateOfBirth != null
          ? { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }
          : {}),
        ...(guardianName != null ? { guardianName } : {}),
        ...(guardianCnic != null ? { guardianCnic } : {}),
        ...(phone != null ? { phone } : {}),
        ...(address != null ? { address } : {}),
        ...(currentInstitution != null ? { currentInstitution } : {}),
        ...(currentCity != null ? { currentCity } : {}),
        ...(currentCompletionYear != null
          ? { currentCompletionYear: currentCompletionYear ? Number(currentCompletionYear) : null }
          : {}),
      },
    });

    res.json({ ok: true, student: updated });
  } catch (err) {
    console.error("PUT /api/profile failed:", err);
    res.status(500).json({ error: "Failed to update profile." });
  }
});

/**
 * POST /api/profile/application
 * Creates or updates (upsert) the student's latest application.
 * Body:
 *  - term (string)
 *  - currency: "USD" | "PKR"
 *  - needUSD? (Int)  // if currency = USD
 *  - needPKR? (Int)  // if currency = PKR
 *  - tuitionFee?, hostelFee?, otherExpenses?, familyIncome?, familyContribution?, purpose?
 * Notes:
 *  - status is set/kept as PENDING unless already APPROVED/REJECTED/PROCESSING.
 */
router.post(
  "/application",
  requireAuth,
  onlyRoles("STUDENT"),
  async (req, res) => {
    try {
      const student = await getAuthedStudent(req);
      if (!student) {
        return res.status(404).json({ error: "Student not found for this account." });
      }

      const {
        term,
        currency, // "USD" | "PKR"
        needUSD,
        needPKR,
        tuitionFee,
        hostelFee,
        otherExpenses,
        familyIncome,
        familyContribution,
        purpose,
      } = req.body || {};

      if (!term || !currency || !["USD", "PKR"].includes(currency)) {
        return res
          .status(400)
          .json({ error: "term and currency (USD|PKR) are required." });
      }

      // Build the fields to set based on currency
      const needFields =
        currency === "PKR"
          ? {
              currency: "PKR",
              needPKR: needPKR != null ? Number(needPKR) : null,
              needUSD: null,
            }
          : {
              currency: "USD",
              needUSD: needUSD != null ? Number(needUSD) : null,
              needPKR: null,
            };

      const financials = {
        tuitionFee: tuitionFee != null ? Number(tuitionFee) : null,
        hostelFee: hostelFee != null ? Number(hostelFee) : null,
        otherExpenses: otherExpenses != null ? Number(otherExpenses) : null,
        familyIncome: familyIncome != null ? Number(familyIncome) : null,
        familyContribution:
          familyContribution != null ? Number(familyContribution) : null,
        purpose: purpose ?? null,
      };

      // Find the most recent application (PENDING|PROCESSING we allow edit; APPROVED/REJECTED -> new app)
      const latest = await prisma.application.findFirst({
        where: { studentId: student.id },
        orderBy: { submittedAt: "desc" },
      });

      let app;
      if (
        latest &&
        (latest.status === "PENDING" || latest.status === "PROCESSING")
      ) {
        const snap = await buildSnapshot(
          (needFields.currency === "PKR" ? needFields.needPKR : needFields.needUSD),
          needFields.currency || (needFields.needPKR != null ? "PKR" : "USD")
        );
        app = await prisma.application.update({
          where: { id: latest.id },
          data: {
            term,
            ...needFields,
            ...financials,
            notes: latest.notes ?? null,
            ...snap,
          },
        });
      } else {
        const snap = await buildSnapshot(
          (needFields.currency === "PKR" ? needFields.needPKR : needFields.needUSD),
          needFields.currency || (needFields.needPKR != null ? "PKR" : "USD")
        );
        app = await prisma.application.create({
          data: {
            studentId: student.id,
            term,
            status: "PENDING",
            ...needFields,
            ...financials,
            ...snap,
          },
        });
      }

      res.json({ ok: true, application: app });
    } catch (err) {
      console.error("POST /api/profile/application failed:", err);
      res.status(500).json({ error: "Failed to save application." });
    }
  }
);

export default router;
