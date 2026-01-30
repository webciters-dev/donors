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
import { fmtAmount, fmtAmountDual } from "@/lib/currency";
import StudentPhoto from "@/components/StudentPhoto";
import { calculateProfileCompleteness, calculateOverallCompleteness } from "@/lib/profileValidation";

export const AdminApplications = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const authHeader = useMemo(() =>
    token ? { Authorization: `Bearer ${token}` } : undefined,
    [token]
  );

  const [apps, setApps] = useState([]);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  // Sponsor Manually tab state
  const [donors, setDonors] = useState([]);
  const [selectedDonorId, setSelectedDonorId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [studentAmounts, setStudentAmounts] = useState({}); // studentId -> amount (string)
  const [isSubmittingSponsorships, setIsSubmittingSponsorships] = useState(false);

  // docs state
  const [expandedId, setExpandedId] = useState(null);
  const [docsByRow, setDocsByRow] = useState({}); // app.id -> documents[]
  const [loadingDocsId, setLoadingDocsId] = useState(null);

  // case worker assignment state
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
  const load = async () => {
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

      // Deduplicate applications by ID to prevent duplicates
      const appMap = new Map();
      list.forEach(app => {
        if (app.id && !appMap.has(app.id)) {
          appMap.set(app.id, app);
        }
      });
      const uniqueList = Array.from(appMap.values());

      // add editable fields locally
      const withLocal = uniqueList.map((a) => ({
        ...a,
        _status: a.status,
        _notes: a.notes ?? "",
      }));
      setApps(withLocal);

      // Load officers list (for case worker assignment)
      try {
        const ofRes = await fetch(`${API.baseURL}/api/users?role=SUB_ADMIN`, {
          headers: { ...authHeader },
        });
        if (ofRes.ok) {
          const ofData = await ofRes.json();
          setOfficers(Array.isArray(ofData?.users) ? ofData.users : []);
        }
      } catch (e) {
        console.error("Failed to load officers:", e);
      }
    } catch (e) {
      console.error(e);
      setApps([]);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    let dead = false;
    let timer;

    async function fetchData() {
      if (dead) return;
      try {
        await load();
      } catch (e) {
        console.error(e);
        if (!dead) setApps([]);
      } finally {
        if (!dead) {
          timer = setTimeout(fetchData, 15000);
        }
      }
    }

    fetchData();
    return () => {
      dead = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, token]);

  // Load donors for Sponsor Manually tab
  useEffect(() => {
    if (!isAdmin) return;
    let dead = false;
    (async () => {
      try {
        const res = await fetch(`${API.baseURL}/api/donors?limit=500`, {
          headers: { ...authHeader },
        });
        if (res.status === 401) {
          toast.error("Your session expired. Please sign in again.");
          logout?.();
          return;
        }
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const list = Array.isArray(data?.donors) ? data.donors : [];
        if (!dead) setDonors(list);
      } catch (e) {
        console.error("Failed to load donors:", e);
      }
    })();
    return () => {
      dead = true;
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
  // Assign Case Worker
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
          errorMessage = "This application is already assigned to the selected case worker.";
        }
        
        throw new Error(errorMessage || `HTTP ${res.status}`);
      }

      const responseData = await res.json();
      toast.success("Case Worker assigned successfully!");
      
      // Immediately update the local state to reflect assignment with the real ID from server
      const assignedOfficer = officers.find(o => o.id === officerId);
      setApps((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? { 
                ...app, 
                fieldReviews: [
                  ...app.fieldReviews,
                  {
                    id: responseData.review?.id || `temp-${Date.now()}`, // Use real ID from server
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
          description: "This application is already assigned to the selected case worker."
        });
      } else {
        toast.error(`Assignment failed: ${err.message}`);
      }
    } finally {
      setAssigningId(null);
    }
  }

  // ---------------------------
  // Reassign Case Worker
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
  // Unassign Case Worker
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
    
    // First deduplicate by application ID
    const appMap = new Map();
    apps.forEach(app => {
      if (app.id && !appMap.has(app.id)) {
        appMap.set(app.id, app);
      }
    });
    const uniqueApps = Array.from(appMap.values());
    
    // Filter to only show applications with 100% complete profiles
    const completeProfiles = uniqueApps.filter((a) => {
      if (!a.student) {
        console.log('Application missing student data:', a.id);
        return false;
      }
      try {
        // Check profile completeness first
        const profileCompleteness = calculateProfileCompleteness(a.student);
        if (profileCompleteness.percent !== 100) {
          if (a.student.name) {
            console.log(`[AdminApplications] Filtering out incomplete profile: ${a.student.name} (${profileCompleteness.percent}% profile complete)`, {
              missing: profileCompleteness.missing,
              studentId: a.studentId,
              appId: a.id
            });
          }
          return false;
        }
        
        // Check documents completeness (documents are on student, not application)
        const uploadedDocs = a.student?.documents || [];
        const overallCompleteness = calculateOverallCompleteness(a.student, uploadedDocs);
        
        // Only show if both profile AND documents are 100% complete
        const isFullyComplete = overallCompleteness.isComplete && overallCompleteness.percent === 100;
        
        if (!isFullyComplete && a.student.name) {
          console.log(`[AdminApplications] Filtering out incomplete application: ${a.student.name} (${overallCompleteness.percent}% overall complete)`, {
            profilePercent: profileCompleteness.percent,
            docPercent: overallCompleteness.docPercent,
            missingDocs: overallCompleteness.missingDocs,
            studentId: a.studentId,
            appId: a.id
          });
        }
        
        return isFullyComplete;
      } catch (error) {
        console.error('Error calculating completeness for student:', a.student.name, error);
        return false;
      }
    });
    
    // Then filter by status based on active tab
    let statusFiltered = completeProfiles;
    if (activeTab === "pending") {
      statusFiltered = completeProfiles.filter(a => a.status === "PENDING");
    } else if (activeTab === "approved") {
      // Exclude sponsored students from approved tab
      statusFiltered = completeProfiles.filter(a => a.status === "APPROVED" && !(a.student?.sponsored === true || (a.sponsorships && a.sponsorships.length > 0)));
    } else if (activeTab === "rejected") {
      statusFiltered = completeProfiles.filter(a => a.status === "REJECTED");
    } else if (activeTab === "sponsored") {
      statusFiltered = completeProfiles.filter(a => a.student?.sponsored === true || (a.sponsorships && a.sponsorships.length > 0));
    }
    // "all" tab shows everything (but only complete profiles)
    
    // For "all" tab, deduplicate by studentId to show only one application per student (most recent)
    if (activeTab === "all") {
      const studentMap = new Map();
      statusFiltered.forEach(app => {
        if (app.studentId) {
          const existing = studentMap.get(app.studentId);
          if (!existing || new Date(app.submittedAt || app.createdAt) > new Date(existing.submittedAt || existing.createdAt)) {
            studentMap.set(app.studentId, app);
          }
        }
      });
      statusFiltered = Array.from(studentMap.values());
    }
    
    // Then filter by search query
    const searchFiltered = statusFiltered.filter((a) => {
      const s = a.student || {};
      return (
        !t ||
        s.name?.toLowerCase().includes(t) ||
        s.university?.toLowerCase().includes(t) ||
        a.term?.toLowerCase().includes(t)
      );
    });
    
    // Final deduplication by application ID (safety check)
    const finalMap = new Map();
    searchFiltered.forEach(app => {
      if (app.id && !finalMap.has(app.id)) {
        finalMap.set(app.id, app);
      }
    });
    
    return Array.from(finalMap.values());
  }, [apps, query, activeTab]);

  // Sponsor Manually list: unsponsored students (deduped by studentId) with 100% complete profiles
  const sponsorManuallyList = useMemo(() => {
    const t = query.toLowerCase();
    
    // First deduplicate by application ID
    const appMap = new Map();
    apps.forEach(app => {
      if (app.id && !appMap.has(app.id)) {
        appMap.set(app.id, app);
      }
    });
    const uniqueApps = Array.from(appMap.values());
    
    // Filter to only show applications with 100% complete profiles AND all required documents
    const completeProfiles = uniqueApps.filter((a) => {
      if (!a.student) return false;
      
      // Check profile completeness
      const profileCompleteness = calculateProfileCompleteness(a.student);
      if (profileCompleteness.percent !== 100) {
        return false;
      }
      
      // Check documents completeness (documents are on student, not application)
      const uploadedDocs = a.student?.documents || [];
      const overallCompleteness = calculateOverallCompleteness(a.student, uploadedDocs);
      
      // Only show if both profile AND documents are 100% complete
      return overallCompleteness.isComplete && overallCompleteness.percent === 100;
    });
    
    const base = completeProfiles.filter((a) => {
      const isSponsored = a.student?.sponsored === true || (a.sponsorships && a.sponsorships.length > 0);
      // default: skip rejected students; admin can approve+sponsor from pending/processing/approved
      const isRejected = a.status === "REJECTED";
      return !isSponsored && !isRejected;
    });

    // de-dup by studentId (keep the first occurrence = most recent due to backend ordering)
    const seen = new Set();
    const deduped = [];
    for (const a of base) {
      if (!a.studentId) continue;
      if (seen.has(a.studentId)) continue;
      seen.add(a.studentId);
      deduped.push(a);
    }

    return deduped.filter((a) => {
      const s = a.student || {};
      return (
        !t ||
        s.name?.toLowerCase().includes(t) ||
        s.university?.toLowerCase().includes(t) ||
        a.term?.toLowerCase().includes(t)
      );
    });
  }, [apps, query]);

  // Base filtered list (same logic as filtered but without search query) - for stats calculation
  const baseFilteredApps = useMemo(() => {
    // First deduplicate by application ID
    const appMap = new Map();
    apps.forEach(app => {
      if (app.id && !appMap.has(app.id)) {
        appMap.set(app.id, app);
      }
    });
    const uniqueApps = Array.from(appMap.values());
    
    // Filter to only show applications with 100% complete profiles AND documents
    const completeProfiles = uniqueApps.filter((a) => {
      if (!a.student) return false;
      try {
        const profileCompleteness = calculateProfileCompleteness(a.student);
        if (profileCompleteness.percent !== 100) return false;
        
        const uploadedDocs = a.student?.documents || [];
        const overallCompleteness = calculateOverallCompleteness(a.student, uploadedDocs);
        
        return overallCompleteness.isComplete && overallCompleteness.percent === 100;
      } catch (error) {
        return false;
      }
    });
    
    return completeProfiles;
  }, [apps]);

  // Statistics for tab badges - using baseFilteredApps to match the same filtering logic
  const stats = useMemo(() => {
    // For "all" tab, deduplicate by studentId to show only one application per student (most recent)
    const allDeduped = (() => {
      const studentMap = new Map();
      baseFilteredApps.forEach(app => {
        if (app.studentId) {
          const existing = studentMap.get(app.studentId);
          if (!existing || new Date(app.submittedAt || app.createdAt) > new Date(existing.submittedAt || existing.createdAt)) {
            studentMap.set(app.studentId, app);
          }
        }
      });
      return Array.from(studentMap.values());
    })();

    return {
      all: allDeduped.length,
      pending: baseFilteredApps.filter(a => a.status === "PENDING").length,
      approved: baseFilteredApps.filter(a => a.status === "APPROVED" && !(a.student?.sponsored === true || (a.sponsorships && a.sponsorships.length > 0))).length,
      rejected: baseFilteredApps.filter(a => a.status === "REJECTED").length,
      sponsored: baseFilteredApps.filter(a => a.student?.sponsored === true || (a.sponsorships && a.sponsorships.length > 0)).length,
      sponsorManually: sponsorManuallyList.length,
    };
  }, [baseFilteredApps, sponsorManuallyList]);

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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-7 gap-1">
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
          <TabsTrigger value="sponsor-manually" className="flex flex-col sm:flex-row items-center gap-1 text-xs sm:text-sm p-2">
            <span>Sponsor Manually</span>
            {stats.sponsorManually > 0 && (
              <Badge variant="default" className="bg-purple-100 text-purple-800 text-xs">
                {stats.sponsorManually}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {activeTab === "sponsor-manually" ? (
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b pb-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-2">Manual Sponsorship Assignment</h2>
                    <p className="text-sm text-gray-600">
                      Select one or more students, choose a donor, then sponsor them. This will mark students as sponsored and set their latest application to APPROVED.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <select
                      className="px-4 py-2 border rounded-lg text-sm min-w-[220px]"
                      value={selectedDonorId}
                      onChange={(e) => setSelectedDonorId(e.target.value)}
                      disabled={isSubmittingSponsorships}
                    >
                      <option value="">Select a Donor...</option>
                      {donors.map((donor) => (
                        <option key={donor.id} value={donor.id}>
                          {donor.name} {donor.organization ? `(${donor.organization})` : ""}
                        </option>
                      ))}
                    </select>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={!selectedDonorId || selectedStudentIds.size === 0 || isSubmittingSponsorships}
                      onClick={async () => {
                        if (!selectedDonorId || selectedStudentIds.size === 0) {
                          toast.error("Please select a donor and at least one student");
                          return;
                        }

                        // Validate amounts
                        const invalidAmounts = Array.from(selectedStudentIds).filter((studentId) => {
                          const amount = studentAmounts[studentId];
                          const numAmount = Number(amount || "0");
                          return !amount || isNaN(numAmount) || numAmount <= 0;
                        });

                        if (invalidAmounts.length > 0) {
                          toast.error("Please enter a valid transaction amount (greater than 0) for all selected students.");
                          setIsSubmittingSponsorships(false);
                          return;
                        }

                        setIsSubmittingSponsorships(true);
                        try {
                          // Build student amounts map
                          const studentAmountsMap = {};
                          Array.from(selectedStudentIds).forEach((studentId) => {
                            const amount = studentAmounts[studentId] || "0";
                            studentAmountsMap[studentId] = Number(amount);
                          });

                          const res = await fetch(`${API.baseURL}/api/sponsorships/admin/bulk`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              ...authHeader,
                            },
                            body: JSON.stringify({
                              donorId: selectedDonorId,
                              studentIds: Array.from(selectedStudentIds),
                              amounts: studentAmountsMap, // Send custom amounts
                            }),
                          });

                          if (res.status === 401) {
                            toast.error("Your session expired. Please sign in again.");
                            logout?.();
                            return;
                          }

                          const result = await res.json();
                          if (res.ok) {
                            toast.success(`Successfully sponsored ${result.created} students!`);
                            if (Array.isArray(result.errors) && result.errors.length > 0) {
                              result.errors.forEach((err) => {
                                toast.error(`Failed: ${err.studentName}: ${err.error}`);
                              });
                            }

                            // Refresh data and clear selection
                            await load();
                            setSelectedStudentIds(new Set());
                            setStudentAmounts({});
                            setSelectedDonorId("");
                          } else {
                            toast.error(result.error || "Failed to create sponsorships");
                          }
                        } catch (error) {
                          console.error("Bulk sponsorship error:", error);
                          toast.error("An unexpected error occurred during bulk sponsorship.");
                        } finally {
                          setIsSubmittingSponsorships(false);
                        }
                      }}
                    >
                      {isSubmittingSponsorships ? "Sponsoring..." : `Sponsor Selected (${selectedStudentIds.size})`}
                    </Button>
                  </div>
                </div>

                {/* Select All */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="selectAllStudents"
                    className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    checked={selectedStudentIds.size === sponsorManuallyList.length && sponsorManuallyList.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const allIds = sponsorManuallyList.map((app) => app.studentId);
                        setSelectedStudentIds(new Set(allIds));
                        // Initialize amounts to 0 for all students
                        const initialAmounts = {};
                        allIds.forEach((id) => {
                          initialAmounts[id] = "0";
                        });
                        setStudentAmounts(initialAmounts);
                      } else {
                        setSelectedStudentIds(new Set());
                        setStudentAmounts({});
                      }
                    }}
                  />
                  <label htmlFor="selectAllStudents" className="text-sm font-medium text-gray-700">
                    Select All ({selectedStudentIds.size}/{sponsorManuallyList.length})
                  </label>
                </div>

                {/* Student Grid */}
                {sponsorManuallyList.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No non-sponsored students found.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sponsorManuallyList.map((app) => (
                      <Card
                        key={app.studentId}
                        className={`p-4 flex flex-col gap-3 transition-all duration-200 ${
                          selectedStudentIds.has(app.studentId)
                            ? "border-purple-500 ring-2 ring-purple-200 bg-purple-50"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => {
                          setSelectedStudentIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(app.studentId)) {
                              next.delete(app.studentId);
                              // Remove amount when unselected
                              setStudentAmounts((prevAmounts) => {
                                const newAmounts = { ...prevAmounts };
                                delete newAmounts[app.studentId];
                                return newAmounts;
                              });
                            } else {
                              next.add(app.studentId);
                              // Initialize amount to 0 when selected
                              setStudentAmounts((prevAmounts) => ({
                                ...prevAmounts,
                                [app.studentId]: prevAmounts[app.studentId] || "0",
                              }));
                            }
                            return next;
                          });
                        }}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            checked={selectedStudentIds.has(app.studentId)}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedStudentIds((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) {
                                  next.add(app.studentId);
                                  // Initialize amount to 0 when selected
                                  setStudentAmounts((prevAmounts) => ({
                                    ...prevAmounts,
                                    [app.studentId]: prevAmounts[app.studentId] || "0",
                                  }));
                                } else {
                                  next.delete(app.studentId);
                                  // Remove amount when unselected
                                  setStudentAmounts((prevAmounts) => {
                                    const newAmounts = { ...prevAmounts };
                                    delete newAmounts[app.studentId];
                                    return newAmounts;
                                  });
                                }
                                return next;
                              });
                            }}
                          />
                          <StudentPhoto student={app.student} size="medium" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{app.student?.name}</h3>
                            <p className="text-sm text-gray-600">
                              {app.student?.program} at {app.student?.university}
                            </p>
                            <p className="text-xs text-gray-500">
                              Status: {app.status} · Term: {app.term} · Need: {fmtAmountDual(app.amount, app.currency)}
                            </p>
                          </div>
                        </div>
                        {selectedStudentIds.has(app.studentId) && (
                          <div className="pt-2 border-t border-gray-200">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Transaction Amount ({app.currency || "PKR"})
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              value={studentAmounts[app.studentId] || "0"}
                              onChange={(e) => {
                                const value = e.target.value;
                                setStudentAmounts((prev) => ({
                                  ...prev,
                                  [app.studentId]: value,
                                }));
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full min-h-[36px] text-sm"
                            />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : (

      <Card className="divide-y">
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-3 px-4 py-3 text-sm font-medium text-gray-600">
          <div className="lg:col-span-3">Student</div>
          <div className="lg:col-span-2 hidden lg:block">Term</div>
          <div className="lg:col-span-2 hidden lg:block">Need</div>
          <div className="lg:col-span-3 hidden lg:block">Status / Notes</div>
          <div className="lg:col-span-1 hidden lg:block text-right pr-2">Actions</div>
        </div>

        {filtered.map((row, index) => {
          // Additional safety check: ensure no duplicates by ID or studentId
          const isDuplicateById = filtered.findIndex(r => r.id === row.id) !== index;
          const isDuplicateByStudentId = filtered.findIndex(r => r.studentId === row.studentId && r.studentId) !== index;
          if (isDuplicateById || isDuplicateByStudentId) {
            console.warn(`Duplicate found: ${row.student?.name} - App ID: ${row.id}, Student ID: ${row.studentId}`);
            return null;
          }
          
          const needText = fmtAmountDual(row.amount, row.currency);
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
                               {recommendation?.replace('_', ' ') || 'APPROVED'}
                            </Badge>
                          );
                        } else if (status === "IN_PROGRESS") {
                          return (
                            <Badge className="bg-orange-500 text-white text-xs">
                               In Review
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
                    
                    {/* Case Worker Assignment */}
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
                          <option value=""> Assign Case Worker...</option>
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
                          Assigned to: {Array.from(new Set(row.fieldReviews.map(fr => {
                            const officer = officers.find(o => o.id === fr.officerUserId);
                            return officer?.name || officer?.email || 'Unknown Officer';
                          }))).join(', ')}
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
                            <option value=""> Reassign...</option>
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
                             Unassign
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
                               {d.originalName || d.url}
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
        }).filter(Boolean)}
      </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
