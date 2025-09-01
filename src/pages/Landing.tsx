import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeCheck, GraduationCap, ShieldCheck, Users } from "lucide-react";

export const Landing = ({ go }: { go: (route: string) => void }) => (
  <div className="space-y-10">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <BadgeCheck className="h-5 w-5 text-emerald-600" />
        <h2 className="text-lg font-semibold text-slate-900">Education without interest. Impact without doubt.</h2>
      </div>
      <p className="text-sm text-slate-500">Akhuwat USA connects donors with students via whole-student sponsorships.</p>
    </div>

    <Card className="p-8 bg-gradient-to-br from-emerald-50 to-white">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Sponsor talent. Track progress. Recycle impact.
          </h1>
          <p className="text-slate-600">
            Donors sponsor full students (no partial donations). Admins verify documents. Repayments refill the fund for the next cohort.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => go("marketplace")}>Explore Students</Button>
            <Button variant="outline" onClick={() => go("apply")}>I’m a Student</Button>
            <Button variant="outline" onClick={() => go("update")}>Submit Term Update</Button>
            <Button variant="outline" onClick={() => go("admin")}>Admin Login</Button>
          </div>
          <div className="flex gap-6 pt-2 text-sm text-slate-600">
            <div><span className="font-semibold text-slate-900">501(c)(3)</span> receipts</div>
            <div>WCAG AA accessible</div>
            <div>Secure uploads & audit logs</div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="text-sm text-slate-600">Students Sponsored</div>
            <div className="text-2xl font-semibold">2</div>
          </Card>
          <Card className="p-5">
            <div className="text-sm text-slate-600">Students Available</div>
            <div className="text-2xl font-semibold">2</div>
          </Card>
          <Card className="p-5">
            <div className="text-sm text-slate-600">Universities</div>
            <div className="text-2xl font-semibold">120</div>
          </Card>
          <Card className="p-5">
            <div className="text-sm text-slate-600">On-Time Repayment</div>
            <div className="text-2xl font-semibold">92%</div>
          </Card>
        </div>
      </div>
    </Card>

    <div className="grid md:grid-cols-3 gap-5">
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-1">Whole-Student Sponsorships</h3>
        <p className="text-sm text-slate-600">Pick students to fully sponsor—simple amounts, no partial progress bars.</p>
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-1">Interest-Free, Always</h3>
        <p className="text-sm text-slate-600">Repayments are income-based and interest-free. Returned funds sponsor the next cohort.</p>
      </Card>
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-1">Built for Trust</h3>
        <p className="text-sm text-slate-600">Role-based access, audit logs, verified documents, and tax receipts.</p>
      </Card>
    </div>
  </div>
);
