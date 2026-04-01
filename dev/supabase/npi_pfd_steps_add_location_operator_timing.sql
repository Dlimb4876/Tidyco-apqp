-- Migration: Add location, operator, and timing columns to npi_pfd_steps
-- Created: 2026-04-01

ALTER TABLE npi_pfd_steps
  ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS operator TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS timing TEXT DEFAULT '';
