// server/src/routes/students.js
import express from "express";
import prisma from "../prismaClient.js";
import { requireAuth, onlyRoles } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { studentProfileAcademicSchema } from "../validation/studentProfileAcademic.schema.js";

const router = express.Router();

/**
 * GET /api/students/approved/:id
 * - Get specific approved student details (donor-safe information)
 * - Only shows information relevant for sponsorship decisions
 * - Does not expose sensitive personal information
 */
router.get("/approved/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await prisma.student.findFirst({
      where: {
        id,
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
            amount: true,
            currency: true,
            status: true,
            submittedAt: true,
            notes: true,
          },
        },
        sponsorships: {
          select: { 
            amount: true,
            date: true,
            donor: {
              select: { name: true, organization: true }
            }
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found or not approved" });
    }

    const app = student.applications[0] || null;

    // Return donor-safe information only
    const donorSafeData = {
      id: student.id,
      name: student.name,
      university: student.university,
      program: student.program,
      gpa: student.gpa,
      gradYear: student.gradYear,
      city: student.city,
      province: student.province,
      gender: student.gender,
      personalIntroduction: student.personalIntroduction,
      // Enhanced details for donors
      familySize: student.familySize,
      parentsOccupation: student.parentsOccupation,
      monthlyFamilyIncome: student.monthlyFamilyIncome,
      careerGoals: student.careerGoals,
      academicAchievements: student.academicAchievements,
      communityInvolvement: student.communityInvolvement,
      currentAcademicYear: student.currentAcademicYear,
      specificField: student.specificField,
      // Financial information
      amount: app?.amount || 0,
      currency: app?.currency || "USD",
      // Application info
      application: app ? {
        id: app.id,
        term: app.term,
        status: app.status,
        submittedAt: app.submittedAt,
        amount: app.amount,
        currency: app.currency,
      } : null,
      // Sponsorship summary (no donor details for privacy)
      sponsorshipCount: student.sponsorships.length,
      isApproved: true,
      sponsored: student.sponsored || student.sponsorships.length > 0,
    };

    res.json({ student: donorSafeData });
  } catch (error) {
    console.error("GET /students/approved/:id error:", error);
    res.status(500).json({ error: "Failed to fetch student details" });
  }
});

/**
 * GET /api/students/approved
 * - Students who are in ACTIVE phase (approved and ready for sponsorship)
 * - Returns students available for sponsorship matching
 * - Simple sponsored status: either student.sponsored=true OR sponsorships exist
 */
