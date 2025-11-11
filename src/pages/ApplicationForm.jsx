import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getCurrencyFromCountry } from "@/lib/currency";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { API } from "@/lib/api";
import UniversitySelector from "@/components/UniversitySelector";
import PhotoUpload from "@/components/PhotoUpload";
import { 
  useUniversityAcademics,
  generateMonthYearOptions
} from "@/hooks/useUniversityAcademics";
import { getPakistanOnlyDatalist, getFilterMessage } from "@/lib/countryFilter";

// Password input component with visibility toggle
const PasswordInput = ({ placeholder, value, onChange, show, setShow }) => (
  <div className="relative">
    <Input
      type={show ? "text" : "password"}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="pr-10 min-h-[44px]"
    />
    <button
      type="button"
      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
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
    
    // If user is already logged in and URL has step parameter, start at that step
    if (user && (urlStep === 2 || urlStep === 3)) {
      return urlStep;
    }
    
    return 1;
  };
  
  const [step, setStep] = useState(getInitialStep());
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistered, setIsRegistered] = useState(!!user); // If user exists, they're registered
  const [studentId, setStudentId] = useState(user?.studentId || null); // Use existing student ID


    
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlStep = parseInt(searchParams.get('step'));
    
    if (user && (urlStep === 2 || urlStep === 3)) {
      setStep(urlStep);
      setIsRegistered(true);
      setStudentId(user.studentId);
    }
  }, [location.search, user]);

  const [form, setForm] = useState(() => {

    return {
      // Step 1 — identity + credentials
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      confirm: "",
      gender: "",
      personalIntroduction: "", // Personal introduction about student and family
      // Step 2 — education basics
      country: "", // Country where university is located (required)
      university: "",
      customUniversity: "", // For "Other" option
      degreeLevel: "", // Associate, Bachelor's, Master's, etc.
      field: "", // Agriculture, Computer Science, etc.
      program: "", // Specific program within the field
      startMonth: "", // Program start month
      startYear: "", // Program start year
      endMonth: "", // Program end month  
      endYear: "", // Program end year
      gpa: "",
      // Currency (auto-selected based on country)
      currency: "PKR", // Default to PKR for our primary market
      // Photo fields
      photoUrl: "",
      photoThumbnailUrl: "",
      photoUploadedAt: null,
      // Step 3 — financial details
      universityFee: "", // Tuition and academic fees
      livingExpenses: "", // Books, accommodation, food, transport, etc.
      totalExpense: "", // Auto-calculated (universityFee + livingExpenses)
      scholarshipAmount: "0", // Default to 0
      amount: "", // This will be auto-calculated (totalExpense - scholarshipAmount)
    };
  });





  // Update form when user data loads or changes
  useEffect(() => {
    if (user?.name) {

      setForm(prev => ({
        ...prev,
        name: user.name,
        email: user.email || prev.email
      }));
    }
  }, [user?.name, user?.email]);

  // Force form sync when user logs in and has name
  useEffect(() => {
    if (user && user.name && !form.name) {

      setForm(prev => ({
        ...prev,
        name: user.name,
        email: user.email || prev.email
      }));
    }
  }, [user, form.name]);



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
    if (!form.photoUrl) {
      toast.error("Please upload a photo to continue.");
      return;
    }

    try {
      setLoading(true);

      // Register student using the student-specific endpoint
      const regRes = await fetch(API.url('/api/auth/register-student'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          gender: form.gender,
          personalIntroduction: form.personalIntroduction.trim(),
          photoUrl: form.photoUrl,
          photoThumbnailUrl: form.photoThumbnailUrl,
          photoUploadedAt: form.photoUploadedAt,
          // These fields will be updated later in Step 2 & 3, but we need defaults
          university: "",
          program: "",
          country: "Pakistan",
          city: "",
          province: "",
          gpa: 0,
          gradYear: new Date().getFullYear() + 1,
          currency: "PKR",
          amount: 0,
          field: ""
        }),
      });

      if (!regRes.ok) {
        const errorData = await regRes.json();
        throw new Error(errorData.error || "Failed to create account");
      }

      const regJson = await regRes.json();
      
      // Auto-login after successful registration
      try {
        const loginRes = await fetch(API.url('/api/auth/login'), {
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
            // Use the studentId from the user object if it exists
            setStudentId(loginJson.user.studentId || loginJson.user.id);
          }
        }
      } catch (loginError) {
        console.error("Auto-login failed:", loginError);
      }

      setIsRegistered(true);
      
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

  // Generate month/year options for dropdowns
  const { months, years } = generateMonthYearOptions();
  
  // Get university ID from selected university name
  const [selectedUniversityId, setSelectedUniversityId] = useState(null);
  
  // Use the university academics hook
  const {
    degreeLevels,
    fields: availableFields,
    programs: availablePrograms,
    loading: academicLoading,
    error: academicError,
    fetchFields,
    fetchPrograms
  } = useUniversityAcademics(selectedUniversityId);

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
  const handleUniversityChange = (university, customUniversity, universityId) => {
    setForm({
      ...form,
      university,
      customUniversity,
      degreeLevel: "", // Reset dependent fields
      field: "",
      program: ""
    });
    
    // Set the university ID for fetching academic data
    setSelectedUniversityId(universityId);
  };

  // Handler for degree level change - resets dependent fields
  const handleDegreeLevelChange = (degreeLevel) => {
    setForm({
      ...form,
      degreeLevel,
      field: "", // Reset field when degree level changes
      program: "" // Reset program when degree level changes
    });
    
    // Fetch fields for the selected degree level
    if (degreeLevel) {
      fetchFields(degreeLevel);
    }
  };

  // Handler for field change - resets program
  const handleFieldChange = (field) => {
    setForm({
      ...form,
      field,
      program: "" // Reset program when field changes
    });
    
    // Fetch programs for the selected degree level and field
    if (field && form.degreeLevel) {
      fetchPrograms(form.degreeLevel, field);
    }
  };

  // Calculate required amount (Total Expense - Scholarship)
  const calculateRequiredAmount = (totalExpense, scholarshipAmount) => {
    const total = Number(totalExpense || 0);
    const scholarship = Number(scholarshipAmount || 0);
    return Math.max(0, total - scholarship); // Ensure non-negative
  };

  // Handle total expense change
  const handleTotalExpenseChange = (value) => {
    const newAmount = calculateRequiredAmount(value, form.scholarshipAmount);
    setForm({
      ...form,
      totalExpense: value,
      amount: newAmount.toString()
    });
  };

  // Handle scholarship amount change
  const handleScholarshipChange = (value) => {
    const total = Number(form.totalExpense || 0);
    const scholarship = Number(value || 0);
    
    // Prevent scholarship from being greater than total expense
    if (scholarship > total && total > 0) {
      toast.error("Scholarship amount cannot be greater than total expense.");
      return;
    }
    
    const newAmount = calculateRequiredAmount(form.totalExpense, value);
    setForm({
      ...form,
      scholarshipAmount: value,
      amount: newAmount.toString()
    });
  };

  // Handle university fee change
  const handleUniversityFeeChange = (value) => {
    const universityFee = Number(value || 0);
    const livingExpenses = Number(form.livingExpenses || 0);
    const newTotal = universityFee + livingExpenses;
    const newAmount = calculateRequiredAmount(newTotal.toString(), form.scholarshipAmount);
    
    setForm({
      ...form,
      universityFee: value,
      totalExpense: newTotal.toString(),
      amount: newAmount.toString()
    });
  };

  // Handle living expenses change
  const handleLivingExpensesChange = (value) => {
    const universityFee = Number(form.universityFee || 0);
    const livingExpenses = Number(value || 0);
    const newTotal = universityFee + livingExpenses;
    const newAmount = calculateRequiredAmount(newTotal.toString(), form.scholarshipAmount);
    
    setForm({
      ...form,
      livingExpenses: value,
      totalExpense: newTotal.toString(),
      amount: newAmount.toString()
    });
  };

  // Final Application Submission (Step 3)
  async function handleSubmit(e) {
    e.preventDefault();

    console.log("🔍 Form submission started with form data:", form);

    // Validation
    if (!form.university || !form.degreeLevel || !form.field || !form.program || !form.country || !form.gpa) {
      toast.error("Please complete all required fields: country, university, degree level, field, program, and GPA.");
      return;
    }

    // Validate date fields
    if (!form.startMonth || !form.startYear || !form.endMonth || !form.endYear) {
      toast.error("Please specify program start and end dates.");
      return;
    }

    // Validate that end date is after start date
    const startDate = new Date(parseInt(form.startYear), parseInt(form.startMonth) - 1);
    const endDate = new Date(parseInt(form.endYear), parseInt(form.endMonth) - 1);
    if (endDate <= startDate) {
      toast.error("Program end date must be after start date.");
      return;
    }

    // Validate financial fields
    const universityFeeNum = Number(form.universityFee || 0);
    const livingExpensesNum = Number(form.livingExpenses || 0);
    const totalExpenseNum = Number(form.totalExpense || 0);
    const scholarshipNum = Number(form.scholarshipAmount || 0);
    const requiredAmountNum = Number(form.amount || 0);

    if (!totalExpenseNum || totalExpenseNum <= 0) {
      toast.error("Please enter a valid total expense amount.");
      return;
    }

    if (scholarshipNum >= totalExpenseNum) {
      toast.error("Your scholarship covers your full expenses. You don't need additional funding!");
      return;
    }

    if (!requiredAmountNum || requiredAmountNum <= 0) {
      toast.error("Required amount must be greater than 0.");
      return;
    }

    // Ensure we have a valid studentId - use the student record ID, not user ID
    const currentStudentId = user?.studentId || studentId;
    if (!currentStudentId) {
      console.error("❌ No studentId found:", { 
        "user?.studentId": user?.studentId, 
        "studentId": studentId,
        "user": user 
      });
      toast.error("Unable to identify student profile. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      const finalUniversity = form.university === "Other" ? form.customUniversity : form.university;
      
      const headers = {
        "Content-Type": "application/json"
      };
      
      // Add authorization header if token exists
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }



      // Step 1: Update student profile with educational details
      const programStartDate = `${form.startMonth}/${form.startYear}`;
      const programEndDate = `${form.endMonth}/${form.endYear}`;
      
      const studentUpdatePayload = {
        country: form.country.trim(),
        university: finalUniversity.trim(),
        degreeLevel: form.degreeLevel,
        field: form.field.trim(),
        program: form.program.trim(),
        programStartDate,
        programEndDate,
        gpa: Number(form.gpa)
      };



      const studentRes = await fetch(API.url(`/api/students/${currentStudentId}`), {
        method: "PATCH",
        headers,
        body: JSON.stringify(studentUpdatePayload),
      });

      if (!studentRes.ok) {
        let studentError;
        try {
          studentError = await studentRes.json();
        } catch (parseError) {
          console.error("❌ Failed to parse student update error:", parseError);
          throw new Error(`Student update failed: HTTP ${studentRes.status}`);
        }
        
        console.error("❌ Student update failed:", {
          status: studentRes.status,
          statusText: studentRes.statusText,
          error: studentError,
          payload: studentUpdatePayload,
          studentId: currentStudentId,
          hasToken: !!token
        });
        
        throw new Error(studentError.error || studentError.message || "Failed to update student profile");
      }



      // Step 2: Create application with financial details
      const applicationPayload = {
        studentId: currentStudentId,
        term: form.term || "Not specified",
        currency: form.currency,
        // Add the new financial breakdown
        universityFee: universityFeeNum,
        livingExpenses: livingExpensesNum,
        totalExpense: totalExpenseNum,
        scholarshipAmount: scholarshipNum,
        amount: requiredAmountNum
      };
      
      console.log("🔍 Application payload:", applicationPayload);

      const appRes = await fetch(API.url('/api/applications'), {
        method: "POST",
        headers,
        body: JSON.stringify(applicationPayload),
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
          error: errorData,
          payload: applicationPayload
        });
        
        throw new Error(errorData.error || errorData.message || `Server error: ${appRes.status}`);
      }

      toast.success("🎉 Application submitted successfully!");
      
      // Small delay to ensure application is created before navigation
      setTimeout(() => {
        navigate("/my-application", { replace: true });
      }, 1000);

    } catch (err) {
      console.error("Application submission error:", err);
      toast.error(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <h1 className="text-xl sm:text-2xl font-semibold">Student Application</h1>

      {/* Pakistan-only filter message - Only show in Step 1 */}
      {step === 1 && (() => {
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

      {/* Student Login Option - Only show in Step 1 */}
      {step === 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-medium text-blue-900">Already have an account?</h3>
              <p className="text-xs sm:text-sm text-blue-700">Sign in to continue your application</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleStudentLogin}
              className="border-blue-300 text-blue-700 hover:bg-blue-100 min-h-[44px] w-full sm:w-auto"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Student Login
            </Button>
          </div>
        </div>
      )}

      <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6 hover:shadow-lg transition-shadow duration-300">
        {/* stepper */}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full grid place-items-center text-xs sm:text-sm ${
                n <= step ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {n}
            </div>
          ))}
        </div>

        {/* STEP 1 — identity + credentials */}
        {step === 1 && (
          <div className="space-y-4 sm:space-y-6">

            {/* Registration Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                placeholder="Your Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="min-h-[44px]"
              />
              <Input
                placeholder="Your Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="min-h-[44px]"
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
                className="rounded-2xl border px-3 py-2 text-sm min-h-[44px] w-full"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                required
              >
                <option value="">Select Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Personal Introduction */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Tell us about yourself and your family <span className="text-gray-500">(Optional but recommended)</span>
              </label>
              <textarea
                className="w-full rounded-2xl border px-3 py-2 text-sm resize-none min-h-[44px]"
                rows={4}
                placeholder="Share a brief introduction about yourself, your background, family situation, interests, and what motivates you to pursue higher education. This helps potential sponsors understand your story better."
                value={form.personalIntroduction}
                onChange={(e) => setForm({ ...form, personalIntroduction: e.target.value })}
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 text-right">
                {form.personalIntroduction.length}/1000 characters
              </div>
            </div>

            {/* Photo Upload */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                Your Photo <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Upload a clear photo of yourself. This will be visible to potential sponsors and administrators.
              </p>
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
                required={true}
              />
            </div>

            <div className="sm:col-span-2 flex flex-col sm:flex-row justify-end">
              <Button
                onClick={handleStep1Registration}
                disabled={loading || !form.name || !form.email || !form.password || form.password !== form.confirm || !form.gender || !form.photoUrl}
                className="min-h-[44px] w-full sm:w-auto"
              >
                {loading ? "Creating Account..." : "Create Account & Continue"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2 — education basics */}
        {step === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Country Selection - Searchable Input */}
            <div className="sm:col-span-2">
              <Input
                placeholder="Country where target university is located (type to search: pk, pakistan, usa, uk...)"
                value={form.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                list="countries"
                required
                className="min-h-[44px]"
              />
              <datalist id="countries">
                {(() => {
                  const pakistanOnlyList = getPakistanOnlyDatalist();
                  if (pakistanOnlyList) {
                    // Show only Pakistan in filtered mode
                    return pakistanOnlyList.map((country) => (
                      <option key={country.value} value={country.value}>
                        {country.label}
                      </option>
                    ));
                  } else {
                    // Show full country list when filter disabled
                    return (
                      <>
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
                      </>
                    );
                  }
                })()}
              </datalist>
              {form.country && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Currency auto-selected: {form.currency}
                </p>
              )}
            </div>

            {/* University Selection - Shows after country is selected */}
            {form.country && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">University</label>
                <UniversitySelector
                  country={form.country}
                  value={form.university}
                  customValue={form.customUniversity}
                  onChange={handleUniversityChange}
                  required={true}
                  placeholder="Select or type university name"
                  className="min-h-[44px]"
                />
              </div>
            )}

            {/* Degree Level Selection - Shows after university is selected */}
            {form.university && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">Degree Level</label>
                <select
                  value={form.degreeLevel}
                  onChange={(e) => handleDegreeLevelChange(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={academicLoading.degreeLevels}
                >
                  <option value="">
                    {academicLoading.degreeLevels ? 'Loading...' : 'Select degree level'}
                  </option>
                  {degreeLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Field Selection - Shows after degree level is selected */}
            {form.degreeLevel && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">Field of Study</label>
                <select
                  value={form.field}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={academicLoading.fields}
                >
                  <option value="">
                    {academicLoading.fields ? 'Loading...' : 'Select field of study'}
                  </option>
                  {availableFields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Program Selection - Shows after field is selected */}
            {form.field && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2">Specific Program</label>
                <select
                  value={form.program}
                  onChange={(e) => setForm({ ...form, program: e.target.value })}
                  required
                  className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={academicLoading.programs}
                >
                  <option value="">
                    {academicLoading.programs ? 'Loading...' : 'Select specific program'}
                  </option>
                  {availablePrograms.map((program) => (
                    <option key={program} value={program}>
                      {program}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Program Start Date - Shows after program is selected */}
            {form.program && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Program Start Date</label>
                  <div className="flex gap-2">
                    <select
                      value={form.startMonth}
                      onChange={(e) => setForm({ ...form, startMonth: e.target.value })}
                      required
                      className="flex-1 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Month</option>
                      {months.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={form.startYear}
                      onChange={(e) => setForm({ ...form, startYear: e.target.value })}
                      required
                      className="flex-1 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Year</option>
                      {years.map((year) => (
                        <option key={year.value} value={year.value}>
                          {year.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Expected Graduation Date</label>
                  <div className="flex gap-2">
                    <select
                      value={form.endMonth}
                      onChange={(e) => setForm({ ...form, endMonth: e.target.value })}
                      required
                      className="flex-1 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Month</option>
                      {months.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={form.endYear}
                      onChange={(e) => setForm({ ...form, endYear: e.target.value })}
                      required
                      className="flex-1 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Year</option>
                      {years.map((year) => (
                        <option key={year.value} value={year.value}>
                          {year.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* GPA Field - Last Position */}
            <Input
              placeholder="Current GPA (e.g., 3.5/4.0 or 85%)"
              value={form.gpa}
              onChange={(e) => setForm({ ...form, gpa: e.target.value })}
              required
              className="min-h-[44px]"
            />

            <div className="sm:col-span-2 flex flex-col sm:flex-row justify-between gap-3">
              <Button variant="outline" onClick={back} disabled={user ? false : true} className="min-h-[44px] w-full sm:w-auto">
                Back
              </Button>
              <Button 
                onClick={async () => {
                  // Save the basic education data first, then redirect to profile
                  const isFormValid = form.country && 
                    form.university && 
                    (form.university !== "Other" || form.customUniversity) &&
                    form.degreeLevel &&
                    form.field &&
                    form.program && 
                    form.startMonth &&
                    form.startYear &&
                    form.endMonth &&
                    form.endYear &&
                    form.gpa;
                  
                  if (!isFormValid) {
                    toast.error("Please complete all required fields before proceeding.");
                    return;
                  }
                  
                  try {
                    setLoading(true);
                    
                    // Save Step 2 data before redirecting - only fields that exist in current schema
                    const finalUniversity = form.university === "Other" ? form.customUniversity : form.university;
                    
                    const step2Payload = {
                      country: form.country.trim(),
                      university: finalUniversity.trim(),
                      degreeLevel: form.degreeLevel, // Include degreeLevel - it exists in schema
                      field: form.field.trim(),
                      program: form.program.trim(),
                      gpa: Number(form.gpa)
                    };
                    
                    const headers = { "Content-Type": "application/json" };
                    if (token) {
                      headers.Authorization = `Bearer ${token}`;
                    }
                    
                    const currentStudentId = user?.studentId || studentId;
                    const step2Res = await fetch(`${API.baseURL}/api/students/${currentStudentId}`, {
                      method: "PATCH",
                      headers,
                      body: JSON.stringify(step2Payload),
                    });
                    
                    if (!step2Res.ok) {
                      throw new Error("Failed to save education details");
                    }
                    
                    toast.success("Education details saved successfully!");
                    
                    // Navigate to Step 3 (Financial Details)
                    setStep(3);
                    
                  } catch (error) {
                    console.error("Failed to save Step 2 data:", error);
                    toast.error("Failed to save education details. Please try again.");
                  } finally {
                    setLoading(false);
                  }
                }} 
                disabled={
                  loading ||
                  !form.country || 
                  !form.university || 
                  (form.university === "Other" && !form.customUniversity) ||
                  !form.degreeLevel ||
                  !form.field ||
                  !form.program || 
                  !form.startMonth ||
                  !form.startYear ||
                  !form.endMonth ||
                  !form.endYear ||
                  !form.gpa
                }
                className="min-h-[44px] w-full sm:w-auto"
              >
                {loading ? "Saving Education Details..." : "Continue to Financials"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — currency + amount + review + submit */}
        {step === 3 && (
          <div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Currency Selection */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Currency</label>
              <select
                className="w-full sm:w-1/2 rounded-2xl border px-3 py-2 text-sm min-h-[44px]"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                <option value="EUR">🇪🇺 EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="PKR">🇵🇰 PKR - Pakistani Rupee</option>
                <option value="USD">🇺🇸 USD - US Dollar</option>
              </select>
              {form.country && (
                <p className="text-xs text-green-600">
                  ✓ Auto-selected based on {form.country}
                </p>
              )}
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-800">Financial Details</h3>
              
              {/* University Fee */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700">
                  University Fee ({form.currency})
                </label>
                <Input
                  placeholder={`Tuition and academic fees (${form.currency})`}
                  type="number"
                  min="0"
                  value={form.universityFee}
                  onChange={(e) => handleUniversityFeeChange(e.target.value)}
                  required
                  className="min-h-[44px]"
                />
                <p className="text-xs text-slate-500">
                  Include tuition, registration, lab fees, and other academic costs
                </p>
              </div>

              {/* Living Expenses */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700">
                  Books + Living Expenses ({form.currency})
                </label>
                <Input
                  placeholder={`Books, accommodation, food, transport (${form.currency})`}
                  type="number"
                  min="0"
                  value={form.livingExpenses}
                  onChange={(e) => handleLivingExpensesChange(e.target.value)}
                  required
                  className="min-h-[44px]"
                />
                <p className="text-xs text-slate-500">
                  Include books, accommodation, food, transport, and other living costs
                </p>
              </div>

              {/* Total (Auto-calculated) */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border-2 border-dashed border-slate-300">
                <label className="text-xs sm:text-sm font-medium text-slate-700">
                  Total Expense ({form.currency})
                </label>
                <div className="relative">
                  <Input
                    placeholder={`Total cost (${form.currency})`}
                    type="number"
                    value={form.totalExpense}
                    readOnly
                    className="bg-white cursor-not-allowed font-medium min-h-[44px]"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-xs text-blue-600 font-medium">Auto-calculated</span>
                  </div>
                </div>
                <p className="text-xs text-blue-600">
                  ✓ University Fee + Books/Living = {form.currency} {Number(form.universityFee || 0) + Number(form.livingExpenses || 0)}
                </p>
              </div>

              {/* Scholarship Amount */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700">
                  Scholarship/Financial Aid Amount ({form.currency})
                </label>
                <Input
                  placeholder={`Scholarship amount you already have (${form.currency})`}
                  type="number"
                  min="0"
                  max={form.totalExpense || undefined}
                  value={form.scholarshipAmount}
                  onChange={(e) => handleScholarshipChange(e.target.value)}
                  required
                  className="min-h-[44px]"
                />
                <p className="text-xs text-slate-500">
                  Amount you've already secured from scholarships, family, or other sources
                </p>
              </div>

              {/* Required Amount (Auto-calculated) */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700">
                  Required Amount ({form.currency})
                </label>
                <div className="relative">
                  <Input
                    placeholder={`Amount you need (${form.currency})`}
                    type="number"
                    value={form.amount}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed min-h-[44px]"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-xs text-green-600 font-medium">Auto-calculated</span>
                  </div>
                </div>
                <p className="text-xs text-green-600">
                  ✓ This amount is automatically calculated: Total Expense - Scholarship
                </p>
              </div>

              {/* Financial Summary Card */}
              {form.totalExpense && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <h4 className="text-sm sm:text-base font-medium text-blue-900 mb-2">Financial Summary</h4>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span>Total Expense:</span>
                      <span className="font-medium">{Number(form.totalExpense || 0).toLocaleString()} {form.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scholarship:</span>
                      <span className="font-medium text-green-600">-{Number(form.scholarshipAmount || 0).toLocaleString()} {form.currency}</span>
                    </div>
                    <hr className="border-blue-300" />
                    <div className="flex justify-between font-semibold">
                      <span>Required Amount:</span>
                      <span className="text-blue-800">{Number(form.amount || 0).toLocaleString()} {form.currency}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Application Review */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-medium text-slate-800">Application Review</h3>
              <div className="rounded-lg border p-3 sm:p-4 text-xs sm:text-sm space-y-2">
                <p className="mb-3 text-slate-600 font-medium">Please review your application before submitting.</p>
                
                {/* Personal Information */}
                <div className="space-y-1">
                  <h4 className="font-medium text-slate-700 text-sm sm:text-base">Personal Information</h4>
                  <p><strong>Name:</strong> {user?.name || form.name || "[Your Name]"}</p>
                  <p><strong>Email:</strong> {user?.email || form.email || "[Your Email]"}</p>
                </div>

                {/* Academic Information */}
                <div className="space-y-1 pt-2">
                  <h4 className="font-medium text-slate-700 text-sm sm:text-base">Academic Information</h4>
                  <p><strong>Country:</strong> {form.country || "[University Country]"}</p>
                  <p><strong>University:</strong> {form.university === "Other" ? form.customUniversity : form.university || "[Your University]"}</p>
                  <p><strong>Program:</strong> {form.program || "[Your Program]"}</p>
                </div>

                {/* Financial Information */}
                <div className="space-y-1 pt-2">
                  <h4 className="font-medium text-slate-700 text-sm sm:text-base">Financial Information</h4>
                  <p><strong>Total Expense:</strong> {form.totalExpense ? `${Number(form.totalExpense).toLocaleString()} ${form.currency}` : "[Total Expense]"}</p>
                  <p><strong>Scholarship:</strong> {form.scholarshipAmount ? `${Number(form.scholarshipAmount).toLocaleString()} ${form.currency}` : "0 " + form.currency}</p>
                  <p><strong>Required Amount:</strong> <span className="text-blue-600 font-semibold">{form.amount ? `${Number(form.amount).toLocaleString()} ${form.currency}` : "[Required Amount]"}</span></p>
                </div>
              </div>
            </div>



            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <Button type="button" variant="outline" onClick={back} className="min-h-[44px] w-full sm:w-auto">
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="min-h-[44px] w-full sm:w-auto"
              >
                {loading ? "Submitting..." : "Continue to Profile"}
              </Button>
            </div>
          </form>
          </div>
        )}
      </Card>
    </div>
  );
};