import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const DonorPreferences = () => {
  const { token, user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    organization: "",
    country: "",
    address: "",
    currencyPreference: "USD",
    taxId: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/api/donors/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        const d = json?.donor || {};
        setForm((f) => ({
          ...f,
          name: d.name || user?.email || "",
          organization: d.organization || "",
          country: d.country || "",
          address: d.address || "",
          currencyPreference: d.currencyPreference || "USD",
          taxId: d.taxId || "",
        }));
      } catch {}
    }
    if (token) load();
  }, [token]);

  async function save() {
    try {
      const res = await fetch(`${API}/api/donors/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Preferences saved");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save preferences");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-900">Donor Preferences</h1>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Organization</label>
            <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
            <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Preferred currency</label>
            <select
              className="w-full rounded-2xl border border-slate-200 px-3 py-2"
              value={form.currencyPreference}
              onChange={(e) => setForm({ ...form, currencyPreference: e.target.value })}
            >
              <option value="USD">USD</option>
              <option value="PKR">PKR</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tax ID (for receipts)</label>
            <Input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-4">Notification Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Alerts</label>
            <select className="w-full rounded-2xl border border-slate-200 px-3 py-2">
              <option>Weekly Summary</option>
              <option>Monthly Summary</option>
              <option>Immediate</option>
              <option>Never</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">SMS/WhatsApp</label>
            <select className="w-full rounded-2xl border border-slate-200 px-3 py-2">
              <option>Important Updates Only</option>
              <option>Weekly Summary</option>
              <option>Never</option>
            </select>
          </div>
        </div>

        <Button className="mt-6 rounded-2xl" onClick={save}>
          Save Preferences
        </Button>
      </Card>
    </div>
  );
};