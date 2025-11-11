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

// ===== DUAL CURRENCY DISPLAY SYSTEM =====
// For PKR amounts, show both PKR (primary) and USD (secondary)
// For other currencies, show original currency only

// Default PKR to USD exchange rate (admin-controlled)
const DEFAULT_PKR_TO_USD_RATE = 300;

// Get current PKR to USD exchange rate
// Uses admin-controlled setting from localStorage, falls back to default
export const getPKRToUSDRate = () => {
  try {
    const adminRate = localStorage.getItem('admin_pkr_usd_rate');
    if (adminRate && !isNaN(Number(adminRate))) {
      return Number(adminRate);
    }
  } catch (error) {
    console.warn('Failed to load admin PKR rate from localStorage:', error);
  }
  
  // Fallback to default rate
  return DEFAULT_PKR_TO_USD_RATE;
};

// Convert PKR amount to USD
export const convertPKRToUSD = (pkrAmount) => {
  const rate = getPKRToUSDRate();
  const rawUSD = pkrAmount / rate;
  return roundToNearest5or0(rawUSD);
};

// Round USD amounts to nearest 0 or 5 for cleaner display
// Examples: 167 -> 170, 333 -> 335, 667 -> 670, 1667 -> 1670
const roundToNearest5or0 = (amount) => {
  // For amounts less than 1, don't apply rounding (keep precision)
  if (amount < 1) {
    return Math.round(amount * 100) / 100; // Round to 2 decimal places
  }
  
  // For amounts less than 10, round to nearest 1 instead of 5
  if (amount < 10) {
    return Math.round(amount);
  }
  
  // For larger amounts, use the original 0 or 5 rounding
  const rounded = Math.round(amount);
  const lastDigit = rounded % 10;
  
  if (lastDigit === 0 || lastDigit === 5) {
    return rounded; // Already ends in 0 or 5
  } else if (lastDigit < 5) {
    return rounded + (5 - lastDigit); // Round up to 5
  } else {
    return rounded + (10 - lastDigit); // Round up to next 0
  }
};

// Format amount with dual currency display for PKR
export const fmtAmountDual = (amount, currency = 'PKR') => {
  const meta = CURRENCY_META[currency] || CURRENCY_META.PKR;
  const num = Number(amount || 0);
  
  // For PKR amounts, show dual currency: PKR 200,000 (≈ $667 USD)
  if (currency === 'PKR' && num > 0) {
    const usdAmount = convertPKRToUSD(num);
    const pkrFormatted = `${meta.symbol} ${num.toLocaleString()}`;
    const usdFormatted = `$${usdAmount.toLocaleString()}`;
    return `${pkrFormatted} (≈ ${usdFormatted} USD)`;
  }
  
  // For all other currencies, show original format only
  return `${meta.symbol} ${num.toLocaleString()}`;
};

// Check if currency should show dual display
export const shouldShowDualCurrency = (currency) => {
  return currency === 'PKR';
};