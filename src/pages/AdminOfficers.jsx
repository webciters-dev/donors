import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function AdminOfficers() {
  const { token, user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/users?role=FIELD_OFFICER`, { headers: { ...authHeader } });
      if (res.status === 401) {
        toast.error("Your session expired. Please sign in again.");
        logout?.();
        return;
      }
      const j = await res.json();
      setOfficers(Array.isArray(j?.users) ? j.users : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load officers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, token]);

  async function createOfficer() {
    try {
      if (!form.email || !form.password) {
        toast.error("Email and password are required");
        return;
      }
      setCreating(true);
      const res = await fetch(`${API}/api/users/field-officers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      toast.success("Field officer created");
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
      const res = await fetch(`${API}/api/users/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      setOfficers(prev => prev.map(x => x.id === o.id ? { ...j.user } : x));
      toast.success("Saved");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save");
    }
  }

  if (!isAdmin) {
    return <Card className="p-6">Admins only.</Card>;
  }

  const editable = officers.map(o => ({
    ...o,
    _name: o._name ?? o.name ?? "",
    _email: o._email ?? o.email ?? "",
    _newPassword: o._newPassword ?? "",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Field Officers</h1>
        <Button variant="outline" className="rounded-2xl" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</Button>
      </div>

      <Card className="p-6 space-y-3">
        <div className="font-medium">Add a field officer</div>
        <div className="grid md:grid-cols-3 gap-2 items-center">
          <Input placeholder="Name (optional)" value={form.name} onChange={(e)=>setForm(f=>({ ...f, name: e.target.value }))} />
          <Input placeholder="Email" value={form.email} onChange={(e)=>setForm(f=>({ ...f, email: e.target.value }))} />
          <div className="flex gap-2">
            <Input type="password" placeholder="Password" value={form.password} onChange={(e)=>setForm(f=>({ ...f, password: e.target.value }))} />
            <Button className="rounded-2xl" onClick={createOfficer} disabled={creating}>{creating ? "Creating…" : "Add"}</Button>
          </div>
        </div>
        <div className="text-xs text-slate-500">They will be created with role <Badge variant="secondary">FIELD_OFFICER</Badge>.</div>
      </Card>

      <Card className="divide-y">
        <div className="grid grid-cols-12 gap-3 px-4 py-3 text-sm font-medium text-slate-600">
          <div className="col-span-3">Name</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-3 text-right pr-2">Actions</div>
        </div>
        {editable.map((o) => (
          <div key={o.id} className="px-4 py-4 grid grid-cols-12 gap-3 items-start">
            <div className="col-span-3">
              <Input value={o._name} onChange={(e)=>setOfficers(prev=>prev.map(x=>x.id===o.id?{...x,_name:e.target.value}:x))} className="rounded-2xl" />
            </div>
            <div className="col-span-4">
              <Input value={o._email} onChange={(e)=>setOfficers(prev=>prev.map(x=>x.id===o.id?{...x,_email:e.target.value}:x))} className="rounded-2xl" />
            </div>
            <div className="col-span-2 pt-1">
              <Badge variant="secondary">{o.role}</Badge>
            </div>
            <div className="col-span-3 flex items-center justify-end gap-2 pr-2">
              <Input type="password" placeholder="New password (optional)" value={o._newPassword} onChange={(e)=>setOfficers(prev=>prev.map(x=>x.id===o.id?{...x,_newPassword:e.target.value}:x))} className="rounded-2xl" />
              <Button className="rounded-2xl" onClick={()=>saveRow(o)}>Save</Button>
            </div>
          </div>
        ))}
        {editable.length === 0 && (
          <div className="px-4 py-6 text-sm text-slate-600">No field officers yet.</div>
        )}
      </Card>
    </div>
  );
}
