// src/pages/DonorPaymentDemo.jsx (static demo)
import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoStudents, getStudentById, fmtAmount } from "@/data/demoDonor";

export default function DonorPaymentDemo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const s = getStudentById(id) || demoStudents[0];
  const remaining = Math.max(0, (s.need || 0) - (s.fundedUSD || 0));
  const [mode, setMode] = useState("full"); // 'full' | 'monthly'
  const [months, setMonths] = useState(12);
  const monthlyAmount = useMemo(() => {
    if (!remaining || !months || months <= 0) return 0;
    return Math.ceil(remaining / months);
  }, [remaining, months]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Make a Contribution (Demo)</h1>
        <div className="text-sm text-slate-600">Static preview · No payments processed</div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200" aria-hidden />
          <div>
            <div className="text-base font-semibold">{s.name}</div>
            <div className="text-sm text-slate-600">{s.program} · {s.university}</div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border p-3">
            <div className="text-slate-600">Total Need</div>
            <div className="text-lg font-semibold">{fmtAmount(s.need, s.currency)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-slate-600">Already Funded</div>
            <div className="text-lg font-semibold">{fmtAmount(s.fundedUSD, s.currency)}</div>
          </div>
        </div>

        <div className="rounded-md border p-3 text-sm bg-amber-50 border-amber-200">
          Demo note: Select Full amount or a Monthly pledge. This is a static preview; payments are disabled.
        </div>

        {/* Sponsorship mode toggle */}
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-700">Sponsorship mode</div>
          <div className="flex gap-2">
            <Button
              type="button"
              className="rounded-2xl"
              variant={mode === "full" ? "default" : "outline"}
              onClick={() => setMode("full")}
            >
              Full amount
            </Button>
            <Button
              type="button"
              className="rounded-2xl"
              variant={mode === "monthly" ? "default" : "outline"}
              onClick={() => setMode("monthly")}
            >
              Monthly pledge
            </Button>
          </div>
        </div>
        {mode === 'monthly' && (
          <div className="text-xs text-slate-500 -mt-2 mb-2">
            Pay-it-forward: Your monthly pledge is received by AWAKE and forwarded to the university each month.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            {mode === "full" ? (
              <>
                <label className="text-sm text-slate-700">Amount ({s.currency})</label>
                <Input className="rounded-2xl mt-1" value={remaining} readOnly />
              </>
            ) : (
              <>
                <label className="text-sm text-slate-700">Monthly amount ({s.currency})</label>
                <Input className="rounded-2xl mt-1" value={monthlyAmount} readOnly />
                <div className="text-xs text-slate-500 mt-1">Estimated total {months} × {s.currency} {monthlyAmount} = {s.currency} {monthlyAmount * months}</div>
              </>
            )}
          </div>
          <div>
            {mode === "monthly" ? (
              <>
                <label className="text-sm text-slate-700">Months</label>
                <Input
                  className="rounded-2xl mt-1"
                  type="number"
                  min={1}
                  max={60}
                  value={months}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (Number.isNaN(v)) return;
                    setMonths(Math.min(60, Math.max(1, v)));
                  }}
                />
              </>
            ) : (
              <>
                <label className="text-sm text-slate-700">Payment method</label>
                <Input className="rounded-2xl mt-1" placeholder="Card (disabled in demo)" readOnly />
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" className="rounded-2xl" onClick={() => navigate(-1)}>Back</Button>
          <Button className="rounded-2xl" disabled>Pay (disabled in demo)</Button>
        </div>
      </Card>
    </div>
  );
}
