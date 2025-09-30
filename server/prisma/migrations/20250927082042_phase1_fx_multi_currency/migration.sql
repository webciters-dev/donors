-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "amountBaseUSD" INTEGER,
ADD COLUMN     "amountOriginal" INTEGER,
ADD COLUMN     "baseCurrency" "Currency" DEFAULT 'USD',
ADD COLUMN     "currencyOriginal" "Currency",
ADD COLUMN     "fxAsOf" TIMESTAMP(3),
ADD COLUMN     "fxRateToUSD" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "disbursements" ADD COLUMN     "amountBaseUSD" INTEGER,
ADD COLUMN     "amountOriginal" INTEGER,
ADD COLUMN     "baseCurrency" "Currency" DEFAULT 'USD',
ADD COLUMN     "currencyOriginal" "Currency",
ADD COLUMN     "fxAsOf" TIMESTAMP(3),
ADD COLUMN     "fxRateToUSD" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "donors" ADD COLUMN     "address" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "currencyPreference" "Currency";

-- AlterTable
ALTER TABLE "sponsorships" ADD COLUMN     "amountBaseUSD" INTEGER,
ADD COLUMN     "amountOriginal" INTEGER,
ADD COLUMN     "baseCurrency" "Currency" DEFAULT 'USD',
ADD COLUMN     "currencyOriginal" "Currency",
ADD COLUMN     "fxAsOf" TIMESTAMP(3),
ADD COLUMN     "fxRateToUSD" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "fx_rates" (
    "id" TEXT NOT NULL,
    "base" "Currency" NOT NULL,
    "quote" "Currency" NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,

    CONSTRAINT "fx_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fx_rates_base_quote_asOf_key" ON "fx_rates"("base", "quote", "asOf");
