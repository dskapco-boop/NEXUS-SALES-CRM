-- ============================================
-- CONFIGURABLE LEAD PIPELINES & STAGES
-- Adapts Krayin CRM's pipeline model for Nexus CRM
-- Allows reorderable, probabilistic pipeline stages
-- =============================================

-- ============================================================
-- PIPELINES: Multiple pipelines, one default
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lead_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  rotten_days INTEGER DEFAULT 30,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipelines_active ON public.lead_pipelines(is_active);
CREATE INDEX IF NOT EXISTS idx_pipelines_default ON public.lead_pipelines(is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_pipelines_created_by ON public.lead_pipelines(created_by);

-- ============================================================
-- PIPELINE STAGES: Global stage definitions
-- Similar to Krayin's lead_stages (code, name, is_user_defined)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lead_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code)
);

CREATE INDEX IF NOT EXISTS idx_stages_code ON public.lead_stages(code);

-- ============================================================
-- PIPELINE STAGE MAPPING: Links stages to pipelines with order/probability
-- Similar to Krayin's lead_pipeline_stages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES public.lead_pipelines(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.lead_stages(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  is_won BOOLEAN DEFAULT FALSE,
  is_lost BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pipeline_id, stage_id),
  UNIQUE(pipeline_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline ON public.pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_stage ON public.pipeline_stages(stage_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_sort ON public.pipeline_stages(pipeline_id, sort_order);

-- ============================================================
-- ADD pipeline_stage_id to leads (alongside status ENUM)
-- ============================================================
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.lead_pipelines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pipeline_stage_id UUID REFERENCES public.lead_stages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_pipeline ON public.leads(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON public.leads(pipeline_stage_id);

-- ============================================================
-- ROW LEVEL SECURITY: Pipeline config tables are readable by
-- all authenticated users, writable only by admins
-- ============================================================
ALTER TABLE public.lead_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read lead stages"
  ON public.lead_stages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage lead stages"
  ON public.lead_stages FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "All authenticated users can read pipelines"
  ON public.lead_pipelines FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage pipelines"
  ON public.lead_pipelines FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "All authenticated users can read pipeline stages"
  ON public.pipeline_stages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage pipeline stage mappings"
  ON public.pipeline_stages FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- SEED DATA: Default pipeline with Krayin-style stages
-- Runs with migration-level privileges (bypasses RLS)
-- ============================================================
DO $$
BEGIN
  -- Insert default stages (Krayin's standard pipeline stages)
  INSERT INTO public.lead_stages (code, name, is_system) VALUES ('new', 'New', TRUE);
  INSERT INTO public.lead_stages (code, name, is_system) VALUES ('follow_up', 'Follow Up', TRUE);
  INSERT INTO public.lead_stages (code, name, is_system) VALUES ('prospect', 'Prospect', TRUE);
  INSERT INTO public.lead_stages (code, name, is_system) VALUES ('negotiation', 'Negotiation', TRUE);
  INSERT INTO public.lead_stages (code, name, is_system) VALUES ('won', 'Won', TRUE);
  INSERT INTO public.lead_stages (code, name, is_system) VALUES ('lost', 'Lost', TRUE);
EXCEPTION WHEN unique_violation THEN
  -- Stages already exist, continue
  NULL;
END $$;

DO $$
BEGIN
  -- Insert default pipeline
  INSERT INTO public.lead_pipelines (name, is_default, is_active, rotten_days)
  VALUES ('Default Pipeline', TRUE, TRUE, 30);
EXCEPTION WHEN unique_violation THEN
  NULL;
END $$;

DO $$
DECLARE
  default_pipeline UUID;
  stage_rec RECORD;
  sort_order_map JSONB := '{"new": 0, "follow_up": 1, "prospect": 2, "negotiation": 3, "won": 4, "lost": 5}';
  prob_map JSONB := '{"new": 10, "follow_up": 20, "prospect": 40, "negotiation": 70, "won": 100, "lost": 0}';
BEGIN
  SELECT id INTO default_pipeline FROM public.lead_pipelines WHERE is_default = TRUE LIMIT 1;
  
  IF default_pipeline IS NOT NULL THEN
    FOR stage_rec IN SELECT id, code FROM public.lead_stages LOOP
      INSERT INTO public.pipeline_stages (
        pipeline_id, stage_id, sort_order, probability, is_won, is_lost
      ) VALUES (
        default_pipeline,
        stage_rec.id,
        (sort_order_map->>stage_rec.code)::INTEGER,
        (prob_map->>stage_rec.code)::INTEGER,
        stage_rec.code = 'won',
        stage_rec.code = 'lost'
      );
    END LOOP;
  END IF;
EXCEPTION WHEN unique_violation THEN
  NULL;
END $$;