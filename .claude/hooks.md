# Automation Hooks for Claude Code

Hooks allow agents and tools to run automatically in response to events, improving development efficiency.

## Available Hooks

### 1. `session-start`
**Trigger:** When Claude Code session starts

**Use cases:**
- Install dependencies
- Run type checking
- Load project state
- Check git status

**Example:**
```bash
#!/bin/bash
npm install
npm run check:all
echo "✓ Project ready"
```

### 2. `pre-commit`
**Trigger:** Before git commit

**Use cases:**
- Run tests
- Check code style
- Validate file changes
- Block commits with failures

**Example:**
```bash
#!/bin/bash
npm test || exit 1
npm run lint || exit 1
```

### 3. `post-save`
**Trigger:** After file save

**Use cases:**
- Auto-format code
- Run single-file tests
- Check syntax
- Real-time validation

---

## Hook Configuration

Hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "session-start": "scripts/hooks/session-start.sh",
    "pre-commit": "scripts/hooks/pre-commit.sh",
    "post-save": {
      "**/*.test.js": "npm test -- %file%",
      "core/js/*.js": "npm run lint -- %file%"
    }
  }
}
```

---

## Agent Hooks

Trigger specialized agents based on events:

```json
{
  "agentHooks": {
    "on-test-failure": {
      "agent": "debugging",
      "description": "Analyze test failures and suggest fixes"
    },
    "on-capacity-change": {
      "agent": "validation",
      "description": "Verify capacity parity between ME and PM"
    },
    "on-schema-change": {
      "agent": "migration",
      "description": "Detect database schema changes and plan migrations"
    }
  }
}
```

---

## Tidyco-Specific Hook Ideas

### Quality Gate (Pre-Commit)
```bash
#!/bin/bash
echo "Running pre-commit checks..."
npm run check:all || {
  echo "❌ Quality checks failed"
  exit 1
}
echo "✓ Ready to commit"
```

### Test Validation (Post-Save)
```bash
#!/bin/bash
if [[ "$1" == *.test.js ]]; then
  npm test -- "$1"
fi
```

### Capacity Parity Validation
After capacity changes in `portals/capacity/`:
```bash
#!/bin/bash
if [[ "$1" == "portals/capacity"* ]]; then
  # Trigger validation agent
  echo "Checking capacity parity..."
  # Agent job to verify ME/PM sync
fi
```

### Database Consistency Check
After schema changes:
```bash
#!/bin/bash
if [[ "$1" == "migrations"* ]]; then
  # Trigger migration validation
  echo "Validating schema changes..."
fi
```

---

## Setting Up Hooks

1. Create `scripts/hooks/` directory:
```bash
mkdir -p scripts/hooks
chmod +x scripts/hooks/*.sh
```

2. Update `.claude/settings.json`:
```json
{
  "hooks": {
    "session-start": "scripts/hooks/session-start.sh",
    "pre-commit": "scripts/hooks/pre-commit.sh"
  }
}
```

3. Commit hooks to repo:
```bash
git add scripts/hooks/
git commit -m "chore: add automation hooks"
```

---

## Hook Best Practices

### Keep Hooks Fast
- Avoid long-running operations in hooks
- Use background agents for heavy tasks
- Timeout hooks after 30 seconds

### Clear Feedback
- Show progress: `echo "Running tests..."`
- Show results: `echo "✓ All tests passed" or "❌ Tests failed"`
- Include timing info: `time npm test`

### Conditional Execution
- Check file patterns: `if [[ "$1" == *.js ]]; then`
- Check git context: `git status --porcelain`
- Respect skip flags: Allow `--skip-hooks` overrides

### Error Handling
- Exit with code 1 on failure
- Provide clear error messages
- Suggest fixes when possible

---

## Environment in Hooks

Hooks have access to:
- Git context: `$GIT_BRANCH`, `$CHANGED_FILES`
- File being saved: `%file%` in post-save hooks
- Project root: `$PWD`
- Node/npm: Available in PATH

---

## Disabling Hooks

When needed, skip hooks:
```bash
git commit --no-verify     # Skip pre-commit hook
```

Or disable in settings temporarily:
```json
{
  "hooks": {
    "enabled": false
  }
}
```

---

## Future Automation

Planned integrations:
- Auto-run agents on PR open
- Auto-validate capacity parity
- Auto-generate changelogs
- Auto-detect and fix common linting issues
- Auto-suggest refactoring patterns
