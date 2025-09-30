import prisma from "../prismaClient.js";

// Default base currency for normalization
export const BASE_CURRENCY = "USD";

/**
 * Get the latest FxRate record for a base->quote pair.
 * Returns { rate, asOf } or null if not found.
 */
export async function getLatestRate(base, quote) {
  if (!base || !quote) return null;
  const rec = await prisma.fxRate.findFirst({
    where: { base, quote },
    orderBy: { asOf: "desc" },
  });
  if (!rec) return null;
  return { rate: rec.rate, asOf: rec.asOf };
}

/**
 * Convert an integer amount from srcCurrency to destCurrency using latest rates.
 * Only supports conversions that go through BASE_CURRENCY when needed.
 * Returns an object { amount: Int, rate: Float, asOf: Date } or null.
 */
export async function convertAmount(amount, srcCurrency, destCurrency) {
  const n = Math.floor(Number(amount || 0));
  if (!Number.isFinite(n)) return null;
  if (!srcCurrency || !destCurrency) return null;
  if (srcCurrency === destCurrency) {
    return { amount: n, rate: 1, asOf: new Date() };
  }

  // direct rate
  const direct = await getLatestRate(srcCurrency, destCurrency);
  if (direct) {
    return { amount: Math.round(n * Number(direct.rate)), rate: Number(direct.rate), asOf: direct.asOf };
  }

  // try via base USD: src->USD then USD->dest
  const toBase = await getLatestRate(srcCurrency, BASE_CURRENCY);
  const fromBase = await getLatestRate(BASE_CURRENCY, destCurrency);
  if (toBase && fromBase) {
    const rate = Number(toBase.rate) * Number(fromBase.rate);
    const asOf = new Date(Math.min(new Date(toBase.asOf).getTime(), new Date(fromBase.asOf).getTime()));
    return { amount: Math.round(n * rate), rate, asOf };
  }
  return null;
}

/**
 * Build snapshot fields for original -> base USD mapping.
 * Returns an object with nullable fields to be spread into Prisma create/update.
 */
export async function buildSnapshot(amount, currency) {
  const n = amount != null ? Math.floor(Number(amount)) : null;
  const cur = currency || null;
  if (n == null || !cur) {
    return {
      amountOriginal: null,
      currencyOriginal: cur,
      amountBaseUSD: null,
      baseCurrency: BASE_CURRENCY,
      fxRateToUSD: null,
      fxAsOf: null,
    };
  }
  if (cur === BASE_CURRENCY) {
    return {
      amountOriginal: n,
      currencyOriginal: cur,
      amountBaseUSD: n,
      baseCurrency: BASE_CURRENCY,
      fxRateToUSD: 1,
      fxAsOf: new Date(),
    };
  }
  const r = await getLatestRate(cur, BASE_CURRENCY);
  if (!r) {
    return {
      amountOriginal: n,
      currencyOriginal: cur,
      amountBaseUSD: null,
      baseCurrency: BASE_CURRENCY,
      fxRateToUSD: null,
      fxAsOf: null,
    };
  }
  return {
    amountOriginal: n,
    currencyOriginal: cur,
    amountBaseUSD: Math.round(n * Number(r.rate)),
    baseCurrency: BASE_CURRENCY,
    fxRateToUSD: Number(r.rate),
    fxAsOf: r.asOf,
  };
}
