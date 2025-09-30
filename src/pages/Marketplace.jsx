import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Heart,
  UserRound,
  GraduationCap,
  Building2,
  DollarSign,
} from "lucide-react";
import { mockData } from "@/data/mockData";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

/* ---------- small helper ---------- */
const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-emerald-600" aria-hidden />}
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);

/* ---------- individual student card ---------- */
function StudentCard({ student, onSponsored }) {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const fmt = (n) => Number(n || 0).toLocaleString();
  const remainingNeed = Number(student?.needUsd ?? student?.needUSD ?? 0);
  const isApproved = Boolean(student?.isApproved);
  const isSponsored = remainingNeed <= 0 || Boolean(student?.sponsored);

  async function sponsorStudent() {
    try {
      if (!user || user.role !== "DONOR") {
        // send them to login, then back to marketplace
        return navigate("/login?redirect=/marketplace");
      }
      if (!isApproved) {
        toast.message("Awaiting approval", {
          description:
            "This student must be approved by admin before sponsorship.",
        });
        return;
      }
      if (isSponsored) return;

      const amount = remainingNeed; // full remaining need only
      const studentId = student?.id;

      const res = await fetch(`${API}/api/sponsorships`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // <- REQUIRED
        },
        body: JSON.stringify({ studentId, amount }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      await res.json();
      onSponsored?.(studentId, amount);
      toast.success(`Sponsorship recorded: $${fmt(amount)} for ${student.name}`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to sponsor: ${err?.message || "Unknown error"}`);
    }
  }

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {student.name}
          </h3>
          <p className="text-sm text-slate-600">
            {student.program} · {student.university}
          </p>
        </div>
        <button
          className="rounded-full p-2 text-rose-500 hover:bg-rose-50"
          aria-label="Add to wishlist"
        >
          <Heart className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {student.gender && (
          <Badge variant="secondary">
            <UserRound className="h-3.5 w-3.5 mr-1 inline" />
            {student.gender}
          </Badge>
        )}
        {student.city && (
          <Badge variant="secondary">
            <Building2 className="h-3.5 w-3.5 mr-1 inline" />
            {student.city}
          </Badge>
        )}
        {Number.isFinite(Number(student.gpa)) && (
          <Badge variant="default">
            <GraduationCap className="h-3.5 w-3.5 mr-1 inline" />
            GPA {student.gpa}
          </Badge>
        )}

        {isSponsored ? (
          <Badge variant="secondary">Sponsored</Badge>
        ) : isApproved ? (
          <Badge variant="default">Approved</Badge>
        ) : (
          <Badge variant="secondary">Awaiting approval</Badge>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-700">Remaining need (USD):</span>
          <span className="font-semibold">${fmt(remainingNeed)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="outline"
          className="rounded-2xl w-32"
          onClick={() =>
            toast.message(student.name, {
              description: `${student.program} · ${student.university}`,
            })
          }
        >
          About
        </Button>

        <Button
          disabled={!isApproved || isSponsored}
          onClick={sponsorStudent}
          className="rounded-2xl flex-1"
        >
          <DollarSign className="h-4 w-4 mr-1" />
          {isSponsored ? "Sponsored" : "Sponsor Student (Full)"}
        </Button>
      </div>
    </Card>
  );
}

/* ---------- page ---------- */
export const Marketplace = () => {
  const [q, setQ] = useState("");
  const [program, setProgram] = useState("");
  const [gender, setGender] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  const [students, setStudents] = useState([]);
  // const [fx, setFx] = useState(null); // reserved for donor-localized display in Phase 1 UI

  // Load APPROVED applications + sponsorships, compute remaining need
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // 1) Approved applications (include student)
        const appsRes = await fetch(
          `${API}/api/applications?status=APPROVED&limit=500`
        );
        if (!appsRes.ok) throw new Error(await appsRes.text());
        const appsJson = await appsRes.json();
        const applicationsArr = Array.isArray(appsJson?.applications)
          ? appsJson.applications
          : appsJson;

        // 2) Sponsorships aggregate to subtract funded amount (public endpoint)
        const sRes = await fetch(`${API}/api/sponsorships/aggregate`);
        if (!sRes.ok) throw new Error(await sRes.text());
        const sJson = await sRes.json();
        const rows = Array.isArray(sJson?.aggregate) ? sJson.aggregate : [];
        const fundedByStudent = rows.reduce((acc, r) => {
          const sid = r.studentId;
          const amt = Number(r.total || 0);
          acc[sid] = (acc[sid] || 0) + (Number.isFinite(amt) ? amt : 0);
          return acc;
        }, {});

        // 3) Optional: get latest PKR->USD rate for PKR applications missing snapshot
        let pkrToUsd = 0;
        try {
          const fxRes = await fetch(`${API}/api/fx/latest?base=PKR&quote=USD`);
          if (fxRes.ok) {
            const fx = await fxRes.json();
            pkrToUsd = Number(fx?.rate || 0);
          }
        } catch {}




        // Build student map (largest remaining need wins if multiple apps)
        const byStudent = new Map();
        for (const a of applicationsArr) {
          const s = a.student;
          if (!s) continue;

          // Determine requested amount in USD
          let requestedUSD = NaN;
          const amtBase = a?.amountBaseUSD;
          const needUsdField = a?.needUSD;
          const needPkrField = a?.needPKR;

          // Prefer snapshot if present and > 0
          if (amtBase != null && Number(amtBase) > 0) {
            requestedUSD = Number(amtBase);
          }

          // Fallback to legacy USD field if > 0
          if (!Number.isFinite(requestedUSD) || requestedUSD <= 0) {
            if (needUsdField != null && Number(needUsdField) > 0) {
              requestedUSD = Number(needUsdField);
            }
          }

          // Fallback to PKR with FX if > 0; if FX missing, show PKR as-is to avoid hiding
          if (!Number.isFinite(requestedUSD) || requestedUSD <= 0) {
            const needPKR = Number(needPkrField || 0);
            if (needPKR > 0) {
              requestedUSD = pkrToUsd > 0 ? needPKR * pkrToUsd : needPKR;
            }
          }

          // Final guard
          if (!Number.isFinite(requestedUSD) || requestedUSD < 0) {
            requestedUSD = 0;
          }

          const remaining = Math.max(0, requestedUSD - Number(fundedByStudent[s.id] || 0));

          const shaped = {
            id: s.id,
            name: s.name,
            email: s.email,
            university: s.university,
            program: s.program,
            gpa: s.gpa,
            gradYear: s.gradYear,
            city: s.city,
            province: s.province,
            gender: s.gender,
            isApproved: true,
            sponsored: remaining <= 0,
            needUsd: remaining,
            needUSD: remaining,
          };

          const existing = byStudent.get(s.id);
          if (!existing || shaped.needUsd > existing.needUsd) {
            byStudent.set(s.id, shaped);
          }
        }

        if (!cancelled) {
          setStudents(Array.from(byStudent.values()));
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          // fallback to mock data (mark approved)
          setStudents(
  (mockData.students || []).map((s) => {
    const rem = Number(s?.needUsd ?? s?.needUSD ?? 0);
    return {
      ...s,
      isApproved: true,
      needUsd: rem,
      needUSD: rem,
      sponsored: rem <= 0, // derive from remaining need only
    };
  })
);

        }
      }
    }

    load();
    const t = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // After successful sponsor, update remaining need locally
  function handleSponsorshipSuccess(studentId, amount) {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const currentNeed = Number(s?.needUsd ?? s?.needUSD ?? 0);
        const newNeed = Math.max(0, currentNeed - Number(amount || 0));
        return {
          ...s,
          needUsd: newNeed,
          needUSD: newNeed,
          sponsored: newNeed <= 0,
        };
      })
    );
  }

  // SHOW ONLY approved + not fully sponsored
  const filtered = useMemo(() => {
    const list = students?.length ? students : mockData.students;
    const t = q.toLowerCase();

    return list
  .filter((s) => s.isApproved)
  .filter((s) => !s.sponsored) // <- add this
  .filter((s) => Number(s?.needUsd ?? s?.needUSD ?? 0) > 0)
  .filter((s) => {
        const textMatch =
          !t ||
          s.name?.toLowerCase().includes(t) ||
          s.program?.toLowerCase().includes(t) ||
          s.university?.toLowerCase().includes(t) ||
          s.city?.toLowerCase().includes(t);

        const programOk = !program || s.program === program;
        const genderOk = !gender || s.gender === gender;
        const provOk = !province || s.province === province;
        const cityOk = !city || (s.city && s.city.toLowerCase() === city.toLowerCase());

        const need = Number(s?.needUsd ?? s?.needUSD ?? 0);
        const budgetOk = !maxBudget || need <= Number(maxBudget);

        return textMatch && programOk && genderOk && provOk && cityOk && budgetOk;
      });
  }, [students, q, program, gender, province, city, maxBudget]);

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={Search}
        title="Student Marketplace"
        subtitle="Sponsor complete educational journeys — whole-student funding"
      />

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search */}
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

          {/* Program */}
          <select
            className="rounded-2xl border md:col-span-2 px-3 py-2 text-sm"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
          >
            <option value="">Program</option>
            <option>Computer Science</option>
            <option>Mechanical Engineering</option>
            <option>Electrical Engineering</option>
            <option>Medicine (MBBS)</option>
            <option>Business Administration</option>
          </select>

          {/* Gender */}
          <select
            className="rounded-2xl border md:col-span-2 px-3 py-2 text-sm"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Gender</option>
            <option value="F">Female</option>
            <option value="M">Male</option>
          </select>

          {/* Province */}
          <select
            className="rounded-2xl border md:col-span-2 px-3 py-2 text-sm"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          >
            <option value="">Province</option>
            <option>Punjab</option>
            <option>Sindh</option>
            <option>KPK</option>
            <option>Islamabad</option>
          </select>

          {/* City */}
          <Input
            className="rounded-2xl md:col-span-1"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          {/* Max budget (filters by remaining need) */}
          <Input
            className="rounded-2xl md:col-span-1"
            type="number"
            placeholder="Max ($)"
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {filtered.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            onSponsored={handleSponsorshipSuccess}
          />
        ))}
      </div>
    </div>
  );
};
