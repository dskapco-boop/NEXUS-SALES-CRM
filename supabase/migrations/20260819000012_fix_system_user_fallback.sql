-- ============================================
-- FIX: Foreign Key Violation - System User Fallback
-- Issue: auth.uid() returns NULL for service_role context,
-- causing owner_id to remain NULL, violating NOT NULL constraint.
-- 
-- Fix: When no authenticated user is detected, use a system user as fallback.
-- ============================================

-- Drop and recreate the trigger function with fallback logic
DROP FUNCTION IF EXISTS public.set_owner_and_creator() CASCADE;

CREATE OR REPLACE FUNCTION public.set_owner_and_creator()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID := auth.uid();
  user_exists BOOLEAN;
BEGIN
  -- Auto-create user profile in public.users if auth user exists but no profile
  IF current_user_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = current_user_id) INTO user_exists;
    IF NOT user_exists THEN
      INSERT INTO public.users (id, email, full_name, role, is_active)
      VALUES (
        current_user_id,
        (SELECT email FROM auth.users WHERE id = current_user_id),
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = current_user_id),
        'sales_rep',
        true
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;
    
    -- Set created_by if not provided
    IF NEW.created_by IS NULL THEN
      NEW.created_by := current_user_id;
    END IF;
  END IF;
  
  -- Set owner_id if not provided and we have an authenticated user
  IF NEW.owner_id IS NULL AND current_user_id IS NOT NULL THEN
    NEW.owner_id := current_user_id;
  END IF;
  
  -- If owner_id is still null (service_role context or no auth), 
  -- use the system user as fallback
  IF NEW.owner_id IS NULL THEN
    BEGIN
      INSERT INTO public.users (id, email, full_name, role, is_active)
      VALUES ('00000000-0000-0000-0000-000000000000', 'system@nexus-crm.local', 'System User', 'admin', true)
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    NEW.owner_id := '00000000-0000-0000-0000-000000000000';
    IF NEW.created_by IS NULL THEN
      NEW.created_by := '00000000-0000-0000-0000-000000000000';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate all triggers (they reference the function)
DROP TRIGGER IF EXISTS trigger_set_owner_leads ON public.leads;
DROP TRIGGER IF EXISTS trigger_set_owner_accounts ON public.accounts;
DROP TRIGGER IF EXISTS trigger_set_owner_contacts ON public.contacts;
DROP TRIGGER IF EXISTS trigger_set_owner_opportunities ON public.opportunities;
DROP TRIGGER IF EXISTS trigger_set_owner_products ON public.products;
DROP TRIGGER IF EXISTS trigger_set_owner_quotes ON public.quotes;
DROP TRIGGER IF EXISTS trigger_set_owner_sales_orders ON public.sales_orders;
DROP TRIGGER IF EXISTS trigger_set_owner_invoices ON public.invoices;
DROP TRIGGER IF EXISTS trigger_set_owner_payments ON public.payments;
DROP TRIGGER IF EXISTS trigger_set_owner_activities ON public.activities;

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
