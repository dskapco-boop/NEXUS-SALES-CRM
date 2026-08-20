-- ============================================
-- RLS POLICIES FOR EXTENDED SCHEMA
-- Policies for: completion_reports, service_orders,
-- projects, iso_clients, audits, audit_findings,
-- warehouses, warehouse_stock, stock_movements, meetings
-- ============================================

-- ============================================================
-- COMPLETION REPORTS
-- ============================================================
ALTER TABLE public.completion_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all completion reports" ON public.completion_reports;
CREATE POLICY "Admins can manage all completion reports"
  ON public.completion_reports FOR ALL
  USING (public.can_access_record(owner_id, team_id));

DROP POLICY IF EXISTS "Sales Managers can manage all completion reports" ON public.completion_reports;
CREATE POLICY "Sales Managers can manage all completion reports"
  ON public.completion_reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager'))
  );

DROP POLICY IF EXISTS "Sales Executives can manage completion reports" ON public.completion_reports;
CREATE POLICY "Sales Executives can manage completion reports"
  ON public.completion_reports FOR INSERT WITH CHECK (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager'))
  );

DROP POLICY IF EXISTS "Operations and Finance can view completion reports" ON public.completion_reports;
CREATE POLICY "Operations and Finance can view completion reports"
  ON public.completion_reports FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager', 'operations', 'finance'))
  );

-- ============================================================
-- SERVICE ORDERS
-- ============================================================
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage all service orders" ON public.service_orders;
CREATE POLICY "Admin can manage all service orders"
  ON public.service_orders FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Sales Manager can manage team service orders" ON public.service_orders;
CREATE POLICY "Sales Manager can manage team service orders"
  ON public.service_orders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager'))
    OR EXISTS (SELECT 1 FROM public.user_teams ut JOIN public.users u ON ut.user_id = auth.uid() WHERE u.role = 'sales_manager' AND ut.team_id = service_orders.team_id)
  );

DROP POLICY IF EXISTS "Sales Executive can manage own service orders" ON public.service_orders;
CREATE POLICY "Sales Executive can manage own service orders"
  ON public.service_orders FOR ALL
  USING (
    service_orders.owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager'))
  );

DROP POLICY IF EXISTS "ISO Consultant can manage assigned service orders" ON public.service_orders;
CREATE POLICY "ISO Consultant can manage assigned service orders"
  ON public.service_orders FOR ALL
  USING (
    service_orders.assigned_consultants && ARRAY[auth.uid()]
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager'))
  );

DROP POLICY IF EXISTS "Operations and Finance can read service orders" ON public.service_orders;
CREATE POLICY "Operations and Finance can read service orders"
  ON public.service_orders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager', 'operations', 'finance'))
  );

-- ============================================================
-- PROJECTS (Supply + Service combined)
-- ============================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage all projects" ON public.projects;
CREATE POLICY "Admin can manage all projects"
  ON public.projects FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Sales Manager can manage team projects" ON public.projects;
CREATE POLICY "Sales Manager can manage team projects"
  ON public.projects FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager'))
    OR EXISTS (SELECT 1 FROM public.user_teams ut JOIN public.users u ON ut.user_id = auth.uid() WHERE u.role = 'sales_manager' AND ut.team_id = projects.team_id)
  );

DROP POLICY IF EXISTS "Sales Executive can manage own projects" ON public.projects;
CREATE POLICY "Sales Executive can manage own projects"
  ON public.projects FOR ALL
  USING (
    projects.owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager'))
  );

DROP POLICY IF EXISTS "ISO Consultant can manage assigned projects" ON public.projects;
CREATE POLICY "ISO Consultant can manage assigned projects"
  ON public.projects FOR ALL
  USING (
    projects.assigned_team && ARRAY[auth.uid()]
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager'))
  );

DROP POLICY IF EXISTS "Operations and Finance can read projects" ON public.projects;
CREATE POLICY "Operations and Finance can read projects"
  ON public.projects FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager', 'operations', 'finance'))
  );

-- ============================================================
-- ISO CLIENTS
-- ============================================================
ALTER TABLE public.iso_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage all ISO clients" ON public.iso_clients;
CREATE POLICY "Admin can manage all ISO clients"
  ON public.iso_clients FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Sales Manager can read ISO clients" ON public.iso_clients;
CREATE POLICY "Sales Manager can read ISO clients"
  ON public.iso_clients FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager')));

