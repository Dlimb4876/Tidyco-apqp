# Family PFMEA Templates — User Guide

## 📋 Overview

The **Family PFMEA Template System** allows you to create reusable PFMEA (Process Failure Mode & Effects Analysis) templates at the product family level. When starting a new NPI project, you can instantly apply a family template to auto-populate the PFMEA with standard failure modes, causes, and controls.

**Benefits:**
- ✅ **Speed** — Create PFMEAs in minutes instead of hours
- ✅ **Consistency** — All HVAC products follow the same PFMEA structure
- ✅ **Knowledge Retention** — Lessons learned from previous projects embedded in templates
- ✅ **Quality** — Ensures no common failure modes are missed
- ✅ **Flexibility** — Templates are starting points, fully customizable per project

---

## 🗂️ Database Structure

### `family_pfmea_templates` Table

Stores individual PFMEA failure mode items per family template.

```
id               UUID          (Primary key)
user_id          UUID          (Your user, enforced by RLS)
family_id        UUID          (Product family, FK to families table)
template_name    TEXT          (e.g., "Standard HVAC PFMEA")
failure_mode     TEXT          (e.g., "Compressor fails to start")
effect           TEXT          (e.g., "Unit produces no cooling")
severity         INT 1-10      (Default: 3)
cause            TEXT          (e.g., "Electrical short in starter")
occurrence       INT 1-10      (Default: 3)
prevention_control TEXT        (Preventive action or control)
detection_control  TEXT        (How failure is detected)
detection        INT 1-10      (Default: 3)
notes            TEXT          (Additional context)
created_at       TIMESTAMP     (Auto)
updated_at       TIMESTAMP     (Auto)
```

---

## 🛠️ How To Use

### Step 1: Create a Family Template

1. Navigate to **Product Development → Product Family Database**
2. Click on a family card (e.g., "HVAC")
3. Click the **📋 Templates** button (top-right of card)
4. Click **➕ Create Template**
5. Enter template name: `"Standard HVAC PFMEA"` (or similar)
6. Start adding failure modes:
   - **Failure Mode** — What breaks? (e.g., "Compressor failure")
   - **Effect** — What happens to the product? (e.g., "No cooling output")
   - **Severity** — How bad is it? (1-10 scale)
   - **Cause** — Why does it fail? (e.g., "Overload on startup")
   - **Occurrence** — How likely is it? (1-10 scale)
   - **Prevention Control** — How do you prevent it? (e.g., "Add thermal overload protection")
   - **Detection Control** — How do you find it? (e.g., "Measure temperature output")
   - **Detection** — How easy to detect? (1-10 scale)
7. Click **Add Item** to add more failure modes
8. Click **Save Template**

### Step 2: Build Templates from Existing Projects

You can copy PFMEA data from a completed project into a family template:

1. Open completed NPI project (e.g., "Class 158 Motor")
2. Review the PFMEA (Step 03)
3. Click **Create Family Template** (coming soon)
4. Select which failure modes to include
5. Save as template for reuse in similar projects

### Step 3: Apply Template to New Project

1. Click **➕ New Project**
2. Fill in project details (name, customer, unit, etc.)
3. Select **Product Family** (e.g., "HVAC")
4. When creating the project:
   - Prompt: **"Apply PFMEA template?"**
   - Select **"Standard HVAC PFMEA"** template
   - Click **Apply**
5. PFMEA automatically populates with 15-20 standard failure modes
6. Customize for your specific product:
   - Delete irrelevant failure modes
   - Add product-specific items
   - Adjust RPN numbers based on design
   - Update controls based on your approach

---

## 📊 Template Statistics

