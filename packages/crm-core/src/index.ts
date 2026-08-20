// Hooks
export { useLeads, useLead } from "./hooks/useLeads";
export { useEnquiries, useEnquiry } from "./hooks/useEnquiries";
export { useSalesOrders, useSalesOrder } from "./hooks/useSalesOrders";
export { useQuotations, useQuotation } from "./hooks/useQuotations";
export { useInvoices, useInvoice } from "./hooks/useInvoices";
export { useRealtime } from "./hooks/useRealtime";

// AI Service
export { aiService, AIService } from "./ai/service";

// Integrations
export { googleDriveService, GoogleDriveService } from "./integrations/googleDriveService";

// Types
export type {
  LeadScoreParams,
  LeadScoreResult,
  QuoteOptimizationParams,
  ForecastResult,
  EmailDraftParams,
  DocumentExtractionParams,
  DocumentExtractionResult,
} from "./ai/service";

export type {
  DocumentUploadParams,
  DocumentUploadResult,
} from "./integrations/googleDriveService";

// Providers
export { QueryProvider, queryClient } from "./providers/QueryProvider";

// Zoho sync layer
export { ZohoSyncLayer, zohoSync } from "./zoho/sync";
