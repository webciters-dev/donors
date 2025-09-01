import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap } from "lucide-react";

export const StudentTermUpdate = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-5 w-5 text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-900">Term Update Submission</h1>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <Input placeholder="Student Name" className="rounded-2xl" />
          <Input placeholder="Current Term (e.g., Fall 2024)" className="rounded-2xl" />
          <Input placeholder="Current GPA" type="number" step="0.1" className="rounded-2xl" />
          
          <div>
            <label className="block text-sm font-medium mb-2">Upload Transcript</label>
            <Input type="file" className="rounded-2xl" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Additional Notes</label>
            <textarea 
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm resize-none"
              rows={4}
              placeholder="Any updates about your academic progress..."
            />
          </div>

          <Button className="w-full rounded-2xl" onClick={() => alert("Update submitted!")}>
            Submit Update
          </Button>
        </div>
      </Card>
    </div>
  );
};