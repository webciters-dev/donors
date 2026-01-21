// src/pages/DonationSuccess.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Heart, Home, Loader2 } from "lucide-react";
import { API } from "@/lib/api";

export const DonationSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const donationId = searchParams.get('donation_id');
  
  const [loading, setLoading] = useState(true);
  const [donation, setDonation] = useState(null);
  const [error, setError] = useState(null);

  // Confirm the donation with the backend
  useEffect(() => {
    const confirmDonation = async () => {
      if (!sessionId || !donationId) {
        setError('Missing payment information');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API.baseURL}/api/general-donations/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, donationId })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to confirm donation');
        }

        setDonation(data.donation);
      } catch (err) {
        console.error('Confirmation error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    confirmDonation();
  }, [sessionId, donationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-md w-full">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Confirming Your Donation...
          </h2>
          <p className="text-gray-600">
            Please wait while we process your payment.
          </p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
        <Card className="p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Something Went Wrong
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/donate')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-8">
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
              Thank You!
            </h1>
            <p className="text-green-50 text-base sm:text-lg">
              Your generous donation has been received.
            </p>
          </div>

          {/* Content Section */}
          <div className="px-6 py-8 sm:px-8">
            
            {/* Donation Details */}
            {donation && (
              <div className="mb-8 p-5 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-green-600" />
                  Donation Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Donor:</span>
                    <span className="font-medium text-gray-900">{donation.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-green-600 text-lg">
                      ${donation.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">
                      {donation.paidAt ? new Date(donation.paidAt).toLocaleDateString() : new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Donation ID:</span>
                    <span className="font-mono text-sm text-gray-700">{donation.id}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Email Confirmation */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">Confirmation Email Sent</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    A confirmation email with your donation receipt has been sent to your email address. 
                    Please keep this for your tax records.
                  </p>
                </div>
              </div>
            </div>

            {/* Impact Message */}
            <div className="mb-8 p-5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
              <h3 className="font-semibold text-amber-900 mb-2">Your Impact</h3>
              <p className="text-amber-800">
                Your donation directly supports student scholarships, application verification processes, 
                and helps us connect deserving students with compassionate sponsors. Thank you for 
                believing in the power of education!
              </p>
            </div>

            {/* What We Do */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">How Your Donation Helps</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">📚</div>
                  <p className="text-sm font-medium text-gray-700">Fund Scholarships</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">✅</div>
                  <p className="text-sm font-medium text-gray-700">Verify Applications</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">🤝</div>
                  <p className="text-sm font-medium text-gray-700">Support Students</p>
                </div>
              </div>
            </div>

          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate('/')}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 h-auto min-h-12 flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Home
          </Button>
          <Button
            onClick={() => navigate('/donate')}
            variant="outline"
            className="border-2 border-green-300 hover:border-green-400 text-green-700 font-semibold px-6 py-2.5 h-auto min-h-12 flex items-center justify-center gap-2"
          >
            <Heart className="h-4 w-4" />
            Donate Again
          </Button>
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-600 p-4">
          <p>
            Questions about your donation? Contact us at{' '}
            <a href="mailto:op.executive@akhuwat.org.pk" className="text-green-600 hover:underline">
              op.executive@akhuwat.org.pk
            </a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default DonationSuccess;
