-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CNIC', 'GUARDIAN_CNIC', 'PHOTO', 'SSC_RESULT', 'HSSC_RESULT', 'UNIVERSITY_CARD', 'FEE_INVOICE', 'INCOME_CERTIFICATE', 'UTILITY_BILL', 'OTHER');

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "familyContribution" INTEGER,
ADD COLUMN     "familyIncome" INTEGER,
ADD COLUMN     "hostelFee" INTEGER,
ADD COLUMN     "otherExpenses" INTEGER,
ADD COLUMN     "purpose" TEXT,
ADD COLUMN     "tuitionFee" INTEGER;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "address" TEXT,
ADD COLUMN     "cnic" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "guardianCnic" TEXT,
ADD COLUMN     "guardianName" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "applicationId" TEXT,
    "type" "DocumentType" NOT NULL,
    "url" TEXT NOT NULL,
    "originalName" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documents_studentId_idx" ON "documents"("studentId");

-- CreateIndex
CREATE INDEX "documents_applicationId_idx" ON "documents"("applicationId");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
