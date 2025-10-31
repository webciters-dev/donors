// src/pages/SubAdminApplicationDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { 
  ArrowLeft, FileText, User, GraduationCap, MessageSquare, Home, 
  Shield, CheckCircle, XCircle, AlertTriangle, Calendar, Camera,
  MapPin, DollarSign, BookOpen, Users, ClipboardCheck 
} from "lucide-react";
import { API } from "@/lib/api";
import { fmtAmount } from "@/lib/currency";

export default function SubAdminApplicationDetail() {
  const { reviewId } = useParams(); // field review id
  const navigate = useNavigate();
  const { token } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const [review, setReview] = useState(null);
  const [application, setApplication] = useState(null);
  const [student, setStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [customDocumentName, setCustomDocumentName] = useState("");

  // Helper function to check if document is newly uploaded
  const isDocumentNew = (uploadedAt, documentType) => {
    if (!uploadedAt) return false;
    
    try {
      const uploadDate = new Date(uploadedAt);
      const now = new Date();
      
      // Check if the date is valid
      if (isNaN(uploadDate.getTime())) {
        return false;
      }
      
      const hoursAgo = (now - uploadDate) / (1000 * 60 * 60);
      
      // Only consider documents as "new" if uploaded within last 2 hours
      // This prevents old documents from showing as new
      const isRecent = hoursAgo <= 2;
      
      // Also check if it's uploaded today
      const uploadDay = uploadDate.toDateString();
      const today = now.toDateString();
      const isToday = uploadDay === today;
      
      // Document is "new" only if uploaded within last 2 hours AND today
      return isRecent && isToday;
    } catch (error) {
      console.error('Error checking document age:', error);
      return false;
    }
  };

  // Helper function to check if message is about document upload
  const isDocumentUploadMessage = (messageText) => {
    const documentKeywords = [
      'document', 'uploaded', 'file', 'certificate', 'transcript', 
      'invoice', 'CNIC', 'photo', 'utility', 'income', 'fee'
    ];
    const text = messageText.toLowerCase();
    return documentKeywords.some(keyword => text.includes(keyword)) && 
           (text.includes('uploaded') || text.includes('document'));
  };

  // Helper function to check if message is recent (within last 24 hours)
  const isMessageRecent = (createdAt) => {
    if (!createdAt) return false;
    const messageDate = new Date(createdAt);
    const now = new Date();
    const hoursAgo = (now - messageDate) / (1000 * 60 * 60);
    return hoursAgo <= 24; // Consider "recent" if created within last 24 hours
  };

  // Field verification form state
  const [fieldVerification, setFieldVerification] = useState({
    homeVisitDate: "",
    homeVisitNotes: "",
    familyInterviewNotes: "",
    financialVerificationNotes: "",
    characterAssessment: "",
    deservingnessFactor: 5,
    documentsVerified: false,
    identityVerified: false,
    familyIncomeVerified: false,
    educationVerified: false,
    recommendationReason: "",
    additionalDocumentsRequested: [],
    riskFactors: [],
    verificationScore: 50,
    fielderRecommendation: "",
    adminNotesRequired: "",
    notes: "",
    recommendation: ""
  });

  useEffect(() => {
    async function loadReviewDetails() {
      try {
        setLoading(true);
        
        // Get the specific review with full details
        const reviewRes = await fetch(`${API.baseURL}/api/field-reviews`, { headers: authHeader });
        if (!reviewRes.ok) throw new Error("Failed to load reviews");
        
        const reviewData = await reviewRes.json();
        const currentReview = reviewData.reviews.find(r => r.id === reviewId);
        
        if (!currentReview) {
          toast.error("Review not found");
          navigate(-1);
          return;
        }

        setReview(currentReview);
        setApplication(currentReview.application);
        setStudent(currentReview.application.student);

        // Populate field verification form with existing data
        setFieldVerification({
          homeVisitDate: currentReview.homeVisitDate ? new Date(currentReview.homeVisitDate).toISOString().split('T')[0] : "",
          homeVisitNotes: currentReview.homeVisitNotes || "",
          familyInterviewNotes: currentReview.familyInterviewNotes || "",
          financialVerificationNotes: currentReview.financialVerificationNotes || "",
          characterAssessment: currentReview.characterAssessment || "",
          deservingnessFactor: currentReview.deservingnessFactor || 5,
          documentsVerified: currentReview.documentsVerified || false,
          identityVerified: currentReview.identityVerified || false,
          familyIncomeVerified: currentReview.familyIncomeVerified || false,
          educationVerified: currentReview.educationVerified || false,
          recommendationReason: currentReview.recommendationReason || "",
          additionalDocumentsRequested: currentReview.additionalDocumentsRequested || [],
          riskFactors: currentReview.riskFactors || [],
          verificationScore: currentReview.verificationScore || 50,
          fielderRecommendation: currentReview.fielderRecommendation || "",
          adminNotesRequired: currentReview.adminNotesRequired || "",
          notes: currentReview.notes || "",
          recommendation: currentReview.recommendation || ""
        });

        // Set submitted state based on review status
        setSubmitted(currentReview.status === "COMPLETED");

        // Load both old messages and donor-student conversations
        let allMessages = [];
        
        // Load old admin-student messages
        const msgRes = await fetch(`${API.baseURL}/api/messages?studentId=${currentReview.studentId}&applicationId=${currentReview.applicationId}`, {
          headers: authHeader
        });
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          allMessages = msgData.messages || [];
        }
        
        // Load donor-student conversations for sub-admin oversight
        try {

          const convRes = await fetch(`${API.baseURL}/api/conversations?includeAllMessages=true`, {
            headers: authHeader
          });
          
          if (convRes.ok) {
            const convData = await convRes.json();
            const conversations = convData.conversations || [];
            
            // Filter conversations for this specific student
            const studentConversations = conversations.filter(conv => 
              conv.studentId === currentReview.studentId && conv.type === 'DONOR_STUDENT'
            );
            

            
            // Extract messages from donor-student conversations
            studentConversations.forEach(conv => {
              if (conv.messages) {
                conv.messages.forEach(msg => {
                  allMessages.push({
                    id: msg.id,
                    text: msg.text,
                    fromRole: msg.senderRole.toLowerCase(),
                    createdAt: msg.createdAt,
                    senderName: msg.sender?.name || 'Unknown',
                    conversationType: 'DONOR_STUDENT'
                  });
                });
              }
            });
          }
        } catch (convError) {
          console.error('🔍 SubAdminApplicationDetail: Failed to load conversations:', convError);
        }
        
        // Sort all messages newest first for better UX
        allMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setMessages(allMessages);

        // Load documents
        const docRes = await fetch(`${API.baseURL}/api/uploads?studentId=${currentReview.studentId}&applicationId=${currentReview.applicationId}`, {
          headers: authHeader
        });
        if (docRes.ok) {
          const docData = await docRes.json();
          setDocuments(docData.documents || []);
        }

      } catch (error) {
        console.error("Failed to load review details:", error);
        toast.error("Failed to load application details");
      } finally {
        setLoading(false);
      }
    }

    if (reviewId) {
      loadReviewDetails();
    }
  }, [reviewId, token]);

  // Cleanup navigation timeout on unmount
  useEffect(() => {
    return () => {
      if (window.awakeNavigationTimeout) {
        clearTimeout(window.awakeNavigationTimeout);
        delete window.awakeNavigationTimeout;
      }
    };
  }, []);

  // Watch for review status changes to update submitted state
  useEffect(() => {
    if (review) {
      setSubmitted(review.status === "COMPLETED");
    }
  }, [review?.status]);

  async function saveFieldVerification(isSubmitting = false) {
    try {
      setSaving(true);
      
      const status = isSubmitting ? "COMPLETED" : "IN_PROGRESS";
      
      const res = await fetch(`${API.baseURL}/api/field-reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ 
          status,
          ...fieldVerification,
          homeVisitDate: fieldVerification.homeVisitDate ? new Date(fieldVerification.homeVisitDate).toISOString() : null,
          updatedAt: new Date().toISOString()
        })
      });
      
      if (!res.ok) throw new Error("Failed to save field verification");
      
      if (isSubmitting) {

        setSubmitted(true);
        
        // Create summary of verification completed
        const summary = [
          fieldVerification.homeVisitDate ? "✅ Home Visit" : "",
          fieldVerification.identityVerified ? "✅ Identity Verified" : "",
          fieldVerification.documentsVerified ? "✅ Documents Verified" : "",
          fieldVerification.fielderRecommendation ? `✅ Recommended: ${fieldVerification.fielderRecommendation.replace('_', ' ')}` : "",
          fieldVerification.verificationScore ? `📊 Score: ${fieldVerification.verificationScore}%` : ""
        ].filter(Boolean).join(" • ");

        toast.success(`Field verification submitted! ${summary}`, {
          description: "Click 'Return to Dashboard' or wait for auto-redirect...",
          duration: 4000
        });
        

        
        // Navigate back to dashboard - make it more reliable  
        const timeoutId = setTimeout(() => {

          try {
            navigate("/sub-admin", { replace: true });

          } catch (navError) {
            console.error("❌ Navigation failed:", navError);
            // Fallback - use window location if navigate fails
            window.location.href = window.location.origin + window.location.pathname + "#/sub-admin";
          }
        }, 3000);
        
        // Also store timeout ID in case component unmounts
        window.awakeNavigationTimeout = timeoutId;
        
      } else {
        toast.success("Field verification saved as draft");
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save field verification");
    } finally {
      setSaving(false);
    }
  }

  // Request missing documents from student
  async function requestMissingDocuments() {
    try {
      setSaving(true);
      
      // Get checked additional documents
      const checkedDocs = fieldVerification.additionalDocumentsRequested || [];
      if (checkedDocs.length === 0) {
        toast.error("Please select at least one additional document to request");
        return;
      }

      // Validate "Other" document has custom name
      if (checkedDocs.includes('Other') && !customDocumentName.trim()) {
        toast.error("Please specify what document is required for 'Other'");
        return;
      }

      // Handle "Other" document - replace with custom name
      const docNames = checkedDocs.map(doc => {
        if (doc === 'Other') {
          return customDocumentName.trim();
        }
        return doc;
      });

      const res = await fetch(`${API.baseURL}/api/field-reviews/${reviewId}/request-missing`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ 
          items: docNames,
          note: "These documents are required to complete your field verification process."
        })
      });
      
      if (!res.ok) throw new Error("Failed to request missing documents");
      
      toast.success(`Document request sent to student: ${docNames.join(', ')}`);
      
    } catch (error) {
      console.error("Request missing docs failed:", error);
      toast.error("Failed to send document request");
    } finally {
      setSaving(false);
    }
  }

  function updateField(field, value) {
    setFieldVerification(prev => ({
      ...prev,
      [field]: value
    }));
  }

  function toggleArrayField(field, value) {
    setFieldVerification(prev => ({
      ...prev,
      [field]: prev[field].includes(value) 
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
    
    // Clear custom document name when "Other" is unchecked
    if (field === 'additionalDocumentsRequested' && value === 'Other') {
      const isCurrentlySelected = fieldVerification[field].includes(value);
      if (isCurrentlySelected) {
        setCustomDocumentName("");
      }
    }
  }

  async function sendMessage() {
    try {
      if (!newMessage.trim()) return;
      
      const res = await fetch(`${API.baseURL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          studentId: student.id,
          applicationId: application.id,
          text: newMessage,
          fromRole: "sub_admin"
        })
      });

      if (!res.ok) throw new Error("Failed to send message");
      
      const msg = await res.json();
      setMessages(prev => [msg, ...prev]); // Add new message at the beginning
      setNewMessage("");
      toast.success("Message sent");
      
    } catch (error) {
      console.error("Send message failed:", error);
      toast.error("Failed to send message");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!review || !application || !student) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold">Application not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="min-h-[44px] self-start sm:self-auto">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-semibold">Field Verification</h1>
            <Badge variant={review.status === "PENDING" ? "secondary" : review.status === "COMPLETED" ? "default" : "outline"}>
              {review.status}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {submitted ? (
            <Button onClick={() => navigate("/sub-admin")} className="bg-green-600 hover:bg-green-700 min-h-[44px]">
              Return to Dashboard
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => saveFieldVerification(false)} disabled={saving} className="min-h-[44px]">
                {saving ? "Saving..." : "Save Draft"}
              </Button>
              <Button onClick={() => saveFieldVerification(true)} disabled={saving} className="min-h-[44px]">
                {saving ? "Submitting..." : "Submit Review"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Student Information Summary */}
      <Card className="p-4 sm:p-6 bg-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-slate-600" />
            <h2 className="text-base sm:text-lg font-semibold">{student.name}</h2>
          </div>
          <div className="text-xs sm:text-sm text-slate-600">
            {student.university} • {student.program}
          </div>
        </div>
        
        {/* Enhanced Financial Breakdown */}
        {(application?.universityFee || application?.livingExpenses || application?.totalExpense) ? (
          <div className="mb-4 p-3 sm:p-4 bg-white rounded-lg border">
            <h4 className="font-medium text-slate-700 text-xs sm:text-sm uppercase tracking-wide mb-3">Financial Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="space-y-2">
                {application?.universityFee && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">University Fee</span>
                    <span className="font-medium">+{application.currency === "PKR" ? `₨${application.universityFee.toLocaleString()}` : `$${application.universityFee.toLocaleString()}`}</span>
                  </div>
                )}
                {application?.livingExpenses && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Books & Living</span>
                    <span className="font-medium">+{application.currency === "PKR" ? `₨${application.livingExpenses.toLocaleString()}` : `$${application.livingExpenses.toLocaleString()}`}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {application?.totalExpense && (
                  <div className="flex justify-between">
                    <span className="text-slate-700 font-medium">Total Expense</span>
                    <span className="font-semibold">{application.currency === "PKR" ? `₨${application.totalExpense.toLocaleString()}` : `$${application.totalExpense.toLocaleString()}`}</span>
                  </div>
                )}
                {application?.scholarshipAmount && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Scholarship</span>
                    <span className="font-medium text-green-600">-{application.currency === "PKR" ? `₨${application.scholarshipAmount.toLocaleString()}` : `$${application.scholarshipAmount.toLocaleString()}`}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-slate-700 font-semibold">Amount Required</span>
                  <span className="font-bold text-blue-600">
                    {application.amount && application.currency 
                      ? fmtAmount(application.amount, application.currency)
                      : 'Amount not set'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-white rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Amount Required</span>
              <span className="font-bold text-blue-600">
                {application.amount && application.currency 
                  ? fmtAmount(application.amount, application.currency)
                  : 'Amount not set'
                }
              </span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs sm:text-sm">
          <div>
            <span className="text-slate-500">CNIC:</span>
            <div className="font-medium break-words">{student.cnic || 'Not provided'}</div>
          </div>
          <div>
            <span className="text-slate-500">Phone:</span>
            <div className="font-medium break-words">{student.phone || 'Not provided'}</div>
          </div>
          <div>
            <span className="text-slate-500">Address:</span>
            <div className="font-medium break-words">{student.address || 'Not provided'}</div>
          </div>
          <div>
            <span className="text-slate-500">Guardian:</span>
            <div className="font-medium break-words">{student.guardianName || 'Not provided'}</div>
          </div>
        </div>
        
        {/* Personal Introduction */}
        {student.personalIntroduction && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <span className="text-slate-500 text-xs sm:text-sm">Personal Introduction:</span>
            <div className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-700 bg-white p-3 rounded border whitespace-pre-wrap break-words">
              {student.personalIntroduction}
            </div>
          </div>
        )}
      </Card>

      {/* Enhanced Background Details */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Detailed Background</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3 text-sm">
            {student.familySize && (
              <div className="flex justify-between">
                <span className="text-slate-500">Family Size</span>
                <span className="font-medium">{student.familySize} members</span>
              </div>
            )}
            {student.parentsOccupation && (
              <div className="flex justify-between">
                <span className="text-slate-500">Parents' Occupation</span>
                <span className="font-medium">{student.parentsOccupation}</span>
              </div>
            )}
            {student.monthlyFamilyIncome && (
              <div className="flex justify-between">
                <span className="text-slate-500">Family Income</span>
                <span className="font-medium">{student.monthlyFamilyIncome}</span>
              </div>
            )}
            {student.currentAcademicYear && (
              <div className="flex justify-between">
                <span className="text-slate-500">Academic Year</span>
                <span className="font-medium">{student.currentAcademicYear}</span>
              </div>
            )}
          </div>
          <div className="space-y-3 text-sm">
            {student.specificField && (
              <div className="flex justify-between">
                <span className="text-slate-500">Specialization</span>
                <span className="font-medium">{student.specificField}</span>
              </div>
            )}
          </div>
        </div>

        {/* Career Goals */}
        {student.careerGoals && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-700 mb-2">🎯 Career Goals & Aspirations</h4>
            <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded whitespace-pre-wrap">
              {student.careerGoals}
            </div>
          </div>
        )}

        {/* Academic Achievements */}
        {student.academicAchievements && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">🏆 Academic Achievements</h4>
            <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded whitespace-pre-wrap">
              {student.academicAchievements}
            </div>
          </div>
        )}

        {/* Community Involvement */}
        {student.communityInvolvement && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">🤝 Community Involvement</h4>
            <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded whitespace-pre-wrap">
              {student.communityInvolvement}
            </div>
          </div>
        )}
      </Card>

      {/* Home Visit & Family Assessment */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Home className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Home Visit & Family Assessment</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Home Visit Date</label>
              <Input
                type="date"
                value={fieldVerification.homeVisitDate}
                onChange={(e) => updateField('homeVisitDate', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={fieldVerification.identityVerified}
                  onChange={(e) => updateField('identityVerified', e.target.checked)}
                />
                <CheckCircle className="h-4 w-4 text-green-600" />
                Identity Verified
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Home Visit Notes</label>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm min-h-[100px]"
              placeholder="Describe the living conditions, family situation, home environment..."
              value={fieldVerification.homeVisitNotes}
              onChange={(e) => updateField('homeVisitNotes', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Family Interview Notes</label>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm min-h-[100px]"
              placeholder="Family members interviewed, their responses, impressions..."
              value={fieldVerification.familyInterviewNotes}
              onChange={(e) => updateField('familyInterviewNotes', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Financial Verification */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Financial Verification</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={fieldVerification.familyIncomeVerified}
                onChange={(e) => updateField('familyIncomeVerified', e.target.checked)}
              />
              <CheckCircle className="h-4 w-4 text-green-600" />
              Family Income Verified
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Financial Verification Notes</label>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm min-h-[100px]"
              placeholder="Income sources, expense analysis, financial need assessment..."
              value={fieldVerification.financialVerificationNotes}
              onChange={(e) => updateField('financialVerificationNotes', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Educational Background Verification */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Educational Verification</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={fieldVerification.educationVerified}
                onChange={(e) => updateField('educationVerified', e.target.checked)}
              />
              <CheckCircle className="h-4 w-4 text-green-600" />
              Education Records Verified
            </label>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded">
              <div className="font-medium text-slate-700 mb-2">Current Education</div>
              <div>Institution: {student.currentInstitution || 'Not provided'}</div>
              <div>City: {student.currentCity || 'Not provided'}</div>
              <div>Completion Year: {student.currentCompletionYear || 'Not provided'}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <div className="font-medium text-slate-700 mb-2">Future Education</div>
              <div>University: {student.university}</div>
              <div>Program: {student.program}</div>
              <div>GPA: {student.gpa || 'Not provided'}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Character Assessment */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Character & Deservingness Assessment</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Deservingness Factor (1-10): {fieldVerification.deservingnessFactor}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={fieldVerification.deservingnessFactor}
              onChange={(e) => updateField('deservingnessFactor', Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Not Deserving</span>
              <span>Highly Deserving</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Character Assessment</label>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm min-h-[100px]"
              placeholder="Student's attitude, motivation, character observations..."
              value={fieldVerification.characterAssessment}
              onChange={(e) => updateField('characterAssessment', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Document Verification */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" />
            <h3 className="text-base sm:text-lg font-semibold">Document Verification</h3>
          </div>
          <label className="flex items-center gap-2 text-xs sm:text-sm sm:ml-4">
            <input
              type="checkbox"
              checked={fieldVerification.documentsVerified}
              onChange={(e) => updateField('documentsVerified', e.target.checked)}
              className="min-w-[16px] min-h-[16px]"
            />
            <CheckCircle className="h-4 w-4 text-green-600" />
            All Documents Verified
          </label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.length === 0 ? (
            <div className="text-sm text-slate-600">No documents uploaded yet</div>
          ) : (
            documents.map((doc, idx) => {
              const isNew = doc.uploadedAt && isDocumentNew(doc.uploadedAt, doc.type);
              const newDocumentClasses = isNew 
                ? "bg-blue-50 border-blue-300 shadow-lg ring-2 ring-blue-200" 
                : "border-gray-200";
              
              return (
                <div key={idx} className={`flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-all ${newDocumentClasses}`}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {doc.url ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <a
                          href={`${API.baseURL}${doc.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-green-700 hover:text-green-900 hover:underline font-medium text-xs sm:text-sm truncate"
                        >
                          📁 {doc.originalName || doc.type.replace('_', ' ')}
                        </a>
                        {isNew && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                            ✨ New
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <span className="font-medium text-red-600 text-xs sm:text-sm truncate">{doc.type.replace('_', ' ')} - Missing</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Risk Factors & Additional Requirements */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold">Risk Assessment</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Risk Factors</label>
            <div className="grid md:grid-cols-3 gap-2">
              {['Incomplete Documents', 'Unverifiable Income', 'Poor Academic Record', 'Family Issues', 'Location Concerns', 'Other'].map(risk => (
                <label key={risk} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={fieldVerification.riskFactors.includes(risk)}
                    onChange={() => toggleArrayField('riskFactors', risk)}
                  />
                  {risk}
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Additional Documents Required</label>
            <div className="grid md:grid-cols-3 gap-2">
              {['Updated Income Certificate', 'Recent Utility Bill', 'Academic Transcripts', 'Medical Certificate', 'Character Certificate', 'Other'].map(doc => (
                <label key={doc} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={fieldVerification.additionalDocumentsRequested.includes(doc)}
                    onChange={() => toggleArrayField('additionalDocumentsRequested', doc)}
                  />
                  {doc}
                </label>
              ))}
            </div>
            
            {/* Custom Document Input for "Other" */}
            {fieldVerification.additionalDocumentsRequested.includes('Other') && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Specify Other Document Required:
                </label>
                <input
                  type="text"
                  value={customDocumentName}
                  onChange={(e) => setCustomDocumentName(e.target.value)}
                  placeholder="e.g., Bank Statement, Property Documents, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            
            {/* Send Document Request Button */}
            {fieldVerification.additionalDocumentsRequested.length > 0 && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  onClick={requestMissingDocuments}
                  disabled={saving}
                  className="text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  📧 Send Document Request to Student
                </Button>
                <p className="text-xs text-slate-500 mt-1">
                  This will notify the student via email and message about the required documents
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Final Recommendation */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Sub Admin Recommendation</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Recommendation</label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm min-h-[44px]"
                value={fieldVerification.fielderRecommendation}
                onChange={(e) => updateField('fielderRecommendation', e.target.value)}
              >
                <option value="">Select recommendation...</option>
                <option value="STRONGLY_APPROVE">Strongly Recommend Approval</option>
                <option value="APPROVE">Recommend Approval</option>
                <option value="CONDITIONAL">Conditional Approval</option>
                <option value="REJECT">Recommend Rejection</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Verification Score: {fieldVerification.verificationScore}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={fieldVerification.verificationScore}
                onChange={(e) => updateField('verificationScore', Number(e.target.value))}
                className="w-full min-h-[44px] touch-action-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Recommendation Reason</label>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm min-h-[100px]"
              placeholder="Explain your recommendation and key factors..."
              value={fieldVerification.recommendationReason}
              onChange={(e) => updateField('recommendationReason', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes for Admin Review</label>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm min-h-[80px]"
              placeholder="What should the admin pay special attention to?"
              value={fieldVerification.adminNotesRequired}
              onChange={(e) => updateField('adminNotesRequired', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Communication */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-slate-600" />
          <h2 className="text-base sm:text-lg font-semibold">Student Communication</h2>
        </div>
        
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-4 text-slate-600">No messages yet</div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {messages.map((msg, idx) => {
                const isDocumentMsg = isDocumentUploadMessage(msg.text);
                const isRecent = isMessageRecent(msg.createdAt);
                const shouldHighlight = isDocumentMsg && isRecent;
                
                const messageClasses = shouldHighlight
                  ? "p-3 rounded-lg bg-green-50 border-2 border-green-200 shadow-lg"
                  : "p-3 rounded-lg bg-slate-50";
                
                return (
                  <div key={idx} className={messageClasses}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" size="sm">
                          {msg.fromRole === 'donor' ? `💝 Donor${msg.senderName ? `: ${msg.senderName}` : ''}` :
                           msg.fromRole === 'student' && msg.conversationType === 'DONOR_STUDENT' ? '👤 Student Reply' :
                           msg.fromRole === 'student' ? '👤 Student' : 
                           msg.fromRole === 'sub_admin' ? '🏢 Sub Admin' : '👨‍💼 Admin'}
                        </Badge>
                        {(msg.fromRole === 'donor' || (msg.fromRole === 'student' && msg.conversationType === 'DONOR_STUDENT')) && (
                          <Badge variant="outline" size="sm" className="text-xs bg-yellow-50 text-yellow-700">
                            Donor Chat
                          </Badge>
                        )}
                        {shouldHighlight && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            📄 New Upload
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-800">{msg.text}</div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Type your message to the student..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              className="min-h-[44px] flex-1"
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim()} className="min-h-[44px] w-full sm:w-auto">
              Send
            </Button>
          </div>
        </div>
      </Card>

      {/* Action Buttons at Bottom - Mirror of top buttons */}
      <Card className="p-4 sm:p-6 bg-slate-50 border-2 border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-slate-600">
            Complete field verification and submit your review
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {submitted ? (
              <Button 
                onClick={() => navigate("/sub-admin")} 
                className="bg-green-600 hover:bg-green-700 px-6 min-h-[44px] w-full sm:w-auto"
                size="lg"
              >
                Return to Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => saveFieldVerification(false)} 
                  disabled={saving}
                  size="lg"
                  className="px-6 min-h-[44px] w-full sm:w-auto"
                >
                  {saving ? "Saving..." : "Save Draft"}
                </Button>
                <Button 
                  onClick={() => saveFieldVerification(true)} 
                  disabled={saving}
                  size="lg"
                  className="px-6 min-h-[44px] w-full sm:w-auto"
                >
                  {saving ? "Submitting..." : "Submit Review"}
                </Button>
              </>
            )}
          </div>
        </div>
        
        {!submitted && (
          <div className="mt-3 text-xs text-slate-500">
            💡 Tip: You can save your progress as draft and continue later, or submit your complete field verification review.
          </div>
        )}
      </Card>
    </div>
  );
}