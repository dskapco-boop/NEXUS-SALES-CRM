-- Add missing roles to user_role enum
-- The initial schema only has 'admin', 'sales_manager', 'sales_rep', 'viewer'
-- But extended RLS policies reference 'operations', 'finance', 'sales_exec', 'iso_consultant'
-- This migration adds the missing role values to the enum

-- PostgreSQL allows adding new values to an existing ENUM
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'operations';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales_exec';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'iso_consultant';
