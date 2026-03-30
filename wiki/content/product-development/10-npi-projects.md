# NPI Projects

## What this page is for
NPI Projects is the front door to active and historical projects.
Use it to find the right project quickly and move into dashboard or APQP work.

## High-level workflow
1. Search or filter to find the project.
2. Review KPI and gate trajectory for current health.
3. Open the project dashboard.
4. Move into APQP pages (PFMEA, risks, actions, gates) as needed.
5. Return to NPI Projects for portfolio-level monitoring.

## How teams typically use it
- **Filter by project status or family** to focus on the current phase.
- **Search by project name or reference** when working in reviews or meetings.
- **Open the project dashboard** to continue APQP, actions, risks, or gate activity.
- **Create new projects** when new product introductions are authorised.

*Note: Your dashboard search text, family/status filters, and view modes are automatically saved in the URL, making it easy to bookmark or share specific project views with your team.*

## Key Dashboard Components

### KPI Grid
The KPI Grid gives you an instant health check of all your projects at a glance:
- **Total Actions:** Count of open, in-progress, and overdue action items.
- **Risk Level:** Aggregate risk score based on open high-severity PFMEA items.
- **Gate Status:** Whether the project is on track, at risk, or blocked at its current gate.
- **Timing Health:** Days remaining until the next major milestone.

Click any KPI to drill down into the relevant section of the project.

### Gate Trajectory
The visual tracker shows:
- **Completed Gates:** Marked with a green check and completion date.
- **Current Gate:** Highlighted in blue with pending evidence items listed.
- **Upcoming Gates:** Greyed out with forecast dates based on the timing plan.
- **Blocked Gates:** Red indicator when evidence is incomplete or sign-offs are missing.

### Sub-assembly Management
Complex products often break down into multiple modules:
- Each sub-assembly has its own mini-dashboard and APQP content.
- Parent projects roll up metrics from all child assemblies.
- Navigate between assemblies using the hierarchy breadcrumb at the top of the page.

### Recent Activity Feed
See what has changed recently:
- **Latest Actions:** New tasks assigned or status updates.
- **Risk Changes:** New risks logged or existing risks mitigated.
- **Gate Updates:** Evidence uploaded or approvals completed.
- **Document Changes:** PFMEA, Control Plan, or BOM modifications.

## Project Creation Workflow

When you need to set up a new NPI project:

1. **Click New Project** from the main dashboard.
2. **Select Product Family:** This determines which templates and gate criteria apply.
3. **Enter Basic Details:** Project name, reference code, target production date.
4. **Assign Core Team:** Project manager, manufacturing engineer, quality engineer.
5. **Define Assemblies:** Add sub-assemblies if this is a multi-module product.
6. **Save and Configure:** The project is created with default timing plan templates.

## Calculations and interpretation (detailed)
### Portfolio action pressure
```text
Overdue Action Share % = (Overdue Actions / Total Open Actions) × 100
```

### Gate readiness (simplified)
```text
Gate Readiness % = (Completed Required Evidence / Total Required Evidence) × 100
```

Interpretation:
- High overdue share indicates delivery pressure and likely slippage risk.
- Lower readiness indicates evidence gaps before the next gate review.

## Navigation Tips

### Keyboard Shortcuts
- Press `/` to quickly focus the search box.
- Press `Esc` to clear all active filters.
- Use arrow keys to navigate between projects in list view.

### Bookmarking Views
Since filter states are saved in the URL, you can:
- Bookmark "My Active Projects" for daily use.
- Share "High Risk Projects" links with management.
- Create "Gate 3 Reviews" shortcuts for monthly meetings.

## Common Mistakes to Avoid
- **Creating duplicate projects:** Always search first to avoid splitting APQP content across multiple records.
- **Wrong product family:** Selecting the wrong family means incorrect gate criteria and templates.
- **Orphaned sub-assemblies:** Forgetting to link sub-assemblies to their parent projects breaks roll-up reporting.

## Related
- [Timing Plan](./100-timing.md)
- [APQP Gates](./110-gates.md)
- [Product Families](../product-management/30-product-families.md)
