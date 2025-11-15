// src/components/InterviewManager.jsx - Interview scheduling and management
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, MessageSquare, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { API } from "@/lib/api";
import RecaptchaProtection from "@/components/RecaptchaProtection";

export default function InterviewManager() {
  const { token, user } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;
  const isAdmin = user?.role === "ADMIN";

  // State
  const [interviews, setInterviews] = useState([]);
  const [boardMembers, setBoardMembers] = useState([]);
  const [students, setStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showDecisionForm, setShowDecisionForm] = useState(null);

  // Form state
  const [scheduleForm, setScheduleForm] = useState({
    studentId: '',
    applicationId: '',
    scheduledAt: '',
    meetingLink: '',
    notes: '',
    boardMemberIds: []
  });

  const [decisionForm, setDecisionForm] = useState({
    boardMemberId: '',
    decision: '',
    comments: ''
  });

  // Load data on component mount
  useEffect(() => {
    if (isAdmin) {
      loadInterviews();
      loadBoardMembers();
      loadStudentsAndApplications();
    }
  }, [isAdmin]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API.baseURL}/api/interviews`, { headers: authHeader });
      const data = await response.json();
      
      if (response.ok) {
        setInterviews(data.data || []);
      } else {
        toast.error("Failed to load interviews");
      }
    } catch (error) {
      console.error('Failed to load interviews:', error);
      toast.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  const loadBoardMembers = async () => {
    try {
      const response = await fetch(`${API.baseURL}/api/board-members/active`, { headers: authHeader });
      const data = await response.json();
      
      if (response.ok) {
        setBoardMembers(data.data || []);
      } else {
        toast.error("Failed to load board members");
      }
    } catch (error) {
      console.error('Failed to load board members:', error);
    }
  };

  const loadStudentsAndApplications = async () => {
    try {
      // Load students
      const studentsResponse = await fetch(`${API.baseURL}/api/students`, { headers: authHeader });
      const studentsData = await studentsResponse.json();
      
      if (studentsResponse.ok) {
        setStudents(studentsData.students || []);
      }

      // Load applications eligible for interviews (CASE_WORKER_APPROVED status)
      const appsResponse = await fetch(`${API.baseURL}/api/applications?status=CASE_WORKER_APPROVED`, { headers: authHeader });
      const appsData = await appsResponse.json();
      
      if (appsResponse.ok) {
        setApplications(appsData.applications || []);
      }
    } catch (error) {
      console.error('Failed to load students/applications:', error);
    }
  };

  const scheduleInterview = async (executeRecaptcha) => {
    try {
      if (!scheduleForm.studentId || !scheduleForm.applicationId || !scheduleForm.scheduledAt) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Generate reCAPTCHA token
      const recaptchaToken = executeRecaptcha ? await executeRecaptcha('scheduleInterview') : null;

      setLoading(true);
      const response = await fetch(`${API.baseURL}/api/interviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeader 
        },
        body: JSON.stringify({
          ...scheduleForm,
          scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
          recaptchaToken
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Interview scheduled successfully!");
        setScheduleForm({
          studentId: '',
          applicationId: '',
          scheduledAt: '',
          meetingLink: '',
          notes: '',
          boardMemberIds: []
        });
        setShowScheduleForm(false);
        await loadInterviews();
        await loadStudentsAndApplications(); // Refresh to update available applications
      } else {
        toast.error(data.message || "Failed to schedule interview");
      }
    } catch (error) {
      console.error('Failed to schedule interview:', error);
      toast.error("Failed to schedule interview");
    } finally {
      setLoading(false);
    }
  };

  const recordDecision = async (interviewId) => {
    try {
      if (!decisionForm.boardMemberId || !decisionForm.decision) {
        toast.error("Please select a board member and decision");
        return;
      }

      setLoading(true);
      const response = await fetch(`${API.baseURL}/api/interviews/${interviewId}/decision`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeader 
        },
        body: JSON.stringify(decisionForm)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Decision recorded successfully!");
        setDecisionForm({ boardMemberId: '', decision: '', comments: '' });
        setShowDecisionForm(null);
        await loadInterviews();
      } else {
        toast.error(data.message || "Failed to record decision");
      }
    } catch (error) {
      console.error('Failed to record decision:', error);
      toast.error("Failed to record decision");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SCHEDULED': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'IN_PROGRESS': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CANCELLED': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'blue';
      case 'IN_PROGRESS': return 'yellow';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Interview Management</h2>
          <p className="text-gray-600">Schedule and manage student interviews with the board</p>
        </div>
        <Button 
          onClick={() => setShowScheduleForm(true)} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Schedule Interview
        </Button>
      </div>

      {/* Schedule Interview Form */}
      {showScheduleForm && (
        <Card className="p-6 bg-blue-50 border-2 border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule New Interview</h3>
          
          <RecaptchaProtection>
            {({ executeRecaptcha }) => (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student *
              </label>
              <Select
                value={scheduleForm.studentId}
                onValueChange={(value) => {
                  setScheduleForm(prev => ({ ...prev, studentId: value }));
                  // Auto-filter applications for selected student
                  const studentApps = applications.filter(app => app.studentId === value);
                  if (studentApps.length === 1) {
                    setScheduleForm(prev => ({ ...prev, applicationId: studentApps[0].id }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} - {student.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application *
              </label>
              <Select
                value={scheduleForm.applicationId}
                onValueChange={(value) => setScheduleForm(prev => ({ ...prev, applicationId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select application" />
                </SelectTrigger>
                <SelectContent>
                  {applications
                    .filter(app => !scheduleForm.studentId || app.studentId === scheduleForm.studentId)
                    .map((application) => (
                    <SelectItem key={application.id} value={application.id}>
                      Application #{application.id.slice(-8)} - {application.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date & Time *
              </label>
              <Input
                type="datetime-local"
                value={scheduleForm.scheduledAt}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Link
              </label>
              <Input
                value={scheduleForm.meetingLink}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, meetingLink: e.target.value }))}
                placeholder="https://zoom.us/j/..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interview Panel (Board Members)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {boardMembers.map((member) => (
                  <label key={member.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={scheduleForm.boardMemberIds.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setScheduleForm(prev => ({
                            ...prev,
                            boardMemberIds: [...prev.boardMemberIds, member.id]
                          }));
                        } else {
                          setScheduleForm(prev => ({
                            ...prev,
                            boardMemberIds: prev.boardMemberIds.filter(id => id !== member.id)
                          }));
                        }
                      }}
                    />
                    <span className="text-sm">{member.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <Textarea
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes about the interview..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowScheduleForm(false);
                setScheduleForm({
                  studentId: '',
                  applicationId: '',
                  scheduledAt: '',
                  meetingLink: '',
                  notes: '',
                  boardMemberIds: []
                });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => scheduleInterview(executeRecaptcha)}
              disabled={loading}
            >
              {loading ? "Scheduling..." : "Schedule Interview"}
            </Button>
          </div>
              </div>
            )}
          </RecaptchaProtection>
        </Card>
      )}

      {/* Interviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Scheduled Interviews</h3>
        
        {loading && interviews.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Loading interviews...
          </div>
        )}

        {!loading && interviews.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No interviews scheduled yet. Schedule your first interview above.
          </div>
        )}

        {interviews.map((interview) => (
          <Card key={interview.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {interview.student?.name || 'Unknown Student'}
                  </h4>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getStatusIcon(interview.status)}
                    {interview.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Application: #{interview.application?.id?.slice(-8)} • {interview.application?.status}
                </p>
                <p className="text-sm text-gray-600">
                  Scheduled: {new Date(interview.scheduledAt).toLocaleString()}
                </p>
                {interview.meetingLink && (
                  <p className="text-sm text-blue-600">
                    <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer">
                      Join Meeting
                    </a>
                  </p>
                )}
                {interview.notes && (
                  <p className="text-sm text-gray-500 mt-1">{interview.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedInterview(
                    selectedInterview?.id === interview.id ? null : interview
                  )}
                >
                  {selectedInterview?.id === interview.id ? "Hide Details" : "View Details"}
                </Button>
                
                {interview.status === 'SCHEDULED' && (
                  <Button
                    size="sm"
                    onClick={() => setShowDecisionForm(interview.id)}
                  >
                    Record Decision
                  </Button>
                )}
              </div>
            </div>

            {/* Interview Panel */}
            {interview.panelMembers && interview.panelMembers.length > 0 && (
              <div className="mb-3">
                <h5 className="text-sm font-medium text-gray-700 mb-1">Interview Panel:</h5>
                <div className="flex flex-wrap gap-2">
                  {interview.panelMembers.map((panelMember) => (
                    <Badge key={panelMember.boardMember.name} variant="secondary">
                      {panelMember.boardMember.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Expanded Details */}
            {selectedInterview?.id === interview.id && (
              <div className="border-t pt-4 mt-4">
                <h5 className="font-medium text-gray-900 mb-3">Interview Decisions</h5>
                
                {interview.decisions && interview.decisions.length > 0 ? (
                  <div className="space-y-2">
                    {interview.decisions.map((decision) => (
                      <div key={`${decision.boardMemberId}-${decision.createdAt}`} 
                           className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{decision.boardMember?.name}</p>
                          {decision.comments && (
                            <p className="text-sm text-gray-600">{decision.comments}</p>
                          )}
                        </div>
                        <Badge variant={decision.decision === 'APPROVE' ? 'default' : 
                                      decision.decision === 'REJECT' ? 'destructive' : 'secondary'}>
                          {decision.decision}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No decisions recorded yet.</p>
                )}
              </div>
            )}

            {/* Decision Form */}
            {showDecisionForm === interview.id && (
              <div className="border-t pt-4 mt-4 bg-gray-50 p-4 rounded">
                <h5 className="font-medium text-gray-900 mb-3">Record Decision</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Board Member
                    </label>
                    <Select
                      value={decisionForm.boardMemberId}
                      onValueChange={(value) => setDecisionForm(prev => ({ ...prev, boardMemberId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select board member" />
                      </SelectTrigger>
                      <SelectContent>
                        {interview.panelMembers?.map((panelMember) => (
                          <SelectItem key={panelMember.boardMember.id} value={panelMember.boardMember.id}>
                            {panelMember.boardMember.name}
                          </SelectItem>
                        )) || []}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Decision
                    </label>
                    <Select
                      value={decisionForm.decision}
                      onValueChange={(value) => setDecisionForm(prev => ({ ...prev, decision: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select decision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="APPROVE">Approve</SelectItem>
                        <SelectItem value="REJECT">Reject</SelectItem>
                        <SelectItem value="ABSTAIN">Abstain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comments (Optional)
                    </label>
                    <Textarea
                      value={decisionForm.comments}
                      onChange={(e) => setDecisionForm(prev => ({ ...prev, comments: e.target.value }))}
                      placeholder="Any comments about the decision..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowDecisionForm(null);
                      setDecisionForm({ boardMemberId: '', decision: '', comments: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => recordDecision(interview.id)}
                    disabled={loading}
                  >
                    {loading ? "Recording..." : "Record Decision"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}