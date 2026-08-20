// Zoho MCP Tool Definitions
// Maps CRM entities to Zoho Books MCP server tools

export interface ZohoAddress {
  address?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  fax?: string;
}

export interface ZohoLineItem {
  item_id?: string;
  name: string;
  description?: string;
  item_order?: number;
  quantity: number;
  unit?: string;
  rate: number;
  discount?: number;
  tax_id?: string;
  tax_name?: string;
  tax_percentage?: number;
  tax_type?: "tax" | "tax_group";
  sku?: string;
  product_type?: "goods" | "service" | "inventory";
}

export interface ZohoMCPTools {
  create_contact: {
    contact_name: string;
    company_name?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    website?: string;
    contact_type?: "customer" | "vendor";
    billing_address?: ZohoAddress;
    shipping_address?: ZohoAddress;
    payment_terms?: number;
    payment_terms_label?: string;
    currency_id?: string;
    portal_enabled?: boolean;
    notes?: string;
    custom_fields?: Record<string, any>;
  };
  get_contact: { contact_id: string };
  update_contact: { contact_id: string } & Partial<ZohoMCPTools["create_contact"]>;
  list_contacts: { page?: number; per_page?: number; search_text?: string; status?: string };

  create_item: {
    name: string;
    description?: string;
    rate: number;
    unit?: string;
    tax_id?: string;
    tax_name?: string;
    tax_percentage?: number;
    sku?: string;
    product_type?: "goods" | "service" | "inventory";
    purchase_rate?: number;
    purchase_description?: string;
    custom_fields?: Record<string, any>;
  };
  get_item: { item_id: string };
  list_items: { page?: number; per_page?: number; search_text?: string; status?: string };

  create_estimate: {
    customer_id: string;
    customer_name?: string;
    estimate_number?: string;
    reference_number?: string;
    date: string;
    expiry_date?: string;
    status?: "draft" | "sent" | "invoiced" | "accepted" | "declined" | "expired";
    line_items: ZohoLineItem[];
    notes?: string;
    terms?: string;
    discount?: number;
    discount_type?: "entity_level" | "item_level";
    is_discount_before_tax?: boolean;
    exchange_rate?: number;
    custom_fields?: Record<string, any>;
  };
  get_estimate: { estimate_id: string };
  update_estimate: { estimate_id: string } & Partial<ZohoMCPTools["create_estimate"]>;
  list_estimates: { page?: number; per_page?: number; status?: string; customer_id?: string };
  email_estimate: { estimate_id: string; to_mail_ids: string[]; subject?: string; body?: string };
  mark_estimate_status: { estimate_id: string; status: "sent" | "accepted" | "declined" | "expired" };

  create_invoice: {
    customer_id: string;
    invoice_number?: string;
    date: string;
    due_date?: string;
    status?: "draft" | "sent" | "overdue" | "paid" | "void";
    line_items: ZohoLineItem[];
    notes?: string;
    terms?: string;
    discount?: number;
    discount_type?: "entity_level" | "item_level";
    custom_fields?: Record<string, any>;
  };
  get_invoice: { invoice_id: string };
  update_invoice: { invoice_id: string } & Partial<ZohoMCPTools["create_invoice"]>;
  list_invoices: { page?: number; per_page?: number; status?: string; customer_id?: string };
  email_invoice: { invoice_id: string; to_mail_ids: string[]; subject?: string; body?: string };
  void_invoice: { invoice_id: string };

  create_salesorder: {
    customer_id: string;
    salesorder_number?: string;
    date: string;
    shipment_date?: string;
    status?: "draft" | "open" | "closed" | "void";
    line_items: ZohoLineItem[];
    notes?: string;
    terms?: string;
    discount?: number;
    custom_fields?: Record<string, any>;
  };
  get_salesorder: { salesorder_id: string };
  list_salesorders: { page?: number; per_page?: number; status?: string; customer_id?: string };

  create_payment: {
    customer_id: string;
    payment_mode: "cash" | "check" | "bank_transfer" | "paypal" | "stripe" | "other";
    amount: number;
    date: string;
    reference_number?: string;
    description?: string;
    invoices: Array<{ invoice_id: string; amount_applied: number }>;
    custom_fields?: Record<string, any>;
  };
  list_payments: { page?: number; per_page?: number; customer_id?: string };

  sync_customers: { direction?: "push" | "pull" | "both"; since?: string };
  sync_items: { direction?: "push" | "pull" | "both"; since?: string };
  sync_estimates: { direction?: "push" | "pull" | "both"; since?: string };
  sync_invoices: { direction?: "push" | "pull" | "both"; since?: string };
  sync_payments: { direction?: "push" | "pull" | "both"; since?: string };
}
