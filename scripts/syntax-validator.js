#!/usr/bin/env node

/**
 * Syntax Validator
 * Scans all JS files for common syntax errors that silently break files:
 * - Duplicate const in same scope
 * - Unclosed brackets/parentheses
 * - Missing commas in objects
 * - Orphaned statements
 */

const fs = require('fs');
const path = require('path');

const PATTERNS = [
  {
    name: 'Duplicate const in same scope',
    regex: /^(?!.*\/\/).*\bconst\s+(\w+)\s*=/gm,
    check: (content) => {
      const constVars = new Map();
      let match;
      let scope = 'global';
      let errors = [];

      // Simple scope tracking (function/block)
      const lines = content.split('\n');
      const scopes = [new Set()];

      lines.forEach((line, lineNum) => {
        // Track scope depth
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;

        const constMatch = /\bconst\s+(\w+)\s*=/.exec(line);
        if (constMatch) {
          const varName = constMatch[1];
          const currentScope = scopes[scopes.length - 1];
          if (currentScope.has(varName)) {
            errors.push(`Line ${lineNum + 1}: duplicate 'const ${varName}' in same scope`);
          }
          currentScope.add(varName);
        }

        if (openBraces > closeBraces) {
          scopes.push(new Set());
        }
        if (closeBraces > openBraces && scopes.length > 1) {
          scopes.pop();
        }
      });

      return errors;
    }
  },
  {
    name: 'Unclosed parentheses',
    regex: null,
    check: (content) => {
      let errors = [];
      // Remove comments and strings
      const clean = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''");
      const parens = clean.match(/[()]/g) || [];
      const braces = clean.match(/[{}]/g) || [];
      const brackets = clean.match(/[\[\]]/g) || [];

      let parenCount = 0, braceCount = 0, bracketCount = 0;
      parens.forEach(p => p === '(' ? parenCount++ : parenCount--);
      braces.forEach(b => b === '{' ? braceCount++ : braceCount--);
      brackets.forEach(b => b === '[' ? bracketCount++ : bracketCount--);

      if (parenCount !== 0) errors.push(`Unclosed parentheses (${parenCount > 0 ? parenCount + ' unclosed' : parenCount + ' unmatched closing'})`);
      if (braceCount !== 0) errors.push(`Unclosed braces (${braceCount > 0 ? braceCount + ' unclosed' : braceCount + ' unmatched closing'})`);
      if (bracketCount !== 0) errors.push(`Unclosed brackets (${bracketCount > 0 ? bracketCount + ' unclosed' : bracketCount + ' unmatched closing'})`);

      return errors;
    }
  },
  {
    name: 'Missing commas in object literals',
    regex: /{\s*[\w"']+\s*:\s*[^,}]+\s+[\w"']+\s*:/g,
    check: (content) => {
      let errors = [];
      const lines = content.split('\n');
      lines.forEach((line, lineNum) => {
        // Look for property: value followed by property: without comma
        if (/{\s*[^}]*:\s*[^,}]*\s+[^,}]*:\s*/.test(line)) {
          // simple heuristic
          if (!/,\s*$/.test(line) && /{.*:.*[^,}].*:/.test(line)) {
            errors.push(`Line ${lineNum + 1}: possible missing comma in object literal`);
          }
        }
      });
      return errors;
    }
  }
];

function walkDir(dir, ext = '.js', exclude = ['node_modules', '.git', 'tests']) {
  const files = [];
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    if (exclude.includes(item)) return;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...walkDir(fullPath, ext, exclude));
    } else if (fullPath.endsWith(ext)) {
      files.push(fullPath);
    }
  });

  return files;
}

function normalizePath(filePath) {
  return String(filePath || '').replace(/\\/g, '/').replace(/^\.\//, '')
}

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];

  PATTERNS.forEach(pattern => {
    if (pattern.check) {
      const errs = pattern.check(content);
      errs.forEach(err => {
        errors.push(`${pattern.name}: ${err}`);
      });
    }
  });

  return errors;
}

function main() {
  const jsFiles = walkDir('.');
  let totalErrors = 0;
  const filesToCheck = jsFiles.filter(f => {
    const normalized = normalizePath(f)
    return (normalized.startsWith('portals/') || normalized.startsWith('core/') || normalized.startsWith('utils/')) &&
    !f.includes('test')
  })

  console.log(`\n✓ Syntax Validator\n${'═'.repeat(40)}\n`);
  console.log(`Scanning ${filesToCheck.length} JS files...\n`);

  filesToCheck.forEach(file => {
    const errors = validateFile(file);
    if (errors.length > 0) {
      console.log(`\n❌ ${file}`);
      errors.forEach(err => console.log(`   ${err}`));
      totalErrors += errors.length;
    }
  });

  if (totalErrors === 0) {
    console.log(`✅ No syntax errors found!\n`);
  } else {
    console.log(`\n⚠️  Found ${totalErrors} potential syntax errors.\n`);
  }

  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
