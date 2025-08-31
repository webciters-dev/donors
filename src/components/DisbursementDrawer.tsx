import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SecondaryButton = ({ children, className = "", ...props }: any) => (
  <button
    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium border shadow-sm border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${className}`}
    {...props}
  >
    {children}
  </button>
);

interface DisbursementDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const DisbursementDrawer = ({ open, onClose }: DisbursementDrawerProps) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-slate-900/50" onClick={onClose} />
      <div className="w-full max-w-xl h-full overflow-y-auto bg-white shadow-xl ring-1 ring-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Record Disbursement</h3>
            <p className="text-sm text-slate-500">Disburse only when term funding is 100% and upload proof of payment.</p>
          </div>
          <SecondaryButton onClick={onClose}>Close</SecondaryButton>
        </div>

        <div className="p-6 space-y-5">
          <Card className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="text-slate-600">Student</span>
                <input className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400" defaultValue="Ayesha Khan" />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Term</span>
                <input className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400" defaultValue="Fall 2025" />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Amount (USD)</span>
                <input className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400" defaultValue="1200" />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">FX Rate (PKR→USD)</span>
                <input className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400" defaultValue="278.00" />
              </label>
            </div>
            <label className="block text-sm">
              <span className="text-slate-600">University Payee</span>
              <input className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="e.g., NUST Student Accounts" />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Proof of Payment (PDF/JPG)</span>
              <input type="file" className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </label>
          </Card>

          <div className="flex items-center justify-between">
            <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
            <Button onClick={() => alert("Disbursement recorded (static)")}>Save Disbursement</Button>
          </div>
        </div>
      </div>
    </div>
  );
};