// src/pages/StudentProgress.jsx - Complete progress tracking for sponsored students
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { submitProgressUpdate, getStudentProgress, checkSponsorshipStatus } from '@/api/studentProgress';
import { 
  ArrowLeft,
  Upload, 
  FileText, 
  GraduationCap, 
  TrendingUp, 
  Calendar,
  Award,
  BookOpen,
  Target,
  Users,
  CheckCircle,
  Clock,
  Plus
} from "lucide-react";
import { API } from "@/lib/api";

export default function StudentProgress() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [sponsorship, setSponsorship] = useState(null);
  
  // Form state for new progress update
  const [formData, setFormData] = useState({
    term: "",
    gpa: "",
    coursesCompleted: "",
    creditsEarned: "",
    achievements: "",
    challenges: "",
    goals: "",
    notes: "",
    updateType: "academic" // academic, achievement, milestone, other
  });
  
  const [files, setFiles] = useState({
    transcript: null,
    certificates: null,
    projects: null
  });

  useEffect(() => {
    loadProgressData();
  }, [token]);

  const loadProgressData = async () => {
    if (!token || !user?.studentId) return;
    
    try {
      setLoading(true);
      
      // Check sponsorship status
      const sponsorshipData = await checkSponsorshipStatus(user.studentId);
      setSponsorship(sponsorshipData.sponsorship || null);
      
      // Load existing progress updates
      const progressData = await getStudentProgress(user.studentId);
      setProgressUpdates(progressData.progressUpdates || []);
      
    } catch (error) {
      console.error('Error loading progress data:', error);
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (type, event) => {
    const file = event.target.files[0];
    if (file && file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.term || !formData.gpa) {
      toast.error('Please fill in required fields (Term and CGPA)');
      return;
    }
    
    if (!sponsorship) {
      toast.error('Progress updates are only available for sponsored students');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const progressData = {
        ...formData,
        studentId: user.studentId
      };
      
      const result = await submitProgressUpdate(progressData, files);
      
      if (result.success) {
        toast.success('Progress update submitted successfully!');
        
        // Reset form
        setFormData({
          term: "",
          gpa: "",
          coursesCompleted: "",
          creditsEarned: "",
          achievements: "",
          challenges: "",
          goals: "",
          notes: "",
          updateType: "academic"
        });
        setFiles({ transcript: null, certificates: null, projects: null });
        
        // Reload progress data
        loadProgressData();
      }
      
    } catch (error) {
      console.error('Error submitting progress:', error);
      toast.error(error.message || 'Failed to submit progress update');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'STUDENT') {
    return (
      <Card className="p-6">
        <p className="text-gray-700">Students only.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/student/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Academic Progress</h1>
          <p className="text-gray-600 leading-relaxed">Share your academic journey with your sponsors</p>
        </div>
      </div>

      {/* Sponsorship Status */}
      {sponsorship && (
        <Card className="p-4 border-l-4 border-l-green-500 bg-green-50 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-green-800">
                Sponsored by {sponsorship.donor?.name}
              </h3>
              <p className="text-sm text-green-700 leading-relaxed">
                Your sponsor is interested in your progress. Regular updates help maintain a strong relationship!
              </p>
            </div>
            <Badge variant="default" className="bg-green-600">
              ${sponsorship.amount?.toLocaleString()} Funded
            </Badge>
          </div>
        </Card>
      )}

      {!sponsorship && (
        <Card className="p-4 border-l-4 border-l-blue-500 bg-blue-50">
          <div className="text-center">
            <h3 className="font-medium text-blue-800 mb-2">Not Yet Sponsored</h3>
            <p className="text-sm text-blue-700">
              Once you receive sponsorship, you'll be able to share progress updates with your donor here.
            </p>
          </div>
        </Card>
      )}

      {/* New Progress Update Form */}
      {sponsorship && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold">Submit New Progress Update</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Academic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Current Term/Semester *
                </label>
                <Input
                  value={formData.term}
                  onChange={(e) => setFormData({...formData, term: e.target.value})}
                  placeholder="e.g., Fall 2024, Semester 3"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  CGPA *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={formData.gpa}
                  onChange={(e) => setFormData({...formData, gpa: e.target.value})}
                  placeholder="e.g., 3.75"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Courses Completed This Term
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.coursesCompleted}
                  onChange={(e) => setFormData({...formData, coursesCompleted: e.target.value})}
                  placeholder="e.g., 5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Credits Earned
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.creditsEarned}
                  onChange={(e) => setFormData({...formData, creditsEarned: e.target.value})}
                  placeholder="e.g., 15"
                />
              </div>
            </div>

            {/* Update Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Update Type</label>
              <select
                value={formData.updateType}
                onChange={(e) => setFormData({...formData, updateType: e.target.value})}
                className="w-full p-2 border border-slate-300 rounded-md"
              >
                <option value="academic">Academic Progress</option>
                <option value="achievement">Achievement/Award</option>
                <option value="milestone">Major Milestone</option>
                <option value="other">Other Update</option>
              </select>
            </div>

            {/* Detailed Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Award className="h-4 w-4 inline mr-1" />
                  Achievements & Awards
                </label>
                <textarea
                  value={formData.achievements}
                  onChange={(e) => setFormData({...formData, achievements: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-md resize-none"
                  rows={3}
                  placeholder="Share any academic achievements, awards, recognitions, or notable accomplishments..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Target className="h-4 w-4 inline mr-1" />
                  Challenges & How You Overcame Them
                </label>
                <textarea
                  value={formData.challenges}
                  onChange={(e) => setFormData({...formData, challenges: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-md resize-none"
                  rows={3}
                  placeholder="Describe any challenges you faced and how you addressed them..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  Future Goals & Plans
                </label>
                <textarea
                  value={formData.goals}
                  onChange={(e) => setFormData({...formData, goals: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-md resize-none"
                  rows={3}
                  placeholder="Share your goals for the upcoming term or future career plans..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <BookOpen className="h-4 w-4 inline mr-1" />
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-md resize-none"
                  rows={3}
                  placeholder="Any other updates, experiences, or messages for your sponsor..."
                />
              </div>
            </div>

            {/* File Uploads */}
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Supporting Documents
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Transcript/Grade Report
                  </label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('transcript', e)}
                  />
                  {files.transcript && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {files.transcript.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Certificates/Awards
                  </label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('certificates', e)}
                  />
                  {files.certificates && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {files.certificates.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Projects/Portfolio
                  </label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('projects', e)}
                  />
                  {files.projects && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {files.projects.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full rounded-2xl"
            >
              {submitting ? 'Submitting...' : 'Submit Progress Update'}
            </Button>
          </form>
        </Card>
      )}

      {/* Previous Progress Updates */}
      {progressUpdates.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Previous Updates</h2>
          <div className="space-y-4">
            {progressUpdates.map((update, index) => (
              <div key={index} className="border rounded-lg p-4 bg-slate-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {update.term}
                    </Badge>
                    <Badge variant="secondary">
                      GPA: {update.gpa}
                    </Badge>
                    <Badge 
                      variant={update.updateType === 'achievement' ? 'default' : 'outline'}
                    >
                      {update.updateType}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(update.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                
                {update.achievements && (
                  <div className="mb-2">
                    <strong className="text-sm">Achievements:</strong>
                    <p className="text-sm text-slate-700">{update.achievements}</p>
                  </div>
                )}
                
                {update.notes && (
                  <div>
                    <strong className="text-sm">Notes:</strong>
                    <p className="text-sm text-slate-700">{update.notes}</p>
                  </div>
                )}
                
                {update.documents?.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {update.documents.map((doc, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {doc.type}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading && (
        <Card className="p-8 text-center">
          <div className="text-slate-600">Loading progress data...</div>
        </Card>
      )}
    </div>
  );
}