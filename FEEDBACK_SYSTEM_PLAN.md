# Feedback & Bug Reporting System — Expansion Plan

## Overview

Expand the existing bug reporting system into a comprehensive **Feedback & Bug Reporting** system that allows users to submit:
1. **Bug Reports** — Technical issues, errors, broken functionality
2. **Usability Feedback** — UX improvements, workflow suggestions, general feedback
3. **Feature Suggestions** — New features, enhancements, capability requests

Both types are stored in separate database tables but managed through the same interface.

---

## Current State

### Existing Bug Reports System
- **Table:** `bug_reports`
- **Schema:** id, user_id, raised_by, date_raised, page, description, status, response, responded_by, responded_at
- **Features:** Real-time subscriptions, inline editing, status tracking (open/closed)
- **UI:** Add bug form + View/Manage table

### Limitations
- Only supports bug reports
- No categorization for feedback vs bugs
- No way to track feature requests separately
- Cannot filter by submission type

---

## Proposed Architecture

### Database Schema

#### 1. Keep Existing `bug_reports` Table (Backward Compatible)
```sql
-- Existing table remains unchanged for historical bug reports
-- All existing bug reports stay here
```

#### 2. Create New `user_feedback` Table
```sql
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  submitted_by TEXT NOT NULL,
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_area TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('usability', 'feature_request', 'improvement')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'planned', 'in_progress', 'completed', 'declined')),
  response TEXT,
  responded_by TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read feedback"
ON user_feedback FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to submit feedback"
ON user_feedback FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Allow authenticated users to update feedback"
ON user_feedback FOR UPDATE USING (auth.role() = 'authenticated');
```

### Data Flow

```
User submits → Type selection → Appropriate table → Real-time sync → Admin action → Response visible to all
```

---

## UI/UX Design

### 1. Portal Rename & Navigation
- **Current:** "🪳 Bug Reports"
- **New:** "💬 Feedback & Bugs"

### 2. Submission Flow

#### Tab 1: "Submit" (replaces "Add Bug")
```
┌─────────────────────────────────────────────────────┐
│  Submit Feedback or Bug Report                      │
│  Help us improve by sharing your experience         │
├─────────────────────────────────────────────────────┤
│  Submission Type:  [● Bug Report] [○ Feedback]      │
│                                                     │
│  Raised By:       [user@tidyco.co.uk] (readonly)   │
│  Date:            [14/03/2026] (readonly)          │
│  Page / Area:     [e.g. PFMEA, Capacity Planning]  │
│                                                     │
│  ┌─ If Bug Report ──────────────────────────────┐  │
│  │ Title:         [Brief description of the bug] │  │
│  │ Severity:      [○ Low ● Medium ○ High]       │  │
│  │ Description:   [What happened?                │  │
│  │                What did you expect?]          │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ If Feedback ─────────────────────────────────┐  │
│  │ Feedback Type: [Usability ▼]                  │  │
│  │                (Usability / Feature Request /  │  │
│  │                 Improvement)                   │  │
│  │ Title:         [Brief summary]                │  │
│  │ Priority:      [○ Low ● Medium ○ High]       │  │
│  │ Description:   [Describe your suggestion...]  │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [Submit]  [Clear]                                  │
│  ✓ Submitted successfully! (feedback message)       │
└─────────────────────────────────────────────────────┘
```

#### Tab 2: "Browse All" (replaces "View & Update")
```
┌─────────────────────────────────────────────────────────────────────┐
│  Filters:  [All Types ▼] [All Status ▼] [Search...]                 │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ # | Type | Title | Submitted | Page | Status | Response | Action│ │
│  ├───┼──────┼───────┼───────────┼──────┼────────┼──────────┼───────│ │
│  │ 1 | 🐛   | Login | 14 Mar    | Auth | OPEN   | —        | Edit  │ │
│  │   | Bug  | fails |           |      |        |          |       │ │
│  ├───┼──────┼───────┼───────────┼──────┼────────┼──────────┼───────│ │
│  │ 2 | 💡   | Add   | 13 Mar    | ME   | OPEN   | —        | Edit  │ │
│  │   | Feed | bulk  |           | Cap. |        |          |       │ │
│  │   |      | edit  |           |      |        |          |       │ │
│  └───┴──────┴───────┴───────────┴──────┴────────┴──────────┴───────┘ │
└─────────────────────────────────────────────────────────────────────┘

Stats Bar: 📊 23 total · 8 bugs (3 open) · 15 feedback (10 open)
```

### 3. Visual Differentiation

| Type | Icon | Badge Color | Row Background |
|------|------|-------------|----------------|
| Bug Report | 🐛 | Red (open) / Grey (closed) | White |
| Usability Feedback | 💡 | Blue (open) / Grey (closed) | Very light blue tint |
| Feature Request | ✨ | Purple (open) / Grey (closed) | Very light purple tint |
| Improvement | 🔧 | Green (open) / Grey (closed) | Very light green tint |

### 4. Status Workflow

**Bug Reports:**
- OPEN → SQUASHED (closed) → Re-open

**Feedback:**
- OPEN → IN_REVIEW → PLANNED → IN_PROGRESS → COMPLETED
- OPEN → DECLINED (with reason)

---

## File Structure

