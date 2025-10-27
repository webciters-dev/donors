// server/src/routes/applications.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { optionalAuth } from "../middleware/auth.js";
import { buildSnapshot } from "../lib/fx.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/applications
 * Optional query: status, page, limit
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // Role-aware filtering
    const where = {};
    const role = req.user?.role;
    if (role === "STUDENT") {
      // Students can only see their own applications
      // Need their studentId; derive via User relation
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const prismaUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!prismaUser?.studentId) {
        return res.json({ applications: [], pagination: { page: 1, limit: 0, total: 0, pages: 0 } });
      }
      where.studentId = prismaUser.studentId;
    } else if (status) {
      // Allow status filter for admins or public listing
      where.status = status;
    }

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take,
        orderBy: { submittedAt: "desc" },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              university: true,
              program: true,
              gender: true,
              city: true,
              province: true,
              currentInstitution: true,
              currentCity: true,
              currentCompletionYear: true,
              gpa: true,
              gradYear: true,
              // Profile completeness fields
              cnic: true,
              dateOfBirth: true,
              guardianName: true,
              guardianCnic: true,
              phone: true,
              address: true,
              personalIntroduction: true,
              // Enhanced details for donors
              familySize: true,
              parentsOccupation: true,
              monthlyFamilyIncome: true,
              careerGoals: true,
              academicAchievements: true,
              communityInvolvement: true,
              currentAcademicYear: true,
              specificField: true,
              // Sponsorship status for admin filtering
              sponsored: true,
            },
          },
          fieldReviews: {
            include: {
              officer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { updatedAt: "desc" },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    res.json({
      applications,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

/**
 * POST /api/applications
 * Accepts: { studentId, term, amount, currency }
 * Single currency system - no more needUSD/needPKR conversion
 */
router.post("/", async (req, res) => {
  try {
    const { 
      studentId, 
      term, 
      amount,
      currency, 
      notes,
      // Enhanced financial breakdown fields
      universityFee,
      livingExpenses,
      totalExpense,
      scholarshipAmount
    } = req.body;

    if (!studentId || !term) {
      return res.status(400).json({ error: "Missing required fields: studentId, term" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount is required and must be greater than 0" });
    }

    if (!currency) {
      return res.status(400).json({ error: "Currency is required" });
    }

    const data = {
      studentId,
      term: String(term),
      status: "DRAFT", // Create applications as DRAFT
      notes: notes ?? null,
      currency: currency,
      amount: parseInt(amount, 10),
      // Enhanced financial breakdown fields
      universityFee:
        universityFee === undefined || universityFee === null || universityFee === ""
          ? null
          : parseInt(universityFee, 10),
      livingExpenses:
        livingExpenses === undefined || livingExpenses === null || livingExpenses === ""
          ? null
          : parseInt(livingExpenses, 10),
      totalExpense:
        totalExpense === undefined || totalExpense === null || totalExpense === ""
          ? null
          : parseInt(totalExpense, 10),
      scholarshipAmount:
        scholarshipAmount === undefined || scholarshipAmount === null || scholarshipAmount === ""
          ? null
          : parseInt(scholarshipAmount, 10),
    };

    // Build snapshot with single currency amount
    const snap = await buildSnapshot(data.amount, data.currency);

    const application = await prisma.application.create({
      data: { ...data, ...snap },
      include: {
        student: { select: { name: true, email: true, university: true, program: true } },
      },
    });

    res.status(201).json(application);
  } catch (error) {
    console.error("Error creating application:", error);
    res.status(500).json({
      error: "Failed to create application",
      code: error?.code,
      details: typeof error?.message === "string" ? error.message : undefined,
    });
  }
});

/**
 * PATCH /api/applications/:id
 * Allows updating status/notes and amount/currency
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, amount, currency, forceApprove } = req.body;

    // Document validation for APPROVED status
    if (status === "APPROVED") {
      const application = await prisma.application.findUnique({
        where: { id },
        include: {
          student: {
            include: {
              documents: {
                select: { type: true }
              }
            }
          }
        }
      });

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Check required documents
      const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "PHOTO", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "UNIVERSITY_CARD", "ENROLLMENT_CERTIFICATE", "TRANSCRIPT"];
      const uploadedTypes = application.student.documents.map(doc => doc.type);
      const missingDocs = REQUIRED_DOCS.filter(req => !uploadedTypes.includes(req));

      if (missingDocs.length > 0 && !forceApprove) {
        return res.status(400).json({
          error: "Cannot approve application with missing required documents",
          missingDocuments: missingDocs,
          message: `Missing required documents: ${missingDocs.join(', ')}. Use forceApprove=true to override this validation.`,
          requiresOverride: true
        });
      }

      // If force approve is used, log it for audit trail
      if (forceApprove && missingDocs.length > 0) {
        console.log(`⚠️ FORCE APPROVE: Application ${id} approved despite missing documents: ${missingDocs.join(', ')}`);
      }
    }

    // build update payload
    const data = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes ?? null;
    if (currency) data.currency = currency;
    if (amount !== undefined) {
      data.amount = amount === null || amount === "" ? null : parseInt(amount, 10);
    }

    // If amount/currency provided, recompute snapshot
    if (currency !== undefined || amount !== undefined) {
      const existing = await prisma.application.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: "Application not found" });

      const finalCurrency = data.currency ?? existing.currency;
      const finalAmount = data.amount ?? existing.amount;

      if (finalAmount && finalCurrency) {
        const snap = await buildSnapshot(finalAmount, finalCurrency);
        Object.assign(data, snap);
      }
    }

    const updated = await prisma.application.update({
      where: { id },
      data,
      include: { student: { select: { id: true, name: true, email: true, university: true, program: true } } },
    });

    // 🎓 STUDENT PHASE TRANSITION: When application is approved, transition student to ACTIVE phase
    if (status === "APPROVED" && updated.student?.id) {
      try {
        await prisma.student.update({
          where: { id: updated.student.id },
          data: { 
            studentPhase: 'ACTIVE',
            // 🔥 FIX: Do NOT set sponsored=true on approval - only when donor actually sponsors
            // sponsored field should remain false until actual sponsorship occurs
          }
        });
        console.log(`🎓 Student ${updated.student.name} transitioned to ACTIVE phase (ready for marketplace)`);
      } catch (phaseError) {
        // Log error but don't fail the application approval
        console.error('Phase transition error:', phaseError);
      }
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating application:", error);
    if (error.code === "P2025") return res.status(404).json({ error: "Application not found" });
    res.status(500).json({ error: "Failed to update application" });
  }
});

/**
 * Legacy/explicit status endpoint (kept for compatibility)
 * PATCH /api/applications/:id/status
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, notes, forceApprove } = req.body;

    if (!["PENDING", "PROCESSING", "APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        error:
          "Invalid status. Must be PENDING, PROCESSING, APPROVED, or REJECTED",
      });
    }

    // Document validation for APPROVED status
    if (status === "APPROVED") {
      const application = await prisma.application.findUnique({
        where: { id: req.params.id },
        include: {
          student: {
            include: {
              documents: {
                select: { type: true }
              }
            }
          }
        }
      });

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      // Check required documents
      const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "PHOTO", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "UNIVERSITY_CARD", "ENROLLMENT_CERTIFICATE", "TRANSCRIPT"];
      const uploadedTypes = application.student.documents.map(doc => doc.type);
      const missingDocs = REQUIRED_DOCS.filter(req => !uploadedTypes.includes(req));

      if (missingDocs.length > 0 && !forceApprove) {
        return res.status(400).json({
          error: "Cannot approve application with missing required documents",
          missingDocuments: missingDocs,
          message: `Missing required documents: ${missingDocs.join(', ')}. Use forceApprove=true to override this validation.`,
          requiresOverride: true
        });
      }

      // If force approve is used, log it for audit trail
      if (forceApprove && missingDocs.length > 0) {
        console.log(`⚠️ FORCE APPROVE: Application ${req.params.id} approved despite missing documents: ${missingDocs.join(', ')}`);
      }
    }

    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        status,
        notes: notes ?? null,
      },
      include: {
        student: {
          select: {
            name: true,
            email: true,
            university: true,
            program: true,
          },
        },
      },
    });

    // Auto-notify student of status changes
    const statusMessages = {
      'PENDING': 'Your application is under initial review.',
      'PROCESSING': 'Your application is being processed by our team.',
      'APPROVED': '🎉 Congratulations! Your application has been approved.',
      'REJECTED': 'We regret to inform you that your application has been rejected.'
    };

    if (statusMessages[status]) {
      console.log(`Creating status notification for status: ${status}, studentId: ${application.studentId}`);
      try {
        const notification = await prisma.message.create({
          data: {
            studentId: application.studentId,
            applicationId: application.id,
            text: `Status Update: ${statusMessages[status]}${notes ? ` Note: ${notes}` : ''}`,
            fromRole: 'admin'
          }
        });
        console.log('Status notification created successfully:', notification.id);
      } catch (msgError) {
        console.error('Failed to create status notification:', msgError);
        // Don't fail the status update if message creation fails
      }
    } else {
      console.log(`No status message defined for status: ${status}`);
    }

    res.json(application);
  } catch (error) {
    console.error("Error updating application status:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Application not found" });
    }
    res.status(500).json({ error: "Failed to update application status" });
  }
});

/**
 * GET /api/applications/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { student: true },
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ error: "Failed to fetch application" });
  }
});

export default router;
