// src/pages/MyApplication.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card as UiCard } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Circle, MessageCircle, User } from "lucide-react";
import DocumentUploader from "@/components/DocumentUploader";
import { useAuth } from "@/lib/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
const DEMO_STUDENT_ID = import.meta.env.VITE_DEMO_STUDENT_ID || "";

// --- tiny helpers ---
const fmtUSD = (n) =>
  Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmtPKR = (n) =>
  Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });

// Which profile fields matter for “completeness”
const REQUIRED_PROFILE_KEYS = [
  "cnic",
  "dateOfBirth",
  "guardianName",
  "guardianCnic",
  "phone",
  "address",
  "city",
  "province",
  "university",
  "program",
  "gpa",
  "gradYear",
];

function computeProfileCompleteness(student) {
  if (!student) return { percent: 0, missing: REQUIRED_PROFILE_KEYS };
  const missing = REQUIRED_PROFILE_KEYS.filter((k) => {
    const v = student?.[k];
    return v === null || v === undefined || v === "" || Number.isNaN(v);
  });
  const filled = REQUIRED_PROFILE_KEYS.length - missing.length;
  const percent = Math.round((filled / REQUIRED_PROFILE_KEYS.length) * 100);
  return { percent, missing };
}

export const MyApplication = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [application, setApplication] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [rawMessages, setRawMessages] = useState([]); // keep raw for parsing
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [reloadingMsgs, setReloadingMsgs] = useState(false);
  const [serverRequests, setServerRequests] = useState(null); // { items, lastRequestText }
  const [showProfileBanner, setShowProfileBanner] = useState(true);
  // current education temp form for inline edit
  const [currentEdu, setCurrentEdu] = useState({
    currentInstitution: "",
    currentCity: "",
    currentCompletionYear: "",
  });
  const [savingCurrentEdu, setSavingCurrentEdu] = useState(false);
  const [preferredUploadType, setPreferredUploadType] = useState(null);

  // Load current application (polling)
  useEffect(() => {
    let timer;
    let dead = false;

    async function loadApp() {
      try {
        const res = await fetch(`${API}/api/applications`, {
          headers: { ...authHeader },
        });
        const data = await res.json();
        const list = Array.isArray(data?.applications)
          ? data.applications
          : Array.isArray(data)
          ? data
          : [];

        // Prefer the logged-in student's application; fallback to DEMO_STUDENT_ID if provided.
        const targetStudentId = (user?.studentId && String(user.studentId)) || (DEMO_STUDENT_ID || "");
        let app = null;
        if (targetStudentId) {
          app = list.find((a) => a.studentId === targetStudentId) || null;
        }
        // Do NOT fallback to the first item to avoid showing someone else's application.
        if (!dead) setApplication(app);
      } catch (err) {
        console.error(err);
        if (!dead) {
          setApplication(null);
          toast.error("Failed to load application");
        }
      }
    }

    loadApp();
    timer = setInterval(loadApp, 10000);

    return () => {
      dead = true;
      if (timer) clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.studentId]);

  // Tip if no bound student context (only when no demo id and no logged-in student)
  useEffect(() => {
    if (!DEMO_STUDENT_ID && !user?.studentId) {
      toast.message("Tip", {
        description:
          "Set VITE_DEMO_STUDENT_ID in the frontend .env to bind this page to a specific student.",
      });
    }
  }, [user?.studentId]);

  // Prefill current education fields from student profile
  useEffect(() => {
    let cancel = false;
    async function loadStudent() {
      if (!token) return;
      try {
        const res = await fetch(`${API}/api/students/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const s = data?.student || {};
        if (cancel) return;
        setCurrentEdu({
          currentInstitution: s.currentInstitution || "",
          currentCity: s.currentCity || "",
          currentCompletionYear: s.currentCompletionYear ?? "",
        });
      } catch (_) {
        // ignore
      }
    }
    loadStudent();
    return () => {
      cancel = true;
    };
  }, [token]);

  // Load messages when the application is known
  useEffect(() => {
    if (!application?.studentId) return;

    let cancel = false;

    async function loadMessages() {
      try {
  const url = new URL(`${API}/api/messages`);
  url.searchParams.set("studentId", application.studentId);

        const res = await fetch(url, { headers: { ...authHeader } });
        const data = await res.json();
        const list = Array.isArray(data?.messages) ? data.messages : [];
        if (!cancel) {
          setRawMessages(list);
          setMessages(list.map((m) => ({ from: m.fromRole, text: m.text })));
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadMessages();
    const t = setInterval(loadMessages, 10000);
    return () => {
      cancel = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.studentId, application?.id, token]);

  async function reloadMessages() {
    if (!application?.studentId) return;
    try {
      setReloadingMsgs(true);
      const url = new URL(`${API}/api/messages`);
      url.searchParams.set("studentId", application.studentId);
      const res = await fetch(url, { headers: { ...authHeader } });
      const data = await res.json();
      const list = Array.isArray(data?.messages) ? data.messages : [];
      setRawMessages(list);
      setMessages(list.map((m) => ({ from: m.fromRole, text: m.text })));
    } catch (e) {
      console.error(e);
      toast.error("Failed to refresh messages");
    } finally {
      setReloadingMsgs(false);
    }
  }

  // Load documents when application known
  useEffect(() => {
    if (!application?.studentId) return;

    let dead = false;
    async function loadDocs() {
      try {
        setLoadingDocs(true);
        const url = new URL(`${API}/api/uploads`);
        url.searchParams.set("studentId", application.studentId);
        if (application.id) url.searchParams.set("applicationId", application.id);
        const res = await fetch(url, { headers: { ...authHeader } });
        const data = await res.json();
        const list = Array.isArray(data?.documents) ? data.documents : [];
        if (!dead) setDocs(list);
      } catch (e) {
        console.error(e);
      } finally {
        if (!dead) setLoadingDocs(false);
      }
    }
    loadDocs();

    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.studentId, application?.id, token]);

  // Load server-derived requests (more deterministic)
  useEffect(() => {
    if (!application?.studentId) return;
    let dead = false;
    async function loadReq() {
      try {
        const url = new URL(`${API}/api/requests`);
        url.searchParams.set("studentId", application.studentId);
        const res = await fetch(url);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!dead) setServerRequests({ items: Array.isArray(data.items) ? data.items : [], lastRequestText: data.lastRequestText || null });
      } catch (e) {
        // If it fails, keep null so we fallback to client parsing
        if (!dead) setServerRequests(null);
      }
    }
    loadReq();
    return () => { dead = true; };
  }, [application?.studentId]);

  // After docs are loaded: show a reminder for required items
  useEffect(() => {
    if (!Array.isArray(docs) || docs.length === 0) return;

    const have = new Set(docs.map((d) => d.type));
    const must = REQUIRED_DOCS; // Use the main required docs list
    const missing = must.filter((m) => !have.has(m));

    if (missing.length > 0) {
      const pretty = missing.map((m) => m.replaceAll("_", " "));
      toast.message("Tip: upload required documents", {
        description: `Please continue to upload the following documents: ${pretty.join(", ")}.`,
      });
    }
  }, [docs]);

  // Current education documents checklist (visual only)
  const currentDocChecklist = useMemo(
    () => [
      { key: "TRANSCRIPT", label: "Transcript" },
      { key: "DEGREE_CERTIFICATE", label: "Degree Certificate" },
      { key: "ENROLLMENT_CERTIFICATE", label: "Enrollment / Admission Proof" },
    ],
    []
  );
  const haveDocs = useMemo(() => new Set((docs || []).map((d) => d.type)), [docs]);
  const checklistDone = useMemo(
    () => currentDocChecklist.filter((i) => haveDocs.has(i.key)).length,
    [currentDocChecklist, haveDocs]
  );

  async function sendMessage(textOverride) {
    const textToSend = (typeof textOverride === "string" ? textOverride : message).trim();
    if (!textToSend || !application?.studentId) return;
    try {
      const res = await fetch(`${API}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          studentId: application.studentId,
          applicationId: application.id || null,
          text: textToSend,
          fromRole: "student",
        }),
      });
      if (!res.ok) {
        // try to surface server error details
        let msg = "Failed to send message";
        try {
          const t = await res.text();
          msg = t || msg;
        } catch (_) {}
        throw new Error(msg);
      }

  setMessages((prev) => [...prev, { from: "student", text: textToSend }]);
  setRawMessages((prev) => [...prev, { fromRole: "student", text: textToSend }]);
      setMessage("");
      toast.success("Message sent");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    }
  }

  async function deleteDoc(id) {
    try {
      const res = await fetch(`${API}/api/uploads/${id}`, {
        method: "DELETE",
        headers: { ...authHeader },
      });
      if (!res.ok) throw new Error(await res.text());
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Document deleted");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete document");
    }
  }

  // --- Requests parsing from admin/field officer messages ---
  function normalizeItem(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  const DOC_KEYWORDS = [
    { type: "CNIC", kws: ["cnic"] },
    { type: "GUARDIAN_CNIC", kws: ["guardian cnic", "father cnic", "mother cnic", "parent cnic"] },
    { type: "HSSC_RESULT", kws: ["hssc", "intermediate", "marksheet", "result", "inter"] },
    { type: "TRANSCRIPT", kws: ["transcript"] },
    { type: "DEGREE_CERTIFICATE", kws: ["degree certificate", "degree"] },
    { type: "ENROLLMENT_CERTIFICATE", kws: ["enrollment", "admission letter", "admission", "enrolment"] },
    { type: "FEE_INVOICE", kws: ["fee invoice", "voucher", "fee challan"] },
    { type: "INCOME_CERTIFICATE", kws: ["income certificate", "salary certificate"] },
    { type: "UTILITY_BILL", kws: ["utility bill", "electricity bill", "gas bill", "water bill"] },
  ];

  function inferDocTypeFromItem(item) {
    const ni = normalizeItem(item);
    for (const m of DOC_KEYWORDS) {
      for (const kw of m.kws) {
        if (ni.includes(kw)) return m.type;
      }
    }
    // direct match by upper/underscore
    const guess = String(item || "").toUpperCase().replace(/[^A-Z0-9]+/g, "_");
    if (haveDocs.has(guess)) return guess;
    return null;
  }

  const providedByStudent = useMemo(() => {
    // collect items the student reported as provided via messages like: "Provided: item"
    const set = new Set();
    for (const m of rawMessages) {
      if (m.fromRole === "student") {
        const t = String(m.text || "");
        const i = t.toLowerCase().indexOf("provided:");
        if (i >= 0) {
          const part = t.slice(i + 9).trim();
          if (part) set.add(normalizeItem(part));
        }
      }
    }
    return set;
  }, [rawMessages]);

  const requestedItemsParsed = useMemo(() => {
    // find messages from admin/field_officer that have "Missing info requested: ..."
    const items = [];
    let lastRequestText = null;
    for (const m of rawMessages) {
      if (m.fromRole === "student") continue;
      const text = String(m.text || "");
      const marker = "missing info requested:";
      const idx = text.toLowerCase().indexOf(marker);
      if (idx === -1) continue;
      lastRequestText = text;
      let rest = text.slice(idx + marker.length).trim();
      // strip trailing note
      const noteIdx = rest.toLowerCase().indexOf("note:");
      if (noteIdx >= 0) rest = rest.slice(0, noteIdx).trim();
      // strip trailing period
      if (rest.endsWith(".")) rest = rest.slice(0, -1);
      const parts = rest.split(/,|\n/).map((s) => s.trim()).filter(Boolean);
      for (const p of parts) {
        const key = normalizeItem(p);
        if (!key) continue;
        const docType = inferDocTypeFromItem(p);
        const hasDoc = docType ? haveDocs.has(docType) : false;
        const hasMsg = providedByStudent.has(key);
        const addressed = hasDoc || hasMsg;
        items.push({ label: p, key, addressed, via: hasDoc ? "document" : hasMsg ? "message" : null });
      }
    }
    // de-duplicate by key, prefer addressed
    const map = new Map();
    for (const it of items) {
      const prev = map.get(it.key);
      if (!prev || (it.addressed && !prev.addressed)) map.set(it.key, it);
    }
    const arr = Array.from(map.values());
    // attach for debug display downstream
    arr.__lastRequestText = lastRequestText;
    return arr;
  }, [rawMessages, haveDocs, providedByStudent]);

  const requestedItems = useMemo(() => {
    if (serverRequests && Array.isArray(serverRequests.items)) {
      const items = serverRequests.items.map((it) => {
        const key = normalizeItem(it.label);
        const docType = inferDocTypeFromItem(it.label);
        const hasDoc = docType ? haveDocs.has(docType) : false;
        const hasMsg = providedByStudent.has(key);
        return { label: it.label, key, addressed: hasDoc || hasMsg, via: hasDoc ? "document" : hasMsg ? "message" : null };
      });
      // de-dup by key prefer addressed
      const map = new Map();
      for (const it of items) {
        const prev = map.get(it.key);
        if (!prev || (it.addressed && !prev.addressed)) map.set(it.key, it);
      }
      const arr = Array.from(map.values());
      arr.__lastRequestText = serverRequests.lastRequestText || requestedItemsParsed.__lastRequestText;
      return arr;
    }
    return requestedItemsParsed;
  }, [serverRequests, requestedItemsParsed, haveDocs, providedByStudent]);

  async function markProvided(label) {
    const text = `Provided: ${label}`;
    await sendMessage(text);
  }

  // --- Submission ---
  const REQUIRED_DOCS = ["CNIC", "GUARDIAN_CNIC", "HSSC_RESULT", "PHOTO", "UNIVERSITY_CARD", "FEE_INVOICE", "INCOME_CERTIFICATE", "UTILITY_BILL"];

  function collectSubmissionIssues() {
    const issues = [];
    // profile completeness
    if (completeness.percent < 100) {
      issues.push(`Complete your profile fields: ${completeness.missing.join(", ")}`);
    }
    // current education minimal fields
    const s = application?.student || {};
    if (!s.currentInstitution || !s.currentCity || !s.currentCompletionYear) {
      issues.push("Fill Current Education: institution, city, completion year");
    }
    // required docs
    for (const d of REQUIRED_DOCS) {
      if (!haveDocs.has(d)) issues.push(`Upload required document: ${d.replaceAll("_"," ")}`);
    }
    // requested items addressed
    const openReq = requestedItems.filter((r) => !r.addressed);
    if (openReq.length > 0) {
      issues.push(`Address requested items: ${openReq.map((r) => r.label).join(", ")}`);
    }
    return issues;
  }

  async function submitApplication() {
    try {
      // Check if application is already submitted for review
      if (application.status === 'PENDING' || application.status === 'PROCESSING' || application.status === 'APPROVED') {
        toast.info("Application already submitted", { 
          description: `Your application is currently ${application.status.toLowerCase()}. No need to submit again.` 
        });
        return;
      }
      
      const issues = collectSubmissionIssues();
      if (issues.length > 0) {
        toast.error("Please resolve before submission", { description: issues[0] });
        return;
      }
      const res = await fetch(`${API}/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ status: "PENDING" }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Application submitted for review");
      // Optional: post a message to thread
      try {
        await fetch(`${API}/api/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({ studentId: application.studentId, applicationId: application.id, text: "Submitted application for review.", fromRole: "student" })
        });
      } catch (_) {}
    } catch (e) {
      console.error(e);
      toast.error("Failed to submit application");
    }
  }

  // --- completeness memo
  const profile = application?.student || null;
  const completeness = useMemo(
    () => computeProfileCompleteness(profile),
    [profile]
  );
  const showBanner =
    showProfileBanner &&
    user?.role === "STUDENT" &&
    completeness.percent < 100;

