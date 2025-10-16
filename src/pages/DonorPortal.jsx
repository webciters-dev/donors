// src/pages/DonorPortal.jsx (dynamic donor portal)
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { 
  Search, 
  Heart, 
  TrendingUp, 
  CreditCard, 
  FileText, 
  Users,
  DollarSign,
  GraduationCap 
} from "lucide-react";
import { CURRENCY_META, fmtAmount, getCurrencyFlag } from "@/lib/currency";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Program duration calculation helper - uses actual application data
const calculateProgramDuration = (student) => {
  if (!student) return "2-year"; // Default fallback
  
  // Method 1: Calculate from program start year and graduation year from application
  if (student.gradYear) {
    // If student has currentCompletionYear (when they started current program)
    if (student.currentCompletionYear) {
      const programDuration = student.gradYear - student.currentCompletionYear;
      if (programDuration > 0 && programDuration <= 8) {
        return `${programDuration}-year`;
      }
    }
    
    // If we have current academic year, calculate from that
    if (student.currentAcademicYear) {
      const currentYear = new Date().getFullYear();
      
      // Extract current year from academic year string (e.g., "2nd Year" -> 2)
      const currentYearMatch = student.currentAcademicYear.match(/(\d+)/);
      if (currentYearMatch) {
        const currentStudentYear = parseInt(currentYearMatch[1]);
        const yearsRemaining = student.gradYear - currentYear;
        const totalYears = currentStudentYear + yearsRemaining;
        if (totalYears > 0 && totalYears <= 8) {
          return `${totalYears}-year`;
        }
      }
    }
  }
  
  // Method 2: Check application term field for duration
  if (student.application?.term) {
    const termMatch = student.application.term.match(/(\d+)\s*year/i);
    if (termMatch) {
      const years = parseInt(termMatch[1]);
      return `${years}-year`;
    }
  }
  
  // Method 3: Program type mapping as fallback
  const program = (student.program || '').toLowerCase();
  if (program.includes('bachelor') || program.includes('bs') || program.includes('ba')) {
    return "4-year";
  } else if (program.includes('master') || program.includes('ms') || program.includes('ma') || program.includes('mba')) {
    return "2-year";
  } else if (program.includes('phd') || program.includes('doctorate')) {
    return "4-5 year";
  } else if (program.includes('diploma') || program.includes('certificate')) {
    return "1-2 year";
  }
  
  // Default fallback
  return "2-year";
};

const flag = (cur) => getCurrencyFlag(cur);

