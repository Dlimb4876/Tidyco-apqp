# How to Write Good Bug Reports

## Why good reports matter
A well-written bug report gets fixed faster. When developers can reproduce the issue quickly and understand the impact, they spend less time asking questions and more time solving the problem.

Poor reports often result in:
- Being sent back for more information (delays)
- Being closed as "cannot reproduce" (frustration)
- Being misunderstood and fixed incorrectly (wasted effort)

Good reports result in:
- Faster resolution times
- Accurate fixes that address the root cause
- Better prioritisation by the development team

## The anatomy of a great report

### 1. Descriptive title
The title is the first thing reviewers see. Make it count.

**Poor:** "Bug in NPI"
**Better:** "Cannot save PFMEA when special characters in failure mode"
**Best:** "PFMEA save fails with 500 error when failure mode contains ampersand (&)"

### 2. Clear type classification
Select the appropriate type so it gets routed correctly:
- **Bug:** Something is broken or not working as designed
- **Enhancement:** A request for new functionality or improvement
- **Data Issue:** Incorrect or missing data
- **Performance:** Slow loading, timeouts, or resource issues
- **Usability:** Confusing interface or poor user experience

### 3. Accurate priority
Be honest about impact:
- **Critical:** Work is completely blocked; no workaround exists
- **High:** Significant impact but workaround available
- **Medium:** Annoying but doesn't prevent work completion
- **Low:** Minor cosmetic issue or nice-to-have improvement

### 4. Detailed description
Structure your description to answer these questions:

**What happened?**
Describe the actual behaviour you observed.

**What did you expect?**
Describe what you thought should happen.

**Steps to reproduce:**
Numbered steps that anyone can follow to see the issue.

**Environment details:**
- Browser and version (e.g., Chrome 120, Edge 118)
- Operating system (e.g., Windows 11, macOS Sonoma)
- Screen resolution or device type if relevant
- User role or permissions level

### 5. Supporting evidence
Include whatever helps demonstrate the issue:
- **Screenshots:** Show the error, incorrect data, or visual problem
- **Screen recordings:** For complex multi-step issues or animations
- **Error messages:** Copy-paste exact text (redact sensitive info)
- **Console logs:** If you know how to open browser developer tools
- **Record IDs:** Project codes, action IDs, or specific references

## Writing effective steps to reproduce

Good steps are:
- **Specific:** Use exact button names, menu items, and field labels
- **Complete:** Include login and navigation steps
- **Ordered:** Numbered 1, 2, 3 in the sequence they happen
- **Isolated:** Remove unrelated actions that don't affect the bug

### Example: Good steps
```
Steps to reproduce:
1. Log in as "manufacturing.engineer@tidyco.com"
2. Navigate to NPI Projects
3. Open project "PRJ-2026-0042"
4. Click the "PFMEA" tab
5. Click "Add Failure Mode" button
6. Enter "Leak at joint & seal interface" in the description field
7. Click "Save"
8. Observe the error message

Expected: Failure mode saves successfully
Actual: Red error banner appears "Failed to save. Please try again."
```

### Example: Poor steps
```
Steps:
Went to PFMEA and tried to save something but it didn't work.
```

## Common report anti-patterns

### The vague report
```
Title: System broken
Description: The system doesn't work properly. Fix it please.
```
**Problem:** No actionable information.
**Solution:** Specify which feature, what you did, and what went wrong.

### The everything report
```
Title: Lots of issues
Description:
1. Can't save PFMEA
2. Capacity Hub shows wrong numbers
3. Action Centre is slow
4. Would like export button
5. Colour scheme hurts my eyes
```
**Problem:** Multiple unrelated issues in one report.
**Solution:** Create separate reports so they can be tracked and assigned individually.

### The assumption report
```
Title: Database problem
Description: The database must be corrupted because my changes aren't saving.
```
**Problem:** Diagnosing instead of reporting symptoms.
**Solution:** Describe what you observed. Let the team determine root cause.

### The complaint report
```
Title: This is terrible
Description: Who designed this? It's impossible to use. I've been trying for an hour and nothing works. This is wasting my time.
```
**Problem:** Emotional without actionable detail.
**Solution:** Describe the specific friction points with examples.

### The works-on-my-machine report
```
Title: Gate approval broken
Description: I can't approve gates anymore. This worked yesterday.
```
**Problem:** Missing context about what changed.
**Solution:** Note any recent changes (new browser, different computer, recent training, etc.).

## Report templates by category

### Bug report template
```
Title: [Area] [Feature] [Problem summary]

Description:
What I was trying to do: [Goal]
What happened: [Actual behaviour]
What I expected: [Expected behaviour]

Steps to reproduce:
1. [First step]
2. [Second step]
3. [etc.]

Environment:
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- User role: [e.g., Quality Engineer]
- URL: [Page where issue occurred]

Error message (if any):
[Paste exact text]

Screenshots:
[Attach images]

Impact:
[How this affects your work]
```

### Enhancement request template
```
Title: [Area] Add [feature] to improve [benefit]

Current situation:
[Describe how things work now]

Proposed change:
[Describe what you want to happen]

Business benefit:
[Why this matters - time saved, errors prevented, etc.]

Who would use this:
[Which roles need this feature]

Acceptance criteria:
- [ ] [Specific checkable requirement]
- [ ] [Another requirement]
```

### Data issue template
```
Title: Incorrect [data type] in [location]

Affected record:
[ID, code, or reference number]

Current (wrong) value:
[What it shows now]

Expected (correct) value:
[What it should be]

Evidence:
[Source document or authority confirming correct value]

Impact:
[How the wrong data affects decisions or processes]
```

## Before you submit

Checklist:
- [ ] I searched existing reports and this is not a duplicate
- [ ] The title clearly describes the issue
- [ ] I selected the correct type and priority
- [ ] Steps to reproduce are clear and complete
- [ ] I included screenshots or error messages
- [ ] I specified my browser and operating system
- [ ] I removed any sensitive or confidential information
- [ ] This is a single issue (not multiple unrelated problems)

## After you submit

### Respond to questions
If the team asks for more information, respond promptly. The faster you provide clarification, the faster they can fix the issue.

### Watch for updates
Enable notifications so you know when:
- The status changes (e.g., moved to "In Progress")
- A fix is ready for testing
- The issue is resolved

### Verify fixes
When a fix is released, test it in your actual workflow. Confirm it resolves your specific scenario, not just the general case.

### Provide feedback
If the fix works well, add a comment saying so. Positive feedback helps the team know they're on the right track.

## Related
- [Feedback and Bugs Overview](./00-overview.md)
- [Getting Started](../getting-started/00-overview.md)
