-- MCS Manufacturing Change System - Database Migration
-- Run this script in Supabase SQL Editor

-- ============================================================================
-- TABLE 1: MCS_CHANGES (Core change register)
-- ============================================================================
CREATE TABLE mcs_changes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  justification TEXT,
  change_type TEXT NOT NULL CHECK (change_type IN ('Engineering', 'Process', 'Material', 'Tooling', 'Quality', 'Safety')),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL CHECK (status IN ('open', 'review', 'approved', 'implemented', 'rejected')),
  affected_area TEXT,
  part_drawing_no TEXT,
  initiated_by TEXT,
  initiated_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  updated_by_user_id UUID REFERENCES auth.users(id),
  target_implementation DATE,

  -- Approval workflow (4-step)
  eng_review_at TIMESTAMP,
  eng_review_by UUID REFERENCES auth.users(id),
  eng_review_status TEXT CHECK (eng_review_status IN ('pending', 'approved', 'rejected')),
  eng_review_notes TEXT,

  qa_review_at TIMESTAMP,
  qa_review_by UUID REFERENCES auth.users(id),
  qa_review_status TEXT CHECK (qa_review_status IN ('pending', 'approved', 'rejected')),
  qa_review_notes TEXT,

  mfg_signoff_at TIMESTAMP,
  mfg_signoff_by UUID REFERENCES auth.users(id),
  mfg_signoff_status TEXT CHECK (mfg_signoff_status IN ('pending', 'approved', 'rejected')),
  mfg_signoff_notes TEXT,

  auth_implementation_at TIMESTAMP,
  auth_implementation_by UUID REFERENCES auth.users(id),
  auth_implementation_status TEXT CHECK (auth_implementation_status IN ('pending', 'approved', 'rejected')),
  auth_implementation_notes TEXT,

  implementation_date DATE,

  -- Time impact assessment (links to Overhaul Trends)
  affected_product_id UUID,
  estimated_time_impact_days INTEGER,
  time_impact_reason TEXT,
  recovery_target_date DATE,

  -- Source tracking (multiple triggers)
  change_source TEXT CHECK (change_source IN ('Manual', 'PFMEA', 'Risk', 'Customer', 'Quality', 'Supply Chain')),
  related_pfmea_cause_id TEXT,
  related_risk_id TEXT,
  related_customer_feedback_id TEXT,
  related_quality_issue_id TEXT,

  -- Searchability
  search_text TEXT GENERATED ALWAYS AS (title || ' ' || description || ' ' || COALESCE(part_drawing_no, '')) STORED,

  created_by_user_id UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_mcs_status ON mcs_changes(status);
CREATE INDEX idx_mcs_created ON mcs_changes(created_at DESC);
CREATE INDEX idx_mcs_priority ON mcs_changes(priority);
CREATE INDEX idx_mcs_product ON mcs_changes(affected_product_id);
CREATE INDEX idx_mcs_source ON mcs_changes(change_source);
CREATE INDEX idx_mcs_search ON mcs_changes USING GIN(search_text);

ALTER TABLE mcs_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth" ON mcs_changes
FOR ALL
USING (auth.role() = 'authenticated');

-- ============================================================================
-- TABLE 2: MCS_IMPACTS (Impact checklist items)
-- ============================================================================
CREATE TABLE mcs_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_id TEXT NOT NULL REFERENCES mcs_changes(id) ON DELETE CASCADE,
  impact_type TEXT NOT NULL CHECK (impact_type IN (
    'Drawing Update', 'BOM Change', 'Work Instructions', 'QC Plan Update',
    'Supplier Approval', 'Tooling Change', 'Training Required', 'Customer Notification'
  )),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  completed_by_user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_mcs_impacts_change ON mcs_impacts(change_id);
CREATE INDEX idx_mcs_impacts_completed ON mcs_impacts(completed);

ALTER TABLE mcs_impacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth" ON mcs_impacts
FOR ALL
USING (auth.role() = 'authenticated');

-- ============================================================================
-- TABLE 3: MCS_TIMELINE (Activity audit log)
-- ============================================================================
CREATE TABLE mcs_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_id TEXT NOT NULL REFERENCES mcs_changes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'raised', 'submitted_review', 'eng_reviewed', 'qa_reviewed', 'mfg_signed', 'authorized',
    'implemented', 'rejected', 'edited', 'impact_updated', 'linked_product', 'approved_impact',
    'comment', 'progress_update'
  )),
  event_text TEXT,
  actor_user_id UUID REFERENCES auth.users(id),
  actor_email TEXT,
  actor_name TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_mcs_timeline_change ON mcs_timeline(change_id);
CREATE INDEX idx_mcs_timeline_created ON mcs_timeline(created_at DESC);

ALTER TABLE mcs_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth" ON mcs_timeline
FOR ALL
USING (auth.role() = 'authenticated');

-- ============================================================================
-- TABLE 4: OVERHAUL_HISTORY Enhancement (Add time impact tracking)
-- ============================================================================
-- NOTE: If overhaul_history table doesn't exist, create it first with these additional fields
-- ALTER TABLE overhaul_history ADD COLUMN IF NOT EXISTS time_impact_days INTEGER;
-- ALTER TABLE overhaul_history ADD COLUMN IF NOT EXISTS schedule_impact_reason TEXT;
-- ALTER TABLE overhaul_history ADD COLUMN IF NOT EXISTS mcs_reference_id TEXT;
-- ALTER TABLE overhaul_history ADD COLUMN IF NOT EXISTS baseline_overhaul_hours DECIMAL;
-- ALTER TABLE overhaul_history ADD COLUMN IF NOT EXISTS approved_by_user_id UUID;
-- ALTER TABLE overhaul_history ADD COLUMN IF NOT EXISTS effective_from_date DATE;
-- ALTER TABLE overhaul_history ADD COLUMN IF NOT EXISTS estimated_recovery_date DATE;
-- ALTER TABLE overhaul_history ADD COLUMN IF NOT EXISTS is_mcs_triggered BOOLEAN DEFAULT FALSE;

-- If creating fresh:
CREATE TABLE IF NOT EXISTS overhaul_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  overhaul_hours DECIMAL(10, 2),
  effective_date DATE NOT NULL,
  change_reason TEXT,
  notes TEXT,
  created_by_name TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now(),

  -- Time impact tracking (NEW)
  time_impact_days INTEGER,
  schedule_impact_reason TEXT,
  mcs_reference_id TEXT REFERENCES mcs_changes(id),
  baseline_overhaul_hours DECIMAL(10, 2),
  approved_by_user_id UUID REFERENCES auth.users(id),
  effective_from_date DATE,
  estimated_recovery_date DATE,
  is_mcs_triggered BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_overhaul_product ON overhaul_history(product_id);
CREATE INDEX idx_overhaul_mcs ON overhaul_history(mcs_reference_id);
CREATE INDEX idx_overhaul_impact_date ON overhaul_history(effective_from_date DESC);

ALTER TABLE overhaul_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth" ON overhaul_history
FOR ALL
USING (auth.role() = 'authenticated');

-- ============================================================================
-- Verify creation
-- ============================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
