// src/pages/DonorStudentDetailsDemo.jsx (static demo)
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { demoStudents, getStudentById, fmtAmount } from "@/data/demoDonor";

export default function DonorStudentDetailsDemo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const s = getStudentById(id) || demoStudents[0];

  const remaining = Math.max(0, (s.need || 0) - (s.fundedUSD || 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Student Details (Demo)</h1>
        <div className="text-sm text-slate-600">Static preview</div>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-200 overflow-hidden" aria-hidden />
            <div>
            <div className="text-xl font-semibold">{s.name}</div>
            <div className="text-sm text-slate-600">{s.program} · {s.university}</div>
            <div className="flex gap-2 mt-2">
              {s.gender && <Badge variant="secondary">{s.gender}</Badge>}
              {s.city && <Badge variant="secondary">{s.city}</Badge>}
              {s.province && <Badge variant="secondary">{s.province}</Badge>}
            </div>
              <div className="text-xs text-slate-500 mt-1">Contact details are shared securely after sponsorship.</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">Full amount</div>
            <div className="text-2xl font-semibold">{fmtAmount(s.need, s.currency)}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <Card className="p-4">
            <div className="font-medium mb-2">Present Education</div>
            <div className="flex justify-between"><span>Institution</span><span>{s.currentInstitution || "—"}</span></div>
            <div className="flex justify-between"><span>City</span><span>{s.city || "—"}</span></div>
            <div className="flex justify-between"><span>Village</span><span>{s.village || "—"}</span></div>
            <div className="flex justify-between"><span>Province</span><span>{s.province || "—"}</span></div>
          </Card>
          <Card className="p-4">
            <div className="font-medium mb-2">Target (Funding For)</div>
            <div className="flex justify-between"><span>University</span><span>{s.targetUniversity || s.university}</span></div>
            <div className="flex justify-between"><span>Program</span><span>{s.targetProgram || s.program}</span></div>
            <div className="flex justify-between"><span>Total Need</span><span>{fmtAmount(s.need, s.currency)}</span></div>
            <div className="flex justify-between"><span>Already Funded</span><span>{fmtAmount(s.fundedUSD, s.currency)}</span></div>
          </Card>
        </div>

        {/* About & Highlights */}
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <Card className="p-4">
            <div className="font-medium mb-2">About the student</div>
            <p className="text-slate-700 whitespace-pre-wrap">{s.bio || '—'}</p>
          </Card>
          <Card className="p-4">
            <div className="font-medium mb-2">Academic highlights</div>
            <ul className="list-disc pl-5 space-y-1">
              {(s.achievements || []).map((a, i) => (<li key={i}>{a}</li>))}
              {(!s.achievements || s.achievements.length === 0) && <li>—</li>}
            </ul>
          </Card>
        </div>

        {/* Simple Financial Breakdown */}
        <Card className="p-4 text-sm">
          <div className="font-medium mb-2">How the funds will be used (demo)</div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-md border p-3"><div className="text-slate-600">Tuition</div><div className="font-semibold">{fmtAmount(s.financialBreakdown?.tuition || 0, s.currency)}</div></div>
            <div className="rounded-md border p-3"><div className="text-slate-600">Hostel/Living</div><div className="font-semibold">{fmtAmount(s.financialBreakdown?.hostel || 0, s.currency)}</div></div>
            <div className="rounded-md border p-3"><div className="text-slate-600">Books/Other</div><div className="font-semibold">{fmtAmount(s.financialBreakdown?.books || 0, s.currency)}</div></div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" className="rounded-2xl" onClick={() => navigate(-1)}>Back</Button>
          <Button className="rounded-2xl" onClick={() => navigate(`/donor/demo/pay/${s.id}`)}>Sponsor this student</Button>
        </div>
      </Card>
    </div>
  );
}
