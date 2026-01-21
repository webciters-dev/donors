import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Users, Building2, TrendingUp, X, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCMSContent } from "@/lib/cms";
import { useAuth } from "@/lib/AuthContext";
import { fmtAmountDual } from "@/lib/currency";

export const Landing = ({ go }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    sponsored: '—',
    available: '—', 
    universities: '—'
  });
  
  // Modal states
  const [showSponsoredModal, setShowSponsoredModal] = useState(false);
  const [showUniversitiesModal, setShowUniversitiesModal] = useState(false);
  const [sponsoredStudents, setSponsoredStudents] = useState([]);
  const [universitiesList, setUniversitiesList] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

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

  // Fetch sponsored students when modal opens
  const fetchSponsoredStudents = async () => {
    setLoadingModal(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${API_BASE}/api/statistics/sponsored-students`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSponsoredStudents(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching sponsored students:', error);
    } finally {
      setLoadingModal(false);
    }
  };

  // Fetch universities when modal opens
  const fetchUniversities = async () => {
    setLoadingModal(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${API_BASE}/api/statistics/universities`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUniversitiesList(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
    } finally {
      setLoadingModal(false);
    }
  };

  // Handle card clicks
  const handleSponsoredClick = () => {
    fetchSponsoredStudents();
    setShowSponsoredModal(true);
  };

  const handleAvailableClick = () => {
    navigate('/browse');
  };

  const handleUniversitiesClick = () => {
    fetchUniversities();
    setShowUniversitiesModal(true);
  };

  return (
    <div className="space-y-12">
      {/* Sponsored Students Modal */}
      {showSponsoredModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSponsoredModal(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b bg-green-50">
              <h2 className="text-xl font-semibold text-gray-900">Students Sponsored</h2>
              <button onClick={() => setShowSponsoredModal(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-60px)] p-4">
              {loadingModal ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : sponsoredStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No sponsored students yet</div>
              ) : (
                <div className="space-y-3">
                  {sponsoredStudents.map((student) => (
                    <div key={student.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      {student.photoThumbnailUrl ? (
                        <img src={student.photoThumbnailUrl} alt={student.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <Users className="h-6 w-6 text-green-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{student.name}</div>
                        <div className="text-sm text-gray-600 truncate">{student.program || student.field || 'Program not specified'}</div>
                        <div className="text-xs text-gray-500 truncate">{student.university}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">{fmtAmountDual(student.sponsoredAmount, student.currency)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Universities Modal */}
      {showUniversitiesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowUniversitiesModal(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b bg-green-50">
              <h2 className="text-xl font-semibold text-gray-900">Partner Universities</h2>
              <button onClick={() => setShowUniversitiesModal(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-60px)] p-4">
              {loadingModal ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : universitiesList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No universities yet</div>
              ) : (
                <div className="space-y-2">
                  {universitiesList.map((uni, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{uni.name}</div>
                          <div className="text-xs text-gray-500">{uni.country}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {uni.studentCount} student{uni.studentCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
          {user?.role === 'STUDENT' && (
            <Button 
              onClick={() => go("apply")} 
              size="lg"
              className="w-full sm:w-auto min-h-[44px]"
            >
              {getCMSContent('hero.primaryButton')}
            </Button>
          )}
          {user?.role !== 'DONOR' && (
            <Button 
              onClick={() => navigate("/donor-signup")} 
              variant="outline" 
              size="lg"
              className="w-full sm:w-auto min-h-[44px]"
            >
              {getCMSContent('hero.secondaryButton')}
            </Button>
          )}
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

      {/* KPIs Section - Dynamic Statistics (Clickable) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-4">
        <Card 
          className="p-4 md:p-6 text-center hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:border-green-300"
          onClick={handleSponsoredClick}
        >
          <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.sponsored}</div>
          <div className="text-xs md:text-sm text-gray-600 font-medium">{getCMSContent('statistics.sponsored.label')}</div>
          <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>View list</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </Card>
        <Card 
          className="p-4 md:p-6 text-center hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:border-green-300"
          onClick={handleAvailableClick}
        >
          <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.available}</div>
          <div className="text-xs md:text-sm text-gray-600 font-medium">{getCMSContent('statistics.available.label')}</div>
          <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Browse students</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </Card>
        <Card 
          className="p-4 md:p-6 text-center hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:border-green-300"
          onClick={handleUniversitiesClick}
        >
          <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.universities}</div>
          <div className="text-xs md:text-sm text-gray-600 font-medium">{getCMSContent('statistics.universities.label')}</div>
          <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>View universities</span>
            <ChevronRight className="h-3 w-3" />
          </div>
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