// server/src/routes/sponsorships.js
import express from "express";
import prisma from "../prismaClient.js";
import { requireAuth, onlyRoles } from "../middleware/auth.js";

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
 * GET /api/sponsorships/check
 * Check if current donor has sponsored a specific student
 * Required for donor-student messaging access control
 */
router.get("/check", requireAuth, async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { studentId } = req.query;

    // Only donors can check sponsorship status
    if (role !== "DONOR") {
      return res.status(403).json({ error: "Only donors can check sponsorship status" });
    }

    if (!studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }

    // Get donor ID for this user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { donorId: true },
    });

    if (!user?.donorId) {
      return res.json({ hasSponsorship: false });
    }

    // Check if this specific donor has sponsored this specific student
    const sponsorship = await prisma.sponsorship.findFirst({
      where: { 
        donorId: user.donorId,
        studentId: studentId,
        status: "active"
      }
    });

    console.log(` Sponsorship check: Donor ${user.donorId} -> Student ${studentId}: ${sponsorship ? 'HAS' : 'NO'} sponsorship`);

    res.json({ 
      hasSponsorship: !!sponsorship,
      sponsorshipId: sponsorship?.id || null
    });
  } catch (error) {
    console.error(" Failed to check sponsorship:", error);
    res.status(500).json({ error: "Failed to check sponsorship status" });
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
    const requiredAmount = approvedApp.amount;

    // Ensure sponsor is paying the full required amount in the application's currency
    if (Number(amount) !== requiredAmount) {
      return res.status(400).json({ 
        error: `Sponsorship amount must be exactly ${requiredAmount} ${approvedApp.currency} (the complete education cost)` 
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

    //  MARK STUDENT AS SPONSORED: Set sponsored=true when sponsorship is created
    await prisma.student.update({
      where: { id: studentId },
      data: { sponsored: true }
    });

    // Log payment preferences for now (can be stored in separate table or added to schema later)
    console.log(`Sponsorship created with payment preferences: frequency=${paymentFrequency}, method=${paymentMethod}`);
    console.log(` Student ${created.student.name} is now sponsored by ${created.donor.name}`);

    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create sponsorship" });
  }
});

/**
 * POST /api/sponsorships/admin/bulk
 * body: { donorId, studentIds[] }
 * - ADMIN only
 * - Creates sponsorships for selected students against selected donor
 * - Marks students as sponsored
 * - Ensures the latest application for each student is APPROVED
 */
router.post("/admin/bulk", requireAuth, onlyRoles("ADMIN"), async (req, res) => {
  try {
    const { donorId, studentIds, amounts } = req.body || {};

    if (!donorId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: "donorId and non-empty studentIds array required" });
    }

    const donor = await prisma.donor.findUnique({
      where: { id: String(donorId) },
      select: { id: true, name: true },
    });

    if (!donor) {
      return res.status(404).json({ error: "Donor not found" });
    }

    const students = await prisma.student.findMany({
      where: { id: { in: studentIds.map(String) } },
      include: {
        sponsorships: {
          where: { status: "active" },
          select: { id: true, donorId: true },
          take: 1,
        },
        applications: {
          orderBy: { submittedAt: "desc" },
          take: 1, // latest application
        },
      },
    });

    if (students.length === 0) {
      return res.status(400).json({ error: "No eligible students found" });
    }

    const results = [];
    const errors = [];

    for (const student of students) {
      try {
        if (student.sponsored || (student.sponsorships && student.sponsorships.length > 0)) {
          errors.push({ studentId: student.id, studentName: student.name, error: "Already sponsored" });
          continue;
        }

        const app = student.applications?.[0] || null;
        if (!app) {
          errors.push({ studentId: student.id, studentName: student.name, error: "No application found" });
          continue;
        }

        // Use custom amount if provided, otherwise fall back to application amount
        let amount = 0;
        if (amounts && typeof amounts === 'object' && amounts[student.id] !== undefined) {
          amount = Number(amounts[student.id]);
        } else {
          amount = Number(app.approvedAmount ?? app.amount ?? 0);
        }

        if (!amount || isNaN(amount) || amount <= 0) {
          errors.push({ studentId: student.id, studentName: student.name, error: "Invalid or missing transaction amount" });
          continue;
        }

        const sponsorship = await prisma.$transaction(async (tx) => {
          const created = await tx.sponsorship.create({
            data: {
              donorId: donor.id,
              studentId: student.id,
              amount: Math.floor(amount),
              status: "active",
            },
            include: {
              student: { select: { id: true, name: true } },
              donor: { select: { id: true, name: true } },
            },
          });

          await tx.student.update({
            where: { id: student.id },
            data: { sponsored: true },
          });

          // Ensure application is approved when manually sponsoring
          // Use custom amount if provided, otherwise use existing approvedAmount or application amount
          const approvedAmount = (amounts && typeof amounts === 'object' && amounts[student.id] !== undefined)
            ? Number(amounts[student.id])
            : (app.approvedAmount ?? app.amount);

          if (app.status !== "APPROVED") {
            await tx.application.update({
              where: { id: app.id },
              data: {
                status: "APPROVED",
                approvedAmount: approvedAmount,
              },
            });
          } else {
            // Update approvedAmount even if already approved (to use custom amount)
            await tx.application.update({
              where: { id: app.id },
              data: { approvedAmount: approvedAmount },
            });
          }

          return created;
        });

        results.push({
          studentId: student.id,
          studentName: student.name,
          applicationId: app.id,
          amount,
          sponsorshipId: sponsorship.id,
          donorId: donor.id,
          donorName: donor.name,
        });
      } catch (err) {
        console.error(`Error creating sponsorship for student ${student.id}:`, err);
        errors.push({ studentId: student.id, studentName: student.name, error: err.message || "Failed" });
      }
    }

    return res.status(201).json({
      success: true,
      created: results.length,
      results,
      errors,
    });
  } catch (e) {
    console.error("POST /sponsorships/admin/bulk error:", e);
    return res.status(500).json({ error: "Failed to create bulk sponsorships" });
  }
});

export default router;
