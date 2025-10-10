// src/lib/profileValidation.js
import { studentProfileAcademicSchema } from "@/schemas/studentProfileAcademic.schema";

const REQUIRED_KEYS = [
  "cnic",
  "guardianName", 
  "guardianCnic",
  "phone",
  "address",
  "city",
  "province",
  "university",
  "program",
  "gpa",
  "gradYear",
];

/**
 * Calculate profile completion percentage and missing fields
 * @param {object} profile - Student profile data
 * @returns {object} - { percent: number, missing: string[], isComplete: boolean, validationErrors: object }
 */
export function calculateProfileCompleteness(profile = {}) {
  const missing = REQUIRED_KEYS.filter((key) => {
    const value = profile?.[key];
    return value === null || value === undefined || value === "" || Number.isNaN(value);
  });

  const filled = REQUIRED_KEYS.length - missing.length;
  const percent = Math.round((filled / REQUIRED_KEYS.length) * 100);
  const isComplete = percent === 100;

  // Also validate with schema for additional validation errors
  const validationResult = studentProfileAcademicSchema.safeParse(profile);
  const validationErrors = {};
  
  if (!validationResult.success) {
    for (const issue of validationResult.error.issues) {
      const key = issue.path?.[0];
      if (key && !validationErrors[key]) {
        validationErrors[key] = issue.message;
      }
    }
  }

  return {
    percent,
    missing,
    isComplete,
    validationErrors,
    hasValidationErrors: Object.keys(validationErrors).length > 0
  };
}

/**
 * Get human-readable field names for missing fields
 * @param {string[]} missingFields - Array of missing field keys
 * @returns {string[]} - Array of human-readable field names
 */
export function getReadableFieldNames(missingFields = []) {
  const fieldNameMap = {
    cnic: "CNIC",
    guardianName: "Guardian Name",
    guardianCnic: "Guardian CNIC", 
    phone: "Phone Number",
    address: "Address",
    city: "City",
    province: "Province",
    university: "University",
    program: "Program",
    gpa: "GPA",
    gradYear: "Graduation Year"
  };

  return missingFields.map(field => fieldNameMap[field] || field);
}

/**
 * Generate a user-friendly completion message
 * @param {object} completeness - Result from calculateProfileCompleteness
 * @returns {string} - User-friendly message
 */
export function getCompletionMessage(completeness) {
  if (completeness.isComplete && !completeness.hasValidationErrors) {
    return "Profile is complete! You can now submit your application for review.";
  }

  const messages = [];
  
  if (completeness.missing.length > 0) {
    const readableFields = getReadableFieldNames(completeness.missing);
    messages.push(`Missing: ${readableFields.join(", ")}`);
  }

  if (completeness.hasValidationErrors) {
    const errorFields = Object.keys(completeness.validationErrors);
    const readableErrorFields = getReadableFieldNames(errorFields);
    messages.push(`Please fix: ${readableErrorFields.join(", ")}`);
  }

  return messages.join(". ");
}

/**
 * Check if profile is ready for application submission
 * @param {object} profile - Student profile data
 * @returns {boolean} - True if profile is complete and valid
 */
export function isProfileReadyForSubmission(profile = {}) {
  const completeness = calculateProfileCompleteness(profile);
  return completeness.isComplete && !completeness.hasValidationErrors;
}