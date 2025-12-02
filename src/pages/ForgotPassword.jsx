import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { API } from "@/lib/api";
import RecaptchaProtection from "@/components/RecaptchaProtection";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);



  async function submit(e, executeRecaptcha) {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }
    try {
      setBusy(true);

      // ️ reCAPTCHA Protection - Get verification token
      let recaptchaToken = null;
      if (executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha('reset');
          console.log('reCAPTCHA token obtained for password reset');
        } catch (recaptchaError) {
          console.error('reCAPTCHA failed:', recaptchaError);
          toast.error("Security verification failed. Please try again.");
          setBusy(false);
          return;
        }
      }

      const res = await fetch(`${API.baseURL}/api/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email,
          // ️ reCAPTCHA Protection
          recaptchaToken: recaptchaToken
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      // In production you would get the token via email. For local dev we display it:
      if (data?.token) {

      }
      setSent(true);
      toast.success("If that email exists, a reset link has been sent.");
    } catch (err) {
      console.error(err);
      toast.error("Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Forgot Password</h1>

      <RecaptchaProtection 
        version="v3"
        onError={(error) => {
          console.error('reCAPTCHA error:', error);
          toast.error('Security verification failed. Please refresh and try again.');
        }}
      >
        {({ executeRecaptcha }) => (
          <Card className="p-6 max-w-lg">
            <form onSubmit={(e) => submit(e, executeRecaptcha)} className="grid gap-4">
          <Input
            type="email"
            placeholder="Your account email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* ️ reCAPTCHA Protection Indicator */}
          {import.meta.env.VITE_DEVELOPMENT_MODE !== 'true' && (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-2">
              <Shield className="h-3 w-3" />
              <span>Protected by reCAPTCHA</span>
            </div>
          )}
          
          <Button type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </Button>
          {sent && (
            <p className="text-sm text-slate-600">
              Check your email for the reset link. (In dev, check server logs or network
              response for the token.)
            </p>
          )}
            </form>
          </Card>
        )}
      </RecaptchaProtection>
    </div>
  );
}
