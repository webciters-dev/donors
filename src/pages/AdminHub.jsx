import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, Download } from "lucide-react";
import { mockData } from "@/data/mockData";

export const AdminHub = ({ go }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);

  const filteredApps = mockData.applications.filter(app =>
    app.student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReview = (status) => {
    alert(`Application ${status.toLowerCase()}`);
    setSelectedApp(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admin Hub</h1>
        <Button variant="outline" className="rounded-2xl">
          <Download className="h-4 w-4 mr-2" /> Export Data
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">45</div>
          <div className="text-sm text-slate-600">Total Applications</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">12</div>
          <div className="text-sm text-slate-600">Pending Review</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">$285K</div>
          <div className="text-sm text-slate-600">Total Disbursed</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">94%</div>
          <div className="text-sm text-slate-600">Success Rate</div>
        </Card>
      </div>

      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="disbursements">Disbursements</TabsTrigger>
          <TabsTrigger value="donors">Donors</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search applications..."
                className="pl-10 rounded-2xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredApps.map((app) => (
              <Card key={app.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{app.student.name}</h3>
                    <p className="text-sm text-slate-600">
                      {app.student.program} at {app.student.university}
                    </p>
                    <p className="text-sm text-slate-500">
                      Submitted: {app.submittedAt} | Need: ${app.needUsd?.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={app.status === 'PENDING' ? 'secondary' : 'default'}>
                      {app.status}
                    </Badge>
                    <Button 
                      onClick={() => go("student", app.studentId)} 
                      variant="outline" 
                      size="sm"
                      className="rounded-2xl"
                    >
                      <Eye className="h-4 w-4 mr-1" /> View Student
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="disbursements">
          <Card className="p-6 text-center">
            <p className="text-slate-600">Disbursement management coming soon...</p>
            <Button onClick={() => go("disburse")} className="mt-4 rounded-2xl">
              Record New Disbursement
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="donors">
          <Card className="p-6 text-center">
            <p className="text-slate-600">Donor management coming soon...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};