-- ============================================
-- TRIGGERS FOR NEW TABLES
-- Apply set_owner_and_creator to all new tables
-- ============================================

-- Attach the set_owner_and_creator trigger to all new tables
-- that have owner_id/created_by columns

DO $$
DECLARE
  tbl RECORD;
  has_owner BOOLEAN;
  has_created_by BOOLEAN;
BEGIN
  FOR tbl IN 
    SELECT tablename::TEXT as table_name
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'completion_reports', 'service_orders', 'projects',
      'iso_clients', 'audits', 'audit_findings',
      'warehouses', 'warehouse_stock', 'stock_movements', 'meetings'
    )
  LOOP
    -- Check if table has owner_id column
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = tbl.table_name AND column_name = 'owner_id'
    ) INTO has_owner;
    
    IF has_owner THEN
      -- Check if trigger already exists
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgrelid = tbl.table_name::regclass 
        AND tgname = 'trg_set_owner_create_on_' || tbl.table_name
      ) THEN
        EXECUTE format('
          CREATE TRIGGER trg_set_owner_create_on_%I
          BEFORE INSERT ON public.%I
          FOR EACH ROW
          EXECUTE FUNCTION public.set_owner_and_creator()',
          tbl.table_name, tbl.table_name);
      END IF;
      
      RAISE NOTICE 'Added trigger to %', tbl.table_name;
    ELSE
      RAISE NOTICE 'Skipped % (no owner_id column)', tbl.table_name;
    END IF;
  END LOOP;
END $$;
