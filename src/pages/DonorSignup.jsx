import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Password input component with visibility toggle - moved outside to prevent re-creation
const PasswordInput = ({ placeholder, value, onChange, show, setShow }) => (
  <div className="relative">
    <Input
      type={show ? "text" : "password"}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="pr-10"
    />
    <button
      type="button"
      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
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

export default function DonorSignup() {
  const navigate = useNavigate();
  const location = useLocation();

  // If we were sent here from “Sponsor” we preserve the return target
  const redirectTo = location.state?.redirectTo || "/marketplace";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill all fields.");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setBusy(true);
      const res = await fetch(`${API}/api/auth/register-donor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });
      if (!res.ok) throw new Error(await res.text());

      toast.success("Donor account created! Please sign in.");
      // send user to login and keep the intended return page
      navigate("/login", { replace: true, state: { redirectTo } });
    } catch (err) {
      console.error(err);
      toast.error("Signup failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 mx-auto max-w-xl w-full">
      <h1 className="text-2xl font-semibold">Donor Sign Up</h1>

      <Card className="p-6">
        <form onSubmit={submit} className="grid gap-4">
          <Input
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <PasswordInput
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            show={showPassword}
            setShow={setShowPassword}
          />
          <PasswordInput
            placeholder="Confirm password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            show={showConfirmPassword}
            setShow={setShowConfirmPassword}
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={busy} className="rounded-2xl">
              {busy ? "Creating…" : "Create account"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => navigate("/login", { state: { redirectTo } })}
            >
              Back to login
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
