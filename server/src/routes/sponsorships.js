// server/src/routes/sponsorships.js
import express from "express";
import prisma from "../prismaClient.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/sponsorships/aggregate
 * Public aggregate of total funded per student: { studentId, total }
 */
router.get("/aggregate", async (_req, res) => {
  try {
    const rows = await prisma.sponsorship.groupBy({
      by: ["studentId"],
      _sum: { amount: true },
    });
    const aggregate = rows.map((r) => ({ studentId: r.studentId, total: Number(r._sum.amount || 0) }));
    res.json({ aggregate });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load sponsorship aggregates" });
  }
});

/**
 * GET /api/sponsorships
 * - ADMIN: returns all sponsorships
 * - DONOR: returns only own sponsorships
 * - (other roles: 403)
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    let where = {};
    if (role === "DONOR") {
      // map user -> donorId
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { donorId: true },
      });
      if (!user?.donorId) return res.json({ sponsorships: [] });
      where.donorId = user.donorId;
    } else if (role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const sponsorships = await prisma.sponsorship.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            university: true,
            program: true,
            city: true,
            province: true,
          },
        },
        donor: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ sponsorships });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch sponsorships" });
  }
});

/**
 * POST /api/sponsorships
 * body: { studentId, amount }
 * - DONOR only; donorId inferred from token
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    if (role !== "DONOR") return res.status(403).json({ error: "Forbidden" });

    const { studentId, amount } = req.body;
    if (!studentId || !Number(amount)) {
      return res.status(400).json({ error: "studentId and amount required" });
    }

    // find donorId for this user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { donorId: true },
    });
    if (!user?.donorId) return res.status(400).json({ error: "No donor profile found" });

    const created = await prisma.sponsorship.create({
      data: {
        donorId: user.donorId,
        studentId,
        amount: Math.floor(Number(amount)),
        status: "active",
      },
      include: {
        student: { select: { id: true, name: true } },
        donor: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create sponsorship" });
  }
});

export default router;
