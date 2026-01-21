// src/pages/Donate.jsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, DollarSign, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { API } from "@/lib/api";

// US States for dropdown
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

// Preset donation amounts
const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000];
const MIN_DONATION = 10;

export const Donate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const wasCancelled = searchParams.get('cancelled') === 'true';
  
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    message: ""
  });
  
  const [errors, setErrors] = useState({});

  // Get the actual donation amount
  const getDonationAmount = () => {
    if (showCustom) {
      return parseFloat(customAmount) || 0;
    }
    return selectedAmount || 0;
  };

  // Handle amount selection
  const handleAmountSelect = (amount) => {
    if (amount === 'other') {
      setShowCustom(true);
      setSelectedAmount(null);
    } else {
      setShowCustom(false);
      setSelectedAmount(amount);
      setCustomAmount("");
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle state selection
  const handleStateChange = (value) => {
    setFormData(prev => ({ ...prev, state: value }));
    if (errors.state) {
      setErrors(prev => ({ ...prev, state: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.streetAddress.trim()) newErrors.streetAddress = "Street address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "ZIP code is required";
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = "Invalid ZIP code (use 12345 or 12345-6789)";
    }
    
    const amount = getDonationAmount();
    if (amount < MIN_DONATION) {
      newErrors.amount = `Minimum donation is $${MIN_DONATION}`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API.baseURL}/api/general-donations/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: getDonationAmount()
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      
      // Redirect to Stripe Checkout
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (error) {
      console.error('Donation error:', error);
      toast.error(error.message || 'Failed to process donation. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Cancelled Payment Notice */}
        {wasCancelled && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-amber-800">
              Your payment was cancelled. You can try again whenever you're ready.
            </p>
          </div>
        )}
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Heart className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Make a Donation
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Your generous donation helps us sponsor students and provide educational 
            opportunities to those in need. Every contribution makes a difference.
          </p>
        </div>

        <Card className="p-6 sm:p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Amount Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold text-gray-900">
                Select Donation Amount
              </Label>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {PRESET_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={selectedAmount === amount && !showCustom ? "default" : "outline"}
                    className={`h-14 text-lg font-semibold ${
                      selectedAmount === amount && !showCustom 
                        ? "bg-green-600 hover:bg-green-700" 
                        : "hover:border-green-500"
                    }`}
                    onClick={() => handleAmountSelect(amount)}
                  >
                    ${amount}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={showCustom ? "default" : "outline"}
                  className={`h-14 text-lg font-semibold ${
                    showCustom 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "hover:border-green-500"
                  }`}
                  onClick={() => handleAmountSelect('other')}
                >
                  Other
                </Button>
              </div>
              
              {/* Custom Amount Input */}
              {showCustom && (
                <div className="relative mt-3">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="number"
                    min={MIN_DONATION}
                    step="0.01"
                    placeholder={`Enter amount (minimum $${MIN_DONATION})`}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="pl-10 h-14 text-lg"
                  />
                </div>
              )}
              
              {errors.amount && (
                <p className="text-red-500 text-sm">{errors.amount}</p>
              )}
            </div>

            <hr className="my-6" />

            {/* Donor Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Your Information</h3>
              <p className="text-sm text-gray-500">
                Required for tax documentation purposes.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Legal Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={errors.fullName ? "border-red-500" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm">{errors.fullName}</p>
                  )}
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>
                
                {/* Phone (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                {/* Street Address */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="streetAddress">Street Address *</Label>
                  <Input
                    id="streetAddress"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleChange}
                    placeholder="123 Main Street, Apt 4B"
                    className={errors.streetAddress ? "border-red-500" : ""}
                  />
                  {errors.streetAddress && (
                    <p className="text-red-500 text-sm">{errors.streetAddress}</p>
                  )}
                </div>
                
                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="New York"
                    className={errors.city ? "border-red-500" : ""}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm">{errors.city}</p>
                  )}
                </div>
                
                {/* State */}
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select value={formData.state} onValueChange={handleStateChange}>
                    <SelectTrigger className={errors.state ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state && (
                    <p className="text-red-500 text-sm">{errors.state}</p>
                  )}
                </div>
                
                {/* ZIP Code */}
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="10001"
                    className={errors.zipCode ? "border-red-500" : ""}
                  />
                  {errors.zipCode && (
                    <p className="text-red-500 text-sm">{errors.zipCode}</p>
                  )}
                </div>
              </div>
              
              {/* Message (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Share why you're supporting AWAKE..."
                  rows={3}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading || getDonationAmount() < MIN_DONATION}
                className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 h-5 w-5" />
                    Donate ${getDonationAmount().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </>
                )}
              </Button>
              
              <p className="text-center text-sm text-gray-500 mt-4">
                You will be redirected to Stripe for secure payment processing.
              </p>
            </div>
          </form>
        </Card>

        {/* Trust/Security Section */}
        <Card className="p-6 bg-white/80 backdrop-blur">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Secure & Transparent</h3>
              <p className="text-sm text-gray-600">
                All donations are processed securely through Stripe. You will receive 
                an email confirmation with your donation receipt. Your information is 
                kept confidential and used only for tax documentation purposes.
              </p>
            </div>
          </div>
        </Card>

        {/* Impact Section */}
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">
            Your Donation Supports
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="text-2xl mb-2">📚</div>
              <p className="text-sm text-gray-700">Student Scholarships</p>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm text-gray-700">Application Verification</p>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl mb-2">🤝</div>
              <p className="text-sm text-gray-700">Student Support Services</p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default Donate;
