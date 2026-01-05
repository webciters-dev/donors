// src/schemas/studentProfileAcademic.schema.js
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
        const cutoff = new Date(
          now.getFullYear() - 13,
          now.getMonth(),
          now.getDate()
        );
        return d <= cutoff;
      }, "Invalid date or age must be ≥ 13"),
    guardianName: z.string().min(1, "Guardian name is required"),
    guardianCnic: z
      .string()
      .regex(CNIC_REGEX, "Guardian CNIC must be #####-#######-#"),
    guardian2Name: z.string().optional(),
    guardian2Cnic: z
      .string()
      .optional()
      .refine((v) => !v || CNIC_REGEX.test(v), "Second Guardian CNIC must be #####-#######-#"),
    phone: z
      .string()
      .optional()
      .refine((v) => !v || digitsLenOk(v, 10, 15), "Enter a valid phone (10–15 digits)"),
    guardianPhone1: z
      .string()
      .optional()
      .refine((v) => !v || digitsLenOk(v, 10, 15), "Enter a valid guardian phone (10–15 digits)"),
    guardianPhone2: z
      .string()
      .optional()
      .refine((v) => !v || digitsLenOk(v, 10, 15), "Enter a valid guardian phone (10–15 digits)"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    province: z.string().min(1, "Province is required"),
    university: z.string().min(1, "University is required"),
    field: z.string().min(1, "Field of study is required"),
    degreeLevel: z.string().optional(),
    program: z.string().min(1, "Program is required"),
    gpa: z
      .coerce.number({
        invalid_type_error: "CGPA/Percentage must be a number",
      })
      .min(0, "CGPA/Percentage must be between 0 and 100")
      .max(100, "CGPA/Percentage must be between 0 and 100 (use CGPA 0-4 or Percentage 0-100)"),
    gradYear: z
      .coerce.number({
        invalid_type_error: "Graduation year must be a number",
      })
      .int("Graduation year must be an integer")
      .min(THIS_YEAR - 1, `Enter a valid graduation year (${THIS_YEAR - 1}–${THIS_YEAR + 10})`)
      .max(THIS_YEAR + 10, `Enter a valid graduation year (${THIS_YEAR - 1}–${THIS_YEAR + 10})`),
    // Current Education fields
    currentInstitution: z.string().min(1, "Current institution is required"),
    currentCity: z.string().min(1, "Current institution city is required"),
    currentCompletionYear: z
      .coerce.number({
        invalid_type_error: "Current completion year must be a number",
      })
      .int("Current completion year must be an integer")
      .min(THIS_YEAR - 10, `Enter a valid completion year (${THIS_YEAR - 10}–${THIS_YEAR + 5})`)
      .max(THIS_YEAR + 5, `Enter a valid completion year (${THIS_YEAR - 10}–${THIS_YEAR + 5})`),
    // Personal Introduction
    personalIntroduction: z.string().min(1, "Personal introduction is required").max(1000, "Personal introduction must be 1000 characters or less"),
    // Enhanced details for donors
    familySize: z.coerce.number().min(1).max(20).optional(),
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
  })
  // keep the exact REQUIRED_KEYS logic consistent: all are required (except dateOfBirth)
  .required()
  .refine(
    (data) => {
      // At least one phone number must be provided
      const hasStudentPhone = data.phone && data.phone.trim();
      const hasGuardianPhone1 = data.guardianPhone1 && data.guardianPhone1.trim();
      const hasGuardianPhone2 = data.guardianPhone2 && data.guardianPhone2.trim();
      return hasStudentPhone || hasGuardianPhone1 || hasGuardianPhone2;
    },
    {
      message: "At least one phone number is required (Student, Guardian 1, or Guardian 2)",
      path: ["phone"], // This will show the error on the phone field
    }
  );
