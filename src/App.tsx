import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Nav } from "@/components/layout/Header";
import { Landing } from "@/pages/Landing";
import { Marketplace } from "@/pages/Marketplace";
import { AdminHub } from "@/pages/AdminHub";
import { StudentDashboard } from "@/pages/StudentDashboard";
import { DonorDashboard } from "@/pages/DonorDashboard";

const queryClient = new QueryClient();

// App shell with navigation matching original design
const App = () => {
  const [active, setActive] = useState("home");
  const [studentDetailId, setStudentDetailId] = useState<number | null>(null);

  const go = (route: string, id?: number) => {
    if (route === "student" && id) {
      setStudentDetailId(id);
      setActive("student");
    } else {
      setStudentDetailId(null);
      setActive(route);
    }
  };

  const renderContent = () => {
    switch (active) {
      case "home":
        return <Landing go={go} />;
      case "marketplace":
        return <Marketplace />;
      case "donor":
        return <DonorDashboard setActive={setActive} />;
      case "apply":
        return <div className="text-center py-8 text-slate-600">Student Application (Coming Soon)</div>;
      case "admin":
        return <AdminHub go={go} />;
      case "reports":
        return <div className="text-center py-8 text-slate-600">Reports & Analytics (Coming Soon)</div>;
      case "student":
        return studentDetailId ? (
          <div className="text-center py-8 text-slate-600">Student Detail #{studentDetailId} (Coming Soon)</div>
        ) : (
          <StudentDashboard />
        );
      default:
        return <Landing go={go} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="min-h-screen bg-slate-50">
          <Nav active={active} setActive={setActive} />
          <main className="mx-auto max-w-7xl px-4 py-6">
            {renderContent()}
          </main>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;