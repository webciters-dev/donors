import { Card } from "@/components/ui/card";

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);

// Mock data
const students = [
  { id: 1, name: "Ayesha Khan", university: "NUST" },
  { id: 2, name: "Bilal Ahmed", university: "UET Lahore" },
  { id: 3, name: "Hira Fatima", university: "DUHS" },
  { id: 4, name: "Usman Tariq", university: "FAST" },
];

const donors = [
  { id: "d1", name: "Sarah Malik" },
  { id: "d2", name: "Imran Siddiqui" },
  { id: "d3", name: "PakTech Corp" },
];

const sponsorships = [
  { studentId: 1, donorId: "d1", amount: 1200 },
  { studentId: 1, donorId: "d2", amount: 600 },
  { studentId: 3, donorId: "d1", amount: 1000 },
  { studentId: 2, donorId: "d3", amount: 1800 },
  { studentId: 4, donorId: "d3", amount: 900 },
];

export const SponsorshipMatrix = () => {
  const amountFor = (studentId: number, donorId: string) =>
    sponsorships
      .filter(s => s.studentId === studentId && s.donorId === donorId)
      .reduce((sum, x) => sum + x.amount, 0);

  return (
    <div className="space-y-6">
      <SectionTitle title="Sponsorship Matrix" subtitle="Students × Donors (static view for admin analytics)" />
      <Card className="p-4">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Student</th>
              {donors.map(d => (
                <th key={d.id} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">{d.name}</th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Row Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {students.map(st => {
              const rowTotal = donors.reduce((sum, d) => sum + amountFor(st.id, d.id), 0);
              return (
                <tr key={st.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-800">{st.name} • {st.university}</td>
                  {donors.map(d => {
                    const amt = amountFor(st.id, d.id);
                    return <td key={d.id} className="px-4 py-3 text-sm text-right">{amt ? `$${amt.toLocaleString()}` : "—"}</td>;
                  })}
                  <td className="px-4 py-3 text-sm text-right font-semibold">${rowTotal.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50">
            <tr>
              <td className="px-4 py-3 text-sm font-semibold text-slate-900">Column Total</td>
              {donors.map(d => {
                const colTotal = sponsorships.filter(s => s.donorId === d.id).reduce((sum, x) => sum + x.amount, 0);
                return <td key={d.id} className="px-4 py-3 text-sm text-right font-semibold">${colTotal.toLocaleString()}</td>;
              })}
              <td className="px-4 py-3 text-sm text-right font-semibold">
                ${sponsorships.reduce((sum, x) => sum + x.amount, 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  );
};