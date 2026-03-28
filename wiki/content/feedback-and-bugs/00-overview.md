# Feedback and Bugs

## What this area is for
Feedback and Bugs is where users report issues, request improvements, and track responses.
It provides a centralised channel for continuous improvement and ensures nothing falls through the cracks.

## Before you start
- Search existing reports first to avoid duplicates.
- Gather screenshots, error messages, and context before submitting.
- Know which area of the system you were using when the issue occurred.

## The complete workflow

### 1. Submission
Create a new report with:
- **Clear title:** Summarise the issue in one line.
- **Type:** Bug (something broken) or Enhancement (improvement request).
- **Priority:** Critical (blocking work), High (major impact), Medium (annoyance), Low (nice to have).
- **Area:** Which module were you using (NPI, Capacity, Production, etc.).
- **Description:** What happened, what you expected, and steps to reproduce.
- **Evidence:** Screenshots, error messages, or affected record IDs.

### 2. Triage
Once submitted, reports are reviewed by the system team:
- **Acknowledged:** The report has been seen and is being assessed.
- **Accepted:** The issue is valid and has been added to the backlog.
- **Needs Info:** More detail is required from the reporter.
- **Declined:** The request does not align with roadmap or cannot be reproduced.
- **Duplicate:** This issue is already tracked elsewhere.

### 3. Development
Accepted items move through development stages:
- **In Progress:** A developer is actively working on the fix or feature.
- **In Testing:** The change is being verified before release.
- **Ready for Release:** Complete and waiting for the next deployment.

### 4. Closure
When work finishes:
- **Resolved:** The fix or feature is live.
- **Closed:** No action required or superseded by other changes.
- **Resolution notes:** Clear explanation of what was done and why.

## Report types and examples

| Type | Example | Priority Guidance |
|---|---|---|
| Bug | "Cannot save PFMEA when failure mode has special characters" | Critical if blocking APQP delivery; High if workaround exists |
| Enhancement | "Add export button to Capacity Hub" | Medium unless requested by multiple users |
| Data Issue | "Wrong product showing in family filter" | High if affecting planning accuracy |
| Performance | "Page takes 30 seconds to load" | Critical if blocking daily use |
| Usability | "Colour contrast too low on risk matrix" | Medium unless accessibility issue |

## Writing effective reports

### Good report example
```
Title: Gate approval button disabled for users with correct permissions
Type: Bug
Priority: High
Area: NPI Projects

Description:
Users with "Gate Approver" role cannot click the approve button 
on Gate 2 even when all evidence is complete.

Steps to reproduce:
1. Log in as user with Gate Approver role
2. Open Project ABC-123
3. Navigate to Gate 2
4. Observe all evidence items are ticked
5. Approve button remains greyed out

Expected: Button should be active
Actual: Button is disabled

Evidence: Screenshot attached showing button state
```

### Poor report example
```
Title: Something broken
Type: Bug

Description: The system doesn't work properly. Please fix.
```

## Tracking your reports
- Use the "My Reports" filter to see items you have submitted.
- Enable email notifications to get updates when status changes.
- Add comments to provide additional context or answer questions.

## Common mistakes to avoid
- **Vague descriptions:** "It doesn't work" wastes everyone's time. Be specific.
- **Missing context:** Always include what you were doing when the issue occurred.
- **Multiple issues in one report:** Split unrelated problems into separate tickets.
- **Reporting to wrong area:** A Capacity issue reported under NPI will take longer to route.

## Related
- [How to Write Good Bug Reports](./10-writing-good-reports.md)
- [Action Centre Overview](../action-centre/00-overview.md)
- [Getting Started](../getting-started/00-overview.md)
