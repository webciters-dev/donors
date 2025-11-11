// src/components/AdminSettings.jsx - Admin settings for currency exchange rates
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, DollarSign, TrendingUp, FileText, Download, Upload, RotateCcw, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { getPKRToUSDRate } from "@/lib/currency";
import { getAllCMSContent, updateCMSContent, resetCMSContent, exportCMSContent, importCMSContent } from "@/lib/cms";
import { API } from "@/lib/api";

export default function AdminSettings() {
  const { token, user } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : undefined;
  const isAdmin = user?.role === "ADMIN";

  const [pkrRate, setPkrRate] = useState(300); // Default rate
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // CMS State
  const [cmsContent, setCmsContent] = useState({});
  const [cmsLoading, setCmsLoading] = useState(false);

  // Board Members State
  const [boardMembers, setBoardMembers] = useState([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [showAddBoard, setShowAddBoard] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [newBoardMember, setNewBoardMember] = useState({
    name: '',
    email: '',
    title: '',
    isActive: true
  });

  // Load current settings
  useEffect(() => {
    async function loadSettings() {
      try {
        // For now, use the current rate from currency utility
        const currentRate = getPKRToUSDRate();
        setPkrRate(currentRate);
        
        // TODO: In future, load from admin settings API:
        // const res = await fetch(`${API.baseURL}/api/admin/settings`, { headers: authHeader });
        // const data = await res.json();
        // setPkrRate(data.pkrToUsdRate || 300);
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    if (isAdmin) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [isAdmin]); // Removed authHeader from dependencies

  // Load CMS content
  useEffect(() => {
    if (isAdmin) {
      const content = getAllCMSContent();
      setCmsContent(content);
    }
  }, [isAdmin]);

  // CMS Functions
  const updateCMSField = (path, value) => {
    const success = updateCMSContent(path, value);
    if (success) {
      // Update local state
      const newContent = getAllCMSContent();
      setCmsContent(newContent);
      toast.success("Content updated successfully!");
    } else {
      toast.error("Failed to update content");
    }
  };

  const handleCMSReset = () => {
    if (confirm("Are you sure you want to reset all content to defaults? This cannot be undone.")) {
      const success = resetCMSContent();
      if (success) {
        const content = getAllCMSContent();
        setCmsContent(content);
        toast.success("Content reset to defaults!");
      } else {
        toast.error("Failed to reset content");
      }
    }
  };

  const handleCMSExport = () => {
    const jsonData = exportCMSContent();
    if (jsonData) {
      // Create download link
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `awake-cms-content-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Content exported successfully!");
    } else {
      toast.error("Failed to export content");
    }
  };

  const handleCMSImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const success = importCMSContent(e.target.result);
        if (success) {
          const content = getAllCMSContent();
          setCmsContent(content);
          toast.success("Content imported successfully!");
        } else {
          toast.error("Failed to import content");
        }
      } catch (error) {
        toast.error("Invalid file format");
      }
    };
    reader.readAsText(file);
  };

  // Save PKR rate setting
  async function savePkrRate() {
    if (!pkrRate || pkrRate <= 0) {
      toast.error("Please enter a valid exchange rate");
      return;
    }

    try {
      setSaving(true);
      
      // For now, save to localStorage for demo purposes
      localStorage.setItem('admin_pkr_usd_rate', pkrRate.toString());
      
      // TODO: In future, save to admin settings API:
      // const res = await fetch(`${API.baseURL}/api/admin/settings`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', ...authHeader },
      //   body: JSON.stringify({ pkrToUsdRate: pkrRate })
      // });
      
      toast.success("Exchange rate updated successfully!");
      
      // Trigger a page refresh to update all currency displays
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  // Board Member Functions
  const loadBoardMembers = async () => {
    try {
      setBoardLoading(true);
      const response = await fetch(`${API.baseURL}/api/board-members`, { 
        headers: authHeader 
      });
      const data = await response.json();
      
      if (response.ok) {
        setBoardMembers(data.data || []);
      } else {
        toast.error("Failed to load board members");
      }
    } catch (error) {
      console.error('Failed to load board members:', error);
      toast.error("Failed to load board members");
    } finally {
      setBoardLoading(false);
    }
  };

  const createBoardMember = async () => {
    try {
      if (!newBoardMember.name || !newBoardMember.email || !newBoardMember.title) {
        toast.error("Please fill in all required fields");
        return;
      }

      setBoardLoading(true);
      const response = await fetch(`${API.baseURL}/api/board-members`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeader 
        },
        body: JSON.stringify(newBoardMember)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Board member created successfully!");
        setNewBoardMember({ name: '', email: '', title: '', isActive: true });
        setShowAddBoard(false);
        await loadBoardMembers();
      } else {
        toast.error(data.message || "Failed to create board member");
      }
    } catch (error) {
      console.error('Failed to create board member:', error);
      toast.error("Failed to create board member");
    } finally {
      setBoardLoading(false);
    }
  };

  const updateBoardMember = async (id, updates) => {
    try {
      setBoardLoading(true);
      const response = await fetch(`${API.baseURL}/api/board-members/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeader 
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Board member updated successfully!");
        setEditingBoard(null);
        await loadBoardMembers();
      } else {
        toast.error(data.message || "Failed to update board member");
      }
    } catch (error) {
      console.error('Failed to update board member:', error);
      toast.error("Failed to update board member");
    } finally {
      setBoardLoading(false);
    }
  };

  const toggleBoardMemberStatus = async (id) => {
    try {
      setBoardLoading(true);
      const response = await fetch(`${API.baseURL}/api/board-members/${id}/toggle-status`, {
        method: 'PATCH',
        headers: authHeader
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        await loadBoardMembers();
      } else {
        toast.error(data.message || "Failed to toggle status");
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast.error("Failed to toggle status");
    } finally {
      setBoardLoading(false);
    }
  };

  const deleteBoardMember = async (id) => {
    if (!confirm("Are you sure you want to delete this board member?")) return;
    
    try {
      setBoardLoading(true);
      const response = await fetch(`${API.baseURL}/api/board-members/${id}`, {
        method: 'DELETE',
        headers: authHeader
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        await loadBoardMembers();
      } else {
        toast.error(data.message || "Failed to delete board member");
      }
    } catch (error) {
      console.error('Failed to delete board member:', error);
      toast.error("Failed to delete board member");
    } finally {
      setBoardLoading(false);
    }
  };

  // Load board members when component mounts
  useEffect(() => {
    if (isAdmin) {
      loadBoardMembers();
    }
  }, [isAdmin]);

  // Round USD amounts to nearest 0 or 5 for cleaner display
  const roundToNearest5or0 = (amount) => {
    // For amounts less than 1, don't apply rounding (keep precision)
    if (amount < 1) {
      return Math.round(amount * 100) / 100; // Round to 2 decimal places
    }
    
    // For amounts less than 10, round to nearest 1 instead of 5
    if (amount < 10) {
      return Math.round(amount);
    }
    
    // For larger amounts, use the original 0 or 5 rounding
    const rounded = Math.round(amount);
    const lastDigit = rounded % 10;
    
    if (lastDigit === 0 || lastDigit === 5) {
      return rounded; // Already ends in 0 or 5
    } else if (lastDigit < 5) {
      return rounded + (5 - lastDigit); // Round up to 5
    } else {
      return rounded + (10 - lastDigit); // Round up to next 0
    }
  };

  // Calculate sample conversions with proper rounding
  const sampleAmounts = [50000, 100000, 200000, 500000];
  const sampleConversions = sampleAmounts.map(pkr => {
    const rawUSD = pkr / pkrRate;
    const roundedUSD = roundToNearest5or0(rawUSD);
    return {
      pkr,
      usd: roundedUSD
    };
  });

  if (!isAdmin) {
    return null; // Only show to admins
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-slate-500">Loading settings...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Admin Settings</h3>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Admin Only
        </Badge>
      </div>

      <Tabs defaultValue="currency" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="currency" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Currency Settings
          </TabsTrigger>
          <TabsTrigger value="cms" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content Management
          </TabsTrigger>
          <TabsTrigger value="board" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Board Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="currency" className="space-y-6">
          <Card className="p-6 space-y-6">
            {/* PKR to USD Exchange Rate */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PKR to USD Exchange Rate
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Set the current exchange rate for converting Pakistani Rupee amounts to USD for international donor understanding.
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">1 USD =</span>
                    <Input
                      type="number"
                      value={pkrRate}
                      onChange={(e) => setPkrRate(Number(e.target.value))}
                      className="w-24 text-center"
                      min="1"
                      step="0.1"
                    />
                    <span className="text-sm text-gray-600">PKR</span>
                  </div>
                  
                  <Button 
                    onClick={savePkrRate}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? "Saving..." : "Update Rate"}
                  </Button>
                </div>
              </div>

              {/* Sample Conversions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-gray-600" />
                  <h4 className="text-sm font-medium text-gray-700">Preview: PKR to USD Conversions</h4>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {sampleConversions.map(({ pkr, usd }) => (
                    <div key={pkr} className="bg-white rounded-md p-3 text-center border">
                      <div className="text-sm font-medium text-gray-900">
                        PKR {pkr.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        ≈ ${usd.toLocaleString()} USD
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-xs text-gray-500 mt-3">
                  💡 This rate will be used for all PKR amounts displayed to international donors
                </div>
              </div>
            </div>

            {/* Current Display Format */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Display Format</h4>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="text-sm text-amber-800">
                  <strong>PKR Amounts:</strong> PKR 200,000 (≈ ${roundToNearest5or0(200000 / pkrRate).toLocaleString()} USD)
                </div>
                <div className="text-sm text-amber-700 mt-1">
                  <strong>Other Currencies:</strong> Show original currency only (USD, GBP, EUR, CAD)
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="cms" className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900">Content Management System</h4>
                <p className="text-sm text-gray-600">Edit landing page content, hero sections, and feature descriptions</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCMSExport}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleCMSImport}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </Button>
                </label>
                <Button variant="outline" size="sm" onClick={handleCMSReset}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Hero Section */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-800 border-b pb-2">Hero Section</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <Input
                    value={cmsContent.hero?.title || ''}
                    onChange={(e) => updateCMSField('hero.title', e.target.value)}
                    placeholder="Hero title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Button</label>
                  <Input
                    value={cmsContent.hero?.primaryButton || ''}
                    onChange={(e) => updateCMSField('hero.primaryButton', e.target.value)}
                    placeholder="Primary button text"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <Textarea
                    value={cmsContent.hero?.subtitle || ''}
                    onChange={(e) => updateCMSField('hero.subtitle', e.target.value)}
                    placeholder="Hero subtitle/description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Button</label>
                  <Input
                    value={cmsContent.hero?.secondaryButton || ''}
                    onChange={(e) => updateCMSField('hero.secondaryButton', e.target.value)}
                    placeholder="Secondary button text"
                  />
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-800 border-b pb-2">Feature Boxes</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <div className="space-y-3">
                  <h6 className="text-sm font-medium text-green-700">Whole-Student Sponsorships</h6>
                  <Input
                    value={cmsContent.features?.wholeStudent?.title || ''}
                    onChange={(e) => updateCMSField('features.wholeStudent.title', e.target.value)}
                    placeholder="Feature title"
                  />
                  <Textarea
                    value={cmsContent.features?.wholeStudent?.description || ''}
                    onChange={(e) => updateCMSField('features.wholeStudent.description', e.target.value)}
                    placeholder="Feature description"
                    rows={3}
                  />
                </div>

                {/* Feature 2 */}
                <div className="space-y-3">
                  <h6 className="text-sm font-medium text-green-700">Interest-Free Repayments</h6>
                  <Input
                    value={cmsContent.features?.interestFree?.title || ''}
                    onChange={(e) => updateCMSField('features.interestFree.title', e.target.value)}
                    placeholder="Feature title"
                  />
                  <Textarea
                    value={cmsContent.features?.interestFree?.description || ''}
                    onChange={(e) => updateCMSField('features.interestFree.description', e.target.value)}
                    placeholder="Feature description"
                    rows={3}
                  />
                </div>

                {/* Feature 3 */}
                <div className="space-y-3">
                  <h6 className="text-sm font-medium text-green-700">Built for Trust</h6>
                  <Input
                    value={cmsContent.features?.builtForTrust?.title || ''}
                    onChange={(e) => updateCMSField('features.builtForTrust.title', e.target.value)}
                    placeholder="Feature title"
                  />
                  <Textarea
                    value={cmsContent.features?.builtForTrust?.description || ''}
                    onChange={(e) => updateCMSField('features.builtForTrust.description', e.target.value)}
                    placeholder="Feature description"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Why Section */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-800 border-b pb-2">Why AWAKE Connect Section</h5>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                <Input
                  value={cmsContent.whySection?.title || ''}
                  onChange={(e) => updateCMSField('whySection.title', e.target.value)}
                  placeholder="Why section title"
                />
              </div>

              {/* Individual Why Items */}
              <div className="grid grid-cols-1 gap-4">
                {/* Transparent & Secure */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h6 className="font-medium text-gray-700 mb-2">Transparent & Secure</h6>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                      <Input
                        value={cmsContent.whySection?.items?.transparent?.title || ''}
                        onChange={(e) => updateCMSField('whySection.items.transparent.title', e.target.value)}
                        placeholder="Transparent & Secure title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                      <Textarea
                        value={cmsContent.whySection?.items?.transparent?.description || ''}
                        onChange={(e) => updateCMSField('whySection.items.transparent.description', e.target.value)}
                        placeholder="Transparent & Secure description"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Whole-Student Support */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h6 className="font-medium text-gray-700 mb-2">Whole-Student Support</h6>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                      <Input
                        value={cmsContent.whySection?.items?.wholestudent?.title || ''}
                        onChange={(e) => updateCMSField('whySection.items.wholestudent.title', e.target.value)}
                        placeholder="Whole-Student Support title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                      <Textarea
                        value={cmsContent.whySection?.items?.wholestudent?.description || ''}
                        onChange={(e) => updateCMSField('whySection.items.wholestudent.description', e.target.value)}
                        placeholder="Whole-Student Support description"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Outcomes You Can Track */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h6 className="font-medium text-gray-700 mb-2">Outcomes You Can Track</h6>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                      <Input
                        value={cmsContent.whySection?.items?.tracking?.title || ''}
                        onChange={(e) => updateCMSField('whySection.items.tracking.title', e.target.value)}
                        placeholder="Outcomes tracking title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                      <Textarea
                        value={cmsContent.whySection?.items?.tracking?.description || ''}
                        onChange={(e) => updateCMSField('whySection.items.tracking.description', e.target.value)}
                        placeholder="Outcomes tracking description"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Marketplace of Hope */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h6 className="font-medium text-gray-700 mb-2">Marketplace of Hope</h6>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                      <Input
                        value={cmsContent.whySection?.items?.marketplace?.title || ''}
                        onChange={(e) => updateCMSField('whySection.items.marketplace.title', e.target.value)}
                        placeholder="Marketplace title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                      <Textarea
                        value={cmsContent.whySection?.items?.marketplace?.description || ''}
                        onChange={(e) => updateCMSField('whySection.items.marketplace.description', e.target.value)}
                        placeholder="Marketplace description"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Questions */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h6 className="font-medium text-gray-700 mb-2">Questions</h6>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                      <Input
                        value={cmsContent.whySection?.items?.questions?.title || ''}
                        onChange={(e) => updateCMSField('whySection.items.questions.title', e.target.value)}
                        placeholder="Questions title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                      <Textarea
                        value={cmsContent.whySection?.items?.questions?.description || ''}
                        onChange={(e) => updateCMSField('whySection.items.questions.description', e.target.value)}
                        placeholder="Questions description"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">CMS Status</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Content is stored locally. Changes will be visible immediately on the landing page when integrated.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="board" className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Board Members</h3>
                <p className="text-sm text-gray-600">Manage board members who participate in student interviews</p>
              </div>
              <Button 
                onClick={() => setShowAddBoard(true)} 
                disabled={boardLoading}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Add Board Member
              </Button>
            </div>

            {/* Add Board Member Form */}
            {showAddBoard && (
              <Card className="p-4 bg-gray-50 border-2 border-dashed border-gray-300">
                <h4 className="font-medium text-gray-900 mb-3">Add New Board Member</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <Input
                      value={newBoardMember.name}
                      onChange={(e) => setNewBoardMember(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={newBoardMember.email}
                      onChange={(e) => setNewBoardMember(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title/Position *
                    </label>
                    <Input
                      value={newBoardMember.title}
                      onChange={(e) => setNewBoardMember(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Board Chair, Academic Director, etc."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAddBoard(false);
                      setNewBoardMember({ name: '', email: '', title: '', isActive: true });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={createBoardMember}
                    disabled={boardLoading}
                  >
                    {boardLoading ? "Creating..." : "Create Board Member"}
                  </Button>
                </div>
              </Card>
            )}

            {/* Board Members List */}
            <div className="space-y-4">
              {boardLoading && boardMembers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Loading board members...
                </div>
              )}

              {!boardLoading && boardMembers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No board members yet. Add your first board member above.
                </div>
              )}

              {boardMembers.map((member) => (
                <Card key={member.id} className="p-4">
                  {editingBoard?.id === member.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <Input
                            value={editingBoard.name}
                            onChange={(e) => setEditingBoard(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          <Input
                            type="email"
                            value={editingBoard.email}
                            onChange={(e) => setEditingBoard(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title/Position
                          </label>
                          <Input
                            value={editingBoard.title}
                            onChange={(e) => setEditingBoard(prev => ({ ...prev, title: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => setEditingBoard(null)}
                          disabled={boardLoading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => updateBoardMember(member.id, editingBoard)}
                          disabled={boardLoading}
                        >
                          {boardLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">{member.name}</h4>
                          <Badge variant={member.isActive ? "default" : "secondary"}>
                            {member.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{member.title}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Added: {new Date(member.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingBoard({ ...member })}
                          disabled={boardLoading}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleBoardMemberStatus(member.id)}
                          disabled={boardLoading}
                        >
                          {member.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteBoardMember(member.id)}
                          disabled={boardLoading}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}