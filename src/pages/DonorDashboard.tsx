import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart,
  DollarSign,
  Users,
  TrendingUp,
  Download,
  ExternalLink,
  Calendar,
  GraduationCap,
  MapPin
} from "lucide-react";

// Mock donor data
const mockDonor = {
  id: "donor-1",
  firstName: "Sarah",
  lastName: "Johnson",
  email: "sarah.johnson@example.com",
  organization: "Tech for Good Foundation",
  totalDonated: 12500,
  studentsSupported: 5,
  joinedAt: "2023-06-15"
};

const mockFundedStudents = [
  {
    id: "student-1",
    name: "Ayesha Khan",
    program: "BS Computer Science",
    university: "University of Punjab",
    city: "Lahore",
    amountFunded: 2000,
    fundedAt: "2024-01-20",
    status: "Active",
    progress: 80
  },
  {
    id: "student-2",
    name: "Muhammad Ali",
    program: "MBBS",
    university: "Dow University",
    city: "Karachi",
    amountFunded: 3500,
    fundedAt: "2024-01-15",
    status: "Graduated",
    progress: 100
  },
  {
    id: "student-3",
    name: "Hassan Sheikh",
    program: "BE Electrical",
    university: "NUST",
    city: "Islamabad",
    amountFunded: 1800,
    fundedAt: "2024-01-10",
    status: "Active",
    progress: 60
  }
];

const mockRecommendedStudents = [
  {
    id: "student-4",
    name: "Fatima Ahmed",
    program: "BBA Finance",
    university: "LUMS",
    city: "Lahore",
    needUSD: 4500,
    fundedUSD: 2700,
    reason: "Similar to your previous Computer Science funding preferences"
  },
  {
    id: "student-5",
    name: "Ali Hassan",
    program: "BS Physics",
    university: "Quaid-i-Azam University",
    city: "Islamabad",
    needUSD: 5200,
    fundedUSD: 1000,
    reason: "High GPA in STEM field matching your interests"
  }
];

export const DonorDashboard = () => {
  const currentYear = new Date().getFullYear();
  
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
                  Welcome back, {mockDonor.firstName}!
                </h1>
                <p className="opacity-90 mt-2">
                  {mockDonor.organization} • Donor since {new Date(mockDonor.joinedAt).getFullYear()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  ${mockDonor.totalDonated.toLocaleString()}
                </div>
                <div className="text-sm opacity-80">
                  Total donated • {mockDonor.studentsSupported} students supported
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
                    ${mockDonor.totalDonated.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Donated</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-info mx-auto mb-2" />
                  <div className="text-2xl font-bold text-info">{mockDonor.studentsSupported}</div>
                  <div className="text-sm text-muted-foreground">Students Supported</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">
                    ${(mockDonor.totalDonated / currentYear - 2023).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">This Year</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-warning mx-auto mb-2" />
                  <div className="text-2xl font-bold text-warning">
                    {Math.round((mockFundedStudents.filter(s => s.status === "Active").length / mockFundedStudents.length) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Students Active</div>
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
                <TabsTrigger value="students">My Students</TabsTrigger>
                <TabsTrigger value="recommendations">Recommended</TabsTrigger>
                <TabsTrigger value="tax-receipts">Tax Receipts</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Impact */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Impact</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <GraduationCap className="h-5 w-5 text-success mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">
                              Ayesha Khan achieved 3.8 GPA
                            </p>
                            <p className="text-xs text-muted-foreground">
                              BS Computer Science • 2 days ago
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <Heart className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">
                              Muhammad Ali graduated
                            </p>
                            <p className="text-xs text-muted-foreground">
                              MBBS Program • 1 week ago
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <DollarSign className="h-5 w-5 text-warning mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">
                              New funding opportunity
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Hassan Sheikh needs $1,200 more • 3 days ago
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full justify-start" variant="secondary">
                        <Heart className="h-4 w-4 mr-2" />
                        Explore New Students
                      </Button>
                      
                      <Button className="w-full justify-start" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download Tax Receipt
                      </Button>
                      
                      <Button className="w-full justify-start" variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        Update Preferences
                      </Button>
                      
                      <Button className="w-full justify-start" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Share Your Impact
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="students" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Students You've Supported</h2>
                  <Button variant="secondary">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {mockFundedStudents.map((student) => (
                    <Card key={student.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold">{student.name}</h3>
                              <Badge variant={student.status === "Active" ? "info" : "success"}>
                                {student.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {student.program} • {student.university}
                            </p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-1" />
                              {student.city}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Funded ${student.amountFunded.toLocaleString()} on {student.fundedAt}
                            </p>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="text-lg font-bold text-success">
                              ${student.amountFunded.toLocaleString()}
                            </div>
                            <Button variant="outline" size="sm">
                              View Progress
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Recommended for You</h2>
                  <p className="text-muted-foreground mb-6">
                    Students that match your funding preferences and interests
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {mockRecommendedStudents.map((student) => {
                    const progressPercentage = (student.fundedUSD / student.needUSD) * 100;
                    
                    return (
                      <Card key={student.id}>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{student.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {student.program} • {student.university}
                                </p>
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {student.city}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">
                                  ${student.fundedUSD.toLocaleString()} / ${student.needUSD.toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {progressPercentage.toFixed(0)}% funded
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-info/10 border border-info/20 rounded-lg p-3">
                              <p className="text-sm text-info-foreground">
                                <TrendingUp className="h-4 w-4 inline mr-1" />
                                {student.reason}
                              </p>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button variant="secondary" className="flex-1">
                                <Heart className="h-4 w-4 mr-2" />
                                Fund Now
                              </Button>
                              <Button variant="outline">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="tax-receipts" className="space-y-6">
                <h2 className="text-2xl font-bold">Tax Receipts</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Annual Tax Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">2024 Tax Receipt</p>
                            <p className="text-sm text-muted-foreground">
                              Total donations: ${mockDonor.totalDonated.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">2023 Tax Receipt</p>
                            <p className="text-sm text-muted-foreground">
                              Available January 2024
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
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