```
portals/feedback/
├── js/
│   ├── feedback-data.js       # New: user_feedback table operations
│   ├── feedback.js            # New: UI renderer
│   └── feedback-constants.js  # New: types, statuses, icons
portals/bugs/
├── js/
│   ├── bugs-data.js           # Existing: bug_reports operations (keep)
│   └── bugs.js                # Existing: UI renderer (keep, minor updates)
core/js/
├── navigation.js              # Update: route to unified feedback portal
index.html
├── Add new script tags for feedback modules
```

---

## Implementation Steps

### Phase 1: Database Setup (Supabase)
- [ ] Create `user_feedback` table with schema above
- [ ] Add RLS policies
- [ ] Test CRUD operations in Supabase SQL editor

### Phase 2: Data Layer (`feedback-data.js`)
- [ ] Create `feedbackDataManager` object (mirrors `bugDataManager` pattern)
- [ ] Implement: `init()`, `subscribe()`, `unsubscribe()`
- [ ] Implement: `addFeedback()`, `updateFeedback()`, `respond()`, `setStatus()`
- [ ] Add real-time subscription for `user_feedback` table

### Phase 3: UI Renderer (`feedback.js`)
- [ ] Create `renderFeedback()` main function
- [ ] Build submission form with type selector
- [ ] Build browse table with filters
- [ ] Add inline editing for responses
- [ ] Create status badges with appropriate icons/colors

### Phase 4: Integration
- [ ] Update `navigation.js` to route `#s=feedback` to new unified portal
- [ ] Update `index.html` with new script/CSS tags
- [ ] Update hub portal navigation card (rename "Bug Reports" → "Feedback & Bugs")
- [ ] Keep existing bug reports accessible (merge into browse view or separate tab)

### Phase 5: Migration & Backward Compatibility
- [ ] Option A: Keep bug_reports separate, show both in unified browse view
- [ ] Option B: Migrate existing bug_reports to user_feedback with type='bug'
- [ ] Update any references to "bug reports" in other parts of the app

### Phase 6: Testing
- [ ] Test submission flow for both types
- [ ] Test real-time sync across multiple users
- [ ] Test status updates and responses
- [ ] Test mobile responsiveness
- [ ] Test filter functionality
- [ ] Run existing test suite to ensure no regressions

---

## Code Patterns to Follow

### Data Manager Pattern (from bugs-data.js)
```javascript
window.feedbackDataManager = {
  state: {
    feedback: [],
    tab: 'submit',
    editingId: null,
    filter: { type: 'all', status: 'all' }
  },

  async init() {
    // Load from Supabase
    // Subscribe to realtime changes
  },

  async addFeedback(type, title, description, page, priority) {
    // Insert into user_feedback table
  },

  async respond(id, response, status, adminNotes) {
    // Update with response and status
  }
};
```

### UI Component Pattern (from bugs.js)
```javascript
window.feedbackApp = {
  switchTab(tab) {
    feedbackDataManager.setTab(tab);
  },

  setFilter(key, value) {
    feedbackDataManager.setFilter(key, value);
  },

  async submitInline() {
    // Get form values
    // Validate
    // Call dataManager.addFeedback()
    // Show success/error feedback
  },

  async saveResponse(id, idx) {
    // Get response text and status
    // Call dataManager.respond()
  }
};
```

---

## Responsive Design Considerations

- **Mobile (< 768px):**
  - Stack form fields vertically
  - Hide non-essential table columns (show "Details" expand button)
  - Filters become dropdown accordions
  - Touch-friendly action buttons (min 44px height)

- **Tablet (768px - 1024px):**
  - 2-column form layout
  - Show all table columns with horizontal scroll if needed

- **Desktop (> 1024px):**
  - Full layout as designed above

---

## Future Enhancements (Out of Scope for MVP)

- [ ] Voting system for feature requests (users upvote suggestions)
- [ ] Anonymous feedback option
- [ ] Email notifications when feedback status changes
- [ ] Dashboard analytics (feedback trends, common issues)
- [ ] Export feedback to CSV/PDF
- [ ] Integration with project management tools (e.g., create NPI task from feature request)
- [ ] Attachment upload (screenshots for bugs)

---

## Success Metrics

- Users can submit both bugs and feedback in < 2 minutes
- All submissions receive a response within 5 business days (trackable via responded_at)
- Filter system reduces time to find specific submissions by 50%
- No data loss during migration from old bug system

---

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| RLS policies block legitimate access | Test thoroughly with multiple users before deployment |
| Real-time sync causes performance issues | Implement pagination if > 1000 records |
| Users confused by two submission types | Clear UI labels, icons, and placeholder text |
| Existing bug reports become orphaned | Keep bug_reports table readable, show in unified browse view |

---

## Estimated Effort

- **Database Setup:** 30 minutes
- **Data Layer:** 2-3 hours
- **UI Renderer:** 4-6 hours
- **Integration:** 1-2 hours
- **Testing:** 2 hours
- **Total:** ~10-14 hours

---

## Approval

To proceed with implementation, confirm:
- [ ] Database schema is approved
- [ ] UI design matches user expectations
- [ ] Backward compatibility approach (Option A or B)
- [ ] Priority level (MVP vs full feature set)
