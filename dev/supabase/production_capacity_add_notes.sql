-- Migration: Add notes column to production_capacity for month-level comments
-- Created: 2026-04-01

ALTER TABLE production_capacity
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
