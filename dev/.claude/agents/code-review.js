#!/usr/bin/env node
/**
 * code-review agent
 *
 * Runs `npm run lint:npi` and `npm test`, then prints a JSON summary to stdout
 * and writes a dated log to .claude/agents/logs/code-review-YYYYMMDD.log.
 *
 * Usage:
 *   node .claude/agents/code-review.js
 *   echo '{"context":"PR #42"}' | node .claude/agents/code-review.js
 *
 * Exit codes: 0 = all checks passed, 1 = one or more checks failed.
 */

'use strict'

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const REPO_ROOT = path.resolve(__dirname, '..', '..')
const LOGS_DIR = path.join(__dirname, 'logs')

function today() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '')
}

function run(cmd) {
  try {
    const output = execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8', stdio: 'pipe' })
    return { ok: true, output: output.trim() }
  } catch (err) {
    return { ok: false, output: (err.stdout || '') + (err.stderr || '') }
  }
}

// Read optional JSON payload from stdin (cross-platform: use fd 0)
let payload = {}
if (!process.stdin.isTTY) {
  try {
    const raw = fs.readFileSync(0, 'utf8') // fd 0 = stdin, works on Linux, macOS, Windows
    if (raw.trim()) payload = JSON.parse(raw.trim())
  } catch (_) {
    // ignore parse errors — payload is optional
  }
}

const checks = []

// 1. Lint (NPI JS files)
const lint = run('npm run lint:npi --silent')
checks.push({ name: 'lint', passed: lint.ok, output: lint.output })

// 2. Tests
const test = run('npm test --silent')
checks.push({ name: 'test', passed: test.ok, output: test.output })

const allPassed = checks.every((c) => c.passed)
const summary = {
  title: 'code-review',
  status: allPassed ? 'success' : 'failure',
  summary: allPassed
    ? 'All checks passed.'
    : `${checks.filter((c) => !c.passed).map((c) => c.name).join(', ')} failed.`,
  checks,
  context: payload,
  timestamp: new Date().toISOString(),
}

// Write log file
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true })
const logFile = path.join(LOGS_DIR, `code-review-${today()}.log`)
fs.appendFileSync(logFile, JSON.stringify(summary, null, 2) + '\n\n', 'utf8')

// Print machine-readable result to stdout
process.stdout.write(JSON.stringify(summary, null, 2) + '\n')

process.exit(allPassed ? 0 : 1)
