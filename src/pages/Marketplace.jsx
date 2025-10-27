import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
} from "lucide-react";
import { mockData } from "@/data/mockData";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { CURRENCY_META, getCurrencyFromCountry, fmtAmount, getCurrencyFlag } from "@/lib/currency";
import { API } from "@/lib/api";

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

  const isApproved = Boolean(student?.isApproved);
  const isSponsored = Boolean(student?.sponsored);

  // Determine display currency based on university location or country
  const getUniversityCurrency = (university) => {
    if (!university) return null;
    const uni = university.toLowerCase();
    
    // UK Universities
    if (uni.includes('oxford') || uni.includes('cambridge') || 
        uni.includes('london') || uni.includes('edinburgh') ||
        uni.includes('manchester') || uni.includes('bristol') ||
        uni.includes('birmingham') || uni.includes('leeds') ||
        uni.includes('glasgow') || uni.includes('warwick') ||
        uni.includes('durham') || uni.includes('exeter') ||
        uni.includes('bath') || uni.includes('york') ||
        uni.includes('imperial college') || uni.includes('kings college') ||
        uni.includes('ucl') || uni.includes('lse')) {
      return 'GBP';
    }
    
    return null;
  };
  
  const universityCurrency = getUniversityCurrency(student?.university);
  const countryCurrency = getCurrencyFromCountry(student?.country);
  const currency = student?.application?.currency || student?.currency || universityCurrency || countryCurrency;
  const displayAmount = student?.application?.amount || student?.amount || 0;
  
  // Debug logging for amount display issues
  if (displayAmount === 0) {
    console.log(`🔍 Amount is 0 for ${student.name}:`, {
      'student.application.amount': student?.application?.amount,
      'student.amount': student?.amount,
      'student.application': student?.application,
      currency
    });
  }
  
  // Privacy controls: non-logged-in users see basic info only, no names/personal details
  const isLoggedIn = Boolean(user && token);
  const displayName = isLoggedIn ? student.name : "Student Profile";

  function sponsorStudent() {
    if (!user || user.role !== "DONOR") {
      // send them to login, then back to marketplace
      return navigate("/login", { state: { redirectTo: "/marketplace" } });
    }
    if (!isApproved) {
      toast.message("Awaiting approval", {
        description:
          "This student must be approved by admin before sponsorship.",
      });
      return;
    }
    if (isSponsored) return;

    // Navigate to payment page for this student
    navigate(`/donor/payment/${student.id}`);
  }

  return (
    <Card className="p-4 flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-base font-semibold">{displayName}</div>
          <div className="text-sm text-slate-600">{student.program} · {student.university}</div>
        </div>
        <div className="shrink-0 rounded-full bg-amber-500 text-white text-xs font-semibold px-3 py-1 shadow-sm flex items-center gap-1">
          <span>{getCurrencyFlag(currency)}</span>
          <span>{fmtAmount(displayAmount, currency)}</span>
        </div>
      </div>

      <div className="text-sm text-slate-700 grid grid-cols-[120px,1fr] gap-y-1 items-start min-h-[140px]">
        {isLoggedIn && (
          <>
            <div className="text-slate-600">City</div>
            <div className="text-right">{student.city || "—"}</div>
            
            <div className="text-slate-600">Province</div>
            <div className="text-right">{student.province || "—"}</div>
          </>
        )}
        
        <div className="text-slate-600">Target</div>
        <div className="text-right">{student.university}</div>
        
        <div className="text-slate-600">Program</div>
        <div className="text-right">{student.program}</div>
        
        {isLoggedIn && (
          <>
            <div className="text-slate-600">Latest GPA</div>
            <div className="text-right">{student.gpa ? Number(student.gpa).toFixed(2) : "—"}</div>
          </>
        )}
        
        {!isLoggedIn && (
          <>
            <div className="text-slate-600">Status</div>
            <div className="text-right text-emerald-600 font-medium">Approved for Support</div>
          </>
        )}
      </div>

      <div className="pt-2 mt-auto">
        {isLoggedIn ? (
          <Button 
            className="rounded-2xl w-full" 
            onClick={() => navigate(`/students/${student.id}`)}
          >
            Student details
          </Button>
        ) : (
          <Button 
            variant="default"
            className="rounded-2xl w-full"
            disabled={!isApproved || isSponsored}
            onClick={sponsorStudent}
          >
            {isSponsored ? "Sponsored" : "Login to Sponsor"}
          </Button>
        )}
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
  // maxBudget filter removed due to multiple currency complexity

  const [students, setStudents] = useState([]);
  // const [fx, setFx] = useState(null); // reserved for donor-localized display in Phase 1 UI

  // Load students - fast approach
  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Start with empty state - only show real approved students
      setStudents([]);

      // Try API to get real approved students
      try {
        const res = await fetch(`${API.baseURL}/api/students/approved`);
        
        if (res.ok && !cancelled) {
          const data = await res.json();
          const students = Array.isArray(data?.students) ? data.students : [];
          
          console.log("🔍 Marketplace API Response:", { totalStudents: students.length, students });
          
          if (students.length > 0) {
            // Transform API student data to marketplace format
            const transformedStudents = students.map(student => ({
              id: student.id,
              name: student.name,
              email: student.email,
              university: student.university,
              program: student.program,
              gpa: student.gpa,
              gradYear: student.gradYear,
              city: student.city,
              province: student.province,
              gender: student.gender,
              isApproved: true, // All students from approved endpoint are approved
              sponsored: Boolean(student.sponsored), // Trust API's sponsored calculation
              currency: student.application?.currency || getCurrencyFromCountry(student.country),
              amount: student.application?.amount || 0, // Single currency amount
              term: student.application?.term || null,
              // Preserve application object for StudentCard component
              application: student.application,
            }));

            console.log("🔍 Marketplace Transformed Students:", { 
              totalTransformed: transformedStudents.length, 
              sample: transformedStudents.slice(0, 2).map(s => ({
                name: s.name,
                sponsored: s.sponsored,
                amount: s.amount,
                isApproved: s.isApproved
              }))
            });

            setStudents(transformedStudents);
          } else {
            // No real students in database, keep empty
            setStudents([]);
          }
        }
      } catch (err) {
        console.error("Marketplace API failed:", err);
        // Keep empty on API failure - no demo data fallback
        if (!cancelled) {
          setStudents([]);
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
        return {
          ...s,
          sponsored: true, // Student is now completely sponsored
        };
      })
    );
  }

  // SHOW ONLY approved + not fully sponsored (ONE STUDENT = ONE DONOR)
  const filtered = useMemo(() => {
    const t = q.toLowerCase();

    console.log("🔍 Marketplace Filtering Debug:", {
      totalStudents: students.length,
      studentsData: students.map(s => ({
        name: s.name,
        isApproved: s.isApproved,
        sponsored: s.sponsored,
        amount: s.amount
      }))
    });

    const approvedStudents = students.filter((s) => s.isApproved);
    console.log("🔍 After approval filter:", approvedStudents.length);

    const unsponsoredStudents = approvedStudents.filter((s) => {
      // Hide sponsored students - ONE STUDENT = ONE DONOR FULL SPONSORSHIP
      // Trust the API's sponsored field calculation
      const isSponsored = Boolean(s?.sponsored);
      const shouldShow = !isSponsored;
      
      if (!shouldShow) {
        console.log("🔍 Filtering out sponsored student:", s.name, {
          sponsored: s.sponsored,
          reason: "Student already has a sponsor (ONE STUDENT = ONE DONOR)"
        });
      } else {
        console.log("🔍 Showing available student:", s.name, {
          sponsored: s.sponsored
        });
      }
      
      return shouldShow; // Only show unsponsored students
    });
    console.log("🔍 After sponsorship filter:", unsponsoredStudents.length);

    return unsponsoredStudents
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

        // Budget filter removed due to multiple currency complexity
        return textMatch && programOk && genderOk && provOk && cityOk;
      });
  }, [students, q, program, gender, province, city]);

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={Search}
        title="Student Marketplace"
        subtitle="Sponsor complete educational journeys — whole-student funding"
      />

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
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
            <option>Balochistan</option>
          </select>

          {/* City */}
          <Input
            className="rounded-2xl md:col-span-1"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          {/* Max budget filter removed - too complex with multiple currencies */}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
