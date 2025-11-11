// src/pages/AdminApplications.jsx
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { API } from "@/lib/api";
import { fmtAmount } from "@/lib/currency";
import StudentPhoto from "@/components/StudentPhoto";

export const AdminApplications = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [apps, setApps] = useState([]);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  // docs state
  const [expandedId, setExpandedId] = useState(null);
  const [docsByRow, setDocsByRow] = useState({}); // app.id -> documents[]
  const [loadingDocsId, setLoadingDocsId] = useState(null);

  // sub admin assignment state
  const [officers, setOfficers] = useState([]);
  const [assigningId, setAssigningId] = useState(null);

  // --- helpers ---
  const fmtUSD = (n) =>
    Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const fmtPKR = (n) =>
    Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 });

  // Robust URL join for documents (handles absolute and relative URLs)
  function docHref(url) {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    // server returns /uploads/filename — prefix with API
    return `${API.baseURL}${url}`;
  }

  // ---------------------------
  // Load applications (polling)
  // ---------------------------
  useEffect(() => {
    if (!isAdmin) return;
    let dead = false;
    let timer;

    async function load() {
      try {
        const res = await fetch(`${API.baseURL}/api/applications?limit=500`, {
          headers: { ...authHeader },
        });

        if (res.status === 401) {
          toast.error("Your session expired. Please sign in again.");
          logout?.();
          return;
        }

        const data = await res.json();
        const list = Array.isArray(data?.applications)
          ? data.applications
          : Array.isArray(data)
          ? data
          : [];

        // add editable fields locally
        const withLocal = list.map((a) => ({
          ...a,
          _status: a.status,
          _notes: a.notes ?? "",
        }));
        if (!dead) setApps(withLocal);

        // Load officers list (for sub admin assignment)
        try {
          const ofRes = await fetch(`${API.baseURL}/api/users?role=SUB_ADMIN`, { headers: { ...authHeader } });
          if (ofRes.ok) {
            const ofData = await ofRes.json();
            if (!dead) setOfficers(Array.isArray(ofData?.users) ? ofData.users : []);
          }
        } catch (e) {
          console.error("Failed to load officers:", e);
        }
      } catch (e) {
        console.error(e);
        if (!dead) setApps([]);
      } finally {
        timer = setTimeout(load, 15000);
      }
    }

    load();
    return () => {
      dead = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, token]);

  // ---------------------------
  // Save row changes
  // ---------------------------
  async function save(id, body) {
    try {
      setSavingId(id);
      const res = await fetch(`${API.baseURL}/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        toast.error("Your session expired. Please sign in again.");
        logout?.();
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const updated = await res.json();

      setApps((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                ...updated,
                _status: updated.status,
                _notes: updated.notes ?? "",
              }
            : a
        )
      );
      toast.success("Application updated.");
    } catch (err) {
      console.error(err);
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  }

  // ---------------------------
  // Assign Sub Admin
  // ---------------------------
  async function assignSubAdmin(applicationId, studentId, officerId) {
    try {
      setAssigningId(applicationId);
      const res = await fetch(`${API.baseURL}/api/field-reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ applicationId, studentId, officerUserId: officerId })
      });

      if (!res.ok) {
        const errorData = await res.text();
        let errorMessage = errorData;
        
        // Handle specific duplicate assignment error
        if (res.status === 400 && errorData.includes("already assigned")) {
          errorMessage = "This application is already assigned to the selected sub admin.";
        }
        
        throw new Error(errorMessage || `HTTP ${res.status}`);
      }

      toast.success("Sub Admin assigned successfully!");
      
      // Immediately update the local state to reflect assignment
      const assignedOfficer = officers.find(o => o.id === officerId);
      setApps((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { 
                ...app, 
                fieldReviews: [
                  ...app.fieldReviews,
                  {
                    id: `temp-${Date.now()}`, // Temporary ID until next refresh
                    officerUserId: officerId,
                    status: "PENDING",
                    applicationId,
                    studentId
                  }
                ]
              }
            : app
        )
      );
    } catch (err) {
      console.error(err);
      // Show more user-friendly error messages
      if (err.message.includes("already assigned")) {
        toast.warning("Application Already Assigned", {
          description: "This application is already assigned to the selected sub admin."
        });
      } else {
        toast.error(`Assignment failed: ${err.message}`);
      }
    } finally {
      setAssigningId(null);
    }
  }

  // ---------------------------
  // Reassign Sub Admin
  // ---------------------------
  async function reassignSubAdmin(reviewId, newOfficerId, applicationId) {
    try {
      setAssigningId(`reassign-${reviewId}`);
      const res = await fetch(`${API.baseURL}/api/field-reviews/${reviewId}/reassign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ newOfficerUserId: newOfficerId })
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || `HTTP ${res.status}`);
      }

      const newOfficer = officers.find(o => o.id === newOfficerId);
      toast.success(`Application reassigned to ${newOfficer?.name || newOfficer?.email}!`);
      
      // Immediately update the local state to reflect reassignment
      setApps((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { 
                ...app, 
                fieldReviews: app.fieldReviews.map(fr => 
                  fr.id === reviewId 
                    ? { ...fr, officerUserId: newOfficerId, status: "PENDING" }
                    : fr
                )
              }
            : app
        )
      );
    } catch (err) {
      console.error(err);
      toast.error(`Reassignment failed: ${err.message}`);
    } finally {
      setAssigningId(null);
    }
  }

  // ---------------------------
  // Unassign Sub Admin
  // ---------------------------
  async function unassignSubAdmin(reviewId, applicationId) {
    try {
      setAssigningId(applicationId);
      const res = await fetch(`${API.baseURL}/api/field-reviews/${reviewId}`, {
        method: "DELETE",
        headers: { ...authHeader }
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || `HTTP ${res.status}`);
      }

      toast.success("Application unassigned successfully!");
      
      // Immediately update the local state to reflect unassignment
      setApps((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { ...app, fieldReviews: [] } // Clear field reviews to show unassigned
            : app
        )
      );
    } catch (err) {
      console.error(err);
      toast.error(`Unassignment failed: ${err.message}`);
    } finally {
      setAssigningId(null);
    }
  }

  // ---------------------------
  // Load documents for a row
  // ---------------------------
  async function toggleDocs(row) {
    if (expandedId === row.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(row.id);

    if (docsByRow[row.id]) return; // cached

    try {
      setLoadingDocsId(row.id);
      const url = new URL(`${API.baseURL}/api/uploads`);
      url.searchParams.set("studentId", row.studentId);
      if (row.id) url.searchParams.set("applicationId", row.id);

      const res = await fetch(url, { headers: { ...authHeader } });

      if (res.status === 401) {
        toast.error("Your session expired. Please sign in again.");
        logout?.();
        return;
      }

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const docs = Array.isArray(data?.documents) ? data.documents : [];
      setDocsByRow((m) => ({ ...m, [row.id]: docs }));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load documents");
    } finally {
      setLoadingDocsId(null);
    }
  }

  // ---------------------------
  // Search / filter
  // ---------------------------
  const filtered = useMemo(() => {
    const t = query.toLowerCase();
    
    // First filter by status based on active tab
    let statusFiltered = apps;
    if (activeTab === "pending") {
      statusFiltered = apps.filter(a => a.status === "PENDING");
    } else if (activeTab === "approved") {
      // Exclude sponsored students from approved tab
      statusFiltered = apps.filter(a => a.status === "APPROVED" && !(a.student?.sponsored === true || (a.sponsorships && a.sponsorships.length > 0)));
    } else if (activeTab === "rejected") {
      statusFiltered = apps.filter(a => a.status === "REJECTED");
    } else if (activeTab === "sponsored") {
      statusFiltered = apps.filter(a => a.student?.sponsored === true || (a.sponsorships && a.sponsorships.length > 0));
    }
    // "all" tab shows everything
    
    // Then filter by search query
    return statusFiltered.filter((a) => {
      const s = a.student || {};
      return (
        !t ||
        s.name?.toLowerCase().includes(t) ||
        s.university?.toLowerCase().includes(t) ||
        a.term?.toLowerCase().includes(t)
      );
    });
  }, [apps, query, activeTab]);

  // Statistics for tab badges
  const stats = useMemo(() => ({
    all: apps.length,
    pending: apps.filter(a => a.status === "PENDING").length,
    approved: apps.filter(a => a.status === "APPROVED" && !(a.student?.sponsored === true || (a.sponsorships && a.sponsorships.length > 0))).length,
    rejected: apps.filter(a => a.status === "REJECTED").length,
    sponsored: apps.filter(a => a.student?.sponsored === true || (a.sponsorships && a.sponsorships.length > 0)).length,
  }), [apps]);

  if (!isAdmin) {
    return (
      <Card className="p-6">
        <p className="text-gray-700">Admins only.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Applications Management</h1>
        <Input
          placeholder="Search by student, term, university…"
          className="w-full sm:w-80 rounded-2xl min-h-[44px]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1">
          <TabsTrigger value="pending" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm p-2">
            <span>Pending Review</span>
            {stats.pending > 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm p-2">
            <span>Approved</span>
            {stats.approved > 0 && (
              <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                {stats.approved}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm p-2">
            <span>Rejected</span>
            {stats.rejected > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stats.rejected}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm p-2">
            <span>All Applications</span>
            {stats.all > 0 && (
              <Badge variant="outline" className="text-xs">
                {stats.all}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sponsored" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm p-2">
            <span>Sponsored</span>
            {stats.sponsored > 0 && (
              <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                {stats.sponsored}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>

      <Card className="divide-y">
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-3 px-4 py-3 text-sm font-medium text-gray-600">
          <div className="lg:col-span-3">Student</div>
          <div className="lg:col-span-2 hidden lg:block">Term</div>
          <div className="lg:col-span-2 hidden lg:block">Need</div>
          <div className="lg:col-span-3 hidden lg:block">Status / Notes</div>
          <div className="lg:col-span-1 hidden lg:block text-right pr-2">Actions</div>
        </div>

        {filtered.map((row) => {
          const needText = fmtAmount(row.amount, row.currency);
          const docs = docsByRow[row.id] || [];

          return (
            <div key={row.id} className="px-4 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 lg:gap-3 items-start">
                {/* Student */}
                <div className="col-span-1 lg:col-span-3">
                  <div className="flex items-center gap-3 mb-2">
                    <StudentPhoto 
                      student={row.student} 
                      size="small" 
                      clickable={true}
                    />
                    <div>
                      <div className="font-medium">{row.student?.name}</div>
                      <div className="text-sm text-slate-600">
                        {row.student?.program} · {row.student?.university}
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant="secondary">
                      GPA {row.student?.gpa ?? "-"}
                    </Badge>
                    
                    {/* Field Review Status Badge */}
                    {row.fieldReviews && row.fieldReviews.length > 0 && (
                      (() => {
                        const latestReview = row.fieldReviews[0]; // Most recent due to orderBy desc
                        const status = latestReview.status;
                        const recommendation = latestReview.fielderRecommendation;
                        
                        if (status === "COMPLETED") {
                          const bgColor = recommendation === "STRONGLY_APPROVE" ? "bg-green-600" :
                                         recommendation === "APPROVE" ? "bg-blue-600" :
                                         recommendation === "CONDITIONAL" ? "bg-yellow-600" :
                                         recommendation === "REJECT" ? "bg-red-600" : "bg-gray-600";
                          
                          return (
                            <Badge className={`text-white text-xs ${bgColor}`}>
                              🏢 {recommendation?.replace('_', ' ') || 'APPROVED'}
                            </Badge>
                          );
                        } else if (status === "IN_PROGRESS") {
                          return (
                            <Badge className="bg-orange-500 text-white text-xs">
                              🔄 In Review
                            </Badge>
                          );
                        } else if (status === "PENDING") {
                          return (
                            <Badge className="bg-amber-500 text-white text-xs">
                              ⏳ Assigned
                            </Badge>
                          );
                        }
                      })()
                    )}
                    
                    {/* Sub Admin Assignment */}
                    {(!row.fieldReviews || row.fieldReviews.length === 0) ? (
                      <div className="flex items-center gap-2">
                        <select 
                          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                          disabled={assigningId === row.id}
                          onChange={(e) => {
                            if (e.target.value) {
                              assignSubAdmin(row.id, row.studentId, e.target.value);
                              e.target.value = ""; // Reset selection
                            }
                          }}
                        >
                          <option value="">👤 Assign Sub Admin...</option>
                          {officers.map(officer => (
                            <option key={officer.id} value={officer.id}>
                              {officer.name || officer.email}
                            </option>
                          ))}
                        </select>
                        {assigningId === row.id && (
                          <span className="text-xs text-slate-500">Assigning...</span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-xs text-slate-600">
                          Assigned to: {row.fieldReviews.map(fr => {
                            const officer = officers.find(o => o.id === fr.officerUserId);
                            return officer?.name || officer?.email || 'Unknown Officer';
                          }).join(', ')}
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Reassign Dropdown */}
                          <select 
                            className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white"
                            disabled={assigningId === row.id || assigningId === `reassign-${row.fieldReviews[0]?.id}`}
                            onChange={(e) => {
                              if (e.target.value) {
                                reassignSubAdmin(row.fieldReviews[0].id, e.target.value, row.id);
                                e.target.value = ""; // Reset selection
                              }
                            }}
                          >
                            <option value="">🔄 Reassign...</option>
                            {officers.filter(o => o.id !== row.fieldReviews[0]?.officerUserId).map(officer => (
                              <option key={officer.id} value={officer.id}>
                                {officer.name || officer.email}
                              </option>
                            ))}
                          </select>
                          
                          {/* Unassign Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-0.5 h-6"
                            disabled={assigningId === row.id || assigningId === `reassign-${row.fieldReviews[0]?.id}`}
                            onClick={() => unassignSubAdmin(row.fieldReviews[0].id, row.id)}
                          >
                            ❌ Unassign
                          </Button>
                          
                          {(assigningId === row.id || assigningId === `reassign-${row.fieldReviews[0]?.id}`) && (
                            <span className="text-xs text-slate-500">Processing...</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Term */}
                <div className="lg:col-span-2 pt-1">
                  <span className="lg:hidden font-medium text-slate-700">Term: </span>
                  {row.term}
                </div>

                {/* Need */}
                <div className="lg:col-span-2 pt-1">
                  <span className="lg:hidden font-medium text-slate-700">Need: </span>
                  {needText}
                </div>

                {/* Status & Notes */}
                <div className="lg:col-span-3 space-y-2">
                  <select
                    className="w-full rounded-2xl border px-3 py-2 text-sm"
                    value={row._status}
                    onChange={(e) =>
                      setApps((prev) =>
                        prev.map((a) =>
                          a.id === row.id ? { ...a, _status: e.target.value } : a
                        )
                      )
                    }
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>

                  <textarea
                    className="w-full rounded-2xl border px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Notes (optional)"
                    value={row._notes}
                    onChange={(e) =>
                      setApps((prev) =>
                        prev.map((a) =>
                          a.id === row.id ? { ...a, _notes: e.target.value } : a
                        )
                      )
                    }
                  />
                </div>

                {/* Actions */}
                <div className="col-span-1 lg:col-span-1 flex flex-col gap-2 items-stretch justify-start mt-3 lg:mt-0 lg:ml-2 lg:mr-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 font-medium text-sm w-full"
                    onClick={() => navigate(`/admin/applications/${row.id}`)}
                  >
                    View Profile
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toggleDocs(row)}
                    className="border-green-600 text-green-700 hover:bg-green-50 px-3 py-2 font-medium text-sm w-full"
                  >
                    {expandedId === row.id ? "Hide Docs" : "Docs"}
                    {loadingDocsId === row.id
                      ? "…"
                      : docs.length
                      ? ` (${docs.length})`
                      : ""}
                  </Button>
                </div>
              </div>

              {/* Docs panel */}
              {expandedId === row.id && (
                <div className="mt-3 rounded-md border bg-gray-50 p-3">
                  {loadingDocsId === row.id ? (
                    <p className="text-sm text-slate-600">Loading documents…</p>
                  ) : docs.length === 0 ? (
                    <p className="text-sm text-slate-600">
                      No documents uploaded.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {docs.map((d) => (
                        <div
                          key={d.id}
                          className="bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <a
                              href={docHref(d.url)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-green-700 hover:underline font-medium text-sm"
                            >
                              📁 {d.originalName || d.url}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
