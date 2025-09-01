import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Heart, UserRound, GraduationCap, Building2, DollarSign } from "lucide-react";

type Student = {
  id: number;
  name: string;
  field: string;
  university: string;
  gpa: number;
  gradYear: number;
  amountUSD: number;
  gender: "M" | "F";
  province: string;
  city: string;
  sponsored: boolean;
};

// Mock data aligned to whole-student sponsorship
const students: Student[] = [
  { id: 1, name: "Ayesha Khan", field: "Computer Science",       university: "NUST",       gpa: 3.7, gradYear: 2026, amountUSD: 2400, gender: "F", province: "Islamabad", city: "Islamabad", sponsored: true  },
  { id: 2, name: "Bilal Ahmed",  field: "Mechanical Engineering", university: "UET Lahore", gpa: 3.5, gradYear: 2025, amountUSD: 1800, gender: "M", province: "Punjab",    city: "Lahore",    sponsored: true  },
  { id: 3, name: "Hira Fatima",  field: "Medicine (MBBS)",        university: "DUHS",       gpa: 3.9, gradYear: 2027, amountUSD: 5000, gender: "F", province: "Sindh",     city: "Karachi",   sponsored: false },
  { id: 4, name: "Usman Tariq",  field: "Electrical Engineering", university: "FAST",       gpa: 3.2, gradYear: 2026, amountUSD: 3200, gender: "M", province: "KPK",       city: "Peshawar",  sponsored: false },
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

const StudentCard = ({ s }: { s: Student }) => (
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

    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Badge variant="secondary"><UserRound className="h-3.5 w-3.5 mr-1 inline" />{s.gender}</Badge>
      <Badge variant="secondary"><Building2 className="h-3.5 w-3.5 mr-1 inline" />{s.city}</Badge>
      <Badge variant="default"><GraduationCap className="h-3.5 w-3.5 mr-1 inline" />GPA {s.gpa}</Badge>
      <Badge variant="outline">Grad {s.gradYear}</Badge>
      <Badge variant={s.sponsored ? "secondary" : "default"}>{s.sponsored ? "Sponsored" : "Available"}</Badge>
    </div>

    <div className="flex items-center justify-between pt-1">
      <div className="text-sm text-slate-700">Sponsorship: <span className="font-semibold">${s.amountUSD.toLocaleString()}</span></div>
      <Button disabled={s.sponsored} onClick={() => alert(`Sponsor ${s.name} for $${s.amountUSD.toLocaleString()}`)} className="rounded-2xl">
        <DollarSign className="h-4 w-4 mr-1" /> {s.sponsored ? "Sponsored" : "Sponsor Now"}
      </Button>
    </div>
  </Card>
);

export const Marketplace = () => {
  const [q, setQ] = useState("");
  const [field, setField] = useState("");
  const [gender, setGender] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return students.filter((s) => {
      const textMatch =
        !t ||
        s.name.toLowerCase().includes(t) ||
        s.field.toLowerCase().includes(t) ||
        s.university.toLowerCase().includes(t) ||
        s.city.toLowerCase().includes(t);
      const fieldOk  = !field  || s.field === field;
      const genderOk = !gender || s.gender === (gender as "M" | "F");
      const provOk   = !province || s.province === province;
      const cityOk   = !city || s.city.toLowerCase() === city.toLowerCase();
      const budgetOk = !maxBudget || s.amountUSD <= Number(maxBudget);
      return textMatch && fieldOk && genderOk && provOk && cityOk && budgetOk;
    });
  }, [q, field, gender, province, city, maxBudget]);

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={Search}
        title="Donor Marketplace"
        subtitle="Pick one or more students to sponsor — no partial donations"
      />

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="relative md:col-span-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, program, or university"
              className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search students"
            />
          </div>

          <select className="rounded-2xl border md:col-span-2 px-3 py-2 text-sm" value={field} onChange={(e) => setField(e.target.value)}>
            <option value="">Program</option>
            <option>Computer Science</option>
            <option>Mechanical Engineering</option>
            <option>Electrical Engineering</option>
            <option>Medicine (MBBS)</option>
          </select>

          <select className="rounded-2xl border md:col-span-2 px-3 py-2 text-sm" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Gender</option>
            <option value="F">Female</option>
            <option value="M">Male</option>
          </select>

          <select className="rounded-2xl border md:col-span-2 px-3 py-2 text-sm" value={province} onChange={(e) => setProvince(e.target.value)}>
            <option value="">Province</option>
            <option>Punjab</option>
            <option>Sindh</option>
            <option>KPK</option>
            <option>Islamabad</option>
          </select>

          <Input className="rounded-2xl md:col-span-2" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input className="rounded-2xl md:col-span-2" type="number" placeholder="Max budget ($)" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} />

          <div className="md:col-span-2 flex gap-2">
            <Button variant="outline" className="rounded-2xl"><Filter className="h-4 w-4 mr-1" /> Filters</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {filtered.map((s) => <StudentCard key={s.id} s={s} />)}
      </div>
    </div>
  );
};
