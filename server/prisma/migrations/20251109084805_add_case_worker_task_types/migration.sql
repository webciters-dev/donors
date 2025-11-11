-- CreateEnum
CREATE TYPE "CaseWorkerTaskType" AS ENUM ('DOCUMENT_REVIEW', 'FIELD_VISIT', 'CNIC_VERIFICATION');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'CASE_WORKER';

-- AlterTable
ALTER TABLE "field_reviews" ADD COLUMN     "taskType" "CaseWorkerTaskType";

-- CreateIndex
CREATE INDEX "field_reviews_taskType_idx" ON "field_reviews"("taskType");
