# Operations Overview Tab

## What this tab is for
This is the first-stop health check for the whole operation. 
It provides a high-level summary of delivery flow, capacity pressure, and execution risk, helping leaders decide where to investigate before diving into detailed tabs.

## Before you start
- Ensure the underlying Production, Capacity, and NPI data is reasonably up to date.
- Understand that this tab shows aggregated signals; it does not replace the detailed views.

## Key components
- **Headline Indicators:** Top-level metrics showing overall system health (e.g., active batches, overdue actions, high-risk items).
- **Recent Alerts:** High-priority changes or thresholds breached in the last 24-48 hours.
- **Unit Capacity Summaries:** High-level utilisation and headroom for operational areas (Unit 2, Unit 3, Unit 6).

## The analytical process
1. **Scan the headlines:** Look at the main indicator widgets to gauge overall health.
2. **Check for red:** Identify any KPIs or alerts that have breached acceptable thresholds.
3. **Drill down:** Click through or navigate to the specific tab (Flow, Risk, People) that corresponds to the concerning metric.
4. **Follow up:** Use the detailed tabs to identify root causes and ensure mitigating actions are in place.

## Common mistakes to avoid
- **Ignoring the details:** Relying solely on the Overview tab and assuming everything is fine without checking the underlying tabs for hidden trends.
- **Overreacting to daily noise:** Treating normal daily fluctuations as crises. Look for sustained trends.

## Quick example
| Metric | Status | Action |
|---|---|---|
| Overdue Actions | 12 (Red) | Go to Actions tab, filter by overdue, contact owners. |
| Unit 2 Utilisation | 85% (Amber) | Go to People tab, check Unit 2 capacity trend over next 3 months. |

## Related
- [Flow Tab](./20-flow-tab.md)
- [Risk Tab](./30-risk-tab.md)
- [People Tab](./40-people-tab.md)
