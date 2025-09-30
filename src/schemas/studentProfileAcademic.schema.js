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
    phone: z
      .string()
      .refine((v) => digitsLenOk(v, 10, 15), "Enter a valid phone (10–15 digits)"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    province: z.string().min(1, "Province is required"),
    university: z.string().min(1, "University is required"),
    program: z.string().min(1, "Program is required"),
    gpa: z
      .coerce.number({
        invalid_type_error: "GPA must be a number",
      })
      .min(0, "GPA must be between 0.00 and 4.00")
      .max(4, "GPA must be between 0.00 and 4.00"),
    gradYear: z
      .coerce.number({
        invalid_type_error: "Graduation year must be a number",
      })
      .int("Graduation year must be an integer")
      .min(THIS_YEAR - 1, `Enter a valid graduation year (${THIS_YEAR - 1}–${THIS_YEAR + 10})`)
      .max(THIS_YEAR + 10, `Enter a valid graduation year (${THIS_YEAR - 1}–${THIS_YEAR + 10})`),
  })
  // keep the exact REQUIRED_KEYS logic consistent: all are required (except dateOfBirth)
  .required();
