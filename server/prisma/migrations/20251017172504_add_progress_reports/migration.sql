-- CreateEnum
CREATE TYPE "ProgressReportStatus" AS ENUM ('SUBMITTED', 'REVIEWED', 'APPROVED', 'NEEDS_REVISION');

-- CreateTable
CREATE TABLE "progress_reports" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ProgressReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,

    CONSTRAINT "progress_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_report_attachments" (
    "id" TEXT NOT NULL,
    "progressReportId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_report_attachments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "progress_reports" ADD CONSTRAINT "progress_reports_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_report_attachments" ADD CONSTRAINT "progress_report_attachments_progressReportId_fkey" FOREIGN KEY ("progressReportId") REFERENCES "progress_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
