-- AlterTable
ALTER TABLE "students" ADD COLUMN     "photoOriginalName" TEXT,
ADD COLUMN     "photoThumbnailUrl" TEXT,
ADD COLUMN     "photoUploadedAt" TIMESTAMP(3),
ADD COLUMN     "photoUrl" TEXT;
