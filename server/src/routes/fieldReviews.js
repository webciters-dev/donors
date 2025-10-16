// server/src/routes/fieldReviews.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, onlyRoles } from "../middleware/auth.js";
import { sendFieldOfficerWelcomeEmail } from "../lib/emailService.js";
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const router = express.Router();

// List reviews (admin sees all; field officer sees own)
router.get("/", requireAuth, async (req, res) => {
  try {
    const role = req.user?.role;
    const where = role === "SUB_ADMIN"
      ? { officerUserId: req.user.id }
      : {};

    const reviews = await prisma.fieldReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        application: {
          include: {
            student: true
          }
        }
      }
    });
    res.json({ reviews });
  } catch (e) {
    console.error("GET /field-reviews failed:", e);
    res.status(500).json({ error: "Failed to load reviews" });
  }
});

// Create/assign a review (admin)
router.post("/", requireAuth, onlyRoles("ADMIN"), async (req, res) => {
  try {
    const { applicationId, studentId, officerUserId } = req.body || {};
    if (!applicationId || !studentId || !officerUserId) {
      return res.status(400).json({ error: "applicationId, studentId, officerUserId required" });
    }

    // Check for existing assignment to prevent duplicates
    const existingReview = await prisma.fieldReview.findFirst({
      where: {
        applicationId: applicationId,
        officerUserId: officerUserId
      }
    });

    if (existingReview) {
      return res.status(400).json({ 
        error: "Application is already assigned to this field officer",
        existingReviewId: existingReview.id 
      });
    }

    // Get field officer details
    const fieldOfficer = await prisma.user.findUnique({
      where: { id: officerUserId },
      select: { id: true, email: true, name: true }
    });

    if (!fieldOfficer) {
      return res.status(404).json({ error: "Field officer not found" });
    }

    // Get application and student details for email
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { student: true }
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Create the review
    const review = await prisma.fieldReview.create({
      data: { applicationId, studentId, officerUserId, status: "PENDING" },
    });

    // Send welcome email to field officer (async, don't block response)
    if (fieldOfficer.email) {
      // Generate temporary password if field officer doesn't have one set
      let tempPassword = null;
      const existingUser = await prisma.user.findUnique({ 
        where: { id: officerUserId },
        select: { passwordHash: true }
      });
      
      if (!existingUser.passwordHash) {
        // Generate temporary password
        tempPassword = `FieldOfficer${Math.random().toString(36).slice(-6)}!`;
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        await prisma.user.update({
          where: { id: officerUserId },
          data: { passwordHash: hashedPassword }
        });
      }

      // Send email notification
      sendFieldOfficerWelcomeEmail({
        email: fieldOfficer.email,
        name: fieldOfficer.name || 'Field Officer',
        password: tempPassword || 'Use your existing password',
        applicationId: applicationId,
        studentName: application.student.name
      }).catch(emailError => {
        console.error('Failed to send sub admin email:', emailError);
        // Don't fail the request if email fails
      });
    }

    res.status(201).json({ review });
  } catch (e) {
    console.error("POST /field-reviews failed:", e);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// Update review (sub admin sets status/notes/recommendation)
router.patch("/:id", requireAuth, onlyRoles("SUB_ADMIN", "ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      notes, 
      recommendation,
      // Field verification fields
      homeVisitDate,
      homeVisitNotes,
      familyInterviewNotes,
      financialVerificationNotes,
      characterAssessment,
      deservingnessFactor,
      documentsVerified,
      identityVerified,
      familyIncomeVerified,
      educationVerified,
      recommendationReason,
      additionalDocumentsRequested,
      riskFactors,
      verificationScore,
      fielderRecommendation,
      adminNotesRequired
    } = req.body || {};

    const updateData = {};
    
    // Basic fields
    if (status != null) updateData.status = status;
    if (notes != null) updateData.notes = notes;
    if (recommendation != null) updateData.recommendation = recommendation;
    
    // Field verification fields
    if (homeVisitDate != null) updateData.homeVisitDate = homeVisitDate ? new Date(homeVisitDate) : null;
    if (homeVisitNotes != null) updateData.homeVisitNotes = homeVisitNotes;
    if (familyInterviewNotes != null) updateData.familyInterviewNotes = familyInterviewNotes;
    if (financialVerificationNotes != null) updateData.financialVerificationNotes = financialVerificationNotes;
    if (characterAssessment != null) updateData.characterAssessment = characterAssessment;
    if (deservingnessFactor != null) updateData.deservingnessFactor = Number(deservingnessFactor);
    if (documentsVerified != null) updateData.documentsVerified = documentsVerified;
    if (identityVerified != null) updateData.identityVerified = identityVerified;
    if (familyIncomeVerified != null) updateData.familyIncomeVerified = familyIncomeVerified;
    if (educationVerified != null) updateData.educationVerified = educationVerified;
    if (recommendationReason != null) updateData.recommendationReason = recommendationReason;
    if (additionalDocumentsRequested != null) updateData.additionalDocumentsRequested = additionalDocumentsRequested;
    if (riskFactors != null) updateData.riskFactors = riskFactors;
    if (verificationScore != null) updateData.verificationScore = Number(verificationScore);
    if (fielderRecommendation != null) updateData.fielderRecommendation = fielderRecommendation;
    if (adminNotesRequired != null) updateData.adminNotesRequired = adminNotesRequired;

    const updated = await prisma.fieldReview.update({
      where: { id },
      data: updateData,
    });

    // Auto-notify student when Sub Admin completes verification
    if (status === "COMPLETED") {
      try {
        const reviewWithDetails = await prisma.fieldReview.findUnique({
          where: { id },
          include: {
            officer: { select: { name: true } }
          }
        });

        const recommendationText = fielderRecommendation ? 
          `Recommendation: ${fielderRecommendation.replace('_', ' ').toLowerCase()}` : '';

        await prisma.message.create({
          data: {
            studentId: reviewWithDetails.studentId,
            applicationId: reviewWithDetails.applicationId,
            text: `Awake: Verification completed by ${reviewWithDetails.officer?.name || 'our team'}. ${recommendationText}. Your application is now under review.`,
            fromRole: 'admin'
          }
        });
      } catch (msgError) {
        console.error('Failed to create field verification notification:', msgError);
      }
    }
    
    res.json({ review: updated });
  } catch (e) {
    console.error("PATCH /field-reviews/:id failed:", e);
    if (e.code === "P2025") return res.status(404).json({ error: "Not found" });
    res.status(500).json({ error: "Failed to update field review" });
  }
});

// Request missing info (sub admin) — email placeholder and message log
router.post("/:id/request-missing", requireAuth, onlyRoles("SUB_ADMIN", "ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { items = [], note = "" } = req.body || {};
    const review = await prisma.fieldReview.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: "Review not found" });

    // Fetch student email
    const student = await prisma.student.findUnique({ where: { id: review.studentId } });
    if (!student) return res.status(404).json({ error: "Student not found" });

    const body = `Dear ${student.name},\n\nTo proceed with your application, please upload the following documents:\n\n- ${items.join("\n- ")}\n\n${note}\n\nPlease log into your Awake Connect account to upload these documents.\n\nBest regards,\nAwake Team`;

    // Placeholder: send email (for dev we log to console; plug SMTP here later)
    console.log("[EMAIL to]", student.email, "\n[SUBJECT] Request for Missing Information\n[BODY]\n" + body);

    // Log as a message on the application
    await prisma.message.create({
      data: {
        studentId: review.studentId,
        applicationId: review.applicationId,
        text: `Awake: Additional documents required - ${items.join(", ")}. ${note ? note : "Please upload these documents to proceed with your application."}`,
        fromRole: "admin",
      },
    });

    res.json({ ok: true });
  } catch (e) {
    console.error("POST /field-reviews/:id/request-missing failed:", e);
    res.status(500).json({ error: "Failed to request missing info" });
  }
});

