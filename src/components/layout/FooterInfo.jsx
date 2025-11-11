import { ShieldCheck, HeartHandshake, Trophy, Globe, Mail } from "lucide-react";
import { getCMSContent } from "@/lib/cms";

export default function FooterInfo() {
  return (
    <section className="mt-10">
      {/* Trust / How it works */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {getCMSContent('whySection.title')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 mt-1 text-emerald-600" />
            <div>
              <div className="font-medium text-slate-900">{getCMSContent('whySection.items.transparent.title')}</div>
              <p className="text-sm text-slate-600">
                {getCMSContent('whySection.items.transparent.description')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <HeartHandshake className="h-5 w-5 mt-1 text-emerald-600" />
            <div>
              <div className="font-medium text-slate-900">{getCMSContent('whySection.items.wholestudent.title')}</div>
              <p className="text-sm text-slate-600">
                {getCMSContent('whySection.items.wholestudent.description')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 mt-1 text-emerald-600" />
            <div>
              <div className="font-medium text-slate-900">{getCMSContent('whySection.items.tracking.title')}</div>
              <p className="text-sm text-slate-600">
                {getCMSContent('whySection.items.tracking.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Secondary row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-start gap-3">
            <Globe className="h-5 w-5 mt-1 text-emerald-600" />
            <div>
              <div className="font-medium text-slate-900">{getCMSContent('whySection.items.marketplace.title')}</div>
              <p className="text-sm text-slate-600">
                {getCMSContent('whySection.items.marketplace.description')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 md:col-span-2">
            <Mail className="h-5 w-5 mt-1 text-emerald-600" />
            <div>
              <div className="font-medium text-slate-900">{getCMSContent('whySection.items.questions.title')}</div>
              <p className="text-sm text-slate-600">
                {getCMSContent('whySection.items.questions.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
