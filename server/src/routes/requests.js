// server/src/routes/requests.js
import express from "express";
import prisma from "../prismaClient.js";

const router = express.Router();

// GET /api/requests?studentId=...
// Derives request items from messages that contain "Missing info requested: ..."
router.get("/", async (req, res) => {
  try {
    const studentId = String(req.query.studentId || "");
    if (!studentId) return res.status(400).json({ error: "studentId required" });

    const msgs = await prisma.message.findMany({
      where: { studentId },
      orderBy: { createdAt: "asc" },
      select: { id: true, text: true, fromRole: true, createdAt: true },
    });

    const items = [];
    let lastRequestText = null;
    for (const m of msgs) {
      if (m.fromRole === "student") continue;
      const text = String(m.text || "");
      const marker = "missing info requested:";
      const idx = text.toLowerCase().indexOf(marker);
      if (idx === -1) continue;
      lastRequestText = text;
      let rest = text.slice(idx + marker.length).trim();
      const noteIdx = rest.toLowerCase().indexOf("note:");
      if (noteIdx >= 0) rest = rest.slice(0, noteIdx).trim();
      if (rest.endsWith(".")) rest = rest.slice(0, -1);
      const parts = rest.split(/,|\n/).map((s) => s.trim()).filter(Boolean);
      for (const p of parts) {
        items.push({ label: p, messageId: m.id, createdAt: m.createdAt });
      }
    }

    // de-duplicate by label (case-insensitive)
    const map = new Map();
    for (const it of items) {
      const key = String(it.label || "").toLowerCase();
      map.set(key, it);
    }
    const arr = Array.from(map.values());
    return res.json({ items: arr, lastRequestText });
  } catch (e) {
    console.error("GET /api/requests failed:", e);
    return res.status(500).json({ error: "Failed to load requests" });
  }
});

export default router;
