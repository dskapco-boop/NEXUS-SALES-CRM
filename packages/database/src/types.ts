// Database types - mirrors schema.sql
// In production, generate via: supabase gen types typescript --project-ref ...

export type UserRole = 'admin' | 'sales_manager' | 'sales_rep' | 'viewer';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted' | 'lost';
export type LeadSource = 'website' | 'referral' | 'cold_call' | 'email' | 'social' | 'event' | 'other';
export type OpportunityStage = 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'revised';
export type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'void' | 'cancelled';
export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note' | 'whatsapp';
export type ActivityStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type SyncStatus = 'pending' | 'synced' | 'failed' | 'conflict';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  manager_id: string | null;
  phone: string | null;
  department: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  parent_team_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  company: string | null;
  job_title: string | null;
  status: LeadStatus;
  source: LeadSource;
  score: number;
  owner_id: string;
  team_id: string | null;
  address: Record<string, unknown>;
  tags: string[];
  custom_fields: Record<string, unknown>;
  notes: string | null;
  converted_at: string | null;
  converted_contact_id: string | null;
  converted_opportunity_id: string | null;
  zoho_contact_id: string | null;
  zoho_sync_status: SyncStatus;
  zoho_last_synced_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Account {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  employee_count: number | null;
  annual_revenue: number | null;
  billing_address: Record<string, unknown>;
  shipping_address: Record<string, unknown>;
  owner_id: string;
  team_id: string | null;
  tags: string[];
  custom_fields: Record<string, unknown>;
  notes: string | null;
  zoho_contact_id: string | null;
  zoho_sync_status: SyncStatus;
  zoho_last_synced_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Contact {
  id: string;
  account_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  job_title: string | null;
  department: string | null;
  preferred_contact_method: string;
  do_not_email: boolean;
  do_not_call: boolean;
  owner_id: string;
  team_id: string | null;
  address: Record<string, unknown>;
  tags: string[];
  custom_fields: Record<string, unknown>;
  notes: string | null;
  zoho_contact_id: string | null;
  zoho_sync_status: SyncStatus;
  zoho_last_synced_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Opportunity {
  id: string;
  name: string;
  account_id: string | null;
  contact_id: string | null;
  lead_id: string | null;
  stage: OpportunityStage;
  probability: number;
  amount: number;
  currency: string;
  expected_close_date: string | null;
  actual_close_date: string | null;
  owner_id: string;
  team_id: string | null;
  description: string | null;
  tags: string[];
  custom_fields: Record<string, unknown>;
  loss_reason: string | null;
  loss_notes: string | null;
  zoho_deal_id: string | null;
  zoho_sync_status: SyncStatus;
  zoho_last_synced_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  type: 'product' | 'service' | 'bundle';
  unit_price: number;
  currency: string;
  cost_price: number | null;
  tax_rate: number;
  track_inventory: boolean;
  stock_quantity: number;
  reorder_level: number;
  unit: string;
  tags: string[];
  custom_fields: Record<string, unknown>;
  is_active: boolean;
  zoho_item_id: string | null;
  zoho_sync_status: SyncStatus;
  zoho_last_synced_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Quote {
  id: string;
  quote_number: string;
  account_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  status: QuoteStatus;
  quote_date: string;
  valid_until: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  owner_id: string;
  team_id: string | null;
  subject: string | null;
  body: string | null;
  terms_conditions: string | null;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  zoho_estimate_id: string | null;
  zoho_sync_status: SyncStatus;
  zoho_last_synced_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface QuoteLineItem {
  id: string;
  quote_id: string;
  product_id: string | null;
  line_number: number;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  quote_id: string | null;
  account_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  status: OrderStatus;
  order_date: string;
  expected_ship_date: string | null;
  shipped_date: string | null;
  delivered_date: string | null;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  owner_id: string;
  team_id: string | null;
  shipping_address: Record<string, unknown>;
  billing_address: Record<string, unknown>;
  shipping_method: string | null;
  tracking_number: string | null;
  notes: string | null;
  internal_notes: string | null;
  zoho_salesorder_id: string | null;
  zoho_sync_status: SyncStatus;
  zoho_last_synced_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SalesOrderLineItem {
  id: string;
  sales_order_id: string;
  product_id: string | null;
  line_number: number;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  quantity_delivered: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  sales_order_id: string | null;
  quote_id: string | null;
  account_id: string | null;
  contact_id: string | null;
  status: InvoiceStatus;
  invoice_date: string;
  due_date: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  paid_at: string | null;
  subtotal: number;
  discount_amount: number;
  discount_percent: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  owner_id: string;
  team_id: string | null;
  billing_address: Record<string, unknown>;
  shipping_address: Record<string, unknown>;
  notes: string | null;
  terms_conditions: string | null;
  zoho_invoice_id: string | null;
  zoho_sync_status: SyncStatus;
  zoho_last_synced_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  line_number: number;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  payment_number: string;
  invoice_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'online' | 'other';
  reference_number: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partial_refund';
  notes: string | null;
  zoho_payment_id: string | null;
  zoho_sync_status: SyncStatus;
  zoho_last_synced_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  entity_type: 'lead' | 'contact' | 'account' | 'opportunity' | 'quote' | 'sales_order' | 'invoice';
  entity_id: string;
  type: ActivityType;
  subject: string;
  description: string | null;
  scheduled_at: string | null;
  due_at: string | null;
  completed_at: string | null;
  duration_minutes: number | null;
  status: ActivityStatus;
  owner_id: string;
  assigned_to: string | null;
  outcome: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: 'info' | 'success' | 'warning' | 'error';
  action_url: string | null;
  action_label: string | null;
  is_read: boolean;
  read_at: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ZohoSyncLog {
  id: string;
  entity_type: string;
  entity_id: string;
  zoho_id: string | null;
  operation: 'create' | 'update' | 'delete' | 'pull' | 'push';
  status: SyncStatus;
  request_payload: Record<string, unknown> | null;
  response_payload: Record<string, unknown> | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
}

// Pagination result wrapper
export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter types
export interface LeadFilter {
  status?: LeadStatus | LeadStatus[];
  source?: LeadSource | LeadSource[];
  owner_id?: string;
  team_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OpportunityFilter {
  stage?: OpportunityStage | OpportunityStage[];
  owner_id?: string;
  team_id?: string;
  account_id?: string;
  min_amount?: number;
  max_amount?: number;
  close_date_from?: string;
  close_date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QuoteFilter {
  status?: QuoteStatus | QuoteStatus[];
  owner_id?: string;
  team_id?: string;
  account_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InvoiceFilter {
  status?: InvoiceStatus | InvoiceStatus[];
  owner_id?: string;
  team_id?: string;
  account_id?: string;
  date_from?: string;
  date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
