#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const ROOT_DIRS = ['core', 'utils', 'portals']
const BAR_WIDTH = 20

function toPosixPath(filePath) {
  return filePath.replace(/\\/g, '/')
}

function walkJsFiles(dirPath) {
  const files = []
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkJsFiles(fullPath))
      return
    }
    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath)
    }
  })

  return files
}

function hasExportStatement(content) {
  return /\bexport\s+(?:\*|default|\{|\w+)/.test(content)
}

function renderProgressBar(percent) {
  const filled = Math.round((percent / 100) * BAR_WIDTH)
  return '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled)
}

function main() {
  try {
    const allFiles = ROOT_DIRS.flatMap(dir => walkJsFiles(path.resolve(process.cwd(), dir)))
      .map(file => path.relative(process.cwd(), file))
      .map(toPosixPath)
      .sort((a, b) => a.localeCompare(b))

    const convertedFiles = []
    const remainingFiles = []

    allFiles.forEach(file => {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')
      if (hasExportStatement(content)) {
        convertedFiles.push(file)
      } else {
        remainingFiles.push(file)
      }
    })

    const total = allFiles.length
    const converted = convertedFiles.length
    const percent = total === 0 ? 0 : Math.round((converted / total) * 100)

    console.log(`[esm-coverage] Progress: ${converted}/${total} files converted (${percent}%)`)
    console.log(`${renderProgressBar(percent)}  ${percent}%`)
    console.log('')
    console.log('Remaining files:')

    if (remainingFiles.length === 0) {
      console.log('  (none)')
    } else {
      remainingFiles.forEach(file => console.log(`  ${file}`))
    }
  } catch (error) {
    console.error('[esm-coverage] Failed to calculate coverage:', error.message)
  }

  process.exit(0)
}

main()
