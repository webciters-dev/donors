import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon?: any; title: string; subtitle?: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-emerald-600" aria-hidden />}
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200">
    {children}
  </span>
);

export const DonorPreferences = () => {
  return (
    <div className="space-y-6">
      <SectionTitle icon={Bell} title="Donor Preferences" subtitle="Alerts and categories for your matches" />
      <Card className="p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-slate-600">Email Alerts</span>
            <select className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400" defaultValue="weekly">
              <option value="off">Off</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="instant">Instant</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">WhatsApp/SMS Alerts</span>
            <select className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400" defaultValue="off">
              <option value="off">Off</option>
              <option value="weekly">Weekly</option>
              <option value="instant">Instant</option>
            </select>
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-slate-600">Interests</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Computer Science","Medicine","Engineering","Business","First-Gen","Women-in-STEM"].map(t => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </label>
        <div className="flex items-center justify-end">
          <Button onClick={() => alert("Preferences saved (static)")}>Save Preferences</Button>
        </div>
      </Card>
    </div>
  );
};