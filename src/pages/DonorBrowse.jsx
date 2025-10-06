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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {demoStudents.map((s) => {
          const remaining = Math.max(0, (s.need || 0) - (s.fundedUSD || 0));
          return (
            <Card key={s.id} className="p-4 flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-base font-semibold">Student #{s.id.slice(-4)}</div>
                  <div className="text-sm text-slate-600">{s.program} · {s.university}</div>
                </div>
                <div className="shrink-0 rounded-full bg-amber-500 text-white text-xs font-semibold px-3 py-1 shadow-sm flex items-center gap-1">
                  <span>{getCurrencyFlag(s.currency)}</span>
                  <span>{fmtAmount(s.need, s.currency)}</span>
                </div>
              </div>

              <div className="text-sm text-slate-700 grid grid-cols-[120px,1fr] gap-y-1 items-start min-h-[140px]">
                <div className="text-slate-600">City</div><div className="text-right">{s.city}</div>
                <div className="text-slate-600">Province</div><div className="text-right">{s.province || '—'}</div>
                <div className="text-slate-600">Target</div><div className="text-right">{s.targetUniversity || s.university}</div>
                <div className="text-slate-600">Program</div><div className="text-right">{s.targetProgram || s.program}</div>
                <div className="text-slate-600">Latest GPA</div><div className="text-right">{(s.gpaTrend && s.gpaTrend.length) ? s.gpaTrend[s.gpaTrend.length-1].toFixed(2) : '—'}</div>
              </div>

              <div className="pt-2 mt-auto">
                <Button className="rounded-2xl w-full" onClick={() => navigate("/login")}>
                  View Details & Sponsor
                </Button>
                <p className="text-xs text-slate-500 text-center mt-2">
                  Sign in to see full profile and sponsor this student
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
