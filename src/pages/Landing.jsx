import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Users, Building2, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const Landing = ({ go }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    sponsored: '—',
    available: '—', 
    universities: '—',
    successRate: '—'
  });

  useEffect(() => {
    // Fetch real statistics from API
    const fetchStats = async () => {
      try {
        const API = import.meta.env.VITE_API_URL || "http://localhost:3001";
        // You can implement these endpoints later for real data
        // For now, show clean placeholders
        setStats({
          sponsored: '0',
          available: '0',
          universities: '0', 
          successRate: '—'
        });
      } catch (error) {

      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900">
          Empowering Education Through
          <span className="text-emerald-600"> Compassionate Giving</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Connect with deserving students across Pakistan and help them achieve their educational dreams. 
          Transparent funding platform by Akhuwat USA with 100% secure donations.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={() => go("apply")} size="lg" className="rounded-2xl">
            Request Financial Aid
          </Button>
          <Button 
            onClick={() => navigate("/donor-signup")} 
            variant="outline" 
            size="lg" 
            className="rounded-2xl"
          >
            Donor Signup
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-600">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
            501(c)(3) Non-profit
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
            100% Accessible
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
            Bank-level Security
          </span>
        </div>
      </section>

      {/* KPIs Section - Dynamic Statistics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-emerald-600">{stats.sponsored}</div>
          <div className="text-sm text-slate-600">Students Sponsored</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-emerald-600">{stats.available}</div>
          <div className="text-sm text-slate-600">Students Available</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-emerald-600">{stats.universities}</div>
          <div className="text-sm text-slate-600">Universities</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-emerald-600">{stats.successRate}</div>
          <div className="text-sm text-slate-600">Success Rate</div>
        </Card>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <Card className="p-6">
          <GraduationCap className="h-12 w-12 text-emerald-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Whole-Student Sponsorships
          </h3>
          <p className="text-slate-600">
            Sponsor complete educational journeys, not partial funding. Full transparency and direct impact.
          </p>
        </Card>
        <Card className="p-6">
          <TrendingUp className="h-12 w-12 text-emerald-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Interest-Free Repayments
          </h3>
          <p className="text-slate-600">
            Students repay without interest, following Islamic principles. Sustainable and ethical financing.
          </p>
        </Card>
        <Card className="p-6">
          <Building2 className="h-12 w-12 text-emerald-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Built for Trust
          </h3>
          <p className="text-slate-600">
            Rigorous verification, regular updates, and complete transparency in every transaction.
          </p>
        </Card>
      </section>
    </div>
  );
};