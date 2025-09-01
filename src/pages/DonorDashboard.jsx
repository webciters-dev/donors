import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Award, DollarSign, TrendingUp, Settings, FileText, Download } from "lucide-react";
import { mockData } from "@/data/mockData";

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-emerald-600" aria-hidden />}
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);

const SecondaryButton = ({ onClick, icon: Icon, children }) => (
  <Button onClick={onClick} variant="outline" className="rounded-2xl">
    {Icon && <Icon className="h-4 w-4 mr-2" />}
    {children}
  </Button>
);

const KPI = ({ icon: Icon, label, value }) => (
  <Card className="p-4">
    <div className="flex items-center gap-3">
      <Icon className="h-8 w-8 text-emerald-600" />
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-600">{label}</div>
      </div>
    </div>
  </Card>
);

const Table = ({ columns, rows }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead>
        <tr className="border-b border-slate-200">
          {columns.map((col, i) => (
            <th key={i} className="text-left py-3 px-4 font-semibold text-slate-900">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-slate-100">
            {row.map((cell, j) => (
              <td key={j} className="py-3 px-4 text-slate-700">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const DonorDashboard = ({ setActive }) => {
  const sponsoredStudents = mockData.sponsorships.map(s => ({
    ...s.student,
    amountUsd: s.amountUsd,
    status: s.status === 'PAID' ? 'Sponsored' : 'Pending',
    repaymentProgress: Math.floor(Math.random() * 100) // Mock repayment progress
  }));

  const tableColumns = ["Name", "University", "Field", "Status", "Repayment Progress"];
  const tableRows = sponsoredStudents.map(student => [
    student.name,
    student.university,
    student.program,
    <Badge key="status" variant={student.status === 'Sponsored' ? 'default' : 'secondary'}>
      {student.status}
    </Badge>,
    `${student.repaymentProgress}%`
  ]);

  return (
    <div className="space-y-6">
      <SectionTitle
        icon={Heart}
        title="Donor Dashboard"
        subtitle="Track your impact and sponsored students"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={Heart} label="Students Sponsored" value="2" />
        <KPI icon={TrendingUp} label="Repayment On-Time" value="100%" />
        <KPI icon={DollarSign} label="This Year Giving" value="$4,200" />
        <KPI icon={Award} label="Badges Earned" value="3" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <SecondaryButton onClick={() => setActive("preferences")} icon={Settings}>
          Preferences
        </SecondaryButton>
        <SecondaryButton onClick={() => setActive("receipts")} icon={FileText}>
          Tax Receipts
        </SecondaryButton>
        <SecondaryButton onClick={() => alert("Annual report downloaded!")} icon={Download}>
          Annual Impact Report
        </SecondaryButton>
      </div>

      {/* Sponsored Students Table */}
      <Card className="p-6">
        <SectionTitle title="Your Sponsored Students" subtitle="Track progress and repayments" />
        <div className="mt-4">
          <Table columns={tableColumns} rows={tableRows} />
        </div>
      </Card>
    </div>
  );
};