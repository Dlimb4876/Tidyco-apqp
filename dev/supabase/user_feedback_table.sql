-- ============================================================
-- User Feedback Table Schema
-- For unified Feedback & Bug Reporting system
-- ============================================================

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  submitted_by TEXT NOT NULL,
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_area TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('usability', 'feature_request', 'improvement', 'bug')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'planned', 'in_progress', 'completed', 'declined', 'squashed')),
  response TEXT,
  responded_by TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_date ON user_feedback(date_submitted DESC);

-- Enable Row Level Security
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow all authenticated users to read feedback
CREATE POLICY "Allow authenticated users to read feedback"
ON user_feedback FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow authenticated users to submit feedback (their own submissions)
CREATE POLICY "Allow authenticated users to insert feedback"
ON user_feedback FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Allow authenticated users to update feedback (for responses/admin actions)
CREATE POLICY "Allow authenticated users to update feedback"
ON user_feedback FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_feedback TO authenticated;

-- ============================================================
-- Usage Instructions:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Verify the table appears in the Table Editor
-- 3. Test by inserting a sample record:
--
-- INSERT INTO user_feedback (user_id, submitted_by, feedback_type, title, description)
-- VALUES (auth.uid(), 'test@tidyco.co.uk', 'usability', 'Test Feedback', 'This is a test');
-- ============================================================
