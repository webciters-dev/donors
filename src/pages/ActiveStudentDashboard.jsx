import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { 
  Upload, 
  FileText, 
  MessageSquare, 
  Calendar, 
  Award, 
  TrendingUp,
  BookOpen,
  Target,
  Clock
} from 'lucide-react';

const ActiveStudentDashboard = () => {
  const [student, setStudent] = useState(null);
  const [progressReports, setProgressReports] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [newReport, setNewReport] = useState({ title: '', content: '', files: [] });
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveStudentData();
  }, []);

  const fetchActiveStudentData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch current student profile
      const profileRes = await fetch('/api/student/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      
      if (profileData.studentPhase !== 'ACTIVE') {
        // Redirect if not in ACTIVE phase
        window.location.href = '/student';
        return;
      }
      
      setStudent(profileData);
      
      // Fetch progress reports
      const reportsRes = await fetch('/api/student/progress-reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setProgressReports(reportsData);
      }
      
      // Fetch communications
      const commRes = await fetch('/api/student/communications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (commRes.ok) {
        const commData = await commRes.json();
        setCommunications(commData);
      }
      
    } catch (error) {
      console.error('Error fetching active student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setNewReport(prev => ({ ...prev, files: [...prev.files, ...files] }));
  };

  const submitProgressReport = async () => {
    if (!newReport.title.trim() || !newReport.content.trim()) return;
    
    try {
      const formData = new FormData();
      formData.append('title', newReport.title);
      formData.append('content', newReport.content);
      newReport.files.forEach(file => formData.append('files', file));
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student/progress-reports', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (response.ok) {
        setNewReport({ title: '', content: '', files: [] });
        fetchActiveStudentData(); // Refresh data
      }
    } catch (error) {
      console.error('Error submitting progress report:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/student/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: newMessage })
      });
      
      setNewMessage('');
      fetchActiveStudentData(); // Refresh data
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your active student dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome Back, {student?.name}! 🎓
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Your Active Student Journey at {student?.university}
              </p>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-800 px-4 py-2">
              <Award className="w-4 h-4 mr-2" />
              ACTIVE STUDENT
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Program</p>
                  <p className="text-lg font-semibold">{student?.program}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Reports</p>
                  <p className="text-lg font-semibold">{progressReports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Messages</p>
                  <p className="text-lg font-semibold">{communications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Progress</p>
                  <p className="text-lg font-semibold">Excellent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Progress Reports Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Submit Progress Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Report title (e.g., Semester 1 Update)"
                  value={newReport.title}
                  onChange={(e) => setNewReport(prev => ({ ...prev, title: e.target.value }))}
                />
                
                <Textarea
                  placeholder="Share your academic progress, achievements, challenges, and goals..."
                  rows={4}
                  value={newReport.content}
                  onChange={(e) => setNewReport(prev => ({ ...prev, content: e.target.value }))}
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Attach Files (transcripts, certificates, etc.)</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      onChange={handleFileUpload}
                      className="flex-1"
                    />
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  {newReport.files.length > 0 && (
                    <div className="text-sm text-gray-600">
                      {newReport.files.length} file(s) selected
                    </div>
                  )}
                </div>
                
                <Button onClick={submitProgressReport} className="w-full">
                  Submit Progress Report
                </Button>
              </CardContent>
            </Card>

            {/* Recent Progress Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Your Progress Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progressReports.length > 0 ? (
                  <div className="space-y-4">
                    {progressReports.slice(0, 3).map((report, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <h4 className="font-medium">{report.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{report.content.substring(0, 100)}...</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                          <Badge variant="outline" size="sm">Submitted</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No progress reports yet. Submit your first one above!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Communications Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Quick Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Send a message to your donor or admin team..."
                  rows={3}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button onClick={sendMessage} className="w-full">
                  Send Message
                </Button>
              </CardContent>
            </Card>

            {/* Recent Communications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Recent Communications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {communications.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {communications.map((comm, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm">{comm.message}</p>
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <span>{comm.senderType}: {comm.senderName}</span>
                              <span className="mx-2">•</span>
                              <span>{new Date(comm.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No messages yet. Start a conversation above!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Student Success Tips */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <Award className="w-5 h-5 mr-2" />
                  Success Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-start">
                    <span className="font-medium mr-2">📚</span>
                    Submit progress reports regularly to keep donors updated
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">🎯</span>
                    Set clear academic goals and track your progress
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">💬</span>
                    Communicate proactively with your support team
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">🏆</span>
                    Celebrate your achievements, big and small!
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveStudentDashboard;