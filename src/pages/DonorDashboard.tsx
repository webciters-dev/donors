import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BadgeCheck, ShieldCheck, DollarSign, UserRound, Download } from "lucide-react";

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon?: any; title: string; subtitle?: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-emerald-600" aria-hidden />}
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);

const SecondaryButton = ({ children, className = "", ...props }: any) => (
  <button
    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium border shadow-sm border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const KPI = ({ label, value, icon: Icon }: { label: string; value: number | string; icon?: any }) => (
  <Card className="p-5">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-emerald-600" />}
      <div>
        <div className="text-sm text-slate-600">{label}</div>
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
      </div>
    </div>
  </Card>
);

const Table = ({ columns, rows }: { columns: any[]; rows: any[] }) => (
  <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
    <table className="min-w-full divide-y divide-slate-200">
      <thead className="bg-slate-50">
        <tr>
          {columns.map((c) => (
            <th key={c.key} scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        {rows.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50">
            {columns.map((c) => (
              <td key={c.key} className="px-4 py-3 text-sm text-slate-800">{c.render ? c.render(r) : r[c.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

interface DonorDashboardProps {
  setActive: (route: string) => void;
}

export const DonorDashboard = ({ setActive }: DonorDashboardProps) => {
  const cols = [
    { key: "name", label: "Student" },
    { key: "university", label: "University" },
    { key: "field", label: "Field" },
    { key: "status", label: "Status", render: (r: any) => <Badge variant={r.status === "Repaying" ? "success" : "warning"}>{r.status}</Badge> },
    { key: "progress", label: "Repayment", render: (r: any) => <Progress value={r.progress} /> },
  ];
  const rows = [
    { name: "Ayesha Khan", university: "NUST", field: "CS", status: "Active", progress: 35 },
    { name: "Bilal Ahmed", university: "UET Lahore", field: "ME", status: "Repaying", progress: 68 },
    { name: "Hira Fatima", university: "DUHS", field: "MBBS", status: "Active", progress: 10 },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle icon={BadgeCheck} title="Donor Dashboard" subtitle="Your portfolio and impact" />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Students Funded" value={rows.length} icon={UserRound} />
        <KPI label="Repayment On-Time" value="92%" icon={ShieldCheck} />
        <KPI label="This Year Giving" value="$4,250" icon={DollarSign} />
        <KPI label="Badges Earned" value={3} icon={BadgeCheck} />
      </div>

      {/* Funded table + actions */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-semibold text-slate-900">Funded Students</h3>
          <div className="flex items-center gap-2">
            <SecondaryButton onClick={() => setActive && setActive('preferences')} aria-label="Open donor preferences">
              Preferences
            </SecondaryButton>
            <SecondaryButton onClick={() => setActive && setActive('receipts')} aria-label="Open tax receipts">
              Tax Receipts
            </SecondaryButton>
            <SecondaryButton onClick={() => alert('Downloading (static)')} aria-label="Download annual impact report">
              <Download className="h-4 w-4" /> Annual Impact Report
            </SecondaryButton>
          </div>
        </div>

        <Table columns={cols} rows={rows} />
      </Card>
    </div>
  );
};