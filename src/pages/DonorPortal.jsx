// src/pages/DonorPortal.jsx (dynamic donor portal)
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
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

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Currency metadata and helper functions (hoisted for performance)
const CURRENCY_META = {
  USD: { symbol: '$', flag: '🇺🇸' },
  PKR: { symbol: 'Rs', flag: '🇵🇰' },
  GBP: { symbol: '£', flag: '🇬🇧' }
};

const fmtAmount = (amount, currency = 'USD') => {
  const meta = CURRENCY_META[currency] || CURRENCY_META.USD;
  const num = Number(amount || 0);
  return `${meta.symbol} ${num.toLocaleString()}`;
};

const flag = (cur) => CURRENCY_META[cur]?.flag || '🇺🇸';

export default function DonorPortal() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  
  const [students, setStudents] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("browse");
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
          
          // Transform API data to match component expectations
          const transformedStudents = apiStudents.map(s => ({
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

  const totalDonated = sponsorships.reduce((sum, s) => sum + (s.amount || 0), 0);
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

      {/* Stats Cards */}
      {token && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{fmtAmount(totalDonated)}</div>
                <div className="text-sm text-slate-600">Total Donated</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{studentsHelped}</div>
                <div className="text-sm text-slate-600">Students Helped</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold">{sponsorships.length}</div>
                <div className="text-sm text-slate-600">Active Sponsorships</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                      <div className="shrink-0 rounded-full bg-amber-500 text-white text-xs font-semibold px-3 py-1 shadow-sm flex items-center gap-1">
                        <span>{flag(s.currency)}</span>
                        <span>{fmtAmount(remaining, s.currency)}</span>
                      </div>
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
              {sponsorships.map((sponsorship) => (
                <Card key={sponsorship.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold">{sponsorship.student?.name}</div>
                      <div className="text-sm text-slate-600">{sponsorship.student?.program}</div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                      {fmtAmount(sponsorship.amount)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/students/${sponsorship.studentId}`)}
                    >
                      View Progress
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="p-8 text-center">
            <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <div className="text-slate-600 mb-4">Payment history and management</div>
            <div className="text-sm text-slate-500">Coming soon - integrate with payment processor</div>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card className="p-8 text-center">
            <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <div className="text-slate-600 mb-4">Track student progress and impact</div>
            <div className="text-sm text-slate-500">Coming soon - detailed progress tracking</div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}