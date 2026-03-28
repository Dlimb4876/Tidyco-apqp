# Quick Reference Card

## Your one-page cheat sheet for everyday tasks

This page is designed for fast lookups. If you are new, bookmark it and come back whenever you are not sure how to do something. If you are experienced, the keyboard shortcuts and daily checklists at the bottom will save you the most time.

> **First time here?** Start with the [Getting Started Overview](./00-overview.md), then come back to this page once you have logged in and taken a look around.

---

## Finding Your Way Around

| To... | Do this... |
|---|---|
| Search for anything | Press `/` then type your search term |
| Reset all filters | Press `Esc` or click "Clear All" |
| Bookmark a filtered view | Copy the URL — filters are saved in it |
| Switch areas | Use the main navigation sidebar |
| Get help on any page | Click the `?` icon in the header |

---

## NPI Projects

| Task | Steps |
|---|---|
| Create new project | Dashboard → New Project → Select family → Fill details → Save |
| Upload gate evidence | Open project → Gates tab → Click gate → Upload → Link to evidence item |
| Add sub-assembly | Project page → Add Assembly → Enter details → Link to parent |
| Check project health | Look at KPI Grid for action counts and risk levels |
| Find overdue actions | Filter by "Overdue" status in the Actions tab |

---

## PFMEA

| Task | Steps |
|---|---|
| Add failure mode | Open PFMEA → Add Mode → Enter description → Set severity |
| Link to PFD step | In failure mode → Select Process Step from dropdown |
| Add cause | Expand failure mode → Add Cause → Enter description → Set occurrence |
| Add control | In cause → Add Control → Describe detection method → Set detection |
| Calculate RPN | System auto-calculates: Severity × Occurrence × Detection |
| Generate action | Click "Create Action" on high RPN items → Assign owner → Set due date |

---

## Actions

| Task | Steps |
|---|---|
| Create action | Action Centre → New Action → Fill details → Assign → Save |
| Update progress | Open action → Add progress note → Change status → Save |
| Close action | Open action → Add resolution → Change status to "Done" → Save |
| View my actions | Action Centre → Filter by "Assigned to me" |
| View overdue | Action Centre → Filter by "Overdue" |

---

## Capacity Planning

| Task | Steps |
|---|---|
| Add team member | Capacity Hub → Team Setup → Add Person → Enter hours/day → Save |
| Plan task demand | Select month → Add Task → Enter hours → Assign team → Save |
| Add holiday | Team Setup → Select person → Add Holiday → Enter dates → Save |
| Check overload | View "Utilisation %" — red means over 100% |
| Adjust plan | Reassign tasks or shift them to a different month |

---

## Production Schedule

| Task | Steps |
|---|---|
| Create batch | Schedule → New Batch → Select product → Enter quantity → Set dates → Save |
| Move batch | Drag and drop to new dates or use the date picker |
| Split batch | Open batch → Split → Enter split quantity → Save |
| Assign work area | Open batch → Select Work Area → Save |
| View capacity impact | Batch automatically feeds into Capacity Hub calculations |

---

## MCS (Change Requests)

MCS (Management of Change and Specification) is how formal changes to products or processes are tracked and approved.

| Task | Steps |
|---|---|
| Raise a change request | MCS → New Request → Select type → Describe change → Submit |
| Assess impact | Open request → Fill Impact Assessment sections → Save |
| Submit for approval | Click "Route for Review" → Select approvers → Submit |
| Approve a change | Action Centre → Find MCS item → Review → Approve or Reject → Add comments |
| Implement change | After approval → Update records → Mark tasks complete → Close |

---

## Common Status Values

| Status | Meaning | What to do next |
|---|---|---|
| **Open** | Created but not started | Assign an owner and set a priority |
| **In Progress** | Work actively happening | Add progress updates regularly |
| **On Hold** | Paused, waiting on something | Note what is blocking it; check back regularly |
| **Done** | Completed successfully | Verify the outcome matches what was intended |
| **Overdue** | Past the due date | Escalate or agree a new deadline |

---

## Quick Calculations

### RPN (Risk Priority Number)
```
RPN = Severity (1–10) × Occurrence (1–10) × Detection (1–10)
```
| Range | Risk level | Action |
|---|---|---|
| 1–100 | Low | Monitor |
| 101–300 | Medium | Consider action |
| 301–1000 | High | Action required |

> Always treat Severity 9 or 10 items as urgent — regardless of the overall RPN.

### Capacity Utilisation
```
Utilisation % = (Allocated Hours ÷ Available Hours) × 100
```
| Range | Meaning |
|---|---|
| Under 80% | Headroom available |
| 80–100% | Well utilised |
| Over 100% | Overloaded — rebalancing needed |

### Gate Health (simplified)
```
Gate Health = (Complete Evidence Items ÷ Total Required) × 100
```
| Range | Status |
|---|---|
| 100% | Green — ready for approval |
| 80–99% | Yellow — minor gaps |
| Under 80% | Red — significant work needed |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `/` | Focus search box |
| `Esc` | Clear filters / Close modal |
| `Ctrl + S` | Save current form (when editing) |
| `Ctrl + Enter` | Submit form |
| `?` | Show help (when not in a text field) |

---

## Daily Checklists

Use these as a quick-start prompt at the beginning of your workday.

**For Project Managers:**
- [ ] Check Action Centre for overdue items
- [ ] Review project KPIs for any health changes
- [ ] Add a progress note to any "In Progress" actions
- [ ] Check upcoming gate dates and confirm evidence is on track

**For Manufacturing Engineers:**
- [ ] Review Capacity Hub for overloads this week
- [ ] Check Action Centre for outstanding PFMEA mitigations
- [ ] Verify the production schedule matches the capacity plan
- [ ] Review any new MCS changes affecting your area

**For Quality Engineers:**
- [ ] Check gate evidence pending your approval
- [ ] Review open risks for anything needing escalation
- [ ] Verify PFMEA actions are progressing with owners
- [ ] Check MCS items requiring Quality sign-off

---

## Who to Contact for Help

| Issue type | Contact |
|---|---|
| Cannot log in | IT Helpdesk |
| Data looks wrong | Your department admin |
| System running slowly | Check status page or report to IT |
| Feature not working as expected | Submit a Feedback and Bugs report |
| Need training | Request via your manager |
| Process or quality questions | Ask your department quality representative |

---

## Emergency Actions

| Situation | What to do |
|---|---|
| System completely down | Contact IT immediately — do not submit a bug report |
| Wrong data causing a production stop | Escalate to your department manager immediately |
| Security concern | Report to the IT Security team |
| Cannot access a critical project | Contact the project manager and your department admin |

---

## Related

- [Getting Started Overview](./00-overview.md)
- [Capacity Hub](../capacity/10-capacity-hub.md)
- [NPI Projects](../product-development/10-npi-projects.md)
- [Action Centre](../action-centre/00-overview.md)
