import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }
    try {
      setBusy(true);
      const res = await fetch(`${API}/api/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      // In production you would get the token via email. For local dev we display it:
      if (data?.token) {
        console.log("Password reset token (dev):", data.token);
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

      <Card className="p-6 max-w-lg">
        <form onSubmit={submit} className="grid gap-4">
          <Input
            type="email"
            placeholder="Your account email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
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
    </div>
  );
}
