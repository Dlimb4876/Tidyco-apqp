# Family PFMEA Templates — System Architecture

## 📐 Overview

The Family PFMEA Template System is a lightweight, modular system for managing reusable PFMEA templates at the product family level.

```
┌─────────────────────────────────────────────────────────┐
│                  PRODUCT FAMILY DATABASE                │
│  (UI for viewing/managing families and their templates) │
└─────────┬───────────────────────────────────────────────┘
          │
          ├─→ family-templates-data.js (Data layer)
          ├─→ families-data.js (Family management)
          └─→ product-development.js (UI rendering)
                  │
                  └─→ family-templates-data.js
                      ├→ Load templates from Supabase
                      ├→ CRUD operations (add/update/delete)
                      ├→ Apply template to project
                      └→ Get statistics
```

---

## 🗄️ Database Schema

### `families` Table
```sql
CREATE TABLE families (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,              -- Unique ID (e.g., "HVAC")
  label TEXT NOT NULL,             -- Display name (e.g., "HVAC Systems")
  icon TEXT DEFAULT '📋',          -- Emoji
  description TEXT,                -- Purpose of family
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, name)            -- One family per user
);
```

### `family_pfmea_templates` Table
```sql
CREATE TABLE family_pfmea_templates (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES families(id),
  template_name TEXT NOT NULL,     -- e.g., "Standard HVAC PFMEA"

  -- PFMEA Data (single failure mode)
  failure_mode TEXT NOT NULL,
  effect TEXT,
  severity INT DEFAULT 3,          -- 1-10 scale
  cause TEXT,
  occurrence INT DEFAULT 3,        -- 1-10 scale
  prevention_control TEXT,
  detection_control TEXT,
  detection INT DEFAULT 3,         -- 1-10 scale
  notes TEXT,

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, family_id, template_name, failure_mode)
);
```

---

## 📂 File Structure

### Data Layer
```
portals/product-development/js/
├── families-data.js              (✅ Family CRUD)
│   ├─ familiesDataInit()         — Load families from DB
│   ├─ familiesDataAddFamily()    — Create family
│   ├─ familiesDataUpdateFamily() — Edit family
│   └─ familiesDataDeleteFamily() — Delete family
│
└── family-templates-data.js      (✅ Template CRUD)
    ├─ familyTemplatesDataInit()          — Load all templates
    ├─ familyTemplatesGetByFamily()       — Get templates for family
    ├─ familyTemplatesGetGroupedByFamily() — Group by template name
    ├─ familyTemplatesAddItem()           — Add failure mode
    ├─ familyTemplatesUpdateItem()        — Edit failure mode
    ├─ familyTemplatesDeleteItem()        — Delete failure mode
    ├─ familyTemplatesDeleteFamily()      — Delete entire template
    ├─ familyTemplatesCopyTemplate()      — Copy to another family
    ├─ familyTemplatesApplyToProject()    — Apply to project PFMEA
    └─ familyTemplatesGetStats()          — Count, avg RPN, etc.
```

### UI Layer
```
portals/product-development/js/
├── product-development.js
│   ├─ renderProductFamilyDatabase()    — Family database view
│   ├─ renderFamilyModal()              — Edit family modal
│   ├─ renderTemplateManager()          — Template management modal
│   │
│   ├─ State:
│   │  ├─ familyModalState {isOpen, familyId}
│   │  └─ templateManagerState {isOpen, familyId}
│   │
│   └─ Functions:
│      ├─ showFamilyModal(familyId)
│      ├─ showTemplateManager(familyId)
│      └─ deleteTemplate(familyId, templateName)
│
└── utils/navigation.js
    └─ Renders modals in product-development section
```

### Integration Points
```
core/js/
├── app.js
│   └─ launchApp()
│      ├─ await familiesDataInit()
│      └─ await familyTemplatesDataInit()

index.html
├── <script src="families-data.js">
└── <script src="family-templates-data.js">
```

---

## 🔄 Data Flow

### Load on App Launch
```
1. User logs in → currentUser set
2. launchApp() called
3. familiesDataInit()
   └─→ Load families from Supabase
       └─→ familiesState.families = [...]
4. familyTemplatesDataInit()
   └─→ Load templates from Supabase
       └─→ familyTemplatesState.templates = [...]
5. populateFamilySelects()
   └─→ Populate NPI project selects with dynamic families
6. render() to display hub
```

### Create New Family
```
1. User: "Show Family Manager" → showFamilyModal()
2. UI: "Add Family" modal appears
3. User: Enters name, label, icon, description
4. saveFamilyModal()
   └─→ familiesDataAddFamily()
       └─→ INSERT into families table
       └─→ familiesState.families.push(newFamily)
       └─→ render() to update UI
```

### View Templates for Family
```
1. User: Clicks "📋" on family card
2. showTemplateManager(familyId) sets state
3. render() → renderTemplateManager()
   └─→ familyTemplatesGetGroupedByFamily(familyId)
   └─→ Generate grouped view of templates
   └─→ Show template names, item counts, avg RPNs
4. User: Clicks "View" or "Delete" on template
```

### Apply Template to Project
```
(Future implementation)
1. User: Creates new NPI project with family "HVAC"
2. System: Prompts "Apply PFMEA template?"
3. User: Selects "Standard HVAC PFMEA"
4. familyTemplatesApplyToProject(familyId, templateName)
   └─→ Get all templates matching family + name
   └─→ Return PFMEA array: [{mode, effect, sev, cause, ...}, ...]
5. Project PFMEA pre-populated with template items
6. User: Can edit, delete, or add more items
```

