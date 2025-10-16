// RECOMMENDED FIXES FOR PAYMENT SYSTEM CURRENCY ISSUES
// =====================================================

## 1. CURRENCY ARCHITECTURE ALIGNMENT

### Fix currency.js to match backend reality:
```javascript
// Only support currencies that database handles
export const CURRENCY_META = {
  USD: { symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
  PKR: { symbol: 'Rs', flag: '🇵🇰', name: 'Pakistani Rupee' }
  // Remove CAD, GBP, EUR until backend supports them
};
```

## 2. PAYMENTS.JS CRITICAL FIXES NEEDED

### Fix duplicate confirm-payment endpoints (lines 258 and 476):
- There are TWO different confirm-payment implementations
- Line 340: `amount: Math.round(paymentIntent.amount / 100)`
- Line 520: `amount: student.educationalNeed`
- This causes inconsistent sponsorship records

### Fix Stripe currency handling:
```javascript
// Instead of hardcoded 'usd', use normalized currency
const stripeCurrency = normalizedAppCurrency === 'PKR' ? 'usd' : 'usd';
// Note: Stripe doesn't support PKR, so convert PKR amounts to USD equivalent
```

## 3. DATABASE SCHEMA CLARIFICATION NEEDED

### Questions to resolve:
1. What's the difference between:
   - `student.educationalNeed` 
   - `application.needUSD`
   - `application.needPKR`

2. Which field should be the source of truth for sponsorship amounts?

## 4. CURRENCY CONVERSION STRATEGY

### Option A: Display-only currencies (current approach)
- Database stores USD/PKR only
- Frontend shows converted amounts for display
- All payments processed in USD through Stripe

### Option B: True multi-currency support
- Store exchange rates
- Convert amounts at payment time
- Handle currency fluctuations

## 5. IMMEDIATE CRITICAL FIXES

1. Remove duplicate confirm-payment endpoint
2. Standardize amount field usage (application.needUSD vs student.educationalNeed)
3. Fix currency.js to only show supported currencies
4. Add PKR to USD conversion for Stripe payments
5. Ensure consistent amount calculation across frontend/backend

## 6. TESTING IMPLICATIONS

Current issues could cause:
- Payment amounts not matching displayed amounts
- PKR payments failing due to Stripe currency mismatch
- Inconsistent sponsorship records in database
- Donors seeing wrong amounts in portal