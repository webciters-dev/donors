// src/pages/StudentProfile.jsx
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { studentProfileAcademicSchema } from "@/schemas/studentProfileAcademic.schema";
import { 
  calculateProfileCompleteness, 
  getCompletionMessage, 
  isProfileReadyForSubmission 
} from "@/lib/profileValidation";
import { API } from "@/lib/api";

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

export default function StudentProfile() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [form, setForm] = useState({
    cnic: "",
    dateOfBirth: "",
    guardianName: "",
    guardianCnic: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    // Current Education fields
    currentInstitution: "",
    currentCity: "",
    currentCompletionYear: "",
    // Future Education fields
    university: "",
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
    currentAcademicYear: "",
    specificField: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

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
          phone: s.phone || "",
          address: s.address || "",
          city: s.city || "",
          province: s.province || "",
          // Current Education fields
          currentInstitution: s.currentInstitution || "",
          currentCity: s.currentCity || "",
          currentCompletionYear: s.currentCompletionYear ?? "",
          // Future Education fields  
          university: s.university || "",
          program: s.program || "",
          gpa: s.gpa ?? "",
          gradYear: s.gradYear ?? "",
          // Personal Introduction
          personalIntroduction: s.personalIntroduction || "",
          // Enhanced Details for Donors
          familySize: s.familySize ?? "",
          parentsOccupation: s.parentsOccupation || "",
          monthlyFamilyIncome: s.monthlyFamilyIncome || "",
          careerGoals: s.careerGoals || "",
          academicAchievements: s.academicAchievements || "",
          communityInvolvement: s.communityInvolvement || "",
          currentAcademicYear: s.currentAcademicYear || "",
          specificField: s.specificField || "",
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
      const payload = {
        ...form,
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
    return calculateProfileCompleteness(form);
  }, [form]);

  if (loading) {
    return <Card className="p-6">Loading profile…</Card>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Profile</h1>

      <Card className={`p-4 border ${completeness.isComplete && !completeness.hasValidationErrors ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="text-sm text-slate-800">
          Profile completeness: <strong>{completeness.percent}%</strong>
          <div className="mt-1 text-slate-600">
            {getCompletionMessage(completeness)}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          {/* CNIC */}
          <div>
            <label className="block text-sm mb-1">CNIC</label>
            <Input
              value={form.cnic}
              onChange={(e) => setVal("cnic", formatCNIC(e.target.value))}
              placeholder="12345-1234567-1"
              className="rounded-2xl"
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
            <label className="block text-sm mb-1">Date of Birth</label>
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setVal("dateOfBirth", e.target.value)}
              className="rounded-2xl"
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
            <label className="block text-sm mb-1">Guardian Name</label>
            <Input
              value={form.guardianName}
              onChange={(e) => setVal("guardianName", e.target.value)}
              className="rounded-2xl"
            />
            {errors.guardianName && (
              <p className="text-xs text-rose-600 mt-1">
                {errors.guardianName}
              </p>
            )}
          </div>

          {/* Guardian CNIC */}
          <div>
            <label className="block text-sm mb-1">Guardian CNIC</label>
            <Input
              value={form.guardianCnic}
              onChange={(e) =>
                setVal("guardianCnic", formatCNIC(e.target.value))
              }
              placeholder="12345-1234567-1"
              className="rounded-2xl"
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

          {/* Phone */}
          <div>
            <label className="block text-sm mb-1">Phone</label>
            <Input
              value={form.phone}
              onChange={(e) => setVal("phone", e.target.value)}
              placeholder="+92XXXXXXXXXX or 03XXXXXXXXX"
              className="rounded-2xl"
            />
            {errors.phone && (
              <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Address */}
          <div className="md:col-span-1">
            <label className="block text-sm mb-1">Address</label>
            <textarea
              rows={3}
              value={form.address}
              onChange={(e) => setVal("address", e.target.value)}
              className="w-full rounded-2xl border px-3 py-2 text-sm"
              placeholder="House number, Street name/number, name of area"
            />
            {errors.address && (
              <p className="text-xs text-rose-600 mt-1">{errors.address}</p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-sm mb-1">City</label>
            <Input
              value={form.city}
              onChange={(e) => setVal("city", e.target.value)}
              className="rounded-2xl"
            />
            {errors.city && (
              <p className="text-xs text-rose-600 mt-1">{errors.city}</p>
            )}
          </div>

          {/* Province */}
          <div>
            <label className="block text-sm mb-1">Province</label>
            <select
              className="rounded-2xl border border-gray-300 px-3 py-2 text-sm w-full"
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

          {/* Current Education Section Header */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Current Education</h3>
          </div>

          {/* Current Institution */}
          <div>
            <label className="block text-sm mb-1">Current Institution</label>
            <Input
              value={form.currentInstitution}
              onChange={(e) => setVal("currentInstitution", e.target.value)}
              className="rounded-2xl"
              placeholder="e.g., ABC College"
            />
            {errors.currentInstitution && (
              <p className="text-xs text-rose-600 mt-1">{errors.currentInstitution}</p>
            )}
          </div>

          {/* Current City */}
          <div>
            <label className="block text-sm mb-1">Current Institution City</label>
            <Input
              value={form.currentCity}
              onChange={(e) => setVal("currentCity", e.target.value)}
              className="rounded-2xl"
              placeholder="e.g., Lahore"
            />
            {errors.currentCity && (
              <p className="text-xs text-rose-600 mt-1">{errors.currentCity}</p>
            )}
          </div>

          {/* Current Completion Year */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Year of Completion (Current Education)</label>
            <Input
              type="number"
              value={form.currentCompletionYear}
              onChange={(e) => setVal("currentCompletionYear", e.target.value)}
              className="rounded-2xl"
              placeholder="e.g., 2024"
            />
            {errors.currentCompletionYear && (
              <p className="text-xs text-rose-600 mt-1">{errors.currentCompletionYear}</p>
            )}
          </div>

          {/* Future Education Section Header */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Future Education</h3>
          </div>

          {/* University */}
          <div>
            <label className="block text-sm mb-1">University</label>
            <Input
              value={form.university}
              onChange={(e) => setVal("university", e.target.value)}
              className="rounded-2xl"
            />
            {errors.university && (
              <p className="text-xs text-rose-600 mt-1">{errors.university}</p>
            )}
          </div>

          {/* Program */}
          <div>
            <label className="block text-sm mb-1">Program</label>
            <Input
              value={form.program}
              onChange={(e) => setVal("program", e.target.value)}
              className="rounded-2xl"
            />
            {errors.program && (
              <p className="text-xs text-rose-600 mt-1">{errors.program}</p>
            )}
          </div>

          {/* GPA */}
          <div>
            <label className="block text-sm mb-1">GPA (4.00 scale only)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="4"
              value={form.gpa}
              onChange={(e) => setVal("gpa", e.target.value)}
              className="rounded-2xl"
              placeholder="e.g., 3.4 (convert from percentage if needed)"
            />
            <p className="text-xs text-slate-500 mt-1">Use 4.00 scale format. Need help converting? 85% ≈ 3.4, 90% ≈ 3.6</p>
            {errors.gpa ? (
              <p className="text-xs text-rose-600 mt-1">{errors.gpa}</p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Use 4.00 scale</p>
            )}
          </div>

          {/* Graduation Year */}
          <div>
            <label className="block text-sm mb-1">Graduation Year</label>
            <Input
              type="number"
              value={form.gradYear}
              onChange={(e) => setVal("gradYear", e.target.value)}
              className="rounded-2xl"
            />
            {errors.gradYear && (
              <p className="text-xs text-rose-600 mt-1">{errors.gradYear}</p>
            )}
          </div>

          {/* Personal Introduction Section Header */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Personal Introduction</h3>
          </div>

          {/* Personal Introduction */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">
              Tell us about yourself and your family <span className="text-gray-500">(This helps potential sponsors understand your story)</span>
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

          {/* Current Academic Year */}
          <div>
            <label className="block text-sm mb-1">Current Academic Year/Level</label>
            <select
              className="rounded-2xl border border-gray-300 px-3 py-2 text-sm w-full"
              value={form.currentAcademicYear}
              onChange={(e) => setVal("currentAcademicYear", e.target.value)}
            >
              <option value="">Select academic year</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="Final Year">Final Year</option>
              <option value="Masters 1st Year">Masters 1st Year</option>
              <option value="Masters 2nd Year">Masters 2nd Year</option>
              <option value="PhD">PhD</option>
            </select>
            {errors.currentAcademicYear && (
              <p className="text-xs text-rose-600 mt-1">{errors.currentAcademicYear}</p>
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
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Career Goals & Aspirations</label>
            <textarea
              className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Academic Achievements & Awards</label>
            <textarea
              className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Community Involvement & Leadership</label>
            <textarea
              className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={saving} className="rounded-2xl">
              {saving ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
