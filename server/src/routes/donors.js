// server/src/routes/donors.js
import express from "express";
import prisma from "../prismaClient.js";
import { requireAuth, onlyRoles } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/donors/me
 * Return the donor user’s donor record + basic aggregates.
 */
router.get("/me", requireAuth, onlyRoles("DONOR", "ADMIN"), async (req, res) => {
  try {
    // If ADMIN calls this, allow seeing any donor by ?donorId=...
    const donorId =
      req.user.role === "ADMIN" && req.query.donorId
        ? String(req.query.donorId)
        : req.user.donorId;

    if (!donorId) {
      return res.status(400).json({ error: "No donorId on account." });
    }

    const donor = await prisma.donor.findUnique({
      where: { id: donorId },
      select: {
        id: true,
        name: true,
        email: true,
        organization: true,
        totalFunded: true,
        createdAt: true,
        updatedAt: true,
        country: true,
        address: true,
        currencyPreference: true,
        taxId: true,
      },
    });

    if (!donor) return res.status(404).json({ error: "Donor not found" });

    // Basic aggregates
    const [count, sum] = await Promise.all([
      prisma.sponsorship.count({ where: { donorId } }),
      prisma.sponsorship.aggregate({
        _sum: { amount: true },
        where: { donorId },
      }),
    ]);

    res.json({
      donor,
      stats: {
        sponsorshipCount: count,
        totalFunded: Number(sum?._sum?.amount || 0),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load donor profile" });
  }
});

/**
 * PUT /api/donors/me
 * Update donor profile fields: name, organization, country, address, currencyPreference
 */
router.put("/me", requireAuth, onlyRoles("DONOR", "ADMIN"), async (req, res) => {
  try {
    const donorId = req.user.role === "ADMIN" && req.query.donorId ? String(req.query.donorId) : req.user.donorId;
    if (!donorId) return res.status(400).json({ error: "No donorId on account." });

    const { name, organization, country, address, currencyPreference, taxId } = req.body || {};
    const updated = await prisma.donor.update({
      where: { id: donorId },
      data: {
        ...(name != null ? { name } : {}),
        ...(organization != null ? { organization } : {}),
        ...(country != null ? { country } : {}),
        ...(address != null ? { address } : {}),
        ...(currencyPreference === "USD" || currencyPreference === "PKR"
          ? { currencyPreference }
          : {}),
        ...(taxId != null ? { taxId } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        organization: true,
        totalFunded: true,
        country: true,
        address: true,
        currencyPreference: true,
        taxId: true,
        updatedAt: true,
      },
    });

    res.json({ donor: updated });
  } catch (e) {
    console.error(e);
    if (e.code === "P2025") return res.status(404).json({ error: "Donor not found" });
    res.status(500).json({ error: "Failed to update donor" });
  }
});
/**
 * GET /api/donors/me/sponsorships
 * Return this donor’s sponsorships with student info (for dashboard list).
 */
router.get(
  "/me/sponsorships",
  requireAuth,
  onlyRoles("DONOR", "ADMIN"),
  async (req, res) => {
    try {
      const donorId =
        req.user.role === "ADMIN" && req.query.donorId
          ? String(req.query.donorId)
          : req.user.donorId;

      if (!donorId) {
        return res.status(400).json({ error: "No donorId on account." });
      }

      const sponsorships = await prisma.sponsorship.findMany({
        where: { donorId },
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
              gpa: true,
              needUSD: true,   // current schema keeps need on Student too
              needUsd: true,   // tolerant to both
              needPKR: true,
              sponsored: true,
            },
          },
        },
      });

      res.json({ sponsorships });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to load sponsorships" });
    }
  }
);

export default router;
