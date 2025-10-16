import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GraduationCap, DollarSign, FileText, Users, MapPin, Calendar, Mail, Phone } from "lucide-react";
import DonorStudentMessaging from "@/components/DonorStudentMessaging";
import { mockData } from "@/data/mockData";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { getCurrencyFromCountry } from "@/lib/currency";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-emerald-600" aria-hidden />}
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);

const SecondaryButton = ({ onClick, icon: Icon, children }) => (
  <Button onClick={onClick} variant="outline" className="rounded-2xl">
    {Icon && <Icon className="h-4 w-4 mr-2" />}
    {children}
  </Button>
);

export const StudentDetail = ({ id, goBack }) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Currency formatting helpers
  const CURRENCY_META = {
    USD: { symbol: "$", locale: undefined },
    PKR: { symbol: "₨", locale: "en-PK" },
    GBP: { symbol: "£", locale: "en-GB" },
  };

  const fmtAmount = (n, currency = "USD") => {
    const meta = CURRENCY_META[currency] || CURRENCY_META.USD;
    return `${meta.symbol} ${Number(n || 0).toLocaleString(meta.locale, { maximumFractionDigits: 0 })}`;
  };

  const flag = (cur) => (cur === 'PKR' ? '🇵🇰' : cur === 'USD' ? '🇺🇸' : cur === 'GBP' ? '🇬🇧' : '');

  // UK university detection (matching Marketplace.jsx logic)
  const detectUKUniversity = (university) => {
    if (!university) return false;
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
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    async function loadStudent() {
      try {
        setLoading(true);
        setError(null);
        


        // Try the specific student endpoint first (works for both authenticated and non-authenticated users)
        let res = await fetch(`${API}/api/students/approved/${id}`);
        
        if (res.ok) {
          const data = await res.json();

          if (data.student) {
            setStudent(data.student);
            setApplication(data.student.application || null);
            return;
          }
        }

        // Fallback: try finding student in approved students list

        res = await fetch(`${API}/api/students/approved`);
        if (res.ok) {
          const data = await res.json();
          const students = Array.isArray(data?.students) ? data.students : [];

          const foundStudent = students.find(student => 
            String(student.id) === String(id)
          );
          
          if (foundStudent) {

            setStudent(foundStudent);
            setApplication(foundStudent.application || null);
            return;
          }
        }

        throw new Error("Student not found");
      } catch (err) {
        console.error("StudentDetail error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadStudent();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-lg">Loading student details...</div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900">Student not found</h2>
        <p className="text-slate-600 mt-2">{error}</p>
        <Button onClick={goBack} className="mt-4 rounded-2xl">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  // Determine currency and amounts (matching Marketplace.jsx logic)
  let currency = application?.currency || student?.currency;
  
  // If no explicit currency, detect from university or country
  if (!currency) {
    // Check for UK universities first
    if (detectUKUniversity(student?.university)) {
      currency = 'GBP';
    } 
    // Then check country
    else if (student?.country) {
      currency = getCurrencyFromCountry(student.country);
    }
    // Default fallback
    else {
      currency = 'USD';
    }
  }
  const needUSD = Number(student?.needUsd || student?.needUSD || application?.needUSD || 0);
  const needPKR = Number(student?.needPKR || application?.needPKR || 0);
  const displayAmount = currency === "PKR" ? needPKR : needUSD;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={goBack} variant="outline" size="icon" className="rounded-2xl">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{student.name}</h1>
          <p className="text-slate-600">{student.program} · {student.university}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="rounded-full bg-amber-500 text-white text-sm font-semibold px-4 py-2 shadow-sm flex items-center gap-2">
            <span>{flag(currency)}</span>
            <span>{fmtAmount(displayAmount, currency)}</span>
          </div>
        </div>
      </div>

      {/* Student Profile Card */}
      <Card className="p-6">
        <SectionTitle icon={Users} title="Student Information" />
        <div className="mt-4 grid md:grid-cols-2 gap-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Name</span>
              <span className="font-medium">{student.name}</span>
            </div>
            {/* Show different information based on user role */}
            {user?.role === "ADMIN" || user?.role === "SUB_ADMIN" ? (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium">{student.email || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone</span>
                  <span className="font-medium">{student.phone || "—"}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location</span>
                  <span className="font-medium">{[student.city, student.province].filter(Boolean).join(", ") || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gender</span>
                  <span className="font-medium">{student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : student.gender || "—"}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Program</span>
              <span className="font-medium">{student.program}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">University</span>
              <span className="font-medium">{student.university}</span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">GPA</span>
              <span className="font-medium">{student.gpa ? Number(student.gpa).toFixed(2) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expected Graduation</span>
              <span className="font-medium">{student.gradYear || "—"}</span>
            </div>
            {student.currentInstitution && (
              <div className="flex justify-between">
                <span className="text-slate-500">Current Institution</span>
                <span className="font-medium">{student.currentInstitution}</span>
              </div>
            )}

            {student.sponsorshipCount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Sponsors</span>
                <span className="font-medium">{student.sponsorshipCount} donor{student.sponsorshipCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Personal Introduction */}
      {student.personalIntroduction && (
        <Card className="p-6">
          <SectionTitle icon={Users} title="About Me & My Family" />
          <div className="mt-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{student.personalIntroduction}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Donor-Student Messaging */}
      <DonorStudentMessaging 
        student={student} 
        user={user} 
        token={token} 
      />

      {/* Enhanced Background Details */}
      <Card className="p-6">
        <SectionTitle icon={GraduationCap} title="Detailed Background" />
        <div className="mt-4 grid md:grid-cols-2 gap-6">
          <div className="space-y-3 text-sm">
            {student.familySize && (
              <div className="flex justify-between">
                <span className="text-slate-500">Family Size</span>
                <span className="font-medium">{student.familySize} members</span>
              </div>
            )}
            {student.parentsOccupation && (
              <div className="flex justify-between">
                <span className="text-slate-500">Parents' Occupation</span>
                <span className="font-medium">{student.parentsOccupation}</span>
              </div>
            )}
            {student.monthlyFamilyIncome && (
              <div className="flex justify-between">
                <span className="text-slate-500">Family Income</span>
                <span className="font-medium">{student.monthlyFamilyIncome}</span>
              </div>
            )}
            {student.currentAcademicYear && (
              <div className="flex justify-between">
                <span className="text-slate-500">Academic Year</span>
                <span className="font-medium">{student.currentAcademicYear}</span>
              </div>
            )}
          </div>
          <div className="space-y-3 text-sm">
            {student.specificField && (
              <div className="flex justify-between">
                <span className="text-slate-500">Specialization</span>
                <span className="font-medium">{student.specificField}</span>
              </div>
            )}
          </div>
        </div>

        {/* Career Goals */}
        {student.careerGoals && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-700 mb-2">🎯 Career Goals & Aspirations</h4>
            <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded whitespace-pre-wrap">
              {student.careerGoals}
            </div>
          </div>
        )}

        {/* Academic Achievements */}
        {student.academicAchievements && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">🏆 Academic Achievements</h4>
            <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded whitespace-pre-wrap">
              {student.academicAchievements}
            </div>
          </div>
        )}

        {/* Community Involvement */}
        {student.communityInvolvement && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">🤝 Community Involvement</h4>
            <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded whitespace-pre-wrap">
              {student.communityInvolvement}
            </div>
          </div>
        )}
      </Card>

      {/* Application Details */}
      {application && (
        <Card className="p-6">
          <SectionTitle icon={FileText} title="Application Details" subtitle={application.term} />
          <div className="mt-4 grid md:grid-cols-2 gap-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Application ID</span>
                <span className="font-medium">{application.id?.slice(0, 8) || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Term</span>
                <span className="font-medium">{application.term || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted</span>
                <span className="font-medium">
                  {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Currency</span>
                <span className="font-medium">{currency}</span>
              </div>
              
              {/* Enhanced Financial Breakdown */}
              {(application?.universityFee || application?.livingExpenses || application?.totalExpense) ? (
                <div className="space-y-2 bg-slate-50 p-3 rounded-lg">
                  <h4 className="font-medium text-slate-700 text-xs uppercase tracking-wide">Financial Breakdown</h4>
                  {application?.universityFee && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">University Fee</span>
                      <span className="font-medium">+{fmtAmount(application.universityFee, currency)}</span>
                    </div>
                  )}
                  {application?.livingExpenses && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Books & Living</span>
                      <span className="font-medium">+{fmtAmount(application.livingExpenses, currency)}</span>
                    </div>
                  )}
                  {application?.totalExpense && (
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-slate-700 font-medium">Total Expense</span>
                      <span className="font-semibold">{fmtAmount(application.totalExpense, currency)}</span>
                    </div>
                  )}
                  {application?.scholarshipAmount && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Scholarship</span>
                      <span className="font-medium text-green-600">-{fmtAmount(application.scholarshipAmount, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-slate-700 font-semibold">Amount Required</span>
                    <span className="font-bold text-blue-600">{fmtAmount(displayAmount, currency)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Needed</span>
                  <span className="font-medium">{fmtAmount(displayAmount, currency)}</span>
                </div>
              )}
              
              {currency === "PKR" && needUSD > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">USD Equivalent</span>
                  <span className="font-medium text-slate-500">{fmtAmount(needUSD, "USD")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Notes</span>
                <span className="font-medium">{application.notes || "—"}</span>
              </div>
            </div>
          </div>
        </Card>
      )}



      {/* Sponsorship Actions */}
      <Card className="p-6">
        <SectionTitle icon={DollarSign} title="Sponsorship" />
        <div className="mt-4">
          {student.sponsored ? (
            <div className="text-center py-4">
              <Badge variant="default" className="mb-2">✓ Sponsored</Badge>
              <p className="text-sm text-slate-600">This student has been fully sponsored.</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <Badge variant="outline" className="mb-2">Available for Sponsorship</Badge>
              <p className="text-sm text-slate-600 mb-4">
                Help {student.name} achieve their educational goals.
              </p>
              <Button 
                className="rounded-2xl" 
                onClick={() => {
                  if (!user || user.role !== "DONOR") {
                    toast.error("Please log in as a donor to sponsor students");
                    return;
                  }
                  // Navigate to payment page using React Router
                  const studentId = id || student.id;
                  if (studentId) {
                    navigate(`/donor/payment/${studentId}`);
                  } else {
                    toast.error("Student ID not found");
                  }
                }}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Sponsor {fmtAmount(displayAmount, currency)}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};