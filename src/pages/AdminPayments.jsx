import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, DollarSign, Calendar, User, CreditCard } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { API } from "@/lib/api";

export default function AdminPayments() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    
    async function loadPayments() {
      try {
        setLoading(true);
        
        // Load sponsorships which contain payment information
        const sponsorshipsRes = await fetch(`${API.baseURL}/api/sponsorships`, { headers: authHeader });
        if (sponsorshipsRes.ok) {
          const sponsorshipsData = await sponsorshipsRes.json();
          setPayments(sponsorshipsData.sponsorships || []);
        }
        
      } catch (error) {
        console.error("Failed to load payments:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadPayments();
  }, [token, user, navigate]);

  const filteredPayments = payments.filter(payment =>
    payment.donor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.stripePaymentIntentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPayments = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  if (!token || user?.role !== 'ADMIN') {
    return <div>Access denied</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">💳 Payments Overview</h1>
          <p className="text-slate-600">Track all payments received from donors</p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline" className="rounded-2xl">
          Back
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {payments.length}
          </div>
          <div className="text-sm text-slate-600">Total Payments</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            ${totalPayments.toLocaleString()}
          </div>
          <div className="text-sm text-slate-600">Total Amount</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {payments.filter(p => p.status === 'active').length}
          </div>
          <div className="text-sm text-slate-600">Active Sponsorships</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by donor name, student name, or payment ID..."
            className="pl-10 rounded-2xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Payments List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-6 text-center">
            <div className="text-slate-600">Loading payments...</div>
          </Card>
        ) : filteredPayments.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="text-slate-600">
              {searchTerm ? `No payments found for "${searchTerm}"` : 'No payments found'}
            </div>
          </Card>
        ) : (
          filteredPayments.map((payment) => (
            <Card key={payment.id} className="p-4 border-l-4 border-l-emerald-500 bg-emerald-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-medium text-emerald-900">
                      Payment from {payment.donor?.name || 'Unknown Donor'}
                    </h3>
                    <Badge variant="default" className="bg-emerald-600">
                      ${payment.amount?.toLocaleString()}
                    </Badge>
                    <Badge variant="outline" className={`
                      ${payment.status === 'active' ? 'border-green-300 text-green-700' : 'border-slate-300 text-slate-700'}
                    `}>
                      {payment.status || 'unknown'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">
                        <strong>Student:</strong> {payment.student?.name || 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">
                        <strong>Date:</strong> {new Date(payment.date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-600">
                        <strong>Type:</strong> {payment.paymentFrequency || 'one-time'}
                      </span>
                    </div>
                  </div>
                  
                  {payment.stripePaymentIntentId && (
                    <div className="mt-2">
                      <span className="text-xs text-slate-500">
                        Payment ID: {payment.stripePaymentIntentId}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => navigate(`/admin/donors/${payment.donor?.id}`)}
                    variant="outline"
                    size="sm"
                    className="rounded-2xl border-emerald-300 text-emerald-700"
                  >
                    View Donor
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