-- ============================================
-- FIX: Allow public read access to pipeline config tables
-- These are configuration tables (not user data), so they should be
-- readable by anyone with a valid Supabase anon key, even without
-- an auth session (needed for KanbanBoard to load at app startup)
-- =============================================

-- Re-enable RLS but with permissive read policy
ALTER TABLE public.lead_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- LEAD STAGES
-- ============================================================
DROP POLICY IF EXISTS "All authenticated users can read lead stages" ON public.lead_stages;
DROP POLICY IF EXISTS "Admins can manage lead stages" ON public.lead_stages;

CREATE POLICY "Public read access to lead stages"
  ON public.lead_stages FOR SELECT USING (true);
CREATE POLICY "Admins can insert lead stages"
  ON public.lead_stages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update lead stages"
  ON public.lead_stages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- LEAD PIPELINES
-- ============================================================
DROP POLICY IF EXISTS "All authenticated users can read pipelines" ON public.lead_pipelines;
DROP POLICY IF EXISTS "Admins can manage pipelines" ON public.lead_pipelines;

CREATE POLICY "Public read access to pipelines"
  ON public.lead_pipelines FOR SELECT USING (true);
CREATE POLICY "Admins can insert pipelines"
  ON public.lead_pipelines FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update pipelines"
  ON public.lead_pipelines FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- PIPELINE STAGES (junction table)
-- ============================================================
DROP POLICY IF EXISTS "All authenticated users can read pipeline stages" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Admins can manage pipeline stage mappings" ON public.pipeline_stages;

CREATE POLICY "Public read access to pipeline stages"
  ON public.pipeline_stages FOR SELECT USING (true);
CREATE POLICY "Admins can insert pipeline stage mappings"
  ON public.pipeline_stages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update pipeline stage mappings"
  ON public.pipeline_stages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));