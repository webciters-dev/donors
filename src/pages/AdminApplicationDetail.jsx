import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

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
  const [officers, setOfficers] = useState([]);
  const [missingItems, setMissingItems] = useState("");
  const [missingNote, setMissingNote] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // load application with student
        const res = await fetch(`${API}/api/applications/${id}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setApp(data);

        // docs
        const url = new URL(`${API}/api/uploads`);
        url.searchParams.set("studentId", data.studentId);
        url.searchParams.set("applicationId", data.id);
        const dres = await fetch(url, { headers: { ...authHeader } });
        const dj = await dres.json();
        setDocs(Array.isArray(dj?.documents) ? dj.documents : []);

        // field reviews
        const rres = await fetch(`${API}/api/field-reviews`, { headers: { ...authHeader } });
        const rj = await rres.json();
        const mine = Array.isArray(rj?.reviews) ? rj.reviews.filter(r => r.applicationId === id) : [];
        setReviews(mine);

        // officers list (admin-only)
        if (user?.role === "ADMIN") {
          const ofres = await fetch(`${API}/api/users?role=FIELD_OFFICER`, { headers: { ...authHeader } });
          if (ofres.ok) {
            const ofj = await ofres.json();
            setOfficers(Array.isArray(ofj?.users) ? ofj.users : []);
          }
        }

        // messages
        const murl = new URL(`${API}/api/messages`);
        murl.searchParams.set("studentId", data.studentId);
        murl.searchParams.set("applicationId", data.id);
        const mres = await fetch(murl);
        const mj = await mres.json();
        setMessages(Array.isArray(mj?.messages) ? mj.messages : []);
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
      if (!assignOfficer) { toast.error("Select a field officer"); return; }
      const res = await fetch(`${API}/api/field-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ applicationId: app.id, studentId: app.studentId, officerUserId: assignOfficer })
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      setReviews(prev => [j.review, ...prev]);
      toast.success("Assigned to field officer");
    } catch (e) {
      console.error(e);
      toast.error("Failed to assign");
    }
  }

  async function requestMissing(reviewId) {
    try {
      const items = missingItems.split(/\n|,/).map(s => s.trim()).filter(Boolean);
      if (items.length === 0) {
        toast.error("Please list at least one missing item");
        return;
      }
      const res = await fetch(`${API}/api/field-reviews/${reviewId}/request-missing`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ items, note: missingNote })
      });
      if (!res.ok) throw new Error(await res.text());
      setMissingItems("");
      setMissingNote("");
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
      const res = await fetch(`${API}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ studentId: app.studentId, applicationId: app.id, text, fromRole: "admin" })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setNewMessage("");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send message", { description: String(e.message || "") });
    }
  }

  if (!app) return <Card className="p-6">Loading…</Card>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Application Detail</h1>
        <Button variant="outline" className="rounded-2xl" onClick={() => navigate(-1)}>Back</Button>
      </div>

      {/* Summary */}
      <Card className="p-6 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{app.student?.name}</div>
            <div className="text-sm text-slate-600">{app.student?.program} · {app.student?.university}</div>
          </div>
          <Badge>{app.status}</Badge>
        </div>
        <div className="text-sm text-slate-700">Profile completeness: {completeness.percent}%</div>
      </Card>

      {/* Student Details */}
      <Card className="p-6">
        <div className="font-medium mb-3">Student details</div>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-slate-500">Email</div>
            <div>{app.student?.email || "-"}</div>
          </div>
          <div>
            <div className="text-slate-500">Gender</div>
            <div>{app.student?.gender || "-"}</div>
          </div>
          <div>
            <div className="text-slate-500">City / Province</div>
            <div>{[app.student?.city, app.student?.province].filter(Boolean).join(", ") || "-"}</div>
          </div>
          <div>
            <div className="text-slate-500">GPA</div>
            <div>{app.student?.gpa ?? "-"}</div>
          </div>
          <div>
            <div className="text-slate-500">Expected Graduation</div>
            <div>{app.student?.gradYear ?? "-"}</div>
          </div>
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
            <div>{app.student?.currentCompletionYear ?? "-"}</div>
          </div>
        </div>
      </Card>

      {/* Documents */}
      <Card className="p-6 space-y-3">
        <div className="font-medium">Documents ({docs.length})</div>
        {docs.length === 0 ? (
          <div className="text-sm text-slate-600">No documents uploaded.</div>
        ) : (
          <ul className="space-y-2">
            {docs.map(d => (
              <li key={d.id} className="flex items-center justify-between text-sm border rounded-md p-2">
                <div>
                  <div className="font-medium">{d.type.replaceAll("_"," ")}</div>
                  <a href={`${API}${d.url}`} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">{d.originalName || d.url}</a>
                </div>
                <span className="text-slate-500">{(d.size||0).toLocaleString()} bytes</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Field Officer Assignment & Actions */}
      <Card className="p-6 space-y-4">
        <div className="font-medium">Field Officer Review</div>
        <div className="grid md:grid-cols-3 gap-2 items-center">
          <select className="rounded-2xl border px-3 py-2 text-sm" value={assignOfficer} onChange={(e)=>setAssignOfficer(e.target.value)}>
            <option value="">Select field officer…</option>
            {officers.map(o => (
              <option key={o.id} value={o.id}>{o.name || o.email} ({o.role})</option>
            ))}
          </select>
          <Button className="rounded-2xl" onClick={createAssignment}>Assign</Button>
        </div>

        <div className="space-y-2">
          {reviews.map(r => (
            <div key={r.id} className="border rounded-md p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>Review #{r.id.slice(0,6)} — <Badge variant="secondary">{r.status}</Badge> {r.recommendation ? <span className="ml-2">({r.recommendation})</span> : null}</div>
                <div className="text-slate-500">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <div className="mt-2 text-slate-700 whitespace-pre-wrap">{r.notes || "No notes yet."}</div>
              <div className="mt-3 grid md:grid-cols-2 gap-2">
                <textarea className="rounded-2xl border px-3 py-2 text-sm" rows={3} placeholder="Missing items (comma or newline separated)" value={missingItems} onChange={(e)=>setMissingItems(e.target.value)} />
                <textarea className="rounded-2xl border px-3 py-2 text-sm" rows={3} placeholder="Note to student (optional)" value={missingNote} onChange={(e)=>setMissingNote(e.target.value)} />
              </div>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" className="rounded-2xl" onClick={()=>requestMissing(r.id)}>Request Missing Info</Button>
              </div>
            </div>
          ))}
          {reviews.length === 0 && <div className="text-sm text-slate-600">No field officer assigned yet.</div>}
        </div>
      </Card>

      {/* Messages */}
      <Card className="p-6 space-y-3">
        <div className="font-medium">Conversation</div>
        {messages.length === 0 ? (
          <div className="text-sm text-slate-600">No messages yet.</div>
        ) : (
          <ul className="space-y-2">
            {messages.map(m => (
              <li key={m.id} className="text-sm border rounded-md p-2 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{m.fromRole}</Badge>
                    <span className="text-slate-800">{m.text}</span>
                  </div>
                  <span className="text-slate-500">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
              </li>
            ))}
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
