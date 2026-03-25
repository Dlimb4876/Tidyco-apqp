-- Add task-level disable flag so records can be excluded from calculations
-- without deleting the task row.
ALTER TABLE public.me_tasks
ADD COLUMN IF NOT EXISTS is_disabled boolean NOT NULL DEFAULT false;

UPDATE public.me_tasks
SET is_disabled = false
WHERE is_disabled IS NULL;
