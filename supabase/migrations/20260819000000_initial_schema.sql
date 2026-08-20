-- ============================================
-- NEXUS CRM DATABASE SCHEMA
-- PostgreSQL (Supabase) - Clean, Minimal, Professional
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('admin', 'sales_manager', 'sales_rep', 'viewer');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost');
CREATE TYPE lead_source AS ENUM ('website', 'referral', 'cold_call', 'email', 'social', 'event', 'other');
CREATE TYPE opportunity_stage AS ENUM ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'revised');
CREATE TYPE order_status AS ENUM ('draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'void', 'cancelled');
CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'task', 'note', 'whatsapp');
CREATE TYPE activity_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE sync_status AS ENUM ('pending', 'synced', 'failed', 'conflict');

-- ============================================
-- USERS (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'sales_rep',
  manager_id UUID REFERENCES public.users(id),
  phone TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_manager ON public.users(manager_id);

-- ============================================
-- TEAMS
-- ============================================
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  manager_id UUID REFERENCES public.users(id),
  parent_team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_name ON public.teams(name);
CREATE INDEX idx_teams_manager ON public.teams(manager_id);

CREATE TABLE public.user_teams (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, team_id)
);

CREATE INDEX idx_user_teams_user ON public.user_teams(user_id);
CREATE INDEX idx_user_teams_team ON public.user_teams(team_id);

-- ============================================
-- ACCOUNTS
-- ============================================
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  employee_count INTEGER,
  annual_revenue NUMERIC(15,2),
  billing_address JSONB DEFAULT '{}',
  shipping_address JSONB DEFAULT '{}',
  owner_id UUID NOT NULL REFERENCES public.users(id),
  team_id UUID REFERENCES public.teams(id),
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,
  zoho_account_id TEXT,
  zoho_sync_status sync_status DEFAULT 'pending',
  zoho_last_synced_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_accounts_owner ON public.accounts(owner_id);
CREATE INDEX idx_accounts_name ON public.accounts(name);
CREATE INDEX idx_accounts_zoho ON public.accounts(zoho_account_id);

-- ============================================
-- CONTACTS
-- ============================================
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  job_title TEXT,
  department TEXT,
  preferred_contact_method TEXT DEFAULT 'email',
  do_not_email BOOLEAN DEFAULT false,
  do_not_call BOOLEAN DEFAULT false,
  owner_id UUID NOT NULL REFERENCES public.users(id),
  team_id UUID REFERENCES public.teams(id),
  address JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,
  zoho_contact_id TEXT,
  zoho_sync_status sync_status DEFAULT 'pending',
  zoho_last_synced_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_contacts_account ON public.contacts(account_id);
CREATE INDEX idx_contacts_owner ON public.contacts(owner_id);
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_zoho ON public.contacts(zoho_contact_id);

-- ============================================
-- OPPORTUNITIES
-- ============================================
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  lead_id UUID,  -- FK added below (circular ref to leads)
  stage opportunity_stage NOT NULL DEFAULT 'prospecting',
  probability INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100),
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'AED',
  expected_close_date DATE,
  actual_close_date DATE,
  owner_id UUID NOT NULL REFERENCES public.users(id),
  team_id UUID REFERENCES public.teams(id),
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  loss_reason TEXT,
  loss_notes TEXT,
  zoho_deal_id TEXT,
  zoho_sync_status sync_status DEFAULT 'pending',
  zoho_last_synced_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_opportunities_owner ON public.opportunities(owner_id);
CREATE INDEX idx_opportunities_stage ON public.opportunities(stage);
CREATE INDEX idx_opportunities_account ON public.opportunities(account_id);
CREATE INDEX idx_opportunities_close_date ON public.opportunities(expected_close_date);
CREATE INDEX idx_opportunities_amount ON public.opportunities(amount DESC);

