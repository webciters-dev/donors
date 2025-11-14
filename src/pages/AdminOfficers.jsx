import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { UserPlus, Mail, Shield, Edit2, Trash2 } from "lucide-react";
import { API } from "@/lib/api";

export default function AdminOfficers() {
  const { token, user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [caseWorkers, setCaseWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`${API.baseURL}/api/users?role=SUB_ADMIN`, { headers: { ...authHeader } });
      if (res.status === 401) {
        toast.error("Your session expired. Please sign in again.");
        logout?.();
        return;
      }
      const j = await res.json();
      setCaseWorkers(Array.isArray(j?.users) ? j.users : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load case workers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, token]);

  async function createCaseWorker() {
    try {
      if (!form.email || !form.password) {
        toast.error("Email and password are required");
        return;
      }
      setCreating(true);
      const res = await fetch(`${API.baseURL}/api/users/sub-admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      toast.success("Case worker created");
      setForm({ name: "", email: "", password: "" });
      load();
    } catch (e) {
      console.error(e);
      const msg = /409/.test(String(e.message)) || /already/.test(String(e.message)) ? "Email already registered" : "Failed to create";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  }

  async function saveRow(o) {
    try {
      const body = { name: o._name, email: o._email };
      if (o._newPassword) body.password = o._newPassword;
      const res = await fetch(`${API.baseURL}/api/users/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      const updated = j.user;
      setCaseWorkers(prev => prev.map(x => x.id === o.id ? { ...updated } : x));
      toast.success("Saved");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save");
    }
  }

  async function deleteCaseWorker(caseWorker) {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete case worker "${caseWorker.name || caseWorker.email}"?\n\n` +
      "This action cannot be undone and will:\n" +
      "• Remove their access to the system\n" +
      "• Delete any associated field reviews\n" +
      "• Remove all their account data\n\n" +
      "Click OK to confirm deletion."
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`${API.baseURL}/api/users/${caseWorker.id}`, {
        method: "DELETE",
        headers: { ...authHeader },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete case worker");
      }

      // Remove from local state
      setCaseWorkers(prev => prev.filter(x => x.id !== caseWorker.id));
      toast.success(`Case worker "${caseWorker.name || caseWorker.email}" deleted successfully`);
    } catch (e) {
      console.error("Delete case worker failed:", e);
      toast.error(e.message || "Failed to delete case worker");
    }
  }

  if (!isAdmin) {
    return <Card className="p-6">Admins only.</Card>;
  }

  const editable = caseWorkers.map(o => ({
    ...o,
    _name: o._name ?? o.name ?? "",
    _email: o._email ?? o.email ?? "",
    _newPassword: o._newPassword ?? "",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Case Worker Management</h1>
          <p className="text-gray-600 mt-1">Manage case workers who review student applications</p>
        </div>
        <Button variant="outline" className="rounded-2xl" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {/* Add New Sub Admin */}
      <Card className="border-l-4 border-l-green-500 bg-green-50">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            <div className="font-semibold text-green-800">Add New Case Worker</div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <Input 
                placeholder="Enter full name" 
                value={form.name} 
                onChange={(e)=>setForm(f=>({ ...f, name: e.target.value }))} 
                className="rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <Input 
                type="email"
                placeholder="Enter email" 
                value={form.email} 
                onChange={(e)=>setForm(f=>({ ...f, email: e.target.value }))} 
                className="rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Input 
                type="password" 
                placeholder="Enter password" 
                value={form.password} 
                onChange={(e)=>setForm(f=>({ ...f, password: e.target.value }))} 
                className="rounded-2xl"
              />
            </div>
            <div>
              <Button 
                className="w-full rounded-2xl bg-green-600 hover:bg-green-700" 
                onClick={createCaseWorker} 
                disabled={creating || !form.email || !form.password}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {creating ? "Creating…" : "Create Case Worker"}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 p-3 rounded-lg">
            <Mail className="h-4 w-4" />
            <span>A welcome email with login credentials will be sent automatically</span>
          </div>
        </div>
      </Card>

      {/* Existing Sub Admins */}
      <Card>
        <div className="px-6 py-4 border-b bg-slate-50">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-800">Existing Case Workers ({editable.length})</h2>
          </div>
        </div>
        
        <div className="divide-y">
          <div className="grid grid-cols-12 gap-3 px-6 py-3 text-sm font-medium text-gray-600 bg-gray-50">
            <div className="col-span-3">Name</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>
          {editable.map((o) => (
            <div key={o.id} className="px-6 py-4 grid grid-cols-12 gap-3 items-center">
              <div className="col-span-3">
                <Input 
                  value={o._name} 
                  onChange={(e)=>setCaseWorkers(prev=>prev.map(x=>x.id===o.id?{...x,_name:e.target.value}:x))} 
                  className="rounded-2xl" 
                  placeholder="Enter name"
                />
              </div>
              <div className="col-span-4">
                <Input 
                  value={o._email} 
                  onChange={(e)=>setCaseWorkers(prev=>prev.map(x=>x.id===o.id?{...x,_email:e.target.value}:x))} 
                  className="rounded-2xl"
                  type="email"
                />
              </div>
              <div className="col-span-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Case Worker
                </Badge>
              </div>
              <div className="col-span-3 flex items-center justify-end gap-2">
                <Input 
                  type="password" 
                  placeholder="New password (optional)" 
                  value={o._newPassword} 
                  onChange={(e)=>setCaseWorkers(prev=>prev.map(x=>x.id===o.id?{...x,_newPassword:e.target.value}:x))} 
                  className="rounded-2xl text-sm"
                />
                <Button 
                  size="sm"
                  className="rounded-2xl" 
                  onClick={()=>saveRow(o)}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button 
                  size="sm"
                  variant="destructive"
                  className="rounded-2xl" 
                  onClick={()=>deleteCaseWorker(o)}
                  title={`Delete case worker "${o.name || o.email}"`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          
          {editable.length === 0 && (
            <div className="px-6 py-8 text-center">
              <Shield className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <div className="text-slate-600 font-medium">No case workers yet</div>
              <div className="text-slate-500 text-sm">Create your first case worker above</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