// Reassign field officer (admin only)
router.patch("/:id/reassign", requireAuth, onlyRoles("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { newOfficerUserId } = req.body;

    if (!newOfficerUserId) {
      return res.status(400).json({ error: "newOfficerUserId is required" });
    }

    // Get current review details
    const currentReview = await prisma.fieldReview.findUnique({
      where: { id },
      include: { 
        application: { include: { student: true } }
      }
    });

    if (!currentReview) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Get new field officer details
    const newFieldOfficer = await prisma.user.findUnique({
      where: { id: newOfficerUserId },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!newFieldOfficer || newFieldOfficer.role !== 'SUB_ADMIN') {
      return res.status(404).json({ error: "Valid sub admin not found" });
    }

    // Update the review assignment
    const updatedReview = await prisma.fieldReview.update({
      where: { id },
      data: { 
        officerUserId: newOfficerUserId,
        status: "PENDING", // Reset status for new officer
        notes: `Reassigned to ${newFieldOfficer.name || newFieldOfficer.email}. Previous notes: ${currentReview.notes || 'None'}`
      }
    });

    // Log the reassignment as a message
    await prisma.message.create({
      data: {
        studentId: currentReview.studentId,
        applicationId: currentReview.applicationId,
        text: `Sub admin reassigned to ${newFieldOfficer.name || newFieldOfficer.email} for further review.`,
        fromRole: "admin"
      }
    });

    // Send email notification to new field officer (async)
    if (newFieldOfficer.email) {
      let tempPassword = null;
      const existingUser = await prisma.user.findUnique({ 
        where: { id: newOfficerUserId },
        select: { passwordHash: true }
      });
      
      if (!existingUser.passwordHash) {
        tempPassword = `FieldOfficer${Math.random().toString(36).slice(-6)}!`;
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        await prisma.user.update({
          where: { id: newOfficerUserId },
          data: { passwordHash: hashedPassword }
        });
      }

      sendFieldOfficerWelcomeEmail({
        email: newFieldOfficer.email,
        name: newFieldOfficer.name || 'Field Officer',
        password: tempPassword || 'Use your existing password',
        applicationId: currentReview.applicationId,
        studentName: currentReview.application.student.name
      }).catch(emailError => {
        console.error('Failed to send sub admin reassignment email:', emailError);
      });
    }

    res.json({ review: updatedReview });
  } catch (e) {
    console.error("PATCH /field-reviews/:id/reassign failed:", e);
    res.status(500).json({ error: "Failed to reassign field officer" });
  }
});

// Unassign/Delete field review (admin only)
router.delete("/:id", requireAuth, onlyRoles("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;

    // Get review details before deletion for logging
    const review = await prisma.fieldReview.findUnique({
      where: { id },
      include: { 
        application: { include: { student: true } },
        officer: { select: { name: true, email: true } }
      }
    });

    if (!review) {
      return res.status(404).json({ error: "Review assignment not found" });
    }

    // Delete the field review
    await prisma.fieldReview.delete({
      where: { id }
    });

    // Log the unassignment as a message
    await prisma.message.create({
      data: {
        studentId: review.studentId,
        applicationId: review.applicationId,
        text: `Assignment removed from ${review.officer.name || review.officer.email}. Application is now unassigned.`,
        fromRole: "admin"
      }
    });

    res.json({ 
      success: true, 
      message: `Application successfully unassigned from ${review.officer.name || review.officer.email}` 
    });
  } catch (e) {
    console.error("DELETE /field-reviews/:id failed:", e);
    res.status(500).json({ error: "Failed to unassign field officer" });
  }
});

export default router;
