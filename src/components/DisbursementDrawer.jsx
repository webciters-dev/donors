import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, DollarSign, Calendar, User } from "lucide-react";

export const DisbursementDrawer = ({ open, onClose }) => {
  const [amount, setAmount] = useState("");
  const [student, setStudent] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    alert(`Disbursement recorded: $${amount} to ${student}`);
    onClose();
    setAmount("");
    setStudent("");
    setNotes("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-2xl"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Record Disbursement</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Student Name
              </label>
              <Input
                placeholder="Enter student name"
                value={student}
                onChange={(e) => setStudent(e.target.value)}
                className="rounded-2xl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Amount (USD)
              </label>
              <Input
                type="number"
                placeholder="2,500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-2xl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                placeholder="Additional notes about this disbursement..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1 rounded-2xl">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1 rounded-2xl">
              Record Disbursement
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};