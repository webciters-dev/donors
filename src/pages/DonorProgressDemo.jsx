// src/pages/DonorProgressDemo.jsx (static demo)
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { demoStudents, getStudentById } from "@/data/demoDonor";

export default function DonorProgressDemo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const s = getStudentById(id) || demoStudents[0];

  const milestones = [
    { date: "2024-10-01", text: "Enrollment confirmed" },
    { date: "2025-01-15", text: "Fall term completed" },
    { date: "2025-06-01", text: "Spring term completed" },
  ];
  const updates = [
    { from: "student", text: "Submitted mid-term transcript (GPA 3.35)", date: "2025-03-10" },
    { from: "student", text: "Volunteered at community tech camp", date: "2025-04-05" },
    { from: "donor", text: "Proud of your progress. Keep going!", date: "2025-04-06" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Student Progress (Demo)</h1>
        <div className="text-sm text-slate-600">Static preview · Milestones & GPA trend</div>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <div className="text-base font-semibold">{s.name}</div>
          <div className="text-sm text-slate-600">{s.program} · {s.university}</div>
        </div>

        {/* Milestones */}
        <div>
          <div className="font-medium mb-2">Academic milestones</div>
          <ol className="relative border-s border-slate-200 pl-4 space-y-3">
            {milestones.map((m, i) => (
              <li key={i} className="ml-2">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-emerald-600" />
                <div className="text-sm font-medium">{m.text}</div>
                <div className="text-xs text-slate-500">{new Date(m.date).toLocaleDateString()}</div>
              </li>
            ))}
          </ol>
        </div>

        {/* GPA Trend (simple bars; static) */}
        <div>
          <div className="font-medium mb-2">GPA trend</div>
          <div className="flex items-end gap-2 h-24">
            {s.gpaTrend.map((g, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="bg-emerald-600 w-6" style={{ height: `${(g / 4) * 100}%` }} />
                <div className="text-xs text-slate-600 mt-1">{g.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Interaction (static) */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="font-medium mb-2">Student updates & messages</div>
            <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
              {updates.map((u, i) => (
                <div key={i} className={u.from === 'student' ? '' : 'text-right'}>
                  <span className="font-semibold">{u.from === 'student' ? 'Student' : 'Donor'}:</span> {u.text}
                  <div className="text-xs text-slate-500">{new Date(u.date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-500 mt-2">Demo preview: in the live version the student can post progress, upload proofs, and exchange messages with the donor.</div>
          </Card>
          <Card className="p-4">
            <div className="font-medium mb-2">Recent uploads (demo)</div>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>Transcript_Spring2025.pdf</li>
              <li>Volunteer_Activity_Photo.jpg</li>
              <li>Internship_Offer_Letter.pdf</li>
            </ul>
          </Card>
        </div>

        <div className="flex items-center justify-end">
          <Button variant="outline" className="rounded-2xl" onClick={() => navigate(-1)}>Back</Button>
        </div>
      </Card>
    </div>
  );
}
