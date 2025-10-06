// src/lib/currency.js - Currency utilities for multi-national university system
// Supports USD, CAD, GBP, EUR, and PKR based on university country location

// Currency metadata with symbols, flags, and names
export const CURRENCY_META = {
  USD: { symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
  CAD: { symbol: 'C$', flag: '🇨🇦', name: 'Canadian Dollar' },
  GBP: { symbol: '£', flag: '🇬🇧', name: 'British Pound Sterling' },
  EUR: { symbol: '€', flag: '🇪🇺', name: 'Euro' },
  PKR: { symbol: 'Rs', flag: '🇵🇰', name: 'Pakistani Rupee' }
};

// Determine currency based on country (replaces university parsing)
export const getCurrencyFromCountry = (country) => {
  if (!country) return 'PKR'; // Default to PKR for our primary market
  
  const countryLower = country.toLowerCase().trim();
  
  // USA
  if (countryLower === 'usa' || 
      countryLower === 'us' ||
      countryLower === 'united states' ||
      countryLower === 'united states of america' ||
      countryLower === 'america') {
    return 'USD';
  }
  
  // Canada
  if (countryLower === 'canada' ||
      countryLower === 'ca') {
    return 'CAD';
  }
  
  // UK (Note: UK is not in EU anymore, so separate from EUR)
  if (countryLower === 'uk' ||
      countryLower === 'united kingdom' ||
      countryLower === 'england' ||
      countryLower === 'scotland' ||
      countryLower === 'wales' ||
      countryLower === 'northern ireland' ||
      countryLower === 'great britain' ||
      countryLower === 'britain') {
    return 'GBP';
  }
  
  // European Union countries (EUR)
  if (countryLower === 'germany' ||
      countryLower === 'france' ||
      countryLower === 'italy' ||
      countryLower === 'spain' ||
      countryLower === 'netherlands' ||
      countryLower === 'belgium' ||
      countryLower === 'austria' ||
      countryLower === 'portugal' ||
      countryLower === 'finland' ||
      countryLower === 'ireland' ||
      countryLower === 'luxembourg' ||
      countryLower === 'slovenia' ||
      countryLower === 'slovakia' ||
      countryLower === 'estonia' ||
      countryLower === 'latvia' ||
      countryLower === 'lithuania' ||
      countryLower === 'malta' ||
      countryLower === 'cyprus' ||
      countryLower === 'greece' ||
      countryLower === 'croatia' ||
      countryLower === 'eu' ||
      countryLower === 'europe' ||
      countryLower === 'european union') {
    return 'EUR';
  }
  
  // Pakistan (our primary market)
  if (countryLower === 'pakistan' ||
      countryLower === 'pk' ||
      countryLower === 'pak') {
    return 'PKR';
  }
  
  // Default to PKR for our primary market (Pakistan-focused system)
  return 'PKR';
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