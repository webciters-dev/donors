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

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const DonorDashboard = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [sponsorships, setSponsorships] = useState([]);
  const [query, setQuery] = useState("");

  const isDonor = user?.role === "DONOR";
  const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;

  useEffect(() => {
    if (!isDonor) return;
    let dead = false;

    async function load() {
      try {
        const [pRes, sRes] = await Promise.all([
          fetch(`${API}/api/donors/me`, { headers: { ...authHeader } }),
          fetch(`${API}/api/donors/me/sponsorships`, {
            headers: { ...authHeader },
          }),
        ]);

        if (pRes.status === 401 || sRes.status === 401) {
          toast.error("Your session expired. Please sign in again.");
          logout?.();
          return;
        }

        if (!pRes.ok) {
          const errorText = await pRes.text();
          console.error("Profile API error:", errorText);
          throw new Error(`Profile API failed (${pRes.status}): ${errorText}`);
        }
        if (!sRes.ok) {
          const errorText = await sRes.text();
          console.error("Sponsorships API error:", errorText);
          throw new Error(`Sponsorships API failed (${sRes.status}): ${errorText}`);
        }

        const p = await pRes.json();
        const s = await sRes.json();
        if (!dead) {
          setProfile(p);
          setSponsorships(Array.isArray(s?.sponsorships) ? s.sponsorships : []);
        }
      } catch (e) {
        console.error("Donor dashboard error:", e);
        if (!dead) {
          toast.error("Failed to load donor dashboard");
          setProfile(null);
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
        <h1 className="text-2xl font-semibold">Donor Dashboard</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search my sponsored students…"
            className="w-80 rounded-2xl"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            className="rounded-2xl"
            variant="outline"
            onClick={() => navigate("/marketplace")}
          >
            Sponsor another student
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-slate-600">Total Sponsored (USD)</div>
          <div className="text-2xl font-semibold">
            ${fmt(profile?.stats?.totalFunded)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Students Sponsored</div>
          <div className="text-2xl font-semibold">
            {fmt(profile?.stats?.sponsorshipCount)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Account</div>
          <div className="text-base font-medium truncate">
            {profile?.donor?.name || user?.email}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {profile?.donor?.email}
          </div>
        </Card>
      </div>

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
