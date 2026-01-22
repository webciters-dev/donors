
// NOTE: If you make any DB schema changes, ensure you apply them on the VPS as well (run migrations, redeploy, etc.)
import React, { useState, useEffect, useCallback, useRef } from "react";
import SubmissionChecklistModal from "@/components/SubmissionChecklistModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getCurrencyFromCountry } from "@/lib/currency";
import { Eye, EyeOff, LogIn, Shield } from "lucide-react";
import { API } from "@/lib/api";
import UniversitySelector from "@/components/UniversitySelector";
import PhotoUpload from "@/components/PhotoUpload";
import RecaptchaProtection from "@/components/RecaptchaProtection";
import { 
  useUniversityAcademics,
  generateMonthYearOptions
} from "@/hooks/useUniversityAcademics";
import { getPakistanOnlyDatalist, getFilterMessage } from "@/lib/countryFilter";

// Fallback university ID (LUMS) for when "Other" is selected
// This allows users selecting "Other" to still pick from common degree levels, fields, and programs
const FALLBACK_UNIVERSITY_ID = "cmhnd78i0004xbt5mrglb252v"; // LUMS ID
const FALLBACK_DEGREE_LEVEL = "Bachelor's"; // Default degree level for fetching fields when "Other" is selected
const FALLBACK_FIELD = "Business"; // Default field for fetching programs when "Other" is selected


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
  
  // Step state - initialize from URL if present (for returning users)
  const [step, setStep] = useState(() => {
    const params = new URLSearchParams(location.search);
    const stepFromUrl = parseInt(params.get('step'), 10);
    return (stepFromUrl >= 1 && stepFromUrl <= 3) ? stepFromUrl : 1;
  });
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Refs for scroll behavior
  const step2ContainerRef = useRef(null);
  const step3ContainerRef = useRef(null);
  
  // Profile lock state
  const [isLocked, setIsLocked] = useState(false);
  const [appStatus, setAppStatus] = useState('DRAFT');

  // Registration tracking state
  const [isRegistered, setIsRegistered] = useState(!!user); // If user exists, they're already registered
  const [studentId, setStudentId] = useState(user?.studentId || null);

  // Form state - must be declared before any useCallback/useEffect that references it
  const [form, setForm] = useState(() => ({
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
    customDegreeLevel: "", // For "Other" option
    field: "", // Agriculture, Computer Science, etc.
    customField: "", // For "Other" option
    program: "", // Specific program within the field
    customProgram: "", // For "Other" option
    startMonth: String(new Date().getMonth() + 1).padStart(2, '0'), // Program start month - default to current
    startYear: String(new Date().getFullYear()), // Program start year - default to current
    endMonth: String(new Date().getMonth() + 1).padStart(2, '0'), // Program end month - default to current
    endYear: String(new Date().getFullYear()), // Program end year - default to current
    gpa: "",
    gradeType: "CGPA", // CGPA or PERCENTAGE
    // Currency (auto-selected based on country)
    currency: "PKR", // Default to PKR for our primary market
    // Photo fields
    photoUrl: "",
    photoThumbnailUrl: "",
    photoUploadedAt: null,
    // Document upload fields (multi-image arrays)
    transcripts: [],
    certificates: [],
    attachments: [],
    // Step 3 — financial details (8 expense breakdown fields)
    tuitionFee: "0",          // Tuition Fee
    hostelFee: "0",           // Hostel Fee
    stationeryExpense: "0",   // Stationery expense
    booksExpense: "0",        // Books expense
    messExpense: "0",         // Mess (average food cost)
    computerLaptop: "0",      // Computer/Laptop expense
    travelExpense: "0",       // Travel expense
    otherExpenses: "0",       // Other expenses (open-ended amount)
    otherExpenseDesc: "",     // Other expenses description
    // Legacy fields (kept for backward compatibility)
    universityFee: "0",       // Will be calculated from tuitionFee for backward compat
    livingExpenses: "0",      // Will be calculated from other expenses for backward compat
    totalExpense: "0",        // Auto-calculated (sum of all 8 expense fields)
    scholarshipAmount: "0",   // Default to 0
    otherResources: "0",      // Other funding sources (family, work, savings)
    amount: "0",              // This will be auto-calculated (totalExpense - scholarshipAmount - otherResources)
  }));

  // Effect to restore step for logged-in users
  // If user has a studentId (account created), they should be at least on step 2
  useEffect(() => {
    if (user && user.studentId && token) {
      // User is logged in with a student account - set registration state
      setIsRegistered(true);
      setStudentId(user.studentId);
      
      // Check URL for step param first
      const params = new URLSearchParams(location.search);
      const stepFromUrl = parseInt(params.get('step'), 10);
      
      if (stepFromUrl >= 2 && stepFromUrl <= 3) {
        // Restore to the step from URL
        setStep(stepFromUrl);
      } else if (step === 1) {
        // User is logged in but on step 1 - move to step 2
        setStep(2);
      }
      
      // Load existing student data
      loadExistingStudentData();
    }
  }, [user, token]); // Only run when user/token changes (login/logout)

  // Fetch current application status for lock logic
  useEffect(() => {
    async function fetchAppStatus() {
      if (!user?.studentId || !token) return;
      try {
        const res = await fetch(`${API.baseURL}/api/applications?status=all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Find the latest application for this student
          const app = (data.applications || []).find(a => a.studentId === user.studentId);
          if (app) {
            setAppStatus(app.status);
            setIsLocked(app.status !== 'DRAFT');
          }
        }
      } catch (e) {
        // Ignore errors, default to unlocked
      }
    }
    fetchAppStatus();
  }, [user?.studentId, token]);

  // ...rest of ApplicationForm component logic here...

  // Example: loadExistingStudentData async function
  const loadExistingStudentData = useCallback(async () => {
    console.log(' Starting API call to load existing student data...');
    const response = await fetch(`${API.baseURL}/api/students/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(' API Response status:', response.status);
    if (response.ok) {
      const responseData = await response.json();
      console.log(' Loaded response data:', responseData);
      // Handle both direct student data and nested {student: ...} response
      const studentData = responseData.student || responseData;
      console.log(' Extracted student data:', studentData);
      console.log(' Degree Level specific debug:', {
        degreeLevel: studentData.degreeLevel,
        degreeLevelType: typeof studentData.degreeLevel,
        isEmptyString: studentData.degreeLevel === '',
        isNull: studentData.degreeLevel === null,
        isUndefined: studentData.degreeLevel === undefined,
        length: studentData.degreeLevel?.length,
        allEducationFields: {
          country: studentData.country,
          university: studentData.university,
          degreeLevel: studentData.degreeLevel,
          field: studentData.field,
          program: studentData.program,
          gpa: studentData.gpa
        }
      });
      // Update form with existing data
      setForm(prevForm => {
        // Parse program dates from database if they exist, otherwise keep defaults
        let startMonth = prevForm.startMonth;
        let startYear = prevForm.startYear;
        let endMonth = prevForm.endMonth;
        let endYear = prevForm.endYear;
        if (studentData.programStartDate) {
          const [sMonth, sYear] = studentData.programStartDate.split('/');
          startMonth = sMonth || prevForm.startMonth;
          startYear = sYear || prevForm.startYear;
        }
        if (studentData.programEndDate) {
          const [eMonth, eYear] = studentData.programEndDate.split('/');
          endMonth = eMonth || prevForm.endMonth;
          endYear = eYear || prevForm.endYear;
        }
        const newFormData = {
          ...prevForm,
          name: studentData.name || prevForm.name,
          email: studentData.email || prevForm.email,
          country: studentData.country || prevForm.country,
          university: studentData.university || prevForm.university,
          // Fix: Properly handle null/undefined values from database
          degreeLevel: studentData.degreeLevel || "",
          field: studentData.field || prevForm.field,
          program: studentData.program || prevForm.program,
          gpa: studentData.gpa ? studentData.gpa.toString() : prevForm.gpa,
          currency: studentData.country ? getCurrencyFromCountry(studentData.country) : prevForm.currency,
          // Add parsed program dates
          startMonth,
          startYear,
          endMonth,
          endYear
        };
        return newFormData;
      });
    }
  }, [token]);

  // Additional effect to ensure data loading when step changes
  useEffect(() => {
    console.log(' Step useEffect triggered:', {
      step,
      hasUser: !!user,
      hasStudentId: !!user?.studentId,
      hasToken: !!token,
      userEmail: user?.email
    });
    
    if (user && user.studentId && token && (step === 1 || step === 2 || step === 3)) {
      console.log(` All conditions met - loading data for step ${step}`);
      loadExistingStudentData();
    } else {
      console.log('⏭️ Conditions not met for step data loading');
    }
  }, [step, user, token, loadExistingStudentData]);

  // Update URL when step changes for proper browser navigation with HashRouter
  useEffect(() => {
    if (user && step > 1) {
      // Use navigate() to properly update URL for HashRouter
      // This lets React Router handle the hash conversion
      navigate(`/apply?step=${step}`, { replace: true });
    }
  }, [step, user, navigate]);

  // Scroll to top when step changes (more reliable than setTimeout in handlers)
  useEffect(() => {
    if (step === 2 && step2ContainerRef.current) {
      // Use requestAnimationFrame for better timing and smooth scroll
      requestAnimationFrame(() => {
        step2ContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else if (step === 3 && step3ContainerRef.current) {
      // Use requestAnimationFrame for better timing and smooth scroll
      requestAnimationFrame(() => {
        step3ContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [step]);

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
  const handleStep1Registration = async (executeRecaptcha) => {
    console.log('🔍 handleStep1Registration called with executeRecaptcha:', typeof executeRecaptcha);
    
    // Validation
    if (!form.name || !form.email || !form.password || !form.gender) {
      toast.error("Please complete all fields.");
      return;
    }
    if (!form.personalIntroduction || form.personalIntroduction.trim().length === 0) {
      toast.error("Please tell us about yourself and your family.");
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

      // ️ reCAPTCHA Protection - Get verification token (v3)
      let recaptchaToken = null;
      if (executeRecaptcha) {
        try {
          console.log('🔓 Executing reCAPTCHA...');
          recaptchaToken = await executeRecaptcha('register');
          console.log('✅ reCAPTCHA token obtained:', recaptchaToken ? 'Success' : 'No token');
        } catch (recaptchaError) {
          console.error('❌ reCAPTCHA failed:', recaptchaError);
          toast.error("Security verification failed. Please try again.");
          setLoading(false);
          return;
        }
      } else {
        console.error('❌ executeRecaptcha is UNDEFINED - render prop not working!');
        toast.error("reCAPTCHA not initialized. Please refresh the page.");
        setLoading(false);
        return;
      }

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
          field: "",
          // ️ reCAPTCHA Protection
          recaptchaToken: recaptchaToken
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
      
      // Move to Step 2 (scroll will be handled by useEffect)
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

  // Validate step completion for data integrity
  const validateStepCompletion = (targetStep) => {
    if (targetStep === 1) return true; // Always allow step 1
    
    if (targetStep === 2) {
      // Step 2 requires step 1 completion (user account)
      return user && user.studentId;
    }
    
    if (targetStep === 3) {
      // Step 3 requires step 1 + 2 completion (education data)
      return user && user.studentId && form.university && form.degreeLevel && form.field && form.program && form.gpa;
    }
    
    return false;
  };

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
    console.log('️ University change debug:', {
      university,
      customUniversity,
      universityId,
      universityIdType: typeof universityId
    });
    
    setForm({
      ...form,
      university,
      customUniversity,
      degreeLevel: "", // Reset dependent fields
      field: "",
      program: ""
    });
    
    // Set the university ID for fetching academic data
    // When "Other" is selected, use LUMS as fallback to provide common options
    if (university === "Other") {
      setSelectedUniversityId(FALLBACK_UNIVERSITY_ID);
    } else {
      setSelectedUniversityId(universityId);
    }
  };

  // Handler for degree level change - resets dependent fields
  const handleDegreeLevelChange = (degreeLevel) => {
    console.log(' Degree level change debug:', {
      degreeLevel,
      selectedUniversityId,
      degreeLevelsAvailable: degreeLevels
    });
    
    setForm({
      ...form,
      degreeLevel,
      field: "", // Reset field when degree level changes
      program: "" // Reset program when degree level changes
    });
    
    // Fetch fields for the selected degree level
    // When "Other" is selected, use fallback degree level to still show available fields
    if (degreeLevel) {
      const degreeLevelForFetch = degreeLevel === "Other" ? FALLBACK_DEGREE_LEVEL : degreeLevel;
      fetchFields(degreeLevelForFetch);
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
    // When "Other" is selected for either, use fallback values to still show available programs
    if (field && form.degreeLevel) {
      const degreeLevelForFetch = form.degreeLevel === "Other" ? FALLBACK_DEGREE_LEVEL : form.degreeLevel;
      const fieldForFetch = field === "Other" ? FALLBACK_FIELD : field;
      fetchPrograms(degreeLevelForFetch, fieldForFetch);
    }
  };

  // Calculate required amount (Total Expense - Scholarship - Other Resources)
  const calculateRequiredAmount = (totalExpense, scholarshipAmount, otherResources) => {
    const total = Number(totalExpense || 0);
    const scholarship = Number(scholarshipAmount || 0);
    const other = Number(otherResources || 0);
    return Math.max(0, total - scholarship - other); // Ensure non-negative
  };

  // Calculate total expense from all 8 expense fields
  const calculateTotalExpense = (formData) => {
    return (
      Number(formData.tuitionFee || 0) +
      Number(formData.hostelFee || 0) +
      Number(formData.stationeryExpense || 0) +
      Number(formData.booksExpense || 0) +
      Number(formData.messExpense || 0) +
      Number(formData.computerLaptop || 0) +
      Number(formData.travelExpense || 0) +
      Number(formData.otherExpenses || 0)
    );
  };

  // Handle expense field change (unified handler for all 8 expense fields)
  const handleExpenseChange = (fieldName, value) => {
    const updatedForm = {
      ...form,
      [fieldName]: value
    };
    
    const newTotal = calculateTotalExpense(updatedForm);
    const newAmount = calculateRequiredAmount(newTotal.toString(), updatedForm.scholarshipAmount, updatedForm.otherResources);
    
    // Update legacy fields for backward compatibility
    const universityFee = Number(updatedForm.tuitionFee || 0);
    const livingExpenses = newTotal - universityFee;
    
    setForm({
      ...updatedForm,
      universityFee: universityFee.toString(),
      livingExpenses: livingExpenses.toString(),
      totalExpense: newTotal.toString(),
      amount: newAmount.toString()
    });
  };

  // Handle scholarship amount change (no longer auto-updates amount - student enters manually)
  const handleScholarshipChange = (value) => {
    const total = Number(form.totalExpense || 0);
    const scholarship = Number(value || 0);
    
    // Prevent scholarship from being greater than total expense
    if (scholarship > total && total > 0) {
      toast.error("Scholarship amount cannot be greater than total expense.");
      return;
    }
    
    setForm({
      ...form,
      scholarshipAmount: value
    });
  };

  // Handle other resources change (family support, part-time work, savings)
  const handleOtherResourcesChange = (value) => {
    const total = Number(form.totalExpense || 0);
    const scholarship = Number(form.scholarshipAmount || 0);
    const other = Number(value || 0);
    
    // Prevent other resources from exceeding remaining amount
    const maxOther = total - scholarship;
    if (other > maxOther && maxOther > 0) {
      toast.error("Other resources cannot exceed remaining amount after scholarship.");
      return;
    }
    
    setForm({
      ...form,
      otherResources: value
    });
  };


  // Checklist modal state
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [savedChecklistItems, setSavedChecklistItems] = useState([]);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // Final Application Submission (Step 3)
  async function doFinalSubmit() {
    // (moved from handleSubmit)
    // ...original handleSubmit code, minus e.preventDefault and modal logic...
    // Validation
    if (!form.university || !form.degreeLevel || !form.field || !form.program || !form.country || !form.gpa) {
      toast.error("Please complete all required fields: country, university, degree level, field, program, and CGPA.");
      return;
    }
    if (!form.startMonth || !form.startYear) {
      toast.error("Please specify program start date.");
      return;
    }
    if (!form.endMonth || !form.endYear) {
      toast.error("Please specify expected graduation date.");
      return;
    }
    const startDate = new Date(parseInt(form.startYear), parseInt(form.startMonth) - 1);
    const endDate = new Date(parseInt(form.endYear), parseInt(form.endMonth) - 1);
    if (endDate <= startDate) {
      toast.error("Expected graduation date must be after program start date.");
      return;
    }
    const universityFeeNum = Number(form.universityFee || 0);
    const livingExpensesNum = Number(form.livingExpenses || 0);
    const totalExpenseNum = Number(form.totalExpense || 0);
    const scholarshipNum = Number(form.scholarshipAmount || 0);
    const otherResourcesNum = Number(form.otherResources || 0);
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
    const currentStudentId = user?.studentId || studentId;
    if (!currentStudentId) {
      console.error(" No studentId found:", { 
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
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const programStartDate = (form.startMonth && form.startYear) ? `${form.startMonth}/${form.startYear}` : null;
      const programEndDate = (form.endMonth && form.endYear) ? `${form.endMonth}/${form.endYear}` : null;
      const studentUpdatePayload = {
        country: form.country.trim(),
        university: finalUniversity.trim(),
        degreeLevel: form.degreeLevel,
        field: form.field.trim(),
        program: form.program.trim(),
        gpa: Number(form.gpa),
        gradeType: form.gradeType || "CGPA",
        programStartDate,
        programEndDate
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
          console.error(" Failed to parse student update error:", parseError);
          throw new Error(`Student update failed: HTTP ${studentRes.status}`);
        }
        console.error(" Student update failed:", {
          status: studentRes.status,
          statusText: studentRes.statusText,
          error: studentError,
          payload: studentUpdatePayload,
          studentId: currentStudentId,
          hasToken: !!token
        });
        const errorMessage = studentError.error || studentError.message || "Failed to update student profile";
        toast.error(`Student update failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      const applicationPayload = {
        studentId: currentStudentId,
        term: form.term || "Not specified",
        currency: form.currency,
        universityFee: universityFeeNum,
        livingExpenses: livingExpensesNum,
        totalExpense: totalExpenseNum,
        scholarshipAmount: scholarshipNum,
        otherResources: otherResourcesNum,
        amount: requiredAmountNum
      };
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
          console.error(" Failed to parse error response:", parseError);
          throw new Error(`HTTP ${appRes.status}: ${appRes.statusText}`);
        }
        console.error(" Application submission error:", {
          status: appRes.status,
          statusText: appRes.statusText,
          error: errorData,
          payload: applicationPayload
        });
        throw new Error(errorData.error || errorData.message || `Server error: ${appRes.status}`);
      }
      toast.success("Step 3 Complete! Continue to Step 4");
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

  // New handleSubmit for step 3: open checklist modal first
  function handleSubmit(e) {
    e.preventDefault();
    setPendingSubmit(true);
    setShowChecklistModal(true);
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
                disabled={isLocked}
              />
              <Input
                placeholder="Your Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="min-h-[44px]"
                disabled={isLocked}
              />
              <PasswordInput
                placeholder="Create Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                show={showPassword}
                setShow={setShowPassword}
                disabled={isLocked}
              />
              <PasswordInput
                placeholder="Confirm Password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                show={showConfirmPassword}
                setShow={setShowConfirmPassword}
                disabled={isLocked}
              />
              
              <select
                className="rounded-2xl border px-3 py-2 text-sm min-h-[44px] w-full"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                required
                disabled={isLocked}
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
                Tell us about yourself and your family <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full rounded-2xl border px-3 py-2 text-sm resize-none min-h-[44px]"
                rows={4}
                placeholder="Share a brief introduction about yourself, your background, family situation, interests, and what motivates you to pursue higher education. This helps potential sponsors understand your story better."
                value={form.personalIntroduction}
                onChange={(e) => setForm({ ...form, personalIntroduction: e.target.value })}
                maxLength={1000}
                disabled={isLocked}
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
                disabled={isLocked}
              />
                    {/* Profile lock warning */}
                    {isLocked && (
                      <div className="sm:col-span-2 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg mb-2">
                        <p className="text-sm text-red-900">
                          <strong>Profile Locked:</strong> Your application has been submitted and is now locked for editing. If you need to make changes, please contact support.
                        </p>
                      </div>
                    )}
            </div>

            {/* ️ reCAPTCHA Protection - Invisible v3 */}
            <RecaptchaProtection 
              version="v3"
              onError={(error) => {
                console.error('reCAPTCHA error:', error);
                toast.error('Security verification failed. Please refresh and try again.');
              }}
            >
              {({ executeRecaptcha }) => (
                <div className="sm:col-span-2 space-y-4">
                  {import.meta.env.VITE_DEVELOPMENT_MODE !== 'true' && (
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <Shield className="h-3 w-3" />
                      <span>Protected by reCAPTCHA</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row justify-end">
                    <Button
                      onClick={() => handleStep1Registration(executeRecaptcha)}
                      disabled={loading || !form.name || !form.email || !form.password || form.password !== form.confirm || !form.gender || !form.photoUrl}
                      className="min-h-[44px] w-full sm:w-auto"
                    >
                      {loading ? "Creating Account..." : "Create Account & Continue"}
                    </Button>
                  </div>
                </div>
              )}
            </RecaptchaProtection>
          </div>
        )}

        {/* STEP 2 — education basics */}
        {step === 2 && (
          <div ref={step2ContainerRef} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Warning Message - Data Lock Notice */}
            <div className="sm:col-span-2 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg mb-2">
              <p className="text-sm text-amber-900">
                <strong>⚠️ Important:</strong> The education details you select in this step cannot be edited by you after submission. Please review carefully before proceeding.
              </p>
            </div>

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
                        <option value="Pakistan"> Pakistan</option>
                        <option value="USA"> United States</option>
                        <option value="Canada"> Canada</option>
                        <option value="UK"> United Kingdom</option>
                        <option value="Germany"> Germany</option>
                        <option value="France"> France</option>
                        <option value="Italy"> Italy</option>
                        <option value="Spain"> Spain</option>
                        <option value="Netherlands"> Netherlands</option>
                        <option value="Belgium"> Belgium</option>
                        <option value="Austria"> Austria</option>
                        <option value="Australia"> Australia</option>
                        <option value="Other"> Other Country</option>
                      </>
                    );
                  }
                })()}
              </datalist>
              {form.country && (
                <p className="text-xs text-green-600 mt-1">
                   Currency auto-selected: {form.currency}
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
                  <option value="Other">Other</option>
                </select>
                {/* Custom degree level input when Other is selected */}
                {form.degreeLevel === "Other" && (
                  <div className="mt-2">
                    <Input
                      placeholder="Enter your degree level"
                      value={form.customDegreeLevel}
                      onChange={(e) => setForm({ ...form, customDegreeLevel: e.target.value })}
                      required
                      className="min-h-[44px]"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      This will be submitted as a custom degree level for admin review
                    </p>
                  </div>
                )}
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
                  <option value="Other">Other</option>
                </select>
                {/* Custom field input when Other is selected */}
                {form.field === "Other" && (
                  <div className="mt-2">
                    <Input
                      placeholder="Enter your field of study"
                      value={form.customField}
                      onChange={(e) => setForm({ ...form, customField: e.target.value })}
                      required
                      className="min-h-[44px]"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      This will be submitted as a custom field for admin review
                    </p>
                  </div>
                )}
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
                  <option value="Other">Other</option>
                </select>
                {/* Custom program input when Other is selected */}
                {form.program === "Other" && (
                  <div className="mt-2">
                    <Input
                      placeholder="Enter your specific program"
                      value={form.customProgram}
                      onChange={(e) => setForm({ ...form, customProgram: e.target.value })}
                      required
                      className="min-h-[44px]"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      This will be submitted as a custom program for admin review
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Program Start Date - Shows after program is selected */}
            {form.program && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Program Start Date <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <select
                      value={form.startMonth}
                      onChange={(e) => setForm({ ...form, startMonth: e.target.value })}
                      className="flex-1 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
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
                      className="flex-1 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
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
                  <label className="block text-sm font-medium mb-2">Expected Graduation Date <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <select
                      value={form.endMonth}
                      onChange={(e) => setForm({ ...form, endMonth: e.target.value })}
                      className="flex-1 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
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
                      className="flex-1 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
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

            {/* GPA/Percentage Field with Type Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Academic Result <span className="text-rose-500">*</span></label>
              <div className="flex gap-2">
                <select
                  value={form.gradeType}
                  onChange={(e) => setForm({ ...form, gradeType: e.target.value })}
                  className="w-32 min-h-[44px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CGPA">CGPA</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
                <Input
                  placeholder={form.gradeType === "CGPA" ? "Enter CGPA (0-4)" : "Enter Percentage (0-100)"}
                  type="number"
                  step="0.01"
                  min="0"
                  max={form.gradeType === "CGPA" ? "4" : "100"}
                  value={form.gpa}
                  onChange={(e) => setForm({ ...form, gpa: e.target.value })}
                  required
                  className="flex-1 min-h-[44px]"
                />
              </div>
              <p className="text-xs text-gray-500">
                {form.gradeType === "CGPA" 
                  ? "University/College typically uses CGPA on a 4.0 scale" 
                  : "Pakistani Matric/FSc uses percentage (0-100)"}
              </p>
            </div>

            {/* Document Uploads */}
            <div className="sm:col-span-2 space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Transcripts (upload all relevant marksheets, transcripts, etc.)</label>
                <PhotoUpload
                  currentPhotos={form.transcripts}
                  onPhotoChange={(photos) => setForm({ ...form, transcripts: photos })}
                  maxFiles={5}
                  required={false}
                  className="mt-2"
                  label="Upload Transcripts"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Certificates (upload degree, awards, or other certificates)</label>
                <PhotoUpload
                  currentPhotos={form.certificates}
                  onPhotoChange={(photos) => setForm({ ...form, certificates: photos })}
                  maxFiles={5}
                  required={false}
                  className="mt-2"
                  label="Upload Certificates"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Other Attachments (optional)</label>
                <PhotoUpload
                  currentPhotos={form.attachments}
                  onPhotoChange={(photos) => setForm({ ...form, attachments: photos })}
                  maxFiles={5}
                  required={false}
                  className="mt-2"
                  label="Upload Attachments"
                />
              </div>
            </div>

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
                    toast.error("Please complete all required fields including program dates before proceeding.");
                    return;
                  }
                  
                  try {
                    setLoading(true);
                    
                    // Save Step 2 data before redirecting
                    const finalUniversity = form.university === "Other" ? form.customUniversity : form.university;
                    const programStartDate = `${form.startMonth}/${form.startYear}`;
                    const programEndDate = `${form.endMonth}/${form.endYear}`;
                    
                    const step2Payload = {
                      country: form.country.trim(),
                      university: finalUniversity.trim(),
                      degreeLevel: form.degreeLevel,
                      field: form.field.trim(),
                      program: form.program.trim(),
                      gpa: Number(form.gpa),
                      gradeType: form.gradeType || "CGPA",
                      programStartDate,
                      programEndDate
                    };
                    
                    console.log(' Step 2 save debug - current form state:', {
                      degreeLevel: form.degreeLevel,
                      degreeLevelType: typeof form.degreeLevel,
                      isEmpty: form.degreeLevel === '',
                      isNull: form.degreeLevel === null,
                      isUndefined: form.degreeLevel === undefined,
                      fullPayload: step2Payload
                    });
                    
                    const headers = { "Content-Type": "application/json" };
                    if (token) {
                      headers.Authorization = `Bearer ${token}`;
                    }
                    
                    const currentStudentId = user?.studentId || studentId;
                    console.log(' Step 2 save - Sending to:', `${API.baseURL}/api/students/${currentStudentId}`);
                    console.log(' Step 2 save - Token present:', !!token);
                    console.log(' Step 2 save - StudentId:', currentStudentId);
                    
                    const step2Res = await fetch(`${API.baseURL}/api/students/${currentStudentId}`, {
                      method: "PATCH",
                      headers,
                      body: JSON.stringify(step2Payload),
                    });
                    
                    if (!step2Res.ok) {
                      const errorText = await step2Res.text();
                      console.error(' Step 2 save failed:', step2Res.status, errorText);
                      throw new Error(errorText || "Failed to save education details");
                    }
                    
                    //  Update local form state with saved data to ensure Step 3 displays correctly
                    setForm(prevForm => ({
                      ...prevForm,
                      country: step2Payload.country,
                      university: step2Payload.university,
                      degreeLevel: step2Payload.degreeLevel,
                      field: step2Payload.field,
                      program: step2Payload.program,
                      gpa: step2Payload.gpa.toString(),
                      // Also update the dates if they were provided
                      startMonth: form.startMonth,
                      startYear: form.startYear,
                      endMonth: form.endMonth,
                      endYear: form.endYear
                    }));
                    
                    console.log(' Step 2 data saved and form state updated:', step2Payload);
                    
                    // Create a basic application record to mark Step 3 as "reached"
                    try {
                      const basicAppRes = await fetch(API.url('/api/applications'), {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                          studentId: currentStudentId,
                          term: "Current Term",
                          currency: form.currency || "PKR",
                          amount: 1, // Minimal placeholder amount
                          status: "DRAFT"
                        }),
                      });
                      
                      if (basicAppRes.ok) {
                        console.log(" Basic application created to mark Step 3 reached");
                      }
                    } catch (appError) {
                      console.warn("️ Could not create basic application:", appError);
                      // Don't block progression if this fails
                    }
                    
                    toast.success("Education details saved successfully!");
                    
                    // Navigate to Step 3 (Financial Details)
                    // Scroll will be handled by useEffect
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
          <div ref={step3ContainerRef}>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Currency Display (Read-Only) */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">Currency</label>
              <div className="w-full sm:w-1/2 rounded-2xl border px-3 py-2 text-sm min-h-[44px] bg-gray-50 flex items-center">
                <span className="font-medium text-gray-800">
                  {form.currency === 'PKR' && ' '}
                  {form.currency === 'USD' && ' '}
                  {form.currency === 'EUR' && ' '}
                  {form.currency === 'GBP' && ' '}
                  {form.currency === 'CAD' && ' '}
                  {form.currency === 'AUD' && ' '}
                  {form.currency} - {
                    form.currency === 'PKR' ? 'Pakistani Rupee' :
                    form.currency === 'USD' ? 'US Dollar' :
                    form.currency === 'EUR' ? 'Euro' :
                    form.currency === 'GBP' ? 'British Pound' :
                    form.currency === 'CAD' ? 'Canadian Dollar' :
                    form.currency === 'AUD' ? 'Australian Dollar' : 
                    form.currency
                  }
                </span>
              </div>
              {form.country && (
                <p className="text-xs text-green-600">
                   Auto-selected based on {form.country}
                </p>
              )}
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-800">Financial Details</h3>
              <p className="text-xs text-slate-500 -mt-2">Enter your estimated annual expenses in {form.currency}</p>
              
              {/* Expense fields grid - 2 columns on larger screens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tuition Fee */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Tuition Fee <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    placeholder={`Tuition fees (${form.currency})`}
                    type="number"
                    min="0"
                    value={form.tuitionFee}
                    onChange={(e) => handleExpenseChange("tuitionFee", e.target.value)}
                    required
                    className="min-h-[44px]"
                  />
                </div>

                {/* Hostel Fee */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Hostel Fee
                  </label>
                  <Input
                    placeholder={`Hostel/accommodation (${form.currency})`}
                    type="number"
                    min="0"
                    value={form.hostelFee}
                    onChange={(e) => handleExpenseChange("hostelFee", e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>

                {/* Stationery Expense */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Stationery Expense
                  </label>
                  <Input
                    placeholder={`Stationery costs (${form.currency})`}
                    type="number"
                    min="0"
                    value={form.stationeryExpense}
                    onChange={(e) => handleExpenseChange("stationeryExpense", e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>

                {/* Books Expense */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Books Expense
                  </label>
                  <Input
                    placeholder={`Books and materials (${form.currency})`}
                    type="number"
                    min="0"
                    value={form.booksExpense}
                    onChange={(e) => handleExpenseChange("booksExpense", e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>

                {/* Mess (Food) Expense */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Mess/Food Expense
                  </label>
                  <Input
                    placeholder={`Monthly food average (${form.currency})`}
                    type="number"
                    min="0"
                    value={form.messExpense}
                    onChange={(e) => handleExpenseChange("messExpense", e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>

                {/* Computer/Laptop */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Computer/Laptop
                  </label>
                  <Input
                    placeholder={`Computer or laptop (${form.currency})`}
                    type="number"
                    min="0"
                    value={form.computerLaptop}
                    onChange={(e) => handleExpenseChange("computerLaptop", e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>

                {/* Travel Expense */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Travel Expense
                  </label>
                  <Input
                    placeholder={`Travel/transport (${form.currency})`}
                    type="number"
                    min="0"
                    value={form.travelExpense}
                    onChange={(e) => handleExpenseChange("travelExpense", e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>

                {/* Other Expenses */}
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Other Expenses
                  </label>
                  <Input
                    placeholder={`Other costs (${form.currency})`}
                    type="number"
                    min="0"
                    value={form.otherExpenses}
                    onChange={(e) => handleExpenseChange("otherExpenses", e.target.value)}
                    className="min-h-[44px]"
                  />
                </div>
              </div>

              {/* Other Expenses Description (full width) */}
              {Number(form.otherExpenses || 0) > 0 && (
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    Please describe &quot;Other Expenses&quot;
                  </label>
                  <Input
                    placeholder="Describe what the other expenses are for..."
                    value={form.otherExpenseDesc}
                    onChange={(e) => setForm({ ...form, otherExpenseDesc: e.target.value })}
                    className="min-h-[44px]"
                  />
                </div>
              )}

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
                   Sum of all expense fields = {form.currency} {form.totalExpense}
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
                  Scholarships or financial aid you've already secured
                </p>
              </div>

              {/* Other Resources (Family, Work, Savings) */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700">
                  Other Resources ({form.currency})
                </label>
                <Input
                  placeholder={`Family support, part-time work, savings (${form.currency})`}
                  type="number"
                  min="0"
                  value={form.otherResources}
                  onChange={(e) => handleOtherResourcesChange(e.target.value)}
                  className="min-h-[44px]"
                />
                <p className="text-xs text-slate-500">
                  Family contributions, part-time work income, savings, or other funding sources
                </p>
              </div>

              {/* Amount Requested from AWAKE (Manual entry - open-end) */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700">
                  Amount Requested from AWAKE ({form.currency}) <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder={`Enter the amount you need from AWAKE (${form.currency})`}
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  className="min-h-[44px]"
                />
                <p className="text-xs text-slate-500">
                  Enter the total amount you are requesting from AWAKE for your education loan
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
                    {Number(form.otherResources || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Other Resources:</span>
                        <span className="font-medium text-green-600">-{Number(form.otherResources || 0).toLocaleString()} {form.currency}</span>
                      </div>
                    )}
                    <hr className="border-blue-300" />
                    <div className="flex justify-between font-semibold">
                      <span>Amount Requested from AWAKE:</span>
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
                  <p><strong>Degree Level:</strong> {form.degreeLevel || "[Your Degree Level]"}</p>
                  <p><strong>Field:</strong> {form.field || "[Your Field]"}</p>
                  <p><strong>Program:</strong> {form.program || "[Your Program]"}</p>
                  <p><strong>CGPA:</strong> {form.gpa || "[Your CGPA]"}</p>
                </div>

                {/* Financial Information */}
                <div className="space-y-1 pt-2">
                  <h4 className="font-medium text-slate-700 text-sm sm:text-base">Financial Information</h4>
                  <p><strong>Total Expense:</strong> {form.totalExpense ? `${Number(form.totalExpense).toLocaleString()} ${form.currency}` : "[Total Expense]"}</p>
                  <p><strong>Scholarship:</strong> {form.scholarshipAmount ? `${Number(form.scholarshipAmount).toLocaleString()} ${form.currency}` : "0 " + form.currency}</p>
                  {Number(form.otherResources || 0) > 0 && (
                    <p><strong>Other Resources:</strong> {`${Number(form.otherResources).toLocaleString()} ${form.currency}`}</p>
                  )}
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
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
                {/* Submission Checklist Modal */}
                <SubmissionChecklistModal
                  isOpen={showChecklistModal}
                  onClose={() => {
                    setShowChecklistModal(false);
                    setPendingSubmit(false);
                  }}
                  onSubmit={() => {
                    setShowChecklistModal(false);
                    setPendingSubmit(false);
                    doFinalSubmit();
                  }}
                  savedChecklist={savedChecklistItems}
                  onSaveProgress={(items) => {
                    setSavedChecklistItems(items);
                    toast.success("Checklist progress saved");
                  }}
                />
          </form>
          </div>
        )}
      </Card>
    </div>
    );
};