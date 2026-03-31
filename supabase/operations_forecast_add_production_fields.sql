-- Migration: Add production-based forecasting columns to operations_forecast_opportunities
-- Created: 2026-03-30

-- Add new columns for production-based forecasting
ALTER TABLE operations_forecast_opportunities
  ADD COLUMN IF NOT EXISTS total_units NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS oh_hours_per_unit NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS batch_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS beat_rate_days INTEGER DEFAULT 1;

-- Note: total_hours will now be calculated live from these inputs
-- The calculation is: total_hours = total_units * oh_hours_per_unit
-- Hours are distributed across batches based on beat_rate_days
