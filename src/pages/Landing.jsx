import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Users, Building2, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCMSContent } from "@/lib/cms";

export const Landing = ({ go }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    sponsored: '—',
    available: '—', 
    universities: '—'
  });

  useEffect(() => {
    // Fetch real statistics from API
    const fetchStats = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
        const response = await fetch(`${API_BASE}/api/statistics`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setStats({
              sponsored: result.data.sponsored.toString(),
              available: result.data.available.toString(),
              universities: result.data.universities.toString()
            });
          }
        } else {
          console.warn('Failed to fetch statistics, using fallback data');
          // Fallback to zeros if API fails
          setStats({
            sponsored: '0',
            available: '0',
            universities: '0'
          });
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
        // Fallback to zeros if API fails
        setStats({
          sponsored: '0',
          available: '0',
          universities: '0'
        });
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 leading-tight px-4">
          Empowering Education Through
          <span className="text-green-600"> {getCMSContent('hero.title')}</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
          {getCMSContent('hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 px-4">
          <Button 
            onClick={() => go("apply")} 
            size="lg"
            className="w-full sm:w-auto min-h-[44px]"
          >
            {getCMSContent('hero.primaryButton')}
          </Button>
          <Button 
            onClick={() => navigate("/donor-signup")} 
            variant="outline" 
            size="lg"
            className="w-full sm:w-auto min-h-[44px]"
          >
            {getCMSContent('hero.secondaryButton')}
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
          {getCMSContent('trustIndicators.nonprofit.enabled') && (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {getCMSContent('trustIndicators.nonprofit.text')}
            </span>
          )}
          {getCMSContent('trustIndicators.accessible.enabled') && (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {getCMSContent('trustIndicators.accessible.text')}
            </span>
          )}
          {getCMSContent('trustIndicators.security.enabled') && (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {getCMSContent('trustIndicators.security.text')}
            </span>
          )}
        </div>
      </section>

      {/* KPIs Section - Dynamic Statistics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-4">
        <Card className="p-4 md:p-6 text-center hover:shadow-xl transition-shadow duration-300">
          <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.sponsored}</div>
          <div className="text-xs md:text-sm text-gray-600 font-medium">{getCMSContent('statistics.sponsored.label')}</div>
        </Card>
        <Card className="p-4 md:p-6 text-center hover:shadow-xl transition-shadow duration-300">
          <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.available}</div>
          <div className="text-xs md:text-sm text-gray-600 font-medium">{getCMSContent('statistics.available.label')}</div>
        </Card>
        <Card className="p-4 md:p-6 text-center hover:shadow-xl transition-shadow duration-300">
          <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.universities}</div>
          <div className="text-xs md:text-sm text-gray-600 font-medium">{getCMSContent('statistics.universities.label')}</div>
        </Card>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-6 md:gap-8 px-4">
        <Card className="p-6 hover:shadow-xl transition-all duration-300 group">
          <GraduationCap className="h-10 md:h-12 w-10 md:w-12 text-green-600 mb-4 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {getCMSContent('features.wholeStudent.title')}
          </h3>
          <p className="text-gray-600 leading-relaxed text-sm md:text-base">
            {getCMSContent('features.wholeStudent.description')}
          </p>
        </Card>
        <Card className="p-6 hover:shadow-xl transition-all duration-300 group">
          <TrendingUp className="h-10 md:h-12 w-10 md:w-12 text-green-600 mb-4 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {getCMSContent('features.interestFree.title')}
          </h3>
          <p className="text-gray-600 leading-relaxed text-sm md:text-base">
            {getCMSContent('features.interestFree.description')}
          </p>
        </Card>
        <Card className="p-6 hover:shadow-xl transition-all duration-300 group">
          <Building2 className="h-10 md:h-12 w-10 md:w-12 text-green-600 mb-4 group-hover:scale-110 transition-transform duration-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {getCMSContent('features.builtForTrust.title')}
          </h3>
          <p className="text-gray-600 leading-relaxed text-sm md:text-base">
            {getCMSContent('features.builtForTrust.description')}
          </p>
        </Card>
      </section>
    </div>
  );
};