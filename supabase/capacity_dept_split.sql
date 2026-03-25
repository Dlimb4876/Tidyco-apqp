-- Capacity department split reference migration
--
-- Live note:
-- The PM / LOG / UNIT6 capacity split was already applied manually in Supabase.
-- This file backfills the repo with an idempotent reference script that documents
-- the intended isolated-table shape and the verification steps for future audits.

BEGIN;

-- PM isolated tables
CREATE TABLE IF NOT EXISTS public.pm_teams (LIKE public.me_teams INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE IF NOT EXISTS public.pm_tasks (LIKE public.me_tasks INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE IF NOT EXISTS public.pm_products (LIKE public.me_products INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE IF NOT EXISTS public.pm_holidays (LIKE public.me_holidays INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE IF NOT EXISTS public.pm_product_support_history (LIKE public.me_product_support_history INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);

-- Logistics isolated tables
CREATE TABLE IF NOT EXISTS public.log_teams (LIKE public.me_teams INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE IF NOT EXISTS public.log_tasks (LIKE public.me_tasks INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE IF NOT EXISTS public.log_products (LIKE public.me_products INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE IF NOT EXISTS public.log_holidays (LIKE public.me_holidays INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE IF NOT EXISTS public.log_product_support_history (LIKE public.me_product_support_history INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);

-- Unit 6 isolated tables
CREATE TABLE IF NOT EXISTS public.unit6_teams (LIKE public.me_teams INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE IF NOT EXISTS public.unit6_tasks (LIKE public.me_tasks INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE IF NOT EXISTS public.unit6_products (LIKE public.me_products INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE IF NOT EXISTS public.unit6_holidays (LIKE public.me_holidays INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);
CREATE TABLE IF NOT EXISTS public.unit6_product_support_history (LIKE public.me_product_support_history INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING INDEXES);

-- Ensure split support-history tables keep the latest breakdown columns.
ALTER TABLE public.pm_product_support_history ADD COLUMN IF NOT EXISTS kitting_hours numeric;
ALTER TABLE public.pm_product_support_history ADD COLUMN IF NOT EXISTS booking_in_out_hours numeric;
ALTER TABLE public.pm_product_support_history ADD COLUMN IF NOT EXISTS kitting_time_booking_hours numeric;
ALTER TABLE public.pm_product_support_history ADD COLUMN IF NOT EXISTS product_movement_hours numeric;

ALTER TABLE public.log_product_support_history ADD COLUMN IF NOT EXISTS kitting_hours numeric;
ALTER TABLE public.log_product_support_history ADD COLUMN IF NOT EXISTS booking_in_out_hours numeric;
ALTER TABLE public.log_product_support_history ADD COLUMN IF NOT EXISTS kitting_time_booking_hours numeric;
ALTER TABLE public.log_product_support_history ADD COLUMN IF NOT EXISTS product_movement_hours numeric;

ALTER TABLE public.unit6_product_support_history ADD COLUMN IF NOT EXISTS kitting_hours numeric;
ALTER TABLE public.unit6_product_support_history ADD COLUMN IF NOT EXISTS booking_in_out_hours numeric;
ALTER TABLE public.unit6_product_support_history ADD COLUMN IF NOT EXISTS kitting_time_booking_hours numeric;
ALTER TABLE public.unit6_product_support_history ADD COLUMN IF NOT EXISTS product_movement_hours numeric;

-- Backfill rows safely when the source tables still contain mixed departments.
INSERT INTO public.pm_teams SELECT * FROM public.me_teams WHERE department = 'PM' ON CONFLICT DO NOTHING;
INSERT INTO public.pm_tasks SELECT * FROM public.me_tasks WHERE department = 'PM' ON CONFLICT DO NOTHING;
INSERT INTO public.pm_products SELECT * FROM public.me_products WHERE department = 'PM' ON CONFLICT DO NOTHING;
INSERT INTO public.pm_holidays SELECT * FROM public.me_holidays WHERE department = 'PM' ON CONFLICT DO NOTHING;
INSERT INTO public.pm_product_support_history SELECT * FROM public.me_product_support_history WHERE department = 'PM' ON CONFLICT DO NOTHING;

INSERT INTO public.log_teams SELECT * FROM public.me_teams WHERE department = 'LOG' ON CONFLICT DO NOTHING;
INSERT INTO public.log_tasks SELECT * FROM public.me_tasks WHERE department = 'LOG' ON CONFLICT DO NOTHING;
INSERT INTO public.log_products SELECT * FROM public.me_products WHERE department = 'LOG' ON CONFLICT DO NOTHING;
INSERT INTO public.log_holidays SELECT * FROM public.me_holidays WHERE department = 'LOG' ON CONFLICT DO NOTHING;
INSERT INTO public.log_product_support_history SELECT * FROM public.me_product_support_history WHERE department = 'LOG' ON CONFLICT DO NOTHING;

INSERT INTO public.unit6_teams SELECT * FROM public.me_teams WHERE department = 'UNIT6' ON CONFLICT DO NOTHING;
INSERT INTO public.unit6_tasks SELECT * FROM public.me_tasks WHERE department = 'UNIT6' ON CONFLICT DO NOTHING;
INSERT INTO public.unit6_products SELECT * FROM public.me_products WHERE department = 'UNIT6' ON CONFLICT DO NOTHING;
INSERT INTO public.unit6_holidays SELECT * FROM public.me_holidays WHERE department = 'UNIT6' ON CONFLICT DO NOTHING;
INSERT INTO public.unit6_product_support_history SELECT * FROM public.me_product_support_history WHERE department = 'UNIT6' ON CONFLICT DO NOTHING;

COMMIT;

-- Verification queries
-- SELECT COUNT(*) FROM public.me_teams WHERE department = 'PM';
-- SELECT COUNT(*) FROM public.pm_teams;
-- SELECT COUNT(*) FROM public.me_tasks WHERE department = 'PM';
-- SELECT COUNT(*) FROM public.pm_tasks;
-- SELECT COUNT(*) FROM public.me_holidays WHERE department = 'PM';
-- SELECT COUNT(*) FROM public.pm_holidays;
-- SELECT COUNT(*) FROM public.me_product_support_history WHERE department = 'PM';
-- SELECT COUNT(*) FROM public.pm_product_support_history;
--
-- Repeat for LOG and UNIT6. LOG / UNIT6 me_products source rows may legitimately be 0
-- if products were historically normalised into ME before this split.