import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, MessageSquare, User, Calendar } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { API } from "@/lib/api";

export default function AdminMessageThread() {
  const { messageId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!token || !messageId) return;
    
    async function loadConversation() {
      try {
        setLoading(true);
        
        // For now, we'll implement this API endpoint
        // GET /api/conversations/:conversationId or /api/messages/:messageId/thread
        const res = await fetch(`${API.baseURL}/api/messages/${messageId}/thread`, { headers: authHeader });
        if (res.ok) {
          const data = await res.json();
          setConversation(data.conversation);
          setMessages(data.messages || []);
        } else {
          toast.error("Failed to load conversation");
          navigate("/admin");
        }
        
      } catch (error) {
        console.error("Failed to load conversation:", error);
        toast.error("Failed to load conversation");
        navigate("/admin");
      } finally {
        setLoading(false);
      }
    }
    
    loadConversation();
  }, [messageId, token, navigate]);

  const handleSendReply = async () => {
    if (!replyText.trim() || sending) return;

    try {
      setSending(true);
      
      // Send reply via API
      const res = await fetch(`${API.baseURL}/api/messages/${messageId}/reply`, {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: replyText,
          senderRole: 'ADMIN'
        })
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages(prev => [...prev, newMessage]);
        setReplyText("");
        toast.success("Reply sent successfully");
      } else {
        toast.error("Failed to send reply");
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-8">
        <div className="text-center">Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin?tab=communications")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Message Thread</h1>
        {conversation && (
          <Badge variant="outline">
            {conversation.participantRole === 'student' ? 'Student' :
             conversation.participantRole === 'donor' ? 'Donor' :
             conversation.participantRole === 'sub_admin' ? 'Case Worker' :
             'Unknown'}
          </Badge>
        )}
      </div>

      {/* Conversation Info */}
      {conversation && (
        <Card className="p-4 bg-slate-50">
          <div className="flex items-center gap-4">
            <User className="h-5 w-5 text-slate-500" />
            <div>
              <h3 className="font-medium">{conversation.participantName || 'Unknown'}</h3>
              <p className="text-sm text-slate-600">
                {conversation.studentName && `Student: ${conversation.studentName}`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Messages Thread */}
      <div className="space-y-4">
        {messages.map((message, index) => (
          <Card key={message.id || index} className={`p-4 ${
            message.senderRole === 'ADMIN' 
              ? 'bg-blue-50 border-l-4 border-l-blue-500 ml-8' 
              : 'bg-gray-50 border-l-4 border-l-gray-500 mr-8'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant={message.senderRole === 'ADMIN' ? 'default' : 'secondary'}>
                  {message.senderRole === 'ADMIN' ? 'Admin' : 
                   message.senderRole === 'STUDENT' ? 'Student' :
                   message.senderRole === 'DONOR' ? 'Donor' :
                   message.senderRole === 'SUB_ADMIN' ? 'Case Worker' :
                   message.senderRole}
                </Badge>
                <span className="text-sm font-medium">
                  {message.sender?.name || message.senderName || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Calendar className="h-3 w-3" />
                {new Date(message.createdAt).toLocaleString()}
              </div>
            </div>
            <p className="text-slate-700 whitespace-pre-wrap">{message.text}</p>
          </Card>
        ))}
      </div>

      {/* Reply Box */}
      <Card className="p-4">
        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Send Reply
          </h3>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply here..."
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSendReply}
              disabled={!replyText.trim() || sending}
              className="rounded-2xl"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Reply'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}