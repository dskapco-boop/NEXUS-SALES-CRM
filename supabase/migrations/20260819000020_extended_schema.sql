-- ============================================
-- EXTENDED SCHEMA MIGRATION
-- Adds tables from PRD that are missing:
-- service_orders, projects, completion_reports,
-- iso_clients, audits, audit_findings,
-- warehouses, stock_movements, meetings
-- ============================================

-- ============================================================
-- SERVICE ORDERS (ISO consultancy engagements)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE DEFAULT '', -- Will be set by trigger: SO-SVC-YYYY-XXXX
  title TEXT NOT NULL,
  description TEXT,
  scope_of_work TEXT NOT NULL,
  milestones JSONB, -- [{id, title, description, target_date, completed_date, status, deliverables}]
  assigned_consultants UUID[] NOT NULL DEFAULT '{}', -- Array of user IDs
  timesheets JSONB, -- [{date, consultant_id, hours, description, task}]
  billing_type TEXT NOT NULL CHECK (billing_type IN ('fixed', 'hourly')) DEFAULT 'fixed',
  total_amount DECIMAL(12,2),
  currency TEXT NOT NULL DEFAULT 'AED',
  base_currency_amount DECIMAL(12,2),
  exchange_rate DECIMAL(10,6),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  target_completion_date DATE,
  actual_completion_date DATE,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  owner_id UUID NOT NULL REFERENCES public.users(id),
  team_id UUID REFERENCES public.teams(id),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_service_orders_number ON public.service_orders(order_number);
CREATE INDEX idx_service_orders_account ON public.service_orders(account_id);
CREATE INDEX idx_service_orders_opportunity ON public.service_orders(opportunity_id);

-- ============================================================
-- PROJECTS (Supply + Service combined)
-- FK to completion_reports added AFTER completion_reports is created (circular dep)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  project_number TEXT NOT NULL UNIQUE DEFAULT '', -- Will be set by trigger: PRJ-YYYY-XXXX
  title TEXT NOT NULL,
  description TEXT,
  budget DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  base_currency_budget DECIMAL(12,2),
  actual_spent DECIMAL(12,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  budget_utilization DECIMAL(5,2), -- Percentage
  milestone JSONB, -- [{id, title, target_date, actual_date, status, deliverables}]
  supply_workstream JSONB, -- Link to sales_order, status, etc.
  service_workstream JSONB, -- Link to service_order, status, etc.
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_team UUID[] NOT NULL DEFAULT '{}',
  completion_report_id UUID, -- FK added below to avoid circular dependency
  owner_id UUID NOT NULL REFERENCES public.users(id),
  team_id UUID REFERENCES public.teams(id),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_number ON public.projects(project_number);
CREATE INDEX idx_projects_account ON public.projects(account_id);

-- ============================================================
-- COMPLETION REPORTS
-- FK to projects added below (circular dependency)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.completion_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  service_order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE,
  project_id UUID, -- FK added below to avoid circular dependency
  report_type TEXT NOT NULL CHECK (report_type IN ('delivery', 'service', 'project')),
  delivery_date DATE,
  received_quantity INTEGER,
  goods_condition TEXT,
  discrepancies TEXT,
  scope_delivered TEXT,
  milestones_achieved TEXT,
  deliverables_submitted JSONB,
  outstanding_items TEXT,
  photo_attachments TEXT[],
  signoff_status TEXT NOT NULL DEFAULT 'pending' CHECK (signoff_status IN ('pending', 'signed', 'rejected')),
  signoff_notes TEXT,
  customer_signature TEXT,
  signed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  owner_id UUID REFERENCES public.users(id),
  team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_completion_reports_order ON public.completion_reports(order_id);
CREATE INDEX idx_completion_reports_service_order ON public.completion_reports(service_order_id);
CREATE INDEX idx_completion_reports_project ON public.completion_reports(project_id);
CREATE INDEX idx_completion_reports_signoff ON public.completion_reports(signoff_status);
CREATE INDEX idx_completion_reports_owner ON public.completion_reports(owner_id);
CREATE INDEX idx_completion_reports_team ON public.completion_reports(team_id);

-- Add circular foreign keys AFTER both tables exist
ALTER TABLE IF EXISTS public.completion_reports
  ADD CONSTRAINT fk_completion_reports_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.projects
  ADD CONSTRAINT fk_projects_completion_report
  FOREIGN KEY (completion_report_id) REFERENCES public.completion_reports(id);

-- ============================================================
-- ISO CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.iso_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  target_standard TEXT NOT NULL, -- ISO 9001, ISO 14001, ISO 45001, etc.
  other_standard TEXT,
  certification_status TEXT NOT NULL DEFAULT 'not_started' CHECK (certification_status IN ('not_started', 'in_progress', 'certified', 'expired', 'at_risk')),
  certification_body TEXT,
  gap_status JSONB, -- [{clause, compliance_level, gaps, severity, recommendation}]
  gap_analysis_completed BOOLEAN DEFAULT FALSE,
  gap_analysis_date TIMESTAMPTZ,
  audit_schedule JSONB, -- [{type, scheduled_date, auditor, status, findings_count}]
  next_audit_date DATE,
  certification_date DATE,
  expiry_date DATE,
  surveillance_audit_cycle INTEGER DEFAULT 12, -- months
  recertification_date DATE,
  assigned_consultant UUID REFERENCES public.users(id),
  documents_folder_id TEXT, -- Google Drive folder ID
  evidence_documents JSONB, -- [{name, drive_id, uploaded_at, uploaded_by}]
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_iso_clients_account ON public.iso_clients(account_id);
CREATE INDEX idx_iso_clients_status ON public.iso_clients(certification_status);

-- ============================================================
-- AUDITS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_client_id UUID NOT NULL REFERENCES public.iso_clients(id) ON DELETE CASCADE,
  audit_type TEXT NOT NULL CHECK (audit_type IN ('gap_analysis', 'internal', 'external', 'surveillance')),
  title TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  actual_date DATE,
  auditor UUID REFERENCES public.users(id),
  auditor_team UUID[], -- Multiple auditors if needed
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  scope TEXT,
  findings_count INTEGER DEFAULT 0,
  documents_required TEXT[],
  evidence_collected BOOLEAN DEFAULT FALSE,
  report_uploaded BOOLEAN DEFAULT FALSE,
  report_drive_id TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audits_client ON public.audits(iso_client_id);
CREATE INDEX idx_audits_scheduled ON public.audits(scheduled_date);
CREATE INDEX idx_audits_status ON public.audits(status);

-- ============================================================
-- AUDIT FINDINGS (nonconformities, observations, improvements)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  finding_type TEXT NOT NULL CHECK (finding_type IN ('nonconformity', 'observation', 'opportunity_for_improvement')),
  severity TEXT CHECK (severity IN ('critical', 'major', 'minor')),
  reference_clause TEXT, -- The ISO standard clause being audited
  description TEXT NOT NULL,
  root_cause TEXT,
  corrective_action TEXT,
  assigned_to UUID REFERENCES public.users(id),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'reopened')),
  evidence_documents TEXT[],
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_findings_audit ON public.audit_findings(audit_id);
CREATE INDEX idx_findings_status ON public.audit_findings(status);
CREATE INDEX idx_findings_assigned ON public.audit_findings(assigned_to);