When viewing a family, you see:
- **📋 X PFMEA template(s)** — Number of templates created for this family
- **Template Summary:**
  - Item count (# of failure modes)
  - Average RPN (Risk Priority Number)
  - Last updated date

---

## 🔄 Managing Templates

### View Template Items
1. Click **📋 Templates** on family card
2. Click **📖 View** on any template
3. See all failure modes and details
4. Edit individual items
5. Delete items

### Copy Template to Another Family
1. Open source family's templates
2. Select template to copy
3. Click **Copy to Family...**
4. Choose target family
5. Name the copy (e.g., "HVAC-Modified")

### Delete Template
1. Click **📋 Templates** on family card
2. Find template to delete
3. Click **Delete**
4. Confirm deletion (cannot be undone)

---

## 💡 Best Practices

### Template Naming
- Use descriptive names: `"Standard HVAC PFMEA"` not `"Template 1"`
- Include version if versioning: `"HVAC PFMEA v2.1"`
- Consider scope: `"Centrifugal Pump - Base Model"` for specific products

### Severity/Occurrence/Detection Ratings

Use consistent scales:
- **1-2** — Very unlikely / Difficult to detect
- **3-4** — Unlikely / Possible but difficult
- **5-6** — Moderate / Moderate difficulty
- **7-8** — Likely / Easy to detect
- **9-10** — Very likely / Always detected

### Template Content
- **Include** standard failure modes from family history
- **Include** design risks common to product type
- **Exclude** one-off issues specific to single products
- **Keep average RPN 60-80** for typical risk profile

### Maintenance
- Review templates annually
- Update with lessons learned from recent projects
- Delete obsolete items if product design changes
- Version important templates (e.g., v1.0, v2.0)

---

## 🎯 Integration with NPI Projects

### On Project Creation
```
1. Select Product Family → "HVAC"
2. Prompt: "Apply PFMEA template?"
3. Choose: "Standard HVAC PFMEA"
4. Auto-populate with 18 failure modes
5. Start with 80% of PFMEA complete
```

### Post-Application
- All template items appear in **Step 03 — Process Design & Dev**
- Grouped under "Template Items" section
- Can be edited, deleted, or supplemented
- Project-specific changes don't affect template

### Locking & Versioning (future)
- Templates can be "locked" to preserve history
- Projects track which template version was used
- Allows "PFMEA Template v2.1 applied" audit trail

---

## 📈 Metrics & Reporting

Track template usage:
- How many projects use each template?
- Average time to complete PFMEA with template
- RPN distribution (how many items are high-risk?)
- Template coverage by family

---

## ⚙️ Technical Details

### Data Layer Functions

**Get templates:**
```javascript
familyTemplatesGetByFamily(familyId)           // All templates for family
familyTemplatesGetGroupedByFamily(familyId)    // Grouped by template name
familyTemplatesGetStats(familyId)              // Stats: count, avg RPN, etc.
```

**Manage templates:**
```javascript
familyTemplatesAddItem(...)          // Add failure mode to template
familyTemplatesUpdateItem(...)        // Edit item
familyTemplatesDeleteItem(...)        // Delete single item
familyTemplatesDeleteFamily(...)      // Delete entire template
```

**Apply to project:**
```javascript
familyTemplatesApplyToProject(familyId, templateName)
// Returns array of PFMEA objects ready to add to prog.pfmea
```

### RLS & Security
- Templates are scoped to user_id (RLS enforced)
- Users can only access their own templates
- Family relationship prevents orphaned templates

---

## 🚀 Future Enhancements

- [ ] Template versioning & history
- [ ] "Copy from existing project" wizard
- [ ] Template sharing between users
- [ ] RPN trend analysis (are risks trending up/down?)
- [ ] Template health dashboard
- [ ] Auto-suggest related templates when selecting family
- [ ] Batch template import/export (CSV)

---

## 📞 Troubleshooting

**Q: Template not appearing in new project?**
A: Make sure you selected the same product family. Templates are family-specific.

**Q: Can I use a template from Family X on Family Y?**
A: Copy it! Use the "Copy to Family" function to duplicate and customize.

**Q: I accidentally deleted a template. Can I recover it?**
A: No — deletions are permanent. Restore from backup or recreate from notes.

**Q: Can I edit a template after applying it to a project?**
A: Yes! Editing the template doesn't affect projects — changes are independent.

---

## 📚 Related Topics

- **Product Families** — Create and manage product families
- **NPI Projects** — New Product Introduction workflow
- **PFMEA** — Process Failure Mode & Effects Analysis (Step 03)
- **Action Tracker** — Track PFMEA-driven actions