-- ============================================
-- LEADS
-- ============================================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  company TEXT,
  job_title TEXT,
  status lead_status NOT NULL DEFAULT 'new',
  source lead_source NOT NULL DEFAULT 'other',
  score INTEGER DEFAULT 0,
  owner_id UUID NOT NULL REFERENCES public.users(id),
  team_id UUID REFERENCES public.teams(id),
  address JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,
  converted_at TIMESTAMPTZ,
  converted_contact_id UUID REFERENCES public.contacts(id),
  converted_opportunity_id UUID REFERENCES public.opportunities(id),
  zoho_contact_id TEXT,
  zoho_sync_status sync_status DEFAULT 'pending',
  zoho_last_synced_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_leads_owner ON public.leads(owner_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_company ON public.leads(company);
CREATE INDEX idx_leads_created ON public.leads(created_at DESC);
CREATE INDEX idx_leads_source ON public.leads(source);
CREATE INDEX idx_leads_zoho ON public.leads(zoho_contact_id);

-- Add circular FK (opportunities -> leads) now that both tables exist
ALTER TABLE public.opportunities
  ADD CONSTRAINT fk_opportunities_leads
  FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

-- ============================================
-- PRODUCTS & PRICE BOOKS
-- ============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  description TEXT,
  type TEXT DEFAULT 'service' CHECK (type IN ('product', 'service', 'bundle')),
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'AED',
  cost_price NUMERIC(15,2),
  tax_rate NUMERIC(5,2) DEFAULT 5.00,
  track_inventory BOOLEAN DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  unit TEXT DEFAULT 'pcs',
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  zoho_item_id TEXT,
  zoho_sync_status sync_status DEFAULT 'pending',
  zoho_last_synced_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_active ON public.products(is_active);

CREATE TABLE public.price_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT DEFAULT 'AED',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.price_book_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_book_id UUID NOT NULL REFERENCES public.price_books(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  unit_price NUMERIC(15,2) NOT NULL,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  min_quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(price_book_id, product_id)
);

-- ============================================
-- QUOTES
-- ============================================
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT NOT NULL UNIQUE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  status quote_status NOT NULL DEFAULT 'draft',
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'AED',
  owner_id UUID NOT NULL REFERENCES public.users(id),
  team_id UUID REFERENCES public.teams(id),
  subject TEXT,
  body TEXT,
  terms_conditions TEXT,
  notes TEXT,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  zoho_estimate_id TEXT,
  zoho_sync_status sync_status DEFAULT 'pending',
  zoho_last_synced_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_quotes_number ON public.quotes(quote_number);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_account ON public.quotes(account_id);
CREATE INDEX idx_quotes_owner ON public.quotes(owner_id);
CREATE INDEX idx_quotes_date ON public.quotes(quote_date DESC);

CREATE TABLE public.quote_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  line_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 5.00,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  line_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qli_quote ON public.quote_line_items(quote_id);

-- ============================================
-- SALES ORDERS
-- ============================================
CREATE TABLE public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'draft',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_ship_date DATE,
  shipped_date DATE,
  delivered_date DATE,
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'AED',
  owner_id UUID NOT NULL REFERENCES public.users(id),
  team_id UUID REFERENCES public.teams(id),
  shipping_address JSONB DEFAULT '{}',
  billing_address JSONB DEFAULT '{}',
  shipping_method TEXT,
  tracking_number TEXT,
  notes TEXT,
  internal_notes TEXT,
  zoho_salesorder_id TEXT,
  zoho_sync_status sync_status DEFAULT 'pending',
  zoho_last_synced_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_so_number ON public.sales_orders(order_number);
CREATE INDEX idx_so_status ON public.sales_orders(status);
CREATE INDEX idx_so_account ON public.sales_orders(account_id);
CREATE INDEX idx_so_owner ON public.sales_orders(owner_id);

CREATE TABLE public.sales_order_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  line_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 5.00,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  line_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  quantity_delivered NUMERIC(10,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_soli_so ON public.sales_order_line_items(sales_order_id);

-- ============================================
-- INVOICES
-- ============================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  sales_order_id UUID REFERENCES public.sales_orders(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(15,2) DEFAULT 0,
  amount_due NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'AED',
  owner_id UUID NOT NULL REFERENCES public.users(id),
  team_id UUID REFERENCES public.teams(id),
  billing_address JSONB DEFAULT '{}',
  shipping_address JSONB DEFAULT '{}',
  notes TEXT,
  terms_conditions TEXT,
  zoho_invoice_id TEXT,
  zoho_sync_status sync_status DEFAULT 'pending',
  zoho_last_synced_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_inv_number ON public.invoices(invoice_number);
CREATE INDEX idx_inv_status ON public.invoices(status);
CREATE INDEX idx_inv_account ON public.invoices(account_id);
CREATE INDEX idx_inv_owner ON public.invoices(owner_id);
CREATE INDEX idx_inv_due_date ON public.invoices(due_date);
CREATE INDEX idx_inv_date ON public.invoices(invoice_date DESC);

CREATE TABLE public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  line_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 5.00,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  line_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ili_invoice ON public.invoice_line_items(invoice_id);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT NOT NULL UNIQUE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL,
  currency TEXT DEFAULT 'AED',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'cheque', 'online', 'other')),
  reference_number TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'partial_refund')),
  notes TEXT,
  zoho_payment_id TEXT,
  zoho_sync_status sync_status DEFAULT 'pending',
  zoho_last_synced_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX idx_payments_date ON public.payments(payment_date DESC);
CREATE INDEX idx_payments_zoho ON public.payments(zoho_payment_id);

-- ============================================
-- ACTIVITIES
-- ============================================
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'contact', 'account', 'opportunity', 'quote', 'sales_order', 'invoice')),
  entity_id UUID NOT NULL,
  type activity_type NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  status activity_status NOT NULL DEFAULT 'planned',
  owner_id UUID NOT NULL REFERENCES public.users(id),
  assigned_to UUID REFERENCES public.users(id),
  outcome TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_entity ON public.activities(entity_type, entity_id);
CREATE INDEX idx_activities_owner ON public.activities(owner_id);
CREATE INDEX idx_activities_assigned ON public.activities(assigned_to);
CREATE INDEX idx_activities_scheduled ON public.activities(scheduled_at);
CREATE INDEX idx_activities_type ON public.activities(type);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  action_url TEXT,
  action_label TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);

-- ============================================
-- SETTINGS
-- ============================================
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ZOHO SYNC LOG
-- ============================================
CREATE TABLE public.zoho_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  zoho_id TEXT,
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'pull', 'push')),
  status sync_status NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zsl_entity ON public.zoho_sync_logs(entity_type, entity_id);
CREATE INDEX idx_zsl_status ON public.zoho_sync_logs(status);

-- ============================================
-- TRIGGERS (auto-update timestamps)
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_price_books_updated_at
  BEFORE UPDATE ON public.price_books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_price_book_entries_updated_at
  BEFORE UPDATE ON public.price_book_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_quote_line_items_updated_at
  BEFORE UPDATE ON public.quote_line_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_sales_orders_updated_at
  BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_sales_order_line_items_updated_at
  BEFORE UPDATE ON public.sales_order_line_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_invoice_line_items_updated_at
  BEFORE UPDATE ON public.invoice_line_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_zoho_sync_logs_updated_at
  BEFORE UPDATE ON public.zoho_sync_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
