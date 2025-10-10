import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { AlertCircle, FileText, User, Edit3 } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const MyApplication = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadApplicationAndProfile();
    }
  }, [user, token]);

  const loadApplicationAndProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user profile first
      try {
        const profileRes = await fetch(`${API}/api/students/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }
      } catch (profileError) {
        console.error("Profile load error:", profileError);
      }

      // Load application
      try {
        const appRes = await fetch(`${API}/api/applications/my-application`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (appRes.ok) {
          const appData = await appRes.json();
          setApplication(appData);
        } else if (appRes.status === 404) {
          // No application found - this is normal for new users
          setApplication(null);
        } else {
          throw new Error("Failed to load application");
        }
      } catch (appError) {
        console.error("Application load error:", appError);
        setApplication(null);
      }

    } catch (error) {
      console.error("Load error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteApplication = () => {
    navigate("/apply");
  };

  const handleUpdateProfile = () => {
    navigate("/student/profile");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">My Application</h1>
        <Card className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Application</h1>

      {/* Welcome Message */}
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-start space-x-3">
          <User className="h-6 w-6 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-900">
              Welcome, {user?.name || "Student"}!
            </h3>
            <p className="text-sm text-green-700 mt-1">
              Your account has been created successfully. 
              {!application ? " Complete your application to apply for funding." : " Your application is submitted."}
            </p>
          </div>
        </div>
      </Card>

      {/* No Application - Show Call to Action */}
      {!application && (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Complete Your Application
              </h3>
              <p className="text-gray-600 mt-2">
                You've successfully created your account! Now complete your application 
                with your academic details and funding requirements.
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={handleCompleteApplication} className="bg-green-600 hover:bg-green-700">
                <FileText className="h-4 w-4 mr-2" />
                Complete Application
              </Button>
              <Button variant="outline" onClick={handleUpdateProfile}>
                <Edit3 className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Application Exists - Show Details */}
      {application && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Application Status</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                application.status === "PENDING" 
                  ? "bg-yellow-100 text-yellow-800"
                  : application.status === "APPROVED"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}>
                {application.status || "Under Review"}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Academic Details</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>University:</strong> {application.university}</p>
                  <p><strong>Program:</strong> {application.program}</p>
                  <p><strong>Country:</strong> {application.country}</p>
                  <p><strong>Term:</strong> {application.term}</p>
                  {application.gpa && <p><strong>GPA:</strong> {application.gpa}</p>}
                  {application.gradYear && <p><strong>Graduation Year:</strong> {application.gradYear}</p>}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Funding Request</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Amount:</strong> {
                    application.needUSD 
                      ? `$${application.needUSD} USD` 
                      : application.needPKR 
                      ? `₨${application.needPKR} PKR`
                      : "Not specified"
                  }</p>
                  <p><strong>Currency:</strong> {application.currency || "Not specified"}</p>
                  <p><strong>Applied:</strong> {
                    application.createdAt 
                      ? new Date(application.createdAt).toLocaleDateString()
                      : "Recently"
                  }</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" onClick={handleUpdateProfile}>
                <Edit3 className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Error Loading Data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadApplicationAndProfile}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Profile Info (if available) */}
      {profile && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Profile Information</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Name:</strong> {profile.name || user?.name}</p>
              <p><strong>Email:</strong> {profile.email || user?.email}</p>
            </div>
            <div>
              {profile.phone && <p><strong>Phone:</strong> {profile.phone}</p>}
              {profile.dateOfBirth && <p><strong>Date of Birth:</strong> {new Date(profile.dateOfBirth).toLocaleDateString()}</p>}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};