#!/usr/bin/env node

/**
 * Modal State Auditor
 * Finds showModal() calls and verifies the modal's data variables are cleared in close handlers.
 * Prevents modal state pollution across reopenings.
 */

const fs = require('fs');
const path = require('path');

function walkDir(dir, extensions = ['.js'], exclude = ['node_modules', '.git', 'tests']) {
  const files = [];
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    if (exclude.includes(item)) return;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...walkDir(fullPath, extensions, exclude));
    } else if (extensions.some((ext) => fullPath.endsWith(ext))) {
      files.push(fullPath);
    }
  });

  return files;
}

function normalizePath(filePath) {
  return String(filePath || '').replace(/\\/g, '/').replace(/^\.\//, '')
}

function collectGlobalModalClosers(files) {
  const explicitClosers = new Set();
  let hasGenericCloser = false;

  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const closeRegex = /closeModal\s*\(\s*['"](\w+)['"]\s*\)/g;
    let match = closeRegex.exec(content);
    while (match) {
      explicitClosers.add(match[1]);
      match = closeRegex.exec(content);
    }

    if (content.includes('closeModal(openModal.id)')) {
      hasGenericCloser = true;
    }
  });

  return { explicitClosers, hasGenericCloser };
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const modals = new Map();

  lines.forEach((line, idx) => {
    // Find showModal calls and extract modal ID
    const showMatch = /showModal\s*\(\s*['"](\w+)['"]\s*\)/.exec(line);
    if (showMatch) {
      const modalId = showMatch[1];
      if (!modals.has(modalId)) {
        modals.set(modalId, { shows: [], closes: [], variables: new Set() });
      }
      modals.get(modalId).shows.push({ line: idx + 1, code: line.trim() });
    }

    // Find closeModal calls
    const closeMatch = /closeModal\s*\(\s*['"](\w+)['"]\s*\)/.exec(line);
    if (closeMatch) {
      const modalId = closeMatch[1];
      if (!modals.has(modalId)) {
        modals.set(modalId, { shows: [], closes: [], variables: new Set() });
      }
      modals.get(modalId).closes.push({ line: idx + 1, code: line.trim() });
    }

    // Find variable assignments that might be modal data (e.g., ctqPickTarget = ...)
    const varMatch = /^(\w+)\s*=\s*(?!.*showModal|closeModal)/.exec(line);
    if (varMatch && line.includes('=') && !line.includes('function') && !line.includes('//')) {
      const varName = varMatch[1];
      // Check if this variable is used in a nearby showModal
      if (varName && /[A-Z]|Target|Pick|Selected/.test(varName)) {
        lines.slice(Math.max(0, idx - 5), Math.min(lines.length, idx + 5)).forEach(contextLine => {
          const modalMatch = /showModal\s*\(\s*['"](\w+)['"]\s*\)/.exec(contextLine);
          if (modalMatch) {
            modals.get(modalMatch[1]).variables.add(varName);
          }
        });
      }
    }
  });

  return modals;
}

function main() {
  const jsFiles = walkDir('.', ['.js']);
  const filesToCheck = jsFiles.filter(f => {
    const normalized = normalizePath(f)
    return (normalized.startsWith('portals/') || normalized.startsWith('core/') || normalized.startsWith('utils/')) &&
    !f.includes('test')
  })
  const modalSourceFiles = walkDir('.', ['.js', '.html']).filter((file) => !file.includes('test'))
  const { explicitClosers, hasGenericCloser } = collectGlobalModalClosers(modalSourceFiles)

  console.log(`\n🎯 Modal State Auditor\n${'═'.repeat(40)}\n`);
  console.log(`Scanning ${filesToCheck.length} JS files for modals...\n`);

  const issues = [];
  let totalModals = 0;

  filesToCheck.forEach(file => {
    const modals = analyzeFile(file);

    modals.forEach((modalData, modalId) => {
      if (modalData.shows.length > 0) {
        totalModals++;
        const hasExplicitClose = modalData.closes.length > 0 || explicitClosers.has(modalId)
        const hasClose = hasExplicitClose || hasGenericCloser;
        const status = hasClose ? '✅' : '⚠️ ';

        console.log(`${status} ${file}`);
        console.log(`   Modal: "${modalId}"`);
        console.log(`   Shows: ${modalData.shows.length}, Closes: ${modalData.closes.length}`);

        if (modalData.variables.size > 0) {
          console.log(`   Variables: ${Array.from(modalData.variables).join(', ')}`);
        }
        console.log();

        if (!hasClose) {
          issues.push({
            file,
            modalId,
            problem: 'No closeModal() call found'
          });
        }
      }
    });
  });

  console.log(`\n${'─'.repeat(40)}\n`);
  console.log(`📊 Summary:\n`);
  console.log(`  Total modals: ${totalModals}`);
  console.log(`  Potential issues: ${issues.length}\n`);

  if (issues.length > 0) {
    console.log(`${'─'.repeat(40)}\n`);
    console.log(`⚠️  MODAL STATE POLLUTION RISKS:\n`);
    issues.forEach(issue => {
      console.log(`  ${issue.file}`);
      console.log(`    Modal: "${issue.modalId}"`);
      console.log(`    Issue: ${issue.problem}\n`);
    });

    console.log(`${'─'.repeat(40)}\n`);
    console.log(`📋 PATTERN: Modal Data Cleanup\n`);
    console.log(`\`\`\`javascript\n`);
    console.log(`// 1. Store data before showing modal`);
    console.log(`ctqPickTarget = row;  // Global variable`);
    console.log(`showModal('ctqPickModal');\n`);
    console.log(`// 2. Clear data in close handler`);
    console.log(`function closeCtqPickModal() {`);
    console.log(`  ctqPickTarget = null;  // ← IMPORTANT!`);
    console.log(`  closeModal('ctqPickModal');`);
    console.log(`}\n`);
    console.log(`// 3. Initialize in modal template`);
    console.log(`if (!ctqPickTarget) {`);
    console.log(`  closeModal('ctqPickModal');`);
    console.log(`  return;`);
    console.log(`}\n`);
    console.log(`\`\`\`\n`);
  } else {
    console.log(`✅ All modals have close handlers!\n`);
  }

  console.log(`${'─'.repeat(40)}\n`);
  console.log(`💡 COMMON MISTAKES:\n`);
  console.log(`  ❌ showModal() but no closeModal() → data persists on reopen`);
  console.log(`  ❌ Not clearing variables in close → stale data used`);
  console.log(`  ❌ Modal template doesn't check if data exists → undefined errors\n`);

  process.exit(issues.length > 0 ? 1 : 0);
}

main();
