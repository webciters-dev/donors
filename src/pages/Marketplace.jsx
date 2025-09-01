import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Filter, Heart, UserRound, GraduationCap, Building2, DollarSign } from "lucide-react";
import { mockData } from "@/data/mockData";

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-emerald-600" aria-hidden />}
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);

const StudentCard = ({ student }) => (
  <Card className="p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{student.name}</h3>
        <p className="text-sm text-slate-600">{student.program} · {student.university}</p>
      </div>
      <button className="rounded-full p-2 text-rose-500 hover:bg-rose-50" aria-label="Add to wishlist">
        <Heart className="h-5 w-5" />
      </button>
    </div>

    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Badge variant="secondary"><UserRound className="h-3.5 w-3.5 mr-1 inline" />{student.gender}</Badge>
      <Badge variant="secondary"><Building2 className="h-3.5 w-3.5 mr-1 inline" />{student.city}</Badge>
      <Badge variant="default"><GraduationCap className="h-3.5 w-3.5 mr-1 inline" />GPA {student.gpa}</Badge>
      <Badge variant="outline">Grad {student.gradYear}</Badge>
      <Badge variant={student.sponsored ? "secondary" : "default"}>{student.sponsored ? "Sponsored" : "Available"}</Badge>
    </div>

    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-700">Need (USD):</span>
        <span className="font-semibold">${student.needUsd.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-700">Max I'll donate:</span>
        <Input 
          type="number" 
          placeholder="$2,000" 
          className="w-24 h-8 text-xs"
          disabled={student.sponsored}
        />
      </div>
    </div>

    <div className="flex items-center justify-between pt-1">
      <Button 
        disabled={student.sponsored} 
        onClick={() => alert(`Sponsor ${student.name} for $${student.needUsd.toLocaleString()}`)} 
        className="rounded-2xl flex-1"
      >
        <DollarSign className="h-4 w-4 mr-1" /> 
        {student.sponsored ? "Sponsored" : "Sponsor Student"}
      </Button>
    </div>
  </Card>
);

export const Marketplace = () => {
  const [q, setQ] = useState("");
  const [program, setProgram] = useState("");
  const [gender, setGender] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return mockData.students.filter((s) => {
      const textMatch =
        !t ||
        s.name.toLowerCase().includes(t) ||
        s.program.toLowerCase().includes(t) ||
        s.university.toLowerCase().includes(t) ||
        s.city.toLowerCase().includes(t);
      const programOk = !program || s.program === program;
      const genderOk = !gender || s.gender === gender;
      const provOk = !province || s.province === province;
      const cityOk = !city || s.city.toLowerCase() === city.toLowerCase();
      const budgetOk = !maxBudget || s.needUsd <= Number(maxBudget);
      return textMatch && programOk && genderOk && provOk && cityOk && budgetOk;
    });
  }, [q, program, gender, province, city, maxBudget]);

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={Search}
        title="Student Marketplace"
        subtitle="Sponsor complete educational journeys — whole-student funding"
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

          <select className="rounded-2xl border md:col-span-2 px-3 py-2 text-sm" value={program} onChange={(e) => setProgram(e.target.value)}>
            <option value="">Program</option>
            <option>Computer Science</option>
            <option>Mechanical Engineering</option>
            <option>Electrical Engineering</option>
            <option>Medicine (MBBS)</option>
            <option>Business Administration</option>
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

          <Input className="rounded-2xl md:col-span-1" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input className="rounded-2xl md:col-span-1" type="number" placeholder="Max ($)" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {filtered.map((student) => <StudentCard key={student.id} student={student} />)}
      </div>
    </div>
  );
};