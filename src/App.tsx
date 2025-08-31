import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

// App shell with navigation matching original design
const App = () => {
  const [active, setActive] = useState("home");
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [disburseOpen, setDisburseOpen] = useState(false);

  const go = (tab: string, id?: number) => {
    setActive(tab);
    if (id) setSelectedStudent(id);
    if (tab === "disburse") setDisburseOpen(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <Nav active={active} setActive={setActive} />
          <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
            {active === "home" && <Landing go={setActive} />}
            {active === "marketplace" && <Marketplace />}
            {active === "donor" && <DonorDashboard setActive={setActive} />}
            {active === "preferences" && <DonorPreferences />}
            {active === "receipts" && <DonorReceipts />}
            {active === "apply" && <ApplicationForm />}
            {active === "admin" && <AdminHub go={go} />}
            {active === "reports" && <Reports />}
            {active === "matrix" && <SponsorshipMatrix />}
            {active === "update" && <StudentTermUpdate />}
            {active === "student" && selectedStudent && <StudentDetail id={selectedStudent} goBack={() => setActive("admin")} />}

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
              <span className="flex items-center gap-2"><Clock className="h-4 w-4"/> Prototype UI</span>
            </div>
          </footer>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;