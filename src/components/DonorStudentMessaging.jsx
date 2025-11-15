// src/components/DonorStudentMessaging.jsx
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, User, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import RecaptchaProtection from "@/components/RecaptchaProtection";

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
  const [hasSponsorship, setHasSponsorship] = useState(false);
  const [checkingSponsorship, setCheckingSponsorship] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if current donor has sponsored this student
  useEffect(() => {
    const checkSponsorshipStatus = async () => {
      if (!user || !student || !token || user.role !== 'DONOR') {
        setCheckingSponsorship(false);
        return;
      }

      try {
        console.log('🔍 DonorStudentMessaging: Checking sponsorship status for donor:', user.id, 'student:', student.id);
        
        // Check if this donor has sponsored this specific student
        const response = await fetch(`${API}/api/sponsorships/check?studentId=${student.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('🔍 DonorStudentMessaging: Sponsorship check result:', data);
          setHasSponsorship(data.hasSponsorship === true);
        } else {
          console.warn('🔍 DonorStudentMessaging: Sponsorship check failed, defaulting to false');
          setHasSponsorship(false);
        }
      } catch (error) {
        console.error('🔍 DonorStudentMessaging: Error checking sponsorship:', error);
        setHasSponsorship(false);
      } finally {
        setCheckingSponsorship(false);
      }
    };

    checkSponsorshipStatus();
  }, [user, student, token]);

  // Check for existing conversation (only after sponsorship is confirmed)
  useEffect(() => {
    const checkExistingConversation = async () => {
      // Only proceed if user has sponsored the student
      if (!hasSponsorship || checkingSponsorship) {
        return;
      }

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

    if (user && student && token && hasSponsorship) {
      checkExistingConversation();
    }
  }, [user, student, token, hasSponsorship, checkingSponsorship]);

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

  const startConversation = async (executeRecaptcha) => {
    if (!newMessage.trim()) {
      toast.error("Please enter a message to start the conversation");
      return;
    }

    try {
      setSending(true);
      
      // Generate reCAPTCHA token
      const recaptchaToken = executeRecaptcha ? await executeRecaptcha('startConversation') : null;
      
      const response = await fetch(`${API}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: student.id,
          type: 'DONOR_STUDENT',
          initialMessage: newMessage.trim(),
          recaptchaToken
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

  const sendMessage = async (executeRecaptcha) => {
    if (!newMessage.trim() || !conversation) return;

    try {
      setSending(true);
      
      // Generate reCAPTCHA token
      const recaptchaToken = executeRecaptcha ? await executeRecaptcha('sendMessage') : null;
      
      const response = await fetch(`${API}/api/conversations/${conversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: newMessage.trim(),
          recaptchaToken
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

  const handleKeyPress = (executeRecaptcha) => (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (conversation) {
        sendMessage(executeRecaptcha);
      } else {
        startConversation(executeRecaptcha);
      }
    }
  };

  // Only show for donors
  if (user?.role !== 'DONOR') return null;

  // Show loading state while checking sponsorship
  if (checkingSponsorship) {
    return (
      <Card className="p-6">
        <SectionTitle 
          icon={MessageCircle} 
          title="Student Communication" 
          subtitle="Checking access..."
        />
        <div className="mt-4 p-4 text-center text-slate-500">
          <div className="animate-pulse">Checking communication access...</div>
        </div>
      </Card>
    );
  }

  // Show message for non-sponsors
  if (!hasSponsorship) {
    return (
      <Card className="p-6">
        <SectionTitle 
          icon={MessageCircle} 
          title="Student Communication" 
          subtitle="Available after sponsorship"
        />
        <div className="mt-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <h3 className="font-medium text-amber-900 mb-2">Communication Available After Sponsorship</h3>
            <p className="text-sm text-amber-700 mb-3">
              Direct messaging with {student.name} will be available once you complete their sponsorship. This ensures meaningful connections between committed sponsors and students.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <MessageCircle className="h-4 w-4" />
              <span>For questions before sponsoring, please contact our admin team</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <SectionTitle 
        icon={MessageCircle} 
        title="Communicate with Student" 
        subtitle="Stay connected with your sponsored student"
      />

      <div className="mt-4">
        <RecaptchaProtection>
          {({ executeRecaptcha }) => (
            <>
              {!showConversation ? (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-900 mb-2">Stay Connected with {student.name}</h3>
                    <p className="text-sm text-green-700 mb-3">
                      As {student.name}'s sponsor, you can communicate directly to track their progress, offer encouragement, and build a meaningful mentorship relationship.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <MessageCircle className="h-4 w-4" />
                      <span>Your messages are private between you and {student.name}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Your message to {student.name}
                    </label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress(executeRecaptcha)}
                      placeholder={`Hi ${student.name}, I hope your studies are going well! I wanted to check in and see how...`}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                      rows={4}
                      disabled={sending}
                    />
                    <Button 
                      onClick={() => startConversation(executeRecaptcha)}
                      disabled={!newMessage.trim() || sending}
                      className="w-full"
                    >
                      {sending ? "Starting conversation..." : "Send Message to Student"}
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
                          onKeyPress={handleKeyPress(executeRecaptcha)}
                          placeholder="Type your message..."
                          disabled={sending}
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => sendMessage(executeRecaptcha)}
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
            </>
          )}
        </RecaptchaProtection>
      </div>
    </Card>
  );
};

export default DonorStudentMessaging;