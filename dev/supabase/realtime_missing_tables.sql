-- Enable realtime publication for tables missing subscriptions
-- Required for Supabase postgres_changes events to fire on these tables

ALTER PUBLICATION supabase_realtime ADD TABLE
  abc_catalogue,
  production_capacity,
  overhaul_history;
