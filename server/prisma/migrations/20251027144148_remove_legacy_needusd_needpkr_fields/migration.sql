/*
  Warnings:

  - You are about to drop the column `needPKR` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `needUSD` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `needUSD` on the `students` table. All the data in the column will be lost.
  - Made the column `currency` on table `applications` required. This step will fail if there are existing NULL values in that column.
  - Made the column `amount` on table `applications` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "applications" DROP COLUMN "needPKR",
DROP COLUMN "needUSD",
ALTER COLUMN "currency" SET NOT NULL,
ALTER COLUMN "amount" SET NOT NULL;

-- AlterTable
ALTER TABLE "students" DROP COLUMN "needUSD";
