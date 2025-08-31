import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon?: any; title: string; subtitle?: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-emerald-600" aria-hidden />}
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);

export const StudentTermUpdate = () => {
  return (
    <div className="space-y-6">
      <SectionTitle icon={GraduationCap} title="Submit Term Update" subtitle="Share grades and progress for this term" />
      <Card className="p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-slate-600">Student</span>
            <input className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400" defaultValue="Ayesha Khan" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Term</span>
            <input className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400" defaultValue="Fall 2025" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">GPA (this term)</span>
            <input className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="e.g., 3.8" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Transcript (PDF/JPG)</span>
            <input type="file" className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-slate-600">Notes</span>
          <textarea className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[100px]" placeholder="Courses completed, internship, research, awards..."></textarea>
        </label>
        <div className="flex items-center justify-end">
          <Button onClick={() => alert("Submitted for admin verification (static)")}>Submit Update</Button>
        </div>
      </Card>
    </div>
  );
};