# Operations Risk Tab

## What this tab is for

The Risk tab gives leadership a single place to see the most serious risks across every project — without needing to open each one individually. If something is threatening a project's quality, safety, or timeline, it should appear here so it can be acted on quickly.

Think of it as a rolling radar for threats that matter most right now.

> **New to this tab?** Start by reading the table from top to bottom. Each row is a risk signal that someone, somewhere, has flagged as high-priority. Your job on first visit is to understand what each one is and whether it has an active owner.

---

## Before you start

- Make sure project managers and engineers are actively maintaining their Risk Registers and PFMEAs — this tab only shows what has been entered.
- Know your organisation's risk tolerance thresholds (what score triggers escalation).
- If rows appear blank or stale, the underlying project data may need updating first.

---

## Key components

- **High Severity PFMEA Items** — Process failure modes rated Severity 9 or 10. These are safety-critical or operationally critical failures that must always be addressed, regardless of overall RPN.
- **High Score Project Risks** — Project-level threats with high impact and likelihood from the NPI Risk Registers.
- **Stalled Mitigations** — High-risk items where the linked action is overdue or has no named owner. These are the most dangerous — a known risk with no one managing it.

---

## How to work through this tab

1. **Severity 9–10 PFMEA items first.** These are safety or critical operational failures. Review each one before looking at anything else.
2. **Check top project risks.** Look at the highest-scoring risks from NPI Risk Registers and confirm they are still accurate and current.
3. **Verify mitigation status.** For every top risk, check there is an active, owned action in place.
4. **Escalate stalled items.** If a high-risk item has no owner or the action is overdue, follow up with the project owner directly — do not leave it for the next review.

---

## What good risk hygiene looks like

A healthy Risk tab has:
- Every high-severity item linked to an open action with an owner and a due date
- No rows that haven't been reviewed in over 30 days
- Stalled mitigations treated as urgent, not just flagged

If you are seeing many stalled rows or high-severity items with no actions, that is a sign the underlying projects need a risk review session, not just a tab refresh.

---

## Common mistakes to avoid

- **Focusing only on numbers.** A medium-score risk with no mitigation plan is often more dangerous than a high-score risk that is actively managed. Look at the "Mitigation Status" column as much as the score.
- **Ignoring stale risks.** Risks that haven't been updated in months may have already materialised into issues — or resolved themselves. Either way, they need updating.
- **Treating this tab as read-only.** If you spot a gap here, act on it. The tab is a prompt for action, not just a report.

---

## Quick example

| Source | Risk / Failure Mode | Score | Mitigation Status | Owner |
|---|---|---|---|---|
| PFMEA (Project X) | Final torque tool failure (S=10) | RPN 200 | Open Action: Install interlock | J. Smith |
| Risk Register (Project Y) | Supplier Z tooling delay | High (16) | Overdue: Source backup supplier | A. Doe |

In this example, the second row is the more urgent problem — it is overdue and the backup supplier has not been sourced. Even though the RPN on Project X is higher, it has an active plan.

---

## Advanced tips

- **Cross-reference with Operations Flow tab** to see whether stalled risks align with process bottlenecks.
- **Sort by "Last Updated"** if that column is available — anything untouched for more than 30 days in a high-risk category should be chased.
- **Use the Stalled Mitigations section as your action trigger list** at weekly leadership reviews. Each stalled row should have a named owner by the end of the meeting.
- **Track trends over time.** If the same type of risk (e.g. supplier delays) keeps appearing across multiple projects, that is a systemic issue worth raising at a higher level.

---

## Related

- [Risk Register](../product-development/80-risks.md)
- [Action Tracker](../product-development/70-actions.md)
- [Actions Tab](./50-actions-tab.md)
- [PFMEA](../product-development/50-pfmea.md)
