import { ShieldCheck, HeartHandshake, Trophy, Globe, Mail } from "lucide-react";

export default function FooterInfo() {
  return (
    <section className="mt-10">
      {/* Trust / How it works */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Why AWAKE Connect?
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 mt-1 text-emerald-600" />
            <div>
              <div className="font-medium text-slate-900">Transparent & Secure</div>
              <p className="text-sm text-slate-600">
                501(c)(3) with bank-level security and fully auditable records.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <HeartHandshake className="h-5 w-5 mt-1 text-emerald-600" />
            <div>
              <div className="font-medium text-slate-900">Whole-Student Support</div>
              <p className="text-sm text-slate-600">
                Sponsor tuition, hostel, and essentials—see progress every term.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 mt-1 text-emerald-600" />
            <div>
              <div className="font-medium text-slate-900">Outcomes You Can Track</div>
              <p className="text-sm text-slate-600">
                Students upload results & certificates; donors view a living timeline.
              </p>
            </div>
          </div>
        </div>

        {/* Secondary row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 mt-1 text-emerald-600" />
            <div>
              <div className="font-medium text-slate-900">Marketplace of Hope</div>
              <p className="text-sm text-slate-600">
                Only admin-approved applications appear for sponsorship.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 md:col-span-2">
            <Mail className="h-5 w-5 mt-1 text-emerald-600" />
            <div>
              <div className="font-medium text-slate-900">Questions?</div>
              <p className="text-sm text-slate-600">
                Reach us at <span className="font-medium">support@awake.org</span> · Akhuwat USA
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