router.get("/approved", async (_req, res) => {
  try {
    const students = await prisma.student.findMany({
      where: {
        studentPhase: "ACTIVE", // Only students who completed approval process
      },
      include: {
        applications: {
          where: { status: "APPROVED" },
          orderBy: { submittedAt: "desc" },
          take: 1,
          select: {
            id: true,
            term: true,
            amount: true,
            currency: true,
            status: true,
            submittedAt: true,
          },
        },
        sponsorships: {
          select: { id: true }, // Only need to check if sponsorships exist
        },
      },
    });

    const shaped = students.map((s) => {
      const app = s.applications[0] || null;

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
              amount: app.amount,
              currency: app.currency,
              status: app.status,
              submittedAt: app.submittedAt,
            }
          : null,

        // computed fields used by UI
        isApproved: true,
        sponsored: s.sponsored || s.sponsorships.length > 0,
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
 * GET /api/students/:id/sponsorship-status
 * Check if a student is sponsored and return sponsorship details
 * Roles: STUDENT (own data), DONOR (sponsored students), ADMIN
 */
router.get("/:id/sponsorship-status", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Verify access permissions
    let hasAccess = false;
    
    if (userRole === 'ADMIN') {
      hasAccess = true;
    } else if (userRole === 'STUDENT') {
      // Students can only check their own sponsorship status
      const student = await prisma.student.findUnique({
        where: { id },
        include: { User: true }
      });
      hasAccess = student?.User?.id === userId;
    } else if (userRole === 'DONOR') {
      // Donors can check status of students they sponsor
      const sponsorship = await prisma.sponsorship.findFirst({
        where: {
          studentId: id,
          donor: {
            User: { id: userId }
          }
        }
      });
      hasAccess = !!sponsorship;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized to view this student\'s sponsorship status' });
    }
    
    // Get sponsorship information
    const sponsorship = await prisma.sponsorship.findFirst({
      where: { studentId: id },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            organization: true,
            email: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    
    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        sponsored: true
      }
    });
    
    res.json({
      student,
      sponsored: !!sponsorship,
      sponsorship
    });
    
  } catch (error) {
    console.error('Error checking sponsorship status:', error);
    res.status(500).json({ error: 'Failed to check sponsorship status' });
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
        guardian2Name,
        guardian2Cnic,
        phone,
        guardianPhone1,
        guardianPhone2,
        address,
        country,
        university,
        program,
        gpa, // already coerced to number by validator
        gradYear, // already coerced to number by validator
        city,
        province,
        currentInstitution,
        currentCity,
        currentCompletionYear,
        personalIntroduction,
        // Enhanced details for donors
        familySize,
        parentsOccupation,
        monthlyFamilyIncome,
        careerGoals,
        academicAchievements,
        communityInvolvement,
        currentAcademicYear,
        specificField,
        // Photo fields
        photoUrl,
        photoThumbnailUrl,
        photoUploadedAt,
        photoOriginalName,
        // Education fields
        degreeLevel,
        field,
        // Note: programStartDate and programEndDate removed - not in database schema yet
        // Social media fields
        facebookUrl,
        instagramHandle,
        whatsappNumber,
        linkedinUrl,
        twitterHandle,
        tiktokHandle,
        // Video fields
        introVideoUrl,
        introVideoThumbnailUrl,
        introVideoUploadedAt,
        introVideoDuration,
        introVideoOriginalName,
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
          ...(guardian2Name !== undefined ? { guardian2Name } : {}),
          ...(guardian2Cnic !== undefined ? { guardian2Cnic } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(guardianPhone1 !== undefined ? { guardianPhone1 } : {}),
          ...(guardianPhone2 !== undefined ? { guardianPhone2 } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(country !== undefined ? { country } : {}),
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
          ...(personalIntroduction !== undefined ? { personalIntroduction } : {}),
          // Enhanced details for donors
          ...(familySize !== undefined ? { familySize: familySize ? Number(familySize) : null } : {}),
          ...(parentsOccupation !== undefined ? { parentsOccupation } : {}),
          ...(monthlyFamilyIncome !== undefined ? { monthlyFamilyIncome } : {}),
          ...(careerGoals !== undefined ? { careerGoals } : {}),
          ...(academicAchievements !== undefined ? { academicAchievements } : {}),
          ...(communityInvolvement !== undefined ? { communityInvolvement } : {}),
          ...(currentAcademicYear !== undefined ? { currentAcademicYear } : {}),
          ...(specificField !== undefined ? { specificField } : {}),
          // Photo fields
          ...(photoUrl !== undefined ? { photoUrl } : {}),
          ...(photoThumbnailUrl !== undefined ? { photoThumbnailUrl } : {}),
          ...(photoUploadedAt !== undefined
            ? { photoUploadedAt: photoUploadedAt ? new Date(photoUploadedAt) : null }
            : {}),
          ...(photoOriginalName !== undefined ? { photoOriginalName } : {}),
          // Education fields
          ...(degreeLevel !== undefined ? { degreeLevel } : {}),
          ...(field !== undefined ? { field } : {}),
          // Note: programStartDate and programEndDate removed - not in database schema yet
          // Social media fields
          ...(facebookUrl !== undefined ? { facebookUrl } : {}),
          ...(instagramHandle !== undefined ? { instagramHandle } : {}),
          ...(whatsappNumber !== undefined ? { whatsappNumber } : {}),
          ...(linkedinUrl !== undefined ? { linkedinUrl } : {}),
          ...(twitterHandle !== undefined ? { twitterHandle } : {}),
          ...(tiktokHandle !== undefined ? { tiktokHandle } : {}),
          // Video fields
          ...(introVideoUrl !== undefined ? { introVideoUrl } : {}),
          ...(introVideoThumbnailUrl !== undefined ? { introVideoThumbnailUrl } : {}),
          ...(introVideoUploadedAt !== undefined
            ? { introVideoUploadedAt: introVideoUploadedAt ? new Date(introVideoUploadedAt) : null }
            : {}),
          ...(introVideoDuration !== undefined ? { introVideoDuration: introVideoDuration ? Number(introVideoDuration) : null } : {}),
          ...(introVideoOriginalName !== undefined ? { introVideoOriginalName } : {}),
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
      guardian2Name,
      guardian2Cnic,
      phone,
      guardianPhone1,
      guardianPhone2,
      address,
      university,
      program,
      gpa,
      gradYear,
      city,
      province,
      field,
      country,
      degreeLevel,
      // Note: programStartDate and programEndDate removed - not in database schema yet
    } = req.body;

    console.log(' PATCH /students/:id - Debug request data:', {
      id,
      degreeLevel,
      degreeLevelType: typeof degreeLevel,
      field,
      program,
      university,
      receivedBody: req.body
    });

    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
        ...(cnic !== undefined ? { cnic } : {}),
        ...(guardianName !== undefined ? { guardianName } : {}),
        ...(guardianCnic !== undefined ? { guardianCnic } : {}),
        ...(guardian2Name !== undefined ? { guardian2Name } : {}),
        ...(guardian2Cnic !== undefined ? { guardian2Cnic } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(guardianPhone1 !== undefined ? { guardianPhone1 } : {}),
        ...(guardianPhone2 !== undefined ? { guardianPhone2 } : {}),
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
        ...(country !== undefined ? { country } : {}),
        ...(degreeLevel !== undefined ? { degreeLevel } : {}),
        // Note: programStartDate and programEndDate removed - not in database schema yet
      },
    });

    console.log(' PATCH result - Updated student:', {
      id: updated.id,
      degreeLevel: updated.degreeLevel,
      field: updated.field,
      program: updated.program,
      university: updated.university
    });

    res.json({ student: updated });
  } catch (err) {
    console.error("PATCH /students/:id error:", err);
    res.status(500).json({ error: "Failed to update student" });
  }
});

export default router;
