import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserRound, DollarSign } from "lucide-react";

// New mock data — no partial funding
type Student = {
  id: number;
  name: string;
  field: string;
  university: string;
  gpa: number;
  gradYear: number;
  amountUSD: number;      // full requested amount
  gender: "M" | "F";
  location: string;
  sponsored: boolean;
  sponsorId?: string;     // optional when sponsored
};

const students: Student[] = [
  { id: 1, name: "Ayesha Khan", field: "Computer Science",       university: "NUST",       gpa: 3.7, gradYear: 2026, amountUSD: 2400, gender: "F", location: "Islamabad", sponsored: true,  sponsorId: "d1" },
  { id: 2, name: "Bilal Ahmed",  field: "Mechanical Engineering", university: "UET Lahore", gpa: 3.5, gradYear: 2025, amountUSD: 1800, gender: "M", location: "Lahore",    sponsored: true,  sponsorId: "d3" },
  { id: 3, name: "Hira Fatima",  field: "Medicine (MBBS)",        university: "DUHS",       gpa: 3.9, gradYear: 2027, amountUSD: 5000, gender: "F", location: "Karachi",   sponsored: false },
  { id: 4, name: "Usman Tariq",  field: "Electrical Engineering", university: "FAST",       gpa: 3.2, gradYear: 2026, amountUSD: 3200, gender: "M", location: "Peshawar",  sponsored: false },
];

// Simple term application (unchanged)
const applications = [
  {
    id: 101, studentId: 1, term: "Fall 2025", amountUSD: 2400, fxRate: 278.5,
    status: "Pending", submitted: "2025-08-07", notes: "Needs hostel allowance proof.",
    documents: [
      { id: "t1", type: "Transcript", name: "Transcript_2024.pdf", size: "412 KB", verified: true },
      { id: "c1", type: "CNIC / Student ID", name: "AyeshaKhan_CNIC.jpg", size: "1.2 MB", verified: true },
      { id: "a1", type: "Admission Letter", name: "NUST_Offer.pdf", size: "289 KB", verified: true },
      { id: "v1", type: "Intro Video", name: "intro.mp4", size: "8.4 MB", verified: false },
    ],
  },
  {
    id: 103, studentId: 3, term: "Fall 2025", amountUSD: 5000, fxRate: 278.5,
    status: "Pending", submitted: "2025-08-06", notes: "",
    documents: [
      { id: "t3", type: "Transcript", name: "MBBS_Y2.pdf", size: "533 KB", verified: true },
      { id: "c3", type: "CNIC / Student ID", name: "HiraFatima_CNIC.jpg", size: "1.0 MB", verified: true },
      { id: "a3", type: "Admission Letter", name: "DUHS_Offer.pdf", size: "310 KB", verified: true },
      { id: "v3", type: "Intro Video", name: "intro.mp4", size: "7.9 MB", verified: false },
    ],
  },
];

// Donors + a minimal sponsorship log (single-sponsor model)
const donors = [
  { id: "d1", name: "Sarah Malik",    org: "Malik Family Foundation" },
  { id: "d2", name: "Imran Siddiqui", org: "—" },
  { id: "d3", name: "PakTech Corp",   org: "Corporate" },
];

const sponsorships = [
  { studentId: 1, donorId: "d1", date: "2025-08-08", amount: 2400 },
  { studentId: 2, donorId: "d3", date: "2025-08-02", amount: 1800 },
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
  const s = students.find((x) => x.id === id);
  const app = applications.find((a) => a.studentId === id);
  if (!s) return <div className="text-slate-600">Student not found.</div>;

  const sponsor = s.sponsored ? donors.find((d) => d.id === s.sponsorId) : undefined;
  const sponsorship = sponsorships.find((sp) => sp.studentId === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle icon={UserRound} title={`${s.name} — ${s.university}`} subtitle={`${s.field} • ${s.location}`} />
        <SecondaryButton onClick={goBack}><ArrowLeft className="h-4 w-4" /> Back</SecondaryButton>
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

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-slate-700">
              Requested amount: <span className="font-semibold">${s.amountUSD.toLocaleString()}</span>
            </div>
            {s.sponsored ? (
              <Badge variant="emerald">Sponsored</Badge>
            ) : (
              <Button onClick={() => alert(`Sponsor ${s.name} for $${s.amountUSD.toLocaleString()}`)}>
                <DollarSign className="h-4 w-4 mr-1" /> Sponsor Now
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold text-slate-900 mb-3">Latest Application</h3>
          {app ? (
            <div className="space-y-2 text-sm">
              <div>Term: <span className="font-medium">{app.term}</span></div>
              <div>Submitted: <span className="font-medium">{app.submitted}</span></div>
              <div>FX: <span className="font-medium">PKR→USD {app.fxRate}</span></div>
              <div>Requested: <span className="font-medium">${app.amountUSD.toLocaleString()}</span></div>
              <div className="mt-2">
                <h4 className="font-semibold">Documents</h4>
                <ul className="list-disc pl-5">
                  {app.documents.map((d) => (
                    <li key={d.id}>
                      {d.type}: {d.name} {d.verified ? "(Verified)" : "(Pending)"}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-600">No application found.</div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="text-base font-semibold text-slate-900 mb-3">Sponsorship</h3>
        {s.sponsored && sponsor && sponsorship ? (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
            <div className="text-sm">
              <span className="font-medium">{sponsor.name}</span> • {sponsor.org || "—"}
              <div className="text-xs text-slate-500">Since {sponsorship.date}</div>
            </div>
            <div className="text-sm font-semibold">${s.amountUSD.toLocaleString()}</div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
            <div className="text-sm">This student is currently <span className="font-medium">Available</span>.</div>
            <Button onClick={() => alert(`Sponsor ${s.name} for $${s.amountUSD.toLocaleString()}`)}>
              <DollarSign className="h-4 w-4 mr-1" /> Sponsor Now
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
