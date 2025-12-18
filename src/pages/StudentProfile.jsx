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
    guardian2Name: "",
    guardian2Cnic: "",
    phone: "",
    guardianPhone1: "",
    guardianPhone2: "",
    address: "",
    city: "",
    province: "",
    // Photo fields
    photoUrl: "",
    photoThumbnailUrl: "",
    photoUploadedAt: null,
    // Completed Education fields
    currentInstitution: "",
    currentCity: "",
    currentCompletionYear: "",
    // Future Education fields
    country: "Pakistan", // Default to Pakistan for existing users
    university: "",
    customUniversity: "",
    field: "", // Add the missing field
    degreeLevel: "", // Add degree level field
    program: "",
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
        const res = await fetch(`${API.baseURL}/api/students/me`, {
          headers: { ...authHeader },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const s = data?.student || {};

        const initial = {
          cnic: s.cnic || "",
          dateOfBirth: s.dateOfBirth
            ? new Date(s.dateOfBirth).toISOString().slice(0, 10)
            : "",
          guardianName: s.guardianName || "",
          guardianCnic: s.guardianCnic || "",
          guardian2Name: s.guardian2Name || "",
          guardian2Cnic: s.guardian2Cnic || "",
          phone: s.phone || "",
          guardianPhone1: s.guardianPhone1 || "",
          guardianPhone2: s.guardianPhone2 || "",
          address: s.address || "",
          city: s.city || "",
          province: s.province || "",
          // Completed Education fields
          currentInstitution: s.currentInstitution || "",
          currentCity: s.currentCity || "",
          currentCompletionYear: s.currentCompletionYear ?? "",
          // Future Education fields  
          country: s.country || "Pakistan", // Default to Pakistan
          university: s.university || "",
          customUniversity: s.customUniversity || "",
          field: s.field || "", // Add the missing field
          degreeLevel: s.degreeLevel || deriveDegreeLevel(s.program) || "", // Auto-derive from program if not set
          program: s.program || "",
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
        console.error(e);
        toast.error("Failed to load profile");
      } finally {
        if (!dead) setLoading(false);
      }
    }
    load();
    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
    const result = studentProfileAcademicSchema.safeParse(form);
    if (result.success) {
      setErrors({});
      return true;
    }
    const next = {};
    for (const issue of result.error.issues) {
      const key = issue.path?.[0];
      if (key && !next[key]) next[key] = issue.message; // keep first message per field
    }
    
    // Debug: Log validation errors to console
    console.log("Validation errors:", next);
    
    setErrors(next);
    return false;
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
    if (!validateAll()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    try {
      setSaving(true);
      // Determine final university value
      const finalUniversity = form.university === "Other" || form.country === "Other" 
        ? form.customUniversity 
        : form.university;

      const payload = {
        ...form,
        university: finalUniversity, // Use the final university value
        // coerce numeric and normalize before send
        gpa: form.gpa === "" ? null : Number(form.gpa),
        gradYear: form.gradYear === "" ? null : Number(form.gradYear),
        currentCompletionYear: form.currentCompletionYear === "" ? null : Number(form.currentCompletionYear),
        dateOfBirth: form.dateOfBirth
          ? new Date(form.dateOfBirth).toISOString()
          : null,
      };

      const res = await fetch(`${API.baseURL}/api/students/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      toast.success("Profile updated");
      
      // Redirect to My Application after successful profile save
      setTimeout(() => {
        navigate('/my-application');
      }, 1000); // Small delay to let user see the success message
      
    } catch (e) {
      console.error(e);
      toast.error("Failed to save profile");
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
        <form onSubmit={onSubmit} className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
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

          {/* Second Guardian Name */}
          <div>
            <label className="block text-xs sm:text-sm mb-1">Second Guardian Name (Optional)</label>
            <Input
              value={form.guardian2Name}
              onChange={(e) => setVal("guardian2Name", e.target.value)}
              placeholder="Enter second guardian's name"
              className="rounded-2xl min-h-[44px]"
            />
            {errors.guardian2Name && (
              <p className="text-xs text-rose-600 mt-1">
                {errors.guardian2Name}
              </p>
            )}
          </div>

          {/* Second Guardian CNIC */}
          <div>
            <label className="block text-xs sm:text-sm mb-1">Second Guardian CNIC (Optional)</label>
            <Input
              value={form.guardian2Cnic}
              onChange={(e) =>
                setVal("guardian2Cnic", formatCNIC(e.target.value))
              }
              placeholder="12345-1234567-1"
              className="rounded-2xl min-h-[44px]"
            />
            {errors.guardian2Cnic ? (
              <p className="text-xs text-rose-600 mt-1">
                {errors.guardian2Cnic}
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

          {/* Guardian Phone 2 */}
          <div>
            <label className="block text-xs sm:text-sm mb-1">Guardian Phone 2 (Optional)</label>
            <Input
              value={form.guardianPhone2}
              onChange={(e) => setVal("guardianPhone2", e.target.value)}
              placeholder="+92XXXXXXXXXX or 03XXXXXXXXX"
              className="rounded-2xl min-h-[44px]"
            />
            {errors.guardianPhone2 && (
              <p className="text-xs text-rose-600 mt-1">{errors.guardianPhone2}</p>
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

          {/* Completed Education Section Header */}
          <div className="sm:col-span-2">
            <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-3">Completed Education</h3>
          </div>

          {/* Completed Institution */}
          <div>
            <label className="block text-xs sm:text-sm mb-1">Completed Institution</label>
            <Input
              value={form.currentInstitution}
              onChange={(e) => setVal("currentInstitution", e.target.value)}
              className={`rounded-2xl min-h-[44px] ${errors.currentInstitution ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder="e.g., ABC College"
            />
            {errors.currentInstitution && (
              <p className="text-xs text-rose-600 mt-1">{errors.currentInstitution}</p>
            )}
          </div>

          {/* Completed City */}
          <div>
            <label className="block text-xs sm:text-sm mb-1">Completed Institution City</label>
            <Input
              value={form.currentCity}
              onChange={(e) => setVal("currentCity", e.target.value)}
              className={`rounded-2xl min-h-[44px] ${errors.currentCity ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder="e.g., Lahore"
            />
            {errors.currentCity && (
              <p className="text-xs text-rose-600 mt-1">{errors.currentCity}</p>
            )}
          </div>

          {/* Completed Year */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Year of Completion (Completed Education)</label>
            <Input
              type="number"
              value={form.currentCompletionYear}
              onChange={(e) => setVal("currentCompletionYear", e.target.value)}
              className={`rounded-2xl ${errors.currentCompletionYear ? 'border-red-500 focus:border-red-500' : ''}`}
              placeholder="e.g., 2024"
            />
            {errors.currentCompletionYear && (
              <p className="text-xs text-rose-600 mt-1">{errors.currentCompletionYear}</p>
            )}
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
                <p className="text-sm text-gray-800">{form.degreeLevel || "Not specified"}</p>
              </div>

              {/* Field of Study Display */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Field of Study</label>
                <p className="text-sm text-gray-800">{form.field || "Not specified"}</p>
              </div>

              {/* Program Display */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Program</label>
                <p className="text-sm text-gray-800">{form.program || "Not specified"}</p>
              </div>

              {/* GPA Display */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">GPA (4.00 scale)</label>
                <p className="text-sm text-gray-800">{form.gpa || "Not specified"}</p>
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
              Tell us about yourself and your family (This helps potential sponsors understand your story)
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
                setVal('introVideoUrl', videoData.url);
                setVal('introVideoThumbnailUrl', videoData.thumbnailUrl);
                setVal('introVideoDuration', videoData.duration);
                setVal('introVideoUploadedAt', videoData.uploadedAt);
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
                    setVal('introVideoUrl', '');
                    setVal('introVideoThumbnailUrl', '');
                    setVal('introVideoDuration', null);
                    setVal('introVideoUploadedAt', null);
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

          {/* Specific Field/Specialization */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Specific Field/Specialization</label>
            <Input
              value={form.specificField}
              onChange={(e) => setVal("specificField", e.target.value)}
              className="rounded-2xl"
              placeholder="e.g., Artificial Intelligence, Cardiac Surgery, Environmental Engineering"
            />
            {errors.specificField && (
              <p className="text-xs text-rose-600 mt-1">{errors.specificField}</p>
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
            <Button type="submit" disabled={saving} className="rounded-2xl min-h-[44px] w-full sm:w-auto">
              {saving ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
