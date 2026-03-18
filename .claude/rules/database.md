# Database & Supabase Patterns

## Backend Stack
- **Database**: PostgreSQL (via Supabase v2)
- **Auth**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Client Library**: Supabase JS Client (CDN loaded)

## Data Persistence
Data operations live in `core/js/db.js`. All Supabase interactions should go through this module.

## Query Pattern
Use the standard Supabase query pattern:

```javascript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value);

if (error) {
  console.error('DB error:', error);
  return null;
}
return data;
```

## Capacity Parity
**Manufacturing Engineering (ME) Capacity changes must be mirrored in PM Capacity** unless explicitly excluded.

When updating capacity data, ensure both portals (`portals/capacity/`) stay in sync.

## Table RLS Policies
All tables need authentication RLS:

```sql
CREATE POLICY "auth" ON table_name
FOR ALL
USING (auth.role() = 'authenticated');
```

This ensures:
- Only authenticated users can access the table
- All authenticated users see all data (no row filtering by user)

## Batch Operations
For bulk inserts/updates, use:

```javascript
const { data, error } = await supabase
  .from('table_name')
  .upsert(records);
```

Handle errors gracefully — log and inform the user.

## Connection State
- Check authentication status before making DB queries
- Handle network timeouts gracefully
- Don't assume data is fresh — refresh on demand

## Performance Tips
- Use `.select('column1, column2')` instead of `.select('*')` to reduce payload
- Paginate large result sets with `.range(0, 50)`
- Use real-time subscriptions for live updates (with cleanup)
