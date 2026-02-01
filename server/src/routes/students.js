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
            approvedAmount: true,
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
      // Previous Academic Records for donor view
      previousAcademicRecords: student.previousAcademicRecords || [],
      currentInstitution: student.currentInstitution,
      currentCity: student.currentCity,
      currentCompletionYear: student.currentCompletionYear,
      // Media for donors - photos and videos
      photoUrl: student.photoUrl,
      introVideoUrl: student.introVideoUrl,
      // Financial information - use approvedAmount if set, otherwise original amount
      amount: app?.approvedAmount ?? app?.amount ?? 0,
      originalAmount: app?.amount ?? 0,
      approvedAmount: app?.approvedAmount ?? null,
      currency: app?.currency || "USD",
      // Application info
      application: app ? {
        id: app.id,
        term: app.term,
        status: app.status,
        submittedAt: app.submittedAt,
        amount: app.approvedAmount ?? app.amount,
        originalAmount: app.amount,
        approvedAmount: app.approvedAmount,
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
            approvedAmount: true,
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
        // Media for donors - photos and videos
        photoUrl: s.photoUrl,
        introVideoUrl: s.introVideoUrl,

        // application snapshot for card - use approvedAmount if set
        application: app
          ? {
              id: app.id,
              term: app.term,
              amount: app.approvedAmount ?? app.amount,
              originalAmount: app.amount,
              approvedAmount: app.approvedAmount,
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
    // Check if user has studentId attached
    const studentId = req.user?.studentId;
    if (!studentId) {
      console.log("GET /students/me: No studentId found in req.user", { 
        userId: req.user?.id, 
        role: req.user?.role,
        hasStudentId: !!req.user?.studentId 
      });
      return res
        .status(404)
        .json({ error: "No student attached to this account. Please contact support or register as a student." });
    }

    console.log("GET /students/me: Fetching student", { studentId });

    // First, try to fetch the student without include to avoid relationship issues
    let student = null;
    let latestApp = null;
    let isProfileLocked = false;

    try {
      // Fetch student first
      student = await prisma.student.findUnique({
        where: { id: studentId }
      });

      if (!student) {
        console.log("GET /students/me: Student not found in database", { studentId });
        return res.status(404).json({ error: "Student record not found. Please contact support." });
      }

      // Then fetch the latest application separately to avoid relationship issues
      try {
        latestApp = await prisma.application.findFirst({
          where: { studentId: studentId },
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true }
        });
        
        isProfileLocked = latestApp && latestApp.status !== 'DRAFT';
      } catch (appError) {
        console.warn("GET /students/me: Could not fetch applications", appError.message);
        // Continue without application info - not critical
        isProfileLocked = false;
      }
    } catch (dbError) {
      console.error("GET /students/me: Database error", dbError);
      throw dbError; // Re-throw to be caught by outer catch
    }
    
    res.json({ 
      student: student,
      isProfileLocked,
      applicationStatus: latestApp?.status || null
    });
  } catch (err) {
    console.error("GET /students/me error:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
      userId: req.user?.id,
      studentId: req.user?.studentId
    });
    res.status(500).json({ 
      error: "Failed to load student",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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
      // Check if user has studentId attached (enriched by auth middleware)
      const studentId = req.user?.studentId;
      if (!studentId) {
        console.log("PUT /students/me: No studentId found in req.user", { 
          userId: req.user?.id, 
          role: req.user?.role,
          hasStudentId: !!req.user?.studentId 
        });
        return res
          .status(404)
          .json({ error: "No student attached to this account. Please contact support." });
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
        gradeType, // CGPA or PERCENTAGE
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
        customDegreeLevel,
        field,
        customFieldOfStudy,
        customProgram,
        programStartDate,
        programEndDate,
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
        // Previous Academic Records
        previousAcademicRecords,
      } = req.body;

      // Ensure the student exists before update
      const existing = await prisma.student.findUnique({
        where: { id: studentId },
      });
      if (!existing) {
        console.log("PUT /students/me: Student not found", { studentId });
        return res.status(404).json({ error: "Student not found" });
      }

      // Check for duplicate CNIC (excluding current student)
      if (cnic !== undefined && cnic && cnic.trim() !== "") {
        const duplicateCnic = await prisma.student.findFirst({
          where: {
            cnic: cnic.trim(),
            id: { not: studentId }
          }
        });
        if (duplicateCnic) {
          return res.status(409).json({
            message: "Validation failed",
            errors: [{
              path: "cnic",
              message: "This CNIC is already registered with another student account"
            }]
          });
        }
      }

      // Check for duplicate Guardian CNIC (excluding current student)
      if (guardianCnic !== undefined && guardianCnic && guardianCnic.trim() !== "") {
        const duplicateGuardianCnic = await prisma.student.findFirst({
          where: {
            OR: [
              { guardianCnic: guardianCnic.trim() },
              { guardian2Cnic: guardianCnic.trim() }
            ],
            id: { not: studentId }
          }
        });
        if (duplicateGuardianCnic) {
          return res.status(409).json({
            message: "Validation failed",
            errors: [{
              path: "guardianCnic",
              message: "This Guardian CNIC is already registered with another student account"
            }]
          });
        }
      }

      // Check for duplicate Guardian 2 CNIC (excluding current student)
      if (guardian2Cnic !== undefined && guardian2Cnic && guardian2Cnic.trim() !== "") {
        const duplicateGuardian2Cnic = await prisma.student.findFirst({
          where: {
            OR: [
              { guardianCnic: guardian2Cnic.trim() },
              { guardian2Cnic: guardian2Cnic.trim() }
            ],
            id: { not: studentId }
          }
        });
        if (duplicateGuardian2Cnic) {
          return res.status(409).json({
            message: "Validation failed",
            errors: [{
              path: "guardian2Cnic",
              message: "This Guardian CNIC is already registered with another student account"
            }]
          });
        }
      }

      // Legacy fields (currentInstitution, currentCity, currentCompletionYear) are optional
      // They are kept for backward compatibility but not required in the new form structure
      // The new form uses previousAcademicRecords array instead

      // After Zod validation, req.body should only contain valid schema fields
      // Log for debugging but don't block - Zod already validated
      const allIncomingFields = Object.keys(req.body);
      console.log("PUT /students/me: Fields received after Zod validation:", allIncomingFields);

      // Build the data object that will be sent to Prisma
      const updateData = {};
      if (cnic !== undefined) updateData.cnic = cnic;
      if (dateOfBirth !== undefined) {
        updateData.dateOfBirth = (dateOfBirth && dateOfBirth.trim) ? new Date(dateOfBirth) : null;
      }
      if (guardianName !== undefined) updateData.guardianName = guardianName;
      if (guardianCnic !== undefined) updateData.guardianCnic = guardianCnic;
      if (guardian2Name !== undefined) updateData.guardian2Name = guardian2Name;
      if (guardian2Cnic !== undefined) updateData.guardian2Cnic = guardian2Cnic;
      if (phone !== undefined) updateData.phone = phone;
      if (guardianPhone1 !== undefined) updateData.guardianPhone1 = guardianPhone1;
      if (guardianPhone2 !== undefined) updateData.guardianPhone2 = guardianPhone2;
      if (address !== undefined) updateData.address = address;
      if (country !== undefined) updateData.country = country;
      if (university !== undefined) updateData.university = university;
      if (program !== undefined) updateData.program = program;
      if (gpa !== undefined) updateData.gpa = gpa;
      // Temporarily skip gradeType to avoid "Unknown argument" error
      // TODO: Re-enable after verifying database column exists and Prisma client is regenerated
      // if (gradeType !== undefined) updateData.gradeType = gradeType;
      if (gradYear !== undefined) updateData.gradYear = gradYear;
      if (city !== undefined) updateData.city = city;
      if (province !== undefined) updateData.province = province;
      if (currentInstitution !== undefined) updateData.currentInstitution = currentInstitution;
      if (currentCity !== undefined) updateData.currentCity = currentCity;
      if (currentCompletionYear !== undefined) {
        updateData.currentCompletionYear = currentCompletionYear ? Number(currentCompletionYear) : null;
      }
      if (personalIntroduction !== undefined) updateData.personalIntroduction = personalIntroduction;
      if (familySize !== undefined) updateData.familySize = familySize ? Number(familySize) : null;
      if (parentsOccupation !== undefined) updateData.parentsOccupation = parentsOccupation;
      if (monthlyFamilyIncome !== undefined) updateData.monthlyFamilyIncome = monthlyFamilyIncome;
      if (careerGoals !== undefined) updateData.careerGoals = careerGoals;
      if (academicAchievements !== undefined) updateData.academicAchievements = academicAchievements;
      if (communityInvolvement !== undefined) updateData.communityInvolvement = communityInvolvement;
      if (currentAcademicYear !== undefined) updateData.currentAcademicYear = currentAcademicYear;
      if (specificField !== undefined) updateData.specificField = specificField;
      if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
      if (photoThumbnailUrl !== undefined) updateData.photoThumbnailUrl = photoThumbnailUrl;
      if (photoUploadedAt !== undefined) {
        updateData.photoUploadedAt = photoUploadedAt ? new Date(photoUploadedAt) : null;
      }
      if (photoOriginalName !== undefined) updateData.photoOriginalName = photoOriginalName;
      if (degreeLevel !== undefined) updateData.degreeLevel = degreeLevel;
      if (customDegreeLevel !== undefined) updateData.customDegreeLevel = customDegreeLevel;
      if (field !== undefined) updateData.field = field;
      if (customFieldOfStudy !== undefined) updateData.customFieldOfStudy = customFieldOfStudy;
      if (customProgram !== undefined) updateData.customProgram = customProgram;
      if (programStartDate !== undefined) updateData.programStartDate = programStartDate;
      if (programEndDate !== undefined) updateData.programEndDate = programEndDate;
      if (facebookUrl !== undefined) updateData.facebookUrl = facebookUrl;
      if (instagramHandle !== undefined) updateData.instagramHandle = instagramHandle;
      if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
      if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
      if (twitterHandle !== undefined) updateData.twitterHandle = twitterHandle;
      if (tiktokHandle !== undefined) updateData.tiktokHandle = tiktokHandle;
      if (introVideoUrl !== undefined) updateData.introVideoUrl = introVideoUrl;
      if (introVideoThumbnailUrl !== undefined) updateData.introVideoThumbnailUrl = introVideoThumbnailUrl;
      if (introVideoUploadedAt !== undefined) {
        updateData.introVideoUploadedAt = introVideoUploadedAt ? new Date(introVideoUploadedAt) : null;
      }
      if (introVideoDuration !== undefined) {
        updateData.introVideoDuration = introVideoDuration ? Number(introVideoDuration) : null;
      }
      if (introVideoOriginalName !== undefined) updateData.introVideoOriginalName = introVideoOriginalName;
      // Handle previousAcademicRecords - stored as JSON array in database
      if (previousAcademicRecords !== undefined && Array.isArray(previousAcademicRecords)) {
        updateData.previousAcademicRecords = previousAcademicRecords;
        console.log("PUT /students/me: previousAcademicRecords saved:", previousAcademicRecords.length, "records");
      }

      console.log("PUT /students/me: Updating student", { 
        studentId, 
        hasGpa: gpa !== undefined, 
        gpa, 
        gradeType,
        hasCurrentInstitution: currentInstitution !== undefined,
        updateDataKeys: Object.keys(updateData)
      });

      const updated = await prisma.student.update({
        where: { id: studentId },
        data: updateData,
      });

      console.log("PUT /students/me: Update successful");
      return res.json({ ok: true, student: updated });
    } catch (err) {
      console.error("PUT /students/me error:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        code: err.code,
        meta: err.meta,
        cause: err.cause
      });
      
      // Handle validation errors that might slip through
      if (err.name === 'ZodError' || err.issues) {
        const errors = (err.issues || []).map(i => ({
          path: i.path?.join('.'),
          message: i.message
        }));
        return res.status(422).json({
          message: "Validation failed",
          errors
        });
      }
      
      // Handle Prisma-specific errors
      if (err.code === 'P2002') {
        return res.status(409).json({ 
          error: "A record with this information already exists",
          details: err.meta?.target 
        });
      }
      
      if (err.code === 'P2025') {
        return res.status(404).json({ 
          error: "Student record not found" 
        });
      }
      
      // Check for common Prisma validation errors
      if (err.message && (err.message.includes('Unknown argument') || err.message.includes('Unknown arg'))) {
        // Try multiple patterns to extract field name from Prisma error
        const fieldMatch = err.message.match(/Unknown arg `?(\w+)`?/i) || 
                          err.message.match(/Unknown argument `?(\w+)`?/i) ||
                          err.message.match(/`(\w+)`.*unknown/i);
        const fieldName = fieldMatch ? fieldMatch[1] : 'unknown';
        
        console.error("PUT /students/me: Prisma unknown field error", {
          field: fieldName,
          fullMessage: err.message,
          errorCode: err.code,
          allFieldsInRequest: Object.keys(req.body),
          dataObjectKeys: Object.keys(req.body || {})
        });
        
        // Also log what we're trying to update
        console.error("PUT /students/me: Update data being sent to Prisma includes these keys from req.body destructuring");
        
        return res.status(400).json({ 
          error: `Invalid field in update request: ${fieldName || 'unknown field'}`,
          details: process.env.NODE_ENV === 'development' ? {
            message: err.message,
            code: err.code,
            allRequestFields: Object.keys(req.body)
          } : undefined
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to update student",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        code: err.code || 'UNKNOWN_ERROR'
      });
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
      gradeType, // CGPA or PERCENTAGE
      gradYear,
      city,
      province,
      field,
      country,
      degreeLevel,
      customDegreeLevel,
      customFieldOfStudy,
      customProgram,
      programStartDate,
      programEndDate,
    } = req.body;

    console.log(' PATCH /students/:id - Debug request data:', {
      id,
      degreeLevel,
      customDegreeLevel,
      field,
      customFieldOfStudy,
      program,
      customProgram,
      university,
      gpa,
      receivedBody: req.body
    });

    // Build update data object, filtering out empty strings for required fields
    const updateData = {};
    
    if (name !== undefined && name !== "") updateData.name = name;
    if (gender !== undefined && gender !== "") updateData.gender = gender;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (cnic !== undefined) updateData.cnic = cnic || null;
    if (guardianName !== undefined) updateData.guardianName = guardianName || null;
    if (guardianCnic !== undefined) updateData.guardianCnic = guardianCnic || null;
    if (guardian2Name !== undefined) updateData.guardian2Name = guardian2Name || null;
    if (guardian2Cnic !== undefined) updateData.guardian2Cnic = guardian2Cnic || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (guardianPhone1 !== undefined) updateData.guardianPhone1 = guardianPhone1 || null;
    if (guardianPhone2 !== undefined) updateData.guardianPhone2 = guardianPhone2 || null;
    if (address !== undefined) updateData.address = address || null;
    if (university !== undefined && university !== "") updateData.university = university;
    if (program !== undefined && program !== "") updateData.program = program;
    if (gpa !== undefined) {
      updateData.gpa = (gpa === null || gpa === "" || isNaN(Number(gpa))) ? 0 : Number(gpa);
    }
    if (gradeType !== undefined) updateData.gradeType = gradeType || "CGPA";
    if (gradYear !== undefined) {
      updateData.gradYear = (gradYear === null || gradYear === "" || isNaN(Number(gradYear))) ? null : Number(gradYear);
    }
    if (city !== undefined) updateData.city = city || null;
    if (province !== undefined) updateData.province = province || null;
    if (field !== undefined && field !== "") updateData.field = field;
    if (country !== undefined && country !== "") updateData.country = country;
    if (degreeLevel !== undefined) updateData.degreeLevel = degreeLevel || null;
    if (customDegreeLevel !== undefined) updateData.customDegreeLevel = customDegreeLevel || null;
    if (customFieldOfStudy !== undefined) updateData.customFieldOfStudy = customFieldOfStudy || null;
    if (customProgram !== undefined) updateData.customProgram = customProgram || null;
    if (programStartDate !== undefined) updateData.programStartDate = programStartDate || null;
    if (programEndDate !== undefined) updateData.programEndDate = programEndDate || null;
    
    console.log(' PATCH /students/:id - Update data:', updateData);
    
    const updated = await prisma.student.update({
      where: { id },
      data: updateData,
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
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      meta: err.meta,
      stack: err.stack
    });
    
    // Handle Prisma-specific errors
    if (err.code === 'P2002') {
      return res.status(409).json({ 
        error: "A record with this information already exists",
        details: err.meta?.target 
      });
    }
    
    if (err.code === 'P2025') {
      return res.status(404).json({ 
        error: "Student not found" 
      });
    }
    
    // Handle validation errors
    if (err.name === 'PrismaClientValidationError' || err.message?.includes('Unknown argument')) {
      // Extract field name from error message if possible
      const fieldMatch = err.message?.match(/Unknown argument `(\w+)`/);
      const fieldName = fieldMatch ? fieldMatch[1] : 'unknown field';
      
      return res.status(400).json({ 
        error: `Validation error: ${fieldName ? `Invalid field: ${fieldName}` : err.message}`,
        details: err.message,
        code: err.code
      });
    }
    
    res.status(500).json({ 
      error: "Failed to update student",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default router;
