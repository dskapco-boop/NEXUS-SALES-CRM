-- Nexus CRM Database Schema
-- Zero-Cost B2B Sales CRM for General Trading & ISO Consultancy

-- Role definitions (matches PRD Table 6)
INSERT INTO auth.users (id, email, created_at) VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin@nexus.com', now()),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'sales_manager@nexus.com', now()),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'sales_exec@nexus.com', now()),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'consultant@nexus.com', now()),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'operations@nexus.com', now()),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'finance@nexus.com', now());

-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('admin', 'sales_manager', 'sales_executive', 'iso_consultant', 'operations', 'finance')),
  display_name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Users table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role_id UUID REFERENCES roles(id) SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  view_permission TEXT DEFAULT 'global' CHECK (view_permission IN ('global', 'team', 'individual')),
  territory_ids UUID[],
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Accounts (Companies/Organizations)
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  company_type TEXT CHECK (company_type IN ('client', 'prospect', 'competitor', 'partner')),
  country TEXT DEFAULT 'UAE',
  emirate TEXT CHECK (emirate IN ('Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah')),
  city TEXT,
  address TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  primary_contact_id UUID REFERENCES contacts(id),
  rating TEXT CHECK (rating IN ('hot', 'warm', 'cold')),
  tags TEXT[],
  source TEXT,
  estimated_deal_value NUMERIC(12,2),
  currency_preference TEXT DEFAULT 'AED',
  annual_revenue_aed NUMERIC(15,2),
  employee_count INTEGER,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('verified', 'pending', 'unverified')),
  verified_at TIMESTAMP,
  created_from_campaign_id UUID,
  owner_id UUID REFERENCES users(id),
  iso_compliance_status TEXT DEFAULT 'pending' CHECK (iso_compliance_status IN ('pending', 'in_review', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Contacts (People at Accounts)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  title TEXT,
  department TEXT,
  email TEXT,
  mobile TEXT,
  work_phone TEXT,
  whatsapp TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT CHECK (source IN ('website', 'referral', 'event', 'trade_show', 'cold_outreach', 'other')),
  account_id UUID REFERENCES accounts(id),
  contact_id UUID REFERENCES contacts(id),
  assigned_to UUID REFERENCES users(id),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'dead')),
  score INTEGER CHECK (score BETWEEN 1 AND 100),
  stage TEXT DEFAULT 'New' CHECK (stage IN ('New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost')),
  estimated_value NUMERIC(12,2),
  notes TEXT,
  tags TEXT[],
  lead_value NUMERIC(12,2),
  next_action_date DATE,
  last_contacted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Lead Activities Timeline
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('call', 'meeting', 'email', 'note')),
  subject TEXT NOT NULL,
  description TEXT,
  activity_date TIMESTAMP,
  duration_minutes INTEGER,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Inquiries
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  account_id UUID REFERENCES accounts(id),
  title TEXT NOT NULL,
  requirements TEXT,
  specifications JSONB,
  budget_range_min NUMERIC(12,2),
  budget_range_max NUMERIC(12,2),
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'negotiation', 'awarded', 'rejected', 'expired')),
  follow_up_date DATE,
  assigned_to UUID REFERENCES users(id),
  notes TEXT,
  attachments TEXT[],
  iso_compliance_status TEXT DEFAULT 'pending' CHECK (iso_compliance_status IN ('pending', 'in_review', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Inquiry Line Items
CREATE TABLE inquiry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2),
  unit TEXT,
  estimated_price NUMERIC(12,2),
  currency TEXT DEFAULT 'AED',
  notes TEXT
);

-- Quotation Templates
CREATE TABLE quotation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  terms_and_conditions TEXT,
  payment_terms TEXT,
  logo_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Quotations
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id),
  account_id UUID REFERENCES accounts(id),
  quote_number TEXT UNIQUE NOT NULL, -- QUO-YYYY-0001
  currency TEXT DEFAULT 'AED',
  exchange_rate NUMERIC(10,4) DEFAULT 1.0000,
  valid_until DATE,
  terms_and_conditions TEXT,
  discount_percent NUMERIC(5,2),
  discount_amount NUMERIC(12,2),
  tax_percent NUMERIC(5,2),
  tax_amount NUMERIC(12,2),
  subtotal NUMERIC(12,2),
  total_discount NUMERIC(12,2),
  total_tax NUMERIC(12,2),
  grand_total NUMERIC(12,2),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  sent_at TIMESTAMP,
  accepted_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  iso_compliance_status TEXT DEFAULT 'pending' CHECK (iso_compliance_status IN ('pending', 'in_review', 'approved', 'rejected'))
);

-- Quote Line Items
CREATE TABLE quote_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uid(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2),
  unit TEXT,
  unit_price NUMERIC(12,2),
  discount_percent NUMERIC(5,2),
  tax_rate NUMERIC(5,2),
  line_total NUMERIC(12,2),
  currency TEXT DEFAULT 'AED'
);

