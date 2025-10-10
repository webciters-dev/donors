import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getCurrencyFromCountry } from "@/lib/currency";
import { Eye, EyeOff, LogIn } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Password input component with visibility toggle
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
  const location = useLocation();
  const { login, user, token } = useAuth();
  
  // Read step from URL parameter or default to 1
  const getInitialStep = () => {
    const searchParams = new URLSearchParams(location.search);
    const urlStep = parseInt(searchParams.get('step'));
    
    // If user is already logged in and URL has step=2, start at step 2
    if (user && urlStep === 2) {
      return 2;
    }
    
    return 1;
  };
  
  const [step, setStep] = useState(getInitialStep());
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistered, setIsRegistered] = useState(!!user); // If user exists, they're registered
  const [studentId, setStudentId] = useState(user?.id || null); // Use existing user ID

  // Debug logging
  useEffect(() => {
    console.log("Current user:", user);
    console.log("Student ID:", studentId);
  }, [user, studentId]);
    
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlStep = parseInt(searchParams.get('step'));
    
    if (user && urlStep === 2) {
      setStep(2);
      setIsRegistered(true);
      setStudentId(user.id);
    }
  }, [location.search, user]);

  const [form, setForm] = useState(() => ({
    // Step 1 — identity + credentials
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    confirm: "",
    gender: "",
    // Step 2 — education basics
    country: "", // Country where university is located (required)
    university: "",
    customUniversity: "", // For "Other" option
    program: "",
    term: "", // User enters their own program start term
    gpa: "",
    gradYear: "",
    // Currency (auto-selected based on country)
    currency: "PKR", // Default to PKR for our primary market
    // Step 3 — requested amount
    amount: "",
  }));

  // Debug form state
  useEffect(() => {
    console.log("🔍 Debug - user object:", user);
    console.log("🔍 Debug - form.name:", form.name);
    console.log("🔍 Debug - user?.name:", user?.name);
  }, [user, form.name]);

  // Update form when user data loads
  useEffect(() => {
    if (user?.name) {
      setForm(prev => ({
        ...prev,
        name: user.name,
        email: user.email || prev.email
      }));
    }
  }, [user?.name, user?.email]);

  // Handle Student Registration at Step 1
  const handleStep1Registration = async () => {
    // Validation
    if (!form.name || !form.email || !form.password || !form.gender) {
      toast.error("Please complete all fields.");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      // Register student using the correct endpoint
      const regRes = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: "STUDENT" // This is key!
        }),
      });

      if (!regRes.ok) {
        const errorData = await regRes.json();
        throw new Error(errorData.error || "Failed to create account");
      }

      const regJson = await regRes.json();
      
      // Auto-login after successful registration
      try {
        const loginRes = await fetch(`${API}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: form.email.trim().toLowerCase(), 
            password: form.password 
          }),
        });
        
        if (loginRes.ok) {
          const loginJson = await loginRes.json();
          if (loginJson?.token && loginJson?.user) {
            login({ token: loginJson.token, user: loginJson.user });
            setStudentId(loginJson.user.id);
          }
        }
      } catch (loginError) {
        console.error("Auto-login failed:", loginError);
      }

      setIsRegistered(true);
      toast.success("✅ Account created successfully! Please continue with your application.");
      
      // Move to Step 2
      setStep(2);

    } catch (err) {
      console.error("Registration error:", err);
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  // Handle Student Login (for returning applicants)
  const handleStudentLogin = () => {
    navigate("/login");
  };

  const next = () => setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  // Universities by country
  const universitiesByCountry = {
    "Pakistan": [
      "LUMS - Lahore University of Management Sciences",
      "IBA Karachi - Institute of Business Administration",
      "NUST - National University of Sciences and Technology",
      "Punjab University",
      "Karachi University",
      "Quaid-i-Azam University",
      "COMSATS University",
      "University of Engineering and Technology (UET) Lahore",
      "Aga Khan University",
      "Habib University"
    ],
    "USA": [
      "Harvard University",
      "Stanford University",
      "MIT - Massachusetts Institute of Technology",
      "University of California, Berkeley",
      "Yale University",
      "Princeton University",
      "Columbia University",
      "University of Pennsylvania",
      "Cornell University",
      "University of Chicago"
    ],
    "UK": [
      "University of Oxford",
      "University of Cambridge",
      "Imperial College London",
      "London School of Economics",
      "University College London",
      "King's College London",
      "University of Edinburgh",
      "University of Manchester",
      "University of Warwick",
      "University of Bristol"
    ],
    "Canada": [
      "University of Toronto",
      "McGill University",
      "University of British Columbia",
      "University of Alberta",
      "McMaster University",
      "University of Waterloo",
      "Queen's University",
      "University of Montreal",
      "University of Calgary",
      "Simon Fraser University"
    ]
  };

  // Country matching helper
  const matchCountry = (input) => {
    const countries = {
      "Pakistan": ["pakistan", "pk", "پاکستان"],
      "USA": ["usa", "united states", "america", "us"],
      "UK": ["uk", "united kingdom", "britain", "england"],
      "Canada": ["canada", "ca"],
      "Germany": ["germany", "de", "deutschland"],
      "France": ["france", "fr"],
      "Italy": ["italy", "it"],
      "Spain": ["spain", "es"],
      "Netherlands": ["netherlands", "nl", "holland"],
      "Belgium": ["belgium", "be"],
      "Austria": ["austria", "at"],
      "Australia": ["australia", "au", "aussie"]
    };

    const inputLower = input.toLowerCase().trim();
    
    // First, check for exact match
    for (const [country, aliases] of Object.entries(countries)) {
      if (country.toLowerCase() === inputLower || aliases.includes(inputLower)) {
        return country;
      }
    }
    
    // Return original input if no match found
    return input;
  };

  // Handle country change and automatically update currency
  const handleCountryChange = (inputValue) => {
    const matchedCountry = matchCountry(inputValue);
    const newCurrency = getCurrencyFromCountry(matchedCountry);
    
    setForm({ 
      ...form, 
      country: matchedCountry,
      currency: newCurrency,
      university: "", // Reset university when country changes
      customUniversity: "" // Reset custom university
    });
  };

  // Handle university change
  const handleUniversityChange = (selectedUniversity) => {
    setForm({
      ...form,
      university: selectedUniversity,
      customUniversity: selectedUniversity === "Other" ? "" : "" // Clear custom field if not "Other"
    });
  };

  // Final Application Submission (Step 3)
  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (!form.university || !form.program || !form.country || !form.gpa || !form.gradYear) {
      console.log("❌ Validation failed:", {
        university: form.university,
        program: form.program, 
        country: form.country,
        gpa: form.gpa,
        gradYear: form.gradYear
      });
      toast.error("Please complete all required fields: university, program, country, GPA, and graduation year.");
      return;
    }
    
    // Validate term field too
    if (!form.term) {
      console.log("❌ Term validation failed:", form.term);
      toast.error("Please specify when your program starts (e.g., Spring 2025, Fall 2025).");
      return;
    }
    const amountNum = Number(form.amount || 0);
    if (!amountNum || amountNum <= 0) {
      toast.error("Please enter a valid requested amount.");
      return;
    }

    // Ensure we have a valid studentId
    const currentStudentId = user?.id || studentId;
    if (!currentStudentId) {
      toast.error("Unable to identify student. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      // Create APPLICATION with currency + amount
      const finalUniversity = form.university === "Other" ? form.customUniversity : form.university;
      
      const payload = {
        studentId: currentStudentId, // Use current user ID
        term: form.term || "Not specified",
        currency: form.currency,
        country: form.country,
        university: finalUniversity.trim(),
        program: form.program.trim(),
        gpa: form.gpa ? Number(form.gpa) : undefined,
        gradYear: form.gradYear ? Number(form.gradYear) : undefined,
      };
      
      // Add amount based on currency
      if (form.currency === "PKR") {
        payload.needPKR = amountNum;
      } else {
        payload.needUSD = amountNum;
      }

      console.log("Submitting application with payload:", payload); // Debug log

      const headers = {
        "Content-Type": "application/json"
      };
      
      // Add authorization header if token exists
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      console.log("🔑 Auth token present:", !!token);
      console.log("👤 User ID:", currentStudentId);

      const appRes = await fetch(`${API}/api/applications`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!appRes.ok) {
        let errorData;
        try {
          errorData = await appRes.json();
        } catch (parseError) {
          console.error("❌ Failed to parse error response:", parseError);
          throw new Error(`HTTP ${appRes.status}: ${appRes.statusText}`);
        }
        
        console.error("❌ Application submission error:", {
          status: appRes.status,
          statusText: appRes.statusText,
          error: errorData
        });
        
        throw new Error(errorData.error || errorData.message || `Server error: ${appRes.status}`);
      }

      toast.success("🎉 Application submitted successfully!");
      navigate("/my-application");

    } catch (err) {
      console.error("Application submission error:", err);
      toast.error(err.message || "Submission failed");
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
          <div className="space-y-6">
            {/* Student Login Option */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900">Already have an account?</h3>
                  <p className="text-sm text-blue-700">Sign in to continue your application</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleStudentLogin}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Student Login
                </Button>
              </div>
            </div>

            {/* Registration Form */}
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                placeholder="Your Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                placeholder="Your Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
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
              
              <select
                className="rounded-2xl border px-3 py-2 text-sm"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                required
              >
                <option value="">Select Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>

              <div className="md:col-span-2 flex justify-end">
                <Button
                  onClick={handleStep1Registration}
                  disabled={loading || !form.name || !form.email || !form.password || form.password !== form.confirm || !form.gender}
                >
                  {loading ? "Creating Account..." : "Create Account & Continue"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — education basics */}
        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Country Selection - Searchable Input */}
            <div className="md:col-span-2">
              <Input
                placeholder="Country where target university is located (type to search: pk, pakistan, usa, uk...)"
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
                <option value="Australia">🇦🇺 Australia</option>
                <option value="Other">🌍 Other Country</option>
              </datalist>
              {form.country && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Currency auto-selected: {form.currency}
                </p>
              )}
            </div>

            {/* University Selection - Shows after country is selected */}
            {form.country && (
              <div className="md:col-span-2">
                <Input
                  placeholder="Select or type university name"
                  value={form.university}
                  onChange={(e) => handleUniversityChange(e.target.value)}
                  list="universities"
                  required
                />
                <datalist id="universities">
                  {universitiesByCountry[form.country]?.map((uni) => (
                    <option key={uni} value={uni}>{uni}</option>
                  ))}
                  <option value="Other">🏫 Other University (not listed)</option>
                </datalist>
              </div>
            )}

            {/* Custom University Input - Shows when "Other" is selected */}
            {form.university === "Other" && (
              <div className="md:col-span-2">
                <Input
                  placeholder="Enter university name"
                  value={form.customUniversity}
                  onChange={(e) => setForm({ ...form, customUniversity: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Program Starts (Term) Field - New Position */}
            <Input
              placeholder="Program starts (e.g., Spring 2025, Fall 2025)"
              value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value })}
              required
            />

            {/* Graduation Year Field - New Position */}
            <Input
              placeholder="Expected graduation year (e.g., 2027)"
              type="number"
              min="2024"
              max="2035"
              value={form.gradYear}
              onChange={(e) => setForm({ ...form, gradYear: e.target.value })}
              required
            />

            {/* Specific Degree Program Field - New Position */}
            <Input
              placeholder="Specific degree program (e.g., Bachelor of Computer Science, MBA)"
              value={form.program}
              onChange={(e) => setForm({ ...form, program: e.target.value })}
              required
            />

            {/* GPA Field - Last Position */}
            <Input
              placeholder="Current GPA (e.g., 3.5/4.0 or 85%)"
              value={form.gpa}
              onChange={(e) => setForm({ ...form, gpa: e.target.value })}
              required
            />

            <div className="md:col-span-2 flex justify-between">
              <Button variant="outline" onClick={back} disabled={user ? false : true}>
                Back
              </Button>
              <Button 
                onClick={next} 
                disabled={
                  !form.country || 
                  !form.university || 
                  (form.university === "Other" && !form.customUniversity) ||
                  !form.program || 
                  !form.term || 
                  !form.gpa || 
                  !form.gradYear
                }
              >
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
              <p><strong>Name:</strong> {user?.name || form.name || "[Your Name]"}</p>
              <p><strong>Email:</strong> {user?.email || form.email || "[Your Email]"}</p>
              <p><strong>Country:</strong> {form.country || "[University Country]"}</p>
              <p><strong>University:</strong> {form.university === "Other" ? form.customUniversity : form.university || "[Your University]"}</p>
              <p><strong>Program:</strong> {form.program || "[Your Program]"}</p>
              <p><strong>Term:</strong> {form.term || "[Term]"}</p>
              <p><strong>Amount:</strong> {form.amount || "[Amount]"} {form.currency}</p>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={back}>
                Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};