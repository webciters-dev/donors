import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, Download, MessageSquare, AlertCircle } from "lucide-react";
import { mockData } from "@/data/mockData";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const AdminHub = ({ go }) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [recentMessages, setRecentMessages] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load recent messages and applications from API
  useEffect(() => {
    async function loadData() {
      if (!token) return;
      try {
        setLoading(true);
        
        // Load applications
        const appsRes = await fetch(`${API}/api/applications?limit=100`, { headers: authHeader });
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setApplications(appsData.applications || []);
        }
        
        // Load recent messages from students
        const messagesRes = await fetch(`${API}/api/messages`, { headers: authHeader });
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          // Get latest 5 messages from students
          const studentMessages = (messagesData.messages || [])
            .filter(msg => msg.fromRole === 'student')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
          setRecentMessages(studentMessages);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  const filteredApps = applications.filter((app) =>
    app.student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReview = (status) => {
    alert(`Application ${status.toLowerCase()}`);
    setSelectedApp(null);
  };

  // Export data functionality
  const handleExportData = async () => {
    if (!token) {
      toast.error("You must be logged in to export data");
      return;
    }

    try {
      toast.info("Preparing comprehensive data export...");
      
      // Use server-side export endpoint for better performance and completeness
      const response = await fetch(`${API}/api/export/applications`, { 
        headers: authHeader 
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get the blob data
      const blob = await response.blob();
      
      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'awake-applications-export.csv';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      toast.success("Data exported successfully! Complete applications data with student profiles, field reviews, and message counts.");
      
    } catch (error) {
      console.error('Export failed:', error);
      toast.error("Failed to export data. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admin Hub</h1>
        <div className="flex items-center gap-3">
          {/* NEW: jump to the live Applications manager page */}
          <Button
            className="rounded-2xl"
            onClick={() => navigate("/admin/applications")}
          >
            Manage Applications
          </Button>
          {/* NEW: manage field officers */}
          <Button
            className="rounded-2xl"
            variant="secondary"
            onClick={() => navigate("/admin/officers")}
          >
            Manage Sub Admins
          </Button>
          <Button variant="outline" className="rounded-2xl" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" /> Export Data
          </Button>
        </div>
      </div>

      {/* Priority Messages from Students */}
      {recentMessages.length > 0 && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-blue-800">Recent Student Messages</h2>
              <Badge variant="default" className="ml-auto bg-blue-600">
                {recentMessages.length} New
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentMessages.map((msg, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">
                          👤 Student ID: {msg.studentId?.slice(-6)}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-800 text-sm font-medium line-clamp-2">{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              onClick={() => navigate('/admin/applications')}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              View All Applications & Messages
            </Button>
          </div>
        </Card>
      )}

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">
            {loading ? '...' : applications.length}
          </div>
          <div className="text-sm text-slate-600">Total Applications</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {loading ? '...' : applications.filter(app => app.status === 'PENDING').length}
          </div>
          <div className="text-sm text-slate-600">Pending Review</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {loading ? '...' : applications.filter(app => app.status === 'APPROVED').length}
          </div>
          <div className="text-sm text-slate-600">Approved</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {loading ? '...' : applications.filter(app => app.status === 'REJECTED').length}
          </div>
          <div className="text-sm text-slate-600">Rejected</div>
        </Card>
      </div>
      
      {/* Additional Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {loading ? '...' : applications.filter(app => app.fieldReviews?.some(r => r.status === 'COMPLETED')).length}
          </div>
          <div className="text-sm text-slate-600">Field Verified</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {loading ? '...' : applications.filter(app => app.status === 'APPROVED' && app.fieldReviews?.some(r => r.status === 'COMPLETED')).length}
          </div>
          <div className="text-sm text-slate-600">Ready for Sponsors</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-teal-600">
            {loading ? '...' : recentMessages.length}
          </div>
          <div className="text-sm text-slate-600">Recent Messages</div>
        </Card>
      </div>

      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications">All Applications</TabsTrigger>
          <TabsTrigger value="approved">Approved Students</TabsTrigger>
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
            {loading ? (
              <Card className="p-6 text-center">
                <div className="text-slate-600">Loading applications...</div>
              </Card>
            ) : filteredApps.length === 0 ? (
              <Card className="p-6 text-center">
                <div className="text-slate-600">
                  {searchTerm ? `No applications found for "${searchTerm}"` : 'No applications found'}
                </div>
              </Card>
            ) : (
              filteredApps.map((app) => (
                <Card key={app.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{app.student.name}</h3>
                      <p className="text-sm text-slate-600">
                        {app.student.program} at {app.student.university}
                      </p>
                      <p className="text-sm text-slate-500">
                        Submitted: {new Date(app.submittedAt).toLocaleDateString()} | Need: {
                          app.currency === 'PKR' ? `Rs ${app.needPKR?.toLocaleString()}` : `$${app.needUSD?.toLocaleString()}`
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          app.status === "PENDING" ? "secondary" : 
                          app.status === "APPROVED" ? "default" :
                          app.status === "REJECTED" ? "destructive" : "outline"
                        }
                      >
                        {app.status}
                      </Badge>
                      <Button
                        onClick={() => navigate(`/admin/applications/${app.id}`)}
                        variant="outline"
                        size="sm"
                        className="rounded-2xl"
                      >
                        <Eye className="h-4 w-4 mr-1" /> View Student
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-emerald-800">
              ✅ Approved Students Ready for Sponsorship
            </h3>
            <Badge variant="default" className="bg-emerald-600">
              {applications.filter(app => app.status === 'APPROVED').length} Ready
            </Badge>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <Card className="p-6 text-center">
                <div className="text-slate-600">Loading approved applications...</div>
              </Card>
            ) : applications.filter(app => app.status === 'APPROVED').length === 0 ? (
              <Card className="p-6 text-center">
                <div className="text-slate-600">No approved applications yet</div>
              </Card>
            ) : (
              applications.filter(app => app.status === 'APPROVED').map((app) => (
                <Card key={app.id} className="p-4 border-l-4 border-l-emerald-500 bg-emerald-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-emerald-900">{app.student.name}</h3>
                        <Badge variant="default" className="bg-emerald-600">APPROVED</Badge>
                      </div>
                      <p className="text-sm text-emerald-800">
                        {app.student.program} at {app.student.university}
                      </p>
                      <p className="text-sm text-emerald-700">
                        Need: {app.currency === 'PKR' ? `Rs ${app.needPKR?.toLocaleString()}` : `$${app.needUSD?.toLocaleString()}`} 
                        | Term: {app.term} | Approved: {new Date(app.updatedAt).toLocaleDateString()}
                      </p>
                      {app.fieldReviews?.some(r => r.status === 'COMPLETED') && (
                        <p className="text-xs text-emerald-600 mt-1">
                          ✓ Field verification completed by Sub Admin
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => navigate(`/admin/applications/${app.id}`)}
                        variant="outline"
                        size="sm"
                        className="rounded-2xl border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                      >
                        <Eye className="h-4 w-4 mr-1" /> View Details
                      </Button>
                      <Button
                        onClick={() => navigate(`/marketplace`)}
                        size="sm"
                        className="rounded-2xl bg-emerald-600 hover:bg-emerald-700"
                      >
                        🤝 Find Sponsor
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
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
