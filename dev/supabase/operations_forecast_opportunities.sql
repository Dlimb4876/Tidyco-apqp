-- Operations forecast opportunities table for the Operations dashboard forecast layer.
-- Mirrors the runtime shape used in portals/operations/js/operations-forecast-data.js.

create extension if not exists "pgcrypto";

create table if not exists public.operations_forecast_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  owner text not null default '',
  status text not null default 'identified',
  work_area text not null default 'Unassigned',
  start_date date,
  due_date date,
  total_hours numeric not null default 0,
  probability_pct numeric not null default 0,
  notes text not null default '',
  user_id uuid,
  created_by_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_operations_forecast_created_at
  on public.operations_forecast_opportunities (created_at desc);

create index if not exists idx_operations_forecast_status
  on public.operations_forecast_opportunities (status);

alter table public.operations_forecast_opportunities enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'operations_forecast_opportunities'
      and policyname = 'auth_operations_forecast_opportunities'
  ) then
    create policy "auth_operations_forecast_opportunities"
      on public.operations_forecast_opportunities
      for all
      using (auth.role() = 'authenticated')
      with check (auth.role() = 'authenticated');
  end if;
end
$$;
