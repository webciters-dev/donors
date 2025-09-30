// server/src/routes/uploads.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";

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
function canAccessStudentDocs(user, studentId) {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.role === "STUDENT" && user.studentId === studentId) return true;
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
    if (!canAccessStudentDocs(req.user, studentId)) {
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
    if (!canAccessStudentDocs(req.user, studentId)) {
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

    if (!canAccessStudentDocs(req.user, existing.studentId)) {
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

export default router;
