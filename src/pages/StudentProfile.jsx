// src/pages/StudentProfile.jsx
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { useUniversityAcademics } from '@/hooks/useUniversityAcademics';
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { studentProfileAcademicSchema } from "@/schemas/studentProfileAcademic.schema";
import { 
  calculateProfileCompleteness, 
  calculateOverallCompleteness,
  getCompletionMessage, 
  isProfileReadyForSubmission 
} from "@/lib/profileValidation";
import { API } from "@/lib/api";
import { filterCountryList, getFilterMessage } from "@/lib/countryFilter";
import UniversitySelector from "@/components/UniversitySelector";
import VideoUploader from "@/components/VideoUploader";
import PhotoUpload from "@/components/PhotoUpload";
import StudentPhoto from "@/components/StudentPhoto";

// Helpers
function onlyDigits(s = "") {
  return String(s).replace(/\D+/g, "");
}
function formatCNIC(raw = "") {
  // #####-#######-#
  const d = onlyDigits(raw).slice(0, 13);
  const a = d.slice(0, 5);
  const b = d.slice(5, 12);
  const c = d.slice(12);
  let out = a;
  if (b) out += `-${b}`;
  if (c) out += `-${c}`;
  return out;
}

// Helper function to derive degree level from program name
const deriveDegreeLevel = (program) => {
  if (!program) return "";
  
  const programLower = program.toLowerCase();
  
  if (programLower.includes('phd') || programLower.includes('doctorate') || programLower.includes('doctoral')) {
    return "PhD";
  }
  if (programLower.includes('master') || programLower.includes("master's") || programLower.includes('ms ') || programLower.includes('msc') || programLower.includes('ma ') || programLower.includes('mba')) {
    return "Master's Degree";
  }
  if (programLower.includes('bachelor') || programLower.includes("bachelor's") || programLower.includes('bs ') || programLower.includes('bsc') || programLower.includes('ba ') || programLower.includes('be ') || programLower.includes('btech')) {
    return "Bachelor's Degree";
  }
  if (programLower.includes('associate')) {
    return "Associate";
  }
  if (programLower.includes('diploma')) {
    return "Diploma";
  }
  if (programLower.includes('certificate')) {
    return "Certificate";
  }
  
  return ""; // If we can't determine, leave empty
};

