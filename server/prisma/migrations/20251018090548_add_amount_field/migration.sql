-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "amount" INTEGER,
ALTER COLUMN "needUSD" DROP NOT NULL;
