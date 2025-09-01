import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export const DonorPreferences = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-900">Donor Preferences</h1>
      </div>

      <Card className="p-6">
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

        <div className="mt-6">
          <h4 className="font-medium text-slate-900 mb-3">Interests</h4>
          <div className="flex flex-wrap gap-2">
            {["Computer Science", "Medicine", "Engineering", "Business", "Female Students", "Rural Areas"].map((interest) => (
              <span key={interest} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-2xl text-sm">
                {interest}
              </span>
            ))}
          </div>
        </div>

        <Button className="mt-6 rounded-2xl" onClick={() => alert("Preferences saved!")}>
          Save Preferences
        </Button>
      </Card>
    </div>
  );
};