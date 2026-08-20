-- ============================================
-- FIX: Test data not showing in application
-- Issue: Records created via service_role have owner_id = system user
--   (00000000-0000-0000-0000-000000000000)
-- Regular authenticated users can't see them because RLS
--   only shows records where owner_id = their user ID
--
-- Fix: Update can_access_record function to:
-- 1. Admin and sales_manager roles see ALL records (including system)
-- 2. All authenticated users can see records owned by system user
-- ============================================

-- Use CREATE OR REPLACE to keep dependent policies intact
CREATE OR REPLACE FUNCTION public.can_access_record(record_owner_id UUID, record_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID := auth.uid();
  current_user_role user_role;
  current_team_ids UUID[];
BEGIN
  -- If no authenticated user, deny access
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get current user's role
  SELECT role INTO current_user_role FROM public.users WHERE id = current_user_id;

  -- Admin and sales_manager see ALL records (including system user records)
  IF current_user_role IN ('admin', 'sales_manager') THEN
    RETURN TRUE;
  END IF;

  -- Owner sees own records
  IF record_owner_id = current_user_id THEN
    RETURN TRUE;
  END IF;

  -- See records owned by system user (created during setup/testing)
  IF record_owner_id = '00000000-0000-0000-0000-000000000000' THEN
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

-- Also ensure the system user exists
INSERT INTO public.users (id, email, full_name, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000000', 'system@nexus-crm.local', 'System User', 'admin', true)
ON CONFLICT (id) DO NOTHING;
