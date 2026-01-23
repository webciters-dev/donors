// src/lib/profileValidation.js
import { studentProfileAcademicSchema } from "@/schemas/studentProfileAcademic.schema";

// Required documents for application completion
const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "FEE_INVOICE", "SSC_RESULT", "HSSC_RESULT", "INCOME_CERTIFICATE", "UTILITY_BILL"];

const REQUIRED_KEYS = [
  "cnic",
  "guardianName", 
  "guardianCnic",
  // Note: phone validation is now handled by schema refinement (at least one phone required)
  "address",
  "city",
  "province",
  "university",
  "program",
  "gpa",
  "gradYear",
  // Note: previousAcademicRecords is checked separately (array format)
];

/**
 * Check if previousAcademicRecords has at least one complete record
 * @param {array} records - Previous academic records array
 * @returns {boolean} - True if at least one record has required fields
 */
function hasPreviousAcademicRecord(records) {
  if (!records || !Array.isArray(records) || records.length === 0) {
    return false;
  }
  // Check if at least one record has the required fields filled
  return records.some(record => 
    record.institution && record.institution.trim() !== "" &&
    record.city && record.city.trim() !== "" &&
    record.completionYear && record.completionYear !== ""
  );
}

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

  // Check for previous academic records (new array format)
  // Also support legacy fields for backward compatibility
  const hasPrevEducation = hasPreviousAcademicRecord(profile?.previousAcademicRecords) ||
    (profile?.currentInstitution && profile?.currentCity && profile?.currentCompletionYear);
  
  if (!hasPrevEducation) {
    missing.push("previousEducation");
  }

  const totalRequired = REQUIRED_KEYS.length + 1; // +1 for previousEducation
  const filled = totalRequired - missing.length;
  const percent = Math.round((filled / totalRequired) * 100);
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
 * Calculate overall completion percentage including both profile and documents
 * @param {object} profile - Student profile data
 * @param {array} uploadedDocs - Array of uploaded documents with type field
 * @returns {object} - { percent: number, profilePercent: number, docPercent: number, missing: string[], missingDocs: string[], isComplete: boolean }
 */
export function calculateOverallCompleteness(profile = {}, uploadedDocs = []) {
  // Calculate profile completion
  const profileCompletion = calculateProfileCompleteness(profile);
  
  // Calculate document completion
  const uploadedTypes = new Set(uploadedDocs.map(doc => doc.type));
  const missingDocs = REQUIRED_DOCS.filter(docType => !uploadedTypes.has(docType));
  const completedDocs = REQUIRED_DOCS.length - missingDocs.length;
  const docPercent = Math.round((completedDocs / REQUIRED_DOCS.length) * 100);
  
  // Calculate overall completion (equal weight to profile and docs)
  const overallPercent = Math.round((profileCompletion.percent + docPercent) / 2);
  const isComplete = profileCompletion.isComplete && docPercent === 100;
  
  return {
    percent: overallPercent,
    profilePercent: profileCompletion.percent,
    docPercent,
    missing: profileCompletion.missing,
    missingDocs,
    isComplete,
    hasValidationErrors: profileCompletion.hasValidationErrors,
    validationErrors: profileCompletion.validationErrors
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
    gradYear: "Graduation Year",
    // Previous Academic Record
    previousEducation: "Previous Education Record",
    // Legacy fields (for backward compatibility)
    currentInstitution: "Previous Institution",
    currentCity: "Previous Institution City",
    currentCompletionYear: "Completion Year"
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