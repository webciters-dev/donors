import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GraduationCap,
  FileText,
  DollarSign,
  Calendar,
  Upload,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

// Mock student data
const mockStudent = {
  id: "student-1",
  firstName: "Ayesha",
  lastName: "Khan",
  email: "ayesha.khan@example.com",
  program: "BS Computer Science",
  university: "University of Punjab",
  city: "Lahore",
  province: "Punjab",
  gpa: 3.8,
  gradYear: 2025,
  needUSD: 5000,
  fundedUSD: 3200
};

const mockApplications = [
  {
    id: "app-1",
    term: "Fall 2024",
    needUSD: 5000,
    fundedUSD: 3200,
    status: "APPROVED",
    submittedAt: "2024-01-15",
    documents: [
      { kind: "TRANSCRIPT", name: "transcript.pdf", verified: true },
      { kind: "CNIC", name: "cnic.pdf", verified: true },
      { kind: "ADMISSION", name: "admission_letter.pdf", verified: true },
      { kind: "VIDEO", name: "intro_video.mp4", verified: false }
    ]
  }
];

const mockSponsorships = [
  {
    id: "sponsorship-1",
    donorName: "Anonymous Donor",
    amountUSD: 2000,
    paidAt: "2024-01-20",
    message: "Best wishes for your studies!"
  },
  {
    id: "sponsorship-2",
    donorName: "Sarah Johnson",
    amountUSD: 1200,
    paidAt: "2024-01-25",
    message: "Keep up the excellent work!"
  }
];

export const StudentDashboard = () => {
  const progressPercentage = (mockStudent.fundedUSD / mockStudent.needUSD) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-16">
        {/* Header */}
        <section className="bg-gradient-primary text-white py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  Welcome back, {mockStudent.firstName}!
                </h1>
                <p className="opacity-90 mt-2">
                  {mockStudent.program} • {mockStudent.university}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  ${mockStudent.fundedUSD.toLocaleString()} / ${mockStudent.needUSD.toLocaleString()}
                </div>
                <div className="text-sm opacity-80">
                  {progressPercentage.toFixed(0)}% funded
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-8 w-8 text-success mx-auto mb-2" />
                  <div className="text-2xl font-bold text-success">
                    ${mockStudent.fundedUSD.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Funded</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-8 w-8 text-info mx-auto mb-2" />
                  <div className="text-2xl font-bold text-info">{mockApplications.length}</div>
                  <div className="text-sm text-muted-foreground">Applications</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">{mockSponsorships.length}</div>
                  <div className="text-sm text-muted-foreground">Sponsors</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <GraduationCap className="h-8 w-8 text-warning mx-auto mb-2" />
                  <div className="text-2xl font-bold text-warning">{mockStudent.gpa}</div>
                  <div className="text-sm text-muted-foreground">Current GPA</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="applications">Applications</TabsTrigger>
                <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Funding Progress */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Funding Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Current Term: Fall 2024</span>
                          <span className="font-medium">
                            ${mockStudent.fundedUSD.toLocaleString()} / ${mockStudent.needUSD.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-3" />
                        <div className="text-xs text-muted-foreground text-right">
                          {progressPercentage.toFixed(1)}% funded
                        </div>
                      </div>
                      
                      {progressPercentage < 100 && (
                        <div className="text-center pt-4">
                          <Button variant="secondary">
                            Share My Profile
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">
                              New sponsorship received
                            </p>
                            <p className="text-xs text-muted-foreground">
                              $1,200 from Sarah Johnson • 3 days ago
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <Clock className="h-5 w-5 text-warning mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">
                              Application approved
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Fall 2024 application • 1 week ago
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <FileText className="h-5 w-5 text-info mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">
                              Documents verified
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Transcript and CNIC approved • 2 weeks ago
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="applications" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">My Applications</h2>
                  <Button variant="secondary">
                    <Upload className="h-4 w-4 mr-2" />
                    New Application
                  </Button>
                </div>

                {mockApplications.map((application) => (
                  <Card key={application.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{application.term}</CardTitle>
                        <Badge variant="approved">{application.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Amount Needed:</span>
                          <div className="font-medium">${application.needUSD.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Amount Funded:</span>
                          <div className="font-medium">${application.fundedUSD.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Submitted:</span>
                          <div className="font-medium">{application.submittedAt}</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Uploaded Documents</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {application.documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm font-medium">{doc.name}</div>
                                  <div className="text-xs text-muted-foreground capitalize">
                                    {doc.kind.toLowerCase()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {doc.verified ? (
                                  <CheckCircle className="h-4 w-4 text-success" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-warning" />
                                )}
                                <Button variant="outline" size="sm">
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="sponsors" className="space-y-6">
                <h2 className="text-2xl font-bold">My Sponsors</h2>
                
                <div className="grid grid-cols-1 gap-4">
                  {mockSponsorships.map((sponsorship) => (
                    <Card key={sponsorship.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <h3 className="font-semibold">{sponsorship.donorName}</h3>
                            <p className="text-sm text-muted-foreground">
                              Contributed ${sponsorship.amountUSD.toLocaleString()} on {sponsorship.paidAt}
                            </p>
                            {sponsorship.message && (
                              <p className="text-sm italic text-muted-foreground">
                                "{sponsorship.message}"
                              </p>
                            )}
                          </div>
                          <Badge variant="success">
                            ${sponsorship.amountUSD.toLocaleString()}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="profile" className="space-y-6">
                <h2 className="text-2xl font-bold">Profile Settings</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Profile management coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};