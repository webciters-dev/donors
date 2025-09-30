import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const ApplicationForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    // Step 1 — identity + credentials
    name: "",
    email: "",
    password: "",
    confirm: "",
    // Step 2 — education basics
    university: "",
    program: "",
    term: "Fall 2025",
    gender: "",
    city: "",
    province: "",
    gpa: "",
    gradYear: "",
    field: "",
    // NEW: currency (USD | PKR)
    currency: "USD",
    // Step 3 — requested amount
    amount: "",
  });

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  async function handleSubmit(e) {
    e.preventDefault();

    // basic validation
    if (!form.name || !form.email || !form.password) {
      toast.error("Please complete name, email, and password.");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!form.university || !form.program) {
      toast.error("Please complete university and program.");
      return;
    }
    const amountNum = Number(form.amount || 0);
    if (!amountNum || amountNum <= 0) {
      toast.error("Please enter a valid requested amount.");
      return;
    }

    try {
      setLoading(true);

      // (A) Create/Update STUDENT + User (we keep this as before; no currency needed here)
      const regRes = await fetch(`${API}/api/auth/register-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          university: form.university.trim(),
          program: form.program.trim(),
          term: form.term,
          gender: form.gender || undefined,
          city: form.city || undefined,
          province: form.province || undefined,
          gpa: form.gpa ? Number(form.gpa) : undefined,
          gradYear: form.gradYear ? Number(form.gradYear) : undefined,
          field: form.field || undefined,
          // omit needUSD here; application will carry the request amount
        }),
      });

      if (!regRes.ok) {
        const text = await regRes.text();
        throw new Error(text || "Failed to register student");
      }
      const regJson = await regRes.json();
      const studentId = regJson?.studentId;
      if (!studentId) throw new Error("Student id missing from register response.");

      // (B) Create APPLICATION with currency + amount in correct field
      const payload = {
        studentId,
        term: form.term || "Fall 2025",
        currency: form.currency, // "USD" or "PKR"
      };
      if (form.currency === "PKR") {
        payload.needPKR = amountNum;
      } else {
        payload.needUSD = amountNum;
      }

      const appRes = await fetch(`${API}/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!appRes.ok) {
        const text = await appRes.text();
        throw new Error(text || "Failed to create application");
      }

      // (C) Auto-login with the new credentials
      try {
        const loginRes = await fetch(`${API}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email.trim(), password: form.password }),
        });
        if (loginRes.ok) {
          const loginJson = await loginRes.json();
          if (loginJson?.token && loginJson?.user) {
            login({ token: loginJson.token, user: loginJson.user });
          }
        }
      } catch (e) {
        // non-fatal: if login fails, user can log in manually
      }

      toast.success("🎉 Application submitted and account created!");
      navigate("/my-application");

      // reset
      setForm({
        name: "",
        email: "",
        password: "",
        confirm: "",
        university: "",
        program: "",
        term: "Fall 2025",
        gender: "",
        city: "",
        province: "",
        gpa: "",
        gradYear: "",
        field: "",
        currency: "USD",
        amount: "",
      });
      setStep(1);
    } catch (err) {
      console.error(err);
      toast.error(typeof err?.message === "string" ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Student Application</h1>

      <Card className="p-6 space-y-6">
        {/* stepper */}
        <div className="flex items-center gap-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-8 w-8 rounded-full grid place-items-center text-sm ${
                n <= step ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              {n}
            </div>
          ))}
        </div>

        {/* STEP 1 — identity + credentials */}
        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="Your Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Your Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Create Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Input
              placeholder="Confirm Password"
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />

            <div className="md:col-span-2 flex justify-end">
              <Button
                onClick={next}
                disabled={!form.name || !form.email || !form.password || form.password !== form.confirm}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2 — education basics */}
        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="University"
              value={form.university}
              onChange={(e) => setForm({ ...form, university: e.target.value })}
            />
            <Input
              placeholder="Program"
              value={form.program}
              onChange={(e) => setForm({ ...form, program: e.target.value })}
            />
            <Input
              placeholder="Term (e.g., Fall 2025)"
              value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value })}
            />

            {/* optional extras */}
            <Input
              placeholder="City (optional)"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <Input
              placeholder="Province (optional)"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
            />
            <Input
              placeholder="GPA (optional)"
              type="number"
              step="0.01"
              value={form.gpa}
              onChange={(e) => setForm({ ...form, gpa: e.target.value })}
            />
            <Input
              placeholder="Graduation Year (optional)"
              type="number"
              value={form.gradYear}
              onChange={(e) => setForm({ ...form, gradYear: e.target.value })}
            />
            <Input
              placeholder="Field (optional)"
              value={form.field}
              onChange={(e) => setForm({ ...form, field: e.target.value })}
            />

            <div className="md:col-span-2 flex justify-between">
              <Button variant="outline" onClick={back}>
                Back
              </Button>
              <Button onClick={next} disabled={!form.university || !form.program || !form.term}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — currency + amount + review + submit */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 items-center">
              {/* Currency selector */}
              <select
                className="rounded-2xl border px-3 py-2 text-sm"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                <option value="USD">USD</option>
                <option value="PKR">PKR</option>
              </select>

              {/* Amount field */}
              <Input
                placeholder={`Requested Amount (${form.currency})`}
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>

            <div className="rounded-lg border p-4 text-sm">
              <p className="mb-2 text-slate-600">Please review your application before submitting.</p>
              <p><strong>Name:</strong> {form.name || "[Your Name]"}</p>
              <p><strong>Email:</strong> {form.email || "[Your Email]"}</p>
              <p><strong>University:</strong> {form.university || "[Your University]"}</p>
              <p><strong>Program:</strong> {form.program || "[Your Program]"}</p>
              <p><strong>Term:</strong> {form.term || "[Term]"}</p>
              <p><strong>Amount:</strong> {form.amount || "[Amount]"} {form.currency}</p>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={back}>
                Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
