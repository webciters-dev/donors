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
    gpa: z
      .coerce.number({ invalid_type_error: "GPA must be a number" })
      .min(0, "GPA must be between 0.00 and 4.00")
      .max(4, "GPA must be between 0.00 and 4.00"),
    gradYear: z
      .coerce.number({ invalid_type_error: "Graduation year must be a number" })
      .int("Graduation year must be an integer")
      .min(THIS_YEAR - 1, `Enter a valid graduation year (${THIS_YEAR - 1}–${THIS_YEAR + 10})`)
      .max(THIS_YEAR + 10, `Enter a valid graduation year (${THIS_YEAR - 1}–${THIS_YEAR + 10})`),
    // Current Education fields
    currentInstitution: z.string().min(1, "Current institution is required"),
    currentCity: z.string().min(1, "Current institution city is required"),
    currentCompletionYear: z
      .coerce.number({ invalid_type_error: "Current completion year must be a number" })
      .int("Current completion year must be an integer")
      .min(THIS_YEAR - 10, `Enter a valid completion year (${THIS_YEAR - 10}–${THIS_YEAR + 5})`)
      .max(THIS_YEAR + 5, `Enter a valid completion year (${THIS_YEAR - 10}–${THIS_YEAR + 5})`),
    // Personal Introduction
    personalIntroduction: z.string().max(1000, "Personal introduction must be 1000 characters or less").optional(),
    // Enhanced details for donors
    familySize: z.coerce.number().min(1).max(20).optional(),
    parentsOccupation: z.string().max(200).optional(),
    monthlyFamilyIncome: z.string().max(50).optional(),
    careerGoals: z.string().max(500).optional(),
    academicAchievements: z.string().max(300).optional(),
    communityInvolvement: z.string().max(300).optional(),
    specificField: z.string().max(200).optional(),
  })
  .required()
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
  );
