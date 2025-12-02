import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { API } from "@/lib/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [validToken, setValidToken] = useState(true);

  console.log(' ResetPassword component rendered with token:', token);

  useEffect(() => {
    console.log(' ResetPassword useEffect - token:', token);
    if (!token) {
      console.log(' No token found, redirecting to forgot-password');
      toast.error("Invalid reset link. Please request a new password reset.");
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!password) {
      toast.error("Please enter a new password.");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setBusy(true);
      
      const res = await fetch(`${API.baseURL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token,
          password: password // Backend expects 'password', not 'newPassword'
        }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      
      toast.success("Password reset successfully! You can now log in with your new password.");
      navigate("/login");
    } catch (err) {
      console.error("Password reset failed:", err);
      if (err.message.includes("expired") || err.message.includes("invalid")) {
        toast.error("Reset link has expired or is invalid. Please request a new password reset.");
        setValidToken(false);
      } else {
        toast.error("Failed to reset password. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md w-full">
      <Card className="p-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Reset Password</h1>
          <p className="text-sm text-gray-600 mt-2">Enter your new password below</p>
        </div>
        
        {validToken ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New Password"
              disabled={busy}
            />
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              disabled={busy}
            />
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-red-600">This reset link is invalid or has expired.</p>
            <Button 
              onClick={() => navigate("/forgot-password")} 
              className="w-full"
            >
              Request New Reset Link
            </Button>
          </div>
        )}
        
        <div className="text-center">
          <button
            type="button"
            className="text-blue-600 hover:underline text-sm"
            onClick={() => navigate("/login")}
          >
            Back to sign in
          </button>
        </div>
      </Card>
    </div>
  );
}
