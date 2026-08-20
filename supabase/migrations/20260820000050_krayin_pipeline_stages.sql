-- Migration: Update lead_status enum to support Krayin-style pipeline stages
-- Adds: follow_up (Follow Up), prospect, won
-- Maps old statuses for backward compatibility

-- Recreate the lead_status enum with Krayin pipeline stages
-- Krayin: New → Follow Up → Prospect → Negotiation → Won → Lost

CREATE OR REPLACE FUNCTION update_lead_status_enum() RETURNS void AS $$
BEGIN
    -- Add new enum values (PostgreSQL doesn't support removing enum values without recreating)
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'follow_up') THEN
        ALTER TYPE lead_status RENAME TO lead_status_old;
        CREATE TYPE lead_status AS ENUM ('new', 'follow_up', 'prospect', 'negotiation', 'won', 'lost', 'contacted', 'qualified', 'unqualified', 'converted');
        ALTER TABLE public.leads ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE public.leads ALTER COLUMN status TYPE lead_status USING status::text::lead_status;
        ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'new';
        DROP TYPE lead_status_old;
    END IF;
END;
$$ LANGUAGE plpgsql;

SELECT update_lead_status_enum();
DROP FUNCTION update_lead_status_enum();
