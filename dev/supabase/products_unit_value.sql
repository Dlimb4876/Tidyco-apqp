-- Add unit_value column to products table
-- Unit value represents the monetary value per overhaul unit in GBP
-- Default: £100 for all existing and new products

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS unit_value numeric(12,2) DEFAULT 100;

-- Backfill any existing products that may not have the default applied
UPDATE public.products
  SET unit_value = 100
  WHERE unit_value IS NULL;
