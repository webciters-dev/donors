// Stable Payment Form Component - Isolated to prevent unmounting issues
import { useState, useRef, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { fmtAmount } from "@/lib/currency";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_4eC39HqLyjWDarjtT1zdp7dc');
const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Internal payment form component
const PaymentFormInner = ({ 
  student, 
  user, 
  token, 
  currency, 
  totalNeed, 
  paymentFrequency, 
  onSuccess, 
  onError,
  getPaymentAmount 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const cardElementRef = useRef(null);
  const processingRef = useRef(false);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    
    console.log("Payment form submit started");
    
    if (!stripe || !elements || !token) {
      onError("Payment system not ready. Please try again.");
      return;
    }

    if (processing || processingRef.current) {
      console.log("Already processing, ignoring submit");
      return;
    }

    if (!cardReady) {
      onError("Card form is not ready yet. Please wait and try again.");
      return;
    }

    // Immediately set processing flags to prevent re-renders
    processingRef.current = true;
    setProcessing(true);

    try {
      // Use stored CardElement reference - this should be stable
      let cardElement = cardElementRef.current;
      
      if (!cardElement) {
        console.warn("No stored CardElement, trying to get from elements");
        cardElement = elements.getElement(CardElement);
      }
      
      if (!cardElement) {
        throw new Error("Card element not available. Please refresh the page.");
      }

      console.log("Using CardElement for payment:", cardElement);

      // Create payment intent
      const paymentIntentRes = await fetch(`${API}/api/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: student.id,
          amount: totalNeed,
          currency: currency,
          paymentFrequency,
          userId: user.id,
        }),
      });

      if (!paymentIntentRes.ok) {
        const error = await paymentIntentRes.json();
        throw new Error(error.error || 'Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = await paymentIntentRes.json();
      console.log("Payment intent created successfully");

      // Confirm payment with Stripe - use the most current element reference
      const currentCardElement = cardElementRef.current || elements.getElement(CardElement);
      
      if (!currentCardElement) {
        throw new Error("Card element became unavailable during payment processing.");
      }

      console.log("Confirming payment with Stripe...");
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: currentCardElement,
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
        console.log("Payment succeeded, confirming on server...");
        
        // Confirm payment and create sponsorship record
        const confirmRes = await fetch(`${API}/api/payments/confirm-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentIntentId,
            studentId: student.id,
            amount: totalNeed,
            currency,
            paymentFrequency,
            userId: user.id,
          }),
        });

        if (confirmRes.ok) {
          const successMessage = paymentFrequency === "one-time" 
            ? `Payment successful! Thank you for sponsoring ${student.name}'s education.`
            : `${paymentFrequency} payment plan set up successfully! Thank you for sponsoring ${student.name}'s education.`;
          
          onSuccess(successMessage);
        } else {
          const error = await confirmRes.json();
          throw new Error(error.error || 'Payment processed but sponsorship record failed. Please contact support.');
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      onError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
      processingRef.current = false;
    }
  }, [stripe, elements, token, processing, cardReady, student, user, currency, totalNeed, paymentFrequency, onSuccess, onError]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Card Information
        </label>
        
        {/* Test mode helper */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-slate-500">Test Mode</span>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => toast("Test Card: 4242 4242 4242 4242 | Expiry: 12/25 | CVC: 123")}
          >
            Show Test Card
          </Button>
        </div>

        <CardElement
          key="stable-card-element"
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
          onReady={(element) => {
            console.log("CardElement ready in stable component:", element);
            cardElementRef.current = element;
            setCardReady(true);
          }}
          onChange={(event) => {
            if (event.error) {
              onError(event.error.message);
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
              : `Setup ${paymentFrequency.replace(/^./, c => c.toUpperCase())} - ${fmtAmount(getPaymentAmount(), currency)}`
            }
          </>
        )}
      </Button>
    </form>
  );
};

// Main stable payment form component with its own Elements provider
const StablePaymentForm = (props) => {
  return (
    <Elements stripe={stripePromise} key="stable-payment-elements">
      <PaymentFormInner {...props} />
    </Elements>
  );
};

export default StablePaymentForm;