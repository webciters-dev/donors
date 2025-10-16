// src/pages/DonorBrowse.jsx (dynamic with API)
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtAmount } from "@/data/demoDonor";
import { getCurrencyFlag, getCurrencyFromCountry } from "@/lib/currency";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function DonorBrowse() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudents() {
      try {
        console.log("🔍 DonorBrowse: Fetching from:", `${API}/api/students/approved`);
        const res = await fetch(`${API}/api/students/approved`);
        
        if (res.ok) {
          const data = await res.json();
          console.log("🔍 DonorBrowse: API Response:", data);
          const apiStudents = Array.isArray(data?.students) ? data.students : [];
          
          // Transform for display - filter out sponsored students (ONE STUDENT = ONE DONOR)
          const transformedStudents = apiStudents
            .filter(s => {
              const remainingNeed = Number(s?.remainingNeed || s?.needUSD || 0);
              const isSponsored = Boolean(s?.sponsored) || remainingNeed <= 0;
              return s.isApproved && !isSponsored; // Only show approved and unsponsored students
            })
            .map(student => ({
              ...student,
              currency: student.application?.currency || getCurrencyFromCountry(student.country) || 'USD',
              displayAmount: student.remainingNeed || student.needUSD || 0
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
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-emerald-900">Sponsor a Student Today</h1>
          <Button 
            onClick={() => navigate("/donor-signup")} 
            className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl px-6"
          >
            Join as Donor
          </Button>
        </div>
        <p className="text-emerald-800 text-sm max-w-2xl">
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
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🎓</div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No Students Available Yet</h3>
          <p className="text-slate-600 max-w-md mx-auto mb-6">
            We're currently processing student applications. Check back soon to see deserving students who need your support!
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate("/donor-signup")} 
              className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl px-6"
            >
              Donor Signup
            </Button>
            <p className="text-sm text-slate-500">
              Get notified when verified students are ready for sponsorship
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {students.map((student) => (
            <Card key={student.id} className="p-6 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-lg font-semibold text-slate-900">Student Profile</div>
                  <div className="text-sm text-slate-600">{student.program} • {student.university}</div>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                  {getCurrencyFlag(student.currency)} {fmtAmount(student.displayAmount, student.currency)}
                </Badge>
              </div>
              
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Location</span>
                  <span>{student.city}, {student.province}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Field of Study</span>
                  <span className="font-medium">{student.program}</span>
                </div>
                {student.gradYear && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Graduation Year</span>
                    <span>{student.gradYear}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">Funding Goal</span>
                  <span className="text-emerald-600 font-medium">
                    {getCurrencyFlag(student.currency)} {fmtAmount(student.displayAmount, student.currency)}
                  </span>
                </div>
              </div>
              
              <div className="mt-auto space-y-2">
                <Button 
                  variant="default" 
                  className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700" 
                  onClick={() => navigate("/login", { state: { redirectTo: "/marketplace" } })}
                >
                  Start Sponsoring
                </Button>
                <p className="text-xs text-slate-500 text-center">
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
