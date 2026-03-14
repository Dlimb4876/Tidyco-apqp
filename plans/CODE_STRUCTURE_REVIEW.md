# Code Structure Review — Unused, Redundant & Orphaned Code

**Repository:** Tidyco-apqp  
**Review Date:** March 2026  
**Reviewer:** Automated analysis of repository vs `index.html` load order  

---

## Summary

This review identifies files, folders, and code patterns that are unused, redundant, or inconsistent with the live application. Issues are grouped by severity so the most impactful cleanups can be done first.

---

## 🔴 Critical — Files That Exist But Are Never Loaded

These files are in the repository but are **not referenced in `index.html`** and are therefore **dead code** — they have no effect on the running application at all.

### 1. `portals/productmgmt/` — Entire Portal Folder (2 files)

| File | Issue |
|------|-------|
| `portals/productmgmt/js/productmgmt.js` | Not loaded in `index.html` |
| `portals/productmgmt/css/productmgmt.css` | Not loaded in `index.html` |

**What it is:** An older, standalone Product Management portal for managing product families (add/edit/delete). It uses the old `db.js` state management approach (`getFamilies()`, `save()`) rather than the newer `families-data.js` relational approach.

**Why it's dead:** The functionality it provided (managing product families) has been superseded by the **Families tab** in `portals/product-development/product-management/`, which uses the newer relational database approach via `families-data.js`.

The `renderProductMgmt()` function defined in this portal is **never called from `navigation.js` or any other file**. No `<script>` or `<link>` tag loads these files.

**Related inconsistencies:**
- `utils/js/navigation.js` line 28 still has `productmgmt: '← Back to Product Management'` in the back-button label map — this label can never be shown because the section is never navigated to.
- `CLAUDE.md` incorrectly lists `productmgmt.js` in the script load order and lists `productmgmt` as a valid `currentSection` value.

**Recommended action:** Delete the `portals/productmgmt/` folder. Remove the `productmgmt` entry from the `BACK_BUTTON_LABELS` constant in `navigation.js`. Update `CLAUDE.md` to remove all references to `productmgmt`.

---

### 2. `portals/product-development/npi/css/apqp.css` — Deprecated CSS Stub

| File | Size | Issue |
|------|------|-------|
| `portals/product-development/npi/css/apqp.css` | ~15 lines | Not loaded in `index.html`; explicitly marked as deprecated inside the file |

**What it is:** The original monolithic APQP stylesheet that was refactored and split into six focused files (`apqp-shell.css`, `apqp-tables.css`, `apqp-pfd.css`, `apqp-ctq.css`, `apqp-bom.css`, `apqp-responsive.css`).

The file contains only a comment explaining the split — it has zero CSS rules:

```css
/* ============================================================
   apqp.css — REFACTORED
   This file has been split into six focused files ...
   index.html already loads these files in the correct order.
   ============================================================ */
```

**Recommended action:** Delete `portals/product-development/npi/css/apqp.css`. It is a placeholder comment file with no functional content.

---

### 3. `portals/capacity/js/me-estimation-page.js` — JS Not Loaded, CSS Is

| File | Status |
|------|--------|
| `portals/capacity/js/me-estimation-page.js` | Exists but **not in `index.html`** |
| `portals/capacity/css/me-capacity-estimation.css` | Loaded in `index.html` ✅ |

**What it is:** A full PERT (three-point estimation) subsystem for advanced task estimation. It defines 10 `window.*` functions including `meRenderEstimationPage`, `meEstimationSave`, `meEstimationAddRow`, etc.

**The mismatch:** The CSS for this feature (`me-capacity-estimation.css`) is loaded in `index.html`, but the JavaScript file that powers it is **not loaded**. This means:
- The CSS is loading styles for a feature that cannot run
- Any `onclick` handler that calls `meRenderEstimationPage()` would produce a "function is not defined" error

**Note:** `CLAUDE.md`'s script load order section lists `me-estimation-page.js` between `me-capacity.js` and `prod-capacity-data.js`, which indicates a discrepancy between the documented load order and what `index.html` actually loads.

**Recommended action (choose one):**
- **If the feature is intended to be active:** Add `<script src="portals/capacity/js/me-estimation-page.js"></script>` to `index.html` between `me-capacity.js` and `prod-capacity-data.js`.
- **If the feature is abandoned:** Delete `me-estimation-page.js` and `me-capacity-estimation.css`, and remove the entry from `CLAUDE.md`.

---

## 🟡 Medium — Dev Artifacts Committed to the Repo

These files are developer utility or scratch files that have been committed to the repository. They have no purpose in a production codebase and add clutter.

### 4. `temp.txt` — Large Scratch File (383 KB)

**What it is:** A 383 KB file containing a directory listing of the developer's local Windows machine (`c:\Users\Tidyco\Documents\VScode\Tidyco-apqp\...`). It appears to be a scratch/debug output file.

**Recommended action:** Delete `temp.txt`. Add `*.txt` or `temp.txt` to `.gitignore` to prevent future accidents.

---

### 5. `sizes_output.txt` — PowerShell Script Output (6 KB)

**What it is:** The output of `get_sizes.ps1` — a table of the 25 largest JS/CSS/HTML files in the project by file size, generated on the developer's Windows machine. The paths inside it reference the developer's local Windows file system (`C:\Users\Tidyco\...`).

This file is now out of date: it lists `portals/operations/js/operations-dashboard.js` at 50.71 KB, but that file no longer exists — it has been split into 7 separate files (see `plans/LARGE_FILE_SPLIT_PLAN.md` for context).

