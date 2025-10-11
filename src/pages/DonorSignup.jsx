import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Country options with priority grouping
const COUNTRY_OPTIONS = {
  primary: [
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "PK", name: "Pakistan" },
  ],
  european: [
    { code: "AT", name: "Austria" },
    { code: "BE", name: "Belgium" },
    { code: "BG", name: "Bulgaria" },
    { code: "HR", name: "Croatia" },
    { code: "CY", name: "Cyprus" },
    { code: "CZ", name: "Czech Republic" },
    { code: "DK", name: "Denmark" },
    { code: "EE", name: "Estonia" },
    { code: "FI", name: "Finland" },
    { code: "FR", name: "France" },
    { code: "DE", name: "Germany" },
    { code: "GR", name: "Greece" },
    { code: "HU", name: "Hungary" },
    { code: "IE", name: "Ireland" },
    { code: "IT", name: "Italy" },
    { code: "LV", name: "Latvia" },
    { code: "LT", name: "Lithuania" },
    { code: "LU", name: "Luxembourg" },
    { code: "MT", name: "Malta" },
    { code: "NL", name: "Netherlands" },
    { code: "PL", name: "Poland" },
    { code: "PT", name: "Portugal" },
    { code: "RO", name: "Romania" },
    { code: "SK", name: "Slovakia" },
    { code: "SI", name: "Slovenia" },
    { code: "ES", name: "Spain" },
    { code: "SE", name: "Sweden" },
    { code: "CH", name: "Switzerland" },
    { code: "NO", name: "Norway" },
  ],
  other: [
    { code: "AF", name: "Afghanistan" },
    { code: "AL", name: "Albania" },
    { code: "DZ", name: "Algeria" },
    { code: "AR", name: "Argentina" },
    { code: "AM", name: "Armenia" },
    { code: "AZ", name: "Azerbaijan" },
    { code: "BH", name: "Bahrain" },
    { code: "BD", name: "Bangladesh" },
    { code: "BY", name: "Belarus" },
    { code: "BZ", name: "Belize" },
    { code: "BO", name: "Bolivia" },
    { code: "BA", name: "Bosnia and Herzegovina" },
    { code: "BW", name: "Botswana" },
    { code: "BR", name: "Brazil" },
    { code: "BN", name: "Brunei" },
    { code: "KH", name: "Cambodia" },
    { code: "CM", name: "Cameroon" },
    { code: "CL", name: "Chile" },
    { code: "CN", name: "China" },
    { code: "CO", name: "Colombia" },
    { code: "CR", name: "Costa Rica" },
    { code: "CU", name: "Cuba" },
    { code: "DO", name: "Dominican Republic" },
    { code: "EC", name: "Ecuador" },
    { code: "EG", name: "Egypt" },
    { code: "SV", name: "El Salvador" },
    { code: "ET", name: "Ethiopia" },
    { code: "FJ", name: "Fiji" },
    { code: "GA", name: "Gabon" },
    { code: "GM", name: "Gambia" },
    { code: "GE", name: "Georgia" },
    { code: "GH", name: "Ghana" },
    { code: "GT", name: "Guatemala" },
    { code: "GN", name: "Guinea" },
    { code: "GY", name: "Guyana" },
    { code: "HT", name: "Haiti" },
    { code: "HN", name: "Honduras" },
    { code: "HK", name: "Hong Kong" },
    { code: "IS", name: "Iceland" },
    { code: "IN", name: "India" },
    { code: "ID", name: "Indonesia" },
    { code: "IR", name: "Iran" },
    { code: "IQ", name: "Iraq" },
    { code: "IL", name: "Israel" },
    { code: "JM", name: "Jamaica" },
    { code: "JP", name: "Japan" },
    { code: "JO", name: "Jordan" },
    { code: "KZ", name: "Kazakhstan" },
    { code: "KE", name: "Kenya" },
    { code: "KW", name: "Kuwait" },
    { code: "KG", name: "Kyrgyzstan" },
    { code: "LA", name: "Laos" },
    { code: "LB", name: "Lebanon" },
    { code: "LR", name: "Liberia" },
    { code: "LY", name: "Libya" },
    { code: "MO", name: "Macao" },
    { code: "MG", name: "Madagascar" },
    { code: "MW", name: "Malawi" },
    { code: "MY", name: "Malaysia" },
    { code: "MV", name: "Maldives" },
    { code: "ML", name: "Mali" },
    { code: "MR", name: "Mauritania" },
    { code: "MU", name: "Mauritius" },
    { code: "MX", name: "Mexico" },
    { code: "MD", name: "Moldova" },
    { code: "MN", name: "Mongolia" },
    { code: "ME", name: "Montenegro" },
    { code: "MA", name: "Morocco" },
    { code: "MZ", name: "Mozambique" },
    { code: "MM", name: "Myanmar" },
    { code: "NA", name: "Namibia" },
    { code: "NP", name: "Nepal" },
    { code: "NZ", name: "New Zealand" },
    { code: "NI", name: "Nicaragua" },
    { code: "NE", name: "Niger" },
    { code: "NG", name: "Nigeria" },
    { code: "KP", name: "North Korea" },
    { code: "MK", name: "North Macedonia" },
    { code: "OM", name: "Oman" },
    { code: "PA", name: "Panama" },
    { code: "PG", name: "Papua New Guinea" },
    { code: "PY", name: "Paraguay" },
    { code: "PE", name: "Peru" },
    { code: "PH", name: "Philippines" },
    { code: "QA", name: "Qatar" },
    { code: "RU", name: "Russia" },
    { code: "RW", name: "Rwanda" },
    { code: "SA", name: "Saudi Arabia" },
    { code: "SN", name: "Senegal" },
    { code: "RS", name: "Serbia" },
    { code: "SC", name: "Seychelles" },
    { code: "SL", name: "Sierra Leone" },
    { code: "SG", name: "Singapore" },
    { code: "ZA", name: "South Africa" },
    { code: "KR", name: "South Korea" },
    { code: "SS", name: "South Sudan" },
    { code: "LK", name: "Sri Lanka" },
    { code: "SD", name: "Sudan" },
    { code: "SR", name: "Suriname" },
    { code: "SY", name: "Syria" },
    { code: "TW", name: "Taiwan" },
    { code: "TJ", name: "Tajikistan" },
    { code: "TZ", name: "Tanzania" },
    { code: "TH", name: "Thailand" },
    { code: "TG", name: "Togo" },
    { code: "TT", name: "Trinidad and Tobago" },
    { code: "TN", name: "Tunisia" },
    { code: "TR", name: "Turkey" },
    { code: "TM", name: "Turkmenistan" },
    { code: "UG", name: "Uganda" },
    { code: "UA", name: "Ukraine" },
    { code: "AE", name: "United Arab Emirates" },
    { code: "UY", name: "Uruguay" },
    { code: "UZ", name: "Uzbekistan" },
    { code: "VE", name: "Venezuela" },
    { code: "VN", name: "Vietnam" },
    { code: "YE", name: "Yemen" },
    { code: "ZM", name: "Zambia" },
    { code: "ZW", name: "Zimbabwe" },
  ]
};

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
  const { login } = useAuth();

  // If we were sent here from "Sponsor" we preserve the return target
  const redirectTo = location.state?.redirectTo || "/marketplace";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    country: "",
    organization: "",
    phone: "",
  });
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.country) {
      toast.error("Please fill all required fields.");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      setBusy(true);
      
      const requestData = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        country: form.country,
        organization: form.organization.trim() || null,
        phone: form.phone.trim() || null,
      };
      
      console.log("🚀 Sending registration request:", requestData);
      
      const res = await fetch(`${API}/api/auth/register-donor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Registration failed:", errorText);
        throw new Error(errorText);
      }

      const data = await res.json();
      console.log("🎉 Registration successful:", data);
      
      // Automatically log the user in with the returned token and user data
      login({
        token: data.token,
        user: {
          id: data.user.id,
          name: data.donor.name,
          email: data.user.email,
          role: data.user.role,
          donorId: data.donor.id,
        },
      });

      toast.success(`Welcome ${data.donor.name}! 🎉 Your donor account is ready.`);
      
      // Navigate to donor dashboard instead of login page
      navigate("/donor-dashboard", { replace: true });
    } catch (err) {
      console.error("Registration error:", err);
      // Show more specific error message
      const errorMessage = err.message || "Signup failed.";
      if (errorMessage.includes("already registered")) {
        toast.error("This email is already registered. Please try logging in instead.");
      } else if (errorMessage.includes("required")) {
        toast.error("Please fill all required fields.");
      } else {
        toast.error(`Signup failed: ${errorMessage}`);
      }
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
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          
          {/* Professional/Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select Country *</option>
              
              {/* Primary Donor Countries */}
              <optgroup label="🔝 Primary Countries">
                {COUNTRY_OPTIONS.primary.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </optgroup>
              
              {/* European Countries */}
              <optgroup label="🇪🇺 European Countries">
                {COUNTRY_OPTIONS.european.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </optgroup>
              
              {/* Other Countries */}
              <optgroup label="🌍 Other Countries">
                {COUNTRY_OPTIONS.other.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <Input
              placeholder="Phone number (optional)"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          
          <Input
            placeholder="Organization/Company (optional)"
            value={form.organization}
            onChange={(e) => setForm({ ...form, organization: e.target.value })}
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
