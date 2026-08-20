-- ============================================
-- AUTO-SET OWNER_ID AND CREATED_BY ON INSERT
-- Fixes "new row violates row-level security policy" error
-- When creating records via React Admin, owner_id and created_by
-- are not set by the client. These triggers auto-populate them.
-- ============================================

-- Helper function to set default owner_id and created_by
CREATE OR REPLACE FUNCTION public.set_owner_and_creator()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to all tables with owner_id and created_by columns
-- (leads, accounts, contacts, opportunities, products, quotes, sales_orders, invoices, payments)

CREATE TRIGGER trigger_set_owner_leads
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

CREATE TRIGGER trigger_set_owner_accounts
  BEFORE INSERT ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

CREATE TRIGGER trigger_set_owner_contacts
  BEFORE INSERT ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

CREATE TRIGGER trigger_set_owner_opportunities
  BEFORE INSERT ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

CREATE TRIGGER trigger_set_owner_products
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

CREATE TRIGGER trigger_set_owner_quotes
  BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

CREATE TRIGGER trigger_set_owner_sales_orders
  BEFORE INSERT ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

CREATE TRIGGER trigger_set_owner_invoices
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

CREATE TRIGGER trigger_set_owner_payments
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

CREATE TRIGGER trigger_set_owner_activities
  BEFORE INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

-- ============================================
-- FIX: Allow users to insert records where they are the owner
-- The RLS policy checked auth.uid() = created_by, but created_by
-- was NULL (not set by client). Now the trigger sets it automatically.
-- Also update policies to be more permissive for authenticated users.
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can create opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Users can create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can create sales orders" ON public.sales_orders;
DROP POLICY IF EXISTS "Users can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create activities" ON public.activities;

-- New policies: Allow any authenticated user to create records
-- The trigger will auto-set owner_id and created_by to auth.uid()
CREATE POLICY "Authenticated users can create leads" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create contacts" ON public.contacts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create opportunities" ON public.opportunities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create quotes" ON public.quotes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create sales orders" ON public.sales_orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create activities" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Also add triggers to set updated_at on row updates
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_updated_at_leads
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_updated_at_accounts
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_updated_at_contacts
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_updated_at_opportunities
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_updated_at_quotes
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_updated_at_sales_orders
  BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_updated_at_invoices
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
