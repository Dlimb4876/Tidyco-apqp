#!/usr/bin/env node
/**
 * debugging agent
 *
 * Reads a JSON payload from stdin (or the DEBUG_PAYLOAD env var) describing a
 * test failure or error. Returns a short JSON object with heuristic likely-causes
 * and suggested next steps.
 *
 * Usage:
 *   echo '{"failingTest":"db.test.js","error":"Cannot read properties of undefined"}' \
 *     | node .claude/agents/debugging.js
 *
 *   DEBUG_PAYLOAD='{"error":"duplicate const"}' node .claude/agents/debugging.js
 *
 * Exit codes: 0 = diagnostics produced, 1 = could not parse input.
 */

'use strict'

const fs = require('fs')

// ── Heuristic rules ────────────────────────────────────────────────────────────
const HEURISTICS = [
  {
    pattern: /duplicate\s+const|identifier.*already.*declared/i,
    cause: 'Duplicate `const` declaration in the same scope',
    fix: 'Search the file for the variable name and remove the second declaration. See CLAUDE.md rule #2.',
  },
  {
    pattern: /cannot read prop.*undefined|is not a function/i,
    cause: 'A module or function is undefined — likely a script load-order issue or a SyntaxError in the defining file',
    fix: 'Check index.html script order and inspect the defining file for syntax errors. Run: npm test -- --verbose',
  },
  {
    pattern: /supabase|database|postgr/i,
    cause: 'Database / Supabase connection or schema issue',
    fix: 'Verify SUPABASE_DB_URL is set. Check .claude/.env.example. Run: supabase status',
  },
  {
    pattern: /rls|policy|permission denied/i,
    cause: 'Row Level Security policy missing or incorrect',
    fix: 'Add: CREATE POLICY "auth" ON <table> FOR ALL USING (auth.role() = \'authenticated\'). See .claude/rules/database.md.',
  },
  {
    pattern: /esc\(|xss|html injection/i,
    cause: 'Possible XSS vulnerability — user data interpolated into HTML without esc()',
    fix: 'Wrap all user-supplied values in esc(). See .claude/rules/security.md.',
  },
  {
    pattern: /timeout|timed out/i,
    cause: 'Test timed out — async code may not be resolving',
    fix: 'Check for missing `await`, unresolved Promises, or real network calls in tests. Run: npm test -- --detectOpenHandles',
  },
  {
    pattern: /import|require|module not found|cannot find module/i,
    cause: 'Missing module or incorrect import path',
    fix: 'Verify the file exists and the path is correct relative to the importing file. Run: node -e "require(\'./path/to/module\')"',
  },
]

// ── Read payload ───────────────────────────────────────────────────────────────
let payload = {}

const envPayload = process.env.DEBUG_PAYLOAD
if (envPayload) {
  try {
    payload = JSON.parse(envPayload)
  } catch (_) {
    process.stderr.write('Warning: DEBUG_PAYLOAD is not valid JSON\n')
  }
} else if (!process.stdin.isTTY) {
  try {
    const raw = fs.readFileSync(0, 'utf8') // fd 0 = stdin, works on Linux, macOS, Windows
    if (raw.trim()) payload = JSON.parse(raw.trim())
  } catch (err) {
    const result = {
      title: 'debugging',
      status: 'error',
      summary: 'Could not parse input payload',
      error: err.message,
      timestamp: new Date().toISOString(),
    }
    process.stdout.write(JSON.stringify(result, null, 2) + '\n')
    process.exit(1)
  }
}

// ── Apply heuristics ───────────────────────────────────────────────────────────
const text = JSON.stringify(payload).toLowerCase()
const matches = HEURISTICS.filter((h) => h.pattern.test(text))

const likelyCauses =
  matches.length > 0
    ? matches.map((m) => ({ cause: m.cause, fix: m.fix }))
    : [
        {
          cause: 'Unknown — no matching heuristic found',
          fix: 'Run `npm test -- --verbose` to see detailed output, then open the failing file and check for syntax errors.',
        },
      ]

const result = {
  title: 'debugging',
  status: 'diagnostics',
  summary: `${likelyCauses.length} likely cause(s) identified`,
  likelyCauses,
  suggestedCommands: [
    'npm test -- --verbose',
    'npm run check:all',
    'grep -rn "const " ./portals/**/*.js | sort | uniq -d',
  ],
  input: payload,
  timestamp: new Date().toISOString(),
}

process.stdout.write(JSON.stringify(result, null, 2) + '\n')

process.exit(0)
