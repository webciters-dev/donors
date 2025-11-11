// src/pages/DonorBrowse.jsx (dynamic with API)
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtAmount, fmtAmountDual } from "@/data/demoDonor";
import { getCurrencyFlag, getCurrencyFromCountry } from "@/lib/currency";
import { useNavigate } from "react-router-dom";
import { API } from "@/lib/api";

export default function DonorBrowse() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudents() {
      try {
        console.log("🔍 DonorBrowse: Fetching from:", `${API.baseURL}/api/students/approved`);
        const res = await fetch(`${API.baseURL}/api/students/approved`);
        
        if (res.ok) {
          const data = await res.json();
          console.log("🔍 DonorBrowse: API Response:", data);
          const apiStudents = Array.isArray(data?.students) ? data.students : [];
          
          // Transform for display - filter out sponsored students (ONE STUDENT = ONE DONOR)
          const transformedStudents = apiStudents
            .filter(s => {
              const isSponsored = Boolean(s?.sponsored);
              return s.isApproved && !isSponsored; // Only show approved and unsponsored students
            })
            .map(student => ({
              ...student,
              currency: student.application?.currency || getCurrencyFromCountry(student.country) || 'USD',
              displayAmount: student.application?.amount || 0
            }));
          
          console.log("🔍 DonorBrowse: Transformed students:", transformedStudents);
          setStudents(transformedStudents);
        }
      } catch (error) {
        console.error("🔍 DonorBrowse: API Error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 sm:p-6 mb-6 hover:shadow-lg transition-shadow duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-green-900">Sponsor a Student Today</h1>
          <Button 
            onClick={() => navigate("/donor-signup")} 
            className="bg-green-600 hover:bg-green-700 px-6 min-h-[44px] w-full sm:w-auto"
          >
            Join as Donor
          </Button>
        </div>
        <p className="text-green-800 text-xs sm:text-sm max-w-2xl leading-relaxed">
          💡 Transform lives through education. Browse verified students who need your support to achieve their academic dreams. 
          <strong> Create your donor account to unlock detailed profiles and start making an impact.</strong>
        </p>
      </div>

      {/* Students display */}
      {loading ? (
        <div className="text-center py-16">
          <div className="text-2xl mb-4">Loading...</div>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-4">
          <div className="text-5xl sm:text-6xl mb-4">🎓</div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No Students Available Yet</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6 leading-relaxed text-sm sm:text-base">
            We're currently processing student applications. Check back soon to see deserving students who need your support!
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate("/donor-signup")} 
              className="bg-green-600 hover:bg-green-700 px-6 min-h-[44px] w-full sm:w-auto"
            >
              Donor Signup
            </Button>
            <p className="text-xs sm:text-sm text-gray-500">
              Get notified when verified students are ready for sponsorship
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {students.map((student) => (
            <Card key={student.id} className="p-6 flex flex-col hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">Student Profile</div>
                  <div className="text-sm text-gray-600">{student.program} • {student.university}</div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {getCurrencyFlag(student.currency)} {fmtAmountDual(student.displayAmount, student.currency)}
                </Badge>
              </div>
              
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Location</span>
                  <span className="text-gray-900">{student.city}, {student.province}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Field of Study</span>
                  <span className="font-medium">{student.program}</span>
                </div>
                {student.gradYear && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Graduation Year</span>
                    <span>{student.gradYear}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Funding Goal</span>
                  <span className="text-green-600 font-medium">
                    {getCurrencyFlag(student.currency)} {fmtAmountDual(student.displayAmount, student.currency)}
                  </span>
                </div>
              </div>
              
              <div className="mt-auto space-y-2">
                <Button 
                  variant="default" 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  onClick={() => navigate("/login", { state: { redirectTo: "/marketplace" } })}
                >
                  Start Sponsoring
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Sign in to view complete profile and make a difference
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
