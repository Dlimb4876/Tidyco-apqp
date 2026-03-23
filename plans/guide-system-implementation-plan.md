# Standalone User Guide Wiki - Implementation Plan (Revised)

Date: 2026-03-23  
Status: Revised Proposal  
Priority: High - User Experience Improvement

---

## 1. Plan Review Verdict

The original plan is strong on content scope and user coverage, but it is not the best technical fit for your stated goal.

What is good:
- Comprehensive topic map across portals and workflows.
- Clear phased delivery model.
- Good intent around search, cross-links, and troubleshooting.

What should change:
- It is too SPA-centric (new route, portal shell, tab UI inside app).
- It keeps too much content pressure inside app JS files.
- It does not enforce file-size/token guardrails for future audits.

Decision:
- Move to a standalone wiki page with its own index, linked from the main app.
- Organize files by area first.
- Keep every content file intentionally small and audit-friendly.

---

## 2. Revised Target State

Build a standalone guide site in this repository, served as static files, with its own index entry point.

Primary outcomes:
- Not part of SPA routing.
- Link from app into wiki (same repo, separate experience).
- Content split by area and topic into small Markdown files.
- Lightweight JS-only viewer/search with no build pipeline.

---

## 3. Information Architecture (By Area)

Proposed structure:

```text
wiki/
  index.html
  assets/
    css/
      wiki.css
    js/
      wiki-app.js
      wiki-nav.js
      wiki-search.js
      wiki-render.js
  content/
    _meta/
      areas.json
      search-index.json
      glossary.md
      changelog.md
    getting-started/
      00-overview.md
      10-navigation-and-urls.md
      20-roles-and-permissions.md
      30-keyboard-shortcuts.md
    capacity/
      00-overview.md
      10-capacity-hub.md
      20-me-capacity.md
      30-pm-capacity.md
      40-logistics-capacity.md
      50-unit6-capacity.md
      60-team-management.md
      70-task-management.md
      80-product-support.md
      90-holiday-planner.md
    product-development/
      00-overview.md
      10-npi-projects.md
      20-project-dashboard.md
      30-ctq.md
      40-pfd.md
      50-pfmea.md
      60-control-plan.md
      70-actions.md
      80-risks.md
      90-bom.md
      100-timing.md
      110-gates.md
    product-management/
      00-overview.md
      10-product-catalogue.md
      20-overhaul-trends.md
      30-product-families.md
      40-parts-database.md
    production/
      00-overview.md
      10-schedule.md
      20-plan-by-product.md
      30-plan-by-work-area.md
    operations/
      00-overview.md
      10-overview-tab.md
      20-flow-tab.md
      30-risk-tab.md
      40-people-tab.md
      50-actions-tab.md
      60-forecast-tab.md
    mcs/
      00-overview.md
      10-raising-changes.md
      20-change-types.md
      30-approval-workflow.md
      40-activity-log.md
      50-timeline.md
    action-centre/
      00-overview.md
      10-personal-queue.md
      20-npi-actions.md
      30-pfmea-actions.md
      40-pending-approvals.md
    feedback-and-bugs/
      00-overview.md
      10-submitting.md
      20-browse-and-filter.md
      30-responding.md
      40-status-workflow.md
    settings/
      00-overview.md
      10-work-areas.md
      20-teams.md
      30-departments.md
      40-preferences.md
scripts/
  wiki-build-search-index.js
  wiki-token-audit.js
  wiki-link-check.js
```

Notes:
- Area folder names mirror product areas for easy ownership.
- Numbered filenames keep stable navigation order.
- Search index is generated and committed for static hosting.

---

## 4. Token and File Size Guardrails

To keep future audits fast and safe, adopt hard constraints:

- One topic per file.
- Preferred file size: 250-900 tokens.
- Soft cap: 1,200 tokens per Markdown file.
- Hard cap: 1,500 tokens per Markdown file.
- Max heading depth: H3.
- Max tables per file: 2.
- Use links to related topics instead of duplicating long text.

Audit policy:
- Run token audit in CI or pre-commit.
- Flag files above soft cap.
- Fail build only above hard cap.

---

## 5. Content Template (Small-File Version)

Each topic file should use this compact template:

