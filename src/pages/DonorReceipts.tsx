import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";

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

export const DonorReceipts = () => {
  const rows = [
    { id: "R-2025-00031", date: "2025-08-02", amount: 600, status: "Issued" },
    { id: "R-2025-00012", date: "2025-05-14", amount: 1800, status: "Issued" },
    { id: "R-2024-00422", date: "2024-12-28", amount: 2500, status: "Issued" },
  ];
  
  const cols = [
    { key: "id", label: "Receipt #" },
    { key: "date", label: "Date" },
    { key: "amount", label: "Amount", render: (r: any) => `$${r.amount.toLocaleString()}` },
    { key: "status", label: "Status", render: (r: any) => <Badge variant="success">{r.status}</Badge> },
    { key: "dl", label: "", render: (r: any) => <SecondaryButton onClick={() => alert(`Download ${r.id} (static)`)}>Download PDF</SecondaryButton> },
  ];
  
  return (
    <div className="space-y-6">
      <SectionTitle icon={Download} title="Tax Receipts" subtitle="IRS-compliant receipts issued by Akhuwat USA" />
      <Card className="p-5 space-y-4">
        <Table columns={cols} rows={rows} />
      </Card>
    </div>
  );
};