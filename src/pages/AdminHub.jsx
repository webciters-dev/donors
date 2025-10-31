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
import { API } from "@/lib/api";
import { fmtAmount } from "@/lib/currency";

export const AdminHub = ({ go }) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [recentMessages, setRecentMessages] = useState([]);
  const [allMessages, setAllMessages] = useState([]); // Store all messages for Communications tab
  const [applications, setApplications] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageFilter, setMessageFilter] = useState('all'); // 'all', 'student', 'donor', 'sub_admin', 'unread'
  const [quickReplyMessage, setQuickReplyMessage] = useState(null);
  const [quickReplyText, setQuickReplyText] = useState("");

  // Load recent messages and applications from API
  useEffect(() => {
    async function loadData() {
      if (!token) return;
      try {
        setLoading(true);
        
        // Load applications
        const appsRes = await fetch(`${API.baseURL}/api/applications?limit=100`, { headers: authHeader });
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setApplications(appsData.applications || []);
        }
        
        // Load donors
        const donorsRes = await fetch(`${API.baseURL}/api/donors?limit=100`, { headers: authHeader });
        if (donorsRes.ok) {
          const donorsData = await donorsRes.json();
          setDonors(donorsData.donors || []);
        } else {
          console.error('Failed to load donors:', donorsRes.status, await donorsRes.text());
        }
        
        // Load recent messages from students (both old and new systems)
        let allMessages = [];
        
        // Load old messages (admin access)
        const messagesRes = await fetch(`${API.baseURL}/api/messages?admin=true`, { headers: authHeader });
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          console.log('🔍 AdminHub: Old messages loaded:', messagesData.messages?.length || 0);
          // Transform old messages to match the expected format
          const oldMessages = (messagesData.messages || []).map(msg => ({
            id: msg.id,
            text: msg.text,
            fromRole: msg.fromRole?.toLowerCase() || 'student',
            createdAt: msg.createdAt,
            senderName: msg.student?.name || 'Unknown',
            studentName: msg.student?.name || 'Unknown Student'
          }));
          allMessages = oldMessages;
        } else {
          console.error('🔍 AdminHub: Failed to load old messages:', messagesRes.status, await messagesRes.text());
        }
        
        // Load conversation messages
        try {
          console.log('🔍 AdminHub: Loading conversations...');
          const convRes = await fetch(`${API.baseURL}/api/conversations?includeAllMessages=true`, { headers: authHeader });
          console.log('🔍 AdminHub: Conversations response status:', convRes.status);
          
          if (convRes.ok) {
            const convData = await convRes.json();
            console.log('🔍 AdminHub: Conversations data:', convData);
            const conversations = convData.conversations || [];
            console.log(`🔍 AdminHub: Found ${conversations.length} conversations`);
            
            // Extract messages from conversations and convert to old format
            conversations.forEach(conv => {
              console.log('🔍 AdminHub: Processing conversation:', conv.id, 'Messages:', conv.messages?.length);
              if (conv.messages) {
                conv.messages.forEach(msg => {
                  console.log('🔍 AdminHub: Adding message from conversation:', msg.id, msg.senderRole, msg.text?.substring(0, 50));
                  
                  // Get proper sender name based on role
                  let senderName = 'Unknown';
                  if (msg.sender) {
                    if (msg.sender.donor?.name) {
                      senderName = msg.sender.donor.name;
                    } else if (msg.sender.student?.name) {
                      senderName = msg.sender.student.name;
                    } else if (msg.sender.name) {
                      senderName = msg.sender.name;
                    }
                  }
                  
                  allMessages.push({
                    id: msg.id,
                    text: msg.text,
                    fromRole: msg.senderRole.toLowerCase(),
                    createdAt: msg.createdAt,
                    senderName: senderName,
                    studentName: conv.student?.name || 'Unknown Student'
                  });
                });
              }
            });
          } else {
            const errorText = await convRes.text();
            console.error('🔍 AdminHub: Conversations API error:', convRes.status, errorText);
          }
        } catch (convError) {
          console.error('🔍 AdminHub: Failed to load conversations:', convError);
        }
        
        // Store all messages for Communications tab
        setAllMessages(allMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        
        // Get latest 5 messages from students (including donors)
        const studentMessages = allMessages
          .filter(msg => msg.fromRole === 'student' || msg.fromRole === 'donor')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setRecentMessages(studentMessages);
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

  // Filter messages based on selected filter - use allMessages for Communications tab
  const filteredMessages = allMessages.filter((message) => {
    if (messageFilter === 'all') return true;
    if (messageFilter === 'student') return message.fromRole === 'student';
    if (messageFilter === 'donor') return message.fromRole === 'donor';
    if (messageFilter === 'sub_admin') return message.fromRole === 'sub_admin';
    if (messageFilter === 'unread') return message.isUnread; // TODO: Implement unread tracking
    return true;
  });

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
      // Use server-side export endpoint for better performance and completeness
      const response = await fetch(`${API.baseURL}/api/export/applications`, { 
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

  // Export donors functionality
  const handleExportDonors = async () => {
    if (!token) {
      toast.error("You must be logged in to export data");
      return;
    }

    try {
      const response = await fetch(`${API.baseURL}/api/export/donors`, { 
        headers: authHeader 
      });

      if (!response.ok) {
        throw new Error(`Donors export failed: ${response.statusText}`);
      }

      // Get the blob data
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'donors_export.csv';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      toast.success("Donors data exported successfully!");
      
    } catch (error) {
      console.error('Donors export failed:', error);
      toast.error("Failed to export donors data. Please try again.");
    }
  };

  // Export sub-admins functionality
  const handleExportSubAdmins = async () => {
    if (!token) {
      toast.error("You must be logged in to export data");
      return;
    }

    try {
      const response = await fetch(`${API.baseURL}/api/export/sub-admins`, { 
        headers: authHeader 
      });

      if (!response.ok) {
        throw new Error(`Sub-admins export failed: ${response.statusText}`);
      }

      // Get the blob data
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sub_admins_export.csv';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      toast.success("Sub admins data exported successfully!");
      
    } catch (error) {
      console.error('Sub-admins export failed:', error);
      toast.error("Failed to export sub admins data. Please try again.");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Hub</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* NEW: jump to the live Applications manager page */}
          <Button
            className="bg-green-600 hover:bg-green-700 min-h-[44px]"
            onClick={() => navigate("/admin/applications")}
          >
            Applications
          </Button>
          {/* NEW: manage sub admins */}
          <Button
            variant="secondary"
            onClick={() => navigate("/admin/officers")}
            className="min-h-[44px]"
          >
            Staff Management
          </Button>
          <div className="grid grid-cols-1 sm:flex sm:flex-row gap-2 sm:gap-3">
            <Button variant="outline" onClick={handleExportData} className="min-h-[44px]">
              <Download className="h-4 w-4 mr-2" /> Download Applications
            </Button>
            <Button variant="outline" onClick={handleExportDonors} className="min-h-[44px]">
              <Download className="h-4 w-4 mr-2" /> Download Donors
            </Button>
            <Button variant="outline" onClick={handleExportSubAdmins} className="min-h-[44px]">
              <Download className="h-4 w-4 mr-2" /> Download Staff
            </Button>
          </div>
        </div>
      </div>

      {/* Priority Messages from Students */}
      {recentMessages.length > 0 && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50 hover:shadow-lg transition-shadow duration-300">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h2 className="text-sm sm:text-base font-semibold text-blue-800">Recent Student Messages</h2>
              </div>
              <Badge variant="default" className="self-start sm:ml-auto bg-blue-600">
                {recentMessages.length} New
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentMessages.map((msg, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <Badge variant={msg.fromRole === 'donor' ? 'default' : 'secondary'} className="text-xs self-start">
                          {msg.fromRole === 'donor' ? '💝' : '👤'} {msg.fromRole === 'donor' ? 'Donor' : 'Student'}: {msg.senderName || 'Unknown'}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {msg.studentName && msg.fromRole === 'donor' && (
                        <div className="text-xs text-slate-600 mb-1">
                          → To: {msg.studentName}
                        </div>
                      )}
                      <p className="text-slate-800 text-xs sm:text-sm font-medium line-clamp-2 break-words">{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              onClick={() => navigate('/admin/applications')}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700 min-h-[44px]"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              View All Applications & Messages
            </Button>
          </div>
        </Card>
      )}

      {/* Statistics Dashboard */}
      {/* Main Action Items - Most Important */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300 group">
          <div className="text-2xl sm:text-3xl font-bold text-amber-600 group-hover:scale-110 transition-transform duration-300">
            {loading ? '...' : applications.filter(app => app.status === 'PENDING').length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 font-medium">Pending Review</div>
          <div className="text-xs text-gray-500">Needs admin action</div>
        </Card>
        <Card className="p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300 group">
          <div className="text-2xl sm:text-3xl font-bold text-green-600 group-hover:scale-110 transition-transform duration-300">
            {loading ? '...' : applications.filter(app => app.status === 'APPROVED' && !(app.student?.sponsored === true)).length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 font-medium">Approved</div>
          <div className="text-xs text-gray-500">Ready for sponsorship</div>
        </Card>
        <Card className="p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300 group">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-300">
            {loading ? '...' : applications.filter(app => app.student?.sponsored === true).length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 font-medium">Sponsored</div>
          <div className="text-xs text-gray-500">Education funded</div>
        </Card>
      </div>
      
      {/* Secondary Statistics - Process Tracking & Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center bg-slate-50">
          <div className="text-base sm:text-lg font-semibold text-slate-600">
            {loading ? '...' : applications.length}
          </div>
          <div className="text-xs text-slate-500">Total Applications</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-base sm:text-lg font-semibold text-blue-600">
            {loading ? '...' : applications.filter(app => app.fieldReviews?.some(r => r.status === 'COMPLETED')).length}
          </div>
          <div className="text-xs text-slate-600">Verified by Sub Admin</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-base sm:text-lg font-semibold text-teal-600">
            {loading ? '...' : recentMessages.length}
          </div>
          <div className="text-xs text-slate-600">Recent Messages</div>
          <div className="text-xs text-slate-400">Student ↔ Donor/Admin</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-base sm:text-lg font-semibold text-red-600">
            {loading ? '...' : applications.filter(app => app.status === 'REJECTED').length}
          </div>
          <div className="text-xs text-slate-600">Rejected</div>
        </Card>
      </div>

      <Tabs defaultValue="approved">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="approved" className="text-xs sm:text-sm">Approved Students</TabsTrigger>
          <TabsTrigger value="sponsored" className="text-xs sm:text-sm">Sponsored Students</TabsTrigger>
          <TabsTrigger value="communications" className="text-xs sm:text-sm">Communications</TabsTrigger>
          <TabsTrigger value="applications" className="text-xs sm:text-sm">All Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="approved" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-emerald-800">
              ✅ Approved Students Ready for Sponsorship
            </h3>
            <Badge variant="default" className="bg-emerald-600 self-start sm:self-auto">
              {applications.filter(app => app.status === 'APPROVED' && !(app.student?.sponsored === true)).length} Ready
            </Badge>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <Card className="p-6 text-center">
                <div className="text-slate-600">Loading approved applications...</div>
              </Card>
            ) : applications.filter(app => app.status === 'APPROVED' && !(app.student?.sponsored === true)).length === 0 ? (
              <Card className="p-6 text-center">
                <div className="text-slate-600">No approved applications awaiting sponsorship</div>
              </Card>
            ) : (
              applications.filter(app => app.status === 'APPROVED' && !(app.student?.sponsored === true)).map((app) => (
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
                        Need: {fmtAmount(app.amount, app.currency)} 
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

        <TabsContent value="sponsored" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-purple-800">
              🎉 Sponsored Students
            </h3>
            <Badge variant="default" className="bg-purple-600">
              {applications.filter(app => app.student?.sponsored === true).length} Sponsored
            </Badge>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <Card className="p-6 text-center">
                <div className="text-slate-600">Loading sponsored students...</div>
              </Card>
            ) : applications.filter(app => app.student?.sponsored === true).length === 0 ? (
              <Card className="p-6 text-center">
                <div className="text-slate-600">No sponsored students yet</div>
              </Card>
            ) : (
              applications.filter(app => app.student?.sponsored === true).map((app) => (
                <Card key={app.id} className="p-4 border-l-4 border-l-purple-500 bg-purple-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-purple-900">{app.student.name}</h3>
                        <Badge variant="default" className="bg-purple-600">SPONSORED</Badge>
                      </div>
                      <p className="text-sm text-purple-800">
                        {app.student.program} at {app.student.university}
                      </p>
                      <p className="text-sm text-purple-700">
                        Need: {fmtAmount(app.amount, app.currency)} 
                        | Term: {app.term} | Approved: {new Date(app.updatedAt).toLocaleDateString()}
                      </p>
                      {app.fieldReviews?.some(r => r.status === 'COMPLETED') && (
                        <p className="text-xs text-purple-600 mt-1">
                          ✓ Field verification completed by Sub Admin
                        </p>
                      )}
                      <p className="text-xs text-purple-600 mt-1 font-medium">
                        ✨ Education fully sponsored by donor
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => navigate(`/admin/applications/${app.id}`)}
                        variant="outline"
                        size="sm"
                        className="rounded-2xl border-purple-300 text-purple-700 hover:bg-purple-100"
                      >
                        <Eye className="h-4 w-4 mr-1" /> View Details
                      </Button>
                      <Button
                        onClick={() => navigate(`/marketplace`)}
                        size="sm"
                        variant="outline"
                        className="rounded-2xl border-purple-300 text-purple-700"
                        disabled
                      >
                        ✓ Sponsored
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-blue-800">
              💬 Communications Center
            </h3>
            <Badge variant="default" className="bg-blue-600">
              {filteredMessages.length} {messageFilter === 'all' ? 'Recent' : messageFilter.charAt(0).toUpperCase() + messageFilter.slice(1)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {allMessages.filter(msg => msg.fromRole === 'student').length}
              </div>
              <div className="text-sm text-slate-600">Student Messages</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {allMessages.filter(msg => msg.fromRole === 'donor').length}
              </div>
              <div className="text-sm text-slate-600">Donor Messages</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {allMessages.filter(msg => msg.fromRole === 'sub_admin').length}
              </div>
              <div className="text-sm text-slate-600">Sub Admin Messages</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {allMessages.filter(msg => {
                  const msgDate = new Date(msg.createdAt);
                  const today = new Date();
                  return msgDate.toDateString() === today.toDateString();
                }).length}
              </div>
              <div className="text-sm text-slate-600">Today's Messages</div>
            </Card>
          </div>

          {/* Message Filters */}
          <div className="flex gap-2 mb-4">
            <Button 
              variant={messageFilter === 'all' ? 'default' : 'outline'} 
              size="sm" 
              className="rounded-2xl"
              onClick={() => setMessageFilter('all')}
            >
              All Messages
            </Button>
            <Button 
              variant={messageFilter === 'student' ? 'default' : 'outline'} 
              size="sm" 
              className="rounded-2xl"
              onClick={() => setMessageFilter('student')}
            >
              Students
            </Button>
            <Button 
              variant={messageFilter === 'donor' ? 'default' : 'outline'} 
              size="sm" 
              className="rounded-2xl"
              onClick={() => setMessageFilter('donor')}
            >
              Donors
            </Button>
            <Button 
              variant={messageFilter === 'sub_admin' ? 'default' : 'outline'} 
              size="sm" 
              className="rounded-2xl"
              onClick={() => setMessageFilter('sub_admin')}
            >
              Sub Admins
            </Button>
            <Button 
              variant={messageFilter === 'unread' ? 'default' : 'outline'} 
              size="sm" 
              className="rounded-2xl"
              onClick={() => setMessageFilter('unread')}
            >
              Unread
            </Button>
          </div>

          {/* Messages List */}
          <div className="space-y-3">
            {loading ? (
              <Card className="p-6 text-center">
                <div className="text-slate-600">Loading messages...</div>
              </Card>
            ) : filteredMessages.length === 0 ? (
              <Card className="p-6 text-center">
                <div className="text-slate-600">
                  {messageFilter === 'all' ? 'No messages yet' : `No ${messageFilter} messages`}
                </div>
              </Card>
            ) : (
              filteredMessages.map((message) => (
                <Card key={message.id} className="p-4 border-l-4 border-l-blue-500 bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-blue-900">
                          {message.senderName || 'Unknown Sender'}
                        </h4>
                        <Badge variant="outline" className={`
                          text-xs ${
                            message.fromRole === 'student' ? 'border-blue-300 text-blue-700' :
                            message.fromRole === 'donor' ? 'border-green-300 text-green-700' :
                            message.fromRole === 'sub_admin' ? 'border-orange-300 text-orange-700' :
                            'border-slate-300 text-slate-700'
                          }
                        `}>
                          {message.fromRole === 'student' ? 'Student' :
                           message.fromRole === 'donor' ? 'Donor' :
                           message.fromRole === 'sub_admin' ? 'Sub Admin' :
                           message.fromRole}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-blue-800 mb-1">
                        {message.studentName && `Student: ${message.studentName}`}
                      </p>
                      
                      <p className="text-sm text-blue-700 line-clamp-2">
                        {message.text?.substring(0, 150)}
                        {message.text?.length > 150 ? '...' : ''}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => {
                          // Simple quick reply for now - can be enhanced later
                          const reply = prompt(`Quick reply to ${message.senderName}:`);
                          if (reply) {
                            toast.success("Reply sent! (Feature will be fully implemented)");
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="rounded-2xl border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" /> Reply
                      </Button>
                      <Button
                        onClick={() => navigate(`/admin/messages/${message.id}`)}
                        variant="outline"
                        size="sm"
                        className="rounded-2xl border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        View Thread
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search applications..."
                className="pl-10 rounded-2xl min-h-[44px]"
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
                        Submitted: {new Date(app.submittedAt).toLocaleDateString()} | Need: {fmtAmount(app.amount, app.currency)}
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
      </Tabs>
    </div>
  );
};
