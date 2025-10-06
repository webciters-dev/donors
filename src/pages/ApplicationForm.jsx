import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getCurrencyFromCountry } from "@/lib/currency";
import { Eye, EyeOff } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Password input component with visibility toggle - moved outside to prevent re-creation
const PasswordInput = ({ placeholder, value, onChange, show, setShow }) => (
  <div className="relative">
    <Input
      type={show ? "text" : "password"}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="pr-10"
    />
    <button
      type="button"
      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
      onClick={() => setShow(!show)}
    >
      {show ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </button>
  </div>
);

export const ApplicationForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    country: "", // Country where university is located (required)
    gpa: "",
    gradYear: "",
    // Currency (auto-selected based on country)
    currency: "PKR", // Default to PKR for our primary market
    // Step 3 — requested amount
    amount: "",
  });

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  // Handle country change and automatically update currency
  const handleCountryChange = (selectedCountry) => {
    const newCurrency = getCurrencyFromCountry(selectedCountry);
    setForm({ 
      ...form, 
      country: selectedCountry,
      currency: newCurrency 
    });
  };

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
    if (!form.university || !form.program || !form.country || !form.gpa || !form.gradYear) {
      toast.error("Please complete all required fields: university, program, country, GPA, and graduation year.");
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
          // country: form.country.trim(), // Will be stored in application instead
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
        country: form.country, // Store country in application for now
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
        country: "",
        province: "",
        gpa: "",
        gradYear: "",
        field: "",
        currency: "PKR", // Default to PKR for our primary market
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
            <PasswordInput
              placeholder="Create Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              show={showPassword}
              setShow={setShowPassword}
            />
            <PasswordInput
              placeholder="Confirm Password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              show={showConfirmPassword}
              setShow={setShowConfirmPassword}
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
              placeholder="Target university name (e.g., LUMS, Harvard University)"
              value={form.university}
              onChange={(e) => setForm({ ...form, university: e.target.value })}
              required
            />
            <Input
              placeholder="Specific degree program (e.g., Bachelor of Computer Science, MBA)"
              value={form.program}
              onChange={(e) => setForm({ ...form, program: e.target.value })}
              required
            />
            <Input
              placeholder="Term (e.g., Fall 2025)"
              value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value })}
            />

            {/* Country - searchable input with datalist */}
            <div className="relative">
              <Input
                placeholder="Country where target university is located (type to search)"
                value={form.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                list="countries"
                required
              />
              <datalist id="countries">
                <option value="Pakistan">🇵🇰 Pakistan</option>
                <option value="USA">🇺🇸 United States</option>
                <option value="Canada">🇨🇦 Canada</option>
                <option value="UK">🇬🇧 United Kingdom</option>
                <option value="Germany">🇩🇪 Germany</option>
                <option value="France">🇫🇷 France</option>
                <option value="Italy">🇮🇹 Italy</option>
                <option value="Spain">🇪🇸 Spain</option>
                <option value="Netherlands">🇳🇱 Netherlands</option>
                <option value="Belgium">🇧🇪 Belgium</option>
                <option value="Austria">🇦🇹 Austria</option>
                <option value="Portugal">🇵🇹 Portugal</option>
                <option value="Ireland">🇮🇪 Ireland</option>
                <option value="Finland">🇫🇮 Finland</option>
                <option value="Greece">🇬🇷 Greece</option>
                <option value="Australia">�🇺 Australia</option>
                <option value="Japan">🇯🇵 Japan</option>
                <option value="South Korea">🇰🇷 South Korea</option>
                <option value="Singapore">🇸🇬 Singapore</option>
                <option value="Switzerland">🇨🇭 Switzerland</option>
                <option value="Norway">🇳🇴 Norway</option>
                <option value="Sweden">🇸🇪 Sweden</option>
                <option value="Denmark">🇩🇰 Denmark</option>
                <option value="Other">🌍 Other Country</option>
              </datalist>
            </div>
            <Input
              placeholder="Current GPA (e.g., 3.5/4.0 or 85%)"
              value={form.gpa}
              onChange={(e) => setForm({ ...form, gpa: e.target.value })}
              required
            />
            <Input
              placeholder="Expected graduation year (e.g., 2027)"
              type="number"
              min="2024"
              max="2035"
              value={form.gradYear}
              onChange={(e) => setForm({ ...form, gradYear: e.target.value })}
              required
            />

            <div className="md:col-span-2 flex justify-between">
              <Button variant="outline" onClick={back}>
                Back
              </Button>
              <Button onClick={next} disabled={!form.university || !form.program || !form.term || !form.country || !form.gpa || !form.gradYear}>
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
              <div className="space-y-1">
                <select
                  className="w-full rounded-2xl border px-3 py-2 text-sm"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  <option value="USD">🇺🇸 USD - US Dollar</option>
                  <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                  <option value="GBP">🇬🇧 GBP - British Pound</option>
                  <option value="EUR">🇪🇺 EUR - Euro</option>
                  <option value="PKR">🇵🇰 PKR - Pakistani Rupee</option>
                </select>
                {form.country && (
                  <p className="text-xs text-green-600">
                    ✓ Auto-selected based on {form.country}
                  </p>
                )}
              </div>

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
              <p><strong>Country:</strong> {form.country || "[University Country]"}</p>
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
