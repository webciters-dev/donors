// server/src/routes/messages.js
import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

/**
 * GET /api/messages
 * Query params:
 *   - studentId (required)
 *   - applicationId (optional)
 */
router.get("/", async (req, res) => {
  try {
    const { studentId, applicationId } = req.query;

    if (!studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }

const messages = await prisma.message.findMany({
  where: {
    studentId,
    ...(applicationId ? { applicationId } : {}),
  },
  orderBy: { createdAt: "asc" }, // oldest → newest
  select: {
    id: true,
    text: true,
    fromRole: true,
    createdAt: true,
  },
});


    res.json({ messages });
  } catch (err) {
    console.error("❌ Failed to fetch messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/**
 * POST /api/messages
 * Body:
 *   - studentId (required)
 *   - applicationId (optional)
 *   - text (required)
 *   - fromRole (required: "student" | "admin")
 */
router.post("/", async (req, res) => {
  try {
    const { studentId, applicationId, text, fromRole } = req.body;

    if (!studentId || !text || !fromRole) {
      return res
        .status(400)
        .json({ error: "studentId, text, and fromRole are required" });
    }

    const msg = await prisma.message.create({
      data: {
        studentId,
        applicationId: applicationId || null, // ensure null if not provided
        text,
        fromRole,
      },
    });

    res.status(201).json(msg);
  } catch (err) {
    console.error("❌ Failed to create message:", err);
    res.status(500).json({ error: "Failed to create message" });
  }
});

export default router;
