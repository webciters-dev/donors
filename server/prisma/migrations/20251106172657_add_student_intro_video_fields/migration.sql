-- AlterTable
ALTER TABLE "students" ADD COLUMN     "introVideoDuration" INTEGER,
ADD COLUMN     "introVideoOriginalName" TEXT,
ADD COLUMN     "introVideoThumbnailUrl" TEXT,
ADD COLUMN     "introVideoUploadedAt" TIMESTAMP(3),
ADD COLUMN     "introVideoUrl" TEXT;
