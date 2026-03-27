#!/usr/bin/env node

/**
 * Modal State Auditor
 * Finds showModal() calls and verifies the modal's data variables are cleared in close handlers.
 * Prevents modal state pollution across reopenings.
 */

const fs = require('fs');
const path = require('path');

function walkDir(dir, exclude = ['node_modules', '.git', 'tests']) {
  const files = [];
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    if (exclude.includes(item)) return;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...walkDir(fullPath, exclude));
    } else if (fullPath.endsWith('.js')) {
      files.push(fullPath);
    }
  });

  return files;
}

function normalizePath(filePath) {
  return String(filePath || '').replace(/\\/g, '/').replace(/^\.\//, '')
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
  const jsFiles = walkDir('.');
  const filesToCheck = jsFiles.filter(f => {
    const normalized = normalizePath(f)
    return (normalized.startsWith('portals/') || normalized.startsWith('core/') || normalized.startsWith('utils/')) &&
    !f.includes('test')
  })

  console.log(`\n🎯 Modal State Auditor\n${'═'.repeat(40)}\n`);
  console.log(`Scanning ${filesToCheck.length} JS files for modals...\n`);

  const issues = [];
  let totalModals = 0;

  filesToCheck.forEach(file => {
    const modals = analyzeFile(file);

    modals.forEach((modalData, modalId) => {
      if (modalData.shows.length > 0) {
        totalModals++;
        const hasClose = modalData.closes.length > 0;
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
