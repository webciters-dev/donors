import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  MessageSquare, 
  MessageCircle,
  Calendar, 
  Award, 
  TrendingUp,
  BookOpen,
  Target,
  Clock,
  CheckCircle,
  Heart
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { API } from '../lib/api';
import { fmtAmount, fmtAmountDual } from '../lib/currency';
import StudentPhoto from '../components/StudentPhoto';

const ActiveStudentDashboard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;
  
  const [application, setApplication] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.studentPhase === 'ACTIVE') {
      fetchActiveStudentData();
    }
  }, [user]);

  const fetchActiveStudentData = async () => {
    if (!authHeader) {
      console.error(' No auth header available');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      // Fetch student applications (they can only see their own)
      const appRes = await fetch(`${API.baseURL}/api/applications`, {
        headers: authHeader
      });
      
      if (!appRes.ok) {
        throw new Error(`Failed to fetch applications: ${appRes.status}`);
      }
      
      const appData = await appRes.json();
      
      // Find the approved application (should be the active one)
      const approvedApp = appData.applications?.find(app => app.status === 'APPROVED');
      
      if (!approvedApp) {
        console.error('No approved application found for active student');
        toast.error('No approved application found');
        setApplication(null);
        return;
      }
      
      setApplication(approvedApp);
      
      // Fetch messages using the same API as MyApplication
      await loadMessages(approvedApp.id);
      
    } catch (error) {
      console.error('Error fetching active student data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (applicationId) => {
    if (!applicationId) return;
    
    try {
      // Try conversation API first
      const convRes = await fetch(`${API.baseURL}/api/conversations?applicationId=${applicationId}`, {
        headers: authHeader
      });
      
      if (convRes.ok) {
        const convData = await convRes.json();
        setMessages(convData.messages || []);
      } else {
        // Fallback to old message API
        const msgRes = await fetch(`${API.baseURL}/api/messages?applicationId=${applicationId}`, {
          headers: authHeader
        });
        
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData.messages || []);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    
    try {
      setSendingReply(true);
      
      // Try conversation API first
      let success = false;
      
      if (application?.conversations?.length > 0) {
        const conversationId = application.conversations[0].id;
        
        const convRes = await fetch(`${API.baseURL}/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...authHeader 
          },
          body: JSON.stringify({ content: replyText })
        });
        
        if (convRes.ok) {
          success = true;
        }
      }
      
      // Fallback to old message API
      if (!success) {
        const msgRes = await fetch(`${API.baseURL}/api/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader
          },
          body: JSON.stringify({ 
            applicationId: application.id,
            content: replyText 
          })
        });
        
        if (msgRes.ok) {
          success = true;
        }
      }
      
      if (success) {
        setReplyText('');
        toast.success('Reply sent successfully');
        await loadMessages(application.id);
      } else {
        toast.error('Failed to send reply');
      }
      
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Application Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load your application data.</p>
          <Button onClick={() => navigate('/my-application')}>
            Go to My Application
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      
      {/* Welcome Header */}
      <Card className="p-4 sm:p-6 bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-l-green-500 hover:shadow-lg transition-shadow duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <StudentPhoto 
              student={application?.student || user} 
              size="large" 
              clickable={true}
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                Welcome Back, {user?.name}! 
              </h1>
              <p className="text-sm sm:text-base text-gray-700 mt-1 leading-relaxed">
                {application.program} at {application.university} • <strong>APPROVED</strong>
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="default" className="bg-green-600 text-white">
                  <Award className="w-4 h-4 mr-1" />
                  Active Student
                </Badge>
                <Badge variant="outline" className="border-green-300 text-green-700">
                  <Heart className="w-4 h-4 mr-1" />
                  Amount: {fmtAmountDual(application.amount, application.currency)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Communication Interface */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-gray-900 text-base sm:text-lg">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            Messages from Your Support Team
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          
          {/* Messages List */}
          <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto mb-4">
            {messages.length > 0 ? (
              messages.slice().reverse().map((msg, idx) => (
                <div key={idx} className={`p-3 sm:p-4 rounded-lg ${
                  msg.isFromStudent ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-gray-50 border-l-4 border-l-green-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-xs sm:text-sm text-gray-600 mb-2">
                        <strong>{msg.isFromStudent ? 'You' : (msg.senderName || 'Admin')}</strong>
                        {!msg.isFromStudent && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {msg.isOfficial ? 'Official' : 'Message'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm sm:text-base text-gray-800">{msg.content || msg.message}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(msg.createdAt || msg.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm sm:text-base">No messages yet. Your communication history will appear here.</p>
              </div>
            )}
          </div>
          
          {/* Reply Box */}
          <div className="border-t pt-4">
              <div className="space-y-3">
                <Textarea
                  placeholder="Send a message to your donor or support team..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  className="resize-none border-gray-200 focus:border-green-500 focus:ring-green-500 min-h-[44px]"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={sendReply}
                    disabled={!replyText.trim() || sendingReply}
                    className="bg-green-600 hover:bg-green-700 min-h-[44px] w-full sm:w-auto"
                  >
                    {sendingReply ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </div>
          </div>
          
        </CardContent>
      </Card>

      {/* Success Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-l-green-500 hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center text-green-800 text-base sm:text-lg">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
             Active Student Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-green-700">
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="font-medium mr-2"></span>
                <span>Keep your donor updated on your academic progress</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium mr-2"></span>
                <span>Communicate regularly and proactively</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="font-medium mr-2"></span>
                <span>Share both challenges and achievements</span>
              </div>
              <div className="flex items-start">
                <span className="font-medium mr-2"></span>
                <span>Express gratitude for the support you receive</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default ActiveStudentDashboard;