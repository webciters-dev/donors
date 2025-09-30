// server/src/routes/fieldReviews.js
import express from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, onlyRoles } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = express.Router();

// List reviews (admin sees all; field officer sees own)
router.get("/", requireAuth, async (req, res) => {
  try {
    const role = req.user?.role;
    const where = role === "FIELD_OFFICER"
      ? { officerUserId: req.user.id }
      : {};

    const reviews = await prisma.fieldReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
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
    const review = await prisma.fieldReview.create({
      data: { applicationId, studentId, officerUserId, status: "PENDING" },
    });
    res.status(201).json({ review });
  } catch (e) {
    console.error("POST /field-reviews failed:", e);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// Update review (field officer sets status/notes/recommendation)
router.patch("/:id", requireAuth, onlyRoles("FIELD_OFFICER", "ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, recommendation } = req.body || {};
    const updated = await prisma.fieldReview.update({
      where: { id },
      data: {
        ...(status != null ? { status } : {}),
        ...(notes != null ? { notes } : {}),
        ...(recommendation != null ? { recommendation } : {}),
      },
    });
    res.json({ review: updated });
  } catch (e) {
    console.error("PATCH /field-reviews/:id failed:", e);
    if (e.code === "P2025") return res.status(404).json({ error: "Not found" });
    res.status(500).json({ error: "Failed to update review" });
  }
});

// Request missing info (field officer) — email placeholder and message log
router.post("/:id/request-missing", requireAuth, onlyRoles("FIELD_OFFICER", "ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { items = [], note = "" } = req.body || {};
    const review = await prisma.fieldReview.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: "Review not found" });

    // Fetch student email
    const student = await prisma.student.findUnique({ where: { id: review.studentId } });
    if (!student) return res.status(404).json({ error: "Student not found" });

    const body = `Dear ${student.name},\n\nPlease provide the following missing information/documents:\n- ${items.join("\n- ")}\n\nNote: ${note}\n\nThank you.`;

    // Placeholder: send email (for dev we log to console; plug SMTP here later)
    console.log("[EMAIL to]", student.email, "\n[SUBJECT] Request for Missing Information\n[BODY]\n" + body);

    // Log as a message on the application (fromRole: "field_officer")
    await prisma.message.create({
      data: {
        studentId: review.studentId,
        applicationId: review.applicationId,
        text: `Missing info requested: ${items.join(", ")}. ${note ? "Note: " + note : ""}`,
        fromRole: "field_officer",
      },
    });

    res.json({ ok: true });
  } catch (e) {
    console.error("POST /field-reviews/:id/request-missing failed:", e);
    res.status(500).json({ error: "Failed to request missing info" });
  }
});

export default router;
