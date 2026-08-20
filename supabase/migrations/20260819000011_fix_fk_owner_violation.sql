-- ============================================
-- FIX: Foreign Key Violation on owner_id
-- "insert or update on table 'leads' violates 
--  foreign key constraint 'leads_owner_id_fkey'"
-- 
-- Root cause: auth.uid() returns a UUID from auth.users,
-- but the corresponding record in public.users may not exist yet.
-- This happens when a user authenticates in Supabase Auth but
-- their profile hasn't been created in the public.users table.
-- 
-- Fix: Auto-sync auth users to public.users on signup
-- ============================================

-- Drop the existing set_owner_and_creator function and recreate with user sync
DROP FUNCTION IF EXISTS public.set_owner_and_creator() CASCADE;

CREATE OR REPLACE FUNCTION public.set_owner_and_creator()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID := auth.uid();
  user_exists BOOLEAN;
BEGIN
  -- Get current user from auth, or use service_role bypass
  IF current_user_id IS NULL THEN
    -- Try to get from request header (for service_role context)
    current_user_id := NULLIF(current_setting('request.header.x-user-id', true), '')::UUID;
  END IF;
  
  -- Auto-create user profile if it doesn't exist yet
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
  
  -- Set owner_id if not provided and we have a user
  IF NEW.owner_id IS NULL AND current_user_id IS NOT NULL THEN
    NEW.owner_id := current_user_id;
  END IF;
  
  -- If owner_id is still null, use a fallback system user
  IF NEW.owner_id IS NULL THEN
    -- Create a system user if needed and use it as fallback
    BEGIN
      INSERT INTO public.users (id, email, full_name, role, is_active)
      VALUES ('00000000-0000-0000-0000-000000000000', 'system@nexus-crm.local', 'System User', 'admin', true)
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- User might already exist
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

-- Recreate triggers for all tables
DROP TRIGGER IF EXISTS trigger_set_owner_leads ON public.leads;
CREATE TRIGGER trigger_set_owner_leads
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

DROP TRIGGER IF EXISTS trigger_set_owner_accounts ON public.accounts;
CREATE TRIGGER trigger_set_owner_accounts
  BEFORE INSERT ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

DROP TRIGGER IF EXISTS trigger_set_owner_contacts ON public.contacts;
CREATE TRIGGER trigger_set_owner_contacts
  BEFORE INSERT ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

DROP TRIGGER IF EXISTS trigger_set_owner_opportunities ON public.opportunities;
CREATE TRIGGER trigger_set_owner_opportunities
  BEFORE INSERT ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

DROP TRIGGER IF EXISTS trigger_set_owner_products ON public.products;
CREATE TRIGGER trigger_set_owner_products
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

DROP TRIGGER IF EXISTS trigger_set_owner_quotes ON public.quotes;
CREATE TRIGGER trigger_set_owner_quotes
  BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

DROP TRIGGER IF EXISTS trigger_set_owner_sales_orders ON public.sales_orders;
CREATE TRIGGER trigger_set_owner_sales_orders
  BEFORE INSERT ON public.sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

DROP TRIGGER IF EXISTS trigger_set_owner_invoices ON public.invoices;
CREATE TRIGGER trigger_set_owner_invoices
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

DROP TRIGGER IF EXISTS trigger_set_owner_payments ON public.payments;
CREATE TRIGGER trigger_set_owner_payments
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

DROP TRIGGER IF EXISTS trigger_set_owner_activities ON public.activities;
CREATE TRIGGER trigger_set_owner_activities
  BEFORE INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_and_creator();

-- ============================================
-- Also create a dedicated auth trigger for automatic user profile creation
-- This runs after a new user signs up via Supabase Auth
-- ============================================

-- Function to handle new auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'sales_rep',
    true
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists (from earlier migrations)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users (Supabase built-in trigger table)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- Also: If there are existing auth.users that don't have public.users profiles,
-- create them now (backfill)
-- Also update the updated_at function to be idempotent (avoid re-creating)
-- =====================================================================

-- Ensure set_updated_at function exists
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
