// Zod validation schemas for all CRM entities
import { z } from "zod";

// ============================================
// COMMON SCHEMAS
// ============================================
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const phoneSchema = z.string().min(7);
export const currencySchema = z.string().length(3).default("AED");
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const datetimeSchema = z.string();

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

// ============================================
// USER SCHEMAS
// ============================================
export const userRoleSchema = z.enum(["admin", "sales_manager", "sales_rep", "viewer"]);

export const createUserSchema = z.object({
  email: emailSchema,
  password: z.string().min(8),
  full_name: z.string().min(1).max(100),
  role: userRoleSchema.default("sales_rep"),
  manager_id: uuidSchema.optional(),
  phone: phoneSchema.optional(),
  department: z.string().max(100).optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true, email: true });

// ============================================
// LEAD SCHEMAS
// ============================================
export const leadStatusSchema = z.enum(["new", "contacted", "qualified", "unqualified", "converted", "lost"]);
export const leadSourceSchema = z.enum(["website", "referral", "cold_call", "email", "social", "event", "other"]);

export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
});

export const createLeadSchema = z.object({
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  email: emailSchema.optional().nullable(),
  phone: phoneSchema.optional().nullable(),
  mobile: phoneSchema.optional().nullable(),
  company: z.string().max(100).optional().nullable(),
  job_title: z.string().max(100).optional().nullable(),
  status: leadStatusSchema.default("new"),
  source: leadSourceSchema.default("other"),
  score: z.number().int().min(0).max(100).default(0),
  owner_id: uuidSchema,
  team_id: uuidSchema.optional().nullable(),
  address: z.any().optional(),
  tags: z.array(z.string()).default([]),
  custom_fields: z.record(z.any()).default({}),
  notes: z.string().optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial().omit({ owner_id: true });

export const convertLeadSchema = z.object({
  create_contact: z.boolean().default(true),
  create_opportunity: z.boolean().default(true),
  opportunity_name: z.string().min(1).max(200).optional(),
  opportunity_amount: z.number().positive().optional(),
  opportunity_stage: z.enum(["prospecting", "qualification", "proposal", "negotiation"]).default("qualification"),
});

// ============================================
// CONTACT SCHEMAS
// ============================================
export const createContactSchema = z.object({
  account_id: uuidSchema.optional().nullable(),
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  email: emailSchema.optional().nullable(),
  phone: phoneSchema.optional().nullable(),
  mobile: phoneSchema.optional().nullable(),
  job_title: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  preferred_contact_method: z.enum(["email", "phone", "whatsapp", "meeting"]).default("email"),
  do_not_email: z.boolean().default(false),
  do_not_call: z.boolean().default(false),
  owner_id: uuidSchema,
  team_id: uuidSchema.optional().nullable(),
  address: z.any().optional(),
  tags: z.array(z.string()).default([]),
  custom_fields: z.record(z.any()).default({}),
  notes: z.string().optional().nullable(),
});

export const updateContactSchema = createContactSchema.partial().omit({ owner_id: true });

// ============================================
// ACCOUNT SCHEMAS
// ============================================
export const createAccountSchema = z.object({
  name: z.string().min(1).max(200),
  industry: z.string().max(100).optional().nullable(),
  website: z.string().url().optional().nullable(),
  employee_count: z.number().int().positive().optional().nullable(),
  annual_revenue: z.number().positive().optional().nullable(),
  billing_address: z.any().optional(),
  shipping_address: z.any().optional(),
  owner_id: uuidSchema,
  team_id: uuidSchema.optional().nullable(),
  tags: z.array(z.string()).default([]),
  custom_fields: z.record(z.any()).default({}),
  notes: z.string().optional().nullable(),
});

export const updateAccountSchema = createAccountSchema.partial().omit({ owner_id: true });

// ============================================
// OPPORTUNITY SCHEMAS
// ============================================
export const opportunityStageSchema = z.enum(["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"]);

export const createOpportunitySchema = z.object({
  name: z.string().min(1).max(200),
  account_id: uuidSchema.optional().nullable(),
  contact_id: uuidSchema.optional().nullable(),
  lead_id: uuidSchema.optional().nullable(),
  stage: opportunityStageSchema.default("prospecting"),
  probability: z.number().int().min(0).max(100).default(10),
  amount: z.number().min(0).default(0),
  currency: currencySchema,
  expected_close_date: dateSchema.optional().nullable(),
  owner_id: uuidSchema,
  team_id: uuidSchema.optional().nullable(),
  description: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  custom_fields: z.record(z.any()).default({}),
});

export const updateOpportunitySchema = createOpportunitySchema.partial().omit({ owner_id: true });

// ============================================
// PRODUCT SCHEMAS
// ============================================
export const productTypeSchema = z.enum(["product", "service", "bundle"]);

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  type: productTypeSchema.default("service"),
  unit_price: z.number().min(0).default(0),
  currency: currencySchema,
  cost_price: z.number().min(0).optional().nullable(),
  tax_rate: z.number().min(0).max(100).default(5),
  track_inventory: z.boolean().default(false),
  stock_quantity: z.number().int().min(0).default(0),
  reorder_level: z.number().int().min(0).default(10),
  unit: z.string().max(20).default("pcs"),
  tags: z.array(z.string()).default([]),
  custom_fields: z.record(z.any()).default({}),
  is_active: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

// ============================================
// QUOTE SCHEMAS
// ============================================
export const quoteStatusSchema = z.enum(["draft", "sent", "viewed", "accepted", "rejected", "expired", "revised"]);

export const quoteLineItemSchema = z.object({
  product_id: uuidSchema.optional().nullable(),
  line_number: z.number().int().positive(),
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  quantity: z.number().positive().default(1),
  unit: z.string().max(20).default("pcs"),
  unit_price: z.number().min(0).default(0),
  discount_percent: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  tax_rate: z.number().min(0).max(100).default(5),
  tax_amount: z.number().min(0).default(0),
  line_total: z.number().min(0).default(0),
  sort_order: z.number().int().default(0),
});

export const createQuoteSchema = z.object({
  account_id: uuidSchema.optional().nullable(),
  contact_id: uuidSchema.optional().nullable(),
  opportunity_id: uuidSchema.optional().nullable(),
  quote_date: dateSchema.default(() => new Date().toISOString().split("T")[0]),
  valid_until: dateSchema.optional().nullable(),
  subject: z.string().max(200).optional().nullable(),
  body: z.string().optional().nullable(),
  terms_conditions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  discount_percent: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  currency: currencySchema,
  owner_id: uuidSchema,
  team_id: uuidSchema.optional().nullable(),
  line_items: z.array(quoteLineItemSchema).min(1),
});

export const updateQuoteSchema = createQuoteSchema.partial().omit({ owner_id: true });

// ============================================
// SALES ORDER SCHEMAS
// ============================================
export const orderStatusSchema = z.enum(["draft", "confirmed", "processing", "shipped", "delivered", "cancelled"]);

export const salesOrderLineItemSchema = z.object({
  product_id: uuidSchema.optional().nullable(),
  line_number: z.number().int().positive(),
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  quantity: z.number().positive().default(1),
  unit: z.string().max(20).default("pcs"),
  unit_price: z.number().min(0).default(0),
  discount_percent: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  tax_rate: z.number().min(0).max(100).default(5),
  tax_amount: z.number().min(0).default(0),
  line_total: z.number().min(0).default(0),
  quantity_delivered: z.number().min(0).default(0),
  sort_order: z.number().int().default(0),
});

export const createSalesOrderSchema = z.object({
  quote_id: uuidSchema.optional().nullable(),
  account_id: uuidSchema.optional().nullable(),
  contact_id: uuidSchema.optional().nullable(),
  opportunity_id: uuidSchema.optional().nullable(),
  order_date: dateSchema.default(() => new Date().toISOString().split("T")[0]),
  expected_ship_date: dateSchema.optional().nullable(),
  shipping_address: z.any().optional(),
  billing_address: z.any().optional(),
  shipping_method: z.string().max(100).optional().nullable(),
  tracking_number: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
  discount_percent: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  currency: currencySchema,
  owner_id: uuidSchema,
  team_id: uuidSchema.optional().nullable(),
  line_items: z.array(salesOrderLineItemSchema).min(1),
});

export const updateSalesOrderSchema = createSalesOrderSchema.partial().omit({ owner_id: true });

// ============================================
// INVOICE SCHEMAS
// ============================================
export const invoiceStatusSchema = z.enum(["draft", "sent", "viewed", "paid", "partial", "overdue", "void", "cancelled"]);

export const invoiceLineItemSchema = z.object({
  product_id: uuidSchema.optional().nullable(),
  line_number: z.number().int().positive(),
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  quantity: z.number().positive().default(1),
  unit: z.string().max(20).default("pcs"),
  unit_price: z.number().min(0).default(0),
  discount_percent: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  tax_rate: z.number().min(0).max(100).default(5),
  tax_amount: z.number().min(0).default(0),
  line_total: z.number().min(0).default(0),
  sort_order: z.number().int().default(0),
});

export const createInvoiceSchema = z.object({
  sales_order_id: uuidSchema.optional().nullable(),
  quote_id: uuidSchema.optional().nullable(),
  account_id: uuidSchema.optional().nullable(),
  contact_id: uuidSchema.optional().nullable(),
  invoice_date: dateSchema.default(() => new Date().toISOString().split("T")[0]),
  due_date: dateSchema.optional().nullable(),
  billing_address: z.any().optional(),
  shipping_address: z.any().optional(),
  notes: z.string().optional().nullable(),
  terms_conditions: z.string().optional().nullable(),
  discount_percent: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  currency: currencySchema,
  owner_id: uuidSchema,
  team_id: uuidSchema.optional().nullable(),
  line_items: z.array(invoiceLineItemSchema).min(1),
});

export const updateInvoiceSchema = createInvoiceSchema.partial().omit({ owner_id: true });

// ============================================
// PAYMENT SCHEMAS
// ============================================
export const paymentMethodSchema = z.enum(["cash", "bank_transfer", "card", "cheque", "online", "other"]);
export const paymentStatusSchema = z.enum(["pending", "completed", "failed", "refunded", "partial_refund"]);

export const createPaymentSchema = z.object({
  invoice_id: uuidSchema,
  amount: z.number().positive(),
  currency: currencySchema,
  payment_date: dateSchema.default(() => new Date().toISOString().split("T")[0]),
  payment_method: paymentMethodSchema,
  reference_number: z.string().max(100).optional().nullable(),
  status: paymentStatusSchema.default("completed"),
  notes: z.string().optional().nullable(),
});

export const updatePaymentSchema = createPaymentSchema.partial().omit({ invoice_id: true });

// ============================================
// ACTIVITY SCHEMAS
// ============================================
export const activityTypeSchema = z.enum(["call", "email", "meeting", "task", "note", "whatsapp"]);
export const activityStatusSchema = z.enum(["planned", "in_progress", "completed", "cancelled"]);
export const entityTypeSchema = z.enum(["lead", "contact", "account", "opportunity", "quote", "sales_order", "invoice"]);

export const createActivitySchema = z.object({
  entity_type: entityTypeSchema,
  entity_id: uuidSchema,
  type: activityTypeSchema,
  subject: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  scheduled_at: datetimeSchema.optional().nullable(),
  due_at: datetimeSchema.optional().nullable(),
  duration_minutes: z.number().int().positive().optional().nullable(),
  status: activityStatusSchema.default("planned"),
  owner_id: uuidSchema,
  assigned_to: uuidSchema.optional().nullable(),
  outcome: z.string().optional().nullable(),
});

export const updateActivitySchema = createActivitySchema.partial().omit({ owner_id: true, entity_type: true, entity_id: true });

// ============================================
// FILTER SCHEMAS
// ============================================
export const leadFilterSchema = z.object({
  status: leadStatusSchema.optional(),
  source: leadSourceSchema.optional(),
  owner_id: uuidSchema.optional(),
  team_id: uuidSchema.optional(),
  search: z.string().optional(),
  date_from: dateSchema.optional(),
  date_to: dateSchema.optional(),
}).merge(paginationSchema);

export const opportunityFilterSchema = z.object({
  stage: opportunityStageSchema.optional(),
  owner_id: uuidSchema.optional(),
  team_id: uuidSchema.optional(),
  account_id: uuidSchema.optional(),
  min_amount: z.number().optional(),
  max_amount: z.number().optional(),
  close_date_from: dateSchema.optional(),
  close_date_to: dateSchema.optional(),
  search: z.string().optional(),
}).merge(paginationSchema);

export const quoteFilterSchema = z.object({
  status: quoteStatusSchema.optional(),
  owner_id: uuidSchema.optional(),
  team_id: uuidSchema.optional(),
  account_id: uuidSchema.optional(),
  date_from: dateSchema.optional(),
  date_to: dateSchema.optional(),
  search: z.string().optional(),
}).merge(paginationSchema);

// Export all schemas
export const schemas = {
  uuid: uuidSchema,
  email: emailSchema,
  phone: phoneSchema,
  currency: currencySchema,
  date: dateSchema,
  datetime: datetimeSchema,
  pagination: paginationSchema,
  userRole: userRoleSchema,
  createUser: createUserSchema,
  updateUser: updateUserSchema,
  leadStatus: leadStatusSchema,
  leadSource: leadSourceSchema,
  address: addressSchema,
  createLead: createLeadSchema,
  updateLead: updateLeadSchema,
  convertLead: convertLeadSchema,
  createAccount: createAccountSchema,
  updateAccount: updateAccountSchema,
  createContact: createContactSchema,
  updateContact: updateContactSchema,
  opportunityStage: opportunityStageSchema,
  createOpportunity: createOpportunitySchema,
  updateOpportunity: updateOpportunitySchema,
  productType: productTypeSchema,
  createProduct: createProductSchema,
  updateProduct: updateProductSchema,
  quoteStatus: quoteStatusSchema,
  quoteLineItem: quoteLineItemSchema,
  createQuote: createQuoteSchema,
  updateQuote: updateQuoteSchema,
  orderStatus: orderStatusSchema,
  salesOrderLineItem: salesOrderLineItemSchema,
  createSalesOrder: createSalesOrderSchema,
  updateSalesOrder: updateSalesOrderSchema,
  invoiceStatus: invoiceStatusSchema,
  invoiceLineItem: invoiceLineItemSchema,
  createInvoice: createInvoiceSchema,
  updateInvoice: updateInvoiceSchema,
  paymentMethod: paymentMethodSchema,
  paymentStatus: paymentStatusSchema,
  createPayment: createPaymentSchema,
  updatePayment: updatePaymentSchema,
  activityType: activityTypeSchema,
  activityStatus: activityStatusSchema,
  entityType: entityTypeSchema,
  createActivity: createActivitySchema,
  updateActivity: updateActivitySchema,
  leadFilter: leadFilterSchema,
  opportunityFilter: opportunityFilterSchema,
  quoteFilter: quoteFilterSchema,
};
