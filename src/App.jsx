import React, { useState } from "react";
import FooterInfo from "@/components/layout/FooterInfo";
import DonorSignup from "@/pages/DonorSignup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import StudentProfile from "@/pages/StudentProfile";

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
import AdminOfficers from "@/pages/AdminOfficers";
import { StudentDetail } from "@/pages/StudentDetail";
import { DonorDashboard } from "@/pages/DonorDashboard";
import { DonorPreferences } from "@/pages/DonorPreferences";
import { DonorReceipts } from "@/pages/DonorReceipts";
import DonorBrowse from "@/pages/DonorBrowse";
import DonorPaymentDemo from "@/pages/DonorPaymentDemo";
import DonorProgressDemo from "@/pages/DonorProgressDemo";
import DonorRepaymentDemo from "@/pages/DonorRepaymentDemo";
import DonorStudentDetailsDemo from "@/pages/DonorStudentDetailsDemo";
import { ApplicationForm } from "@/pages/ApplicationForm";
import { Reports } from "@/pages/Reports";
import { SponsorshipMatrix } from "@/pages/SponsorshipMatrix";
import { StudentTermUpdate } from "@/pages/StudentTermUpdate";
import { DisbursementDrawer } from "@/components/DisbursementDrawer";
import { Clock } from "lucide-react";

// ⬇️ NEW
import { AdminApplications } from "@/pages/AdminApplications";
import AdminApplicationDetail from "@/pages/AdminApplicationDetail";
import { MyApplication } from "@/pages/MyApplication";
import { AuthProvider } from "@/lib/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";

const queryClient = new QueryClient();

/* ---------- helpers to map tabs <-> routes ---------- */
const pathFromKey = {
  home: "/",
  marketplace: "/marketplace",
  donor: "/donor",
  donor_demo: "/donor/demo",
  preferences: "/preferences",
  receipts: "/receipts",
  apply: "/apply",
  admin: "/admin",
  officers: "/admin/officers",
  reports: "/reports",
  matrix: "/matrix",
  update: "/update",
  myapplication: "/my-application",
  studentprofile: "/student/profile",
};

function keyFromPath(pathname) {
  if (pathname === "/" || pathname === "/#/" || pathname === "") return "home";
  if (pathname.startsWith("/students/")) return "student";
  if (pathname.startsWith("/my-application")) return "myapplication";
  if (pathname.startsWith("/student/profile")) return "studentprofile"; // ✅ ensure tab highlight
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/donor/demo")) return "donor_demo";
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

  const setActive = (key) => {
    const path = pathFromKey[key] ?? "/";
    navigate(path);
  };

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

  // decide where to show the footer info strip
  const p = location.pathname || "";
  const showFooterInfo =
    p === "/" || p === "/marketplace" || p === "/apply" || p === "/login";

  return (
    <>
      <Toaster />
      <Sonner richColors position="top-center" closeButton />
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Nav active={active} setActive={setActive} />

        <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
          <Routes>
            {/* PUBLIC */}
            <Route path="/" element={<Landing go={setActive} />} />
            <Route path="/marketplace" element={<Marketplace />} />
            {/* Public demo donor screens (static) */}
            <Route path="/donor/demo" element={<DonorBrowse />} />
            <Route path="/donor/demo/student/:id" element={<DonorStudentDetailsDemo />} />
            <Route path="/donor/demo/pay/:id" element={<DonorPaymentDemo />} />
            <Route path="/donor/demo/progress/:id" element={<DonorProgressDemo />} />
            <Route path="/donor/demo/repayment/:id" element={<DonorRepaymentDemo />} />
            <Route path="/apply" element={<ApplicationForm />} />
            <Route path="/login" element={<Login />} />

            {/* Auth flows (public) */}
            <Route path="/donor-signup" element={<DonorSignup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Optional public pages */}
            <Route path="/reports" element={<Reports />} />
            <Route path="/matrix" element={<SponsorshipMatrix />} />
            <Route path="/update" element={<StudentTermUpdate />} />
            <Route path="/students/:id" element={<StudentDetailRoute />} />

            {/* PROTECTED: STUDENT */}
            <Route
              path="/my-application"
              element={
                <ProtectedRoute roles={["STUDENT"]}>
                  <MyApplication />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute roles={["STUDENT"]}>
                  <StudentProfile />
                </ProtectedRoute>
              }
            />

            {/* PROTECTED: DONOR */}
            <Route
  path="/donor"
  element={
    <ProtectedRoute roles={['DONOR']}>
      <DonorDashboard />
    </ProtectedRoute>
  }
/>

            <Route path="/preferences" element={<DonorPreferences />} />
            <Route path="/receipts" element={<DonorReceipts />} />

            {/* PROTECTED: ADMIN */}
            <Route path="/admin" element={<AdminHub go={go} />} />
            <Route
              path="/admin/officers"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <AdminOfficers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/applications"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <AdminApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/applications/:id"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <AdminApplicationDetail />
                </ProtectedRoute>
              }
            />

            {/* FALLBACK — always last */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {showFooterInfo && <FooterInfo />}

          <DisbursementDrawer
            open={disburseOpen}
            onClose={() => setDisburseOpen(false)}
          />
        </main>

        <footer className="border-t border-slate-200 bg-white">
  <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-600 flex items-center justify-between">
    <span>© {new Date().getFullYear()} Akhuwat · AWAKE Connect</span>
    <a
      href="https://webciters.com"
      target="_blank"
      rel="noreferrer"
      className="text-emerald-700 hover:underline"
    >
      Powered by WebCiters
    </a>
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
        <AuthProvider>
          <Router>
            <Shell />
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
