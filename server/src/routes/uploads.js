// server/src/routes/uploads.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { sendDocumentUploadNotification } from "../lib/emailService.js";

const prisma = new PrismaClient();
const router = express.Router();

// Ensure uploads folder exists
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

/**
 * Helper: can this user access documents for studentId?
 * - ADMIN -> yes
 * - STUDENT -> only if req.user.studentId === studentId
 * - DONOR -> no (unless you decide otherwise later)
 */
async function canAccessStudentDocs(user, studentId, applicationId = null) {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.role === "STUDENT" && user.studentId === studentId) return true;
  
  // SUB_ADMIN can access documents for applications they are assigned to review
  if (user.role === "SUB_ADMIN" && applicationId) {
    try {
      const review = await prisma.fieldReview.findFirst({
        where: {
          applicationId: applicationId,
          officerUserId: user.id
        }
      });
      return !!review; // Return true if they have a review for this application
    } catch (e) {
      console.error("Error checking field officer access:", e);
      return false;
    }
  }
  
  return false;
}

/**
 * POST /api/uploads
 * multipart/form-data: file, studentId, applicationId?, type?
 * Auth required. STUDENT can only upload for themselves.
 */
router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const { studentId, applicationId, type } = req.body;
    if (!studentId || !req.file) {
      return res.status(400).json({ error: "studentId and file required" });
    }
    if (!(await canAccessStudentDocs(req.user, studentId, applicationId))) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const doc = await prisma.document.create({
      data: {
        studentId,
        applicationId: applicationId || null,
        type: (type || "OTHER"),
        url: `/uploads/${req.file.filename}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
    });

    // Send email notification to assigned field officer/admin (async, don't block response)
    if (applicationId && req.user.role === 'STUDENT') {
      // Only notify when student uploads documents (not when admin/field officers upload)
      notifyDocumentUpload(applicationId, studentId, doc.originalName || doc.type).catch(err => {
        console.error('Failed to send document upload notification:', err);
      });
    }

    res.status(201).json({ ok: true, document: doc });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

/**
 * GET /api/uploads?studentId=...&applicationId=...
 * Returns { documents: [...] }
 * Auth required. See canAccessStudentDocs.
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const studentId = String(req.query.studentId || "");
    const applicationId = req.query.applicationId ? String(req.query.applicationId) : null;

    if (!studentId) {
      return res.status(400).json({ error: "studentId required" });
    }
    if (!(await canAccessStudentDocs(req.user, studentId, applicationId))) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const where = {
      studentId,
      ...(applicationId ? { applicationId } : {}),
    };

    const documents = await prisma.document.findMany({
      where,
      orderBy: { uploadedAt: "desc" },
    });

    res.json({ documents });
  } catch (err) {
    console.error("List documents failed:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

/**
 * DELETE /api/uploads/:id
 * Deletes doc (and local file) if the user has access to that student’s docs.
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Not found" });

    if (!(await canAccessStudentDocs(req.user, existing.studentId, existing.applicationId))) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Try to unlink file (best effort)
    if (existing.url?.startsWith("/uploads/")) {
      const filePath = path.join(uploadDir, existing.url.replace("/uploads/", ""));
      fs.promises.unlink(filePath).catch(() => {});
    }

    await prisma.document.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete document failed:", err);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// Helper function to notify field officer/admin about document uploads
async function notifyDocumentUpload(applicationId, studentId, documentName) {
  try {
    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { name: true, email: true }
    });

    if (!student) return;

    // Find who is assigned to review this application
    const fieldReview = await prisma.fieldReview.findFirst({
      where: { applicationId },
      include: {
        officer: {
          select: { email: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let recipientEmail = null;
    let recipientName = null;

    if (fieldReview && fieldReview.officer) {
      // Notify assigned field officer
      recipientEmail = fieldReview.officer.email;
      recipientName = fieldReview.officer.name || 'Field Officer';
    } else {
      // No field officer assigned, notify admin
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { email: true, name: true }
      });
      
      if (admin) {
        recipientEmail = admin.email;
        recipientName = admin.name || 'Admin';
      }
    }

    if (recipientEmail) {
      await sendDocumentUploadNotification({
        email: recipientEmail,
        name: recipientName,
        studentName: student.name,
        documentName: documentName,
        applicationId: applicationId
      });
    }
  } catch (error) {
    console.error('Error in notifyDocumentUpload:', error);
  }
}

export default router;
