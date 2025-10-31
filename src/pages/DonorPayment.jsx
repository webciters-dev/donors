// src/pages/DonorPayment.jsx (dynamic payment processing with Stripe)
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import StablePaymentForm from "@/components/StablePaymentForm";
import { CURRENCY_META, getCurrencyFromCountry, fmtAmount } from "@/lib/currency";
import { 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  DollarSign, 
  User,
  Mail,
  Phone,
  Lock
} from "lucide-react";
import { API } from "@/lib/api";

function DonorPayment() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [currency, setCurrency] = useState("USD"); // Default to USD, will be updated when student data loads
  const [paymentFrequency, setPaymentFrequency] = useState("one-time");

  // Payment frequency options
  const frequencyOptions = [
    { value: "one-time", label: "One-time Payment", description: "Pay the full amount immediately" },
    { value: "monthly", label: "Monthly Pledge", description: "24 monthly payments over 2 years" },
    { value: "quarterly", label: "Quarterly Pledge", description: "8 quarterly payments over 2 years" },
    { value: "bi-annually", label: "Bi-annual Pledge", description: "4 bi-annual payments over 2 years" },
    { value: "annually", label: "Annual Pledge", description: "2 annual payments over 2 years" },
  ];

  const getPaymentAmount = () => {
    // Calculate full education cost from application (supports all currencies)
    let fullEducationCost = 0;
    if (student?.applications?.length > 0) {
      const approvedApp = student.applications.find(app => app.status === 'APPROVED');
      if (approvedApp) {
        fullEducationCost = approvedApp.amount || 0; // Single currency system
      } else {
        fullEducationCost = student?.application?.amount || 0;
      }
    } else {
      fullEducationCost = student?.application?.amount || 0;
    }
    
    // Complete sponsorship model: always pay the full education cost
    // No partial payments - one donor sponsors entire education
    switch (paymentFrequency) {
      case "monthly":
        return Math.ceil(fullEducationCost / 24); // 24 months over 2 years
      case "quarterly":
        return Math.ceil(fullEducationCost / 8);  // 8 quarters over 2 years
      case "bi-annually":
        return Math.ceil(fullEducationCost / 4);  // 4 payments over 2 years
      case "annually":
        return Math.ceil(fullEducationCost / 2);  // 2 payments over 2 years
      default:
        return fullEducationCost; // One-time payment for full amount
    }
  };

  // Calculate payment amount for a specific frequency (not the currently selected one)
  const getAmountForFrequency = (frequency) => {
    // Use the same logic as totalNeed calculation (supports all currencies)
    let amount = 0;
    if (student?.applications?.length > 0) {
      const approvedApp = student.applications.find(app => app.status === 'APPROVED');
      if (approvedApp) {
        amount = approvedApp.amount || 0; // Single currency system
      } else {
        amount = student?.application?.amount || 0;
      }
    } else {
      amount = student?.application?.amount || 0;
    }
    
    switch (frequency) {
      case "monthly":
        return Math.ceil(totalNeed / 24); // 24 months over 2 years
      case "quarterly":
        return Math.ceil(totalNeed / 8);  // 8 quarters over 2 years
      case "bi-annually":
        return Math.ceil(totalNeed / 4);  // 4 payments over 2 years
      case "annually":
        return Math.ceil(amount / 2);  // 2 payments over 2 years
      default:
        return amount; // One-time payment
    }
  };

  // Load student data
  useEffect(() => {
    async function loadStudent() {
      try {
        setLoading(true);
        
        console.log("Loading student for payment:", studentId);
        
        // Try the new individual student endpoint first
        let res = await fetch(`${API.baseURL}/api/students/approved/${studentId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.student) {
            console.log("Student loaded successfully:", data.student.name);
            console.log("Student applications:", data.student.applications);
            setStudent(data.student);
            
            // Get currency from approved application
            const approvedApp = data.student.applications?.find(app => app.status === 'APPROVED');
            const detectedCurrency = approvedApp?.currency || data.student.currency || "USD";
            console.log("Detected currency:", detectedCurrency);
            setCurrency(detectedCurrency);
            return;
          }
        }
        
        // Fallback: try to get student from approved students API
        res = await fetch(`${API.baseURL}/api/students/approved`);
        if (res.ok) {
          const data = await res.json();
          const students = data.students || [];
          const foundStudent = students.find(s => s.id === studentId);
          
          if (foundStudent) {
            console.log("Student found in list:", foundStudent.name);
            console.log("Student applications:", foundStudent.applications);
            setStudent(foundStudent);
            
            // Get currency from approved application
            const approvedApp = foundStudent.applications?.find(app => app.status === 'APPROVED');
            const detectedCurrency = approvedApp?.currency || foundStudent.currency || foundStudent.application?.currency || "USD";
            console.log("Detected currency:", detectedCurrency);
            setCurrency(detectedCurrency);
            return;
          }
        }
        
        throw new Error("Student not found");
        
      } catch (err) {
        console.error('Error loading student:', err);
        toast.error('Failed to load student details');
        navigate('/marketplace');
      } finally {
        setLoading(false);
      }
    }

    if (studentId) {
      loadStudent();
    }
  }, [studentId, navigate]);




    const handleSubmit = async (event) => {
      event.preventDefault();
      
      if (!stripe || !elements || !token) {
        toast.error("Payment system not ready. Please try again.");
        return;
      }

      if (processing || processingRef.current) {
        return; // Prevent multiple submissions
      }
      
      // Set processing flag immediately to prevent any re-renders
      processingRef.current = true;

      // Use the stored CardElement reference instead of trying to get it again
      let cardElement = cardElementRef.current;
      
      // If we don't have a stored reference, try to get it from elements
      if (!cardElement) {
        cardElement = elements.getElement(CardElement);
        
        // If still not available, wait and retry
        let retries = 0;
        while (!cardElement && retries < 3) {
          console.log(`CardElement not available, retry ${retries + 1}/3`);
          await new Promise(resolve => setTimeout(resolve, 200));
          cardElement = elements.getElement(CardElement);
          retries++;
        }
      }
      
      if (!cardElement) {
        console.error("CardElement unavailable - both ref and elements failed");
        toast.error("Card information is required. Please refresh the page and try again.");
        return;
      }
      
      console.log("CardElement found successfully", cardElement);

      try {
        // Set processing state AFTER we have confirmed CardElement is available
        setProcessing(true);
        
        // Create payment intent on the server
        const paymentIntentRes = await fetch(`${API.baseURL}/api/payments/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            studentId,
            amount: totalNeed,
            paymentFrequency,
            userId: user.id,
          }),
        });

        if (!paymentIntentRes.ok) {
          const error = await paymentIntentRes.json();
          throw new Error(error.error || 'Failed to create payment intent');
        }

        const { clientSecret, paymentIntentId } = await paymentIntentRes.json();

        // Confirm payment with Stripe - wrap in try/catch to handle element unmounting
        let confirmResult;
        try {
          console.log("About to confirm payment with cardElement:", cardElement);
          confirmResult = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: user.name || 'Anonymous Donor',
                email: user.email,
              },
            },
          });
        } catch (stripeError) {
          console.error("Stripe confirmCardPayment error:", stripeError);
          // If element unmounted, try to get a fresh one
          if (stripeError.message && stripeError.message.includes('Element')) {
            cardElement = elements.getElement(CardElement);
            if (cardElement) {
              console.log("Retrying with fresh CardElement");
              confirmResult = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                  card: cardElement,
                  billing_details: {
                    name: user.name || 'Anonymous Donor',
                    email: user.email,
                  },
                },
              });
            } else {
              throw new Error("Payment form became unavailable. Please refresh and try again.");
            }
          } else {
            throw stripeError;
          }
        }

        const { error: stripeError, paymentIntent } = confirmResult;

        if (stripeError) {
          throw new Error(stripeError.message);
        }

        if (paymentIntent.status === 'succeeded') {
          // Confirm payment and create sponsorship record
          const confirmRes = await fetch(`${API.baseURL}/api/payments/confirm-payment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              userId: user.id,
              studentId,
              paymentFrequency,
            }),
          });

          if (confirmRes.ok) {
            if (paymentFrequency === "one-time") {
              toast.success(`Payment successful! Thank you for sponsoring ${student.name}'s complete education.`);
            } else {
              const freq = frequencyOptions.find(o => o.value === paymentFrequency)?.label;
              toast.success(`${freq} subscription set up successfully! Thank you for sponsoring ${student.name}'s education.`);
            }
            navigate('/donor/portal?tab=sponsored');
          } else {
            const error = await confirmRes.json();
            throw new Error(error.error || 'Payment processed but sponsorship record failed. Please contact support.');
          }
        }
      } catch (err) {
        console.error('Payment error:', err);
        toast.error(err.message || 'Payment failed. Please try again.');
      } finally {
        setProcessing(false);
        processingRef.current = false;
      }
    };



  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="self-start">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-semibold">Loading student details...</h1>
        </div>
        <div className="text-xs sm:text-sm text-slate-600">
          Student ID: {studentId}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="self-start">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-semibold">Student Not Found</h1>
        </div>
        <Card className="p-6 sm:p-8 text-center">
          <div className="text-sm sm:text-base text-slate-600">The student you're looking for could not be found.</div>
        </Card>
      </div>
    );
  }

  // Calculate totalNeed from application (new structure supports all currencies)
  let totalNeed = 0;
  if (student?.applications?.length > 0) {
    const approvedApp = student.applications.find(app => app.status === 'APPROVED');
    if (approvedApp) {
      // New structure: use single amount field from application
      totalNeed = approvedApp.amount || 0; // Single currency system
    } else {
      // Fallback to student application amount if no approved application
      totalNeed = student?.application?.amount || 0;
    }
  } else {
    // Fallback to student application amount
    totalNeed = student?.application?.amount || 0;
  }
  
  const isAlreadySponsored = student?.sponsored;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="self-start">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl sm:text-2xl font-semibold">Sponsor {student.name}</h1>
      </div>

      {isAlreadySponsored ? (
        <Card className="p-6 sm:p-8 text-center">
          <div className="space-y-4">
            <Badge variant="default" className="px-4 py-2">
              ✓ Already Sponsored
            </Badge>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">This student is fully sponsored</h3>
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                {student.name} has already received full sponsorship for their education.
                Thank you for your interest in helping students!
              </p>
            </div>
            <Button onClick={() => navigate('/marketplace')} className="rounded-2xl min-h-[44px] w-full sm:w-auto">
              Browse Other Students
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Student Info */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{student.name}</h3>
                  <div className="text-sm sm:text-base text-slate-600">{student.program}</div>
                  <div className="text-xs sm:text-sm text-slate-500">{student.university}</div>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 self-start">
                  {student.city}
                </Badge>
              </div>

              <div className="border-t border-slate-200 my-4"></div>

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-xs sm:text-sm text-slate-600">Total Educational Need:</span>
                  <span className="font-semibold text-base sm:text-lg">{fmtAmount(totalNeed, currency)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs">
                  <span className="text-slate-500">
                    One donor sponsors the complete education of one student
                  </span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <span>{CURRENCY_META[currency]?.flag}</span>
                    <span>{CURRENCY_META[currency]?.name || currency}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Form */}
          <Card className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base sm:text-lg font-semibold">Complete Sponsorship</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-3">
                    Sponsorship Amount (Fixed)
                  </label>
                  <div className="bg-slate-50 p-3 sm:p-4 rounded-lg border">
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">
                      {fmtAmount(totalNeed, currency)}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600">
                      Complete education sponsorship
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-3">
                    Payment Schedule
                  </label>
                  <div className="space-y-2">
                    {frequencyOptions.map((option) => (
                      <label key={option.value} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border cursor-pointer hover:bg-slate-50 min-h-[44px]">
                        <input
                          type="radio"
                          name="frequency"
                          value={option.value}
                          checked={paymentFrequency === option.value}
                          onChange={(e) => setPaymentFrequency(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
                            <span className="text-sm sm:text-base font-medium text-slate-900">{option.label}</span>
                            <span className="text-sm sm:text-base font-semibold text-emerald-600">
                              {fmtAmount(getAmountForFrequency(option.value), currency)}
                              {option.value !== "one-time" && <span className="text-xs text-slate-500">/{option.value.replace("-", " ")}</span>}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 mt-1">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs sm:text-sm font-medium">Secure Payment</span>
                </div>
                <div className="text-xs text-blue-600">
                  Your payment is processed securely through Stripe. All donations go directly to the student's education expenses.
                </div>
              </div>

              <StablePaymentForm 
                student={student}
                user={user}
                token={token}
                currency={currency}
                totalNeed={totalNeed}
                paymentFrequency={paymentFrequency}
                getPaymentAmount={getPaymentAmount}
                onSuccess={(message) => {
                  toast.success(message);
                  navigate('/donor/portal?tab=sponsored');
                }}
                onError={(message) => toast.error(message)}
              />

              <div className="text-xs text-slate-500 text-center px-2">
                By proceeding, you agree to sponsor {student.name}'s complete education.
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Export the main component directly - no need for Elements wrapper
export default DonorPayment;