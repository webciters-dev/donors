import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Eye, Mail, MapPin, Building2, Heart } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { API } from "@/lib/api";

export default function AdminDonors() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    
    async function loadDonors() {
      try {
        setLoading(true);
        
        // Load donors
        const donorsRes = await fetch(`${API.baseURL}/api/donors?limit=100`, { headers: authHeader });
        if (donorsRes.ok) {
          const donorsData = await donorsRes.json();
          setDonors(donorsData.donors || []);
        }
        
      } catch (error) {
        console.error("Failed to load donors:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadDonors();
  }, [token, user, navigate]);

  const filteredDonors = donors.filter(donor =>
    donor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.organization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalFunded = donors.reduce((sum, donor) => sum + (donor.totalFunded || 0), 0);

  if (!token || user?.role !== 'ADMIN') {
    return <div>Access denied</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900"> Donors Management</h1>
          <p className="text-slate-600">View and manage all registered donors</p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline" className="rounded-2xl">
          Back
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {donors.length}
          </div>
          <div className="text-sm text-slate-600">Total Donors</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">
            ${totalFunded.toLocaleString()}
          </div>
          <div className="text-sm text-slate-600">Total Funded</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {donors.reduce((sum, donor) => sum + (donor.sponsorshipCount || 0), 0)}
          </div>
          <div className="text-sm text-slate-600">Active Sponsorships</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, or organization..."
            className="pl-10 rounded-2xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Donors List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-6 text-center">
            <div className="text-slate-600">Loading donors...</div>
          </Card>
        ) : filteredDonors.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="text-slate-600">
              {searchTerm ? `No donors found for "${searchTerm}"` : 'No donors registered yet'}
            </div>
          </Card>
        ) : (
          filteredDonors.map((donor) => (
            <Card key={donor.id} className="p-4 border-l-4 border-l-blue-500 bg-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-blue-900">{donor.name}</h3>
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      {donor.country || 'Unknown'}
                    </Badge>
                    {donor.organization && (
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        {donor.organization}
                      </Badge>
                    )}
                    <Badge variant="default" className="bg-emerald-600">
                      {donor.sponsorshipCount || 0} sponsorships
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">{donor.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">
                        <strong>Total Funded:</strong> ${donor.totalFunded?.toLocaleString() || '0'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">
                        <strong>Joined:</strong> {new Date(donor.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {donor.organization && (
                    <div className="mt-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      <span className="text-xs text-slate-500">
                        Organization: {donor.organization}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => navigate(`/admin/donors/${donor.id}`)}
                    variant="outline"
                    size="sm"
                    className="rounded-2xl border-blue-300 text-blue-700"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Profile
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}