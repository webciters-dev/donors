-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'FIELD_OFFICER';

-- CreateTable
CREATE TABLE "field_reviews" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "officerUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "recommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "field_reviews_applicationId_idx" ON "field_reviews"("applicationId");

-- CreateIndex
CREATE INDEX "field_reviews_studentId_idx" ON "field_reviews"("studentId");

-- CreateIndex
CREATE INDEX "field_reviews_officerUserId_idx" ON "field_reviews"("officerUserId");

-- AddForeignKey
ALTER TABLE "field_reviews" ADD CONSTRAINT "field_reviews_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_reviews" ADD CONSTRAINT "field_reviews_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_reviews" ADD CONSTRAINT "field_reviews_officerUserId_fkey" FOREIGN KEY ("officerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
