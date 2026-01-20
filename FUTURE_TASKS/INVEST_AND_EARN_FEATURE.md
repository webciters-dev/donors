# INVEST & EARN FEATURE - FUTURE IMPLEMENTATION

**Status:** ON HOLD - Awaiting clarification on legal/compliance questions
**Created:** January 20, 2026
**Priority:** Deferred

---

## Feature Overview

New "Invest & Earn" feature for investors (separate from donors):
- Investors invest money and receive interest/returns
- Completely separate payment flow (different Stripe account or payment method)
- Needs its own navigation link "Invest & Earn"

---

## Outstanding Questions (Need Answers Before Implementation)

### 1. Investment Type
- Fixed return (e.g., 5% annually)?
- Variable return based on performance?
- Is this a loan to students that gets repaid with interest?
- Or is this investment in AWAKE organization itself?

### 2. Regulatory Compliance
- Investment platforms typically require financial licenses (SEC, FCA, etc.)
- Is this a registered investment scheme or informal arrangement?
- What jurisdiction applies?

### 3. Return Mechanism
- How will returns be paid? (Monthly, quarterly, at maturity?)
- Where does the interest money come from?
- What happens if investment cannot be returned?

### 4. Technical Requirements
- Do you have a second Stripe account ready for investments?
- What interest rates/terms should be offered?

---

## Proposed Technical Plan

### A. New Database Tables

```prisma
// Investor profile (separate from Donor)
model Investor {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  kycVerified     Boolean  @default(false)
  bankAccount     String?  // For payouts
  taxId           String?
  investments     Investment[]
  payouts         InvestorPayout[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Investment plans offered
model InvestmentPlan {
  id              String   @id @default(cuid())
  name            String   // e.g., "6-Month Fixed", "1-Year Growth"
  description     String?
  minAmount       Float    // Minimum investment
  maxAmount       Float?   // Maximum investment
  termMonths      Int      // Duration: 6, 12, 24 months
  interestRate    Float    // Annual interest rate (e.g., 5.0 = 5%)
  payoutFrequency String   // MONTHLY, QUARTERLY, AT_MATURITY
  isActive        Boolean  @default(true)
  investments     Investment[]
  createdAt       DateTime @default(now())
}

// Individual investments
model Investment {
  id              String   @id @default(cuid())
  investorId      String
  investor        Investor @relation(fields: [investorId], references: [id])
  planId          String
  plan            InvestmentPlan @relation(fields: [planId], references: [id])
  principalAmount Float    // Amount invested
  currency        String   @default("USD")
  status          InvestmentStatus @default(PENDING)
  startDate       DateTime?
  maturityDate    DateTime?
  totalExpectedReturn Float? // Principal + Interest
  stripePaymentId String?  // From separate Stripe account
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  payouts         InvestorPayout[]
}

enum InvestmentStatus {
  PENDING      // Payment not yet received
  ACTIVE       // Investment running
  MATURED      // Term completed
  WITHDRAWN    // Early withdrawal
  CANCELLED
}

// Payout records
model InvestorPayout {
  id            String   @id @default(cuid())
  investorId    String
  investor      Investor @relation(fields: [investorId], references: [id])
  investmentId  String
  investment    Investment @relation(fields: [investmentId], references: [id])
  amount        Float
  currency      String
  type          PayoutType // INTEREST or PRINCIPAL
  status        PayoutStatus @default(PENDING)
  paidAt        DateTime?
  stripePayoutId String?
  createdAt     DateTime @default(now())
}

enum PayoutType {
  INTEREST
  PRINCIPAL
  FULL_MATURITY  // Principal + final interest
}

enum PayoutStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
}
```

### B. New Backend Routes

```
server/src/routes/investments.js
├── POST   /api/investments/plans              # Admin: Create investment plan
├── GET    /api/investments/plans              # Public: List available plans
├── POST   /api/investments/invest             # Investor: Make investment
├── GET    /api/investments/my-investments     # Investor: View their investments
├── GET    /api/investments/:id                # Investor: View single investment
├── POST   /api/investments/withdraw/:id       # Investor: Early withdrawal request
├── GET    /api/investments/payouts            # Investor: View payout history
└── Admin routes for managing payouts
```

### C. New Frontend Pages

```
src/pages/
├── InvestorPortal.jsx       # Dashboard for investors
├── InvestmentPlans.jsx      # Browse available plans
├── InvestmentPayment.jsx    # Make investment (separate Stripe)
├── InvestorPayouts.jsx      # View returns/payouts
└── AdminInvestments.jsx     # Admin manage investments
```

### D. Separate Stripe Account

```env
# .env additions
STRIPE_INVESTMENT_PUBLISHABLE_KEY=pk_live_investment_xxx
STRIPE_INVESTMENT_SECRET_KEY=sk_live_investment_xxx
```

### E. Navigation

Add to header navigation:
```
Home | Browse Students | Invest & Earn | Login
```

---

## Implementation Estimate

Once requirements are clarified:
- Database schema: 1-2 hours
- Backend routes: 4-6 hours
- Frontend pages: 6-8 hours
- Stripe integration: 2-3 hours
- Testing: 2-3 hours

**Total: 15-22 hours**

---

## Notes

- This feature requires separate Stripe account to keep investment funds isolated from sponsorship funds
- KYC verification may be required for investors
- Admin dashboard needed to manage investment plans and payouts
- Consider scheduled jobs for automatic interest calculations and payouts
