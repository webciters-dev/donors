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
    const { donorId: queryDonorId } = req.query;

    let where = {};
    if (role === "DONOR") {
      // map user -> donorId
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { donorId: true },
      });
      if (!user?.donorId) return res.json({ sponsorships: [] });
      where.donorId = user.donorId;
    } else if (role === "ADMIN") {
      // Admin can filter by donorId if provided
      if (queryDonorId) {
        where.donorId = queryDonorId;
      }
    } else {
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
            applications: {
              select: {
                id: true,
                status: true,
              },
              orderBy: { submittedAt: "desc" },
              take: 1, // Get the most recent application
            },
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
 * body: { studentId, amount, paymentFrequency?, paymentMethod? }
 * - DONOR only; donorId inferred from token
 * - One donor sponsors one student for the complete amount
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    if (role !== "DONOR") return res.status(403).json({ error: "Forbidden" });

    const { studentId, amount, paymentFrequency = "one-time", paymentMethod = "card" } = req.body;
    if (!studentId || !Number(amount)) {
      return res.status(400).json({ error: "studentId and amount required" });
    }

    // find donorId for this user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { donorId: true },
    });
    if (!user?.donorId) return res.status(400).json({ error: "No donor profile found" });

    // Check if student is already sponsored
    const existingSponsorship = await prisma.sponsorship.findFirst({
      where: { studentId, status: "active" },
      include: { donor: { select: { name: true } } }
    });

    if (existingSponsorship) {
      return res.status(400).json({ 
        error: `This student is already sponsored by ${existingSponsorship.donor.name}` 
      });
    }

    // Verify student needs sponsorship and get their education cost
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        applications: {
          where: { status: "APPROVED" },
          orderBy: { submittedAt: "desc" },
          take: 1,
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    if (!student.applications.length) {
      return res.status(400).json({ error: "Student has no approved applications" });
    }

    const approvedApp = student.applications[0];
    const requiredAmount = approvedApp.needUSD;

    // Ensure sponsor is paying the full required amount
    if (Number(amount) !== requiredAmount) {
      return res.status(400).json({ 
        error: `Sponsorship amount must be exactly ${requiredAmount} USD (the complete education cost)` 
      });
    }

    const created = await prisma.sponsorship.create({
      data: {
        donorId: user.donorId,
        studentId,
        amount: Math.floor(Number(amount)),
        status: "active",
        // TODO: Add paymentFrequency and paymentMethod fields to schema for Stripe integration
        // paymentFrequency: paymentFrequency,
        // paymentMethod: paymentMethod
      },
      include: {
        student: { select: { id: true, name: true } },
        donor: { select: { id: true, name: true } },
      },
    });

    // Log payment preferences for now (can be stored in separate table or added to schema later)
    console.log(`Sponsorship created with payment preferences: frequency=${paymentFrequency}, method=${paymentMethod}`);

    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create sponsorship" });
  }
});

export default router;
