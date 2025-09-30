-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'PKR');

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "currency" "Currency",
ADD COLUMN     "needPKR" INTEGER;
