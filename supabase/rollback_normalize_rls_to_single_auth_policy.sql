-- Rollback for migration: normalize_rls_to_single_auth_policy
-- Restores the prior (pre-normalization) policy set captured from live DB.

DO $$
DECLARE
  t text;
  p record;
BEGIN
  -- Remove any currently active policies on affected tables first.
  FOREACH t IN ARRAY ARRAY[
    'global_settings',
    'overhaul_history',
    'production_capacity',
    'products',
    'work_areas',
    'bug_reports',
    'families',
    'family_pfmea_templates',
    'me_holidays',
    'me_products',
    'projects',
    'me_tasks',
    'production_batches',
    'user_feedback'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    FOR p IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;
  END LOOP;
END
$$;

-- global_settings
CREATE POLICY "auth" ON public.global_settings
FOR ALL TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete settings" ON public.global_settings
FOR DELETE TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert settings" ON public.global_settings
FOR INSERT TO public
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "allow_insert_global_settings" ON public.global_settings
FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read settings" ON public.global_settings
FOR SELECT TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "allow_authenticated_read_global_settings" ON public.global_settings
FOR SELECT TO public
USING (true);

CREATE POLICY "Allow authenticated users to update settings" ON public.global_settings
FOR UPDATE TO public
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "allow_update_global_settings" ON public.global_settings
FOR UPDATE TO public
USING (true)
WITH CHECK (true);

-- overhaul_history
CREATE POLICY "Allow authenticated users to delete overhaul history" ON public.overhaul_history
FOR DELETE TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own overhaul history" ON public.overhaul_history
FOR DELETE TO public
USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert overhaul history" ON public.overhaul_history
FOR INSERT TO public
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own overhaul history" ON public.overhaul_history
FOR INSERT TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to read overhaul history" ON public.overhaul_history
FOR SELECT TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own overhaul history" ON public.overhaul_history
FOR SELECT TO public
USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update overhaul history" ON public.overhaul_history
FOR UPDATE TO public
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own overhaul history" ON public.overhaul_history
FOR UPDATE TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- production_capacity
CREATE POLICY "Users manage own production capacity" ON public.production_capacity
FOR ALL TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete production capacity" ON public.production_capacity
FOR DELETE TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete own capacity records" ON public.production_capacity
FOR DELETE TO public
USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert production capacity" ON public.production_capacity
FOR INSERT TO public
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own capacity records" ON public.production_capacity
FOR INSERT TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to read production capacity" ON public.production_capacity
FOR SELECT TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all capacity records" ON public.production_capacity
FOR SELECT TO public
USING (true);

CREATE POLICY "Users can update own capacity records" ON public.production_capacity
FOR UPDATE TO public
USING (auth.uid() = user_id);

-- products
CREATE POLICY "Allow authenticated users to delete products" ON public.products
FOR DELETE TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own products" ON public.products
FOR DELETE TO public
USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert products" ON public.products
FOR INSERT TO public
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own products" ON public.products
FOR INSERT TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to read products" ON public.products
FOR SELECT TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own products" ON public.products
FOR SELECT TO public
USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update products" ON public.products
FOR UPDATE TO public
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own products" ON public.products
FOR UPDATE TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- work_areas
CREATE POLICY "Allow authenticated users to delete work areas" ON public.work_areas
FOR DELETE TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own work areas" ON public.work_areas
FOR DELETE TO public
USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert work areas" ON public.work_areas
FOR INSERT TO public
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own work areas" ON public.work_areas
FOR INSERT TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to read work areas" ON public.work_areas
FOR SELECT TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own work areas" ON public.work_areas
FOR SELECT TO public
USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update work areas" ON public.work_areas
FOR UPDATE TO public
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own work areas" ON public.work_areas
FOR UPDATE TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- bug_reports
CREATE POLICY "Allow authenticated users to delete bug reports" ON public.bug_reports
FOR DELETE TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert bug reports" ON public.bug_reports
FOR INSERT TO public
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own bug reports" ON public.bug_reports
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to read bug reports" ON public.bug_reports
FOR SELECT TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read bug reports" ON public.bug_reports
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update bug reports" ON public.bug_reports
FOR UPDATE TO public
USING (auth.role() = 'authenticated');

-- families
CREATE POLICY "Users can access their own families" ON public.families
FOR ALL TO public
USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete families" ON public.families
FOR DELETE TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert families" ON public.families
FOR INSERT TO public
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read families" ON public.families
FOR SELECT TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update families" ON public.families
FOR UPDATE TO public
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- family_pfmea_templates
CREATE POLICY "Users can access their own family templates" ON public.family_pfmea_templates
FOR ALL TO public
USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete templates" ON public.family_pfmea_templates
FOR DELETE TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert templates" ON public.family_pfmea_templates
FOR INSERT TO public
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read templates" ON public.family_pfmea_templates
FOR SELECT TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update templates" ON public.family_pfmea_templates
FOR UPDATE TO public
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- me_holidays
CREATE POLICY "me_holidays_user_policy" ON public.me_holidays
FOR ALL TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete holidays" ON public.me_holidays
FOR DELETE TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert holidays" ON public.me_holidays
FOR INSERT TO public
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read holidays" ON public.me_holidays
FOR SELECT TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update holidays" ON public.me_holidays
FOR UPDATE TO public
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- me_products
CREATE POLICY "me_products_user_policy" ON public.me_products
FOR ALL TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete me_products" ON public.me_products
FOR DELETE TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert me_products" ON public.me_products
FOR INSERT TO public
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read me_products" ON public.me_products
FOR SELECT TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update me_products" ON public.me_products
FOR UPDATE TO public
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- projects
CREATE POLICY "allow all" ON public.projects
FOR ALL TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete projects" ON public.projects
FOR DELETE TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert projects" ON public.projects
FOR INSERT TO public
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read projects" ON public.projects
FOR SELECT TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update projects" ON public.projects
FOR UPDATE TO public
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- me_tasks
CREATE POLICY "Allow authenticated users to delete tasks" ON public.me_tasks
FOR DELETE TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert tasks" ON public.me_tasks
FOR INSERT TO public
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read tasks" ON public.me_tasks
FOR SELECT TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update tasks" ON public.me_tasks
FOR UPDATE TO public
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- production_batches
CREATE POLICY "Users can manage their own batches" ON public.production_batches
FOR ALL TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete batches" ON public.production_batches
FOR DELETE TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert batches" ON public.production_batches
FOR INSERT TO public
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read batches" ON public.production_batches
FOR SELECT TO public
USING (auth.role() = 'authenticated');

-- user_feedback
CREATE POLICY "Allow authenticated users to insert feedback" ON public.user_feedback
FOR INSERT TO public
WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Allow authenticated users to read feedback" ON public.user_feedback
FOR SELECT TO public
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update feedback" ON public.user_feedback
FOR UPDATE TO public
USING (auth.role() = 'authenticated');