-- Quote Versions (for version control)
CREATE TABLE quote_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  quote_data JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Orders (Supply + Service + Project)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uid(),
  quotation_id UUID REFERENCES quotations(id),
  order_number TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('supply', 'service', 'project')),
  title TEXT,
  description TEXT,
  account_id UUID REFERENCES accounts(id),
  contact_id UUID REFERENCES contacts(id),
  assigned_to UUID REFERENCES users(id),
  status TEXT DEFAULT 'open' CHECK (type IN ('open', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  total_value NUMERIC(12,2),
  currency TEXT DEFAULT 'AED',
  start_date DATE,
  expected_end_date DATE,
  actual_completion_date DATE,
  delivery_address TEXT,
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  iso_compliance_status TEXT DEFAULT 'pending' CHECK (iso_compliance_status IN ('pending', 'in_review', 'approved', 'rejected'))
);

-- Supply Order Line Items
CREATE TABLE supply_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sku TEXT,
  product_name TEXT,
  quantity_ordered NUMERIC(10,2),
  quantity_shipped NUMERIC(10,2),
  quantity_remaining NUMERIC(10,2),
  unit_price NUMERIC(12,2),
  tax NUMERIC(5,2),
  subtotal NUMERIC(12,2),
  shipment_status TEXT CHECK (shipment_status IN ('pending', 'partial', 'shipped', 'delivered')),
  delivery_confirmation TEXT,
  notes TEXT
);

-- Service Order Tasks
CREATE TABLE service_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  assigned_consultant UUID REFERENCES users(id),
  scheduled_date DATE,
  scheduled_time TIME,
  duration_hours NUMERIC(5,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),
  completion_date TIMESTAMP,
  notes TEXT
);

-- Project Milestones
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  target_date DATE,
  actual_completion_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  completion_percentage NUMERIC(5,2) DEFAULT 0,
  deliverables_submitted TEXT[],
  notes TEXT
);

-- Completion Reports
CREATE TABLE completion_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  report_title TEXT,
  type TEXT CHECK (type IN ('supply', 'service', 'project')),
  delivery_details TEXT,
  scope_delivered TEXT,
  milestones_achieved TEXT,
  client_feedback TEXT,
  client_name TEXT,
  client_signature TEXT,
  signoff_status TEXT DEFAULT 'pending' CHECK (signoff_status IN ('pending', 'signed', 'rejected')),
  signoff_date TIMESTAMP,
  photo_attachments TEXT[],
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_report_id UUID REFERENCES completion_reports(id),
  invoice_number TEXT UNIQUE NOT NULL,
  issue_date DATE,
  due_date DATE,
  billing_address TEXT,
  account_id UUID REFERENCES accounts(id),
  contact_id UUID REFERENCES contacts(id),
  subtotal NUMERIC(12,2),
  discount_amount NUMERIC(12,2),
  tax_amount NUMERIC(12,2),
  total_amount NUMERIC(12,2),
  currency TEXT DEFAULT 'AED',
  exchange_rate NUMERIC(10,4) DEFAULT 1.0000,
  payment_terms TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  is_partial BOOLEAN DEFAULT false,
  partial_amount NUMERIC(12,2),
  sent_at TIMESTAMP,
  paid_at TIMESTAMP,
  sent_to_google_drive BOOLEAN DEFAULT false,
  google_drive_file_id TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Invoice Line Items
CREATE TABLE invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2),
  unit_price NUMERIC(12,2),
  tax_rate NUMERIC(5,2),
  line_total NUMERIC(12,2),
  currency TEXT DEFAULT 'AED'
);

-- Activities (Meetings, Calls, etc.)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  related_type TEXT, -- 'lead', 'inquiry', 'opportunity', 'quote', 'order', 'account', 'contact'
  related_id UUID,
  type TEXT CHECK (type IN ('call', 'meeting', 'email', 'task', 'note')),
  subject TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'canceled')),
  start_datetime TIMESTAMP,
  due_datetime TIMESTAMP,
  duration_minutes INTEGER,
  location TEXT,
  virtual_link TEXT,
  reminder_minutes INTEGER,
  participants JSONB, -- Array of participant objects
  owner_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'deferred', 'canceled')),
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMP,
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_minutes_before INTEGER DEFAULT 1440, -- 24 hours
  related_type TEXT,
  related_id UUID,
  owner_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Products (for supply orders)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit_of_measure TEXT,
  list_price_aed NUMERIC(12,2),
  cost_aed NUMERIC(12,2),
  stock_quantity NUMERIC(10,2) DEFAULT 0,
  reorder_level NUMERIC(10,2) DEFAULT 0,
  warehouse_location TEXT,
  supplier_info JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Services (for consultancy)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  duration_hours NUMERIC(5,2),
  rate_type TEXT CHECK (rate_type IN ('hourly', 'fixed')) DEFAULT 'hourly',
  rate_aed NUMERIC(12,2),
  category TEXT CHECK (category IN ('audit', 'training', 'certification', 'advisory')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('email', 'event', 'webinar', 'direct_mail', 'social')),
  channel TEXT CHECK (channel IN ('email', 'linkedin', 'whatsapp', 'phone', 'event')),
  status TEXT CHECK (status IN ('planning', 'active', 'completed', 'canceled')),
  budget_aed NUMERIC(12,2),
  expected_revenue_aed NUMERIC(12,2),
  actual_revenue_aed NUMERIC(12,2),
  start_date DATE,
  end_date DATE,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Campaign Accounts (many-to-many)
