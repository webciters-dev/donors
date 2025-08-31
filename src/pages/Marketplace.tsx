import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Filter, Heart, UserRound, GraduationCap, Building2, DollarSign } from "lucide-react";

// Mock data matching original design
const students = [
  { id: 1, name: "Ayesha Khan", field: "Computer Science", university: "NUST", gpa: 3.7, gradYear: 2026, needUSD: 2400, fundedUSD: 1800, gender: "F", location: "Islamabad" },
  { id: 2, name: "Bilal Ahmed", field: "Mechanical Engineering", university: "UET Lahore", gpa: 3.5, gradYear: 2025, needUSD: 1800, fundedUSD: 1800, gender: "M", location: "Lahore" },
  { id: 3, name: "Hira Fatima", field: "Medicine (MBBS)", university: "DUHS", gpa: 3.9, gradYear: 2027, needUSD: 5000, fundedUSD: 2200, gender: "F", location: "Karachi" },
  { id: 4, name: "Usman Tariq", field: "Electrical Engineering", university: "FAST", gpa: 3.2, gradYear: 2026, needUSD: 3200, fundedUSD: 900, gender: "M", location: "Peshawar" },
];

const FiltersBar = ({ onSearch, onFilterToggle }: { onSearch: (query: string) => void; onFilterToggle: () => void }) => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="relative flex-1 min-w-[220px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        type="text"
        placeholder="Search by name, field, or university"
        className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        onChange={(e) => onSearch(e.target.value)}
        aria-label="Search students"
      />
    </div>
    <Button variant="secondary" onClick={onFilterToggle} aria-label="Open filters">
      <Filter className="h-4 w-4" /> Filters
    </Button>
  </div>
);

const StudentCard = ({ s, onFund }: { s: any; onFund: (student: any) => void }) => {
  const pct = Math.round((s.fundedUSD / s.needUSD) * 100);
  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{s.name}</h3>
          <p className="text-sm text-slate-600">{s.field} · {s.university}</p>
        </div>
        <button className="rounded-full p-2 text-rose-500 hover:bg-rose-50" aria-label="Add to wishlist">
          <Heart className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="slate"><UserRound className="h-3.5 w-3.5 mr-1 inline"/>{s.gender}</Badge>
        <Badge variant="slate"><Building2 className="h-3.5 w-3.5 mr-1 inline"/>{s.location}</Badge>
        <Badge variant="emerald"><GraduationCap className="h-3.5 w-3.5 mr-1 inline"/>GPA {s.gpa}</Badge>
        <Badge variant="amber">Grad {s.gradYear}</Badge>
      </div>
      <div>
        <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
          <span>Funding Progress</span>
          <span>${s.fundedUSD.toLocaleString()} / ${s.needUSD.toLocaleString()}</span>
        </div>
        <Progress value={pct} />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-xs text-slate-500">{pct >= 100 ? "Ready for disbursement" : `${100 - pct}% to go`}</div>
        <Button onClick={() => onFund(s)} aria-label={`Fund ${s.name}`}><DollarSign className="h-4 w-4"/> Fund</Button>
      </div>
    </Card>
  );
};

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon?: any; title: string; subtitle?: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-emerald-600" aria-hidden />}
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);

export const Marketplace = () => {
  const [q, setQ] = useState("");

  return (
    <div className="space-y-6">
      <SectionTitle icon={Search} title="Donor Marketplace" subtitle="Discover, filter, and fund students" />
      <Card className="p-4"><FiltersBar onSearch={setQ} onFilterToggle={() => alert("Filters panel TBD")} /></Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {students
          .filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase()) || s.field.toLowerCase().includes(q.toLowerCase()) || s.university.toLowerCase().includes(q.toLowerCase()))
          .map((s) => (<StudentCard key={s.id} s={s} onFund={() => alert("Stripe (static)") } />))}
      </div>
    </div>
  );
};