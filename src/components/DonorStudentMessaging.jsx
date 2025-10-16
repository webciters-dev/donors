// src/components/DonorStudentMessaging.jsx
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, User, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="h-5 w-5 text-emerald-600" aria-hidden />}
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
  </div>
);

const MessageBubble = ({ message, isCurrentUser }) => {
  const formatTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
        <div className={`p-3 rounded-lg ${
          isCurrentUser 
            ? 'bg-emerald-600 text-white' 
            : 'bg-slate-100 text-slate-900'
        }`}>
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>
        <div className={`flex items-center gap-2 mt-1 text-xs text-slate-500 ${
          isCurrentUser ? 'justify-end' : 'justify-start'
        }`}>
          <User className="h-3 w-3" />
          <span>{message.sender.name}</span>
          <Clock className="h-3 w-3" />
          <span>{formatTime(message.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

const DonorStudentMessaging = ({ student, user, token }) => {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for existing conversation
  useEffect(() => {
    const checkExistingConversation = async () => {
      try {
        const response = await fetch(`${API}/api/conversations`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const existingConv = data.conversations.find(conv => 
            conv.studentId === student.id && conv.type === 'DONOR_STUDENT'
          );
          
          if (existingConv) {
            setConversation(existingConv);
            loadConversationMessages(existingConv.id);
          }
        }
      } catch (error) {
        console.error("Error checking existing conversation:", error);
      }
    };

    if (user && student && token) {
      checkExistingConversation();
    }
  }, [user, student, token]);

  const loadConversationMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/api/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const messages = data.conversation.messages || [];
        // Sort messages newest first for better UX
        messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setMessages(messages);
        setShowConversation(true);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async () => {
    if (!newMessage.trim()) {
      toast.error("Please enter a message to start the conversation");
      return;
    }

    try {
      setSending(true);
      const response = await fetch(`${API}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: student.id,
          type: 'DONOR_STUDENT',
          initialMessage: newMessage.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversation(data.conversation);
        const messages = data.conversation.messages || [];
        // Sort messages newest first for better UX
        messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setMessages(messages);
        setNewMessage("");
        setShowConversation(true);
        toast.success("Conversation started! The student will be notified.");
      } else {
        const error = await response.json();
        if (error.conversationId) {
          // Conversation already exists, load it
          await loadConversationMessages(error.conversationId);
          toast.info("Loading your existing conversation with this student");
        } else {
          throw new Error(error.error || "Failed to start conversation");
        }
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error(error.message || "Failed to start conversation");
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    try {
      setSending(true);
      const response = await fetch(`${API}/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: newMessage.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [data.message, ...prev]); // Add new message at beginning (newest first)
        setNewMessage("");
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (conversation) {
        sendMessage();
      } else {
        startConversation();
      }
    }
  };

  // Only show for donors who haven't sponsored this student yet
  if (user?.role !== 'DONOR') return null;

  return (
    <Card className="p-6">
      <SectionTitle 
        icon={MessageCircle} 
        title="Ask Questions" 
        subtitle="Connect with the student before sponsoring"
      />

      <div className="mt-4">
        {!showConversation ? (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Connect with {student.name}</h3>
              <p className="text-sm text-blue-700 mb-3">
                Have questions about their background, goals, or needs? Start a conversation to learn more before making your sponsorship decision.
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <MessageCircle className="h-4 w-4" />
                <span>Your messages will be private between you and the student</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Your message to {student.name}
              </label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Hi ${student.name}, I'm interested in potentially sponsoring your education. I'd like to know more about...`}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                rows={4}
                disabled={sending}
              />
              <Button 
                onClick={startConversation}
                disabled={!newMessage.trim() || sending}
                className="w-full"
              >
                {sending ? "Starting conversation..." : "Start Conversation"}
                <Send className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-emerald-600">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Active Conversation
                </Badge>
                <span className="text-sm text-slate-500">with {student.name}</span>
              </div>
            </div>

            {/* Messages Container */}
            <div className="border rounded-lg bg-white">
              <div className="max-h-96 overflow-y-auto p-4">
                {loading ? (
                  <div className="text-center py-8 text-slate-500">
                    Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No messages yet
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isCurrentUser={message.sender.id === user.id}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                  >
                    {sending ? "..." : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DonorStudentMessaging;