import { Card } from "@/components/ui/card";
import { Download, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

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

const kpis = [
  { label: "Total Donors", value: 1874 },
  { label: "Students Funded", value: 4212 },
  { label: "Active Repayers", value: 2789 },
  { label: "On-Time Repayment", value: "92%" },
];

const repaymentsSeries = [
  { month: "Jan", onTime: 90, late: 10 },
  { month: "Feb", onTime: 92, late: 8 },
  { month: "Mar", onTime: 93, late: 7 },
  { month: "Apr", onTime: 91, late: 9 },
  { month: "May", onTime: 94, late: 6 },
  { month: "Jun", onTime: 92, late: 8 },
];

export const Reports = () => (
  <div className="space-y-6">
    <SectionTitle icon={TrendingUp} title="Reporting & Analytics" subtitle="Program outcomes and repayment performance" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((k, i) => (<KPI key={i} label={k.label} value={k.value} />))}
    </div>
    <Card className="p-5 space-y-4">
      <h3 className="text-base font-semibold text-slate-900">Repayment Performance</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={repaymentsSeries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" /><YAxis /><Tooltip />
            <Bar dataKey="onTime" fill="#059669" />
            <Bar dataKey="late" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
    <div className="flex items-center gap-3">
      <SecondaryButton><Download className="h-4 w-4" /> Export CSV</SecondaryButton>
      <SecondaryButton><Download className="h-4 w-4" /> Export PDF</SecondaryButton>
    </div>
  </div>
);