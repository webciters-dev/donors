import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Clock, Users, ArrowRight } from "lucide-react";

export const ThankYou = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [applicationId] = useState(location.state?.applicationId || "");

  // Auto-redirect after 8 seconds if user doesn't take action
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/student/application", { replace: true });
    }, 8000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Main Success Card */}
        <Card className="border-0 shadow-2xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-12 sm:px-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-400 rounded-full blur-lg opacity-50 animate-pulse"></div>
                <div className="relative bg-white rounded-full p-4 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 sm:h-14 sm:w-14 text-green-600" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Application Submitted!
            </h1>
            <p className="text-green-50 text-base sm:text-lg">
              Your application has been successfully submitted for review.
            </p>
          </div>

          {/* Content Section */}
          <div className="px-6 py-8 sm:px-8">
            
            {/* Application ID */}
            {applicationId && (
              <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <p className="text-sm text-blue-600 mb-1 font-medium">Application ID</p>
                <p className="font-mono text-lg text-blue-900 break-all">{applicationId}</p>
                <p className="text-xs text-blue-500 mt-2">Save this ID for your records</p>
              </div>
            )}

            {/* What Happens Next */}
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-6 w-6 text-amber-500" />
                What Happens Next?
              </h2>
              <div className="space-y-4">
                
                {/* Step 1 */}
                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-500 text-white font-bold text-sm">
                      1
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Document Review</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Our admin team will verify all your submitted documents and check for completeness.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-500 text-white font-bold text-sm">
                      2
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Profile Assessment</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Your profile and eligibility will be assessed. You may receive requests for additional information.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500 text-white font-bold text-sm">
                      3
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Approval & Activation</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Once approved, your profile will be activated in the marketplace for sponsors to view.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-amber-500">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-500 text-white font-bold text-sm">
                      4
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Sponsorship Matching</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Donors will be able to view your profile and sponsor your education directly.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Email Notification */}
            <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex gap-3">
                <Mail className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-emerald-900">Confirmation Email Sent</h3>
                  <p className="text-sm text-emerald-700 mt-1">
                    A confirmation email has been sent to your registered email address. Check your inbox for important updates about your application status.
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <Users className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">Keep Your Profile Updated</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Make sure to keep your profile information updated and respond promptly to any requests for additional information from our team.
                  </p>
                </div>
              </div>
            </div>

            {/* Typical Timeline */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Typical Timeline</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-gray-400 min-w-fit">1-2 Days:</span>
                    <span>Initial document review</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-gray-400 min-w-fit">2-5 Days:</span>
                    <span>Field verification (if needed)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-gray-400 min-w-fit">5-10 Days:</span>
                    <span>Final review and decision</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-gray-400 min-w-fit">Upon Approval:</span>
                    <span>Profile activated for sponsors</span>
                  </li>
                </ul>
                <p className="text-xs text-gray-500 mt-3 italic">*Timeline may vary based on document completeness and verification needs</p>
              </div>
            </div>

          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate("/student/application", { replace: true })}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 h-auto min-h-12 flex items-center justify-center gap-2"
          >
            Back to Application
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => navigate("/student/profile", { replace: true })}
            variant="outline"
            className="border-2 border-gray-300 hover:border-gray-400 font-semibold px-6 py-2.5 h-auto min-h-12"
          >
            Update Profile
          </Button>
        </div>

        {/* Auto-redirect Notice */}
        <div className="text-center text-sm text-gray-600 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p>
            You'll be redirected back to your application in a few seconds if you don't click the button above.
          </p>
        </div>

      </div>
    </div>
  );
};
