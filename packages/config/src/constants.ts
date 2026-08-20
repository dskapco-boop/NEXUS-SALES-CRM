// App constants
export const APP_CONSTANTS = {
  name: "Nexus CRM",
  version: "0.0.1",
  description: "Professional CRM for Nexus Comprehensive Solutions FZC",

  // Pagination
  defaultPageSize: 20,
  maxPageSize: 100,

  // Currency
  defaultCurrency: "AED",
  supportedCurrencies: ["AED", "USD", "EUR", "GBP", "SAR"] as const,

  // Tax
  defaultTaxRate: 5, // UAE VAT

  // Lead scoring thresholds
  leadScoreThresholds: {
    hot: 70,
    warm: 40,
    cold: 0,
  },

  // Opportunity probabilities by stage
  stageProbabilities: {
    prospecting: 10,
    qualification: 25,
    proposal: 50,
    negotiation: 75,
    closed_won: 100,
    closed_lost: 0,
  } as const,

  // Quote validity (days)
  defaultQuoteValidityDays: 30,

  // Invoice payment terms (days)
  defaultPaymentTermsDays: 30,

  // File uploads
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],

  // Sync
  syncIntervalMinutes: 15,
  maxSyncRetries: 3,

  // Activity types
  activityTypes: ["call", "email", "meeting", "task", "note", "whatsapp"] as const,

  // Zoho Org ID
  zohoOrgId: "856095734",
} as const;

export type Currency = (typeof APP_CONSTANTS.supportedCurrencies)[number];
export type LeadScoreTier = "hot" | "warm" | "cold";
export type ActivityType = (typeof APP_CONSTANTS.activityTypes)[number];
