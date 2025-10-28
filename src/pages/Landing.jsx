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
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
          Empowering Education Through
          <span className="text-green-600"> Compassionate Giving</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Connect with deserving students across Pakistan and help them achieve their educational dreams. 
          Transparent funding platform by Akhuwat USA with 100% secure donations.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button onClick={() => go("apply")} size="lg">
            Request Financial Aid
          </Button>
          <Button 
            onClick={() => navigate("/donor-signup")} 
            variant="outline" 
            size="lg"
          >
            Donor Signup
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            501(c)(3) Non-profit
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            100% Accessible
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Bank-level Security
          </span>
        </div>
      </section>

      {/* KPIs Section - Dynamic Statistics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center hover:shadow-xl transition-shadow duration-300">
          <div className="text-3xl font-bold text-green-600">{stats.sponsored}</div>
          <div className="text-sm text-gray-600 font-medium">Students Sponsored</div>
        </Card>
        <Card className="p-6 text-center hover:shadow-xl transition-shadow duration-300">
          <div className="text-3xl font-bold text-green-600">{stats.available}</div>
          <div className="text-sm text-gray-600 font-medium">Students Available</div>
        </Card>
        <Card className="p-6 text-center hover:shadow-xl transition-shadow duration-300">
          <div className="text-3xl font-bold text-green-600">{stats.universities}</div>
          <div className="text-sm text-gray-600 font-medium">Universities</div>
        </Card>
        <Card className="p-6 text-center hover:shadow-xl transition-shadow duration-300">
          <div className="text-3xl font-bold text-green-600">{stats.successRate}</div>
          <div className="text-sm text-gray-600 font-medium">Success Rate</div>
        </Card>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <Card className="p-6 hover:shadow-xl transition-all duration-300 group">
          <GraduationCap className="h-12 w-12 text-green-600 mb-4 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Whole-Student Sponsorships
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Sponsor complete educational journeys, not partial funding. Full transparency and direct impact.
          </p>
        </Card>
        <Card className="p-6 hover:shadow-xl transition-all duration-300 group">
          <TrendingUp className="h-12 w-12 text-green-600 mb-4 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Interest-Free Repayments
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Students repay without interest, following Islamic principles. Sustainable and ethical financing.
          </p>
        </Card>
        <Card className="p-6 hover:shadow-xl transition-all duration-300 group">
          <Building2 className="h-12 w-12 text-green-600 mb-4 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Built for Trust
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Rigorous verification, regular updates, and complete transparency in every transaction.
          </p>
        </Card>
      </section>
    </div>
  );
};