export default function DonorPortal() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  
  const [students, setStudents] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "browse");
  const [searchQuery, setSearchQuery] = useState("");

  // Load donor data
  useEffect(() => {
    async function loadDonorData() {
      try {
        setLoading(true);

        // Load available students
        const studentsRes = await fetch(`${API}/api/students/approved`, {
          headers: authHeader
        });
        
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          const apiStudents = studentsData.students || [];
          
          // Transform API data and filter out sponsored students (ONE STUDENT = ONE DONOR)
          const transformedStudents = apiStudents
            .filter(s => {
              // Hide sponsored students - only show available for sponsorship
              const remainingNeed = Number(s?.remainingNeed || s?.needUSD || 0);
              const isSponsored = Boolean(s?.sponsored) || remainingNeed <= 0;
              return !isSponsored; // Only show unsponsored students
            })
            .map(s => ({
              ...s,
              currency: s.application?.currency || 'USD',
              need: s.remainingNeed || s.needUSD || 0,
              fundedUSD: s.totalSponsored || 0,
              targetUniversity: s.university,
              targetProgram: s.program,
              gpaTrend: s.gpa ? [s.gpa] : [],
            }));
          
          setStudents(transformedStudents);
        }

        // Load donor's sponsorships if authenticated
        if (token) {
          const sponsorshipsRes = await fetch(`${API}/api/sponsorships`, {
            headers: authHeader
          });
          
          if (sponsorshipsRes.ok) {
            const sponsorshipsData = await sponsorshipsRes.json();
            setSponsorships(sponsorshipsData.sponsorships || []);
          }
        }
        
      } catch (err) {
        console.error('Error loading donor data:', err);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadDonorData();
  }, [token]);

  // Handle URL parameter changes for tabs
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ['browse', 'sponsored', 'payments', 'progress'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Filter students based on search
  const filteredStudents = students.filter(s => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(query) ||
      s.program?.toLowerCase().includes(query) ||
      s.university?.toLowerCase().includes(query) ||
      s.city?.toLowerCase().includes(query) ||
      s.province?.toLowerCase().includes(query)
    );
  });

  // Handle sponsorship
  const handleSponsor = async (studentId, amount) => {
    if (!token) {
      toast.error("Please log in to sponsor students");
      navigate('/login');
      return;
    }

    try {
      const res = await fetch(`${API}/api/sponsorships`, {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentId, amount })
      });

      if (res.ok) {
        toast.success("Sponsorship successful!");
        // Reload data to reflect changes
        window.location.reload();
      } else {
        const error = await res.json();
        toast.error(error.error || "Sponsorship failed");
      }
    } catch (err) {
      console.error('Sponsorship error:', err);
      toast.error("Sponsorship failed");
    }
  };

  // Calculate proper payment amounts: Total pledged vs amount paid so far
  const totalPledged = sponsorships.reduce((sum, s) => sum + (s.amount || 0), 0); // Total amount sponsored (complete education cost)
  const totalPaid = sponsorships.reduce((sum, s) => sum + (s.amount || 0), 0); // Amount actually paid (same as pledged for one-time payments)
  const yetToPay = 0; // No remaining amount for complete sponsorships
  const studentsHelped = new Set(sponsorships.map(s => s.studentId)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Donor Portal</h1>
          <p className="text-slate-600">Connect with students and track your impact</p>
        </div>
        <div className="text-sm text-slate-600 flex items-center gap-4">
          {user && <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
            Welcome, {user.name || user.email}
          </Badge>}
        </div>
      </div>

      {/* Enhanced Payment Status Cards - TOP LEFT PRIORITY */}
      {token && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Sponsored/Pledged Amount */}
          <Card className="p-6 border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 to-white">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">Total Pledged</span>
              </div>
              <div className="text-3xl font-bold text-emerald-700">{fmtAmount(totalPledged)}</div>
              <div className="text-xs text-slate-600">Total amount sponsored/pledged</div>
            </div>
          </Card>
          
          {/* Payment Complete Status - GREEN DISPLAY */}
          <Card className="p-6 border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50 via-emerald-25 to-white shadow-lg ring-2 ring-emerald-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-800 uppercase tracking-wide">✅ Fully Paid</span>
              </div>
              <div className="text-4xl font-bold text-emerald-700 mb-1">
                {fmtAmount(0)},-
              </div>
              <div className="text-xs text-emerald-700 font-semibold leading-tight">
                COMPLETE SPONSORSHIP<br/>
                <span className="text-emerald-600">{sponsorships.length > 0 ? calculateProgramDuration(sponsorships[0]?.student).toUpperCase() : '2-YEAR'} PROGRAM</span>
              </div>
            </div>
          </Card>
          
          {/* Students Helped */}
          <Card className="p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Impact</span>
              </div>
              <div className="text-3xl font-bold">{studentsHelped}</div>
              <div className="text-xs text-slate-600">
                {studentsHelped === 1 ? 'Student Helped' : 'Students Helped'}
              </div>
            </div>
          </Card>

          {/* Active Sponsorships */}
          <Card className="p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Active</span>
              </div>
              <div className="text-3xl font-bold">{sponsorships.length}</div>
              <div className="text-xs text-slate-600">
                {sponsorships.length === 1 ? 'Active Sponsorship' : 'Active Sponsorships'}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Payment Complete Status */}
      {token && totalPledged > 0 && (
        <Card className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <div className="font-medium text-emerald-800">Complete Sponsorship Status</div>
              <div className="text-sm text-emerald-700">
                <strong>✅ YOU HAVE SUCCESSFULLY SPONSORED THE COMPLETE EDUCATION FOR {fmtAmount(totalPledged)} DOLLARS</strong>
              </div>
              <div className="text-sm text-emerald-700">
                <strong>Your sponsorship covers the full {sponsorships.length > 0 ? calculateProgramDuration(sponsorships[0]?.student).toUpperCase() : '2-YEAR'} education program. No additional payments required.</strong>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Browse Students</TabsTrigger>
          <TabsTrigger value="sponsored">My Students</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Search Bar */}
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, program, university, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-slate-600">Loading students...</div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <Card className="p-8 text-center">
              <GraduationCap className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <div className="text-slate-600 mb-2">No approved students available</div>
              <div className="text-sm text-slate-500">
                Students will appear here once they are approved by admins and need sponsorship.
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredStudents.map((s) => {
                const remaining = Math.max(0, s.need - s.fundedUSD);
                return (
                  <Card key={s.id} className="p-4 flex flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-base font-semibold">{s.name}</div>
                        <div className="text-sm text-slate-600">{s.program} · {s.university}</div>
                      </div>
                      {/* Amount badge hidden - payment details shown in top area cards */}
                    </div>

                    <div className="text-sm text-slate-700 grid grid-cols-[120px,1fr] gap-y-1 items-start min-h-[140px] mt-3">
                      <div className="text-slate-600">City</div><div className="text-right">{s.city || '—'}</div>
                      <div className="text-slate-600">Province</div><div className="text-right">{s.province || '—'}</div>
                      <div className="text-slate-600">University</div><div className="text-right">{s.university}</div>
                      <div className="text-slate-600">Program</div><div className="text-right">{s.program}</div>
                      <div className="text-slate-600">GPA</div><div className="text-right">{s.gpa?.toFixed(2) || '—'}</div>
                    </div>

                    <div className="pt-3 mt-auto space-y-2">
                      <Button 
                        className="w-full" 
                        onClick={() => navigate(`/students/${s.id}`)}
                      >
                        View Details
                      </Button>
                      {token && remaining > 0 && (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => navigate(`/donor/payment/${s.id}`)}
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          Sponsor {fmtAmount(remaining, s.currency)}
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sponsored" className="space-y-4">
          {!token ? (
            <Card className="p-8 text-center">
              <div className="text-slate-600 mb-4">Please log in to view your sponsored students</div>
              <Button onClick={() => navigate('/login')}>Log In</Button>
            </Card>
          ) : sponsorships.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-slate-600 mb-4">You haven't sponsored any students yet</div>
              <Button onClick={() => setActiveTab("browse")}>Browse Students</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sponsorships.map((sponsorship) => {
                const totalPledgedForStudent = sponsorship.amount; // Complete education cost
                const paidSoFar = sponsorship.amount; // Amount actually paid (complete)
                const yetToPayForStudent = 0; // No remaining amount for complete sponsorships
                
                return (
                  <Card key={sponsorship.id} className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{sponsorship.student?.name}</div>
                        <div className="text-sm text-slate-600">{sponsorship.student?.program}</div>
                        <div className="text-xs text-slate-500">{sponsorship.student?.university}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-xs">
                          Total: {fmtAmount(totalPledgedForStudent)}
                        </Badge>
                      </div>
                    </div>

                    {/* Payment Breakdown */}
                    <div className="space-y-2 bg-slate-50 p-3 rounded-lg">
                      <div className="text-xs font-medium text-slate-700 mb-2">Payment Status</div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-emerald-100 p-2 rounded text-center">
                          <div className="font-semibold text-emerald-700">{fmtAmount(paidSoFar)}</div>
                          <div className="text-emerald-600">Paid</div>
                        </div>
                        <div className="bg-orange-100 p-2 rounded text-center">
                          <div className="font-semibold text-orange-700">{fmtAmount(yetToPayForStudent)}</div>
                          <div className="text-orange-600">Yet to pay</div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 text-center mt-2">
                        {calculateProgramDuration(sponsorship.student)} education program
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate(`/students/${sponsorship.studentId}`)}
                      >
                        View Progress
                      </Button>
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs w-full justify-center py-2">
                        ✅ Complete Education Sponsored
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {sponsorships.length === 0 ? (
            <Card className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <div className="text-slate-600 mb-4">No payment history yet</div>
              <div className="text-sm text-slate-500">Sponsor a student to see payment details</div>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Payment Timeline Header */}
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Payment Timeline & Schedule</h3>
                    <p className="text-sm text-blue-700">Track your payment commitments and due dates</p>
                  </div>
                </div>
              <div className="text-sm text-blue-800">
                This is a <strong>{sponsorships.length > 0 ? calculateProgramDuration(sponsorships[0]?.student) : '2-year'} education program</strong>. Payment schedules are designed to support students throughout their academic journey.
              </div>
              </Card>

              {/* Individual Payment Schedules */}
              {sponsorships.map((sponsorship) => {
                const totalPledgedForStudent = sponsorship.amount; // Complete education cost
                const paidSoFar = sponsorship.amount; // Amount actually paid (complete)
                const yetToPayForStudent = 0; // No remaining amount for complete sponsorships
                const sponsorshipDate = new Date(sponsorship.date);
                const firstYearEnd = new Date(sponsorshipDate);
                firstYearEnd.setFullYear(firstYearEnd.getFullYear() + 1);
                
                return (
                  <Card key={sponsorship.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{sponsorship.student?.name}</h4>
                        <p className="text-sm text-slate-600">{sponsorship.student?.program} • {sponsorship.student?.university}</p>
                        <p className="text-xs text-slate-500">Sponsored on {sponsorshipDate.toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-lg font-bold px-4 py-2">
                        Total Pledge: {fmtAmount(totalPledgedForStudent)}
                      </Badge>
                    </div>

                    {/* Payment Timeline */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Year 1 Payment */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            <span className="font-medium text-emerald-800">Year 1 Payment</span>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                              ✓ PAID
                            </Badge>
                          </div>
                          <div className="text-2xl font-bold text-emerald-700">{fmtAmount(paidSoFar)}</div>
                          <div className="text-sm text-emerald-600">
                            Paid on {sponsorshipDate.toLocaleDateString()}
                          </div>
                        </div>

                        {/* Complete Payment Status */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            <span className="font-medium text-emerald-800">Complete Education</span>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                              ✓ FULLY SPONSORED
                            </Badge>
                          </div>
                          <div className="text-2xl font-bold text-emerald-700">{fmtAmount(totalPledgedForStudent)}</div>
                          <div className="text-sm text-emerald-600">
                            <strong>Complete education sponsored</strong>
                          </div>
                          <div className="text-xs text-emerald-600 font-medium mt-1">
                            NO ADDITIONAL PAYMENTS REQUIRED
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card className="p-8 text-center">
            <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <div className="text-slate-600 mb-4">Track student progress and impact</div>
            <div className="text-sm text-red-500 font-medium border border-red-200 bg-red-50 p-3 rounded">
              THIS IS WHERE ALL MESSAGES, PROGRESS, EDUCATION ACHIEVED, TESTS, EXAM RESULTS ETC.... WILL BE
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}