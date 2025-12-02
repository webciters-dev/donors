import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { API } from "@/lib/api";
import { fmtAmount } from "@/lib/currency";
import StudentPhoto from "@/components/StudentPhoto";
import StudentVideo from "@/components/StudentVideo";

// Case Worker task types
const TASK_TYPES = [
  { value: "", label: "Complete Verification (All Tasks)", icon: "", description: "Full verification including documents, field visit, and CNIC" },
  { value: "DOCUMENT_REVIEW", label: "Document Review Only", icon: "", description: "Review and verify submitted documents" },
  { value: "FIELD_VISIT", label: "Field Visit Only", icon: "", description: "Conduct home visit and interview" },
  { value: "CNIC_VERIFICATION", label: "CNIC Verification Only", icon: "🆔", description: "Verify identity documents" },
];

export default function AdminApplicationDetail() {
  const { id } = useParams(); // application id
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [app, setApp] = useState(null);
  const [docs, setDocs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [assignOfficer, setAssignOfficer] = useState("");
  const [assignTaskType, setAssignTaskType] = useState("");
  const [officers, setOfficers] = useState([]);
  const [missingItems, setMissingItems] = useState({});
  const [missingNote, setMissingNote] = useState({});
  const [reassignOfficer, setReassignOfficer] = useState({});

  useEffect(() => {
    async function load() {
      try {
        // load application with student
        const res = await fetch(`${API.baseURL}/api/applications/${id}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setApp(data);

        // docs
        const url = new URL(`${API.baseURL}/api/uploads`);
        url.searchParams.set("studentId", data.studentId);
        url.searchParams.set("applicationId", data.id);
        const dres = await fetch(url, { headers: { ...authHeader } });
        const dj = await dres.json();
        setDocs(Array.isArray(dj?.documents) ? dj.documents : []);

        // field reviews
        const rres = await fetch(`${API.baseURL}/api/field-reviews`, { headers: { ...authHeader } });
        const rj = await rres.json();
        const mine = Array.isArray(rj?.reviews) ? rj.reviews.filter(r => r.applicationId === id) : [];
        setReviews(mine);

        // officers list (admin and super admin)
        if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
          const ofres = await fetch(`${API.baseURL}/api/users?role=SUB_ADMIN`, { headers: { ...authHeader } });
          if (ofres.ok) {
            const ofj = await ofres.json();
            setOfficers(Array.isArray(ofj?.users) ? ofj.users : []);
          }
        }

        // Load both old messages and new conversations
        let allMessages = [];
        
        // Load old admin-student messages
        const murl = new URL(`${API.baseURL}/api/messages`);
        murl.searchParams.set("studentId", data.studentId);
        murl.searchParams.set("applicationId", data.id);
        const mres = await fetch(murl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const mj = await mres.json();
        allMessages = Array.isArray(mj?.messages) ? mj.messages : [];
        
        // Load donor-student conversations for admin oversight
        try {
          console.log('­ƒöì AdminApplicationDetail: Loading donor-student conversations for studentId:', data.studentId);
          const convRes = await fetch(`${API.baseURL}/api/conversations?includeAllMessages=true`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          
          if (convRes.ok) {
            const convData = await convRes.json();
            const conversations = convData.conversations || [];
            
            // Filter conversations for this specific student
            const studentConversations = conversations.filter(conv => 
              conv.studentId === data.studentId && conv.type === 'DONOR_STUDENT'
            );
            
            console.log(`­ƒöì AdminApplicationDetail: Found ${studentConversations.length} donor-student conversations`);
            
            // Extract messages from donor-student conversations
            studentConversations.forEach(conv => {
              if (conv.messages) {
                conv.messages.forEach(msg => {
                  console.log('­ƒöì AdminApplicationDetail: Adding conversation message:', msg.senderRole, msg.text?.substring(0, 50));
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
          } else {
            console.error('­ƒöì AdminApplicationDetail: Conversations API failed:', convRes.status);
          }
        } catch (convError) {
          console.error('­ƒöì AdminApplicationDetail: Failed to load conversations:', convError);
        }
        
        // Sort all messages newest first for better UX
        allMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        console.log('­ƒöì AdminApplicationDetail: Total messages loaded:', allMessages.length);
        setMessages(allMessages);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load application detail");
      }
    }
    load();
  }, [id, token]);

  const completeness = useMemo(() => {
    const s = app?.student || {};
    const required = [
      "cnic","dateOfBirth","guardianName","guardianCnic","phone","address","city","province","university","program","gpa","gradYear",
      "currentInstitution","currentCity","currentCompletionYear"
    ];
    const missing = required.filter(k => {
      const v = s?.[k];
      return v === null || v === undefined || v === "" || Number.isNaN(v);
    });
    return { percent: Math.round(((required.length - missing.length)/required.length)*100), missing };
  }, [app]);

  async function createAssignment() {
    try {
      if (!assignOfficer) { toast.error("Select a case worker"); return; }
      
      const taskType = assignTaskType || ""; // Empty string for complete verification
      const taskDescription = TASK_TYPES.find(t => t.value === taskType)?.label || "Complete Verification";
      
      const res = await fetch(`${API.baseURL}/api/field-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ 
          applicationId: app.id, 
          studentId: app.studentId, 
          officerUserId: assignOfficer,
          taskType: taskType
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      
      // Instead of adding to existing array, refresh the reviews to avoid duplicates
      const rres = await fetch(`${API.baseURL}/api/field-reviews`, { headers: { ...authHeader } });
      const rj = await rres.json();
      const mine = Array.isArray(rj?.reviews) ? rj.reviews.filter(r => r.applicationId === id) : [];
      setReviews(mine);
      
      toast.success(`Assigned ${taskDescription} to case worker`);
      setAssignOfficer(""); // Clear the selection
      setAssignTaskType(""); // Clear the task type selection
    } catch (e) {
      console.error(e);
      toast.error("Failed to assign");
    }
  }

  async function requestMissing(reviewId) {
    try {
      const items = (missingItems[reviewId] || "").split(/\n|,/).map(s => s.trim()).filter(Boolean);
      if (items.length === 0) {
        toast.error("Please list at least one missing item");
        return;
      }
      const res = await fetch(`${API.baseURL}/api/field-reviews/${reviewId}/request-missing`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ items, note: missingNote[reviewId] || "" })
      });
      if (!res.ok) throw new Error(await res.text());
      setMissingItems(prev => ({ ...prev, [reviewId]: "" }));
      setMissingNote(prev => ({ ...prev, [reviewId]: "" }));
      toast.success("Request sent to student");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send request");
    }
  }

  async function sendMessage() {
    try {
      const text = newMessage.trim();
      if (!text) return;
      const res = await fetch(`${API.baseURL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ studentId: app.studentId, applicationId: app.id, text, fromRole: "admin" })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const msg = await res.json();
      setMessages(prev => [msg, ...prev]); // Add new message at the beginning (newest first)
      setNewMessage("");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send message", { description: String(e.message || "") });
    }
  }

  async function reassignSubAdmin(reviewId) {
    try {
      const newOfficerId = reassignOfficer[reviewId];
      if (!newOfficerId) {
        toast.error("Please select a case worker to reassign");
        return;
      }

      const res = await fetch(`${API.baseURL}/api/field-reviews/${reviewId}/reassign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ newOfficerUserId: newOfficerId })
      });

      if (!res.ok) throw new Error(await res.text());
      
      // Refresh reviews
      const rres = await fetch(`${API.baseURL}/api/field-reviews`, { headers: { ...authHeader } });
      const rj = await rres.json();
      const mine = Array.isArray(rj?.reviews) ? rj.reviews.filter(r => r.applicationId === id) : [];
      setReviews(mine);
      
      // Clear selection
      setReassignOfficer(prev => ({ ...prev, [reviewId]: "" }));
      
      toast.success("Case worker reassigned successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to reassign case worker");
    }
  }

  if (!app) return <Card className="p-6">Loading…</Card>;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Application Detail</h1>
        <Button variant="outline" className="rounded-2xl min-h-[44px] self-start sm:self-auto" onClick={() => navigate(-1)}>Back</Button>
      </div>

      {/* Summary */}
      <Card className="p-4 sm:p-6 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-base sm:text-lg font-semibold">{app.student?.name}</div>
            <div className="text-xs sm:text-sm text-slate-600">{app.student?.program} → {app.student?.university}</div>
          </div>
          <Badge className="self-start sm:self-auto">{app.status}</Badge>
        </div>
        <div className="text-xs sm:text-sm text-slate-700">Profile completeness: {completeness.percent}%</div>
      </Card>

      {/* Student Photo and Video */}
      <Card className="p-4 sm:p-6">
        <div className="font-medium mb-4 text-sm sm:text-base">Student Profile</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Photo */}
          <div>
            <h4 className="font-medium text-sm mb-3 text-slate-700">Profile Photo</h4>
            <div className="flex flex-col gap-4">
              <StudentPhoto 
                student={app.student}
                size="large"
                className="shadow-lg border-2 border-gray-200"
              />
              <div className="text-sm text-slate-600">
                {app.student?.photoUrl ? (
                  <div>
                    <div> Photo uploaded</div>
                    <div className="text-xs opacity-75">Profile picture available</div>
                  </div>
                ) : (
                  <div className="text-slate-400">No photo uploaded</div>
                )}
              </div>
            </div>
          </div>

          {/* Introduction Video */}
          <div>
            <h4 className="font-medium text-sm mb-3 text-slate-700">Introduction Video</h4>
            <div className="flex flex-col gap-4">
              <StudentVideo 
                student={app.student}
                size="large"
                className="shadow-lg border-2 border-gray-200"
              />
              <div className="text-sm text-slate-600">
                {app.student?.introVideoUrl ? (
                  <div>
                    <div> Video uploaded</div>
                    <div className="text-xs opacity-75">Click to play video</div>
                  </div>
                ) : (
                  <div className="text-slate-400">No video uploaded</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Comprehensive Student Details */}
      <Card className="p-4 sm:p-6">
        <div className="font-medium mb-4 text-sm sm:text-base">Complete Student Profile</div>
        
        {/* Basic Information */}
        <div className="mb-6">
          <h4 className="font-medium text-sm mb-3 text-slate-700 border-b pb-2">Basic Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div>
              <div className="text-slate-500">Full Name</div>
              <div className="font-medium">{app.student?.name || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Email</div>
              <div>{app.student?.email || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Phone</div>
              <div>{app.student?.phone || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">CNIC</div>
              <div>{app.student?.cnic || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Date of Birth</div>
              <div>{app.student?.dateOfBirth || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Gender</div>
              <div>{app.student?.gender || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Address</div>
              <div>{app.student?.address || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">City</div>
              <div>{app.student?.city || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Province</div>
              <div>{app.student?.province || "-"}</div>
            </div>
          </div>
        </div>

        {/* Guardian Information */}
        <div className="mb-6">
          <h4 className="font-medium text-sm mb-3 text-slate-700 border-b pb-2">Guardian Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div>
              <div className="text-slate-500">Guardian Name</div>
              <div>{app.student?.guardianName || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Guardian CNIC</div>
              <div>{app.student?.guardianCnic || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Guardian Phone 1</div>
              <div>{app.student?.guardianPhone1 || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Second Guardian</div>
              <div>{app.student?.guardian2Name || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Second Guardian CNIC</div>
              <div>{app.student?.guardian2Cnic || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Guardian Phone 2</div>
              <div>{app.student?.guardianPhone2 || "-"}</div>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="mb-6">
          <h4 className="font-medium text-sm mb-3 text-slate-700 border-b pb-2">Academic Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div>
              <div className="text-slate-500">Current Institution</div>
              <div>{app.student?.currentInstitution || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Current City</div>
              <div>{app.student?.currentCity || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Completion Year</div>
              <div>{app.student?.currentCompletionYear || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Target University</div>
              <div>{app.student?.university || app.student?.customUniversity || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Program/Field</div>
              <div>{app.student?.program || app.student?.field || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Degree Level</div>
              <div>{app.student?.degreeLevel || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">GPA</div>
              <div>{app.student?.gpa || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Expected Graduation</div>
              <div>{app.student?.gradYear || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Specific Field</div>
              <div>{app.student?.specificField || "-"}</div>
            </div>
          </div>
        </div>

        {/* Family & Background Information */}
        <div className="mb-6">
          <h4 className="font-medium text-sm mb-3 text-slate-700 border-b pb-2">Family & Background</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div>
              <div className="text-slate-500">Family Size</div>
              <div>{app.student?.familySize || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Parents Occupation</div>
              <div>{app.student?.parentsOccupation || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Monthly Family Income</div>
              <div>{app.student?.monthlyFamilyIncome || "-"}</div>
            </div>
          </div>
        </div>

        {/* Social Media & Contact */}
        <div className="mb-6">
          <h4 className="font-medium text-sm mb-3 text-slate-700 border-b pb-2">Social Media & Contact</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div>
              <div className="text-slate-500">WhatsApp</div>
              <div>{app.student?.whatsappNumber ? (
                <a href={`https://wa.me/${app.student.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {app.student.whatsappNumber}
                </a>
              ) : "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Facebook</div>
              <div>{app.student?.facebookUrl ? (
                <a href={app.student.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  View Profile
                </a>
              ) : "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">LinkedIn</div>
              <div>{app.student?.linkedinUrl ? (
                <a href={app.student.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  View Profile
                </a>
              ) : "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Instagram</div>
              <div>{app.student?.instagramHandle || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">Twitter</div>
              <div>{app.student?.twitterHandle || "-"}</div>
            </div>
            <div>
              <div className="text-slate-500">TikTok</div>
              <div>{app.student?.tiktokHandle || "-"}</div>
            </div>
          </div>
        </div>

        {/* Detailed Descriptions */}
        <div className="space-y-4">
          {/* Personal Introduction */}
          {app.student?.personalIntroduction && (
            <div>
              <h4 className="font-medium text-sm mb-2 text-slate-700">Personal Introduction</h4>
              <div className="text-sm leading-relaxed text-slate-700 bg-slate-50 p-3 rounded whitespace-pre-wrap border">
                {app.student.personalIntroduction}
              </div>
            </div>
          )}

          {/* Career Goals */}
          {app.student?.careerGoals && (
            <div>
              <h4 className="font-medium text-sm mb-2 text-slate-700">Career Goals</h4>
              <div className="text-sm leading-relaxed text-slate-700 bg-slate-50 p-3 rounded whitespace-pre-wrap border">
                {app.student.careerGoals}
              </div>
            </div>
          )}

          {/* Academic Achievements */}
          {app.student?.academicAchievements && (
            <div>
              <h4 className="font-medium text-sm mb-2 text-slate-700">Academic Achievements</h4>
              <div className="text-sm leading-relaxed text-slate-700 bg-slate-50 p-3 rounded whitespace-pre-wrap border">
                {app.student.academicAchievements}
              </div>
            </div>
          )}

          {/* Community Involvement */}
          {app.student?.communityInvolvement && (
            <div>
              <h4 className="font-medium text-sm mb-2 text-slate-700">Community Involvement</h4>
              <div className="text-sm leading-relaxed text-slate-700 bg-slate-50 p-3 rounded whitespace-pre-wrap border">
                {app.student.communityInvolvement}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Financial Details */}
      <Card className="p-6">
        <div className="font-medium mb-3">Financial Information</div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Currency</span>
              <span className="font-medium">{app.currency || "USD"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Term</span>
              <span className="font-medium">{app.term || "—"}</span>
            </div>
          </div>
          
          {/* Enhanced Financial Breakdown */}
          <div className="space-y-2">
            {(app?.universityFee || app?.livingExpenses || app?.totalExpense) ? (
              <div className="space-y-2 bg-slate-50 p-3 rounded-lg">
                <h4 className="font-medium text-slate-700 text-xs uppercase tracking-wide">Financial Breakdown</h4>
                {app?.universityFee && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">University Fee</span>
                    <span className="font-medium">+{app.currency === "PKR" ? `Rs ${app.universityFee.toLocaleString()}` : `$${app.universityFee.toLocaleString()}`}</span>
                  </div>
                )}
                {app?.livingExpenses && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Books & Living</span>
                    <span className="font-medium">+{app.currency === "PKR" ? `Rs ${app.livingExpenses.toLocaleString()}` : `$${app.livingExpenses.toLocaleString()}`}</span>
                  </div>
                )}
                {app?.totalExpense && (
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-slate-700 font-medium">Total Expense</span>
                    <span className="font-semibold">{app.currency === "PKR" ? `Rs ${app.totalExpense.toLocaleString()}` : `$${app.totalExpense.toLocaleString()}`}</span>
                  </div>
                )}
                {app?.scholarshipAmount && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Scholarship</span>
                    <span className="font-medium text-green-600">-{app.currency === "PKR" ? `Rs ${app.scholarshipAmount.toLocaleString()}` : `$${app.scholarshipAmount.toLocaleString()}`}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-slate-700 font-semibold">Amount Required</span>
                  <span className="font-bold text-blue-600">
                    {fmtAmount(app.amount, app.currency)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Needed</span>
                <span className="font-medium">
                  {fmtAmount(app.amount, app.currency)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Admin Decision Panel */}
      <Card className="p-6 bg-blue-50 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-blue-800 flex items-center gap-2">
            ️ Admin Decision Panel
          </h3>
          <Badge variant="outline" className="text-blue-700 border-blue-300">
            Current Status: {app.status}
          </Badge>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Application Status & Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Application Status
              </label>
              <select
                className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={app._status || app.status}
                onChange={(e) => setApp(prev => ({ ...prev, _status: e.target.value }))}
              >
                <option value="PENDING">PENDING</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Admin Notes
              </label>
              <textarea
                className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm min-h-[80px] focus:ring-2 focus:ring-blue-500"
                placeholder="Add your decision notes here..."
                value={app._notes || app.notes || ""}
                onChange={(e) => setApp(prev => ({ ...prev, _notes: e.target.value }))}
              />
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Quick Actions
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    setApp(prev => ({ 
                      ...prev, 
                      _status: "APPROVED",
                      _notes: (prev._notes || "") + (prev._notes ? "\n" : "") + `Approved by Admin on ${new Date().toLocaleDateString()}`
                    }));
                  }}
                >
                   Approve
                </Button>
                
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setApp(prev => ({ 
                      ...prev, 
                      _status: "REJECTED",
                      _notes: (prev._notes || "") + (prev._notes ? "\n" : "") + `Rejected by Admin on ${new Date().toLocaleDateString()}`
                    }));
                  }}
                >
                   Reject
                </Button>
                
                <Button 
                  variant="outline"
                  className="col-span-2 border-blue-300 text-blue-700"
                  onClick={() => {
                    setApp(prev => ({ 
                      ...prev, 
                      _status: "PROCESSING",
                      _notes: (prev._notes || "") + (prev._notes ? "\n" : "") + `Under review by Admin on ${new Date().toLocaleDateString()}`
                    }));
                  }}
                >
                   Mark Under Review
                </Button>
              </div>
            </div>
            
            {/* Save Changes */}
            <div className="pt-2 border-t border-blue-300">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={async () => {
                  try {
                    const res = await fetch(`${API.baseURL}/api/applications/${app.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json", ...authHeader },
                      body: JSON.stringify({
                        status: app._status || app.status,
                        notes: app._notes || app.notes
                      })
                    });
                    
                    if (!res.ok) {
                      const errorData = await res.json();
                      
                      // Handle document validation error for approval
                      if (errorData.requiresOverride && errorData.missingDocuments) {
                        const proceed = window.confirm(
                          `️ Missing Required Documents:\n\n` +
                          `${errorData.missingDocuments.join(', ')}\n\n` +
                          `This application cannot be approved until all required documents are uploaded.\n\n` +
                          `Click OK to approve anyway (Force Approve)\n` +
                          `Click Cancel to wait for document upload`
                        );
                        
                        if (proceed) {
                          // Force approve with override
                          const forceRes = await fetch(`${API.baseURL}/api/applications/${app.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json", ...authHeader },
                            body: JSON.stringify({
                              status: app._status || app.status,
                              notes: (app._notes || app.notes) + "\n[FORCE APPROVED despite missing documents]",
                              forceApprove: true
                            })
                          });
                          
                          if (!forceRes.ok) throw new Error("Failed to force approve application");
                          
                          toast.success(" Application force approved despite missing documents!");
                        } else {
                          // Reset status to previous value
                          setApp(prev => ({
                            ...prev,
                            _status: prev.status,
                            _notes: prev.notes
                          }));
                          toast.info("️ Save cancelled - waiting for required documents to be uploaded");
                          return;
                        }
                      } else {
                        throw new Error(errorData.message || "Failed to update application");
                      }
                    }
                    
                    // Update local state
                    setApp(prev => ({
                      ...prev,
                      status: prev._status || prev.status,
                      notes: prev._notes || prev.notes
                    }));
                    
                    toast.success("Application updated successfully!");
                  } catch (error) {
                    toast.error("Failed to update application: " + error.message);
                    console.error(error);
                  }
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
        
        {/* Field Review Summary */}
        {reviews.length > 0 && reviews[0].status === "COMPLETED" && (
          <div className="mt-4 pt-4 border-t border-blue-300">
            <div className="text-sm font-medium text-blue-800 mb-2">
               Case Worker Recommendation Summary:
            </div>
            <div className="bg-white rounded p-3 border border-blue-200">
              <div className="flex items-center gap-2 text-sm">
                <Badge 
                  className={`${
                    reviews[0].fielderRecommendation === 'STRONGLY_APPROVE' ? 'bg-green-600' :
                    reviews[0].fielderRecommendation === 'APPROVE' ? 'bg-blue-600' :
                    reviews[0].fielderRecommendation === 'CONDITIONAL' ? 'bg-yellow-600' :
                    'bg-red-600'
                  } text-white`}
                >
                  {reviews[0].fielderRecommendation?.replace('_', ' ')}
                </Badge>
                {reviews[0].verificationScore && (
                  <span className="text-slate-600">Score: {reviews[0].verificationScore}%</span>
                )}
                {reviews[0].homeVisitDate && (
                  <span className="text-slate-600">
                    Visit: {new Date(reviews[0].homeVisitDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              {reviews[0].adminNotesRequired && (
                <div className="mt-2 text-sm text-amber-700 bg-amber-100 p-2 rounded border border-amber-300">
                  <strong>️ Attention Required:</strong> {reviews[0].adminNotesRequired}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Documents */}
      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">Documents ({docs.length})</div>
          {(() => {
            const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "PHOTO", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL", "UNIVERSITY_CARD", "ENROLLMENT_CERTIFICATE", "TRANSCRIPT"];
            const uploadedTypes = docs.map(d => d.type);
            const missingRequired = REQUIRED_DOCS.filter(req => !uploadedTypes.includes(req));
            
            if (missingRequired.length === 0) {
              return <Badge className="bg-green-100 text-green-800 text-xs"> All Required</Badge>;
            } else {
              return <Badge className="bg-red-100 text-red-800 text-xs">️ Missing {missingRequired.length}</Badge>;
            }
          })()}
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {docs.length === 0 ? (
            <div className="text-sm text-slate-600">No documents uploaded yet</div>
          ) : (
            docs.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <a
                    href={`${API.baseURL}${doc.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-700 hover:text-green-900 hover:underline font-medium"
                  >
                     {doc.originalName || doc.type.replaceAll("_", " ")}
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Case Worker Assignment & Actions */}
      <Card className="p-6 space-y-4">
        <div className="font-medium">Case Worker Assignment</div>
        <div className="grid md:grid-cols-4 gap-2 items-center">
          <select className="rounded-2xl border px-3 py-2 text-sm" value={assignOfficer} onChange={(e)=>setAssignOfficer(e.target.value)}>
            <option value="">Select case worker…</option>
            {officers.map(o => (
              <option key={o.id} value={o.id}>{o.name || o.email}</option>
            ))}
          </select>
          <select className="rounded-2xl border px-3 py-2 text-sm" value={assignTaskType} onChange={(e)=>setAssignTaskType(e.target.value)}>
            {TASK_TYPES.map(task => (
              <option key={task.value} value={task.value}>
                {task.icon} {task.label}
              </option>
            ))}
          </select>
          <Button className="rounded-2xl" onClick={createAssignment}>Assign</Button>
        </div>

        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="border rounded-lg p-4 bg-slate-50">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="font-medium">Case Worker Review #{r.id.slice(0,6)}</div>
                  {/* Show assigned case worker name */}
                  {r.officerUserId && (
                    <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                       {officers.find(o => o.id === r.officerUserId)?.name || officers.find(o => o.id === r.officerUserId)?.email || 'Unknown Case Worker'}
                    </Badge>
                  )}
                  <Badge variant={r.status === "COMPLETED" ? "default" : r.status === "IN_PROGRESS" ? "secondary" : "outline"}>
                    {r.status}
                  </Badge>
                  {r.fielderRecommendation && (
                    <Badge 
                      className={`text-white ${
                        r.fielderRecommendation === 'STRONGLY_APPROVE' ? 'bg-green-600' :
                        r.fielderRecommendation === 'APPROVE' ? 'bg-blue-600' :
                        r.fielderRecommendation === 'CONDITIONAL' ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}
                    >
                      {r.fielderRecommendation.replace('_', ' ')}
                    </Badge>
                  )}
                  {r.verificationScore && (
                    <Badge variant="outline" className="text-xs">
                      Score: {r.verificationScore}%
                    </Badge>
                  )}
                </div>
                <div className="text-slate-500 text-sm">{new Date(r.updatedAt || r.createdAt).toLocaleString()}</div>
              </div>

              {/* Comprehensive Field Verification Display */}
              {r.status === "COMPLETED" && (
                <div className="bg-white rounded-lg p-4 mb-3 border">
                  <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                     Field Verification Report
                  </h4>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {/* Left Column */}
                    <div className="space-y-3">
                      {r.homeVisitDate && (
                        <div>
                          <span className="font-medium text-slate-600">Home Visit Date:</span>
                          <div>{new Date(r.homeVisitDate).toLocaleDateString()}</div>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <span className="font-medium text-slate-600">Verification Status:</span>
                        <div className="flex flex-wrap gap-1">
                          {r.identityVerified && <Badge className="bg-green-100 text-green-800 text-xs"> Identity</Badge>}
                          {r.documentsVerified && <Badge className="bg-green-100 text-green-800 text-xs"> Documents</Badge>}
                          {r.familyIncomeVerified && <Badge className="bg-green-100 text-green-800 text-xs"> Income</Badge>}
                          {r.educationVerified && <Badge className="bg-green-100 text-green-800 text-xs"> Education</Badge>}
                        </div>
                      </div>
                      
                      {r.deservingnessFactor && (
                        <div>
                          <span className="font-medium text-slate-600">Deservingness:</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${(r.deservingnessFactor / 10) * 100}%` }}
                              />
                            </div>
                            <span>{r.deservingnessFactor}/10</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Right Column */}
                    <div className="space-y-3">
                      {r.riskFactors && r.riskFactors.length > 0 && (
                        <div>
                          <span className="font-medium text-slate-600">Risk Factors:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {r.riskFactors.map((risk, idx) => (
                              <Badge key={idx} variant="destructive" className="text-xs">
                                ️ {risk}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {r.additionalDocumentsRequested && r.additionalDocumentsRequested.length > 0 && (
                        <div>
                          <span className="font-medium text-slate-600">Additional Docs Needed:</span>
                          <div className="text-slate-700 text-xs mt-1">
                            {r.additionalDocumentsRequested.join(", ")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Detailed Notes */}
                  <div className="grid md:grid-cols-2 gap-4 mt-4 text-xs">
                    {r.homeVisitNotes && (
                      <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                        <div className="font-medium text-blue-800 mb-1"> Home Visit Notes:</div>
                        <div className="text-blue-700">{r.homeVisitNotes}</div>
                      </div>
                    )}
                    
                    {r.familyInterviewNotes && (
                      <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-400">
                        <div className="font-medium text-purple-800 mb-1"> Family Interview:</div>
                        <div className="text-purple-700">{r.familyInterviewNotes}</div>
                      </div>
                    )}
                    
                    {r.financialVerificationNotes && (
                      <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                        <div className="font-medium text-green-800 mb-1"> Financial Verification:</div>
                        <div className="text-green-700">{r.financialVerificationNotes}</div>
                      </div>
                    )}
                    
                    {r.characterAssessment && (
                      <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                        <div className="font-medium text-yellow-800 mb-1"> Character Assessment:</div>
                        <div className="text-yellow-700">{r.characterAssessment}</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Recommendation Details */}
                  {(r.recommendationReason || r.adminNotesRequired) && (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      {r.recommendationReason && (
                        <div className="bg-slate-100 p-3 rounded mb-2">
                          <div className="font-medium text-slate-800 text-sm mb-1"> Recommendation Reason:</div>
                          <div className="text-slate-700 text-sm">{r.recommendationReason}</div>
                        </div>
                      )}
                      
                      {r.adminNotesRequired && (
                        <div className="bg-amber-100 p-3 rounded border border-amber-300">
                          <div className="font-medium text-amber-800 text-sm mb-1">️ Requires Admin Attention:</div>
                          <div className="text-amber-700 text-sm font-medium">{r.adminNotesRequired}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Basic Notes for non-completed reviews */}
              {r.status !== "COMPLETED" && (
                <div className="mt-2 text-slate-700 whitespace-pre-wrap">{r.notes || "No notes yet."}</div>
              )}
              <div className="mt-3 grid md:grid-cols-2 gap-2">
                <textarea 
                  className="rounded-2xl border px-3 py-2 text-sm" 
                  rows={3} 
                  placeholder="Missing items (comma or newline separated)" 
                  value={missingItems[r.id] || ""} 
                  onChange={(e)=>setMissingItems(prev => ({ ...prev, [r.id]: e.target.value }))} 
                />
                <textarea 
                  className="rounded-2xl border px-3 py-2 text-sm" 
                  rows={3} 
                  placeholder="Note to student (optional)" 
                  value={missingNote[r.id] || ""} 
                  onChange={(e)=>setMissingNote(prev => ({ ...prev, [r.id]: e.target.value }))} 
                />
              </div>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" className="rounded-2xl" onClick={()=>requestMissing(r.id)}>Request Missing Info</Button>
              </div>
              
              {/* Reassignment Section */}
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="text-sm font-medium text-slate-700 mb-2">Reassign Case Worker:</div>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 rounded-2xl border px-3 py-2 text-sm" 
                    value={reassignOfficer[r.id] || ""} 
                    onChange={(e)=>setReassignOfficer(prev => ({ ...prev, [r.id]: e.target.value }))}
                  >
                    <option value="">Select new case worker...</option>
                    {officers.map(officer => (
                      <option key={officer.id} value={officer.id}>
                        {officer.name || officer.email}
                      </option>
                    ))}
                  </select>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-2xl" 
                    onClick={()=>reassignSubAdmin(r.id)}
                    disabled={!reassignOfficer[r.id]}
                  >
                    Reassign
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {reviews.length === 0 && <div className="text-sm text-slate-600">No case worker assigned yet.</div>}
        </div>
      </Card>

      {/* Messages */}
      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          <div className="font-medium">All Messages</div>
          <Badge variant="outline" className="text-xs">
            Admin oversight - includes donor conversations
          </Badge>
        </div>
        {messages.length === 0 ? (
          <div className="text-sm text-slate-600">No messages yet.</div>
        ) : (
          <ul className="space-y-2">
            {messages.map(m => {
              const isDonorMessage = m.fromRole === 'donor';
              const isStudentReply = m.fromRole === 'student' && m.conversationType === 'DONOR_STUDENT';
              
              return (
                <li key={m.id} className={`text-sm border rounded-md p-3 ${
                  isDonorMessage ? 'bg-blue-50 border-blue-200' : 
                  isStudentReply ? 'bg-green-50 border-green-200' : 
                  'bg-white'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={isDonorMessage ? "default" : isStudentReply ? "secondary" : "outline"}>
                          {isDonorMessage ? ` Donor${m.senderName ? `: ${m.senderName}` : ''}` : 
                           isStudentReply ? ' Student Reply' : 
                           m.fromRole === 'admin' ? ' Admin' : 
                           '‍ Case Worker'}
                        </Badge>
                        {(isDonorMessage || isStudentReply) && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                            Donor-Student Chat
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-800 leading-relaxed">{m.text}</p>
                    </div>
                    <span className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-3 grid grid-cols-12 gap-2">
          <textarea className="col-span-10 rounded-2xl border px-3 py-2 text-sm" rows={2} placeholder="Write a message to the student…" value={newMessage} onChange={(e)=>setNewMessage(e.target.value)} />
          <div className="col-span-2 flex items-start justify-end">
            <Button className="rounded-2xl" onClick={sendMessage}>Send</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
