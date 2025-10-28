// src/pages/DonorDashboard.jsx
import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { DollarSign, GraduationCap, Building2, UserRound } from "lucide-react";
import { API } from "@/lib/api";

export const DonorDashboard = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [sponsorships, setSponsorships] = useState([]);
  const [query, setQuery] = useState("");

  const isDonor = user?.role === "DONOR";
  const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;

  // Calculate statistics from sponsorships data (same as DonorPortal)
  const totalFunded = sponsorships.reduce((sum, s) => sum + (s.amount || 0), 0);
  const sponsorshipCount = sponsorships.length;
  const studentsHelped = new Set(sponsorships.map(s => s.studentId)).size;

  useEffect(() => {
    if (!isDonor) return;
    let dead = false;

    async function load() {
      try {
        console.log('🔍 Loading donor dashboard...', { 
          token: !!token, 
          tokenLength: token?.length,
          user,
          authHeader 
        });

        // Check if we have a token
        if (!token) {
          console.error('❌ No token available');
          toast.error("Please sign in to access your dashboard.");
          navigate("/login");
          return;
        }
        
        // Use same endpoints as DonorPortal for consistency
        const sponsorshipsResponse = await fetch(`${API.baseURL}/api/sponsorships`, {
          headers: { ...authHeader },
        });

        console.log('📡 API responses:', { 
          sponsorshipsStatus: sponsorshipsResponse.status 
        });

        // Handle authentication failures
        if (sponsorshipsResponse.status === 401) {
          console.error('🔒 Authentication failed - token expired or invalid');
          toast.error("Your session expired. Please sign in again.");
          logout?.();
          navigate("/login");
          return;
        }

        // Handle authorization failures (wrong role)
        if (sponsorshipsResponse.status === 403) {
          console.error('🚫 Authorization failed - insufficient permissions');
          const sponsorshipsError = await sponsorshipsResponse.text();
          console.error('Sponsorships error:', sponsorshipsError);
          toast.error("Access denied. Please contact support.");
          return;
        }

        if (!sponsorshipsResponse.ok) {
          const errorText = await sponsorshipsResponse.text();
          console.error("Sponsorships API error:", sponsorshipsResponse.status, errorText);
          throw new Error(`Sponsorships API failed (${sponsorshipsResponse.status}): ${errorText}`);
        }

        const sponsorshipsData = await sponsorshipsResponse.json();
        
        console.log('✅ API data received:');
        console.log('Sponsorships response:', JSON.stringify(sponsorshipsData, null, 2));
        
        if (!dead) {
          // Use same data structure as DonorPortal
          setSponsorships(Array.isArray(sponsorshipsData?.sponsorships) ? sponsorshipsData.sponsorships : []);
          console.log('✅ Dashboard data loaded successfully');
          console.log('Sponsorships set:', sponsorshipsData?.sponsorships);
        }
      } catch (e) {
        console.error("Donor dashboard error:", e);
        if (!dead) {
          toast.error("Failed to load donor dashboard: " + e.message);
          setSponsorships([]);
        }
      }
    }

    load();
    return () => {
      dead = true;
    };
  }, [isDonor, token]);

  const fmt = (n) =>
    Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

  const filtered = useMemo(() => {
    const t = (query || "").toLowerCase();
    return sponsorships.filter((sp) => {
      const s = sp.student || {};
      return (
        !t ||
        s.name?.toLowerCase().includes(t) ||
        s.university?.toLowerCase().includes(t) ||
        s.program?.toLowerCase().includes(t) ||
        s.city?.toLowerCase().includes(t)
      );
    });
  }, [sponsorships, query]);

  if (!isDonor) {
    return (
      <Card className="p-6">
        <p className="text-slate-700">
          Donor accounts only. Please{" "}
          <Button
            variant="link"
            className="px-1"
            onClick={() => navigate("/login")}
          >
            sign in
          </Button>
          .
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Donor Dashboard</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search my sponsored students…"
            className="w-80"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => navigate("/donor/portal")}
          >
            Go to Donor Portal
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/marketplace")}
          >
            Sponsor another student
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="text-sm text-gray-600 font-medium">Total Sponsored (USD)</div>
          <div className="text-3xl font-bold text-green-600 group-hover:scale-110 transition-transform duration-300">
            ${fmt(totalFunded)}
          </div>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="text-sm text-gray-600 font-medium">Students Sponsored</div>
          <div className="text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">
            {fmt(sponsorshipCount)}
          </div>
        </Card>
        <Card className="p-6 hover:shadow-lg transition-all duration-300">
          <div className="text-sm text-gray-600 font-medium">Account</div>
          <div className="text-lg font-semibold text-gray-900 truncate">
            {user?.name || user?.email}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {user?.email}
          </div>
        </Card>
      </div>

      {/* Donor Portal Navigation Card */}
      <Card className="p-6 border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-green-800">Access Full Donor Portal</h3>
            <p className="text-sm text-green-700 leading-relaxed">
              Visit the complete donor portal with tabs for browsing students, managing sponsorships, 
              viewing payment history, and tracking student progress.
            </p>
            <div className="flex items-center gap-2 text-xs text-green-600">
              <span>✓ Browse Students</span>
              <span>✓ My Students</span>
              <span>✓ Payments</span>
              <span>✓ Progress</span>
            </div>
          </div>
          <Button 
            onClick={() => navigate("/donor/portal")}
            className="bg-green-600 hover:bg-green-700"
          >
            Open Portal →
          </Button>
        </div>
      </Card>

      {/* Sponsored students list */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">My Sponsored Students</h3>

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-600">
            No sponsorships yet. Visit the{" "}
            <Button
              variant="link"
              className="px-1"
              onClick={() => navigate("/marketplace")}
            >
              Marketplace
            </Button>{" "}
            to sponsor a student.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((sp) => {
              const s = sp.student || {};
              return (
                <Card key={sp.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-base font-semibold">{s.name}</div>
                      <div className="text-sm text-slate-600">
                        {s.program} · {s.university}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      ${fmt(sp.amount)} funded
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {s.gender && (
                      <Badge variant="secondary">
                        <UserRound className="h-3.5 w-3.5 mr-1 inline" />
                        {s.gender}
                      </Badge>
                    )}
                    {s.city && (
                      <Badge variant="secondary">
                        <Building2 className="h-3.5 w-3.5 mr-1 inline" />
                        {s.city}
                      </Badge>
                    )}
                    {Number.isFinite(Number(s.gpa)) && (
                      <Badge variant="default">
                        <GraduationCap className="h-3.5 w-3.5 mr-1 inline" />
                        GPA {s.gpa}
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-slate-700">
                    <div className="flex justify-between">
                      <span>Funded on:</span>
                      <span>
                        {new Date(sp.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <Button
                      className="rounded-2xl"
                      variant="outline"
                      onClick={() => navigate(`/students/${s.id}`)}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    <Button
                      className="rounded-2xl"
                      variant="outline"
                      onClick={() => navigate(`/donor/progress/${sp.id}`)}
                    >
                      Progress
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DonorDashboard;
