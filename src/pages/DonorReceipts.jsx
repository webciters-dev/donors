import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { mockData } from "@/data/mockData";

export const DonorReceipts = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-900">Tax Receipts</h1>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold">Date</th>
                <th className="text-left py-3 px-4 font-semibold">Student</th>
                <th className="text-left py-3 px-4 font-semibold">Amount</th>
                <th className="text-left py-3 px-4 font-semibold">Receipt #</th>
                <th className="text-left py-3 px-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockData.receipts.map((receipt) => (
                <tr key={receipt.id} className="border-b border-slate-100">
                  <td className="py-3 px-4">{receipt.date}</td>
                  <td className="py-3 px-4">{receipt.studentName}</td>
                  <td className="py-3 px-4">${receipt.amount.toLocaleString()}</td>
                  <td className="py-3 px-4">{receipt.receiptNumber}</td>
                  <td className="py-3 px-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-2xl"
                      onClick={() => alert(`Downloading receipt ${receipt.receiptNumber}`)}
                    >
                      <Download className="h-4 w-4 mr-1" /> PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};