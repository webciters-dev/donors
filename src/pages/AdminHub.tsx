import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Eye,
  FileText,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Filter,
} from "lucide-react";

interface AdminHubProps {
  go: (route: string, id?: number) => void;
}

// Mock data aligned to “whole student” sponsorship
const mockApplications = [
  {
    id: "app-1",
    student: "Ayesha Khan",
    term: "Fall 2025",
    program: "BS Computer Science",
    university: "NUST",
    amountUSD: 2400,
    status: "PENDING",
    submittedAt: "2025-08-07",
    documents: ["transcript", "cnic", "admission"],
  },
  {
    id: "app-2",
    student: "Hira Fatima",
    term: "Fall 2025",
    program: "MBBS",
    university: "DUHS",
    amountUSD: 5000,
    status: "PROCESSING",
    submittedAt: "2025-08-06",
    documents: ["transcript", "cnic", "admission", "video"],
  },
  {
    id: "app-3",
    student: "Bilal Ahmed",
    term: "Spring 2025",
    program: "BE Mechanical",
    university: "UET Lahore",
    amountUSD: 1800,
    status: "APPROVED",
    submittedAt: "2025-05-10",
    documents: ["transcript", "cnic", "admission"],
  },
];

const mockKPIs = {
  totalApplications: 247,
  pendingReview: 23,
  totalDisbursed: 2100000,
  activeStudents: 156,
  successRate: 89,
};

export const AdminHub = ({ go }: AdminHubProps) => {
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredApplications = mockApplications.filter(
    (app) =>
      app.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.university.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReviewAction = (applicationId: string, action: string) => {
    // API call goes here in real app
    alert(`${action} application ${applicationId} with notes: ${reviewNotes}`);
    setSelectedApplication(null);
    setReviewNotes("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "pending";
      case "PROCESSING":
        return "processing";
      case "APPROVED":
        return "approved";
      case "REJECTED":
        return "rejected";
      default:
        return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-primary text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Hub</h1>
              <p className="opacity-90 mt-2">Manage applications, review students, and track disbursements</p>
            </div>
            <Button variant="secondary">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary">{mockKPIs.totalApplications}</div>
                <div className="text-sm text-muted-foreground">Total Applications</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-warning">{mockKPIs.pendingReview}</div>
                <div className="text-sm text-muted-foreground">Pending Review</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-success">${(mockKPIs.totalDisbursed / 1_000_000).toFixed(1)}M</div>
                <div className="text-sm text-muted-foreground">Total Disbursed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-info">{mockKPIs.activeStudents}</div>
                <div className="text-sm text-muted-foreground">Active Students</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary">{mockKPIs.successRate}%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="applications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="disbursements">Disbursements</TabsTrigger>
              <TabsTrigger value="donors">Donors</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="space-y-6">
              {/* Search & filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search applications…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>

              {/* Applications list */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredApplications.map((application) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{application.student}</h3>
                            <Badge variant={getStatusColor(application.status)}>{application.status}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {application.program} • {application.university} • $
                            {application.amountUSD.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Submitted: {application.submittedAt} • Term: {application.term}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedApplication(application)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="disbursements">
              <Card>
                <CardHeader>
                  <CardTitle>Disbursements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Disbursement management coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="donors">
              <Card>
                <CardHeader>
                  <CardTitle>Donor Directory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Donor management coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>System Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Advanced reporting coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Review Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Review Application
                <Button variant="outline" size="sm" onClick={() => setSelectedApplication(null)}>
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Student Info */}
              <div className="space-y-3">
                <h3 className="font-semibold">Student Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> {selectedApplication.student}</div>
                  <div><span className="text-muted-foreground">Program:</span> {selectedApplication.program}</div>
                  <div><span className="text-muted-foreground">University:</span> {selectedApplication.university}</div>
                  <div><span className="text-muted-foreground">Requested:</span> ${selectedApplication.amountUSD.toLocaleString()}</div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-3">
                <h3 className="font-semibold">Documents</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedApplication.documents.map((doc: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm capitalize">{doc}</span>
                      <Button variant="outline" size="sm" className="ml-auto">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Notes */}
              <div className="space-y-3">
                <h3 className="font-semibold">Review Notes</h3>
                <Textarea
                  placeholder="Add your review notes here..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="warning"
                  onClick={() => handleReviewAction(selectedApplication.id, "PROCESSING")}
                  className="flex-1"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Set Processing
                </Button>
                <Button
                  variant="success"
                  onClick={() => handleReviewAction(selectedApplication.id, "APPROVED")}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReviewAction(selectedApplication.id, "REJECTED")}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
