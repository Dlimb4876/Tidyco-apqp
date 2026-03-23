-- Add PFD flowchart fields so step type and branch destinations persist.
ALTER TABLE npi_pfd_steps
  ADD COLUMN IF NOT EXISTS pfd_type text,
  ADD COLUMN IF NOT EXISTS next_step_num integer,
  ADD COLUMN IF NOT EXISTS next_step_num_yes integer,
  ADD COLUMN IF NOT EXISTS next_step_num_no integer;

UPDATE npi_pfd_steps
SET pfd_type = 'Process'
WHERE step_type NOT IN ('header', 'group')
  AND (pfd_type IS NULL OR pfd_type = '');