export default function StudentProfile() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const authHeader = useMemo(() => 
    token ? { Authorization: `Bearer ${token}` } : undefined,
    [token]
  );

  // Initialize form state FIRST (before any useEffect that uses it)
  const [form, setForm] = useState({
    cnic: "",
    dateOfBirth: "",
    guardianName: "",
    guardianCnic: "",
    phone: "",
    guardianPhone1: "",
    address: "",
    city: "",
    province: "",
    // Photo fields
    photoUrl: "",
    photoThumbnailUrl: "",
    photoUploadedAt: null,
    // Previous Academic Record fields - now an array to support multiple records
    previousAcademicRecords: [
      {
        institution: "",
        city: "",
        completionYear: "",
        program: "",
        educationBoard: "",
        totalMarks: "",
        obtainedMarks: "",
        gradeType: "%", // %/CGPA/Grade
        gradeValue: ""
      }
    ],
    // Future Education fields
    country: "Pakistan", // Default to Pakistan for existing users
    university: "",
    customUniversity: "",
    field: "", // Add the missing field
    customFieldOfStudy: "", // Custom field value when "Other" is selected (matches Prisma schema)
    degreeLevel: "", // Add degree level field
    customDegreeLevel: "", // Custom degree level value when "Other" is selected
    program: "",
    customProgram: "", // Custom program value when "Other" is selected
    gradeType: "CGPA", // Default to CGPA
    gpa: "",
    gradYear: "",
    // Personal Introduction
    personalIntroduction: "",
    // Enhanced Details for Donors
    familySize: "",
    parentsOccupation: "",
    monthlyFamilyIncome: "",
    careerGoals: "",
    academicAchievements: "",
    communityInvolvement: "",
    specificField: "",
    // Social Media Fields
    facebookUrl: "",
    instagramHandle: "",
    whatsappNumber: "",
    linkedinUrl: "",
    twitterHandle: "",
    tiktokHandle: "",
    // Introduction Video Fields
    introVideoUrl: "",
    introVideoThumbnailUrl: "",
    introVideoUploadedAt: null,
    introVideoDuration: null,
    // Video upload handling
    selectedVideoFile: null,
    videoMetadata: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [documents, setDocuments] = useState([]);
  const [isProfileLocked, setIsProfileLocked] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  // University academics hook for dropdowns
  const [selectedUniversityId, setSelectedUniversityId] = useState(null);
  const {
    degreeLevels,
    fields: availableFields,
    programs: availablePrograms,
    loading: academicLoading,
    error: academicError,
    fetchFields,
    fetchPrograms
  } = useUniversityAcademics(selectedUniversityId);

  // NOW we can use useEffect that references form
  useEffect(() => {
    async function fetchUniversityId() {
      if (!form.university || form.university === "Other" || !form.country || form.country === "Other") {
        setSelectedUniversityId(null);
        return;
      }
      try {
        const res = await fetch(`${API.baseURL}/api/universities/countries/${encodeURIComponent(form.country)}`);
        if (!res.ok) throw new Error("Failed to fetch universities");
        const data = await res.json();
        const uni = (data.universities || []).find(u => u.name === form.university);
        setSelectedUniversityId(uni ? uni.id : null);
      } catch (e) {
        setSelectedUniversityId(null);
      }
    }
    fetchUniversityId();
  }, [form.university, form.country]);

  // Load current student profile
  useEffect(() => {
    let dead = false;
    async function load() {
      try {
        // Check if user is logged in and has studentId
        if (!user || !user.studentId) {
          console.error("StudentProfile: User not logged in or no studentId attached");
          if (!dead) {
            toast.error("Please log in as a student to access your profile");
            setLoading(false);
          }
          return;
        }

        const res = await fetch(`${API.baseURL}/api/students/me`, {
          headers: { ...authHeader },
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          let errorMessage = "Failed to load profile";
          
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          
          // If 404, student might not exist yet - this is okay for new students
          if (res.status === 404) {
            console.log("StudentProfile: Student record not found - will create on save");
            if (!dead) {
              setLoading(false);
              // Don't show error for new students, just load empty form
              return;
            }
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await res.json();
        const s = data?.student || {};
        
        // Debug: Log the student data to see what we're getting
        console.log('StudentProfile: Loaded student data:', {
          degreeLevel: s.degreeLevel,
          customDegreeLevel: s.customDegreeLevel,
          field: s.field,
          customFieldOfStudy: s.customFieldOfStudy,
          program: s.program,
          customProgram: s.customProgram,
          university: s.university,
          customUniversity: s.customUniversity
        });
        
        // Set profile lock status
        if (!dead) {
          setIsProfileLocked(data.isProfileLocked || false);
          setApplicationStatus(data.applicationStatus || null);
        }

        const initial = {
          cnic: s.cnic || "",
          dateOfBirth: s.dateOfBirth
            ? new Date(s.dateOfBirth).toISOString().slice(0, 10)
            : "",
          guardianName: s.guardianName || "",
          guardianCnic: s.guardianCnic || "",
          phone: s.phone || "",
          guardianPhone1: s.guardianPhone1 || "",
          address: s.address || "",
          city: s.city || "",
          province: s.province || "",
          // Previous Academic Record fields - handle both old single record and new array format
          previousAcademicRecords: s.previousAcademicRecords && Array.isArray(s.previousAcademicRecords) && s.previousAcademicRecords.length > 0
            ? s.previousAcademicRecords.map(record => ({
                institution: record.institution || record.currentInstitution || "",
                city: record.city || record.currentCity || "",
                completionYear: record.completionYear || record.currentCompletionYear || "",
                program: record.program || "",
                educationBoard: record.educationBoard || "",
                totalMarks: record.totalMarks || "",
                obtainedMarks: record.obtainedMarks || "",
                gradeType: record.gradeType || "%",
                gradeValue: record.gradeValue || ""
              }))
            : s.currentInstitution || s.currentCity || s.currentCompletionYear
              ? [{
                  institution: s.currentInstitution || "",
                  city: s.currentCity || "",
                  completionYear: s.currentCompletionYear ?? "",
                  program: "",
                  educationBoard: "",
                  totalMarks: "",
                  obtainedMarks: "",
                  gradeType: "%",
                  gradeValue: ""
                }]
              : [{
                  institution: "",
                  city: "",
                  completionYear: "",
                  program: "",
                  educationBoard: "",
                  totalMarks: "",
                  obtainedMarks: "",
                  gradeType: "%",
                  gradeValue: ""
                }],
          // Future Education fields  
          country: s.country || "Pakistan", // Default to Pakistan
          university: s.university || "",
          customUniversity: s.customUniversity || "",
          field: s.field || "", // Add the missing field
          customFieldOfStudy: s.customFieldOfStudy || "", // Custom field value when "Other" is selected (matches Prisma schema)
          degreeLevel: s.degreeLevel || deriveDegreeLevel(s.program) || "", // Auto-derive from program if not set
          customDegreeLevel: s.customDegreeLevel || "", // Custom degree level value when "Other" is selected
          program: s.program || "",
          customProgram: s.customProgram || "", // Custom program value when "Other" is selected
          gradeType: s.gradeType || (s.gpa && s.gpa > 4 ? "PERCENTAGE" : "CGPA") || "CGPA", // Infer from gpa value if not set
          gpa: s.gpa ?? "",
          gradYear: s.gradYear ?? "",
          // Personal Introduction - filter out default placeholder text
          personalIntroduction: s.personalIntroduction && 
            s.personalIntroduction !== "Tell us about yourself and your family (Optional but recommended)" 
            ? s.personalIntroduction : "",
          // Enhanced Details for Donors
          familySize: s.familySize ?? "",
          parentsOccupation: s.parentsOccupation || "",
          monthlyFamilyIncome: s.monthlyFamilyIncome || "",
          careerGoals: s.careerGoals || "",
          academicAchievements: s.academicAchievements || "",
          communityInvolvement: s.communityInvolvement || "",
          specificField: s.specificField || "",
          // Social Media Fields
          facebookUrl: s.facebookUrl || "",
          instagramHandle: s.instagramHandle || "",
          whatsappNumber: s.whatsappNumber || "",
          linkedinUrl: s.linkedinUrl || "",
          twitterHandle: s.twitterHandle || "",
          tiktokHandle: s.tiktokHandle || "",
          // Photo fields
          photoUrl: s.photoUrl || "",
          photoThumbnailUrl: s.photoThumbnailUrl || "",
          photoUploadedAt: s.photoUploadedAt || null,
          // Introduction Video fields
          introVideoUrl: s.introVideoUrl || "",
          introVideoThumbnailUrl: s.introVideoThumbnailUrl || "",
          introVideoUploadedAt: s.introVideoUploadedAt || null,
          introVideoDuration: s.introVideoDuration || null,
        };
        if (!dead) setForm((prev) => ({ ...prev, ...initial }));
      } catch (e) {
        console.error("StudentProfile load error:", e);
        if (!dead) {
          const errorMsg = e.message || "Failed to load profile";
          toast.error(errorMsg);
          setLoading(false);
        }
      } finally {
        if (!dead) setLoading(false);
      }
    }
    load();
    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  // Load documents for completion calculation
  useEffect(() => {
    let dead = false;
    async function loadDocs() {
      try {
        if (!user?.studentId) return;
        
        const res = await fetch(`${API.baseURL}/api/uploads?studentId=${user.studentId}`, {
          headers: { ...authHeader }
        });
        
        if (!res.ok) throw new Error("Failed to load documents");
        
        const data = await res.json();
        const docs = Array.isArray(data?.documents) ? data.documents : [];
        
        if (!dead) setDocuments(docs);
      } catch (e) {
        console.error("Failed to load documents:", e);
        // Don't show error toast as this is supplementary data
      }
    }
    
    loadDocs();
    return () => { dead = true; };
  }, [user?.studentId, authHeader]);

  // Auto-populate degree level if missing but program exists
  useEffect(() => {
    if (!form.degreeLevel && form.program) {
      const derivedLevel = deriveDegreeLevel(form.program);
      if (derivedLevel) {
        setForm(prev => ({ ...prev, degreeLevel: derivedLevel }));
      }
    }
  }, [form.program, form.degreeLevel]);

  // Auto-fetch fields and programs when form loads with existing data
  // This ensures saved values show up in the dropdowns
  useEffect(() => {
    if (selectedUniversityId && form.degreeLevel && !loading) {
      // Fetch fields for the saved degree level
      fetchFields(form.degreeLevel);
    }
  }, [selectedUniversityId, form.degreeLevel, loading]);

  // Auto-fetch programs when both degree level and field are set
  useEffect(() => {
    if (selectedUniversityId && form.degreeLevel && form.field && !loading && availableFields.length > 0) {
      // Fetch programs for the saved degree level and field
      fetchPrograms(form.degreeLevel, form.field);
    }
  }, [selectedUniversityId, form.degreeLevel, form.field, loading, availableFields]);

  // Zod-powered validation
  function validateField(name, value) {
    // Validate just the one field by parsing the whole object but with this field updated
    const candidate = { ...form, [name]: value };
    const result = studentProfileAcademicSchema.safeParse(candidate);
    if (result.success) return "";

    // find first issue for this field
    const issue = result.error.issues.find((i) => i.path?.[0] === name);
    return issue ? issue.message : "";
  }

  function validateAll() {
    // Create a clean form object for validation, excluding legacy fields that aren't in the form state
    const formForValidation = { ...form };
    // Remove any legacy fields that might have been accidentally added
    // These fields are not part of the new form structure
    delete formForValidation.currentInstitution;
    delete formForValidation.currentCity;
    delete formForValidation.currentCompletionYear;
    
    // Also ensure these are not set to empty strings (in case they were added somehow)
    if (formForValidation.currentInstitution === "") delete formForValidation.currentInstitution;
    if (formForValidation.currentCity === "") delete formForValidation.currentCity;
    if (formForValidation.currentCompletionYear === "" || formForValidation.currentCompletionYear === null) {
      delete formForValidation.currentCompletionYear;
    }
    
    const result = studentProfileAcademicSchema.safeParse(formForValidation);
    if (result.success) {
      setErrors({});
      return { valid: true, errors: {} };
    }
    const next = {};
    for (const issue of result.error.issues) {
      // Handle nested paths like "previousAcademicRecords.0.institution"
      const path = issue.path || [];
      if (path.length > 0) {
        // For nested paths, create a key like "previousAcademicRecords.0.institution"
        const key = path.join('.');
        if (!next[key]) {
          next[key] = issue.message;
        }
        // For array fields, also set error on the specific field
        if (path.length >= 3 && path[0] === 'previousAcademicRecords') {
          const recordIndex = path[1];
          const fieldName = path[2];
          const fieldKey = `previousAcademicRecords.${recordIndex}.${fieldName}`;
          if (!next[fieldKey]) {
            next[fieldKey] = issue.message;
          }
        } else if (path.length === 1 && path[0] === 'previousAcademicRecords') {
          // General error for the array itself (e.g., "At least one previous academic record is required")
          next['previousAcademicRecords'] = issue.message;
        }
      } else {
        // For top-level fields
        const key = issue.path?.[0];
        if (key && !next[key]) next[key] = issue.message;
      }
    }
    
    // Debug: Log validation errors to console
    console.log("Validation errors:", next);
    console.log("Full validation result:", result.error.issues);
    console.log("Form data:", form);
    
    setErrors(next);
    return { valid: false, errors: next };
  }

  // Handlers
  function setVal(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    // live-validate only this field if it previously had an error
    if (errors[name]) {
      const msg = validateField(name, value);
      setErrors((e) => ({ ...e, [name]: msg }));
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    
    // Check if profile is locked
    if (isProfileLocked) {
      toast.error("Your profile is locked because your application has been submitted. Contact support to request changes.");
      return;
    }
    
    const validationResult = validateAll();
    if (!validationResult.valid) {
      // Use errors from validation result, not state (state might not be updated yet)
      const validationErrors = validationResult.errors;
      
      // Show specific error messages
      const errorMessages = Object.entries(validationErrors)
        .filter(([key, value]) => value) // Only include fields with errors
        .map(([key, value]) => {
          // Format field names for display
          let fieldName = key;
          // Handle nested paths like "previousAcademicRecords.0.institution"
          if (key.startsWith('previousAcademicRecords.')) {
            const match = key.match(/previousAcademicRecords\.(\d+)\.(.+)/);
            if (match) {
              const recordNum = parseInt(match[1]) + 1;
              const field = match[2];
              fieldName = `Record ${recordNum} - ${field.charAt(0).toUpperCase() + field.slice(1)}`;
            } else if (key === 'previousAcademicRecords') {
              fieldName = 'Previous Academic Records';
            }
          } else {
            // Capitalize first letter and add spaces
            fieldName = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
          }
          return `${fieldName}: ${value}`;
        })
        .slice(0, 5); // Show first 5 errors
      
      if (errorMessages.length > 0) {
        const errorText = errorMessages.length === 1 
          ? errorMessages[0]
          : `Please fix the following:\n${errorMessages.join('\n')}`;
        toast.error(errorText, {
          duration: 8000,
        });
      } else {
        toast.error("Please fix the highlighted fields.");
      }
      
      // Also log to console for debugging
      console.log("Validation failed. Errors:", validationErrors);
      console.log("Form data being validated:", form);
      return;
    }

    try {
      setSaving(true);
      // Determine final university value
      const finalUniversity = form.university === "Other" || form.country === "Other" 
        ? form.customUniversity 
        : form.university;

      // Build payload explicitly with only valid Prisma schema fields
      // Required fields must be included even if empty (validation will catch them)
      const payload = {
        // Personal Information - REQUIRED fields must always be included
        cnic: form.cnic || "",
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : null,
        guardianName: form.guardianName || "",
        guardianCnic: form.guardianCnic || "",
        phone: form.phone || "",
        guardianPhone1: form.guardianPhone1 || "",
        address: form.address || "",
        city: form.city || "",
        province: form.province || "",
        country: form.country || "Pakistan", // Default to Pakistan
        
        // Education fields - REQUIRED fields must always be included
        university: finalUniversity || "",
        // Note: 'field' is not in validation schema but is in Prisma schema - don't send it to avoid issues
        // field: form.field || "", 
        degreeLevel: form.degreeLevel || "",
        program: form.program || "",
        // Auto-detect gradeType based on GPA value - if > 4, it must be a percentage
        gradeType: (form.gpa && Number(form.gpa) > 4) ? "PERCENTAGE" : (form.gradeType || "CGPA"),
        gpa: form.gpa === "" ? 0 : Number(form.gpa), // Required - use 0 if empty, validation will catch invalid values
        gradYear: form.gradYear === "" ? 0 : Number(form.gradYear), // Required - use 0 if empty, validation will catch invalid values
        
        // Previous Academic Record - send as array
        // Filter out empty records and ensure required fields are present
        previousAcademicRecords: form.previousAcademicRecords
          .filter(record => {
            // Only include records that have at least the required fields filled
            return record.institution && record.institution.trim() && 
                   record.city && record.city.trim() && 
                   record.completionYear && record.completionYear !== "";
          })
          .map(record => ({
            institution: record.institution.trim(),
            city: record.city.trim(),
            completionYear: Number(record.completionYear),
            program: record.program?.trim() || undefined,
            educationBoard: record.educationBoard?.trim() || undefined,
            totalMarks: record.totalMarks && record.totalMarks !== "" ? Number(record.totalMarks) : undefined,
            obtainedMarks: record.obtainedMarks && record.obtainedMarks !== "" ? Number(record.obtainedMarks) : undefined,
            gradeType: record.gradeType || undefined,
            gradeValue: record.gradeValue && record.gradeValue !== "" 
              ? (isNaN(Number(record.gradeValue)) ? record.gradeValue : Number(record.gradeValue))
              : undefined
          }))
          .filter(record => {
            // Remove undefined values from each record
            Object.keys(record).forEach(key => {
              if (record[key] === undefined) {
                delete record[key];
              }
            });
            return true;
          }),
        
        // Profile Details - Optional fields
        personalIntroduction: form.personalIntroduction || "",
        familySize: form.familySize === "" ? undefined : (form.familySize ? Number(form.familySize) : undefined),
        parentsOccupation: form.parentsOccupation || "",
        monthlyFamilyIncome: form.monthlyFamilyIncome || "",
        careerGoals: form.careerGoals || "",
        academicAchievements: form.academicAchievements || "",
        communityInvolvement: form.communityInvolvement || "",
        specificField: form.specificField || "",
      };
      
      // Add optional photo/social/video fields only if they have values
      if (form.photoUrl) payload.photoUrl = form.photoUrl;
      if (form.photoThumbnailUrl) payload.photoThumbnailUrl = form.photoThumbnailUrl;
      if (form.photoUploadedAt) payload.photoUploadedAt = new Date(form.photoUploadedAt).toISOString();
      if (form.facebookUrl) payload.facebookUrl = form.facebookUrl;
      if (form.instagramHandle) payload.instagramHandle = form.instagramHandle;
      if (form.whatsappNumber) payload.whatsappNumber = form.whatsappNumber;
      if (form.linkedinUrl) payload.linkedinUrl = form.linkedinUrl;
      if (form.twitterHandle) payload.twitterHandle = form.twitterHandle;
      if (form.tiktokHandle) payload.tiktokHandle = form.tiktokHandle;
      if (form.introVideoUrl) payload.introVideoUrl = form.introVideoUrl;
      if (form.introVideoThumbnailUrl) payload.introVideoThumbnailUrl = form.introVideoThumbnailUrl;
      if (form.introVideoUploadedAt) payload.introVideoUploadedAt = new Date(form.introVideoUploadedAt).toISOString();
      if (form.introVideoDuration !== null && form.introVideoDuration !== "") payload.introVideoDuration = Number(form.introVideoDuration);
      
      // Remove undefined values (but keep empty strings for required fields)
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      const res = await fetch(`${API.baseURL}/api/students/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = "Failed to save profile";
        const fieldErrors = {};
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.errors && Array.isArray(errorJson.errors)) {
            // Validation errors from backend - set field-level errors
            errorJson.errors.forEach(e => {
              const fieldName = e.path || 'unknown';
              fieldErrors[fieldName] = e.message;
            });
            
            // Set errors in state for field-level display
            setErrors(fieldErrors);
            
            // Also create a summary message for toast
            const errorDetails = errorJson.errors.map(e => {
              const fieldName = e.path ? e.path.join('.') : 'unknown field';
              return `${fieldName}: ${e.message}`;
            }).join("; ");
            errorMessage = `Validation failed: ${errorDetails}`;
          } else if (errorJson.error) {
            errorMessage = errorJson.error;
          } else if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        console.error("Profile save error:", errorMessage);
        throw new Error(errorMessage);
      }

      const data = await res.json();
      toast.success("Profile updated");
      
      // Redirect to My Application after successful profile save
      setTimeout(() => {
        navigate('/my-application');
      }, 1000); // Small delay to let user see the success message
      
    } catch (e) {
      console.error("Profile save error:", e);
      const errorMsg = e.message || "Failed to save profile";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  const completeness = useMemo(() => {
    return calculateOverallCompleteness(form, documents);
  }, [form, documents]);

  if (loading) {
    console.log(" StudentProfile: Loading...");
    return <Card className="p-6">Loading profile…</Card>;
  }

  console.log(" StudentProfile: Rendering with form data:", { hasForm: !!form, hasDocuments: !!documents });

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0 min-h-screen">
      <h1 className="text-xl sm:text-2xl font-semibold">My Profile</h1>

      {/* Profile Locked Banner */}
      {isProfileLocked && (
        <Card className="p-4 bg-amber-50 border-amber-300">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h3 className="font-semibold text-amber-900">Profile Locked</h3>
              <p className="text-sm text-amber-700">
                Your profile has been submitted for review (Status: {applicationStatus?.replace(/_/g, ' ')}) and is now locked. 
                To request changes, please contact support at <a href="mailto:op.executive@akhuwat.org.pk" className="underline">op.executive@akhuwat.org.pk</a>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Pakistan-only filter message */}
      {(() => {
        const filterMessage = getFilterMessage();
        return filterMessage && (
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{filterMessage.icon}</span>
              <div>
                <h3 className="font-medium text-green-900">{filterMessage.message}</h3>
                <p className="text-sm text-green-700">{filterMessage.description}</p>
              </div>
            </div>
          </Card>
        );
      })()}

      <Card className={`p-3 sm:p-4 border ${completeness.isComplete && !completeness.hasValidationErrors ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="text-xs sm:text-sm text-slate-800">
          Overall completeness: <strong>{completeness.percent}%</strong>
          <div className="mt-1 text-slate-600 text-xs">
            Profile: {completeness.profilePercent}% • Documents: {completeness.docPercent}% 
            {completeness.missingDocs.length > 0 && (
              <div className="mt-1">Missing documents: {completeness.missingDocs.join(", ")}</div>
            )}
          </div>
          <div className="mt-1 text-slate-600">
            {completeness.isComplete 
              ? "Profile is complete! You can now submit your application for review." 
              : "Complete your profile and upload required documents to submit your application."
            }
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <form onSubmit={onSubmit}>
          <fieldset disabled={isProfileLocked} className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          {/* CNIC */}
          <div>
            <label className="block text-xs sm:text-sm mb-1">CNIC</label>
            <Input
              value={form.cnic}
              onChange={(e) => setVal("cnic", formatCNIC(e.target.value))}
              placeholder="12345-1234567-1"
              className="rounded-2xl min-h-[44px]"
            />
            {errors.cnic ? (
              <p className="text-xs text-rose-600 mt-1">{errors.cnic}</p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                Format: 12345-1234567-1
              </p>
            )}
          </div>

          {/* DOB */}
          <div>
            <label className="block text-xs sm:text-sm mb-1">Date of Birth</label>
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setVal("dateOfBirth", e.target.value)}
              className="rounded-2xl min-h-[44px]"
            />
            {errors.dateOfBirth && (
              <p className="text-xs text-rose-600 mt-1">{errors.dateOfBirth}</p>
            )}
            {!errors.dateOfBirth && (
              <p className="text-xs text-slate-500 mt-1">DD-MM-YYYY</p>
            )}
          </div>

          {/* Guardian Name */}
          <div>
            <label className="block text-xs sm:text-sm mb-1">Guardian Name</label>
            <Input
              value={form.guardianName}
              onChange={(e) => setVal("guardianName", e.target.value)}
              className="rounded-2xl min-h-[44px]"
            />
            {errors.guardianName && (
              <p className="text-xs text-rose-600 mt-1">
                {errors.guardianName}
              </p>
            )}
          </div>

          {/* Guardian CNIC */}
          <div>
            <label className="block text-xs sm:text-sm mb-1">Guardian CNIC</label>
            <Input
              value={form.guardianCnic}
              onChange={(e) =>
                setVal("guardianCnic", formatCNIC(e.target.value))
              }
              placeholder="12345-1234567-1"
              className="rounded-2xl min-h-[44px]"
            />
            {errors.guardianCnic ? (
              <p className="text-xs text-rose-600 mt-1">
                {errors.guardianCnic}
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                Format: 12345-1234567-1
              </p>
            )}
          </div>

          {/* Student Phone */}
          <div>
            <label className="block text-xs sm:text-sm mb-1">Student Phone</label>
            <Input
              value={form.phone}
              onChange={(e) => setVal("phone", e.target.value)}
              placeholder="+92XXXXXXXXXX or 03XXXXXXXXX"
              className="rounded-2xl min-h-[44px]"
            />
            {errors.phone && (
              <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Guardian Phone 1 */}
          <div>
            <label className="block text-xs sm:text-sm mb-1">Guardian Phone 1</label>
            <Input
              value={form.guardianPhone1}
              onChange={(e) => setVal("guardianPhone1", e.target.value)}
              placeholder="+92XXXXXXXXXX or 03XXXXXXXXX"
              className="rounded-2xl min-h-[44px]"
            />
            {errors.guardianPhone1 && (
              <p className="text-xs text-rose-600 mt-1">{errors.guardianPhone1}</p>
            )}
          </div>

          {/* Address */}
          <div className="sm:col-span-1">
            <label className="block text-xs sm:text-sm mb-1">Address</label>
            <textarea
              rows={3}
              value={form.address}
              onChange={(e) => setVal("address", e.target.value)}
              className="w-full rounded-2xl border px-3 py-2 text-sm min-h-[44px]"
              placeholder="House number, Street name/number, name of area"
            />
            {errors.address && (
              <p className="text-xs text-rose-600 mt-1">{errors.address}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-xs sm:text-sm mb-1">City</label>
            <Input
              value={form.city}
              onChange={(e) => setVal("city", e.target.value)}
              className="rounded-2xl min-h-[44px]"
            />
            {errors.city && (
              <p className="text-xs text-rose-600 mt-1">{errors.city}</p>
            )}
          </div>

          {/* Province */}
          <div>
            <label className="block text-xs sm:text-sm mb-1">Province</label>
            <select
              className="rounded-2xl border border-gray-300 px-3 py-2 text-sm w-full min-h-[44px]"
              value={form.province}
              onChange={(e) => setVal("province", e.target.value)}
            >
              <option value="">Select Province</option>
              <option value="Punjab">Punjab</option>
              <option value="Sindh">Sindh</option>
              <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
              <option value="Balochistan">Balochistan</option>
              <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
              <option value="Azad Jammu & Kashmir">Azad Jammu & Kashmir</option>
              <option value="Islamabad Capital Territory">Islamabad Capital Territory</option>
            </select>
            {errors.province && (
              <p className="text-xs text-rose-600 mt-1">{errors.province}</p>
            )}
          </div>

          {/* Previous Academic Record Section Header */}
          <div className="sm:col-span-2">
            <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-3">Previous Academic Record</h3>
            {errors['previousAcademicRecords'] && (
              <p className="text-xs text-rose-600 mt-1 mb-2">{errors['previousAcademicRecords']}</p>
            )}
          </div>

          {/* Multiple Previous Academic Records */}
          {form.previousAcademicRecords.map((record, index) => (
            <div key={index} className="sm:col-span-2 border border-gray-200 rounded-lg p-4 space-y-4 mb-4">
              {form.previousAcademicRecords.length > 1 && (
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Record #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newRecords = form.previousAcademicRecords.filter((_, i) => i !== index);
                      setForm({ ...form, previousAcademicRecords: newRecords });
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Previous Institution */}
                <div>
                  <label className="block text-xs sm:text-sm mb-1">Previous Institution <span className="text-red-500">*</span></label>
                  <Input
                    value={record.institution}
                    onChange={(e) => {
                      const newRecords = [...form.previousAcademicRecords];
                      newRecords[index].institution = e.target.value;
                      setForm({ ...form, previousAcademicRecords: newRecords });
                      // Clear error when user starts typing
                      const errorKey = `previousAcademicRecords.${index}.institution`;
                      if (errors[errorKey]) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors[errorKey];
                          return newErrors;
                        });
                      }
                    }}
                    className={`rounded-2xl min-h-[44px] ${errors[`previousAcademicRecords.${index}.institution`] ? 'border-red-500' : ''}`}
                    placeholder="e.g., ABC College"
                  />
                  {errors[`previousAcademicRecords.${index}.institution`] && (
                    <p className="text-xs text-rose-600 mt-1">{errors[`previousAcademicRecords.${index}.institution`]}</p>
                  )}
                </div>

                {/* Previous City */}
                <div>
                  <label className="block text-xs sm:text-sm mb-1">Previous Institution City <span className="text-red-500">*</span></label>
                  <Input
                    value={record.city}
                    onChange={(e) => {
                      const newRecords = [...form.previousAcademicRecords];
                      newRecords[index].city = e.target.value;
                      setForm({ ...form, previousAcademicRecords: newRecords });
                      // Clear error when user starts typing
                      const errorKey = `previousAcademicRecords.${index}.city`;
                      if (errors[errorKey]) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors[errorKey];
                          return newErrors;
                        });
                      }
                    }}
                    className={`rounded-2xl min-h-[44px] ${errors[`previousAcademicRecords.${index}.city`] ? 'border-red-500' : ''}`}
                    placeholder="e.g., Lahore"
                  />
                  {errors[`previousAcademicRecords.${index}.city`] && (
                    <p className="text-xs text-rose-600 mt-1">{errors[`previousAcademicRecords.${index}.city`]}</p>
                  )}
                </div>

                {/* Year of Completion */}
                <div>
                  <label className="block text-xs sm:text-sm mb-1">Year of Completion <span className="text-red-500">*</span></label>
                  <Input
                    type="number"
                    value={record.completionYear}
                    onChange={(e) => {
                      const newRecords = [...form.previousAcademicRecords];
                      newRecords[index].completionYear = e.target.value;
                      setForm({ ...form, previousAcademicRecords: newRecords });
                      // Clear error when user starts typing
                      const errorKey = `previousAcademicRecords.${index}.completionYear`;
                      if (errors[errorKey]) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors[errorKey];
                          return newErrors;
                        });
                      }
                    }}
                    className={`rounded-2xl min-h-[44px] ${errors[`previousAcademicRecords.${index}.completionYear`] ? 'border-red-500' : ''}`}
                    placeholder="e.g., 2024"
                  />
                  {errors[`previousAcademicRecords.${index}.completionYear`] && (
                    <p className="text-xs text-rose-600 mt-1">{errors[`previousAcademicRecords.${index}.completionYear`]}</p>
                  )}
                </div>

                {/* Program */}
                <div>
                  <label className="block text-xs sm:text-sm mb-1">Program</label>
                  <Input
                    value={record.program}
                    onChange={(e) => {
                      const newRecords = [...form.previousAcademicRecords];
                      newRecords[index].program = e.target.value;
                      setForm({ ...form, previousAcademicRecords: newRecords });
                    }}
                    className="rounded-2xl min-h-[44px]"
                    placeholder="e.g., Matric, FSc, A-Levels"
                  />
                </div>

                {/* Education Board */}
                <div>
                  <label className="block text-xs sm:text-sm mb-1">Education Board</label>
                  <Input
                    value={record.educationBoard}
                    onChange={(e) => {
                      const newRecords = [...form.previousAcademicRecords];
                      newRecords[index].educationBoard = e.target.value;
                      setForm({ ...form, previousAcademicRecords: newRecords });
                    }}
                    className="rounded-2xl min-h-[44px]"
                    placeholder="e.g., Lahore Board, Cambridge"
                  />
                </div>

                {/* Total Marks */}
                <div>
                  <label className="block text-xs sm:text-sm mb-1">Total Marks</label>
                  <Input
                    type="number"
                    value={record.totalMarks}
                    onChange={(e) => {
                      const newRecords = [...form.previousAcademicRecords];
                      newRecords[index].totalMarks = e.target.value;
                      setForm({ ...form, previousAcademicRecords: newRecords });
                    }}
                    className="rounded-2xl min-h-[44px]"
                    placeholder="e.g., 1100"
                  />
                </div>

                {/* Obtained Marks */}
                <div>
                  <label className="block text-xs sm:text-sm mb-1">Obtained Marks</label>
                  <Input
                    type="number"
                    value={record.obtainedMarks}
                    onChange={(e) => {
                      const newRecords = [...form.previousAcademicRecords];
                      newRecords[index].obtainedMarks = e.target.value;
                      setForm({ ...form, previousAcademicRecords: newRecords });
                    }}
                    className="rounded-2xl min-h-[44px]"
                    placeholder="e.g., 950"
                  />
                </div>

                {/* Grade Type */}
                <div>
                  <label className="block text-xs sm:text-sm mb-1">Grade Type</label>
                  <select
                    value={record.gradeType}
                    onChange={(e) => {
                      const newRecords = [...form.previousAcademicRecords];
                      newRecords[index].gradeType = e.target.value;
                      setForm({ ...form, previousAcademicRecords: newRecords });
                    }}
                    className="rounded-2xl border border-gray-300 px-3 py-2 text-sm w-full min-h-[44px]"
                  >
                    <option value="%">Percentage (%)</option>
                    <option value="CGPA">CGPA</option>
                    <option value="Grade">Grade</option>
                  </select>
                </div>

                {/* Grade Value */}
                <div>
                  <label className="block text-xs sm:text-sm mb-1">
                    {record.gradeType === "%" ? "Percentage" : record.gradeType === "CGPA" ? "CGPA" : "Grade"}
                  </label>
                  <Input
                    type={record.gradeType === "Grade" ? "text" : "number"}
                    step={record.gradeType === "CGPA" ? "0.01" : "1"}
                    value={record.gradeValue}
                    onChange={(e) => {
                      const newRecords = [...form.previousAcademicRecords];
                      newRecords[index].gradeValue = e.target.value;
                      setForm({ ...form, previousAcademicRecords: newRecords });
                    }}
                    className="rounded-2xl min-h-[44px]"
                    placeholder={record.gradeType === "%" ? "e.g., 85" : record.gradeType === "CGPA" ? "e.g., 3.5" : "e.g., A+"}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* ADD MORE Button */}
          <div className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setForm({
                  ...form,
                  previousAcademicRecords: [
                    ...form.previousAcademicRecords,
                    {
                      institution: "",
                      city: "",
                      completionYear: "",
                      program: "",
                      educationBoard: "",
                      totalMarks: "",
                      obtainedMarks: "",
                      gradeType: "%",
                      gradeValue: ""
                    }
                  ]
                });
              }}
              className="w-full sm:w-auto min-h-[44px]"
            >
              + ADD MORE
            </Button>
          </div>

          {/* Future Education Section Header */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Future Education</h3>
            <p className="text-sm text-gray-600 mb-4">Information submitted in your application (Step 2)</p>
          </div>

          {/* Future Education - Read Only Display */}
          <div className="md:col-span-2 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Country Display */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Country</label>
                <p className="text-sm text-gray-800">{form.country || "Not specified"}</p>
              </div>

              {/* University Display */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">University</label>
                <p className="text-sm text-gray-800">
                  {form.university === "Other" ? form.customUniversity : form.university || "Not specified"}
                </p>
              </div>

              {/* Degree Level Display */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Degree Level</label>
                <p className="text-sm text-gray-800">
                  {(() => {
                    // If "Other" was selected, show custom value
                    if (form.degreeLevel === "Other") {
                      return form.customDegreeLevel || "Not specified";
                    }
                    // Otherwise show the regular value
                    return form.degreeLevel || "Not specified";
                  })()}
                </p>
              </div>

              {/* Field of Study Display */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Field of Study</label>
                <p className="text-sm text-gray-800">
                  {(() => {
                    // If "Other" was selected, show custom value
                    if (form.field === "Other") {
                      return form.customFieldOfStudy || "Not specified";
                    }
                    // Otherwise show the regular value
                    return form.field || "Not specified";
                  })()}
                </p>
              </div>

              {/* Program Display */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Program</label>
                <p className="text-sm text-gray-800">
                  {(() => {
                    // If "Other" was selected, show custom value
                    if (form.program === "Other") {
                      return form.customProgram || "Not specified";
                    }
                    // Otherwise show the regular value
                    return form.program || "Not specified";
                  })()}
                </p>
              </div>

              {/* GPA Display */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">CGPA / Percentage</label>
                <p className="text-sm text-gray-800">{form.gpa ? (form.gpa <= 4 ? `${form.gpa} (CGPA)` : `${form.gpa}%`) : "Not specified"}</p>
              </div>

              {/* Graduation Year Display */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Graduation Year</label>
                <p className="text-sm text-gray-800">{form.gradYear || "Not specified"}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-blue-200 mt-3">
              <p className="text-xs text-blue-700">
                ℹ️ <strong>Note:</strong> These details were submitted during your application and are now locked. 
                To request changes, please contact support.
              </p>
            </div>
          </div>

          {/* Personal Introduction Section Header */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Personal Introduction</h3>
          </div>

          {/* Personal Introduction */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">
              Tell us about yourself and your family <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Share your background, family situation, interests, and what motivates you to pursue higher education. This information will be visible to potential sponsors, admins, and sub-admins."
              value={form.personalIntroduction}
              onChange={(e) => setVal("personalIntroduction", e.target.value)}
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {form.personalIntroduction.length}/1000 characters
            </div>
            {errors.personalIntroduction && (
              <p className="text-xs text-rose-600 mt-1">{errors.personalIntroduction}</p>
            )}
          </div>

          {/* Photo Section Header */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Your Photo</h3>
            <p className="text-sm text-gray-600 mb-4">Your photo helps sponsors and administrators recognize you. You can update it anytime.</p>
          </div>

          {/* Current Photo Display & Upload */}
          <div className="md:col-span-2">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Current Photo Display */}
              <div className="flex-shrink-0">
                <label className="block text-sm mb-2">Current Photo</label>
                {form.photoUrl ? (
                  <div className="relative">
                    <StudentPhoto 
                      student={{
                        id: 'current-student',
                        photoUrl: form.photoUrl,
                        photoThumbnailUrl: form.photoThumbnailUrl,
                        name: 'Your Photo'
                      }}
                      size="large" 
                      clickable={true}
                    />
                    <div className="mt-2 text-xs text-gray-500">
                      Uploaded: {form.photoUploadedAt ? new Date(form.photoUploadedAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-2xl mb-1"></div>
                      <div className="text-xs">No photo uploaded</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Photo Upload Component */}
              <div className="flex-grow">
                <label className="block text-sm mb-2">
                  {form.photoUrl ? 'Update Photo' : 'Upload Photo'}
                </label>
                <PhotoUpload
                  currentPhotoUrl={form.photoUrl}
                  currentThumbnailUrl={form.photoThumbnailUrl}
                  onPhotoChange={(photoData) => {
                    setForm({
                      ...form,
                      photoUrl: photoData.photoUrl || "",
                      photoThumbnailUrl: photoData.photoThumbnailUrl || "",
                      photoUploadedAt: photoData.uploadedAt
                    });
                  }}
                  required={false}
                />
              </div>
            </div>
          </div>

          {/* Social Media Section Header */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Social Media & Contact</h3>
            <p className="text-sm text-gray-600 mb-4">Optional social media profiles and contact information for verification and communication purposes.</p>
          </div>

          {/* Facebook Profile URL */}
          <div>
            <label className="block text-sm mb-1">Facebook Profile URL (Optional)</label>
            <Input
              value={form.facebookUrl}
              onChange={(e) => setVal("facebookUrl", e.target.value)}
              className="rounded-2xl"
              placeholder="https://facebook.com/yourname"
            />
            {errors.facebookUrl && (
              <p className="text-xs text-rose-600 mt-1">{errors.facebookUrl}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">Full Facebook profile URL</p>
          </div>

          {/* Instagram Handle */}
          <div>
            <label className="block text-sm mb-1">Instagram Handle (Optional)</label>
            <Input
              value={form.instagramHandle}
              onChange={(e) => setVal("instagramHandle", e.target.value)}
              className="rounded-2xl"
              placeholder="@yourusername"
            />
            {errors.instagramHandle && (
              <p className="text-xs text-rose-600 mt-1">{errors.instagramHandle}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">Your Instagram username with @</p>
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-sm mb-1">WhatsApp Number (Optional)</label>
            <Input
              value={form.whatsappNumber}
              onChange={(e) => setVal("whatsappNumber", e.target.value)}
              className="rounded-2xl"
              placeholder="+92XXXXXXXXXX"
            />
            {errors.whatsappNumber && (
              <p className="text-xs text-rose-600 mt-1">{errors.whatsappNumber}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">WhatsApp number with country code</p>
          </div>

          {/* LinkedIn Profile URL */}
          <div>
            <label className="block text-sm mb-1">LinkedIn Profile URL (Optional)</label>
            <Input
              value={form.linkedinUrl}
              onChange={(e) => setVal("linkedinUrl", e.target.value)}
              className="rounded-2xl"
              placeholder="https://linkedin.com/in/yourname"
            />
            {errors.linkedinUrl && (
              <p className="text-xs text-rose-600 mt-1">{errors.linkedinUrl}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">Professional LinkedIn profile URL</p>
          </div>

          {/* Twitter Handle */}
          <div>
            <label className="block text-sm mb-1">Twitter/X Handle (Optional)</label>
            <Input
              value={form.twitterHandle}
              onChange={(e) => setVal("twitterHandle", e.target.value)}
              className="rounded-2xl"
              placeholder="@yourusername"
            />
            {errors.twitterHandle && (
              <p className="text-xs text-rose-600 mt-1">{errors.twitterHandle}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">Your Twitter/X username with @</p>
          </div>

          {/* TikTok Handle */}
          <div>
            <label className="block text-sm mb-1">TikTok Handle (Optional)</label>
            <Input
              value={form.tiktokHandle}
              onChange={(e) => setVal("tiktokHandle", e.target.value)}
              className="rounded-2xl"
              placeholder="@yourusername"
            />
            {errors.tiktokHandle && (
              <p className="text-xs text-rose-600 mt-1">{errors.tiktokHandle}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">Your TikTok username with @</p>
          </div>

          {/* Introduction Video Section */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Introduction Video</h3>
            <p className="text-sm text-gray-600 mb-4">Record a personal video (30-120 seconds) to introduce yourself to potential sponsors. This helps create a stronger connection and shows your personality.</p>
            
            <VideoUploader
              currentVideoUrl={form.introVideoUrl}
              currentThumbnailUrl={form.introVideoThumbnailUrl}
              currentDuration={form.introVideoDuration}
              onVideoSelect={(videoData, metadata) => {
                // Video has been uploaded to server, update form with URLs
                // Update all video fields in a single state update to avoid race conditions
                setForm(prev => ({
                  ...prev,
                  introVideoUrl: videoData.url,
                  introVideoThumbnailUrl: videoData.thumbnailUrl,
                  introVideoDuration: videoData.duration,
                  introVideoUploadedAt: videoData.uploadedAt
                }));
              }}
              onVideoRemove={async () => {
                try {
                  // Call API to remove video from server
                  const token = localStorage.getItem('auth_token');
                  const response = await fetch(`${API.baseURL}/api/videos/intro`, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  
                  if (response.ok) {
                    // Update all video fields in a single state update
                    setForm(prev => ({
                      ...prev,
                      introVideoUrl: '',
                      introVideoThumbnailUrl: '',
                      introVideoDuration: null,
                      introVideoUploadedAt: null
                    }));
                    toast.success('Video removed successfully');
                  } else {
                    toast.error('Failed to remove video');
                  }
                } catch (error) {
                  console.error('Error removing video:', error);
                  toast.error('Failed to remove video');
                }
              }}
            />
          </div>

          {/* Enhanced Details for Donors Section Header */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Additional Details for Sponsors</h3>
            <p className="text-sm text-gray-600 mb-4">This information helps potential sponsors better understand your background and goals.</p>
          </div>

          {/* Family Background */}
          <div>
            <label className="block text-sm mb-1">Family Size (number of members)</label>
            <Input
              type="number"
              value={form.familySize}
              onChange={(e) => setVal("familySize", e.target.value)}
              className="rounded-2xl"
              placeholder="e.g., 5"
              min="1"
              max="20"
            />
            {errors.familySize && (
              <p className="text-xs text-rose-600 mt-1">{errors.familySize}</p>
            )}
          </div>

          {/* Parents' Occupation */}
          <div>
            <label className="block text-sm mb-1">Parents' Occupation</label>
            <Input
              value={form.parentsOccupation}
              onChange={(e) => setVal("parentsOccupation", e.target.value)}
              className="rounded-2xl"
              placeholder="e.g., Farmer, Teacher, Small business owner"
            />
            {errors.parentsOccupation && (
              <p className="text-xs text-rose-600 mt-1">{errors.parentsOccupation}</p>
            )}
          </div>

          {/* Monthly Family Income */}
          <div>
            <label className="block text-sm mb-1">Monthly Family Income Range</label>
            <select
              className="rounded-2xl border border-gray-300 px-3 py-2 text-sm w-full"
              value={form.monthlyFamilyIncome}
              onChange={(e) => setVal("monthlyFamilyIncome", e.target.value)}
            >
              <option value="">Select income range</option>
              <option value="Less than ₨25,000">Less than ₨25,000</option>
              <option value="₨25,000-50,000">₨25,000-50,000</option>
              <option value="₨50,000-100,000">₨50,000-100,000</option>
              <option value="₨100,000-200,000">₨100,000-200,000</option>
              <option value="₨200,000-300,000">₨200,000-300,000</option>
              <option value="More than ₨300,000">More than ₨300,000</option>
            </select>
            {errors.monthlyFamilyIncome && (
              <p className="text-xs text-rose-600 mt-1">{errors.monthlyFamilyIncome}</p>
            )}
          </div>

          {/* Career Goals */}
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm mb-1">Career Goals & Aspirations</label>
            <textarea
              className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
              rows={3}
              placeholder="Describe your post-graduation career goals and how you plan to contribute to your community/field..."
              value={form.careerGoals}
              onChange={(e) => setVal("careerGoals", e.target.value)}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {form.careerGoals.length}/500 characters
            </div>
            {errors.careerGoals && (
              <p className="text-xs text-rose-600 mt-1">{errors.careerGoals}</p>
            )}
          </div>

          {/* Academic Achievements */}
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm mb-1">Academic Achievements & Awards</label>
            <textarea
              className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
              rows={2}
              placeholder="List any academic honors, awards, competitions, or special recognition you've received..."
              value={form.academicAchievements}
              onChange={(e) => setVal("academicAchievements", e.target.value)}
              maxLength={300}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {form.academicAchievements.length}/300 characters
            </div>
            {errors.academicAchievements && (
              <p className="text-xs text-rose-600 mt-1">{errors.academicAchievements}</p>
            )}
          </div>

          {/* Community Involvement */}
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm mb-1">Community Involvement & Leadership</label>
            <textarea
              className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
              rows={2}
              placeholder="Describe any volunteer work, community service, leadership roles, or social initiatives you've been involved in..."
              value={form.communityInvolvement}
              onChange={(e) => setVal("communityInvolvement", e.target.value)}
              maxLength={300}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {form.communityInvolvement.length}/300 characters
            </div>
            {errors.communityInvolvement && (
              <p className="text-xs text-rose-600 mt-1">{errors.communityInvolvement}</p>
            )}
          </div>

          <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end">
            <Button type="submit" disabled={saving || isProfileLocked} className="rounded-2xl min-h-[44px] w-full sm:w-auto">
              {isProfileLocked ? "Profile Locked" : saving ? "Saving…" : "Save Profile"}
            </Button>
          </div>
          </fieldset>
        </form>
      </Card>
    </div>
  );
}
