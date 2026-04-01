-- Crisis-mode guardrails for accidental data loss:
-- 1) Add soft-delete fields to products/families/work_areas
-- 2) Create audit trail table
-- 3) Block hard deletes at DB level and convert to a clear error
-- 4) Log inserts/updates/deletes for forensic tracing

-- Soft-delete metadata columns
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS delete_reason text;

ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS delete_reason text;

ALTER TABLE public.work_areas
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS delete_reason text;

-- Audit trail table
CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  row_id text NOT NULL,
  actor_user_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  old_data jsonb,
  new_data jsonb
);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'audit_events'
      AND policyname = 'authenticated_all_audit_events'
  ) THEN
    CREATE POLICY "authenticated_all_audit_events"
      ON public.audit_events
      FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_audit_events_table_time
  ON public.audit_events (table_name, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_row
  ON public.audit_events (table_name, row_id);

-- Shared trigger: block hard delete
CREATE OR REPLACE FUNCTION public.prevent_hard_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Hard delete blocked on %. Use soft-delete update (deleted_at/deleted_by/delete_reason).', TG_TABLE_NAME;
END;
$$;

-- Shared trigger: write audit event
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row_id text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_row_id := COALESCE((to_jsonb(NEW)->>'id'), '');
    INSERT INTO public.audit_events (table_name, action, row_id, actor_user_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, v_row_id, auth.uid(), NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_row_id := COALESCE((to_jsonb(NEW)->>'id'), (to_jsonb(OLD)->>'id'), '');
    INSERT INTO public.audit_events (table_name, action, row_id, actor_user_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, v_row_id, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSE
    v_row_id := COALESCE((to_jsonb(OLD)->>'id'), '');
    INSERT INTO public.audit_events (table_name, action, row_id, actor_user_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, v_row_id, auth.uid(), to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;
END;
$$;

-- Attach delete guards
DROP TRIGGER IF EXISTS trg_products_prevent_hard_delete ON public.products;
CREATE TRIGGER trg_products_prevent_hard_delete
BEFORE DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();

DROP TRIGGER IF EXISTS trg_families_prevent_hard_delete ON public.families;
CREATE TRIGGER trg_families_prevent_hard_delete
BEFORE DELETE ON public.families
FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();

DROP TRIGGER IF EXISTS trg_work_areas_prevent_hard_delete ON public.work_areas;
CREATE TRIGGER trg_work_areas_prevent_hard_delete
BEFORE DELETE ON public.work_areas
FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();

-- Attach audit triggers
DROP TRIGGER IF EXISTS trg_products_audit ON public.products;
CREATE TRIGGER trg_products_audit
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS trg_families_audit ON public.families;
CREATE TRIGGER trg_families_audit
AFTER INSERT OR UPDATE OR DELETE ON public.families
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS trg_work_areas_audit ON public.work_areas;
CREATE TRIGGER trg_work_areas_audit
AFTER INSERT OR UPDATE OR DELETE ON public.work_areas
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
