// src/components/SuperAdminSettings.jsx - Super Admin settings for managing admin credentials
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ShieldCheck, UserPlus, Users, Settings, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { API } from "@/lib/api";

export default function SuperAdminSettings() {
  const { token, user } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [saving, setSaving] = useState(false);
  
  // Create admin state
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Edit admin state
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Super Admin profile state
  const [superAdminProfile, setSuperAdminProfile] = useState(null);
  const [editingSelf, setEditingSelf] = useState(false);
  const [selfForm, setSelfForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    password: '',
    confirmPassword: ''
  });
  const [showSelfPasswords, setShowSelfPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      if (!isSuperAdmin) {
        setLoading(false);
        return;
      }

      try {
        // Load admin users
        const adminsRes = await fetch(`${API.baseURL}/api/super-admin/admins`, { 
          headers: authHeader 
        });
        const adminsData = await adminsRes.json();
        
        if (adminsRes.ok) {
          setAdmins(adminsData.admins || []);
        } else {
          toast.error("Failed to load admin users");
        }

        // Load super admin profile
        const profileRes = await fetch(`${API.baseURL}/api/super-admin/me`, { 
          headers: authHeader 
        });
        const profileData = await profileRes.json();
        
        if (profileRes.ok) {
          setSuperAdminProfile(profileData.superAdmin);
          setSelfForm({
            name: profileData.superAdmin?.name || '',
            email: profileData.superAdmin?.email || '',
            currentPassword: '',
            password: '',
            confirmPassword: ''
          });
        } else {
          toast.error("Failed to load profile");
        }

      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isSuperAdmin]); // Removed authHeader from dependencies

  // Create Admin Functions
  const validateAdminForm = (form) => {
    if (!form.name?.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!form.email?.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!form.email.includes('@')) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!form.password) {
      toast.error("Password is required");
      return false;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    return true;
  };

  const createAdmin = async () => {
    if (!validateAdminForm(newAdmin)) return;

    try {
      setSaving(true);
      const response = await fetch(`${API.baseURL}/api/super-admin/admins`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeader 
        },
        body: JSON.stringify({
          name: newAdmin.name.trim(),
          email: newAdmin.email.trim(),
          password: newAdmin.password
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Admin created successfully!");
        setAdmins(prev => [data.admin, ...prev]);
        setNewAdmin({ name: '', email: '', password: '', confirmPassword: '' });
        setShowCreateAdmin(false);
      } else {
        toast.error(data.error || "Failed to create admin");
      }
    } catch (error) {
      console.error('Failed to create admin:', error);
      toast.error("Failed to create admin");
    } finally {
      setSaving(false);
    }
  };

  const updateAdmin = async (adminId) => {
    if (!editForm.name?.trim() || !editForm.email?.trim()) {
      toast.error("Name and email are required");
      return;
    }
    
    if (editForm.password && editForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        name: editForm.name.trim(),
        email: editForm.email.trim()
      };
      
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      const response = await fetch(`${API.baseURL}/api/super-admin/admins/${adminId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeader 
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Admin updated successfully!");
        setAdmins(prev => prev.map(admin => 
          admin.id === adminId ? data.admin : admin
        ));
        setEditingAdmin(null);
        setEditForm({ name: '', email: '', password: '', confirmPassword: '' });
      } else {
        toast.error(data.error || "Failed to update admin");
      }
    } catch (error) {
      console.error('Failed to update admin:', error);
      toast.error("Failed to update admin");
    } finally {
      setSaving(false);
    }
  };

  const deleteAdmin = async (adminId, adminEmail) => {
    if (!confirm(`Are you sure you want to delete admin: ${adminEmail}?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${API.baseURL}/api/super-admin/admins/${adminId}`, {
        method: 'DELETE',
        headers: authHeader
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Admin deleted successfully");
        setAdmins(prev => prev.filter(admin => admin.id !== adminId));
      } else {
        toast.error(data.error || "Failed to delete admin");
      }
    } catch (error) {
      console.error('Failed to delete admin:', error);
      toast.error("Failed to delete admin");
    } finally {
      setSaving(false);
    }
  };

  const updateSelfProfile = async () => {
    if (!selfForm.name?.trim() || !selfForm.email?.trim()) {
      toast.error("Name and email are required");
      return;
    }
    
    if (selfForm.password && selfForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    if (selfForm.password && selfForm.password !== selfForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if ((selfForm.email !== superAdminProfile?.email || selfForm.password) && !selfForm.currentPassword) {
      toast.error("Current password is required to change email or password");
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        name: selfForm.name.trim(),
        email: selfForm.email.trim()
      };
      
      if (selfForm.currentPassword) {
        updateData.currentPassword = selfForm.currentPassword;
      }
      
      if (selfForm.password) {
        updateData.password = selfForm.password;
      }

      const response = await fetch(`${API.baseURL}/api/super-admin/me`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeader 
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Profile updated successfully!");
        setSuperAdminProfile(data.superAdmin);
        setSelfForm({
          name: data.superAdmin.name || '',
          email: data.superAdmin.email || '',
          currentPassword: '',
          password: '',
          confirmPassword: ''
        });
        setEditingSelf(false);
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return null; // Only show to super admins
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-slate-500">Loading super admin settings...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-red-600" />
        <h3 className="text-lg font-semibold text-gray-900">Super Admin Settings</h3>
        <Badge variant="destructive" className="bg-red-600 text-white">
          Super Admin Only
        </Badge>
      </div>

      <Tabs defaultValue="admins" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manage Admins
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            My Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admins" className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900">Admin Users Management</h4>
                <p className="text-sm text-gray-600">Create, update, and manage admin user credentials</p>
              </div>
              <Button 
                onClick={() => setShowCreateAdmin(true)} 
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4" />
                Create Admin
              </Button>
            </div>

            {/* Create Admin Form */}
            {showCreateAdmin && (
              <Card className="p-4 bg-blue-50 border-2 border-blue-200">
                <h5 className="font-medium text-blue-900 mb-3">Create New Admin User</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">
                      Full Name *
                    </label>
                    <Input
                      value={newAdmin.name}
                      onChange={(e) => setNewAdmin(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">
                      Password * (min 6 characters)
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">
                      Confirm Password *
                    </label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newAdmin.confirmPassword}
                      onChange={(e) => setNewAdmin(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm password"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateAdmin(false);
                      setNewAdmin({ name: '', email: '', password: '', confirmPassword: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={createAdmin}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? "Creating..." : "Create Admin"}
                  </Button>
                </div>
              </Card>
            )}

            {/* Admin Users List */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-600" />
                <h5 className="font-medium text-gray-700">Current Admin Users ({admins.length})</h5>
              </div>

              {admins.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  No admin users found. Create your first admin user above.
                </div>
              ) : (
                <div className="space-y-3">
                  {admins.map((admin) => (
                    <Card key={admin.id} className="p-4 hover:shadow-md transition-shadow">
                      {editingAdmin?.id === admin.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                              </label>
                              <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                              </label>
                              <Input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Password (optional)
                              </label>
                              <div className="relative">
                                <Input
                                  type={showEditPassword ? "text" : "password"}
                                  value={editForm.password}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                                  placeholder="Leave blank to keep current"
                                />
                                <button
                                  type="button"
                                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                  onClick={() => setShowEditPassword(!showEditPassword)}
                                >
                                  {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                              </label>
                              <Input
                                type={showEditPassword ? "text" : "password"}
                                value={editForm.confirmPassword}
                                onChange={(e) => setEditForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                placeholder="Confirm new password"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setEditingAdmin(null);
                                setEditForm({ name: '', email: '', password: '', confirmPassword: '' });
                              }}
                              disabled={saving}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => updateAdmin(admin.id)}
                              disabled={saving}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {saving ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h6 className="font-medium text-gray-900">{admin.name}</h6>
                              <Badge className="bg-blue-100 text-blue-800">
                                ADMIN
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{admin.email}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Created: {new Date(admin.createdAt).toLocaleDateString()}
                            </p>
                            {admin.updatedAt !== admin.createdAt && (
                              <p className="text-xs text-gray-400">
                                Updated: {new Date(admin.updatedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingAdmin(admin);
                                setEditForm({
                                  name: admin.name || '',
                                  email: admin.email || '',
                                  password: '',
                                  confirmPassword: ''
                                });
                              }}
                              disabled={saving}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteAdmin(admin.id, admin.email)}
                              disabled={saving}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900">Super Admin Profile</h4>
                <p className="text-sm text-gray-600">Manage your own super admin credentials</p>
              </div>
              {!editingSelf && (
                <Button 
                  onClick={() => setEditingSelf(true)} 
                  disabled={saving}
                  variant="outline"
                >
                  Edit Profile
                </Button>
              )}
            </div>

            {editingSelf ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <Input
                      value={selfForm.name}
                      onChange={(e) => setSelfForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={selfForm.email}
                      onChange={(e) => setSelfForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-red-700 mb-1">
                      Current Password (required to change email or password)
                    </label>
                    <div className="relative">
                      <Input
                        type={showSelfPasswords.current ? "text" : "password"}
                        value={selfForm.currentPassword}
                        onChange={(e) => setSelfForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowSelfPasswords(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showSelfPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password (optional, min 6 characters)
                    </label>
                    <div className="relative">
                      <Input
                        type={showSelfPasswords.new ? "text" : "password"}
                        value={selfForm.password}
                        onChange={(e) => setSelfForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Leave blank to keep current"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowSelfPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showSelfPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showSelfPasswords.confirm ? "text" : "password"}
                        value={selfForm.confirmPassword}
                        onChange={(e) => setSelfForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowSelfPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showSelfPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditingSelf(false);
                      setSelfForm({
                        name: superAdminProfile?.name || '',
                        email: superAdminProfile?.email || '',
                        currentPassword: '',
                        password: '',
                        confirmPassword: ''
                      });
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={updateSelfProfile}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <ShieldCheck className="h-5 w-5 text-red-600" />
                  <h6 className="font-medium text-gray-900">{superAdminProfile?.name}</h6>
                  <Badge variant="destructive" className="bg-red-600 text-white">
                    SUPER_ADMIN
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{superAdminProfile?.email}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Account created: {superAdminProfile?.createdAt ? new Date(superAdminProfile.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
                {superAdminProfile?.updatedAt !== superAdminProfile?.createdAt && (
                  <p className="text-xs text-gray-400">
                    Last updated: {superAdminProfile?.updatedAt ? new Date(superAdminProfile.updatedAt).toLocaleDateString() : 'Unknown'}
                  </p>
                )}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Notice */}
      <Card className="p-4 bg-red-50 border-2 border-red-200">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-red-600" />
          <div>
            <h6 className="font-medium text-red-800">Security Notice</h6>
            <p className="text-sm text-red-700 mt-1">
              As a Super Admin, you have the highest level of access. Only create admin accounts for trusted personnel.
              All actions are logged for security purposes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}