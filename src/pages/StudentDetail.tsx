import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, UserRound } from "lucide-react";

// Mock data - in real app this would come from API
const students = [
  { id: 1, name: "Ayesha Khan", field: "Computer Science", university: "NUST", gpa: 3.7, gradYear: 2026, needUSD: 2400, fundedUSD: 1800, gender: "F", location: "Islamabad" },
  { id: 2, name: "Bilal Ahmed", field: "Mechanical Engineering", university: "UET Lahore", gpa: 3.5, gradYear: 2025, needUSD: 1800, fundedUSD: 1800, gender: "M", location: "Lahore" },
  { id: 3, name: "Hira Fatima", field: "Medicine (MBBS)", university: "DUHS", gpa: 3.9, gradYear: 2027, needUSD: 5000, fundedUSD: 2200, gender: "F", location: "Karachi" },
  { id: 4, name: "Usman Tariq", field: "Electrical Engineering", university: "FAST", gpa: 3.2, gradYear: 2026, needUSD: 3200, fundedUSD: 900, gender: "M", location: "Peshawar" },
];

const applications = [
  {
    id: 101, studentId: 1, term: "Fall 2025", needUSD: 2400, fundedUSD: 1800, fxRate: 278.5,
    status: "Pending", submitted: "2025-08-07", notes: "Needs hostel allowance proof.",
    documents: [
      { id: "t1", type: "Transcript", name: "Transcript_2024.pdf", size: "412 KB", verified: true },
      { id: "c1", type: "CNIC / Student ID", name: "AyeshaKhan_CNIC.jpg", size: "1.2 MB", verified: true },
      { id: "a1", type: "Admission Letter", name: "NUST_Offer.pdf", size: "289 KB", verified: true },
      { id: "v1", type: "Intro Video", name: "intro.mp4", size: "8.4 MB", verified: false },
    ],
  },
  {
    id: 103, studentId: 3, term: "Fall 2025", needUSD: 5000, fundedUSD: 2200, fxRate: 278.5,
    status: "Pending", submitted: "2025-08-06", notes: "",
    documents: [
      { id: "t3", type: "Transcript", name: "MBBS_Y2.pdf", size: "533 KB", verified: true },
      { id: "c3", type: "CNIC / Student ID", name: "HiraFatima_CNIC.jpg", size: "1.0 MB", verified: true },
      { id: "a3", type: "Admission Letter", name: "DUHS_Offer.pdf", size: "310 KB", verified: true },
      { id: "v3", type: "Intro Video", name: "intro.mp4", size: "7.9 MB", verified: false },
    ],
  },
];

const donors = [
  { id: "d1", name: "Sarah Malik", org: "Malik Family Foundation", totalFunded: 6200, activeStudents: [1,3] },
  { id: "d2", name: "Imran Siddiqui", org: "—", totalFunded: 2400, activeStudents: [1] },
  { id: "d3", name: "PakTech Corp", org: "Corporate", totalFunded: 9800, activeStudents: [2,4] },
];

const sponsorships = [
  { studentId: 1, donorId: "d1", amount: 1200, date: "2025-08-08" },
  { studentId: 1, donorId: "d2", amount: 600, date: "2025-08-09" },
  { studentId: 3, donorId: "d1", amount: 1000, date: "2025-08-04" },
  { studentId: 2, donorId: "d3", amount: 1800, date: "2025-08-02" },
  { studentId: 4, donorId: "d3", amount: 900, date: "2025-08-03" },
];

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon?: any; title: string; subtitle?: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-emerald-600" aria-hidden />}
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);

const SecondaryButton = ({ children, className = "", ...props }: any) => (
  <button
    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium border shadow-sm border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${className}`}
    {...props}
  >
    {children}
  </button>
);

interface StudentDetailProps {
  id: number;
  goBack: () => void;
}

export const StudentDetail = ({ id, goBack }: StudentDetailProps) => {
  const s = students.find(x => x.id === id);
  const app = applications.find(a => a.studentId === id);
  if (!s) return <div className="text-slate-600">Student not found.</div>;
  const pct = Math.round((s.fundedUSD / s.needUSD) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle icon={UserRound} title={`${s.name} — ${s.university}`} subtitle={`${s.field} • ${s.location}`} />
        <SecondaryButton onClick={goBack}><ArrowLeft className="h-4 w-4"/> Back</SecondaryButton>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 md:col-span-2">
          <h3 className="text-base font-semibold text-slate-900 mb-3">Profile</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500">GPA</span><div className="font-medium">{s.gpa}</div></div>
            <div><span className="text-slate-500">Graduation Year</span><div className="font-medium">{s.gradYear}</div></div>
            <div><span className="text-slate-500">Gender</span><div className="font-medium">{s.gender}</div></div>
            <div><span className="text-slate-500">Location</span><div className="font-medium">{s.location}</div></div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1"><span>Funding Progress</span><span>{pct}%</span></div>
            <Progress value={pct}/>
            <div className="mt-1 text-sm text-slate-600">${s.fundedUSD.toLocaleString()} / ${s.needUSD.toLocaleString()}</div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold text-slate-900 mb-3">Latest Application</h3>
          {app ? (
            <div className="space-y-2 text-sm">
              <div>Term: <span className="font-medium">{app.term}</span></div>
              <div>Submitted: <span className="font-medium">{app.submitted}</span></div>
              <div>FX: <span className="font-medium">PKR→USD {app.fxRate}</span></div>
              <div className="mt-2">
                <h4 className="font-semibold">Documents</h4>
                <ul className="list-disc pl-5">
                  {app.documents.map(d => <li key={d.id}>{d.type}: {d.name} {d.verified ? "(Verified)" : "(Pending)"}</li>)}
                </ul>
              </div>
            </div>
          ) : <div className="text-sm text-slate-600">No application found.</div>}
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-3">Sponsorships</h3>
        <div className="space-y-2">
          {sponsorships.filter(x => x.studentId === id).map((sp, idx) => {
            const d = donors.find(dd => dd.id === sp.donorId);
            return (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                <div className="text-sm"><span className="font-medium">{d?.name}</span> • {d?.org}</div>
                <div className="text-sm font-semibold">${sp.amount.toLocaleString()}</div>
              </div>
            );
          })}
          {sponsorships.filter(x => x.studentId === id).length === 0 && (<div className="text-sm text-slate-600">No sponsorships yet.</div>)}
        </div>
      </Card>
    </div>
  );
};