CREATE TABLE campaign_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now()
);

-- ISO Clients (extends accounts)
CREATE TABLE iso_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uid(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  target_standard TEXT, -- ISO 9001:2015, ISO 14001:2015, ISO 45001:2018, etc.
  certification_status TEXT DEFAULT 'not_started' CHECK (certification_status IN ('not_started', 'gap_analysis', 'implementation', 'internal_audit', 'certification_audit', 'certified', 'surveillance', 'recertification', 'expired')),
  certification_body TEXT,
  audit_schedule JSONB,
  gap_status TEXT DEFAULT 'pending' CHECK (gap_status IN ('pending', 'in_progress', 'complete')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ISO Audits
CREATE TABLE iso_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_client_id UUID REFERENCES iso_clients(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('gap_analysis', 'internal', 'certification', 'surveillance', 'recertification')),
  scheduled_date DATE,
  actual_date DATE,
  auditor TEXT,
  findings JSONB, -- Nonconformities, observations, opportunities
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'canceled')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Audit Findings
CREATE TABLE audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES iso_audits(id) ON DELETE CASCADE,
  finding_type TEXT CHECK (finding_type IN ('nonconformity', 'observation', 'opportunity')),
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('critical', 'major', 'minor')),
  corrective_action TEXT,
  responsible_person TEXT,
  due_date DATE,
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'verified')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Evidence Documents
CREATE TABLE evidence_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uid(),
  iso_client_id UUID REFERENCES iso_clients(id) ON DELETE CASCADE,
  document_type TEXT, -- procedure, record, policy, evidence
  title TEXT NOT NULL,
  document_url TEXT,
  google_drive_id TEXT,
  version TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT now(),
  access_log JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Currencies table for multi-currency support
CREATE TABLE currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- USD, EUR, GBP, etc.
  name TEXT NOT NULL,
  symbol TEXT,
  decimal_places INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  exchange_rate_to_aed NUMERIC(10,6),
  last_updated TIMESTAMP DEFAULT now()
);

-- Notification system
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- lead_assignment, quote_approval, task_reminder, etc.
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- System Settings
CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_type ON orders(type);
CREATE INDEX idx_activities_related ON activities(related_type, related_id);
CREATE INDEX idx_activities_owner ON activities(owner_id);
CREATE INDEX idx_tasks_due ON tasks(due_date);
CREATE INDEX idx_tasks_owner ON tasks(owner_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_accounts_industry ON accounts(industry);
CREATE INDEX idx_accounts_emirate ON accounts(emirate);

-- Seed initial data
INSERT INTO roles (name, display_name, description) VALUES
  ('admin', 'Administrator', 'Full system access and configuration'),
  ('sales_manager', 'Sales Manager', 'Team oversight and pipeline management'),
  ('sales_executive', 'Sales Executive', 'Primary sales operational user'),
  ('iso_consultant', 'ISO Consultant', 'ISO consultancy engagement specialist'),
  ('operations', 'Operations & Dispatch', 'Supply order fulfillment and logistics'),
  ('finance', 'Finance', 'Invoicing, payment tracking, and financial reporting');

-- Seed currencies
INSERT INTO currencies (code, name, symbol, exchange_rate_to_aed) VALUES
  ('AED', 'UAE Dirham', 'د.إ', 1.000000),
  ('USD', 'US Dollar', '$', 3.672000),
  ('EUR', 'Euro', '€', 3.985000),
  ('GBP', 'British Pound', '£', 4.621000),
  ('INR', 'Indian Rupee', '₹', 0.044000);

-- Seed system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('quote_number_format', '"QUO-{YYYY}-{####}"', 'Format for quote numbers'),
  ('invoice_number_format', '"INV-{YYYY}-{####}"', 'Format for invoice numbers'),
  ('order_number_format', '"{TYPE}-{YYYY}-{####}"', 'Format for order numbers'),
  ('default_currency', '"AED"', 'Default currency for the system'),
  ('vat_rate', '5.0', 'Default VAT rate for UAE transactions'),
  ('auto_quote_reminder_days', '3', 'Days before quote expiration to send reminder'),
  ('auto_invoice_reminder_days', '3', 'Days before invoice due date to send reminder');