// ...existing code...

  
  // REPLACE THIS SECTION (around line 101-103):
  if (!application) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">My Application</h1>
        
        {/* Welcome Message for New Students */}
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start space-x-3">
            <User className="h-6 w-6 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-900">
                Welcome, {user?.name || "Student"}!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Your account has been created successfully. Complete your application to apply for funding.
              </p>
            </div>
          </div>
        </Card>

        {/* Complete Application Call-to-Action */}
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Complete Your Application
              </h3>
              <p className="text-gray-600 mt-2">
                You've successfully created your account! Now complete your application 
                with your academic details and funding requirements.
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => navigate("/apply?step=2")}  
                className="bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Complete Application
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/student/profile")}
              >
                Update Profile
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

// ...existing code...

  const isPKR = application.currency === "PKR";
  const needText = isPKR
    ? `₨ ${fmtPKR(application.needPKR)}`
    : `$ ${fmtUSD(application.needUSD)}`;

  async function saveCurrentEducation() {
    if (!token) return;
    try {
      // minimal validation
      if (!currentEdu.currentInstitution.trim() || !currentEdu.currentCity.trim()) {
        toast.error("Please fill current institution and city");
        return;
      }
      const yr = Number(currentEdu.currentCompletionYear);
      if (!yr || Number.isNaN(yr)) {
        toast.error("Please enter a valid completion year");
        return;
      }
      setSavingCurrentEdu(true);
      const res = await fetch(`${API}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          currentInstitution: currentEdu.currentInstitution || null,
          currentCity: currentEdu.currentCity || null,
          currentCompletionYear: currentEdu.currentCompletionYear
            ? Number(currentEdu.currentCompletionYear)
            : null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Current education saved");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save current education");
    } finally {
      setSavingCurrentEdu(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Application</h1>

      {/* Profile completeness banner */}
      {showBanner && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-amber-900 font-medium">
                Complete your detailed profile ({completeness.percent}%)
              </div>
              <div className="text-amber-900/80 text-sm">
                Missing: {completeness.missing.join(", ")}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate("/student/profile")}
                className="rounded-2xl"
              >
                Complete Profile
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => setShowProfileBanner(false)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Application header */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{application.student.name}</h2>
            <p className="text-sm text-slate-600">
              {application.student.program} · {application.student.university}
            </p>
          </div>
          <Badge
            variant={
              application.status === "APPROVED"
                ? "default"
                : application.status === "PENDING"
                ? "secondary"
                : "outline"
            }
          >
            {application.status}
          </Badge>
        </div>

        <div className="text-sm text-slate-700 space-y-1">
          <p>
            <strong>Need:</strong> {needText}
          </p>
          <p>
            <strong>Term:</strong> {application.term}
          </p>
          <p>
            <strong>Submitted:</strong>{" "}
            {new Date(application.submittedAt).toLocaleDateString()}
          </p>
        </div>
      </Card>

      {/* Enhanced Messages Section */}
      <Card className="p-6 space-y-4 border-l-4 border-blue-400 bg-blue-50">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-blue-800">💬 Messages from Awake</h3>
          {rawMessages.length > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {rawMessages.length} message{rawMessages.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        {rawMessages.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <MessageCircle className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Messages from admins will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rawMessages.map((message, idx) => (
              <div
                key={message.id || idx}
                className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="h-4 w-4" />
                      <span className="font-medium">
                        {message.fromRole === 'admin' || message.fromRole === 'field_officer' ? 'Admin' : 'Student'}
                      </span>
                      <span>•</span>
                      <span>{message.createdAt ? new Date(message.createdAt).toLocaleDateString() : 'Recent'}</span>
                      {(message.fromRole === 'admin' || message.fromRole === 'field_officer') && (
                        <Badge variant="outline" className="ml-2 text-xs bg-blue-50 border-blue-200 text-blue-700">
                          Official
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {message.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Action Required - Requests from Admin/Sub Admin */}
      {requestedItems.length > 0 && (
        <Card className="p-6 space-y-4 border-l-4 border-amber-400 bg-amber-50">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-amber-800 animate-pulse">⚠️ Action Required - Requests from Admin/Sub Admin</h3>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {requestedItems.length} request{requestedItems.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {requestedItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-amber-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Admin Request</span>
                      <Badge variant="outline" className="ml-2 text-xs bg-amber-50 border-amber-200 text-amber-700">
                        Urgent
                      </Badge>
                    </div>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                      {item.label}
                    </p>
                    {item.description && (
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Documents */}
      <Card className="p-6 space-y-4">
        {(() => {
          // Combine all document types: required + optional
          const allRequiredDocTypes = [...REQUIRED_DOCS, ...currentDocChecklist.map(item => item.key)];
          const completedRequiredDocs = allRequiredDocTypes.filter(docType => haveDocs.has(docType));
          const totalDocs = docs.length;
          
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Documents</h3>
                <div className="text-sm text-slate-600">
                  {completedRequiredDocs.length}/{allRequiredDocTypes.length} required • {totalDocs} total uploaded
                </div>
              </div>

              <div id="document-uploader-anchor" />
              <DocumentUploader
                studentId={application.studentId}
                applicationId={application.id}
                preferredType={preferredUploadType || undefined}
                onUploaded={(doc) => {
                  setDocs((prev) => [doc, ...prev]);
                  setPreferredUploadType(null);
                }}
              />

              {/* Unified Document List */}
              <div className="space-y-2">
                {loadingDocs ? (
                  <p className="text-sm text-slate-500">Loading documents…</p>
                ) : (
                  <>
                    {/* Required Documents */}
                    <div className="text-sm font-medium text-slate-700 mb-2">Required Documents</div>
                    {REQUIRED_DOCS.map((docType) => {
                      const uploaded = docs.find(d => d.type === docType);
                      const isUploaded = !!uploaded;
                      
                      return (
                        <div
                          key={docType}
                          className="flex items-center justify-between rounded-md border p-3 text-sm bg-white"
                        >
                          <div className="flex items-center gap-3">
                            {isUploaded ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div className="font-medium">{docType.replaceAll("_", " ")}</div>
                              {isUploaded ? (
                                <a
                                  href={`${API}${uploaded.url}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-700 hover:underline text-xs"
                                >
                                  📄 {uploaded.originalName || 'Download'}
                                </a>
                              ) : (
                                <span className="text-amber-600 text-xs">⚠️ Required - Please upload</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!isUploaded && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-2xl"
                                onClick={() => {
                                  setPreferredUploadType(docType);
                                  const anchor = document.getElementById("document-uploader-anchor");
                                  if (anchor) {
                                    anchor.scrollIntoView({ behavior: "smooth", block: "start" });
                                  }
                                }}
                              >
                                Upload
                              </Button>
                            )}
                            {isUploaded && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-2xl"
                                onClick={() => deleteDoc(uploaded.id)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Optional Documents */}
                    <div className="text-sm font-medium text-slate-700 mb-2 mt-4">Optional Documents</div>
                    {currentDocChecklist.map((item) => {
                      const uploaded = docs.find(d => d.type === item.key);
                      const isUploaded = !!uploaded;
                      
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between rounded-md border p-3 text-sm bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            {isUploaded ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div className="font-medium">{item.label}</div>
                              {isUploaded ? (
                                <a
                                  href={`${API}${uploaded.url}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-700 hover:underline text-xs"
                                >
                                  📄 {uploaded.originalName || 'Download'}
                                </a>
                              ) : (
                                <span className="text-slate-500 text-xs">Optional document</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!isUploaded && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-2xl"
                                onClick={() => {
                                  setPreferredUploadType(item.key);
                                  const anchor = document.getElementById("document-uploader-anchor");
                                  if (anchor) {
                                    anchor.scrollIntoView({ behavior: "smooth", block: "start" });
                                  }
                                }}
                              >
                                Upload
                              </Button>
                            )}
                            {isUploaded && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-2xl"
                                onClick={() => deleteDoc(uploaded.id)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Additional Uploaded Documents (not in required/optional lists) */}
                    {(() => {
                      const knownTypes = new Set([...REQUIRED_DOCS, ...currentDocChecklist.map(item => item.key)]);
                      const additionalDocs = docs.filter(d => !knownTypes.has(d.type));
                      
                      if (additionalDocs.length === 0) return null;
                      
                      return (
                        <>
                          <div className="text-sm font-medium text-slate-700 mb-2 mt-4">Additional Documents</div>
                          {additionalDocs.map((d) => (
                            <div
                              key={d.id}
                              className="flex items-center justify-between rounded-md border p-3 text-sm bg-blue-50"
                            >
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="font-medium">{d.type.replaceAll("_", " ")}</div>
                                  <a
                                    href={`${API}${d.url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-700 hover:underline text-xs"
                                  >
                                    📄 {d.originalName || 'Download'}
                                  </a>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-2xl"
                                onClick={() => deleteDoc(d.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </Card>

      {/* Current Education Details */}
      <Card className="p-6 space-y-4">
        <h3 className="font-medium">Current Education (if different from target)</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <Input
            placeholder="Current Institution"
            value={currentEdu.currentInstitution}
            onChange={(e) => setCurrentEdu({ ...currentEdu, currentInstitution: e.target.value })}
          />
          <Input
            placeholder="Current City"
            value={currentEdu.currentCity}
            onChange={(e) => setCurrentEdu({ ...currentEdu, currentCity: e.target.value })}
          />
          <Input
            placeholder="Completion Year"
            type="number"
            value={currentEdu.currentCompletionYear}
            onChange={(e) => setCurrentEdu({ ...currentEdu, currentCompletionYear: e.target.value })}
          />
        </div>
        <div className="text-sm text-slate-600">
          You can upload certificates and transcripts under Documents using these types: TRANSCRIPT, DEGREE_CERTIFICATE, ENROLLMENT_CERTIFICATE.
        </div>
        <div className="flex justify-end">
          <Button onClick={saveCurrentEducation} disabled={savingCurrentEdu} className="rounded-2xl">
            {savingCurrentEdu ? "Saving..." : "Save Current Education"}
          </Button>
        </div>
      </Card>

      {/* Old section removed - now using enhanced Action Required section above */}
      {false && <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Requests from Admin/Field Officer</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{requestedItems.filter(r=>!r.addressed).length} open</Badge>
            <Button variant="outline" size="sm" className="rounded-2xl" onClick={reloadMessages} disabled={reloadingMsgs}>
              {reloadingMsgs ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        </div>
        {requestedItems.length === 0 ? (
          <p className="text-sm text-slate-600">No outstanding requests.</p>
        ) : (
          <div className="space-y-2">
            {requestedItems.map((r) => (
              <div key={r.key} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <div className="flex items-center gap-2">
                  {r.addressed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-400" />
                  )}
                  <div>
                    <div className="font-medium">{r.label}</div>
                    {r.addressed && (
                      <div className="text-xs text-slate-500">Addressed via {r.via}</div>
                    )}
                  </div>
                </div>
                {!r.addressed && (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-2xl"
                      onClick={() => {
                        const dt = inferDocTypeFromItem(r.label);
                        if (dt) setPreferredUploadType(dt);
                        const anchor = document.getElementById("document-uploader-anchor");
                        if (anchor && typeof anchor.scrollIntoView === "function") {
                          anchor.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }}
                    >
                      Upload document
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => markProvided(r.label)}>I’ve provided this</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {requestedItems.__lastRequestText && (
          <div className="text-xs text-slate-500">Last request message: {requestedItems.__lastRequestText}</div>
        )}
      </Card>}

      {/* Submit */}
      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Submit Application</div>
            <div className="text-sm text-slate-600">We’ll check your profile, required documents, and any requested items before sending it for review.</div>
          </div>
          <Button className="rounded-2xl" onClick={submitApplication}>Submit for Review</Button>
        </div>
        <ul className="text-sm text-slate-600 list-disc pl-5">
          <li>Profile complete: {completeness.percent}%</li>
          <li>Required documents: {REQUIRED_DOCS.filter(d=>haveDocs.has(d)).length}/{REQUIRED_DOCS.length}</li>
          <li>Open requests: {requestedItems.filter(r=>!r.addressed).length}</li>
        </ul>
      </Card>
    </div>
  );
};