**Recommended action:** Delete `sizes_output.txt`. Add `sizes_output.txt` to `.gitignore`.

---

### 6. `get_sizes.ps1` — Developer Utility Script

**What it is:** A PowerShell script that scans the project for JS/CSS/HTML files and outputs their sizes. It is a personal dev tool, not part of the application.

```powershell
$files = Get-ChildItem -Path 'c:\Users\Tidyco\Documents\VScode\...' ...
```

The hardcoded path references the developer's local machine.

**Recommended action:** Delete `get_sizes.ps1`. If this tool is useful, it should be moved to a personal scripts folder outside the repository, or the path should be made dynamic and the script added to `.gitignore`.

---

## 🟠 Minor — Documentation Inconsistencies (CLAUDE.md)

`CLAUDE.md` is the primary AI and developer reference document. Several entries in it no longer reflect the current state of the codebase.

### 7. Script Load Order Outdated

**Location:** `CLAUDE.md` — "Script Load Order" section

**Issues found:**

| CLAUDE.md entry | Reality |
|-----------------|---------|
| `productmgmt.js` listed in load order | File is NOT in `index.html` |
| `me-estimation-page.js →` listed between `me-capacity.js` and `prod-capacity-data.js` | File is NOT in `index.html` |
| `gates.js → pfmea.js → apqp.js → bom.js → timing.js → trackers.js` | Correct ✅ |

**Recommended action:** Update the CLAUDE.md script load order to match `index.html` exactly. Remove `productmgmt.js` and `me-estimation-page.js` (or add them back to `index.html` if the feature is needed).

---

### 8. State Variables Reference Outdated

**Location:** `CLAUDE.md` — "State Management" table

The `currentSection` column lists `productmgmt` as a valid value:

> `Active portal ('hub', 'capacity', 'product-development', 'production', 'bugreports', 'productmgmt')`

However, `productmgmt` is not handled in `navigation.js`'s `render()` function and cannot be navigated to.

**Recommended action:** Remove `productmgmt` from the list of valid `currentSection` values in `CLAUDE.md`.

---

### 9. Repository Structure Diagram Outdated

**Location:** `CLAUDE.md` — "Repository Structure" section

Lists `portals/productmgmt/` as "Central product master" but the portal is inactive.

**Recommended action:** Remove the `portals/productmgmt/` line from the repository structure diagram.

---

## 🟢 Low — Code Quality Notes

These are not blocking issues but are worth addressing over time.

### 10. `console.log` Statements in Production Files (33 occurrences)

The codebase contains 33 `console.log()` calls in production JavaScript files. These are debug traces that appear in end-user browser consoles.

Files with the most `console.log` statements:
- `portals/capacity/js/prod-capacity-data.js` (6 statements)
- `portals/product-development/product-management/js/products-data.js` (6 statements)
- `portals/capacity/js/me-data.js` (5 statements)
- `portals/bugs/js/bugs-data.js` (2 debug-level statements: `console.log('Updating bug_reports...')`)
- `portals/product-development/js/families-data.js` (4 statements)

**Note:** Many of these use the `✓` prefix pattern (e.g., `console.log('✓ Families loaded:', ...)`) which suggests they are intentional status confirmations rather than accidental debug output. However, they are still visible to users who open Developer Tools.

**Recommended action:** Review and remove non-essential `console.log` calls before production deployment, keeping only error-level logging.

---

### 11. Legacy `me_capacity` Supabase Table — Confirmed Unused

`CLAUDE.md` documents this table as "Legacy JSON blob (no longer written to; may be removed)". A search of all application JavaScript confirms there are **zero active references** to the `me_capacity` table in the application code.

**Recommended action:** The table can safely be dropped from the Supabase database at any time. No code changes required.

---

## Cleanup Priority Checklist

Use this checklist to track the recommended cleanups:

- [x] **Delete** `portals/productmgmt/js/productmgmt.js`
- [x] **Delete** `portals/productmgmt/css/productmgmt.css`
- [x] **Delete** `portals/productmgmt/` folder (will be empty after above)
- [x] **Remove** `productmgmt` from `BACK_BUTTON_LABELS` in `utils/js/navigation.js`
- [x] **Delete** `portals/product-development/npi/css/apqp.css`
- [x] **Resolve** `portals/capacity/js/me-estimation-page.js` — added back to `index.html` (feature dormant but preserved for reactivation per ME_DATABASE_ANALYSIS.md)
- [x] **Delete** `temp.txt`
- [x] **Delete** `sizes_output.txt`
- [x] **Delete** `get_sizes.ps1`
- [x] **Update** `CLAUDE.md` script load order to match `index.html`
- [x] **Update** `CLAUDE.md` state variables table (removed `productmgmt` from `currentSection` list)
- [x] **Update** `CLAUDE.md` repository structure diagram (removed `portals/productmgmt/` entry)
- [x] **Remove** 26 `console.log` statements across 5 production files
- [ ] **Drop** `me_capacity` Supabase table (database-only action, no code changes needed)

---

## File Count Impact

| Action | Files Removed |
|--------|--------------|
| Delete `portals/productmgmt/` | 2 files |
| Delete `apqp.css` (deprecated stub) | 1 file |
| Delete or resolve `me-estimation-page.js` + CSS | 1–2 files |
| Delete dev artifacts (`temp.txt`, `sizes_output.txt`, `get_sizes.ps1`) | 3 files |
| **Total potential removals** | **7–8 files** |

---

*Report generated from static analysis. No runtime profiling was performed. Some findings (e.g., `me-estimation-page.js`) may require developer judgment before acting.*
