// server/src/routes/fieldReviews.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, onlyRoles } from "../middleware/auth.js";
import { sendFieldOfficerWelcomeEmail, sendMissingDocumentRequestEmail, sendAdminFieldReviewCompletedEmail, sendCaseWorkerAssignmentEmail, sendStudentCaseWorkerAssignedEmail } from "../lib/emailService.js";
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const router = express.Router();

// List reviews (admin sees all; case worker sees own)
router.get("/", requireAuth, async (req, res) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    
    console.log(' GET /api/field-reviews');
    console.log('   User ID:', userId);
    console.log('   User Email:', userEmail);
    console.log('   User Role:', role);
    
    // Support both SUB_ADMIN and CASE_WORKER terminology for backward compatibility
    const where = (role === "SUB_ADMIN" || role === "CASE_WORKER")
      ? { officerUserId: userId }
      : {};
    
    console.log('   WHERE clause:', JSON.stringify(where));

    const reviews = await prisma.fieldReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        application: {
          select: {
            id: true,
            studentId: true,
            term: true,
            status: true,
            submittedAt: true,
            amount: true,
            currency: true,
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                guardianName: true,
                guardianPhone1: true,
                guardianPhone2: true,
                guardian2Name: true,
                guardian2Cnic: true,
                cnic: true,
                address: true,
                city: true,
                province: true,
                country: true,
                dateOfBirth: true,
                gender: true,
                degreeLevel: true,
                university: true,
                program: true,
                gpa: true,
                photoUrl: true,
                photoThumbnailUrl: true,
                introVideoUrl: true,
                introVideoThumbnailUrl: true,
                createdAt: true,
                updatedAt: true
              }
            }
          }
        },
        officer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('   Found reviews:', reviews.length);
    
    res.json({ reviews });
  } catch (e) {
    console.error(" GET /field-reviews FAILED!");
    console.error("   Error type:", e.constructor.name);
    console.error("   Error message:", e.message);
    console.error("   Full error:", e);
    console.error("   Stack:", e.stack);
    res.status(500).json({ error: "Failed to load reviews" });
  }
});

