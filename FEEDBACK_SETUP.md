# Feedback & Bug Reporting System — Setup Guide

## ✅ Implementation Complete

All code has been created and integrated. Follow the steps below to activate the system.

---

## Step 1: Create Database Table in Supabase

1. **Open your Supabase project** at https://supabase.com
2. **Go to SQL Editor** (left sidebar)
3. **Copy and paste** the contents of `supabase/user_feedback_table.sql` into the editor
4. **Click "Run"** to execute the SQL

The SQL will create:
- `user_feedback` table with all required columns
- Indexes for fast queries
- RLS (Row Level Security) policies
- Permissions for authenticated users

### Verify Table Creation

After running the SQL, you should see:
- ✅ Table `user_feedback` appears in Table Editor
- ✅ Indexes: `idx_user_feedback_status`, `idx_user_feedback_type`, `idx_user_feedback_date`
- ✅ RLS enabled with 3 policies

---

## Step 2: Test the System

### Option A: Quick Test with Sample Data

Run this in Supabase SQL Editor to add a test record:

```sql
INSERT INTO user_feedback (user_id, submitted_by, feedback_type, title, description, priority)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'test@tidyco.co.uk',
  'usability',
  'Test Feedback Submission',
  'This is a test feedback entry to verify the system works.',
  'medium'
);
```

### Option B: Test Through the UI

1. **Open the application** in your browser
2. **Click "💬 Feedback & Bugs"** in the top bar (or navigate to Operations → Rapid Actions → Open Feedback & Bugs)
3. **Submit tab**:
   - Select a feedback type (Bug Report, Usability, Feature Request, Improvement)
   - Enter a page/area
   - Enter a title and description
   - Select priority
   - Click Submit
4. **Browse All tab**:
   - Verify your submission appears
   - Test filters (Type, Status, Search)
   - Click "Edit" to add a response
   - Change status and save

---

## Step 3: Migration from Old Bug Reports (Optional)

If you want to migrate existing bug reports to the new system:

### Option A: Keep Both Systems Separate
- **Old bug reports** remain in `bug_reports` table
- **New feedback** goes to `user_feedback` table
- Users can access old bugs via direct database queries if needed

### Option B: Migrate Bug Reports to New System

Run this SQL to copy existing bug reports into the new table:

```sql
INSERT INTO user_feedback (
  id, user_id, submitted_by, date_submitted, page_area, 
  feedback_type, title, description, priority, status,
  response, responded_by, responded_at, created_at
)
SELECT 
  id, user_id, raised_by, date_raised, page,
  'bug' as feedback_type, 
  COALESCE(LEFT(description, 50), 'Bug Report') as title,
  description, 'medium' as priority, status,
  response, responded_by, responded_at, created_at
FROM bug_reports;
```

⚠️ **Warning**: This creates duplicates if you already have test data. Run on a clean system or backup first.

---

## Features Overview

### Submission Types
| Type | Icon | Use Case |
|------|------|----------|
| 🐛 Bug Report | Red | Technical issues, errors, broken features |
| 💡 Usability Feedback | Blue | UX improvements, workflow suggestions |
| ✨ Feature Request | Purple | New capabilities, missing features |
| 🔧 Improvement | Green | Enhancements to existing features |

### Status Workflow
| Status | Meaning | Can Re-open |
|--------|---------|-------------|
| OPEN | New submission, needs review | N/A |
| IN_REVIEW | Being evaluated | Yes |
| PLANNED | Approved, will be implemented | Yes |
| IN_PROGRESS | Currently being worked on | Yes |
| COMPLETED | Finished and deployed | Yes |
| DECLINED | Not accepted (with reason) | Yes |
| SQUASHED | Bug fixed | Yes |

### Filters
- **Type Filter**: Show only specific feedback types
- **Status Filter**: Filter by workflow status
- **Search**: Full-text search across title, description, page area, and submitter

---

## Files Created

```
portals/feedback/
├── js/
│   ├── feedback-constants.js    # Types, statuses, icons, colors
│   ├── feedback-data.js         # Supabase operations, real-time sync
│   └── feedback.js              # UI renderer, form handling
└── css/
    └── feedback.css             # Styles for all feedback components

supabase/
└── user_feedback_table.sql     # Database schema and RLS policies
```

## Files Modified

```
index.html                                      # Added CSS and script tags
utils/js/navigation.js                          # Added feedback routing
portals/operations/js/operations-dashboard-render-core.js  # Updated button
```

---

## Troubleshooting

### "Could not load user feedback" error
- **Cause**: Table not created or RLS policies missing
- **Fix**: Re-run the SQL from Step 1

### No data appearing in Browse view
- **Cause 1**: Products/families not loaded (for type lookup)
- **Cause 2**: Filters are too restrictive
- **Fix**: Check browser console for errors, reset filters to "All"

### Real-time updates not working
- **Cause**: Subscription not initialized
- **Fix**: Refresh the page, check that `createRealtimeSubscription` is available

### Styles look broken
- **Cause**: CSS file not loaded
- **Fix**: Check browser DevTools Network tab for `feedback.css` 404 errors

---

## Next Steps

1. ✅ Run database SQL in Supabase
2. ✅ Test submission through UI
3. ✅ Test browsing and filtering
4. ✅ Test editing and responding
5. ✅ Share with team for feedback

---

## Future Enhancements (Not Implemented)

- [ ] Email notifications on status change
- [ ] Attachment upload (screenshots)
- [ ] Voting system for feature requests
- [ ] Anonymous feedback option
- [ ] Dashboard analytics (trends, common issues)
- [ ] Export to CSV/PDF
- [ ] Integration with project management (create NPI task from feedback)

---

**Questions?** Check `FEEDBACK_SYSTEM_PLAN.md` for the full design document.
