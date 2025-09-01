import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, ShieldCheck, DollarSign } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon?: any; title: string; subtitle?: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-emerald-600" aria-hidden />}
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);

// Mock rollups for the new model
const kpis = [
  { label: "Students Sponsored", value: 2, icon: Users },
  { label: "Students Available", value: 2, icon: Users },
  { label: "Avg Sponsorship", value: "$3,100", icon: DollarSign },
  { label: "On-Time Repayment", value: "92%", icon: ShieldCheck },
];

// Sponsorships by program (count of students sponsored)
const byProgram = [
  { program: "CS", count: 1 },
  { program: "ME", count: 1 },
  { program: "EE", count: 0 },
  { program: "MBBS", count: 0 },
];

// Availability split
const availability = [
  { name: "Sponsored", value: 2 },
  { name: "Available", value: 2 },
];

const COLORS = ["#10b981", "#94a3b8"];

export const Reports = () => (
  <div className="space-y-6">
    <SectionTitle icon={TrendingUp} title="Reporting & Analytics" subtitle="Sponsorship and repayment performance" />

    {/* KPIs */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((k, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-center gap-3">
            {k.icon && <k.icon className="h-5 w-5 text-emerald-600" />}
            <div>
              <div className="text-sm text-slate-600">{k.label}</div>
              <div className="text-2xl font-semibold text-slate-900">{k.value}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5 space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Sponsorships by Program</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byProgram}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="program" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Availability Split</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={availability} dataKey="value" nameKey="name" outerRadius={90} label>
                {availability.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-2">
          <Badge variant="success">Sponsored</Badge>
          <Badge variant="secondary">Available</Badge>
        </div>
      </Card>
    </div>
  </div>
);
