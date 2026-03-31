-- Backup of production_batches table
-- Created: 2026-03-31T00:00:00Z
-- Total rows: 767

-- RESTORE INSTRUCTIONS:
-- 1. Connect to Supabase PostgreSQL database
-- 2. Run: psql -h db.eihxvmzsfnpdaizggsvs.supabase.co -U postgres -d postgres -f backup_production_batches_2026-03-31.sql

-- TABLE SCHEMA (commented out - uncomment and run first if table doesn't exist)
-- DROP TABLE IF EXISTS public.production_batches CASCADE;
-- CREATE TABLE public.production_batches (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL,
--   product_id UUID NOT NULL,
--   work_location TEXT NOT NULL,
--   quantity INTEGER,
--   start_date DATE,
--   due_date DATE,
--   status TEXT NOT NULL DEFAULT 'Planned',
--   notes TEXT,
--   line_number INTEGER,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
-- );

-- DATA INSERTS BELOW