---

## 🔐 Security (RLS)

### Row-Level Security Policies

**families table:**
```sql
CREATE POLICY "Users can access their own families"
  ON families FOR ALL
  USING (auth.uid() = user_id);
```

**family_pfmea_templates table:**
```sql
CREATE POLICY "Users can access their own templates"
  ON family_pfmea_templates FOR ALL
  USING (auth.uid() = user_id);
```

### Result
- ✅ Each user sees only their own families and templates
- ✅ No cross-user data leakage
- ✅ Database enforces security (not reliant on UI logic)

---

## 🎯 State Management

### Global State Objects

**familiesState** (in families-data.js)
```javascript
{
  families: [],      // Array of family objects
  loading: false,    // Load in progress?
  error: null        // Last error message
}
```

**familyTemplatesState** (in family-templates-data.js)
```javascript
{
  templates: [],     // Array of template items
  loading: false,    // Load in progress?
  error: null        // Last error message
}
```

**UI State** (in product-development.js)
```javascript
familyModalState = {
  isOpen: false,     // Edit family modal open?
  familyId: null     // Which family being edited?
}

templateManagerState = {
  isOpen: false,     // Template manager open?
  familyId: null     // Which family's templates?
}
```

### State Updates
```
Database Change
    ↓
Data Layer Function (e.g., familiesDataAddFamily)
    ↓
Supabase INSERT/UPDATE/DELETE
    ↓
Update familiesState.families (local state)
    ↓
render()
    ↓
UI updates
```

---

## 📊 Query Performance

### Indexes Created
```sql
CREATE INDEX idx_families_user_id
  ON families(user_id);

CREATE INDEX idx_family_templates_user_id
  ON family_pfmea_templates(user_id);

CREATE INDEX idx_family_templates_family_id
  ON family_pfmea_templates(family_id);

CREATE INDEX idx_family_templates_lookup
  ON family_pfmea_templates(user_id, family_id, template_name);
```

### Typical Queries
```javascript
// Load all families (1 query)
await supa.from('families').select('*')

// Load all templates (1 query)
await supa.from('family_pfmea_templates').select('*')

// Get templates for a family (filtered in-memory)
templates.filter(t => t.family_id === familyId)

// Get grouped templates (JavaScript grouping)
// No additional DB queries needed
```

---

## 🛠️ Extensibility Points

### Future Enhancements

**Template Versioning**
```sql
ALTER TABLE family_pfmea_templates
ADD COLUMN version INT DEFAULT 1,
ADD COLUMN is_draft BOOLEAN DEFAULT false;
```

**Template Sharing**
```sql
CREATE TABLE family_template_shares (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES family_pfmea_templates,
  shared_with_user_id UUID,
  permission ENUM('view', 'edit')
);
```

**Project Template Application Audit**
```sql
CREATE TABLE project_template_applications (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES programmes,
  family_id UUID,
  template_name TEXT,
  applied_at TIMESTAMP
);
```

---

## 🚀 Performance Characteristics

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Load all families | O(1) | Single query, typically <10 families |
| Load all templates | O(1) | Single query, typically <200 items |
| Get templates for family | O(n) | In-memory filter |
| Group templates | O(n) | In-memory grouping |
| Apply template | O(n) | Generate PFMEA array from template items |
| Create family | O(1) | Single INSERT |
| Add template item | O(1) | Single INSERT |
| Delete template | O(n) | Multiple DELETE (one per item) |

**Optimization Notes:**
- All data loaded once on app launch
- No subsequent DB queries during normal operation
- UI updates via in-memory state changes
- Batch operations (e.g., delete template) use `IN` clause

---

## 📋 Validation Rules

### Family
- `name` — Required, unique per user, no spaces
- `label` — Required, max 50 chars
- `icon` — Optional, single character (emoji)
- `description` — Optional, max 200 chars

### Template Item
- `family_id` — Required, must exist
- `template_name` — Required, groups items together
- `failure_mode` — Required, max 200 chars
- `severity` — 1-10 scale
- `occurrence` — 1-10 scale
- `detection` — 1-10 scale
- All others — Optional

---

## 🧪 Testing Checklist

- [ ] Load families on app startup
- [ ] Create new family (UI + DB)
- [ ] Edit family (UI + DB)
- [ ] Delete family (UI + DB)
- [ ] View templates for family
- [ ] Add template item
- [ ] Delete template item
- [ ] Delete entire template
- [ ] Copy template to another family
- [ ] Apply template (generates correct PFMEA array)
- [ ] User isolation (can't see other users' data)
- [ ] RLS enforced at database level
- [ ] Modal opens/closes properly
- [ ] State updates trigger re-render

---

## 📞 Support & Troubleshooting

**Module doesn't load?**
- Check `index.html` for script tags
- Verify `families-data.js` loaded before `family-templates-data.js`
- Check browser console for errors

**Templates not showing?**
- Confirm `familyTemplatesDataInit()` was called
- Verify templates exist in database (check Supabase console)
- Check user_id matches current user

**RLS errors?**
- Ensure user is logged in (`currentUser.id` set)
- Check Supabase policies (should allow authenticated users)
- Verify `user_id` column in table matches auth.uid()

---

## 📚 Related Documents

- **User Guide:** `FAMILY_TEMPLATES_GUIDE.md`
- **Project Memory:** `MEMORY.md` (Product Families section)
- **Database:** Supabase project, `eihxvmzsfnpdaizggsvs`
