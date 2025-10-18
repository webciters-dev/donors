// src/lib/currency.js - Currency utilities for multi-national university system
// Supports USD, CAD, GBP, EUR, and PKR based on university country location

// Currency metadata with symbols, flags, and names
// Currencies determined by university country selection
export const CURRENCY_META = {
  USD: { symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
  GBP: { symbol: '£', flag: '🇬🇧', name: 'British Pound Sterling' },
  EUR: { symbol: '€', flag: '🇪🇺', name: 'Euro' },
  CAD: { symbol: 'C$', flag: '🇨🇦', name: 'Canadian Dollar' },
  PKR: { symbol: 'Rs', flag: '🇵🇰', name: 'Pakistani Rupee' },
  AUD: { symbol: 'A$', flag: '🇦🇺', name: 'Australian Dollar' }
};

// Determine currency based on university country selection
export const getCurrencyFromCountry = (country) => {
  if (!country) return 'USD'; // Default to USD for international students
  
  const countryLower = country.toLowerCase().trim();
  
  // Map university countries to their currencies
  if (countryLower === 'usa' || countryLower === 'united states' || countryLower === 'us') {
    return 'USD';
  }
  
  if (countryLower === 'uk' || countryLower === 'united kingdom' || countryLower === 'england' || 
      countryLower === 'britain' || countryLower === 'great britain') {
    return 'GBP';
  }
  
  if (countryLower === 'canada' || countryLower === 'ca') {
    return 'CAD';
  }
  
  if (countryLower === 'australia' || countryLower === 'au' || countryLower === 'aus') {
    return 'AUD';
  }
  
  if (countryLower === 'pakistan' || countryLower === 'pk' || countryLower === 'pak') {
    return 'PKR';
  }
  
  // European Union countries
  if (['germany', 'france', 'italy', 'spain', 'netherlands', 'belgium', 
       'austria', 'finland', 'ireland', 'portugal', 'luxembourg', 'slovenia', 
       'estonia', 'latvia', 'lithuania', 'slovakia', 'malta', 'cyprus'].includes(countryLower)) {
    return 'EUR';
  }
  
  // Default to USD for other countries
  return 'USD';
};

// Keep the old function for backward compatibility, but mark as deprecated
// @deprecated Use getCurrencyFromCountry instead
export const getCurrencyFromUniversity = (university) => {
  // For backward compatibility, return PKR as default
  return 'PKR';
};

// Format amount with currency symbol and flag
export const fmtAmount = (amount, currency = 'PKR') => {
  const meta = CURRENCY_META[currency] || CURRENCY_META.PKR;
  const num = Number(amount || 0);
  return `${meta.symbol} ${num.toLocaleString()}`;
};

// Get currency flag emoji
export const getCurrencyFlag = (currency) => {
  return CURRENCY_META[currency]?.flag || '🇵🇰';
};

// Get currency name
export const getCurrencyName = (currency) => {
  return CURRENCY_META[currency]?.name || currency;
};