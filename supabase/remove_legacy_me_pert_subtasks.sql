-- Remove legacy ME/PM capacity PERT and subtask tables.
-- Safe to run multiple times.

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime' AND tablename = 'me_task_subtasks'
	) THEN
		ALTER PUBLICATION supabase_realtime DROP TABLE me_task_subtasks;
	END IF;

	IF EXISTS (
		SELECT 1
		FROM pg_publication_tables
		WHERE pubname = 'supabase_realtime' AND tablename = 'me_task_pert_history'
	) THEN
		ALTER PUBLICATION supabase_realtime DROP TABLE me_task_pert_history;
	END IF;
END
$$;

DROP TABLE IF EXISTS me_task_subtasks;
DROP TABLE IF EXISTS me_task_pert_history;
