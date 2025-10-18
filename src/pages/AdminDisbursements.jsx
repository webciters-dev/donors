import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, Calendar, User, Send } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { API } from "@/lib/api";

export default function AdminDisbursements() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  
  const [disbursements, setDisbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    
    async function loadDisbursements() {
      try {
        setLoading(true);
        
        // Load disbursements
        const disbursementsRes = await fetch(`${API.baseURL}/api/disbursements`, { headers: authHeader });
        if (disbursementsRes.ok) {
          const disbursementsData = await disbursementsRes.json();
          setDisbursements(disbursementsData.disbursements || []);
        }
        
      } catch (error) {
        console.error("Failed to load disbursements:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadDisbursements();
  }, [token, user, navigate]);

  const filteredDisbursements = disbursements.filter(disbursement =>
    disbursement.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    disbursement.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDisbursed = disbursements.reduce((sum, disbursement) => sum + (disbursement.amount || 0), 0);

  if (!token || user?.role !== 'ADMIN') {
    return <div>Access denied</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">💸 Disbursements Management</h1>
          <p className="text-slate-600">Track funds disbursed to students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl" onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button className="rounded-2xl bg-emerald-600 hover:bg-emerald-700">
            <Send className="h-4 w-4 mr-2" />
            New Disbursement
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {disbursements.length}
          </div>
          <div className="text-sm text-slate-600">Total Disbursements</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            ${totalDisbursed.toLocaleString()}
          </div>
          <div className="text-sm text-slate-600">Total Amount</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {disbursements.filter(d => {
              const disbursedDate = new Date(d.createdAt);
              const today = new Date();
              return disbursedDate.toDateString() === today.toDateString();
            }).length}
          </div>
          <div className="text-sm text-slate-600">Today's Disbursements</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by student name or purpose..."
            className="pl-10 rounded-2xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Disbursements List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-6 text-center">
            <div className="text-slate-600">Loading disbursements...</div>
          </Card>
        ) : filteredDisbursements.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="text-slate-600">
              {searchTerm ? `No disbursements found for "${searchTerm}"` : 'No disbursements yet'}
            </div>
            <Button className="mt-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700">
              <Send className="h-4 w-4 mr-2" />
              Create First Disbursement
            </Button>
          </Card>
        ) : (
          filteredDisbursements.map((disbursement) => (
            <Card key={disbursement.id} className="p-4 border-l-4 border-l-blue-500 bg-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Send className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">
                      Disbursement to {disbursement.student?.name || 'Unknown Student'}
                    </h3>
                    <Badge variant="default" className="bg-blue-600">
                      ${disbursement.amount?.toLocaleString()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">
                        <strong>Purpose:</strong> {disbursement.purpose || 'General funding'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">
                        <strong>Date:</strong> {new Date(disbursement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">
                        <strong>Method:</strong> {disbursement.method || 'Bank transfer'}
                      </span>
                    </div>
                  </div>
                  
                  {disbursement.notes && (
                    <div className="mt-2">
                      <span className="text-xs text-slate-500">
                        Notes: {disbursement.notes}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl border-blue-300 text-blue-700"
                  >
                    View Details
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