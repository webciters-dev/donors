// src/lib/cmsConfig.js - CMS Content Configuration
// This file defines all editable content areas for the landing page

export const CMS_CONTENT_DEFAULTS = {
  // Hero Section
  hero: {
    title: "Compassionate Giving",
    subtitle: "Connect with deserving students across Pakistan and help them achieve their educational dreams. Transparent funding platform by Akhuwat with 100% secure donations.",
    primaryButton: "Apply for Sponsorship",
    secondaryButton: "Donor Signup"
  },

  // Features Section (3 main boxes)
  features: {
    wholeStudent: {
      title: "Whole-Student Sponsorships",
      description: "Sponsor complete educational journeys, not just tuition. Cover living expenses, books, and resources.",
      icon: ""
    },
    interestFree: {
      title: "Interest-Free Repayments", 
      description: "Students repay without interest, following Islamic principles and making education accessible.",
      icon: ""
    },
    builtForTrust: {
      title: "Built for Trust",
      description: "Rigorous verification, regular updates, and transparent tracking of every donation dollar.",
      icon: ""
    }
  },

  // Trust Indicators (3 green badges)
  trustIndicators: {
    nonprofit: {
      text: "501(c)(3) Non-profit",
      enabled: true
    },
    accessible: {
      text: "100% Accessible", 
      enabled: true
    },
    security: {
      text: "Bank-level Security",
      enabled: true
    }
  },

  // Why AWAKE Connect Section
  whySection: {
    title: "Why AWAKE Connect?",
    items: {
      transparent: {
        title: "Transparent & Secure",
        description: "501(c)(3) with bank-level security and fully auditable records",
        icon: ""
      },
      wholestudent: {
        title: "Whole-Student Support", 
        description: "Sponsor tuition, hostel, and essentials—see progress every term",
        icon: ""
      },
      tracking: {
        title: "Outcomes You Can Track",
        description: "Students upload results & certificates, donors view a living timeline", 
        icon: ""
      },
      marketplace: {
        title: "Marketplace of Hope",
        description: "Only admin-approved applications appear for sponsorship",
        icon: ""
      },
      questions: {
        title: "Questions?",
        description: "Reach us at support@awake.org - Akhuwat",
        icon: ""
      }
    }
  },

  // Statistics (these might be auto-calculated, but labels are editable)
  statistics: {
    sponsored: {
      label: "Students Sponsored",
      showPercentage: false // Controls the "0%" indicator
    },
    available: {
      label: "Students Available", 
      showPercentage: false
    },
    universities: {
      label: "Universities",
      showPercentage: false
    }
  }
};

// CMS Content Keys - for easy reference
export const CMS_KEYS = {
  HERO_TITLE: 'hero.title',
  HERO_SUBTITLE: 'hero.subtitle', 
  HERO_PRIMARY_BTN: 'hero.primaryButton',
  HERO_SECONDARY_BTN: 'hero.secondaryButton',
  
  FEATURE_1_TITLE: 'features.wholeStudent.title',
  FEATURE_1_DESC: 'features.wholeStudent.description',
  FEATURE_2_TITLE: 'features.interestFree.title', 
  FEATURE_2_DESC: 'features.interestFree.description',
  FEATURE_3_TITLE: 'features.builtForTrust.title',
  FEATURE_3_DESC: 'features.builtForTrust.description',
  
  WHY_SECTION_TITLE: 'whySection.title'
};

export default CMS_CONTENT_DEFAULTS;