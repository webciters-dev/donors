import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, ChevronRight, ChevronDown } from "lucide-react";

const classNames = (...c: (string | boolean | undefined)[]) => c.filter(Boolean).join(" ");

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

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-sm text-slate-700">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

export const ApplicationForm = () => {
  const [step, setStep] = useState(1);
  
  return (
    <div className="space-y-6">
      <SectionTitle icon={GraduationCap} title="Student Application" subtitle="Complete and submit with required documents" />
      <Card className="p-5">
        <div className="mb-6 grid grid-cols-3 gap-2">
          {[1,2,3].map((i) => (
            <div key={i} className={classNames("flex items-center justify-center rounded-xl px-3 py-2 text-sm", step===i?"bg-emerald-600 text-white":"bg-slate-100 text-slate-700")}>
              Step {i}
            </div>
          ))}
        </div>
        {step===1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Loan Amount (PKR)">
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="e.g., 600,000"/>
            </Field>
            <Field label="Duration (terms)">
              <input className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="e.g., 4"/>
            </Field>
            <Field label="Purpose Breakdown">
              <textarea className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-h-[100px]" placeholder="Tuition, books, housing, transport"/>
            </Field>
            <Field label="Expected Graduation Date">
              <input type="date" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
            </Field>
          </div>
        )}
        {step===2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Upload Transcript">
              <input type="file" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
            </Field>
            <Field label="Upload CNIC / Student ID">
              <input type="file" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
            </Field>
            <Field label="Admission Letter">
              <input type="file" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
            </Field>
            <Field label="Video Introduction (optional)">
              <input type="file" className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
            </Field>
          </div>
        )}
        {step===3 && (
          <div className="space-y-3">
            <div className="text-sm text-slate-700">Review your details and submit. Admin verification SLA: within 2 weeks.</div>
            <ul className="list-disc pl-5 text-sm text-slate-700">
              <li>PKR↔USD conversion shown on submit</li>
              <li>All required documents must be attached</li>
              <li>Repayment starts 6 months post-graduation</li>
            </ul>
          </div>
        )}
        <div className="mt-6 flex items-center justify-between">
          <SecondaryButton onClick={() => setStep(Math.max(1, step-1))}>
            <ChevronDown className="h-4 w-4 rotate-90"/> Back
          </SecondaryButton>
          {step<3 ? (
            <Button onClick={() => setStep(step+1)}>Next <ChevronRight className="h-4 w-4"/></Button>
          ) : (
            <Button onClick={() => alert("Submitted: Pending Admin Review")}>Submit Application</Button>
          )}
        </div>
      </Card>
    </div>
  );
};