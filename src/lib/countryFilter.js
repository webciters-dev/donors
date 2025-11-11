// src/lib/countryFilter.js
// Country filtering utilities for temporary geographic restrictions

// TEMPORARY: Pakistan-only filter for initial launch
// This filter system preserves all existing country logic while hiding non-Pakistani options
// Can be easily disabled by changing PAKISTAN_ONLY_MODE to false

export const PAKISTAN_ONLY_MODE = true;

// Filter function for DonorSignup.jsx COUNTRY_OPTIONS
export const filterCountryOptions = (countryOptions) => {
  if (!PAKISTAN_ONLY_MODE) {
    return countryOptions; // Return full list when filter disabled
  }

  // Filter to show only Pakistan in each category
  return {
    primary: countryOptions.primary.filter(country => 
      country.code === "PK" || country.name === "Pakistan"
    ),
    european: [], // Empty for Pakistan-only mode
    other: [] // Empty for Pakistan-only mode
  };
};

// Filter function for simple country arrays (StudentProfile.jsx, ApplicationForm.jsx)
export const filterCountryList = (countries) => {
  if (!PAKISTAN_ONLY_MODE) {
    return countries; // Return full list when filter disabled
  }

  // Filter to show only Pakistan-related entries
  return countries.filter(country => 
    country.toLowerCase().includes('pakistan') || 
    country.toLowerCase().includes('🇵🇰') ||
    country === ""  // Keep empty option for "Select Country"
  );
};

// Helper function to get Pakistan-only datalist options
export const getPakistanOnlyDatalist = () => {
  if (!PAKISTAN_ONLY_MODE) {
    return null; // Return null to indicate no filtering needed
  }

  return [
    { value: "", label: "Select Country" },
    { value: "Pakistan", label: "🇵🇰 Pakistan" }
  ];
};

// Validation function - ensures Pakistan is still valid when filter is active
export const isValidCountrySelection = (country) => {
  if (!PAKISTAN_ONLY_MODE) {
    return true; // All countries valid when filter disabled
  }

  // Only Pakistan is valid in filtered mode
  return !country || country === "Pakistan" || country.toLowerCase().includes('pakistan');
};

// Helper to get display message for filtered mode
export const getFilterMessage = () => {
  if (!PAKISTAN_ONLY_MODE) {
    return null;
  }

  return {
    message: "Currently accepting applications for Pakistani Educational Institutions only",
    description: "International expansion coming soon when Sponsorships will be offered for Educational Institutions abroad as well.",
    icon: "🇵🇰"
  };
};

// Helper to get donor-specific inspiring message for filtered mode
export const getDonorFilterMessage = () => {
  if (!PAKISTAN_ONLY_MODE) {
    return null;
  }

  return {
    message: "History will remember your part in helping Students who would make Pakistan great again",
    description: "Your contribution today shapes the leaders, innovators, and builders of tomorrow's Pakistan.",
    icon: "🇵🇰"
  };
};

// Quick toggle function for admin/development use
export const togglePakistanOnlyMode = () => {
  // This would need state management in a real implementation
  // For now, developers can manually change PAKISTAN_ONLY_MODE above
  console.warn('Pakistan-only mode toggle requires manual code change in countryFilter.js');
  return PAKISTAN_ONLY_MODE;
};