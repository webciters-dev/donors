// src/schemas/studentProfile.schema.js
import { z } from "zod";

const PK_PHONE = /^(?:\+92|0)?3\d{9}$/;       // +923xxxxxxxxx or 03xxxxxxxxx
const PK_CNIC  = /^\d{5}-\d{7}-\d{1}$/;       // 12345-1234567-1

// helper: DOB must make the user at least X years old
const minAge = (years) =>
  z.string().refine((iso) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    const cutoff = new Date(now.getFullYear() - years, now.getMonth(), now.getDate());
    return d <= cutoff;
  }, { message: `You must be at least ${years} years old.` });

export const studentProfileSchema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(PK_PHONE, "Use +923xxxxxxxxx or 03xxxxxxxxx"),
  cnic: z.string().regex(PK_CNIC, "Format: 12345-1234567-1"),
  dateOfBirth: minAge(13),
  address: z.string().min(5, "Required"),
  city: z.string().min(2, "Required"),
  schoolName: z.string().min(2, "Required"),
  gradeLevel: z.string().min(1, "Required"),
  householdIncomePKR: z.coerce.number().min(0).max(50000000, "Unusually high"),
  dependents: z.coerce.number().int().min(0).max(20),

  // Optional uploads with basic file checks
  incomeProof: z
    .any()
    .optional()
    .refine(
      (f) =>
        !f ||
        (typeof f === "object" &&
          f.type &&
          ["application/pdf", "image/jpeg", "image/png"].includes(f.type) &&
          f.size <= 5 * 1024 * 1024),
      "PDF/JPG/PNG up to 5MB"
    ),
  photo: z
    .any()
    .optional()
    .refine(
      (f) =>
        !f ||
        (typeof f === "object" &&
          f.type &&
          ["image/jpeg", "image/png"].includes(f.type) &&
          f.size <= 3 * 1024 * 1024),
      "JPG/PNG up to 3MB"
    ),
  
  // Introduction video validation (60-90 seconds, max 100MB)
  introVideo: z
    .any()
    .optional()
    .refine(
      (f) =>
        !f ||
        (typeof f === "object" &&
          f.type &&
          ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"].includes(f.type) &&
          f.size <= 100 * 1024 * 1024), // 100MB limit
      "MP4/MOV/AVI/WebM up to 100MB"
    ),
});
