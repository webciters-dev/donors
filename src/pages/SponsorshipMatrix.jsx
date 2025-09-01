import { Card } from "@/components/ui/card";
import { Grid3X3 } from "lucide-react";

export const SponsorshipMatrix = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Grid3X3 className="h-5 w-5 text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-900">Sponsorship Matrix</h1>
      </div>

      <Card className="p-6">
        <p className="text-slate-600 text-center">
          Sponsorship matrix view coming soon...
        </p>
      </Card>
    </div>
  );
};