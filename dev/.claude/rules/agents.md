# Agent Development Patterns

Guidelines for building and using custom agents in Tidyco APQP.

## Agent Types for This Project

### Code Quality Agent
**Purpose:** Validate code against CLAUDE.md rules

**Responsibilities:**
- Check for duplicate `const` declarations
- Verify script load order in `index.html`
- Validate state variables are in `state.js`
- Ensure XSS prevention with `esc()`
- Lint and format validation

**Trigger:** On pre-commit or code review PR

---

### Testing Agent
**Purpose:** Ensure test coverage and quality

**Responsibilities:**
- Run `npm test` and analyze results
- Validate test coverage >80%
- Suggest tests for untested code
- Identify flaky tests
- Check mock patterns match conventions

**Trigger:** On test changes or PR

---

### Capacity Parity Agent
**Purpose:** Enforce Manufacturing Engineering ↔ Project Management sync

**Responsibilities:**
- Monitor changes to `portals/capacity/`
- Detect ME vs. PM discrepancies
- Suggest missing syncs
- Validate capacity values match between portals

**Trigger:** On capacity changes

---

### Documentation Agent
**Purpose:** Keep docs synchronized with code

**Responsibilities:**
- Update CLAUDE.md when rules change
- Generate architecture docs from code
- Maintain README accuracy
- Link code to documentation

**Trigger:** On significant code changes

---

### Database Validation Agent
**Purpose:** Ensure data consistency

**Responsibilities:**
- Validate Supabase migrations
- Check RLS policies on all tables
- Verify schema matches TypeScript types
- Detect missing indices

**Trigger:** On schema changes

---

## Building a Custom Agent

### Step 1: Define Scope
```markdown
# My Agent
**Input:** Code files to review
**Output:** List of issues and fixes
**Trigger:** Pre-commit or on-demand
**Dependencies:** ESLint, Prettier, Jest
```

### Step 2: Define Rules
```markdown
## Validation Rules
1. All functions must have tests
2. No duplicate const declarations
3. Script load order matches CLAUDE.md
```

### Step 3: Implement Checks
```javascript
// Agent checks for duplicate const
const lines = code.split('\n');
const constDefs = new Map();

lines.forEach((line, i) => {
  const match = line.match(/const\s+(\w+)\s*=/);
  if (match) {
    const varName = match[1];
    if (constDefs.has(varName)) {
      report({
        line: i + 1,
        issue: `Duplicate const: ${varName}`,
        previous: constDefs.get(varName)
      });
    }
    constDefs.set(varName, i + 1);
  }
});
```

### Step 4: Report Results
```javascript
// Clear, actionable output
console.log('✅ 5 files checked');
console.log('❌ 2 issues found:');
console.log('  - duplicate const in state.js:45');
console.log('  - missing esc() in helpers.js:12');
```

---

## Agent Communication Patterns

### Input Format
Agents receive context as parameters:
```
Agent(
  description: "Check code style",
  prompt: "Review core/js/*.js for CLAUDE.md violations",
  context: {
    files: ["core/js/state.js", "core/js/auth.js"],
    rules: "CLAUDE.md"
  }
)
```

### Output Format
Agents should return structured results:
```json
{
  "status": "success|warning|error",
  "checks": [
    {
      "file": "core/js/state.js",
      "line": 45,
      "severity": "error|warning|info",
      "issue": "Duplicate const declaration",
      "suggestion": "Remove duplicate or rename variable"
    }
  ],
  "summary": "2 issues found in 5 files"
}
```

---

## Integration with Workflows

### Pre-Commit Workflow
```
1. Code Quality Agent → Check style/rules
2. Testing Agent → Run tests
3. Capacity Parity Agent → Validate ME/PM sync
4. If all pass → Allow commit
5. If any fail → Show issues and suggestions
```

### PR Review Workflow
```
1. Code Quality Agent → Style and pattern review
2. Testing Agent → Coverage and quality check
3. Documentation Agent → Docs consistency
4. Security Agent → XSS, RLS, auth checks
5. Generate review summary
```

### Release Workflow
```
1. All agents → Final validation
2. Documentation Agent → Update CHANGELOG
3. Testing Agent → Final test run
4. Capacity Agent → Verify no outstanding syncs
5. Generate release notes
```

---

## Error Handling in Agents

### Graceful Degradation
If one check fails, other checks should continue:
```
✅ ESLint passed
❌ Test coverage <80% (2 untested functions)
⚠️  Schema validation skipped (DB not connected)
```

### Reporting Failures
- Always explain what failed and why
- Suggest how to fix
- Provide links to relevant docs (CLAUDE.md, etc.)

### Retry Logic
For network/transient failures:
```
// Retry failed checks up to 3 times
// With exponential backoff: 1s, 2s, 4s
```

---

## Performance Considerations

### Parallelization
Run independent checks in parallel:
```
// ✅ Parallel checks
- ESLint (fast)
- Test coverage (medium)
- Schema validation (medium)

// ❌ Sequential bottleneck
- Database migration (fast)
- Then capacity parity check (depends on DB)
```

### Caching
Cache results between runs:
- ESLint cache: `.eslintcache`
- Jest cache: `.jest-cache`
- Agent cache: Recently checked files

### Timeouts
Set reasonable timeouts per check:
- Lint: 10 seconds
- Tests: 30 seconds
- DB validation: 20 seconds

---

## Testing Your Agent

### Unit Tests
Test agent logic independently:
```javascript
describe('CodeQualityAgent', () => {
  it('detects duplicate const', () => {
    const code = 'const x = 1;\nconst x = 2;';
    const issues = analyzeCode(code);
    expect(issues).toHaveLength(1);
    expect(issues[0].issue).toContain('Duplicate');
  });
});
```

### Integration Tests
Test agent with real codebase:
```javascript
it('checks real project files', async () => {
  const results = await runAgent('core/js/', rules);
  expect(results.status).toBe('success');
});
```

---

## Documentation for Agents

Document in `.claude/agents.md`:
- When to use the agent
- What it validates
- How to trigger it
- Example outputs
- Failure scenarios

Make agents discoverable and easy to use!
