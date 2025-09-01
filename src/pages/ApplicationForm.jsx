import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText } from "lucide-react";

export const ApplicationForm = () => {
  const [step, setStep] = useState(1);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-900">Student Application</h1>
      </div>

      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= i ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>
            {i}
          </div>
        ))}
      </div>

      <Card className="p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <Input placeholder="Full Name" className="rounded-2xl" />
            <Input placeholder="Email" type="email" className="rounded-2xl" />
            <Input placeholder="University" className="rounded-2xl" />
            <Input placeholder="Program/Field" className="rounded-2xl" />
            <Input placeholder="Amount Needed (USD)" type="number" className="rounded-2xl" />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Documents</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Transcript</label>
              <Input type="file" className="rounded-2xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ID Card</label>
              <Input type="file" className="rounded-2xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Admission Letter</label>
              <Input type="file" className="rounded-2xl" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review & Submit</h3>
            <p className="text-slate-600">Please review your application before submitting.</p>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p><strong>Name:</strong> [Your Name]</p>
              <p><strong>University:</strong> [Your University]</p>
              <p><strong>Program:</strong> [Your Program]</p>
              <p><strong>Amount:</strong> $[Amount]</p>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            className="rounded-2xl"
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
          >
            Back
          </Button>
          <Button 
            className="rounded-2xl"
            onClick={() => {
              if (step < 3) {
                setStep(step + 1);
              } else {
                alert("Application submitted!");
              }
            }}
          >
            {step === 3 ? "Submit" : "Next"}
          </Button>
        </div>
      </Card>
    </div>
  );
};