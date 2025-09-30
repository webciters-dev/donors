import express from "express";
import prisma from "../prismaClient.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/fx/latest?base=USD&quote=PKR
router.get("/latest", async (req, res) => {
  try {
    const base = req.query.base || "USD";
    const quote = req.query.quote || "PKR";
    const rec = await prisma.fxRate.findFirst({
      where: { base, quote },
      orderBy: { asOf: "desc" },
    });
    if (!rec) return res.status(404).json({ error: "No rate found" });
    res.json(rec);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load rate" });
  }
});

// POST /api/fx  { base, quote, rate, asOf?, source? }
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { base, quote, rate, asOf, source } = req.body || {};
    if (!base || !quote || !Number(rate)) {
      return res.status(400).json({ error: "base, quote, rate required" });
    }
    const created = await prisma.fxRate.create({
      data: {
        base,
        quote,
        rate: Number(rate),
        asOf: asOf ? new Date(asOf) : new Date(),
        source: source ?? null,
      },
    });
    res.status(201).json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create rate" });
  }
});

// GET /api/fx  list recent rates
router.get("/", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  try {
    const rates = await prisma.fxRate.findMany({
      orderBy: { asOf: "desc" },
      take: 200,
    });
    res.json({ rates });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list rates" });
  }
});

export default router;
