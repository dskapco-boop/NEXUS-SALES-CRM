-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_book_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoho_sync_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'sales_manager') FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_access_record(record_owner_id UUID, record_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID := auth.uid();
  current_user_role user_role;
  current_team_ids UUID[];
BEGIN
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT role INTO current_user_role FROM public.users WHERE id = current_user_id;

  -- Admin and sales_manager see all
  IF current_user_role IN ('admin', 'sales_manager') THEN
    RETURN TRUE;
  END IF;

  -- Owner sees own records
  IF record_owner_id = current_user_id THEN
    RETURN TRUE;
  END IF;

  -- Team members see team records
  IF record_team_id IS NOT NULL THEN
    SELECT array_agg(team_id) INTO current_team_ids
    FROM public.user_teams WHERE user_id = current_user_id;

    IF record_team_id = ANY(current_team_ids) THEN
      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- USERS POLICIES
-- ============================================
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin_or_manager());

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (public.is_admin_or_manager());

-- ============================================
-- TEAMS POLICIES
-- ============================================
CREATE POLICY "Team members can view their teams" ON public.teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM public.user_teams WHERE user_id = auth.uid())
    OR manager_id = auth.uid()
    OR public.is_admin_or_manager()
  );

CREATE POLICY "Admins can manage teams" ON public.teams
  FOR ALL USING (public.is_admin_or_manager());

-- ============================================
-- LEADS POLICIES
-- ============================================
CREATE POLICY "Users can view accessible leads" ON public.leads
  FOR SELECT USING (
    public.can_access_record(owner_id, team_id)
    OR public.is_admin_or_manager()
  );

CREATE POLICY "Users can create leads" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update accessible leads" ON public.leads
  FOR UPDATE USING (public.can_access_record(owner_id, team_id));

CREATE POLICY "Admins can delete leads" ON public.leads
  FOR DELETE USING (public.is_admin_or_manager());

-- ============================================
-- ACCOUNTS POLICIES
-- ============================================
CREATE POLICY "Users can view accessible accounts" ON public.accounts
  FOR SELECT USING (public.can_access_record(owner_id, team_id));

CREATE POLICY "Users can create accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update accessible accounts" ON public.accounts
  FOR UPDATE USING (public.can_access_record(owner_id, team_id));

CREATE POLICY "Admins can delete accounts" ON public.accounts
  FOR DELETE USING (public.is_admin_or_manager());

-- ============================================
-- CONTACTS POLICIES
-- ============================================
CREATE POLICY "Users can view accessible contacts" ON public.contacts
  FOR SELECT USING (public.can_access_record(owner_id, team_id));

CREATE POLICY "Users can create contacts" ON public.contacts
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update accessible contacts" ON public.contacts
  FOR UPDATE USING (public.can_access_record(owner_id, team_id));

CREATE POLICY "Admins can delete contacts" ON public.contacts
  FOR DELETE USING (public.is_admin_or_manager());

-- ============================================
-- OPPORTUNITIES POLICIES
-- ============================================
CREATE POLICY "Users can view accessible opportunities" ON public.opportunities
  FOR SELECT USING (public.can_access_record(owner_id, team_id));

CREATE POLICY "Users can create opportunities" ON public.opportunities
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update accessible opportunities" ON public.opportunities
  FOR UPDATE USING (public.can_access_record(owner_id, team_id));

CREATE POLICY "Admins can delete opportunities" ON public.opportunities
  FOR DELETE USING (public.is_admin_or_manager());

-- ============================================
-- PRODUCTS POLICIES
-- ============================================
CREATE POLICY "Authenticated users can view products" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- ============================================
-- QUOTES POLICIES
-- ============================================
CREATE POLICY "Users can view accessible quotes" ON public.quotes
  FOR SELECT USING (public.can_access_record(owner_id, team_id));

CREATE POLICY "Users can create quotes" ON public.quotes
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update accessible quotes" ON public.quotes
  FOR UPDATE USING (public.can_access_record(owner_id, team_id));

CREATE POLICY "Admins can delete quotes" ON public.quotes
  FOR DELETE USING (public.is_admin_or_manager());

CREATE POLICY "Quote line items follow quote access" ON public.quote_line_items
  FOR ALL USING (
    quote_id IN (SELECT id FROM public.quotes WHERE public.can_access_record(owner_id, team_id))
  );

-- ============================================
-- SALES ORDERS POLICIES
-- ============================================
CREATE POLICY "Users can view accessible sales orders" ON public.sales_orders
  FOR SELECT USING (public.can_access_record(owner_id, team_id));

CREATE POLICY "Users can create sales orders" ON public.sales_orders
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update accessible sales orders" ON public.sales_orders
  FOR UPDATE USING (public.can_access_record(owner_id, team_id));

CREATE POLICY "Admins can delete sales orders" ON public.sales_orders
  FOR DELETE USING (public.is_admin_or_manager());

CREATE POLICY "SO line items follow SO access" ON public.sales_order_line_items
  FOR ALL USING (
    sales_order_id IN (SELECT id FROM public.sales_orders WHERE public.can_access_record(owner_id, team_id))
  );

-- ============================================
-- INVOICES POLICIES
-- ============================================
CREATE POLICY "Users can view accessible invoices" ON public.invoices
  FOR SELECT USING (public.can_access_record(owner_id, team_id));

CREATE POLICY "Users can create invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update accessible invoices" ON public.invoices
  FOR UPDATE USING (public.can_access_record(owner_id, team_id));

CREATE POLICY "Admins can delete invoices" ON public.invoices
  FOR DELETE USING (public.is_admin_or_manager());

CREATE POLICY "Invoice line items follow invoice access" ON public.invoice_line_items
  FOR ALL USING (
    invoice_id IN (SELECT id FROM public.invoices WHERE public.can_access_record(owner_id, team_id))
  );

-- ============================================
-- PAYMENTS POLICIES
-- ============================================
CREATE POLICY "Users can view accessible payments" ON public.payments
  FOR SELECT USING (
    invoice_id IN (SELECT id FROM public.invoices WHERE public.can_access_record(owner_id, team_id))
  );

CREATE POLICY "Users can create payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- ============================================
-- ACTIVITIES POLICIES
-- ============================================
CREATE POLICY "Users can view accessible activities" ON public.activities
  FOR SELECT USING (
    owner_id = auth.uid()
    OR assigned_to = auth.uid()
    OR public.is_admin_or_manager()
  );

CREATE POLICY "Users can create activities" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own activities" ON public.activities
  FOR UPDATE USING (owner_id = auth.uid() OR assigned_to = auth.uid());

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- AUDIT LOGS (admins only)
-- ============================================
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- ============================================
-- SETTINGS
-- ============================================
CREATE POLICY "Public settings readable" ON public.settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "Admins manage settings" ON public.settings
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- ============================================
-- ZOHO SYNC LOGS (admins only)
-- ============================================
CREATE POLICY "Admins can view sync logs" ON public.zoho_sync_logs
  FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "System can insert sync logs" ON public.zoho_sync_logs
  FOR INSERT WITH CHECK (true);
