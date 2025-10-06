-- Add comprehensive field verification fields to FieldReview model
ALTER TABLE "field_reviews" ADD COLUMN     "homeVisitDate" TIMESTAMP(3);
ALTER TABLE "field_reviews" ADD COLUMN     "homeVisitNotes" TEXT;
ALTER TABLE "field_reviews" ADD COLUMN     "familyInterviewNotes" TEXT;
ALTER TABLE "field_reviews" ADD COLUMN     "financialVerificationNotes" TEXT;
ALTER TABLE "field_reviews" ADD COLUMN     "characterAssessment" TEXT;
ALTER TABLE "field_reviews" ADD COLUMN     "deservingnessFactor" INTEGER; -- 1-10 scale
ALTER TABLE "field_reviews" ADD COLUMN     "documentsVerified" BOOLEAN DEFAULT false;
ALTER TABLE "field_reviews" ADD COLUMN     "identityVerified" BOOLEAN DEFAULT false;
ALTER TABLE "field_reviews" ADD COLUMN     "familyIncomeVerified" BOOLEAN DEFAULT false;
ALTER TABLE "field_reviews" ADD COLUMN     "educationVerified" BOOLEAN DEFAULT false;
ALTER TABLE "field_reviews" ADD COLUMN     "recommendationReason" TEXT;
ALTER TABLE "field_reviews" ADD COLUMN     "additionalDocumentsRequested" TEXT[];
ALTER TABLE "field_reviews" ADD COLUMN     "riskFactors" TEXT[];
ALTER TABLE "field_reviews" ADD COLUMN     "verificationScore" INTEGER; -- Overall score 1-100
ALTER TABLE "field_reviews" ADD COLUMN     "fielderRecommendation" TEXT; -- STRONGLY_APPROVE | APPROVE | CONDITIONAL | REJECT
ALTER TABLE "field_reviews" ADD COLUMN     "adminNotesRequired" TEXT; -- What admin should pay attention to