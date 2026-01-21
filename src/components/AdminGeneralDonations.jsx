// src/components/AdminGeneralDonations.jsx
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DollarSign, 
  Calendar, 
  Download, 
  RefreshCw, 
  TrendingUp,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { API } from "@/lib/api";

export default function AdminGeneralDonations() {
  const { token } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [donations, setDonations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [totals, setTotals] = useState({ totalAmount: 0, totalDonations: 0 });
  const [stats, setStats] = useState(null);
  
  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Load donations
  const loadDonations = async (page = 1) => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', '20');
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(
        `${API.baseURL}/api/general-donations/admin?${params}`,
        { headers: authHeader }
      );
      
      if (!response.ok) {
        throw new Error('Failed to load donations');
      }
      
      const data = await response.json();
      setDonations(data.donations || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, totalCount: 0 });
      setTotals(data.totals || { totalAmount: 0, totalDonations: 0 });
      
    } catch (error) {
      console.error('Error loading donations:', error);
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStats = async () => {
    if (!token) return;
    
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(
        `${API.baseURL}/api/general-donations/admin/stats?${params}`,
        { headers: authHeader }
      );
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Export to CSV
  const handleExport = async () => {
    if (!token) return;
    
    try {
      setExporting(true);
      
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(
        `${API.baseURL}/api/general-donations/admin/export?${params}`,
        { headers: authHeader }
      );
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `general-donations-${startDate || 'all'}-to-${endDate || 'now'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Donations exported successfully!');
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export donations');
    } finally {
      setExporting(false);
    }
  };

  // Apply date filters
  const handleFilter = () => {
    loadDonations(1);
    loadStats();
  };

  // Clear filters
  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setTimeout(() => {
      loadDonations(1);
      loadStats();
    }, 0);
  };

  // Initial load
  useEffect(() => {
    loadDonations();
    loadStats();
  }, [token]);

  // Format currency
  const formatAmount = (amount) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Total Amount</p>
              <p className="text-xl font-bold text-green-700">
                {loading ? '...' : formatAmount(totals.totalAmount)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Donations</p>
              <p className="text-xl font-bold text-blue-700">
                {loading ? '...' : totals.totalDonations}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-purple-600 font-medium">Average Donation</p>
              <p className="text-xl font-bold text-purple-700">
                {loading || !stats ? '...' : formatAmount(stats.period?.averageAmount || 0)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-600 font-medium">All-Time Total</p>
              <p className="text-xl font-bold text-amber-700">
                {loading || !stats ? '...' : formatAmount(stats.allTime?.totalAmount || 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">From Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">To Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={handleFilter} variant="default" className="bg-green-600 hover:bg-green-700">
            <Calendar className="h-4 w-4 mr-2" />
            Apply Filter
          </Button>
          <Button onClick={handleClearFilters} variant="outline">
            Clear
          </Button>
          <div className="flex-grow" />
          <Button onClick={handleExport} variant="outline" disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export CSV
          </Button>
          <Button onClick={() => loadDonations(pagination.page)} variant="ghost" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Donations Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
            <p className="mt-2 text-gray-600">Loading donations...</p>
          </div>
        ) : donations.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600">No donations found</p>
            <p className="text-sm text-gray-400 mt-1">
              {startDate || endDate ? 'Try adjusting your date filters' : 'Donations will appear here once received'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Donor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{donation.fullName}</TableCell>
                      <TableCell className="text-gray-600">{donation.email}</TableCell>
                      <TableCell className="text-gray-600">
                        {donation.city}, {donation.state} {donation.zipCode}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatAmount(donation.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={donation.paymentStatus === 'COMPLETED' ? 'default' : 'secondary'}
                          className={donation.paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' : ''}
                        >
                          {donation.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {formatDate(donation.paidAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-600">
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadDonations(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadDonations(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Recent Donations (Quick View) */}
      {stats?.recentDonations?.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Recent Donations</h4>
          <div className="space-y-2">
            {stats.recentDonations.map((donation) => (
              <div key={donation.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <span className="font-medium">{donation.fullName}</span>
                  <span className="text-gray-400 text-sm ml-2">
                    {donation.paidAt ? new Date(donation.paidAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <span className="font-semibold text-green-600">{formatAmount(donation.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
