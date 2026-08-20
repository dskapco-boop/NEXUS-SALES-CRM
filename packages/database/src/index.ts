// Database types - mirrors schema.sql
// In production, generate via: supabase gen types typescript --project-ref ...

// Import individual entity types
import {
  User,
  Team,
  Lead,
  Account,
  Contact,
  Opportunity,
  Product,
  Quote,
  QuoteLineItem,
  SalesOrder,
  SalesOrderLineItem,
  Invoice,
  InvoiceLineItem,
  Payment,
  Activity,
  Notification,
  AuditLog,
  ZohoSyncLog,
  UserRole,
  LeadStatus,
  LeadSource,
  OpportunityStage,
  QuoteStatus,
  OrderStatus,
  InvoiceStatus,
  ActivityType,
  ActivityStatus,
  SyncStatus,
  PaginationResult,
  LeadFilter,
  OpportunityFilter,
  QuoteFilter,
  InvoiceFilter,
} from './types';

// Re-export all types
export * from './types';

// Database type compatible with Supabase client
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<User, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<User>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<Team, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<Team>;
      };
      leads: {
        Row: Lead;
        Insert: Omit<Lead, 'id' | 'score' | 'zoho_sync_status' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Lead, 'id' | 'score' | 'zoho_sync_status' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Lead>;
      };
      accounts: {
        Row: Account;
        Insert: Omit<Account, 'id' | 'zoho_sync_status' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Account, 'id' | 'zoho_sync_status' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Account>;
      };
      contacts: {
        Row: Contact;
        Insert: Omit<Contact, 'id' | 'zoho_sync_status' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Contact, 'id' | 'zoho_sync_status' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Contact>;
      };
      opportunities: {
        Row: Opportunity;
        Insert: Omit<Opportunity, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Opportunity, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Opportunity>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'zoho_sync_status' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Product, 'id' | 'zoho_sync_status' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Product>;
      };
      quotes: {
        Row: Quote;
        Insert: Omit<Quote, 'id' | 'quote_number' | 'status' | 'zoho_sync_status' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Quote, 'id' | 'quote_number' | 'status' | 'zoho_sync_status' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Quote>;
      };
      quote_line_items: {
        Row: QuoteLineItem;
        Insert: Omit<QuoteLineItem, 'id' | 'line_total'> & Partial<Pick<QuoteLineItem, 'id' | 'line_total'>>;
        Update: Partial<QuoteLineItem>;
      };
      sales_orders: {
        Row: SalesOrder;
        Insert: Omit<SalesOrder, 'id' | 'order_number' | 'status' | 'zoho_sync_status' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<SalesOrder, 'id' | 'order_number' | 'status' | 'zoho_sync_status' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<SalesOrder>;
      };
      sales_order_line_items: {
        Row: SalesOrderLineItem;
        Insert: Omit<SalesOrderLineItem, 'id' | 'line_total'> & Partial<Pick<SalesOrderLineItem, 'id' | 'line_total'>>;
        Update: Partial<SalesOrderLineItem>;
      };
      invoices: {
        Row: Invoice;
        Insert: Omit<Invoice, 'id' | 'invoice_number' | 'status' | 'amount_due' | 'zoho_sync_status' | 'created_at' | 'updated_at' | 'deleted_at'> & Partial<Pick<Invoice, 'id' | 'invoice_number' | 'status' | 'amount_due' | 'zoho_sync_status' | 'created_at' | 'updated_at' | 'deleted_at'>>;
        Update: Partial<Invoice>;
      };
      invoice_line_items: {
        Row: InvoiceLineItem;
        Insert: Omit<InvoiceLineItem, 'id' | 'line_total'> & Partial<Pick<InvoiceLineItem, 'id' | 'line_total'>>;
        Update: Partial<InvoiceLineItem>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'payment_number' | 'created_at' | 'updated_at'> & Partial<Pick<Payment, 'id' | 'payment_number' | 'created_at' | 'updated_at'>>;
        Update: Partial<Payment>;
      };
      activities: {
        Row: Activity;
        Insert: Omit<Activity, 'id' | 'status' | 'created_at' | 'updated_at'> & Partial<Pick<Activity, 'id' | 'status' | 'created_at' | 'updated_at'>>;
        Update: Partial<Activity>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'is_read' | 'created_at'> & Partial<Pick<Notification, 'id' | 'is_read' | 'created_at'>>;
        Update: Partial<Notification>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'> & Partial<Pick<AuditLog, 'id' | 'created_at'>>;
        Update: Partial<AuditLog>;
      };
      zoho_sync_logs: {
        Row: ZohoSyncLog;
        Insert: Omit<ZohoSyncLog, 'id' | 'created_at'> & Partial<Pick<ZohoSyncLog, 'id' | 'created_at'>>;
        Update: Partial<ZohoSyncLog>;
      };
    };
    Views: {
      [_ in string]: {
        Row: Record<string, any>;
        Insert: Partial<Record<string, any>>;
        Update: Partial<Record<string, any>>;
      };
    };
    Functions: {
      [_ in string]: {
        Args: Record<string, any> | any[];
        Returns: any;
      };
    };
    Enums: {
      user_role: UserRole;
      lead_status: LeadStatus;
      lead_source: LeadSource;
      opportunity_stage: OpportunityStage;
      quote_status: QuoteStatus;
      order_status: OrderStatus;
      invoice_status: InvoiceStatus;
      activity_type: ActivityType;
      activity_status: ActivityStatus;
      sync_status: SyncStatus;
    };
  };
}
