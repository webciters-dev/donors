// src/pages/DonorPayment.jsx (dynamic payment processing with Stripe)
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
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

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_4eC39HqLyjWDarjtT1zdp7dc');

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

function DonorPayment() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [currency, setCurrency] = useState("PKR");
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
    const totalNeed = student?.needUSD || 0;
    // For a 2-year program, calculate payments over 24 months
    switch (paymentFrequency) {
      case "monthly":
        return Math.ceil(totalNeed / 24); // 24 months over 2 years
      case "quarterly":
        return Math.ceil(totalNeed / 8);  // 8 quarters over 2 years
      case "bi-annually":
        return Math.ceil(totalNeed / 4);  // 4 payments over 2 years
      case "annually":
        return Math.ceil(totalNeed / 2);  // 2 payments over 2 years
      default:
        return totalNeed; // One-time payment
    }
  };

  // Calculate payment amount for a specific frequency (not the currently selected one)
  const getAmountForFrequency = (frequency) => {
    const totalNeed = student?.needUSD || 0;
    switch (frequency) {
      case "monthly":
        return Math.ceil(totalNeed / 24); // 24 months over 2 years
      case "quarterly":
        return Math.ceil(totalNeed / 8);  // 8 quarters over 2 years
      case "bi-annually":
        return Math.ceil(totalNeed / 4);  // 4 payments over 2 years
      case "annually":
        return Math.ceil(totalNeed / 2);  // 2 payments over 2 years
      default:
        return totalNeed; // One-time payment
    }
  };

  // Load student data
  useEffect(() => {
    async function loadStudent() {
      try {
        setLoading(true);
        
        console.log("Loading student for payment:", studentId);
        
        // Try the new individual student endpoint first
        let res = await fetch(`${API}/api/students/approved/${studentId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.student) {
            console.log("Student loaded successfully:", data.student.name);
            setStudent(data.student);
            // Determine currency based on country
            const countryCurrency = getCurrencyFromCountry(data.student.country);
            setCurrency(data.student.currency || countryCurrency);
            return;
          }
        }
        
        // Fallback: try to get student from approved students API
        res = await fetch(`${API}/api/students/approved`);
        if (res.ok) {
          const data = await res.json();
          const students = data.students || [];
          const foundStudent = students.find(s => s.id === studentId);
          
          if (foundStudent) {
            console.log("Student found in list:", foundStudent.name);
            setStudent(foundStudent);
            // Determine currency based on country
            const countryCurrency = getCurrencyFromCountry(foundStudent.country);
            setCurrency(foundStudent.application?.currency || countryCurrency);
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

  // Stripe Payment Form Component
  const PaymentForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [cardReady, setCardReady] = useState(false);

    const handleSubmit = async (event) => {
      event.preventDefault();
      
      if (!stripe || !elements || !token) {
        toast.error("Payment system not ready. Please try again.");
        return;
      }

      let cardElement = elements.getElement(CardElement);
      
      // If CardElement is not immediately available, wait and try again
      if (!cardElement) {
        await new Promise(resolve => setTimeout(resolve, 200));
        cardElement = elements.getElement(CardElement);
      }
      
      if (!cardElement) {
        toast.error("Card information is required. Please refresh the page and try again.");
        return;
      }

      setProcessing(true);

      try {
        // Create payment intent on the server
        const paymentIntentRes = await fetch(`${API}/api/payments/create-payment-intent`, {
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

        // Confirm payment with Stripe
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user.name || 'Anonymous Donor',
              email: user.email,
            },
          },
        });

        if (stripeError) {
          throw new Error(stripeError.message);
        }

        if (paymentIntent.status === 'succeeded') {
          // Confirm payment and create sponsorship record
          const confirmRes = await fetch(`${API}/api/payments/confirm-payment`, {
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
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 border rounded-lg">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Card Information
          </label>
          
          {/* Test mode helper */}
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            <div className="flex items-center justify-between">
              <span>🧪 Test Mode - Use test card numbers</span>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Show test card information
                  toast("Test Card: 4242 4242 4242 4242 | Expiry: 12/25 | CVC: 123");
                }}
              >
                Show Test Card
              </Button>
            </div>
          </div>

          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
              hidePostalCode: false,
            }}
            onReady={() => setCardReady(true)}
            onChange={(event) => {
              if (event.error) {
                toast.error(event.error.message);
              }
            }}
          />
        </div>
        
        <Button
          type="submit"
          className="w-full rounded-2xl"
          size="lg"
          disabled={!stripe || !cardReady || processing}
        >
          {processing ? (
            <>Processing...</>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              {paymentFrequency === "one-time" 
                ? `Pay ${fmtAmount(totalNeed, currency)}` 
                : `Setup ${frequencyOptions.find(o => o.value === paymentFrequency)?.label} - ${fmtAmount(getPaymentAmount(), currency)}`
              }
            </>
          )}
        </Button>
      </form>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Loading student details...</h1>
        </div>
        <div className="text-sm text-slate-600">
          Student ID: {studentId}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Student Not Found</h1>
        </div>
        <Card className="p-8 text-center">
          <div className="text-slate-600">The student you're looking for could not be found.</div>
        </Card>
      </div>
    );
  }

  const totalNeed = student?.needUSD || 0;
  const isAlreadySponsored = student?.sponsored || (student?.remainingNeed <= 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Sponsor {student.name}</h1>
      </div>

      {isAlreadySponsored ? (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <Badge variant="default" className="px-4 py-2">
              ✓ Already Sponsored
            </Badge>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">This student is fully sponsored</h3>
              <p className="text-slate-600 mt-2">
                {student.name} has already received full sponsorship for their education.
                Thank you for your interest in helping students!
              </p>
            </div>
            <Button onClick={() => navigate('/marketplace')} className="rounded-2xl">
              Browse Other Students
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Info */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{student.name}</h3>
                  <div className="text-slate-600">{student.program}</div>
                  <div className="text-sm text-slate-500">{student.university}</div>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                  {student.city}
                </Badge>
              </div>

              <div className="border-t border-slate-200 my-4"></div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Educational Need:</span>
                  <span className="font-semibold text-lg">{fmtAmount(totalNeed, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
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
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-semibold">Complete Sponsorship</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Sponsorship Amount (Fixed)
                  </label>
                  <div className="bg-slate-50 p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-slate-900">
                      {fmtAmount(totalNeed, currency)}
                    </div>
                    <div className="text-sm text-slate-600">
                      Complete education sponsorship
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Payment Schedule
                  </label>
                  <div className="space-y-2">
                    {frequencyOptions.map((option) => (
                      <label key={option.value} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50">
                        <input
                          type="radio"
                          name="frequency"
                          value={option.value}
                          checked={paymentFrequency === option.value}
                          onChange={(e) => setPaymentFrequency(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-slate-900">{option.label}</span>
                            <span className="font-semibold text-emerald-600">
                              {fmtAmount(getAmountForFrequency(option.value), currency)}
                              {option.value !== "one-time" && <span className="text-xs text-slate-500">/{option.value.replace("-", " ")}</span>}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-medium">Secure Payment</span>
                </div>
                <div className="text-xs text-blue-600">
                  Your payment is processed securely through Stripe. All donations go directly to the student's education expenses.
                </div>
              </div>

              <PaymentForm />

              <div className="text-xs text-slate-500 text-center">
                By proceeding, you agree to sponsor {student.name}'s complete education.
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Main component wrapped with Stripe Elements
export default function DonorPaymentWithStripe() {
  return (
    <Elements stripe={stripePromise}>
      <DonorPayment />
    </Elements>
  );
}