// src/pages/AdminApplications.jsx
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

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
    return `${API}${url}`;
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
        const res = await fetch(`${API}/api/applications?limit=500`, {
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
          _fxRate: a.fxRate ?? "",
          _notes: a.notes ?? "",
        }));
        if (!dead) setApps(withLocal);
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
      const res = await fetch(`${API}/api/applications/${id}`, {
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
                _fxRate: updated.fxRate ?? "",
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

  function saveEdits(row) {
    const payload = {
      status: row._status,
      notes: row._notes || null,
      fxRate:
        row._fxRate === "" || row._fxRate === null
          ? null
          : Number(row._fxRate),
    };
    save(row.id, payload);
  }

  function approve(row) {
    save(row.id, { status: "APPROVED", notes: row._notes || null });
  }

  function reject(row) {
    save(row.id, { status: "REJECTED", notes: row._notes || null });
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
      const url = new URL(`${API}/api/uploads`);
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
      statusFiltered = apps.filter(a => a.status === "APPROVED");
    } else if (activeTab === "rejected") {
      statusFiltered = apps.filter(a => a.status === "REJECTED");
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
    approved: apps.filter(a => a.status === "APPROVED").length,
    rejected: apps.filter(a => a.status === "REJECTED").length,
  }), [apps]);

  if (!isAdmin) {
    return (
      <Card className="p-6">
        <p className="text-slate-700">Admins only.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Applications Management</h1>
        <Input
          placeholder="Search by student, term, university…"
          className="w-80 rounded-2xl"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            Pending Review
            {stats.pending > 0 && (
              <Badge variant="secondary" className="ml-1 bg-orange-100 text-orange-800">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            Approved
            {stats.approved > 0 && (
              <Badge variant="default" className="ml-1 bg-emerald-100 text-emerald-800">
                {stats.approved}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            Rejected
            {stats.rejected > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats.rejected}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            All Applications
            {stats.all > 0 && (
              <Badge variant="outline" className="ml-1">
                {stats.all}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>

      <Card className="divide-y">
        <div className="grid grid-cols-12 gap-3 px-4 py-3 text-sm font-medium text-slate-600">
          <div className="col-span-3">Student</div>
          <div className="col-span-2">Term</div>
          <div className="col-span-2">Need</div>
          <div className="col-span-3">Status / Notes</div>
          <div className="col-span-1">FX</div>
          <div className="col-span-1 text-right pr-2">Actions</div>
        </div>

        {filtered.map((row) => {
          const busy = savingId === row.id;
          const isPKR = row.currency === "PKR";
          const needText = isPKR
            ? `₨ ${fmtPKR(row.needPKR)}`
            : `$ ${fmtUSD(row.needUSD)}`;
          const docs = docsByRow[row.id] || [];

          return (
            <div key={row.id} className="px-4 py-4">
              <div className="grid grid-cols-12 gap-3 items-start">
                {/* Student */}
                <div className="col-span-3">
                  <div className="font-medium">{row.student?.name}</div>
                  <div className="text-sm text-slate-600">
                    {row.student?.program} · {row.student?.university}
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
                              🏢 {recommendation?.replace('_', ' ') || 'REVIEWED'}
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
                    
                    {/* No Field Review Badge */}
                    {(!row.fieldReviews || row.fieldReviews.length === 0) && (
                      <Badge variant="outline" className="text-xs border-gray-300">
                        👤 No Sub Admin
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Term */}
                <div className="col-span-2 pt-1">{row.term}</div>

                {/* Need */}
                <div className="col-span-2 pt-1">{needText}</div>

                {/* Status & Notes */}
                <div className="col-span-3 space-y-2">
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

                {/* FX */}
                <div className="col-span-1">
                  <Input
                    placeholder="e.g. 278.50"
                    value={row._fxRate}
                    onChange={(e) =>
                      setApps((prev) =>
                        prev.map((a) =>
                          a.id === row.id ? { ...a, _fxRate: e.target.value } : a
                        )
                      )
                    }
                    className="rounded-2xl"
                  />
                </div>

                {/* Actions */}
                <div className="col-span-1 flex flex-col gap-2 items-end pr-2">
                  <Button
                    variant="secondary"
                    onClick={() => saveEdits(row)}
                    disabled={busy}
                    className="rounded-2xl"
                  >
                    {busy ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-2xl text-emerald-700"
                    onClick={() => navigate(`/admin/applications/${row.id}`)}
                  >
                    View full profile
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => reject(row)}
                      disabled={busy}
                      className="rounded-2xl"
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => approve(row)}
                      disabled={busy}
                      className="rounded-2xl"
                    >
                      Approve
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => toggleDocs(row)}
                    className="rounded-2xl text-emerald-700"
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
                <div className="mt-3 rounded-md border bg-slate-50 p-3">
                  {loadingDocsId === row.id ? (
                    <p className="text-sm text-slate-600">Loading documents…</p>
                  ) : docs.length === 0 ? (
                    <p className="text-sm text-slate-600">
                      No documents uploaded.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {docs.map((d) => (
                        <li
                          key={d.id}
                          className="flex items-center justify-between text-sm bg-white border rounded-md px-3 py-2"
                        >
                          <div>
                            <div className="font-medium">
                              {d.type.replaceAll("_", " ")}
                            </div>
                            <a
                              href={docHref(d.url)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 hover:underline"
                            >
                              {d.originalName || d.url}
                            </a>
                          </div>
                          <span className="text-slate-500">
                            {(d.size || 0).toLocaleString()} bytes
                          </span>
                        </li>
                      ))}
                    </ul>
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
