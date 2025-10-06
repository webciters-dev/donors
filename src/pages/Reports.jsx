import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

export const Reports = () => {
  const [stats, setStats] = useState({
    studentsSponsored: '—',
    averageSponsorship: '—',
    totalDonors: '—',
    onTimeRepayment: '—'
  });

  useEffect(() => {
    // TODO: Fetch real analytics data from API
    // For now, show clean placeholders until real data is available
    setStats({
      studentsSponsored: '0',
      averageSponsorship: '0',
      totalDonors: '0',
      onTimeRepayment: '—'
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-5 w-5 text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.studentsSponsored}</div>
          <div className="text-sm text-slate-600">Students Sponsored</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">${stats.averageSponsorship}</div>
          <div className="text-sm text-slate-600">Avg Sponsorship</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.totalDonors}</div>
          <div className="text-sm text-slate-600">Total Donors</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.onTimeRepayment}</div>
          <div className="text-sm text-slate-600">On-Time Repayment</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Sponsorships by Program</h3>
          <div className="space-y-3">
            {["Computer Science", "Medicine", "Engineering", "Business"].map((program, i) => (
              <div key={program} className="flex justify-between items-center">
                <span>{program}</span>
                <Badge variant="secondary">{12 + i * 3}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Student Availability</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Sponsored Students</span>
              <Badge variant="default">89</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Available Students</span>
              <Badge variant="outline">34</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};