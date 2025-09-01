import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  useParams,
  Navigate,
} from "react-router-dom";

import { Nav } from "@/components/layout/Header";
import { Landing } from "@/pages/Landing";
import { Marketplace } from "@/pages/Marketplace";
import { AdminHub } from "@/pages/AdminHub";
import { StudentDetail } from "@/pages/StudentDetail";
import { DonorDashboard } from "@/pages/DonorDashboard";
import { DonorPreferences } from "@/pages/DonorPreferences";
import { DonorReceipts } from "@/pages/DonorReceipts";
import { ApplicationForm } from "@/pages/ApplicationForm";
import { Reports } from "@/pages/Reports";
import { SponsorshipMatrix } from "@/pages/SponsorshipMatrix";
import { StudentTermUpdate } from "@/pages/StudentTermUpdate";
import { DisbursementDrawer } from "@/components/DisbursementDrawer";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

const queryClient = new QueryClient();

/* ---------- helpers to map tabs <-> routes ---------- */
const pathFromKey = {
  home: "/",
  marketplace: "/marketplace",
  donor: "/donor",
  preferences: "/preferences",
  receipts: "/receipts",
  apply: "/apply",
  admin: "/admin",
  reports: "/reports",
  matrix: "/matrix",
  update: "/update",
};

function keyFromPath(pathname) {
  if (pathname === "/" || pathname === "/#/" || pathname === "") return "home";
  if (pathname.startsWith("/students/")) return "student";
  const match = Object.entries(pathFromKey).find(([, p]) => p === pathname);
  return match?.[0] ?? "home";
}

/* ---------- route wrapper for StudentDetail ---------- */
function StudentDetailRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  if (!id) return <Navigate to="/admin" replace />;
  const numericId = Number(id);
  return <StudentDetail id={numericId} goBack={() => navigate(-1)} />;
}

/* ---------- shell that wires nav to router ---------- */
function Shell() {
  const [disburseOpen, setDisburseOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const active = keyFromPath(location.pathname);

  // Adapter so your existing Nav works as before
  const setActive = (key) => {
    const path = pathFromKey[key] ?? "/";
    navigate(path);
  };

  // Your old go() still works (and adds deep-link for student)
  const go = (tab, id) => {
    if (tab === "student" && id) {
      navigate(`/students/${id}`);
      return;
    }
    if (tab === "disburse") {
      setDisburseOpen(true);
      return;
    }
    setActive(tab);
  };

  return (
    <>
      <Toaster />
      <Sonner />
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Nav active={active} setActive={setActive} />

        <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
          <Routes>
            <Route path="/" element={<Landing go={setActive} />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/donor" element={<DonorDashboard setActive={setActive} />} />
            <Route path="/preferences" element={<DonorPreferences />} />
            <Route path="/receipts" element={<DonorReceipts />} />
            <Route path="/apply" element={<ApplicationForm />} />
            <Route path="/admin" element={<AdminHub go={go} />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/matrix" element={<SponsorshipMatrix />} />
            <Route path="/update" element={<StudentTermUpdate />} />
            {/* Deep link: #/students/1 */}
            <Route path="/students/:id" element={<StudentDetailRoute />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Card className="p-5">
            <h3 className="text-base font-semibold text-slate-900 mb-2">Design Principles</h3>
            <ul className="grid md:grid-cols-3 gap-2 text-sm text-slate-700 list-disc pl-5">
              <li>Clear hierarchy with concise copy</li>
              <li>High-contrast, accessible components (WCAG 2.1 AA)</li>
              <li>Meaningful color for status and progress</li>
              <li>Responsive layout: mobile-first up to 2xl</li>
              <li>Consistent spacing: 8px scale via Tailwind utilities</li>
              <li>Actionable empty states & skeletons (to add)</li>
            </ul>
          </Card>

          <DisbursementDrawer open={disburseOpen} onClose={() => setDisburseOpen(false)} />
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-600 flex items-center justify-between">
            <span>© {new Date().getFullYear()} Akhuwat USA · AWAKE Connect</span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Prototype UI
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}

/* ---------- top-level with providers + HashRouter ---------- */
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <Shell />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;