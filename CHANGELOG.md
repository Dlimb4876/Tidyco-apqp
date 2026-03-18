# Changelog

All notable changes to Tidyco APQP are recorded here. Most recent changes appear first.
Format: `YYYY-MM-DD | <what changed> | <why it was changed>`

---

## 2026-03-18 | Redesign settings page: left sidebar + right content, add Permissions category | Old horizontal-tab layout was hard to scan; sidebar layout matches standard settings UI conventions and makes room for future categories. Permissions tab shows all user accounts ready for role-based access control.

## 2026-03-18 | Fix 3 production capacity bugs: filters, headcount save, Fill Forward/Clear All | Filters failed because window.prodCapDetailFilter is undefined (let ≠ window prop); headcount reverted on refresh because inserts didn't retrieve the DB id so subsequent updates silently failed; Clear All only deleted the current user's records leaving shared data intact.

## 2026-03-18 | Make Feedback & Bugs table title column 3x wider | Title was too narrow to read long bug/feedback titles without truncation.

## 2026-03-18 | Added CHANGELOG.md and AI helper changelog rules | Gives all AI assistants shared context across sessions and creates an audit trail of every change made to the project.

---

<!-- HOW TO ADD AN ENTRY:
1. Add it directly below the --- line above
2. Use this exact format (2 lines):
   ## YYYY-MM-DD | Short title of the change | Reason / what problem it solves
   (blank line)
3. Most recent entry always goes at the top, just below the dashes
-->
