import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GraduationCap, DollarSign, FileText, Users } from "lucide-react";
import { mockData } from "@/data/mockData";

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-emerald-600" aria-hidden />}
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);

const SecondaryButton = ({ onClick, icon: Icon, children }) => (
  <Button onClick={onClick} variant="outline" className="rounded-2xl">
    {Icon && <Icon className="h-4 w-4 mr-2" />}
    {children}
  </Button>
);

export const StudentDetail = ({ id, goBack }) => {
  const student = mockData.students.find((s) => s.id === id);
  const application = mockData.applications.find((a) => a.studentId === id);
  const sponsorship = mockData.sponsorships.find((s) => s.studentId === id);

  if (!student) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-900">Student not found</h2>
        <Button onClick={goBack} className="mt-4 rounded-2xl">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={goBack} variant="outline" size="icon" className="rounded-2xl">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <SectionTitle
          icon={GraduationCap}
          title={`${student.name} - Student Profile`}
          subtitle={`${student.program} at ${student.university}`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Student Profile */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Student Profile</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Name:</span>
              <span className="font-medium">{student.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Program:</span>
              <span className="font-medium">{student.program}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">University:</span>
              <span className="font-medium">{student.university}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">GPA:</span>
              <Badge variant="default">{student.gpa}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Graduation Year:</span>
              <span className="font-medium">{student.gradYear}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Location:</span>
              <span className="font-medium">{student.city}, {student.province}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Gender:</span>
              <span className="font-medium">{student.gender === 'M' ? 'Male' : 'Female'}</span>
            </div>
          </div>
        </Card>

        {/* Sponsorship Details */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Sponsorship Details</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Need:</span>
              <span className="text-xl font-bold text-emerald-600">${student.needUsd.toLocaleString()}</span>
            </div>
            
            {student.sponsored && sponsorship ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Status:</span>
                  <Badge variant="default">Sponsored</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount Sponsored:</span>
                  <span className="font-semibold">${sponsorship.amountUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Sponsor Date:</span>
                  <span className="font-medium">{sponsorship.createdAt}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Status:</span>
                  <Badge variant="outline">Available for Sponsorship</Badge>
                </div>
                <Button className="w-full rounded-2xl" onClick={() => alert(`Sponsor ${student.name} for $${student.needUsd.toLocaleString()}`)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Sponsor Now - ${student.needUsd.toLocaleString()}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Application Details */}
      {application && (
        <Card className="p-6">
          <SectionTitle
            icon={FileText}
            title="Application Details"
            subtitle={`${application.term} - ${application.status}`}
          />
          <div className="mt-4 grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Application ID:</span>
                <span className="font-medium">#{application.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Term:</span>
                <span className="font-medium">{application.term}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Submitted:</span>
                <span className="font-medium">{application.submittedAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status:</span>
                <Badge variant={application.status === 'APPROVED' ? 'default' : application.status === 'PENDING' ? 'secondary' : 'outline'}>
                  {application.status}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-slate-600 block mb-2">Documents:</span>
                <div className="space-y-1">
                  {application.documents?.map((doc, index) => (
                    <div key={index} className="text-sm text-emerald-600 hover:underline cursor-pointer">
                      📄 {doc}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};