// Create/assign a review (admin) - now supports task-specific assignments
router.post("/", requireAuth, onlyRoles("ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const { applicationId, studentId, officerUserId, taskType } = req.body || {};
    if (!applicationId || !studentId || !officerUserId) {
      return res.status(400).json({ error: "applicationId, studentId, officerUserId required" });
    }

    // Check for existing assignment to prevent duplicates for the same task type
    const existingReview = await prisma.fieldReview.findFirst({
      where: {
        applicationId: applicationId,
        officerUserId: officerUserId,
        taskType: taskType || null
      }
    });

    if (existingReview) {
      const taskDescription = taskType ? ` for ${taskType.replace('_', ' ').toLowerCase()}` : '';
      return res.status(400).json({ 
        error: `Application is already assigned to this case worker${taskDescription}`,
        existingReviewId: existingReview.id 
      });
    }

    // Get case worker details
    const caseWorker = await prisma.user.findUnique({
      where: { id: officerUserId },
      select: { id: true, email: true, name: true }
    });

    if (!caseWorker) {
      return res.status(404).json({ error: "Case worker not found" });
    }

    // Get application and student details for email
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { student: true }
    });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Create the review with optional task type
    const review = await prisma.fieldReview.create({
      data: { 
        applicationId, 
        studentId, 
        officerUserId, 
        taskType: taskType || null,
        status: "PENDING" 
      },
    });

    // Send assignment notification emails (async, don't block response)
    if (caseWorker.email) {
      // Send case worker assignment email (to case worker) - notifies of new assignment
      sendCaseWorkerAssignmentEmail({
        email: caseWorker.email,
        caseWorkerName: caseWorker.name || 'Case Worker',
        studentName: application.student.name,
        applicationId: applicationId,
        studentEmail: application.student.email
      }).catch(emailError => {
        console.error('Failed to send case worker assignment email:', emailError);
        // Don't fail the request if email fails
      });

      // Send student notification email (to student) - notify them of case worker assignment
      sendStudentCaseWorkerAssignedEmail({
        email: application.student.email,
        studentName: application.student.name,
        caseWorkerName: caseWorker.name || 'Case Worker',
        applicationId: applicationId
      }).catch(emailError => {
        console.error('Failed to send student case worker assignment email:', emailError);
        // Don't fail the request if email fails
      });
    }

    res.status(201).json({ review });
  } catch (e) {
    console.error("POST /field-reviews failed:", e);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// Update review (case worker sets status/notes/recommendation)
router.patch("/:id", requireAuth, onlyRoles("SUB_ADMIN", "CASE_WORKER", "ADMIN", "SUPER_ADMIN"), async (req, res) => {
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

    // Auto-notify student when Case Worker completes verification
    if (status === "COMPLETED") {
      try {
        const reviewWithDetails = await prisma.fieldReview.findUnique({
          where: { id },
          include: {
            officer: { select: { name: true, email: true } },
            application: {
              include: {
                student: { select: { name: true, email: true } }
              }
            }
          }
        });

        const recommendationText = fielderRecommendation ? 
          `Recommendation: ${fielderRecommendation.replace('_', ' ').toLowerCase()}` : '';

        // Notify student
        await prisma.message.create({
          data: {
            studentId: reviewWithDetails.studentId,
            applicationId: reviewWithDetails.applicationId,
            text: `Awake: Verification completed by ${reviewWithDetails.officer?.name || 'our team'}. ${recommendationText}. Your application is now under review.`,
            fromRole: 'admin'
          }
        });

        // Send admin notification email for completed field review (async, don't block response)
        try {
          // Get admin users
          const adminUsers = await prisma.user.findMany({
            where: {
              role: { in: ['ADMIN', 'SUPER_ADMIN'] }
            },
            select: { email: true, name: true }
          });

          // Send notification to all admins
          for (const admin of adminUsers) {
            sendAdminFieldReviewCompletedEmail({
              email: admin.email,
              adminName: admin.name || 'Admin',
              caseWorkerName: reviewWithDetails.officer?.name || 'Case Worker',
              studentName: reviewWithDetails.application?.student?.name || 'Student',
              applicationId: reviewWithDetails.applicationId,
              fielderRecommendation: fielderRecommendation,
              verificationScore: verificationScore,
              adminNotesRequired: adminNotesRequired
            }).catch(emailError => {
              console.error(`Failed to send admin notification email to ${admin.email}:`, emailError);
            });
          }
        } catch (adminEmailError) {
          console.error('Failed to send admin field review completion emails:', adminEmailError);
        }
        
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

// Request missing info (case worker) — email placeholder and message log
router.post("/:id/request-missing", requireAuth, onlyRoles("SUB_ADMIN", "CASE_WORKER", "ADMIN", "SUPER_ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { items = [], note = "" } = req.body || {};
    const review = await prisma.fieldReview.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: "Review not found" });

    // Fetch student email
    const student = await prisma.student.findUnique({ where: { id: review.studentId } });
    if (!student) return res.status(404).json({ error: "Student not found" });

    // Update field review with the requested documents
    // This marks that documents have been requested and enables email notification on upload
    await prisma.fieldReview.update({
      where: { id },
      data: {
        additionalDocumentsRequested: items,
      },
    });

    // Send missing document request email (async, don't block response)
    sendMissingDocumentRequestEmail({
      email: student.email,
      name: student.name,
      missingItems: items,
      note: note,
      applicationId: review.applicationId
    }).catch(emailError => {
      console.error('Failed to send missing document request email:', emailError);
    });

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

// Reassign case worker (admin only)
router.patch("/:id/reassign", requireAuth, onlyRoles("ADMIN", "SUPER_ADMIN"), async (req, res) => {
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

    // Get new case worker details
    const newFieldOfficer = await prisma.user.findUnique({
      where: { id: newOfficerUserId },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!newFieldOfficer || (newFieldOfficer.role !== 'SUB_ADMIN' && newFieldOfficer.role !== 'CASE_WORKER')) {
      return res.status(404).json({ error: "Valid case worker not found" });
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
        text: `Case worker reassigned to ${newFieldOfficer.name || newFieldOfficer.email} for further review.`,
        fromRole: "admin"
      }
    });

    // Send email notification to new case worker (async)
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
        name: newFieldOfficer.name || 'Case Worker',
        password: tempPassword || 'Use your existing password',
        applicationId: currentReview.applicationId,
        studentName: currentReview.application.student.name
      }).catch(emailError => {
        console.error('Failed to send case worker reassignment email:', emailError);
      });
    }

    res.json({ review: updatedReview });
  } catch (e) {
    console.error("PATCH /field-reviews/:id/reassign failed:", e);
    res.status(500).json({ error: "Failed to reassign case worker" });
  }
});

// Unassign/Delete field review (admin only)
router.delete("/:id", requireAuth, onlyRoles("ADMIN", "SUPER_ADMIN"), async (req, res) => {
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
    res.status(500).json({ error: "Failed to unassign case worker" });
  }
});

export default router;
