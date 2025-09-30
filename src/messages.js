// server/src/routes/messages.js
import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

/**
 * GET /api/messages?studentId=...&applicationId=...(optional)
 * Returns messages for a student (optionally filtered to one application)
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
      orderBy: { createdAt: "asc" },
    });

    res.json({ messages });
  } catch (err) {
    console.error("GET /api/messages failed:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/**
 * POST /api/messages
 * body: { studentId, applicationId?, text, fromRole: "student" | "admin" }
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
        applicationId: applicationId || null,
        text: String(text).trim(),
        fromRole,
      },
    });

    res.status(201).json(msg);
  } catch (err) {
    console.error("POST /api/messages failed:", err);
    res.status(500).json({ error: "Failed to create message" });
  }
});

export default router;
