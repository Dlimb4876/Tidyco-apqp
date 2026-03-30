function parseNamedImports(namedBlock) {
  return (namedBlock || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .map((entry) => {
      const asMatch = entry.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/)
      if (asMatch) return asMatch[2]
      return entry
    })
}

function collectExportNames(source) {
  const names = new Set()

  source.replace(/\bexport\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g, (_, name) => {
    names.add(name)
    return ''
  })

  source.replace(/\bexport\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g, (_, name) => {
    names.add(name)
    return ''
  })

  source.replace(/^\s*export\s*\{([^}]*)\}\s*;?\s*$/gm, (_, list) => {
    list.split(',').forEach((part) => {
      const entry = part.trim()
      if (!entry) return
      const asMatch = entry.match(/^[A-Za-z_$][\w$]*\s+as\s+([A-Za-z_$][\w$]*)$/)
      if (asMatch) {
        names.add(asMatch[1])
        return
      }
      if (/^[A-Za-z_$][\w$]*$/.test(entry)) names.add(entry)
    })
    return ''
  })

  return [...names]
}

function collectImportNames(source) {
  const names = new Set()

  source.replace(/^\s*import\s+(.+?)\s+from\s+['\"][^'\"]+['\"]\s*;?\s*$/gm, (_, spec) => {
    const trimmed = spec.trim()

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      parseNamedImports(trimmed.slice(1, -1)).forEach((n) => names.add(n))
      return ''
    }

    const nsMatch = trimmed.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/)
    if (nsMatch) {
      names.add(nsMatch[1])
      return ''
    }

    const defaultAndNamed = trimmed.match(/^([A-Za-z_$][\w$]*)\s*,\s*\{([\s\S]*)\}$/)
    if (defaultAndNamed) {
      names.add(defaultAndNamed[1])
      parseNamedImports(defaultAndNamed[2]).forEach((n) => names.add(n))
      return ''
    }

    if (/^[A-Za-z_$][\w$]*$/.test(trimmed)) {
      names.add(trimmed)
      return ''
    }

    return ''
  })

  return [...names]
}

export function toEvalFriendlyModuleSource(src) {
  if (!src || typeof src !== 'string') return ''

  const exportNames = collectExportNames(src)
  const importNames = collectImportNames(src)

  const importBridge = importNames.length
    ? `${importNames.map((n) => `const ${n} = globalThis.${n}`).join('\n')}\n`
    : ''

  const transformed = src
    .replace(/^\s*import\s+['\"][^'\"]+['\"]\s*;?\s*$/gm, '')
    .replace(/^\s*import\s+[\s\S]*?\s+from\s+['\"][^'\"]+['\"]\s*;?\s*$/gm, '')
    .replace(/^\s*export\s+\{[^}]*\}\s*;?\s*$/gm, '')
    .replace(/\bexport\s+async\s+function\s+/g, 'async function ')
    .replace(/\bexport\s+function\s+/g, 'function ')
    .replace(/\bexport\s+const\s+/g, 'const ')
    .replace(/\bexport\s+let\s+/g, 'let ')
    .replace(/\bexport\s+var\s+/g, 'var ')

  const exportBridge = exportNames.length
    ? `\nObject.assign(globalThis, { ${exportNames.join(', ')} })`
    : ''

  return `${importBridge}${transformed}${exportBridge}`
}