DROP POLICY IF EXISTS "ISO Consultant can manage assigned ISO clients" ON public.iso_clients;
CREATE POLICY "ISO Consultant can manage assigned ISO clients"
  ON public.iso_clients FOR ALL
  USING (
    iso_clients.assigned_consultant = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Others cannot access ISO client data" ON public.iso_clients;
CREATE POLICY "Others cannot access ISO client data"
  ON public.iso_clients FOR SELECT USING (FALSE);

-- ============================================================
-- AUDITS
-- ============================================================
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage all audits" ON public.audits;
CREATE POLICY "Admin can manage all audits"
  ON public.audits FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "ISO Consultant can manage assigned audits" ON public.audits;
CREATE POLICY "ISO Consultant can manage assigned audits"
  ON public.audits FOR ALL
  USING (
    audits.auditor = auth.uid()
    OR audits.auditor_team && ARRAY[auth.uid()]
    OR EXISTS (SELECT 1 FROM public.users u JOIN public.iso_clients ic ON u.id = ic.assigned_consultant WHERE ic.id = audits.iso_client_id AND u.id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Sales Manager can read audits" ON public.audits;
CREATE POLICY "Sales Manager can read audits"
  ON public.audits FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager')));

-- ============================================================
-- AUDIT FINDINGS
-- ============================================================
ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage all audit findings" ON public.audit_findings;
CREATE POLICY "Admin can manage all audit findings"
  ON public.audit_findings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "ISO Consultant can manage assigned findings" ON public.audit_findings;
CREATE POLICY "ISO Consultant can manage assigned findings"
  ON public.audit_findings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.audit_findings af JOIN public.audits a ON af.audit_id = a.id WHERE a.auditor = auth.uid() OR a.auditor_team && ARRAY[auth.uid()])
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Assigned users can read findings" ON public.audit_findings;
CREATE POLICY "Assigned users can read findings"
  ON public.audit_findings FOR SELECT
  USING (
    audit_findings.assigned_to = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager'))
  );

-- ============================================================
-- WAREHOUSES
-- ============================================================
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage all warehouses" ON public.warehouses;
CREATE POLICY "Admin can manage all warehouses"
  ON public.warehouses FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Sales Manager can read warehouses" ON public.warehouses;
CREATE POLICY "Sales Manager can read warehouses"
  ON public.warehouses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager')));

DROP POLICY IF EXISTS "Operations can manage warehouses" ON public.warehouses;
CREATE POLICY "Operations can manage warehouses"
  ON public.warehouses FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operations')));

DROP POLICY IF EXISTS "Sales Executive can read warehouses" ON public.warehouses;
CREATE POLICY "Sales Executive can read warehouses"
  ON public.warehouses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager', 'sales_exec')));

-- ============================================================
-- WAREHOUSE STOCK
-- ============================================================
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage all warehouse stock" ON public.warehouse_stock;
CREATE POLICY "Admin can manage all warehouse stock"
  ON public.warehouse_stock FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Operations can manage warehouse stock" ON public.warehouse_stock;
CREATE POLICY "Operations can manage warehouse stock"
  ON public.warehouse_stock FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operations')));

DROP POLICY IF EXISTS "Sales can read warehouse stock" ON public.warehouse_stock;
CREATE POLICY "Sales can read warehouse stock"
  ON public.warehouse_stock FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager', 'sales_exec', 'operations')));

-- ============================================================
-- STOCK MOVEMENTS
-- ============================================================
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage all stock movements" ON public.stock_movements;
CREATE POLICY "Admin can manage all stock movements"
  ON public.stock_movements FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Operations can manage stock movements" ON public.stock_movements;
CREATE POLICY "Operations can manage stock movements"
  ON public.stock_movements FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operations')));

DROP POLICY IF EXISTS "Sales can read stock movements" ON public.stock_movements;
CREATE POLICY "Sales can read stock movements"
  ON public.stock_movements FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager', 'sales_exec', 'operations')));

-- ============================================================
-- MEETINGS / APPOINTMENTS
-- ============================================================
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage all meetings" ON public.meetings;
CREATE POLICY "Admin can manage all meetings"
  ON public.meetings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Sales Manager can manage team meetings" ON public.meetings;
CREATE POLICY "Sales Manager can manage team meetings"
  ON public.meetings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager'))
    OR meetings.assigned_to = auth.uid()
  );

DROP POLICY IF EXISTS "Sales Executive can manage own meetings" ON public.meetings;
CREATE POLICY "Sales Executive can manage own meetings"
  ON public.meetings FOR ALL
  USING (
    meetings.assigned_to = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sales_manager'))
  );

DROP POLICY IF EXISTS "ISO Consultant can manage assigned meetings" ON public.meetings;
CREATE POLICY "ISO Consultant can manage assigned meetings"
  ON public.meetings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "All authenticated users can read meetings" ON public.meetings;
CREATE POLICY "All authenticated users can read meetings"
  ON public.meetings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- AUDIT LOGS (ensure RLS is enabled)
-- ============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read all audit logs" ON public.audit_logs;
CREATE POLICY "Admin can read all audit logs"
  ON public.audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Sales Manager can read team audit logs" ON public.audit_logs;
CREATE POLICY "Sales Manager can read team audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'sales_manager')
  );

DROP POLICY IF EXISTS "Users can read own audit logs" ON public.audit_logs;
CREATE POLICY "Users can read own audit logs"
  ON public.audit_logs FOR SELECT
  USING (audit_logs.user_id = auth.uid());
