# Capacity Sync Architecture Audit (2026-03-29)

## Current State
- **ME**: 8-file modular pattern (state + persistence + realtime separate)
- **PM, LOG, UNIT6**: 3-file monolithic pattern (state + sync + realtime in 1000-line files)
- Result: 3x code duplication, every fix requires 3 edits

## Known Issues from Buglog
1. **Realtime cursor ejection**: ME fixed by guarding filter focus; PM/LOG/UNIT6 may still have this
2. **NPI duplicate projects**: DB auto-create collided with paged loading; fixed with unique index + safe nav
3. **Realtime dropped during save**: `pmDataSaveInProgress` blocks all events for 5-10+ seconds

## Key Fragilities Identified

### Deduplication (Lazy, Not Persistent)
- `capNormalizeAndDedupeSupportHistory()` called at query time AND save time
- State can contain duplicates between operations
- Risk: Two users merge edits → duplicates leak to DB

### Holiday Sync (Naive Delete/Insert)
- Delete ALL user holidays, then insert all
- No atomicity: if insert fails, user loses holidays
- No upsert logic, collision risk with concurrent users

### Realtime vs. Save Race Condition
- `pmDataSaveInProgress` blocks 100% of realtime events for 5-10+ seconds
- Other user's edits during that window are silently dropped (not queued, not retried)
- UX: "Why didn't my colleague's edit come through?"

### Multi-Table Save (No Transactions)
- Products → SupportHistory → Teams → Tasks (sequential, independent)
- If step 2 fails, steps 3-4 still run → inconsistent DB
- Risk: Orphaned tasks, missing support data

### Render Scheduler Guard (Inconsistent)
- ME uses `requestRender(..., { isFiltering: true })` to protect search inputs
- PM/LOG/UNIT6 don't pass `isFiltering`, don't call `flushDeferred()` on blur
- Risk: PM/LOG/UNIT6 have same cursor-ejection bug ME had

## Scaling Concern
- No virtual scrolling / pagination
- All rows rendered into DOM on every change
- For 1000+ rows: initial slow, realtime kills browser

## Recommendation
Build `createCapacitySync()` — single reusable module for ME/PM/LOG/UNIT6:
- One dedup path (persistent, not lazy)
- One holiday upsert (atomic)
- One realtime guard (protects everywhere)
- One delete queue (guaranteed cleanup)
- Scales to thousands of rows (virtual rendering layer)

Migrate LOG first (simplest), then PM/UNIT6, then optionally ME.