-- ============================================================
-- WAREHOUSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT,
  address TEXT,
  capacity DECIMAL(12,2),
  capacity_unit TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  manager_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_warehouses_code ON public.warehouses(code);

-- ============================================================
-- WAREHOUSE STOCK (per-product stock levels)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.warehouse_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
  reserved_quantity DECIMAL(12,3) DEFAULT 0, -- Allocated to orders
  reorder_level DECIMAL(12,3),
  last_stock_count DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(warehouse_id, product_id)
);

CREATE INDEX idx_wh_stock_warehouse ON public.warehouse_stock(warehouse_id);
CREATE INDEX idx_wh_stock_product ON public.warehouse_stock(product_id);

-- ============================================================
-- STOCK MOVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('inbound', 'outbound', 'adjustment', 'transfer')),
  quantity DECIMAL(12,3) NOT NULL,
  unit_cost DECIMAL(10,2),
  reference_document TEXT, -- PO#, SO#, adjustment ref
  reference_id UUID, -- sales_order_id, purchase_order_id etc.
  notes TEXT,
  user_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_warehouse ON public.stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_date ON public.stock_movements(created_at);

-- ============================================================
-- MEETINGS / APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('call', 'in_person', 'virtual')) DEFAULT 'in_person',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  end_at TIMESTAMPTZ,
  location TEXT,
  meeting_link TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  outcome TEXT,
  related_to_table TEXT CHECK (related_to_table IN ('leads', 'opportunities', 'quotes', 'sales_orders', 'service_orders', 'projects', 'accounts', 'contacts')),
  related_to_id UUID,
  participants JSONB, -- [{name, email, phone, role, is_internal}]
  assigned_to UUID REFERENCES public.users(id),
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_meetings_scheduled ON public.meetings(scheduled_at);
CREATE INDEX idx_meetings_related ON public.meetings(related_to_table, related_to_id);
CREATE INDEX idx_meetings_assigned ON public.meetings(assigned_to);
CREATE INDEX idx_meetings_status ON public.meetings(status);

-- ============================================================
-- AUTO-NUMBERING TRIGGERS for new tables
-- ============================================================

-- Function to generate order numbers (SO-SVC-YYYY-XXXX for service orders)
CREATE OR REPLACE FUNCTION public.generate_service_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
  next_seq INTEGER;
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    SELECT COALESCE(MAX(RIGHT(order_number, 4))::INTEGER, 0) + 1
    INTO next_seq
    FROM public.service_orders
    WHERE order_number LIKE ('SO-SVC-' || year_part || '-%');
    NEW.order_number := 'SO-SVC-' || year_part || '-' || LPAD(next_seq::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_service_orders_autonumber
  BEFORE INSERT ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_service_order_number();

-- Function to generate project numbers (PRJ-YYYY-XXXX)
CREATE OR REPLACE FUNCTION public.generate_project_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
  next_seq INTEGER;
BEGIN
  IF NEW.project_number IS NULL OR NEW.project_number = '' THEN
    SELECT COALESCE(MAX(RIGHT(project_number, 4))::INTEGER, 0) + 1
    INTO next_seq
    FROM public.projects
    WHERE project_number LIKE ('PRJ-' || year_part || '-%');
    NEW.project_number := 'PRJ-' || year_part || '-' || LPAD(next_seq::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_projects_autonumber
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_project_number();
