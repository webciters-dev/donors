// src/pages/DonorRepaymentDemo.jsx (static demo)
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { demoStudents, getStudentById, fmtAmount } from "@/data/demoDonor";

export default function DonorRepaymentDemo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const s = getStudentById(id) || demoStudents[0];

  // Static repayment schedule (demo only)
  const totalFunded = (s.need || 0); // demo assumes full funding
  const repayments = [
    { date: "2026-07-01", amount: 50 },
    { date: "2026-08-01", amount: 50 },
    { date: "2026-09-01", amount: 60 },
    { date: "2026-10-01", amount: 60 },
  ];
  const repaid = repayments.reduce((sum, r) => sum + r.amount, 0);
  const remaining = Math.max(0, totalFunded - repaid);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Loan Repayment (Demo)</h1>
        <div className="text-sm text-slate-600">Static preview · Sample schedule</div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-200 overflow-hidden" aria-hidden />
            <div>
              <div className="text-base font-semibold">{s.name}</div>
              <div className="text-sm text-slate-600">{s.program} · {s.university}</div>
              <div className="text-xs text-slate-500">Email: {s.contactEmail} · Phone: {s.contactPhone}</div>
              <div className="text-xs text-slate-500">Address: {s.address}</div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">Repayments go back to AWAKE to sponsor another student.</div>
        </div>

        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-md border p-3">
            <div className="text-slate-600">Total Funded</div>
            <div className="text-lg font-semibold">{fmtAmount(totalFunded, s.currency)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-slate-600">Repaid so far</div>
            <div className="text-lg font-semibold">{fmtAmount(repaid, s.currency)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-slate-600">Remaining</div>
            <div className="text-lg font-semibold">{fmtAmount(remaining, s.currency)}</div>
          </div>
        </div>

        <div className="rounded-md border">
          <div className="px-3 py-2 font-medium border-b">Repayment history</div>
          <div className="divide-y">
            {repayments.map((r, i) => (
              <div key={i} className="px-3 py-2 flex justify-between text-sm">
                <span>{new Date(r.date).toLocaleDateString()}</span>
                <span>{fmtAmount(r.amount, s.currency)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border p-3 text-sm">
          <div className="font-medium mb-1">Employment (demo)</div>
          <div className="flex justify-between"><span>Company</span><span>{s.job?.company || '—'}</span></div>
          <div className="flex justify-between"><span>Position</span><span>{s.job?.title || '—'}</span></div>
          <div className="flex justify-between"><span>Salary</span><span>{s.job?.salary ? fmtAmount(s.job.salary, s.job.currency || s.currency) : '—'}</span></div>
          <div className="flex justify-between"><span>Start Date</span><span>{s.job?.startDate ? new Date(s.job.startDate).toLocaleDateString() : '—'}</span></div>
        </div>

        <div className="flex items-center justify-end">
          <Button variant="outline" className="rounded-2xl" onClick={() => navigate(-1)}>Back</Button>
        </div>
      </Card>
    </div>
  );
}
