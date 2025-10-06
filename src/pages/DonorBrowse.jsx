// src/pages/DonorBrowse.jsx (static demo)
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { demoStudents, fmtAmount } from "@/data/demoDonor";
import { getCurrencyFlag } from "@/lib/currency";
import { useNavigate } from "react-router-dom";

export default function DonorBrowse() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-emerald-900">Find Students to Help</h1>
          <Button 
            onClick={() => navigate("/donor-signup")} 
            className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl px-6"
          >
            Start Sponsoring
          </Button>
        </div>
        <p className="text-emerald-800 text-sm max-w-2xl">
          🎓 Make a difference in a student's life. Browse deserving students who need financial support for their education. 
          <strong> Sign up as a donor to see full profiles and sponsor students directly.</strong>
        </p>
      </div>

      {/* Empty state - no students to show yet */}
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🎓</div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">No Students Available Yet</h3>
        <p className="text-slate-600 max-w-md mx-auto mb-6">
          We're currently processing student applications. Check back soon to see deserving students who need your support!
        </p>
        <div className="space-y-3">
          <Button 
            onClick={() => navigate("/donor-signup")} 
            className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl px-6"
          >
            Sign Up as Donor
          </Button>
          <p className="text-sm text-slate-500">
            Get notified when new students are available for sponsorship
          </p>
        </div>
      </div>
    </div>
  );
}
