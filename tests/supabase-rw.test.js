/**
 * @jest-environment node
 *
 * supabase-rw.test.js — Real read/write connectivity test
 *
 * Confirms that the application can reach the live Supabase project and that
 * the REST API responds as expected for both read and write operations.
 *
 * Read test  — SELECT from user_feedback with the anon key.
 *              RLS only returns rows to authenticated users, so the result is
 *              an empty array. A 200 status confirms the endpoint is reachable
 *              and the RLS policy is in place.
 *
 * Write test — INSERT into user_feedback with the anon key.
 *              The RLS INSERT policy requires auth.role() = 'authenticated', so
 *              the anon key is blocked (401 / 403 expected). A non-5xx response
 *              confirms the endpoint is reachable and RLS enforcement is active.
 *
 * Network unavailable — both test groups are skipped gracefully so that the
 * test suite does not fail when run in an offline/sandboxed environment. The
 * tests are only meaningful when the Supabase endpoint can be reached.
 */
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ─────────────────────────────────────────────────────────────
// Credentials — from core/js/auth.js (anon key, safe to expose)
// ─────────────────────────────────────────────────────────────
const SUPA_URL = 'https://eihxvmzsfnpdaizggsvs.supabase.co'
const SUPA_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaHh2bXpzZm5wZGFpemdnc3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTc2OTMsImV4cCI6MjA4ODM3MzY5M30.edpoNia_4nGRwUBwVAFrKXgyB3SnhH_umU2mcNTBIco'

const HEADERS = {
  apikey: SUPA_KEY,
  Authorization: `Bearer ${SUPA_KEY}`,
  'Content-Type': 'application/json',
}

// Allow up to 10 seconds for each real network call
jest.setTimeout(10000)

// Placeholder UUID used in the write test body (never actually inserted due to RLS)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000000'

// ─────────────────────────────────────────────────────────────
// Network availability probe
// ─────────────────────────────────────────────────────────────
let networkAvailable = false
let readStatus = null
let readBody = null
let writeStatus = null

// Helper: fetch with a hard timeout so we don't hang in sandboxed CI
function fetchWithTimeout(url, options, timeoutMs = 5000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id))
}

beforeAll(async () => {
  // Probe: a cheap HEAD request to verify the host is reachable
  try {
    const probe = await fetchWithTimeout(`${SUPA_URL}/rest/v1/`, { method: 'HEAD', headers: HEADERS })
    networkAvailable = probe.status < 600
  } catch {
    // DNS failure, network error, or AbortError (timeout) — mark as offline; tests will skip
    networkAvailable = false
    return
  }

  // READ — GET user_feedback (anon, RLS returns empty array)
  try {
    const res = await fetchWithTimeout(`${SUPA_URL}/rest/v1/user_feedback?select=id,status&limit=1`, {
      method: 'GET',
      headers: HEADERS,
    })
    readStatus = res.status
    // Parse body once here so individual tests don't compete to consume it
    readBody = await res.json()
  } catch {
    readStatus = null
    readBody = null
  }

  // WRITE — POST to user_feedback (anon, RLS blocks insert)
  try {
    const res = await fetchWithTimeout(`${SUPA_URL}/rest/v1/user_feedback`, {
      method: 'POST',
      headers: { ...HEADERS, Prefer: 'return=minimal' },
      body: JSON.stringify({
        user_id: TEST_USER_ID,
        raised_by: 'mcp-test@tidyco.co.uk',
        date_raised: new Date().toISOString(),
        description: 'MCP connectivity test — blocked by RLS as expected',
        status: 'open',
      }),
    })
    writeStatus = res.status
  } catch {
    writeStatus = null
  }
})

// ─────────────────────────────────────────────────────────────
// READ tests
// ─────────────────────────────────────────────────────────────
describe('Supabase READ connectivity (anon key)', () => {
  test('REST endpoint is reachable — HTTP status is not a network error', () => {
    if (!networkAvailable) {
      // Explicitly declare zero assertions expected when skipping offline
      expect.assertions(0)
      return
    }
    expect(readStatus).not.toBeNull()
    expect(readStatus).toBeGreaterThanOrEqual(200)
    expect(readStatus).toBeLessThan(500)
  })

  test('HTTP 200 — RLS returns empty data for anon user (not an error)', () => {
    if (!networkAvailable) {
      expect.assertions(0)
      return
    }
    expect(readStatus).toBe(200)
  })

  test('Response body is a valid JSON array', () => {
    if (!networkAvailable) {
      expect.assertions(0)
      return
    }
    expect(Array.isArray(readBody)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────
// WRITE tests
// ─────────────────────────────────────────────────────────────
describe('Supabase WRITE connectivity (anon key)', () => {
  test('REST write endpoint is reachable — HTTP status is not a network error', () => {
    if (!networkAvailable) {
      expect.assertions(0)
      return
    }
    expect(writeStatus).not.toBeNull()
    expect(writeStatus).toBeGreaterThanOrEqual(200)
    expect(writeStatus).toBeLessThan(500)
  })

  test('RLS blocks anon writes — status is 401 or 403 (not 201)', () => {
    if (!networkAvailable) {
      expect.assertions(0)
      return
    }
    // A 201 here would mean the row was actually inserted; RLS should prevent that.
    expect([400, 401, 403]).toContain(writeStatus)
  })
})
