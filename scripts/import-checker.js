#!/usr/bin/env node

/**
 * check:imports
 * Scans core/, utils/, and portals/ JS files for missing ESM imports.
 * Improved to handle object literal properties and intentional bridges in main.js.
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT_DIRS = ['core', 'utils', 'portals']
const KNOWN_CROSS_MODULE_SYMBOLS = [
  'db',
  'currentUser',
  'currentSection',
  'progId',
  'navigate',
  'render',
  'supa',
  'supabase',
  'appState',
  'showToast',
  'createRealtimeSubscription',
  'capacityTab',
  'productionTab',
  'productDevelopmentTab',
  'currentUserRole',
  'currentUserPermissions'
]

function toPosix(filePath) {
  return String(filePath || '').replace(/\\/g, '/')
}

function shouldSkipFile(filePath) {
  const normalized = toPosix(filePath)
  return (
    normalized.includes('/tests/') ||
    normalized.includes('/scripts/') ||
    /\.test\.js$/i.test(normalized) ||
    /\.spec\.js$/i.test(normalized) ||
    normalized.includes('cdn')
  )
}

function walkJsFiles(rootDir) {
  const files = []
  const fullRoot = path.resolve(rootDir)
  if (!fs.existsSync(fullRoot)) return files

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
        continue
      }
      if (!entry.name.endsWith('.js')) continue
      if (shouldSkipFile(fullPath)) continue
      files.push(fullPath)
    }
  }

  walk(fullRoot)
  return files
}

function sanitizeForScan(source) {
  // Replace comments and strings with spaces to maintain indices
  return source
    .replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))
    .replace(/\/\/.*/g, m => ' '.repeat(m.length))
    .replace(/(['"`])(?:\\.|[^\\])*?\1/g, m => ' '.repeat(m.length))
}

function collectDeclaredNames(raw) {
  const declared = new Set()
  
  // 1. Regular declarations
  const declRegex = /\b(?:const|let|var|function|class|export\s+(?:const|let|var|function|class))\s+([A-Za-z_$][\w$]*)/g
  let m
  while ((m = declRegex.exec(raw)) !== null) {
    declared.add(m[1])
  }

  // 2. Simple imports: import { a, b } from '...'
  const importRegex = /\bimport\s*\{([^}]+)\}\s*from/g
  while ((m = importRegex.exec(raw)) !== null) {
    m[1].split(',').forEach(s => {
      const name = s.trim().split(/\s+as\s+/)[0].trim()
      if (name) declared.add(name)
      const alias = s.trim().split(/\s+as\s+/)[1]
      if (alias) declared.add(alias.trim())
    })
  }

  // 3. Default and Namespace imports
  const defaultImportRegex = /\bimport\s+([A-Za-z_$][\w$]*)\s+from/g
  while ((m = defaultImportRegex.exec(raw)) !== null) {
    declared.add(m[1])
  }
  
  const namespaceImportRegex = /\bimport\s*\*\s*as\s+([A-Za-z_$][\w$]*)\s+from/g
  while ((m = namespaceImportRegex.exec(raw)) !== null) {
    declared.add(m[1])
  }

  return declared
}

function findViolations(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const sanitized = sanitizeForScan(raw)
  const declared = collectDeclaredNames(raw)
  const violations = []
  const isMain = filePath.endsWith('main.js')

  // Check for window/globalThis assignments (discouraged in ESM, except main.js)
  if (!isMain) {
    const assignmentRegex = /\b(?:window|globalThis)\.([A-Za-z_$][\w$]*)\s*=/g
    let match
    while ((match = assignmentRegex.exec(sanitized)) !== null) {
      const line = raw.substring(0, match.index).split('\n').length
      violations.push({
        filePath,
        line,
        snippet: raw.split('\n')[line - 1].trim(),
        fix: `Avoid global assignment: export const ${match[1]} = ...`
      })
    }
  }

  // Check for missing imports of known cross-module symbols
  for (const symbol of KNOWN_CROSS_MODULE_SYMBOLS) {
    if (declared.has(symbol)) continue
    
    // Look for bare usage: symbol(...) or symbol.prop or [symbol]
    const bareRegex = new RegExp(`\\b${symbol}\\b`, 'g')
    let match
    while ((match = bareRegex.exec(sanitized)) !== null) {
      const index = match.index
      
      // Ignore if it's a property access (e.g. obj.symbol)
      if (sanitized[index - 1] === '.') continue
      
      // Ignore if it's a property definition in an object literal (e.g. { symbol: ... })
      // Check for a colon following the symbol, but NOT a double colon (NPI tab keys)
      const after = sanitized.substring(index + symbol.length).trim()
      if (after.startsWith(':') && !after.startsWith('::')) {
          // It's a key in an object literal or a label
          continue
      }

      const line = raw.substring(0, index).split('\n').length
      const original = raw.split('\n')[line - 1].trim()
      
      // Filter out some false positives
      if (!original || /^import\b/.test(original) || /^export\b/.test(original)) continue
      
      violations.push({
        filePath,
        line,
        snippet: original,
        fix: `Missing import: import { ${symbol} } from '...'`
      })
      break // one violation per symbol per file is enough
    }
  }

  return violations
}

function main() {
  const files = ROOT_DIRS.flatMap(walkJsFiles).sort()
  console.log(`[check:imports] Scanning ${files.length} files...`)

  const violations = []
  for (const file of files) {
    violations.push(...findViolations(file))
  }

  if (violations.length === 0) {
    console.log('[check:imports] 0 violations found.')
    process.exit(0)
  }

  violations.forEach(v => {
    const rel = toPosix(path.relative(process.cwd(), v.filePath))
    console.log(`[check:imports] FAIL: ${rel}:${v.line}`)
    console.log(`  ${v.snippet}`)
    console.log(`  ${v.fix}`)
  })

  console.log(`[check:imports] ${violations.length} violations found.`)
  process.exit(1)
}

main()
