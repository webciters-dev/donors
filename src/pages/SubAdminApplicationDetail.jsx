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

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

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
        const reviewRes = await fetch(`${API}/api/field-reviews`, { headers: authHeader });
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

        // Load messages
        const msgRes = await fetch(`${API}/api/messages?studentId=${currentReview.studentId}&applicationId=${currentReview.applicationId}`, {
          headers: authHeader
        });
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData.messages || []);
        }

        // Load documents
        const docRes = await fetch(`${API}/api/uploads?studentId=${currentReview.studentId}&applicationId=${currentReview.applicationId}`, {
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

  async function saveFieldVerification(isSubmitting = false) {
    try {
      setSaving(true);
      
      const status = isSubmitting ? "COMPLETED" : "IN_PROGRESS";
      
      const res = await fetch(`${API}/api/field-reviews/${reviewId}`, {
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
        console.log("🎯 Field verification submitted successfully, preparing to navigate...");
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
        
        console.log("🚀 Starting navigation timer...");
        
        // Navigate back to dashboard - make it more reliable  
        const timeoutId = setTimeout(() => {
          console.log("⏰ Timeout executed, navigating to dashboard");
          try {
            navigate("/field-officer", { replace: true });
            console.log("✅ Navigation successful");
          } catch (navError) {
            console.error("❌ Navigation failed:", navError);
            // Fallback - use window location if navigate fails
            window.location.href = window.location.origin + window.location.pathname + "#/field-officer";
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
  }

  async function sendMessage() {
    try {
      if (!newMessage.trim()) return;
      
      const res = await fetch(`${API}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          studentId: student.id,
          applicationId: application.id,
          text: newMessage,
          fromRole: "field_officer"
        })
      });

      if (!res.ok) throw new Error("Failed to send message");
      
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold">Field Verification</h1>
          <Badge variant={review.status === "PENDING" ? "secondary" : review.status === "COMPLETED" ? "default" : "outline"}>
            {review.status}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          {submitted ? (
            <Button onClick={() => navigate("/field-officer")} className="bg-green-600 hover:bg-green-700">
              Return to Dashboard
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => saveFieldVerification(false)} disabled={saving}>
                {saving ? "Saving..." : "Save Draft"}
              </Button>
              <Button onClick={() => saveFieldVerification(true)} disabled={saving}>
                {saving ? "Submitting..." : "Submit Review"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Student Information Summary */}
      <Card className="p-6 bg-slate-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold">{student.name}</h2>
          </div>
          <div className="text-sm text-slate-600">
            {application.currency === 'PKR' 
              ? `Rs ${application.needPKR?.toLocaleString()}` 
              : `$${application.needUSD?.toLocaleString()}`
            } • {student.university} • {student.program}
          </div>
        </div>
        
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-500">CNIC:</span>
            <div className="font-medium">{student.cnic || 'Not provided'}</div>
          </div>
          <div>
            <span className="text-slate-500">Phone:</span>
            <div className="font-medium">{student.phone || 'Not provided'}</div>
          </div>
          <div>
            <span className="text-slate-500">Address:</span>
            <div className="font-medium">{student.address || 'Not provided'}</div>
          </div>
          <div>
            <span className="text-slate-500">Guardian:</span>
            <div className="font-medium">{student.guardianName || 'Not provided'}</div>
          </div>
        </div>
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
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">Document Verification</h3>
          <label className="flex items-center gap-2 text-sm ml-4">
            <input
              type="checkbox"
              checked={fieldVerification.documentsVerified}
              onChange={(e) => updateField('documentsVerified', e.target.checked)}
            />
            <CheckCircle className="h-4 w-4 text-green-600" />
            All Documents Verified
          </label>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {documents.length === 0 ? (
            <div className="text-sm text-slate-600">No documents uploaded yet</div>
          ) : (
            documents.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium text-sm">{doc.type.replace('_', ' ')}</div>
                  <div className="text-xs text-slate-500">{doc.originalName}</div>
                </div>
                <Badge variant="outline" size="sm">
                  {doc.url ? "Uploaded" : "Missing"}
                </Badge>
              </div>
            ))
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
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Recommendation</label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm"
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
                className="w-full"
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
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold">Student Communication</h2>
        </div>
        
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-4 text-slate-600">No messages yet</div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {messages.map((msg, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="secondary" size="sm">
                      {msg.fromRole === 'student' ? '👤 Student' : 
                       msg.fromRole === 'field_officer' ? '🏢 Sub Admin' : '👨‍💼 Admin'}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-800">{msg.text}</div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              placeholder="Type your message to the student..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim()}>
              Send
            </Button>
          </div>
        </div>
      </Card>

      {/* Action Buttons at Bottom - Mirror of top buttons */}
      <Card className="p-6 bg-slate-50 border-2 border-slate-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Complete field verification and submit your review
          </div>
          
          <div className="flex gap-3">
            {submitted ? (
              <Button 
                onClick={() => navigate("/field-officer")} 
                className="bg-green-600 hover:bg-green-700 px-6"
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
                  className="px-6"
                >
                  {saving ? "Saving..." : "Save Draft"}
                </Button>
                <Button 
                  onClick={() => saveFieldVerification(true)} 
                  disabled={saving}
                  size="lg"
                  className="px-6"
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