```markdown
# Topic Title

## Overview
2-4 lines.

## Access
- Portal: ...
- Tab/Sub-tab: ...
- URL: ...

## Key Fields or Controls
Small table, max 8 rows.

## Common Tasks
### Task: ...
1. ...
2. ...
3. ...
Result: ...

## Common Issues
| Issue | Cause | Fix |
|---|---|---|

## Related
- [Related topic](../area/file.md)
```

Rule:
- If a topic exceeds limits, split it into part files (for example, 50-pfmea-core.md, 51-pfmea-actions.md).

---

## 6. Navigation and App Integration

Because this is standalone, integration is simple and low-risk:

In-app entry points:
- Hub card: "User Guide" opens wiki/index.html.
- Optional top-nav link: "Guide" opens wiki/index.html.
- Context buttons can deep-link by hash (for example, wiki/index.html#capacity/80-product-support).

Legacy compatibility:
- Keep existing showGuide(key) for now.
- Gradually remap showGuide(key) to open wiki anchors in a new tab.
- Decommission modal content once parity is complete.

---

## 7. Search Design (Static and Token-Light)

Approach:
- Prebuild search-index.json from Markdown files (title, headings, keywords, excerpt, path).
- Client-side filtering with weighted ranking.
- Highlight title and heading matches first.

Ranking order:
1. Exact title match
2. Heading match
3. Keyword match
4. Body excerpt match

Performance target:
- Search response under 100 ms for up to 300 guide files on typical laptop hardware.

---

## 8. Revised Delivery Phases

### Phase 1 - Skeleton and Tooling (Week 1)
- Create wiki shell (index, CSS, JS, layout).
- Create area folders and starter files.
- Add search index generator.
- Add token audit script and link checker.
- Add one Hub link to wiki.

Deliverable:
- Standalone wiki loads, navigates, and searches.

### Phase 2 - Migrate Existing Guide Content (Week 2)
- Move current GUIDE_CONTENT into area/topic Markdown files.
- Add missing Logistics and Unit 6 coverage.
- Keep files within token budgets.

Deliverable:
- Functional parity with existing modal guides.

### Phase 3 - Expand High-Value Topics (Week 3)
- Add deeper walkthroughs where support demand is highest.
- Add short troubleshooting sections per topic.
- Add cross-links and glossary entries.

Deliverable:
- Coverage complete for daily workflows.

### Phase 4 - Link Migration and Modal Retirement (Week 4)
- Remap in-app help buttons to wiki anchors.
- Keep fallback for unresolved keys.
- Mark modal system as legacy.

Deliverable:
- Wiki becomes default guide destination.

### Phase 5 - Hardening and Governance (Week 5)
- Accessibility pass (WCAG 2.1 AA for wiki UI).
- Mobile and tablet QA.
- Token audit cleanup and ownership matrix.
- Publish maintenance process.

Deliverable:
- Production-ready, maintainable guide wiki.

---

## 9. Ownership Model (By Area)

Assign one owner per area folder.

Suggested model:
- capacity/*: Capacity owner
- product-development/*: NPI/APQP owner
- production/* and operations/*: Operations owner
- mcs/* and action-centre/*: Change and action owner
- settings/* and getting-started/*: Platform owner

Policy:
- No cross-area edits without owner review.
- Keep updates local to one area folder when possible.

---

## 10. Risks and Mitigations (Updated)

| Risk | Impact | Mitigation |
|---|---|---|
| Content drift from product behavior | High | Area ownership + monthly review + link checks |
| Large files becoming hard to audit | High | Token caps + automated token audit |
| Broken deep links from app | Medium | Redirect map + fallback landing behavior |
| Low usage despite good content | Medium | Add direct links at common help points |

---

## 11. Acceptance Criteria

This plan is successful when:

1. Guide is accessible at wiki/index.html and does not depend on SPA route handling.
2. App links open the standalone guide without regressions in main SPA navigation.
3. Content is organized by area, and all files comply with token guardrails.
4. Search works across all topic files with acceptable speed.
5. Existing guide modal keys are migrated or mapped with no dead ends.

---

## 12. Immediate Next Steps

1. Approve standalone wiki direction.
2. Approve folder and token standards.
3. Build Phase 1 scaffold in wiki/.
4. Migrate top 10 most-used guide topics first.
5. Switch Hub User Guide link to wiki index.

---

Plan Version: 2.0  
Created: 2026-03-23  
Updated: 2026-03-23  
Owner: TBD  
Review Date: TBD
