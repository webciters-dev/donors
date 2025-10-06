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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sponsor a Student (Demo)</h1>
        <div className="text-sm text-slate-600">Static preview · No sign-in required</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {demoStudents.map((s) => {
          const remaining = Math.max(0, (s.need || 0) - (s.fundedUSD || 0));
          return (
            <Card key={s.id} className="p-4 flex flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-base font-semibold">{s.name}</div>
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

              <div className="pt-2 mt-auto grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button className="rounded-2xl w-full" onClick={() => navigate(`/donor/demo/student/${s.id}`)}>
                  Student details
                </Button>
                <Button variant="outline" className="rounded-2xl w-full" onClick={() => navigate(`/donor/demo/progress/${s.id}`)}>
                  Progress
                </Button>
                <Button variant="outline" className="rounded-2xl w-full" onClick={() => navigate(`/donor/demo/repayment/${s.id}`)}>
                  Repayment
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
