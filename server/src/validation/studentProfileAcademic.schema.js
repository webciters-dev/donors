// server/src/validation/studentProfileAcademic.schema.js
import { z } from "zod";

const CNIC_REGEX = /^\d{5}-\d{7}-\d{1}$/;
const THIS_YEAR = new Date().getFullYear();

function digitsLenOk(v, min, max) {
  const d = String(v || "").replace(/\D+/g, "");
  return d.length >= min && d.length <= max;
}

export const studentProfileAcademicSchema = z
  .object({
    cnic: z.string().regex(CNIC_REGEX, "CNIC must be #####-#######-#"),
    dateOfBirth: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true; // optional
        const d = new Date(val);
        if (isNaN(d.getTime())) return false;
        const now = new Date();
        const cutoff = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());
        return d <= cutoff;
      }, "Invalid date or age must be ≥ 13"),
    guardianName: z.string().min(1, "Guardian name is required"),
    guardianCnic: z.string().regex(CNIC_REGEX, "Guardian CNIC must be #####-#######-#"),
    phone: z.string().optional().refine((v) => !v || digitsLenOk(v, 10, 15), "Enter a valid phone (10–15 digits)"),
    guardianPhone1: z
      .string()
      .optional()
      .refine((v) => !v || digitsLenOk(v, 10, 15), "Enter a valid guardian phone (10–15 digits)"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    province: z.string().min(1, "Province is required"),
    university: z.string().min(1, "University is required"),
    program: z.string().min(1, "Program is required"),
    gradeType: z.enum(["CGPA", "PERCENTAGE"]).optional().default("CGPA"),
    gpa: z
      .coerce.number({ invalid_type_error: "GPA must be a number" })
      .min(0, "GPA must be a positive number"),
    gradYear: z
      .coerce.number({ invalid_type_error: "Graduation year must be a number" })
      .int("Graduation year must be an integer")
      .min(THIS_YEAR - 1, `Enter a valid graduation year (${THIS_YEAR - 1}–${THIS_YEAR + 10})`)
      .max(THIS_YEAR + 10, `Enter a valid graduation year (${THIS_YEAR - 1}–${THIS_YEAR + 10})`),
    // Previous Academic Records - array format
    previousAcademicRecords: z
      .array(
        z.object({
          institution: z.string().min(1, "Institution is required"),
          city: z.string().min(1, "City is required"),
          completionYear: z
            .coerce.number({
              invalid_type_error: "Completion year must be a number",
            })
            .int("Completion year must be an integer")
            .min(THIS_YEAR - 10, `Enter a valid completion year (${THIS_YEAR - 10}–${THIS_YEAR + 5})`)
            .max(THIS_YEAR + 5, `Enter a valid completion year (${THIS_YEAR - 10}–${THIS_YEAR + 5})`),
          program: z.string().optional(),
          educationBoard: z.string().optional(),
          totalMarks: z.coerce.number().min(0).optional(),
          obtainedMarks: z.coerce.number().min(0).optional(),
          gradeType: z.enum(["%", "CGPA", "Grade"]).optional(),
          gradeValue: z.union([z.string(), z.coerce.number()]).optional(),
        })
      )
      .min(1, "At least one previous academic record is required")
      .optional(),
    // Legacy fields for backward compatibility (optional)
    // These fields are not used in the new form - accept anything or nothing
    currentInstitution: z.any().optional(),
    currentCity: z.any().optional(),
    currentCompletionYear: z.any().optional(),
    // Personal Introduction
    personalIntroduction: z.string().max(1000, "Personal introduction must be 1000 characters or less").optional(),
    // Enhanced details for donors
    familySize: z.preprocess(
      (val) => {
        if (val === "" || val === null || val === undefined) return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      },
      z.number().min(1).max(20).optional()
    ),
    parentsOccupation: z.string().max(200).optional(),
    monthlyFamilyIncome: z.string().max(50).optional(),
    careerGoals: z.string().max(500).optional(),
    academicAchievements: z.string().max(300).optional(),
    communityInvolvement: z.string().max(300).optional(),
    specificField: z.string().max(200).optional(),
    // Social Media fields (all optional)
    facebookUrl: z
      .string()
      .optional()
      .refine((v) => !v || v.match(/^https?:\/\/(www\.)?(facebook|fb)\.com\/.+/i), "Enter a valid Facebook profile URL"),
    instagramHandle: z
      .string()
      .optional()
      .refine((v) => !v || v.match(/^@[a-zA-Z0-9._]{1,30}$/), "Enter a valid Instagram handle (@username)"),
    whatsappNumber: z
      .string()
      .optional()
      .refine((v) => !v || digitsLenOk(v, 10, 15), "Enter a valid WhatsApp number (10–15 digits)"),
    linkedinUrl: z
      .string()
      .optional()
      .refine((v) => !v || v.match(/^https?:\/\/(www\.)?linkedin\.com\/in\/.+/i), "Enter a valid LinkedIn profile URL"),
    twitterHandle: z
      .string()
      .optional()
      .refine((v) => !v || v.match(/^@[a-zA-Z0-9_]{1,15}$/), "Enter a valid Twitter/X handle (@username)"),
    tiktokHandle: z
      .string()
      .optional()
      .refine((v) => !v || v.match(/^@[a-zA-Z0-9._]{1,24}$/), "Enter a valid TikTok handle (@username)"),
    // Photo fields (optional in validation - required at application level)
    photoUrl: z.string().optional().nullable(),
    photoThumbnailUrl: z.string().optional().nullable(),
    photoUploadedAt: z.string().optional().nullable(),
    photoOriginalName: z.string().optional().nullable(),
    // Video fields (all optional - will be made required later)
    introVideoUrl: z.string().optional().nullable(),
    introVideoThumbnailUrl: z.string().optional().nullable(),
    introVideoUploadedAt: z.string().optional().nullable(),
    introVideoDuration: z.preprocess(
      (val) => {
        if (val === "" || val === null || val === undefined || isNaN(Number(val))) return undefined;
        return Number(val);
      },
      z.number().optional()
    ),
    introVideoOriginalName: z.string().optional().nullable(),
  })
  .partial({
    // Make video fields truly optional (not affected by .required())
    introVideoUrl: true,
    introVideoThumbnailUrl: true,
    introVideoUploadedAt: true,
    introVideoDuration: true,
    introVideoOriginalName: true,
    // Photo fields optional at profile update level (required at application submission)
    photoUrl: true,
    photoThumbnailUrl: true,
    photoUploadedAt: true,
    photoOriginalName: true,
    // Social media also optional
    facebookUrl: true,
    instagramHandle: true,
    whatsappNumber: true,
    linkedinUrl: true,
    twitterHandle: true,
    tiktokHandle: true,
  })
  .refine(
    (data) => {
      // At least one phone number must be provided
      const hasStudentPhone = data.phone && data.phone.trim();
      const hasGuardianPhone1 = data.guardianPhone1 && data.guardianPhone1.trim();
      return hasStudentPhone || hasGuardianPhone1;
    },
    {
      message: "At least one phone number is required (Student or Guardian)",
      path: ["phone"],
    }
  )
  .refine(
    (data) => {
      // Validate GPA based on gradeType
      const gradeType = data.gradeType || "CGPA";
      const gpa = data.gpa;
      
      if (gpa === null || gpa === undefined || isNaN(gpa)) return true; // Optional field
      
      if (gradeType === "PERCENTAGE") {
        return gpa >= 0 && gpa <= 100;
      } else {
        // CGPA (default)
        return gpa >= 0 && gpa <= 4.00;
      }
    },
    (data) => {
      const gradeType = data.gradeType || "CGPA";
      if (gradeType === "PERCENTAGE") {
        return {
          message: "Percentage must be between 0 and 100",
          path: ["gpa"],
        };
      } else {
        return {
          message: "CGPA must be between 0.00 and 4.00",
          path: ["gpa"],
        };
      }
    }
  );
