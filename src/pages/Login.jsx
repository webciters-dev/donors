// frontend/src/pages/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import { API } from "@/lib/api";

// Password input component with visibility toggle - moved outside to prevent re-creation
const PasswordInput = ({ placeholder, value, onChange, autoComplete, showPassword, onToggleVisibility }) => (
  <div className="relative">
    <Input
      type={showPassword ? "text" : "password"}
      placeholder={placeholder}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      className="pr-10"
    />
    <button
      type="button"
      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
      onClick={onToggleVisibility}
    >
      {showPassword ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </button>
  </div>
);

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth(); // expects login({ token, user })

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // where to send the user after login
  const redirectFromState = location.state?.redirectTo || null;
  const redirectFromQuery = new URLSearchParams(location.search).get("redirect");
  const redirectTarget = redirectFromState || redirectFromQuery || null;

  // If already logged in, route by role (unless we have an explicit redirect)
  useEffect(() => {
    if (!user) return;
    if (redirectTarget) {
      navigate(redirectTarget, { replace: true });
      return;
    }
    goHomeByRole(user.role, user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const goHomeByRole = (role, userObj = null) => {
    if (role === "ADMIN") return navigate("/admin/applications", { replace: true });
    if (role === "STUDENT") {
      // Route students based on their phase
      const studentPhase = userObj?.studentPhase;
      if (studentPhase === 'ACTIVE') {
        return navigate("/student/active", { replace: true });
      } else {
        return navigate("/my-application", { replace: true });
      }
    }
    if (role === "SUB_ADMIN") return navigate("/sub-admin", { replace: true });
    if (role === "DONOR") return navigate("/marketplace", { replace: true }); // donors land back on marketplace
    return navigate("/", { replace: true });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API.baseURL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(data?.error || `Login failed (HTTP ${res.status})`);
      }

      // data: { token, user: { id, email, role } }
      if (!data?.token || !data?.user) {
        throw new Error("Malformed login response");
      }

      // Save into auth context (this should persist token inside the context)
      login({ token: data.token, user: data.user });

      toast.success("Welcome back!");

      // Prefer explicit redirect target, else route by role
      if (redirectTarget) {
        navigate(redirectTarget, { replace: true });
      } else {
        goHomeByRole(data.user.role, data.user);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function goDonorSignup() {
    const state = redirectTarget ? { redirectTo: redirectTarget } : undefined;
    navigate("/donor-signup", { state });
  }

  function goForgotPassword() {
    // keep email if user typed one; keep redirect destination too
    const query = email ? `?email=${encodeURIComponent(email)}` : "";
    const state = redirectTarget ? { redirectTo: redirectTarget } : undefined;
    navigate(`/forgot-password${query}`, { state });
  }

  return (
    <div className="mx-auto max-w-md w-full">
      <Card className="p-6 space-y-5 hover:shadow-lg transition-shadow duration-300">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sign in</h1>
          <p className="text-sm text-gray-600">Use your email and password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <PasswordInput
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showPassword={showPassword}
            onToggleVisibility={() => setShowPassword(!showPassword)}
          />

          <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            className="text-green-700 hover:underline"
            onClick={goForgotPassword}
          >
            Forgot password?
          </button>
          <button
            type="button"
            className="text-emerald-700 hover:underline"
            onClick={goDonorSignup}
          >
            New donor? Create an account
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Tip: students can log in with the email/password they created during application.
        </p>
      </Card>
    </div>
  );
}
