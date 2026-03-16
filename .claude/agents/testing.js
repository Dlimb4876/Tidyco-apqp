#!/usr/bin/env node
/**
 * testing agent
 *
 * Runs `npm test` and prints a short JSON summary to stdout.
 *
 * Usage:
 *   node .claude/agents/testing.js
 *   echo '{"context":"commit abc123"}' | node .claude/agents/testing.js
 *
 * Exit codes: 0 = tests passed, 1 = tests failed.
 */

'use strict'

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const REPO_ROOT = path.resolve(__dirname, '..', '..')

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

let ok = true
let output = ''

try {
  output = execSync('npm test --silent', { cwd: REPO_ROOT, encoding: 'utf8', stdio: 'pipe' }).trim()
} catch (err) {
  ok = false
  output = ((err.stdout || '') + (err.stderr || '')).trim()
}

// Extract a brief summary line from Jest output (e.g. "Tests: 179 passed, 179 total")
const summaryMatch = output.match(/Tests?:.*/)
const briefSummary = summaryMatch ? summaryMatch[0] : ok ? 'Tests passed.' : 'Tests failed.'

const result = {
  title: 'testing',
  status: ok ? 'success' : 'failure',
  summary: briefSummary,
  output: output.slice(-2000), // keep last 2000 chars to avoid huge payloads
  context: payload,
  timestamp: new Date().toISOString(),
}

process.stdout.write(JSON.stringify(result, null, 2) + '\n')

process.exit(ok ? 0 : 1)
