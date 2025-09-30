import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = params.get("token") || "";
    setToken(t);
  }, [params]);

  async function submit(e) {
    e.preventDefault();
    if (!token) {
      toast.error("Missing reset token.");
      return;
    }
    if (!password) {
      toast.error("Enter a new password.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setBusy(true);
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Password reset. Please sign in.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error("Reset failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reset Password</h1>

      <Card className="p-6 max-w-lg">
        <form onSubmit={submit} className="grid gap-4">
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Resetting…" : "Reset Password"}
          </Button>
          {!token && (
            <p className="text-sm text-slate-600">
              Tip: open the reset link from the email (or add <code>?token=…</code> in dev).
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
