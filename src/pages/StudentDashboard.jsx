// src/pages/StudentDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  MessageSquare, 
  User, 
  GraduationCap,
  AlertCircle,
  ArrowRight
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  
  const [application, setApplication] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Handle success messages
  useEffect(() => {
    const successType = searchParams.get('success');
    if (successType === 'application-submitted') {
      toast.success("Application submitted successfully!", {
        description: "Your application is now under review. We'll update you on the progress."
      });
      // Clear the URL parameter
      navigate('/student/dashboard', { replace: true });
    }
  }, [searchParams, navigate]);

  // Load student application and messages
  useEffect(() => {
    async function loadDashboardData() {
      if (!token) return;
      
      try {
        setLoading(true);
        
        // Load application
        const appRes = await fetch(`${API}/api/applications`, {
          headers: authHeader
        });
        if (appRes.ok) {
          const appData = await appRes.json();
          const applications = Array.isArray(appData?.applications) ? appData.applications : appData;
          const userApp = applications.find(app => app.studentId === user?.studentId) || null;
          setApplication(userApp);
          
          // Load messages if application exists
          if (userApp) {
            const msgRes = await fetch(`${API}/api/messages?studentId=${userApp.studentId}&applicationId=${userApp.id}`, {
              headers: authHeader
            });
            if (msgRes.ok) {
              const msgData = await msgRes.json();
              setMessages(msgData.messages || []);
            }
          }
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [token, user?.studentId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Student Dashboard</h1>
        <div className="text-center py-8">
          <div className="text-slate-600">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'PENDING':
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', text: 'Under Review' };
      case 'PROCESSING':
        return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100', text: 'Processing' };
      case 'APPROVED':
        return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', text: 'Approved' };
      case 'REJECTED':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', text: 'Rejected' };
      default:
        return { icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100', text: 'Draft' };
    }
  };

  const statusInfo = getStatusInfo(application?.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Student Dashboard</h1>
        <div className="text-sm text-slate-600">
          Welcome back, {user?.name || user?.email}
        </div>
      </div>

      {/* Priority Messages - Show at Top */}
      {messages.length > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h2 className="font-semibold text-red-800">Important Messages</h2>
              <Badge variant="destructive" className="ml-auto">
                {messages.length} New
              </Badge>
            </div>
            <div className="space-y-3">
              {messages.slice(-3).map((msg, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-red-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={msg.fromRole === 'admin' ? 'default' : 'secondary'}>
                          {msg.fromRole === 'admin' ? '👨‍💼 Admin' : 
                           msg.fromRole === 'field_officer' ? '🏢 Sub Admin' : '👤 You'}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium">{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              {messages.length > 3 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/my-application')}
                  className="w-full mt-2"
                >
                  View All {messages.length} Messages
                </Button>
              )}
              <Button 
                onClick={() => navigate('/my-application')}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Respond to Messages
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Application Status Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">Application Status</h2>
            {application ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${statusInfo.bg}`}>
                    <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                  </div>
                  <div>
                    <div className="font-medium">{statusInfo.text}</div>
                    <div className="text-sm text-slate-600">
                      Application ID: {application.id.slice(-8)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-600">Submitted</div>
                    <div className="font-medium">
                      {new Date(application.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600">Amount Requested</div>
                    <div className="font-medium">
                      {(() => {
                        const currency = application.currency || 'USD';
                        const amount = currency === 'PKR' ? 
                          (application.needPKR || application.needUSD || 0) : 
                          (application.needUSD || 0);
                        return `${currency === 'PKR' ? 'Rs' : '$'} ${amount.toLocaleString()}`;
                      })()}
                    </div>
                  </div>
                </div>

                {application.status === 'APPROVED' && (
                  <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                    <div className="text-emerald-800 font-medium">🎉 Congratulations!</div>
                    <div className="text-emerald-700 text-sm">
                      Your application has been approved. You'll now appear in the marketplace for donor sponsorship.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-600">
                No application found. 
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => navigate('/apply')}
                >
                  Create Application
                </Button>
              </div>
            )}
          </div>
          
          {application && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/my-application')}
              className="flex items-center gap-2"
            >
              View Details <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium">Profile</div>
              <div className="text-sm text-slate-600">Update your information</div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3"
            onClick={() => navigate('/student/profile')}
          >
            Manage Profile
          </Button>
        </Card>

        {messages.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium">Messages</div>
                <div className="text-sm text-slate-600">{messages.length} total messages</div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-3"
              onClick={() => navigate('/my-application')}
            >
              View Messages
            </Button>
          </Card>
        )}

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-medium">My Application</div>
              <div className="text-sm text-slate-600">View and manage application</div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3"
            onClick={() => navigate('/my-application')}
          >
            View Application
          </Button>
        </Card>
      </div>

      {/* Recent Messages */}
      {messages.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Communications</h2>
          <div className="space-y-3">
            {messages.slice(-3).map((msg, idx) => (
              <div key={idx} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {msg.fromRole === 'student' ? 'You' : msg.fromRole === 'admin' ? 'Admin' : 'Field Officer'}
                  </div>
                  <div className="text-slate-700">{msg.text}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(msg.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {messages.length > 3 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/my-application')}
              >
                View All Messages
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}