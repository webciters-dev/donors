import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Shield, TrendingUp, Users } from "lucide-react";

interface LandingProps {
  go: (route: string) => void;
}

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

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="text-center space-y-2">
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);

export const Landing = ({ go }: LandingProps) => (
  <div className="space-y-10">
    <SectionTitle
      title="Education without interest. Impact without doubt."
      subtitle="Akhuwat USA connects donors with Pakistani students through transparent, milestone-based support."
    />

    <Card className="p-8 bg-gradient-to-br from-emerald-50 to-white">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Fund talent. Track progress. Recycle impact.
          </h1>
          <p className="text-slate-600">
            Students receive interest-free educational loans. Donors see real progress, verified by admins. 
            Repayments refill the fund for the next cohort.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => go("marketplace")} aria-label="Explore students">
              Explore Students
            </Button>
            <Button variant="outline" onClick={() => go("apply")} aria-label="Apply for a loan">
              I'm a Student
            </Button>
            <Button variant="outline" onClick={() => go("update")} aria-label="Submit term update">
              Submit Term Update
            </Button>
            <Button variant="outline" onClick={() => go("admin")} aria-label="Admin login">
              Admin Login
            </Button>
          </div>
          <div className="flex gap-6 pt-2 text-sm text-slate-600">
            <div><span className="font-semibold text-slate-900">501(c)(3)</span> receipts</div>
            <div>WCAG AA accessible</div>
            <div>Secure uploads & audit logs</div>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-2 gap-4">
            <KPI label="Students Funded" value={4212} icon={Users} />
            <KPI label="On-Time Repayment" value="92%" icon={TrendingUp} />
            <KPI label="Active Donors" value={1874} icon={GraduationCap} />
            <KPI label="Universities" value={120} icon={Shield} />
          </div>
        </div>
      </div>
    </Card>

    <div className="grid md:grid-cols-3 gap-5">
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-1">Transparent Funding</h3>
        <p className="text-sm text-slate-600">
          See GPA updates, milestone-based disbursements, and verified documents before you donate.
        </p>
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-1">Interest-Free, Always</h3>
        <p className="text-sm text-slate-600">
          Repayments are based on income—no interest. Returned funds support the next student.
        </p>
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-1">Built for Scale & Trust</h3>
        <p className="text-sm text-slate-600">
          Role-based access, audit logs, and receipts from Akhuwat USA ensure compliance and accountability.
        </p>
      </Card>
    </div>

    <Card className="p-6">
      <h3 className="text-base font-semibold text-slate-900 mb-4">How it works</h3>
      <ol className="grid md:grid-cols-3 gap-4 list-decimal pl-5 text-sm text-slate-700">
        <li>Students apply, upload documents, and await admin approval.</li>
        <li>Donors filter, review, and fund fully or partially via Stripe.</li>
        <li>Admins disburse when 100% funded; repayments refill the fund.</li>
      </ol>
    </Card>
  </div>
);