import React, { useState } from "react";
import FooterInfo from "@/components/layout/FooterInfo";
import DonorSignup from "@/pages/DonorSignup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import StudentProfile from "@/pages/StudentProfile";
// ADD THESE NEW IMPORTS
import StudentRegister from "@/pages/StudentRegister";
import DonorRegister from "@/pages/DonorRegister";

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
import DonorPortal from "@/pages/DonorPortal";
import DonorPayment from "@/pages/DonorPayment";
import { ApplicationForm } from "@/pages/ApplicationForm";
import { Reports } from "@/pages/Reports";
import { SponsorshipMatrix } from "@/pages/SponsorshipMatrix";
import { StudentTermUpdate } from "@/pages/StudentTermUpdate";
import { DisbursementDrawer } from "@/components/DisbursementDrawer";
import { Clock } from "lucide-react";

// ⬇️ NEW
import { AdminApplications } from "@/pages/AdminApplications";
import AdminApplicationDetail from "@/pages/AdminApplicationDetail";
import AdminDonorDetail from "@/pages/AdminDonorDetail";
import AdminMessageThread from "@/pages/AdminMessageThread";
import AdminPayments from "@/pages/AdminPayments";
import AdminDisbursements from "@/pages/AdminDisbursements";
import AdminDonors from "@/pages/AdminDonors";
import SubAdminApplicationDetail from "@/pages/SubAdminApplicationDetail";
import { MyApplication } from "@/pages/MyApplication";
import SubAdminDashboard from "@/pages/SubAdminDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import StudentProgress from "@/pages/StudentProgress";
import ActiveStudentDashboard from "@/pages/ActiveStudentDashboard";

import { AuthProvider } from "@/lib/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import { useAuth } from "@/lib/AuthContext";

const queryClient = new QueryClient();

/* ---------- helpers to map tabs <-> routes ---------- */
const pathFromKey = {
  home: "/",
  marketplace: "/marketplace",
  donor: "/donor",
  donor_portal: "/donor/portal",
  browse: "/browse",

  preferences: "/preferences",
  receipts: "/receipts",
  apply: "/apply",
  admin: "/admin",
  officers: "/admin/officers",
  subadmin: "/sub-admin",  // Still uses same route for backward compatibility
  reports: "/reports",
  matrix: "/matrix",
  update: "/update",
  studentdashboard: "/student/dashboard",
  activestudent: "/student/active",
  myapplication: "/my-application",
  studentprofile: "/student/profile",
  studentprogress: "/student/progress",

};

function keyFromPath(pathname) {
  if (pathname === "/" || pathname === "/#/" || pathname === "") return "home";
  if (pathname.startsWith("/browse")) return "browse";
  if (pathname.startsWith("/students/")) return "student";
  if (pathname.startsWith("/student/active")) return "activestudent";
  if (pathname.startsWith("/student/dashboard")) return "studentdashboard";
  if (pathname.startsWith("/student/progress")) return "studentprogress";
  if (pathname.startsWith("/my-application")) return "myapplication";
  if (pathname.startsWith("/student/profile")) return "studentprofile";

  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/sub-admin")) return "subadmin";
  if (pathname.startsWith("/donor/portal")) return "donor_portal";

  const match = Object.entries(pathFromKey).find(([, p]) => p === pathname);
  return match?.[0] ?? "home";
}

/* ---------- route wrapper for StudentDetail ---------- */
function StudentDetailRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  if (!id) return <Navigate to="/admin" replace />;
  return <StudentDetail id={id} goBack={() => navigate(-1)} />;
}

/* ---------- shell that wires nav to router ---------- */
function Shell() {
  const [disburseOpen, setDisburseOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const active = keyFromPath(location.pathname);

  const setActive = (key) => {
    // Handle role-specific "home" navigation
    if (key === "home") {
      if (user?.role === "SUB_ADMIN") {  // Internal role check remains SUB_ADMIN
        navigate("/sub-admin");
        return;
      }
      if (user?.role === "ADMIN") {
        navigate("/admin");
        return;
      }
      if (user?.role === "DONOR") {
        navigate("/marketplace");
        return;
      }
      if (user?.role === "STUDENT") {
        if (user?.studentPhase === 'ACTIVE') {
          navigate("/student/active");
          return;
        } else {
          navigate("/my-application");
          return;
        }
      }
    }
    
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
    p === "/" || p === "/marketplace" || p === "/apply" || p === "/login" || 
    p === "/student-register" || p === "/donor-register";

  return (
    <>
      <Toaster />
      <Sonner richColors position="top-right" closeButton />
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Nav active={active} setActive={setActive} />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
          <Routes>
            {/* PUBLIC */}
            <Route path="/" element={<Landing go={setActive} />} />
            
            {/* MARKETPLACE - Protected for authenticated donors */}
            <Route 
              path="/marketplace" 
              element={
                <ProtectedRoute roles={["DONOR"]}>
                  <Marketplace />
                </ProtectedRoute>
              } 
            />

            <Route path="/apply" element={<ApplicationForm />} />
            <Route path="/login" element={<Login />} />
            
            {/* ADD NEW REGISTRATION ROUTES */}
            <Route path="/student-register" element={<StudentRegister />} />
            <Route path="/donor-register" element={<DonorRegister />} />
            
            {/* Public browse page for potential donors */}
            <Route path="/browse" element={<DonorBrowse />} />

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
              path="/student/dashboard"
              element={
                <ProtectedRoute roles={["STUDENT"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/active"
              element={
                <ProtectedRoute roles={["STUDENT"]}>
                  <ActiveStudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/progress"
              element={
                <ProtectedRoute roles={["STUDENT"]}>
                  <StudentProgress />
                </ProtectedRoute>
              }
            />
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
            <Route
              path="/donor/portal"
              element={
                <ProtectedRoute roles={['DONOR']}>
                  <DonorPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donor/payment/:studentId"
              element={
                <ProtectedRoute roles={['DONOR']}>
                  <DonorPayment />
                </ProtectedRoute>
              }
            />

            <Route path="/preferences" element={<DonorPreferences />} />
            <Route path="/receipts" element={<DonorReceipts />} />

            {/* PROTECTED: ADMIN */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                  <AdminHub go={go} />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/admin/officers"
              element={
                <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                  <AdminOfficers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/applications"
              element={
                <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                  <AdminApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/applications/:id"
              element={
                <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                  <AdminApplicationDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/donors/:donorId"
              element={
                <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                  <AdminDonorDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/messages/:messageId"
              element={
                <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                  <AdminMessageThread />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                  <AdminPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/disbursements"
              element={
                <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                  <AdminDisbursements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/donors"
              element={
                <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
                  <AdminDonors />
                </ProtectedRoute>
              }
            />

            {/* PROTECTED: SUB_ADMIN */}
            <Route
              path="/sub-admin"
              element={
                <ProtectedRoute roles={["SUB_ADMIN"]}>
                  <SubAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sub-admin/review/:reviewId"
              element={
                <ProtectedRoute roles={["SUB_ADMIN"]}>
                  <SubAdminApplicationDetail />
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