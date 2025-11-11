// src/pages/FieldOfficerDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { FileText, MessageCircle, AlertTriangle, Clock, CheckCircle, MessageSquare, AlertCircle } from "lucide-react";
import { useAuth } from '@/lib/AuthContext';
import { API } from "@/lib/api";
import { fmtAmount } from "@/lib/currency";

export default function FieldOfficerDashboard() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;

  // Token validation (simplified)
  const isTokenValid = useMemo(() => {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }, [token]);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Auth recovery mechanism
  useEffect(() => {
    if (user && user.role === "SUB_ADMIN" && !token) {
      console.error("❌ User appears logged in but no token found - corrupted auth state");
      toast.error("Authentication issue detected. Please log in again.");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  }, [user, token, navigate]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [missingItems, setMissingItems] = useState("");
  const [missingNote, setMissingNote] = useState("");

  async function loadReviews() {
    if (!isTokenValid) {
      toast.error("Authentication required. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API.baseURL}/api/field-reviews`, { headers: authHeader });
      
      if (!res.ok) {
        throw new Error(`Failed to load reviews: ${res.status}`);
      }
      
      const data = await res.json();
      const reviewsList = Array.isArray(data?.reviews) ? data.reviews : [];
      setReviews(reviewsList);
    } catch (e) {
      console.error('LoadReviews error:', e);
      toast.error("Failed to load assigned reviews");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isTokenValid) {
      loadReviews();
    }
  }, [isTokenValid]);

  async function updateReview(reviewId) {
    try {
      const res = await fetch(`${API.baseURL}/api/field-reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ notes, recommendation, status: "COMPLETED" })
      });
      if (!res.ok) throw new Error(await res.text());
      
      setReviews(prev => prev.map(r => 
        r.id === reviewId 
          ? { ...r, notes, recommendation, status: "COMPLETED", updatedAt: new Date().toISOString() }
          : r
      ));
      
      toast.success("Review updated successfully");
      setSelectedReview(null);
      setNotes("");
      setRecommendation("");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update review");
    }
  }

  async function requestMissingInfo(reviewId) {
    try {
      const items = missingItems.split(/\n|,/).map(s => s.trim()).filter(Boolean);
      if (items.length === 0) {
        toast.error("Please list at least one missing item");
        return;
      }

      const res = await fetch(`${API.baseURL}/api/field-reviews/${reviewId}/request-missing`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ items, note: missingNote })
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      setMissingItems("");
      setMissingNote("");
      toast.success("Missing information request sent to student");
      loadReviews(); // Refresh to see updated status
    } catch (e) {
      console.error(e);
      toast.error("Failed to send request");
    }
  }

  function openReview(review) {
    setSelectedReview(review);
    setNotes(review.notes || "");
    setRecommendation(review.recommendation || "");
  }

  // Reopen completed review for editing
  async function reopenReview(reviewId) {
    try {
      setLoading(true);
      const res = await fetch(`${API.baseURL}/api/field-reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ status: "IN_PROGRESS" })
      });
      
      if (!res.ok) throw new Error("Failed to reopen review");
      
      toast.success("Review reopened for editing");
      loadReviews(); // Refresh to show updated status
      
      // Navigate to edit the review
      navigate(`/field-officer/review/${reviewId}`);
    } catch (e) {
      console.error("Reopen failed:", e);
      toast.error("Failed to reopen review");
    } finally {
      setLoading(false);
    }
  }

  const pendingReviews = reviews.filter(r => r.status === "PENDING" || r.status === "IN_PROGRESS");
  const completedReviews = reviews.filter(r => r.status === "COMPLETED");

  if (user?.role !== "SUB_ADMIN") {
    return <Card className="p-6">Sub Admins only.</Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sub Admin Dashboard</h1>
        <div className="flex gap-2">
          {(!token || !user) && (
            <Button 
              onClick={() => navigate("/login")} 
              variant="destructive"
              className="text-sm rounded-2xl"
            >
              Fix Login Issue
            </Button>
          )}
          <Button variant="outline" className="rounded-2xl" onClick={loadReviews} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Auth Issue Banner */}
      {(!token || !user) && (
        <Card className="p-4 border-l-4 border-l-red-500 bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <h3 className="font-medium">Authentication Issue Detected</h3>
              <p className="text-sm">You appear to be logged in but your session is invalid. Please log in again to access your reviews.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Status Overview Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-600">{pendingReviews.length}</div>
              <div className="text-sm text-slate-600">Pending Reviews</div>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{completedReviews.length}</div>
              <div className="text-sm text-slate-600">Completed Reviews</div>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{reviews.length}</div>
              <div className="text-sm text-slate-600">Total Assignments</div>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Priority Assignments - Show at Top */}
      {pendingReviews.length > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <h2 className="font-semibold text-orange-800">Urgent: Pending Reviews</h2>
              <Badge variant="destructive" className="ml-auto">
                {pendingReviews.length} Assignments
              </Badge>
            </div>
            <div className="space-y-3">
              {pendingReviews.slice(0, 3).map((review, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">
                          📚 {review.student?.name || 'Student'}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          CNIC: {review.student?.cnic || 'Not provided'}
                        </span>
                      </div>
                      <p className="text-slate-800 text-sm font-medium">
                        {review.student?.program} at {review.student?.university}
                      </p>
                      <p className="text-slate-600 text-xs">
                        Assigned: {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => openReview(review)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Review Now
                    </Button>
                  </div>
                </div>
              ))}
              {pendingReviews.length > 3 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-orange-700">
                    +{pendingReviews.length - 3} more assignments below
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Reviews */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div className="font-medium">Pending Reviews ({pendingReviews.length})</div>
          </div>
          
          {pendingReviews.length === 0 ? (
            <div className="text-sm text-slate-600">No pending reviews assigned.</div>
          ) : (
            <div className="space-y-3">
              {pendingReviews.map(review => (
                <div key={review.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{review.student?.name}</div>
                    <Badge variant={review.status === "PENDING" ? "secondary" : "default"}>
                      {review.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600">
                    {review.student?.program} · {review.student?.university}
                  </div>
                  <div className="text-sm text-slate-600">
                    👤 {review.student?.name} • CNIC: {review.student?.cnic || 'Not provided'}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="rounded-2xl" 
                      onClick={() => openReview(review)}
                    >
                      Review Application
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-2xl"
                      onClick={() => navigate(`/sub-admin/review/${review.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Completed Reviews */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <div className="font-medium">Completed Reviews ({completedReviews.length})</div>
            {completedReviews.length > 0 && (
              <Badge variant="outline" className="ml-2">
                Editable until Admin decides
              </Badge>
            )}
          </div>
          
          {completedReviews.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-slate-400" />
              <div className="text-sm">No completed reviews yet.</div>
              <div className="text-xs text-slate-500">Complete pending reviews above to see them here</div>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {completedReviews.map(review => {
                const applicationStatus = review.application?.status || 'PENDING';
                const isAdminDecided = applicationStatus === 'APPROVED' || applicationStatus === 'REJECTED';
                
                return (
                  <div key={review.id} className={`border rounded-lg p-4 ${
                    isAdminDecided ? 'bg-slate-50 border-slate-200' : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`font-medium ${isAdminDecided ? 'text-slate-800' : 'text-green-800'}`}>
                            {review.student?.name}
                          </div>
                          <Badge 
                            variant={review.fielderRecommendation === 'STRONGLY_APPROVE' ? 'default' : 
                                   review.fielderRecommendation === 'APPROVE' ? 'secondary' :
                                   review.fielderRecommendation === 'CONDITIONAL' ? 'outline' : 'destructive'}
                            className="text-xs"
                          >
                            {review.fielderRecommendation?.replace('_', ' ') || 'No Recommendation'}
                          </Badge>
                          {review.verificationScore && (
                            <Badge variant="outline" className="text-xs">
                              Score: {review.verificationScore}%
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-slate-600 mb-2">
                          {review.student?.program} at {review.student?.university}
                        </div>
                        
                        <div className={`text-xs mb-2 ${isAdminDecided ? 'text-slate-700' : 'text-green-700'}`}>
                          ✅ Completed: {new Date(review.updatedAt).toLocaleDateString()} • 
                          📅 Home Visit: {review.homeVisitDate ? new Date(review.homeVisitDate).toLocaleDateString() : 'Not recorded'}
                        </div>
                        
                        {review.recommendationReason && (
                          <div className={`text-sm text-slate-700 rounded p-2 border ${
                            isAdminDecided ? 'bg-white border-slate-200' : 'bg-white border-green-200'
                          }`}>
                            <strong>Reason:</strong> {review.recommendationReason}
                          </div>
                        )}
                        
                        {review.adminNotesRequired && (
                          <div className="text-xs text-amber-700 bg-amber-50 rounded p-2 mt-2 border border-amber-200">
                            <strong>Admin Attention:</strong> {review.adminNotesRequired}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-2xl text-xs"
                          onClick={() => navigate(`/sub-admin/review/${review.id}`)}
                        >
                          View Details
                        </Button>
                        
                        {!isAdminDecided ? (
                          <Button 
                            size="sm" 
                            className="rounded-2xl text-xs bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => reopenReview(review.id)}
                            disabled={loading}
                          >
                            ✏️ Edit Review
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-xs justify-center">
                            Final Decision Made
                          </Badge>
                        )}
                        
                        <Badge 
                          variant={applicationStatus === 'APPROVED' ? 'default' : 
                                 applicationStatus === 'REJECTED' ? 'destructive' : 'secondary'}
                          className="text-xs justify-center"
                        >
                          {applicationStatus === 'APPROVED' ? '✅ Approved' :
                           applicationStatus === 'REJECTED' ? '❌ Rejected' :
                           '⏳ Pending Admin'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Review Modal */}
      {selectedReview && (
        <ReviewModal 
          selectedReview={selectedReview} 
          setSelectedReview={setSelectedReview}
          notes={notes}
          setNotes={setNotes}
          recommendation={recommendation}
          setRecommendation={setRecommendation}
          missingItems={missingItems}
          setMissingItems={setMissingItems}
          missingNote={missingNote}
          setMissingNote={setMissingNote}
          updateReview={updateReview}
          requestMissingInfo={requestMissingInfo}
          authHeader={authHeader}
        />
      )}
    </div>
  );
}

// Separate component for the review modal to handle document loading
function ReviewModal({ 
  selectedReview, 
  setSelectedReview, 
  notes, 
  setNotes, 
  recommendation, 
  setRecommendation, 
  missingItems, 
  setMissingItems, 
  missingNote, 
  setMissingNote, 
  updateReview, 
  requestMissingInfo,
  authHeader 
}) {
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Load documents when modal opens
  useEffect(() => {
    async function loadDocs() {
      if (!selectedReview?.applicationId) return;
      
      try {
        setLoadingDocs(true);
        
        if (!authHeader?.Authorization) {
          console.error("❌ No auth header available for documents API call");
          toast.error("Authentication required for documents. Please log in again.");
          return;
        }
        
        const url = new URL(`${API.baseURL}/api/uploads`);
        url.searchParams.set("studentId", selectedReview.studentId);
        url.searchParams.set("applicationId", selectedReview.applicationId);
        
        const res = await fetch(url, { headers: authHeader });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to load documents: ${res.status}`);
        }
        
        const data = await res.json();
        setDocs(Array.isArray(data?.documents) ? data.documents : []);
      } catch (e) {
        console.error("Failed to load documents:", e);
        toast.error("Failed to load documents");
      } finally {
        setLoadingDocs(false);
      }
    }
    
    loadDocs();
  }, [selectedReview?.applicationId, selectedReview?.studentId, authHeader]);

  const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "UNIVERSITY_CARD", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "TRANSCRIPT"];
  const OPTIONAL_DOCS = ["TRANSCRIPT", "DEGREE_CERTIFICATE", "ENROLLMENT_CERTIFICATE"];
  
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Review Application</h3>
        <Button variant="ghost" onClick={() => setSelectedReview(null)}>×</Button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium text-slate-700">Student Information</div>
          <div className="text-sm text-slate-600 mt-1">
            <div><strong>Name:</strong> {selectedReview.student?.name}</div>
            <div><strong>Email:</strong> {selectedReview.student?.email}</div>
            <div><strong>Program:</strong> {selectedReview.student?.program}</div>
            <div><strong>University:</strong> {selectedReview.student?.university}</div>
            <div><strong>GPA:</strong> {selectedReview.student?.gpa}</div>
          </div>
        </div>
        
        <div>
          <div className="text-sm font-medium text-slate-700">Application Details</div>
          <div className="text-sm text-slate-600 mt-1">
            <div><strong>Student:</strong> {selectedReview.student?.name} • CNIC: {selectedReview.student?.cnic || 'Not provided'}</div>
            <div><strong>Status:</strong> {selectedReview.application?.status}</div>
            <div><strong>Term:</strong> {selectedReview.application?.term}</div>
            <div><strong>Amount:</strong> {fmtAmount(selectedReview.application?.amount, selectedReview.application?.currency)}
            </div>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <Card className="p-4 bg-slate-50">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-900">📄 Student Documents</h4>
            <div className="text-sm text-slate-600">
              {docs.length} uploaded • {REQUIRED_DOCS.filter(d => docs.some(doc => doc.type === d)).length}/{REQUIRED_DOCS.length} required
            </div>
          </div>
          
          {loadingDocs ? (
            <div className="text-sm text-slate-500">Loading documents...</div>
          ) : docs.length === 0 ? (
            <div className="text-sm text-slate-500">No documents uploaded yet.</div>
          ) : (
            <div className="space-y-2">
              {/* Required Documents */}
              <div className="text-sm font-medium text-slate-700">Required Documents:</div>
              {REQUIRED_DOCS.map((docType) => {
                const uploaded = docs.find(d => d.type === docType);
                const isUploaded = !!uploaded;
                
                return (
                  <div
                    key={docType}
                    className={`flex items-center justify-between rounded-md border p-2 text-sm ${
                      isUploaded ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isUploaded ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      {isUploaded ? (
                        <a
                          href={`${API.baseURL}${uploaded.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-green-700 hover:text-green-900 hover:underline font-medium"
                        >
                          📁 {uploaded.originalName || docType.replaceAll("_", " ")}
                        </a>
                      ) : (
                        <span className="font-medium text-red-600">{docType.replaceAll("_", " ")} - Missing</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Optional Documents */}
              {docs.some(d => OPTIONAL_DOCS.includes(d.type)) && (
                <>
                  <div className="text-sm font-medium text-slate-700 mt-3">Optional Documents:</div>
                  {OPTIONAL_DOCS.map((docType) => {
                    const uploaded = docs.find(d => d.type === docType);
                    if (!uploaded) return null;
                    
                    return (
                      <div
                        key={docType}
                        className="flex items-center justify-between rounded-md border p-2 text-sm bg-blue-50 border-blue-200"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <a
                            href={`${API.baseURL}${uploaded.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 hover:text-blue-900 hover:underline font-medium"
                          >
                            📁 {uploaded.originalName || docType.replaceAll("_", " ")}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Additional Documents */}
              {(() => {
                const knownTypes = new Set([...REQUIRED_DOCS, ...OPTIONAL_DOCS]);
                const additionalDocs = docs.filter(d => !knownTypes.has(d.type));
                
                if (additionalDocs.length === 0) return null;
                
                return (
                  <>
                    <div className="text-sm font-medium text-slate-700 mt-3">Additional Documents:</div>
                    {additionalDocs.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between rounded-md border p-2 text-sm bg-gray-50 border-gray-200"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-600" />
                          <a
                            href={`${API.baseURL}${d.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-700 hover:text-gray-900 hover:underline font-medium"
                          >
                            📁 {d.originalName || d.type.replaceAll("_", " ")}
                          </a>
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Review Notes</label>
          <textarea 
            className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm" 
            rows={4}
            placeholder="Enter your review notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Recommendation</label>
          <select 
            className="mt-1 w-full rounded-2xl border px-3 py-2 text-sm"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
          >
            <option value="">Select recommendation...</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="REQUEST_INFO">REQUEST MORE INFO</option>
          </select>
        </div>

        {recommendation === "REQUEST_INFO" && (
          <div className="border-l-4 border-amber-400 bg-amber-50 p-4 space-y-3">
            <div className="text-sm font-medium text-amber-800">Request Missing Information</div>
            <div>
              <textarea 
                className="w-full rounded-2xl border px-3 py-2 text-sm" 
                rows={3}
                placeholder="List missing items (comma or newline separated)..."
                value={missingItems}
                onChange={(e) => setMissingItems(e.target.value)}
              />
            </div>
            <div>
              <textarea 
                className="w-full rounded-2xl border px-3 py-2 text-sm" 
                rows={2}
                placeholder="Additional note to student (optional)..."
                value={missingNote}
                onChange={(e) => setMissingNote(e.target.value)}
              />
            </div>
            <Button 
              className="rounded-2xl" 
              onClick={() => requestMissingInfo(selectedReview.id)}
            >
              Send Missing Info Request
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          className="rounded-2xl" 
          onClick={() => updateReview(selectedReview.id)}
          disabled={!notes.trim() || !recommendation}
        >
          Complete Review
        </Button>
        <Button 
          variant="outline" 
          className="rounded-2xl" 
          onClick={() => setSelectedReview(null)}
        >
          Cancel
        </Button>
      </div>
    </Card>
  );
}