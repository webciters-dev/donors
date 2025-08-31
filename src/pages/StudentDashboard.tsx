import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap,
  DollarSign,
  Users,
  Calendar,
  BookOpen,
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Heart,
  Download
} from "lucide-react";

// Mock student data
const mockStudent = {
  id: "student-1",
  firstName: "Ahmad",
  lastName: "Khan",
  email: "ahmad.khan@email.com", 
  program: "BS Computer Science",
  university: "University of Punjab",
  city: "Lahore",
  gpa: 3.75,
  needUSD: 8000,
  fundedUSD: 6200,
  graduationYear: 2025,
  joinedAt: "2023-09-15"
};

const mockSponsors = [
  {
    id: "sponsor-1",
    name: "Sarah Johnson",
    organization: "Tech for Good Foundation",
    amountFunded: 2500,
    fundedAt: "2024-01-15",
    status: "Active"
  },
  {
    id: "sponsor-2",
    name: "Mohammad Ali",
    organization: "Individual Donor",
    amountFunded: 2000,
    fundedAt: "2024-01-10",
    status: "Active"
  },
  {
    id: "sponsor-3",
    name: "Fatima Foundation",
    organization: "Charity Organization",
    amountFunded: 1700,
    fundedAt: "2024-01-05",
    status: "Active"
  }
];

const mockActivities = [
  {
    id: "activity-1",
    type: "application_submitted",
    title: "Application Submitted",
    description: "Your application has been submitted for review",
    date: "2024-01-20",
    status: "completed"
  },
  {
    id: "activity-2",
    type: "document_verified",
    title: "Documents Verified",
    description: "All required documents have been verified",
    date: "2024-01-22",
    status: "completed"
  },
  {
    id: "activity-3",
    type: "funding_received",
    title: "Funding Received",
    description: "Received $2,500 from Sarah Johnson",
    date: "2024-01-25",
    status: "completed"
  },
  {
    id: "activity-4",
    type: "semester_update",
    title: "Semester Update Due",
    description: "Please submit your Fall 2024 semester update",
    date: "2024-02-01",
    status: "pending"
  }
];

const SectionTitle = ({ icon: Icon, title, subtitle }: { icon?: any; title: string; subtitle?: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-emerald-600" aria-hidden />}
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);

const KPI = ({ label, value, icon: Icon }: { label: string; value: number | string; icon?: any }) => (
  <Card className="p-5">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-emerald-600" />}
      <div>
        <div className="text-sm text-slate-600">{label}</div>
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
      </div>
    </div>
  </Card>
);

export const StudentDashboard = () => {
  const progressPercentage = (mockStudent.fundedUSD / mockStudent.needUSD) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
              Welcome back, {mockStudent.firstName}!
            </h1>
            <p className="text-slate-600 mt-2">
              {mockStudent.program} • {mockStudent.university}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">
              ${mockStudent.fundedUSD.toLocaleString()} / ${mockStudent.needUSD.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600">
              {progressPercentage.toFixed(0)}% funded
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
            <span>Funding Progress</span>
            <span>{progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={progressPercentage} />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPI label="Total Funded" value={`$${mockStudent.fundedUSD.toLocaleString()}`} icon={DollarSign} />
        <KPI label="Sponsors" value={mockSponsors.length} icon={Users} />
        <KPI label="Current GPA" value={mockStudent.gpa} icon={Trophy} />
        <KPI label="Grad Year" value={mockStudent.graduationYear} icon={GraduationCap} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sponsors */}
          <Card className="p-5">
            <SectionTitle icon={Heart} title="Your Sponsors" />
            <div className="mt-4 space-y-3">
              {mockSponsors.map((sponsor) => (
                <div key={sponsor.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                  <div>
                    <div className="font-medium text-slate-900">{sponsor.name}</div>
                    <div className="text-sm text-slate-600">{sponsor.organization}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">${sponsor.amountFunded.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">{sponsor.fundedAt}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Activities */}
          <Card className="p-5">
            <SectionTitle icon={Clock} title="Recent Activities" />
            <div className="mt-4 space-y-3">
              {mockActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200">
                  <div className="mt-1">
                    {activity.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{activity.title}</div>
                    <div className="text-sm text-slate-600">{activity.description}</div>
                    <div className="text-xs text-slate-500 mt-1">{activity.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button className="w-full justify-start" onClick={() => alert("Submit semester update (static)")}>
                <BookOpen className="h-4 w-4 mr-2" />
                Submit Semester Update
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => alert("Download transcript (static)")}>
                <Download className="h-4 w-4 mr-2" />
                Download Documents
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => alert("Contact support (static)")}>
                <Users className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </Card>

          {/* Profile Summary */}
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Profile Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Program</span>
                <span className="font-medium">{mockStudent.program}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">University</span>
                <span className="font-medium">{mockStudent.university}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">City</span>
                <span className="font-medium">{mockStudent.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Current GPA</span>
                <span className="font-medium">{mockStudent.gpa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Graduation</span>
                <span className="font-medium">{mockStudent.graduationYear}</span>
              </div>
            </div>
          </Card>

          {/* Funding Progress */}
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Funding Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Need</span>
                <span className="font-medium">${mockStudent.needUSD.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Funded</span>
                <span className="font-medium text-emerald-600">${mockStudent.fundedUSD.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Remaining</span>
                <span className="font-medium text-amber-600">${(mockStudent.needUSD - mockStudent.fundedUSD).toLocaleString()}</span>
              </div>
              <Progress value={progressPercentage} className="mt-2" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};