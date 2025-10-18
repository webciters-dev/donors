import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, MapPin, Building2, Calendar, DollarSign, Heart } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { API } from "@/lib/api";

export default function AdminDonorDetail() {
  const { donorId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  
  const [donor, setDonor] = useState(null);
  const [sponsorships, setSponsorships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !donorId) return;
    
    async function loadDonorDetails() {
      try {
        setLoading(true);
        
        // Get donor details
        const donorRes = await fetch(`${API.baseURL}/api/donors/${donorId}`, { headers: authHeader });
        if (donorRes.ok) {
          const donorData = await donorRes.json();
          setDonor(donorData.donor);
        } else {
          toast.error("Failed to load donor details");
          navigate("/admin");
          return;
        }
        
        // Get donor's sponsorships
        const sponsorshipsRes = await fetch(`${API.baseURL}/api/sponsorships?donorId=${donorId}`, { headers: authHeader });
        if (sponsorshipsRes.ok) {
          const sponsorshipsData = await sponsorshipsRes.json();
          setSponsorships(sponsorshipsData.sponsorships || []);
        }
        
        // TODO: Load applications to get application IDs for proper navigation
        
      } catch (error) {
        console.error("Failed to load donor details:", error);
        toast.error("Failed to load donor details");
        navigate("/admin");
      } finally {
        setLoading(false);
      }
    }
    
    loadDonorDetails();
  }, [donorId, token, navigate]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-8">
        <div className="text-center">Loading donor details...</div>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-8">
        <div className="text-center">Donor not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Donor Profile</h1>
      </div>

      {/* Donor Information */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{donor.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-slate-600">{donor.email}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {donor.organization && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">{donor.organization}</span>
                </div>
              )}
              
              {donor.country && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-600">{donor.country}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-slate-600">Joined {new Date(donor.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-slate-500" />
                <span className="text-slate-600">Total Funded: ${donor.totalFunded?.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <Badge variant="default" className="bg-blue-600">
            {donor.sponsorshipCount || 0} Sponsorship{(donor.sponsorshipCount || 0) !== 1 ? 's' : ''}
          </Badge>
        </div>
      </Card>

      {/* Sponsorships */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Sponsorships
        </h3>
        
        {sponsorships.length === 0 ? (
          <p className="text-slate-600">No sponsorships yet.</p>
        ) : (
          <div className="space-y-4">
            {sponsorships.map((sponsorship) => (
              <Card key={sponsorship.id} className="p-4 border-l-4 border-l-emerald-500 bg-emerald-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-emerald-900">{sponsorship.student?.name}</h4>
                    <p className="text-sm text-emerald-800">
                      {sponsorship.student?.program} at {sponsorship.student?.university}
                    </p>
                    <p className="text-sm text-emerald-700">
                      Amount: ${sponsorship.amount?.toLocaleString()} | 
                      Date: {new Date(sponsorship.date).toLocaleDateString()} |
                      Status: {sponsorship.status}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      // Navigate to the student's application detail page
                      const applicationId = sponsorship.student?.applications?.[0]?.id;
                      if (applicationId) {
                        navigate(`/admin/applications/${applicationId}`);
                      } else {
                        // Fallback if no application ID found
                        navigate(`/admin/applications`);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="rounded-2xl border-emerald-300 text-emerald-700"
                  >
                    View Student
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}