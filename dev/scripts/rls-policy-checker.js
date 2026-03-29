#!/usr/bin/env node

/**
 * RLS Policy Checker
 * Verifies every Supabase table has RLS enabled and policies that allow authenticated users.
 * This is a template/checklist for manual verification since we can't query Supabase directly.
 */

import fs from 'node:fs'
import path from 'node:path'

// Known tables from CLAUDE.md and code analysis
const EXPECTED_TABLES = [
  'projects',
  'families',
  'family_pfmea_templates',
  'me_teams',
  'me_tasks',
  'me_products',
  'production_batches',
  'products',
  'product_overhaul_history',
  'bug_reports',
  'operations_forecast_opportunities',
  'me_capacity',
  'work_areas'
]

// Standard RLS policy template
const RLS_TEMPLATE = `
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_{table_name}"
ON {table_name} FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_insert_{table_name}"
ON {table_name} FOR INSERT
WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "authenticated_update_{table_name}"
ON {table_name} FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_delete_{table_name}"
ON {table_name} FOR DELETE
USING (auth.role() = 'authenticated');
`

// Search for table references in code
function findTableReferences() {
  const jsFiles = walkDir('.')
  const references = new Map()

  jsFiles.forEach(file => {
    if (file.includes('test') || file.includes('node_modules')) return

    const content = fs.readFileSync(file, 'utf8')

    EXPECTED_TABLES.forEach(table => {
      // Look for .from(table) patterns
      if (content.includes(`.from('${table}')`)) {
        if (!references.has(table)) references.set(table, [])
        references.get(table).push(file)
      }
    })
  })

  return references
}

function walkDir(dir, exclude = ['node_modules', '.git', 'tests']) {
  const files = []
  const items = fs.readdirSync(dir)

  items.forEach(item => {
    if (exclude.includes(item)) return
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      files.push(...walkDir(fullPath, exclude))
    } else if (fullPath.endsWith('.js')) {
      files.push(fullPath)
    }
  })

  return files
}

function main() {
  console.log(`\n🔐 RLS Policy Checker\n${'═'.repeat(40)}\n`)

  const references = findTableReferences()

  console.log(`Found ${references.size} tables being queried in code:\n`)

  references.forEach((files, table) => {
    console.log(`\n✓ ${table}`)
    console.log(`  Used in: ${files.length} file(s)`)
    files.slice(0, 3).forEach(f => console.log(`    - ${f}`))
    if (files.length > 3) console.log(`    ... and ${files.length - 3} more`)
  })

  // Find tables with no code references (possible schema-only tables)
  const missing = EXPECTED_TABLES.filter(t => !references.has(t))
  if (missing.length > 0) {
    console.log(`\n⚠️  Tables with no code references (verify in Supabase console):\n`)
    missing.forEach(t => console.log(`  - ${t}`))
  }

  console.log(`\n${'─'.repeat(40)}\n`)
  console.log(`📋 MANUAL VERIFICATION CHECKLIST:\n`)
  console.log(`For each table above, verify in Supabase console:\n`)
  console.log(`  1. [ ] RLS is ENABLED (ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;)`)
  console.log(`  2. [ ] Has policy: "Allow authenticated SELECT"`)
  console.log(`  3. [ ] Has policy: "Allow authenticated INSERT (with user_id check)"`)
  console.log(`  4. [ ] Has policy: "Allow authenticated UPDATE"`)
  console.log(`  5. [ ] Has policy: "Allow authenticated DELETE" (if needed)\n`)

  console.log(`${'─'.repeat(40)}\n`)
  console.log(`📝 POLICY TEMPLATE:\n`)
  console.log(`Use this as a template for new tables:\n`)
  console.log(RLS_TEMPLATE)
  console.log(`\n${'─'.repeat(40)}\n`)

  console.log(`🔗 To check policies manually:\n`)
  console.log(`  1. Open Supabase console → Database → Tables`)
  console.log(`  2. Click table → RLS policies tab`)
  console.log(`  3. Verify ENABLE RLS is ON`)
  console.log(`  4. Verify all expected policies exist\n`)

  console.log(`⚠️  COMMON MISTAKES:\n`)
  console.log(`  ❌ New table without RLS policy → queries return [] silently`)
  console.log(`  ❌ RLS disabled → all data readable by unauthenticated users`)
  console.log(`  ❌ Policy filters by user_id on client side → defeats purpose of RLS\n`)
}

main()
