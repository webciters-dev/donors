// src/pages/StudentProfile.jsx
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { studentProfileAcademicSchema } from "@/schemas/studentProfileAcademic.schema";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

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
    university: "",
    program: "",
    gpa: "",
    gradYear: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Load current student profile
  useEffect(() => {
    let dead = false;
    async function load() {
      try {
        const res = await fetch(`${API}/api/students/me`, {
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
          university: s.university || "",
          program: s.program || "",
          gpa: s.gpa ?? "",
          gradYear: s.gradYear ?? "",
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
        dateOfBirth: form.dateOfBirth
          ? new Date(form.dateOfBirth).toISOString()
          : null,
      };

      const res = await fetch(`${API}/api/students/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());

      toast.success("Profile updated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  const completeness = useMemo(() => {
    const missing = REQUIRED_KEYS.filter((k) => {
      const v = form?.[k];
      return v === null || v === undefined || v === "" || Number.isNaN(v);
    });
    const filled = REQUIRED_KEYS.length - missing.length;
    const percent = Math.round((filled / REQUIRED_KEYS.length) * 100);
    return { percent, missing };
  }, [form]);

  if (loading) {
    return <Card className="p-6">Loading profile…</Card>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Profile</h1>

      <Card className="p-4 bg-slate-50 border-slate-200">
        <div className="text-sm text-slate-800">
          Profile completeness: <strong>{completeness.percent}%</strong>
          {completeness.percent < 100 && (
            <span className="text-slate-600">
              {" "}
              — Missing: {completeness.missing.join(", ")}
            </span>
          )}
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
              <p className="text-xs text-slate-500 mt-1">YYYY-MM-DD</p>
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
              placeholder="Street, City"
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
            <Input
              value={form.province}
              onChange={(e) => setVal("province", e.target.value)}
              className="rounded-2xl"
              placeholder="Punjab, Sindh, KPK, Balochistan, Islamabad"
            />
            {errors.province && (
              <p className="text-xs text-rose-600 mt-1">{errors.province}</p>
            )}
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
            <label className="block text-sm mb-1">GPA (0.00–4.00)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="4"
              value={form.gpa}
              onChange={(e) => setVal("gpa", e.target.value)}
              className="rounded-2xl"
            />
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
