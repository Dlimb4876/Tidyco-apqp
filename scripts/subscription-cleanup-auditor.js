#!/usr/bin/env node

/**
 * Subscription Cleanup Auditor
 * Finds createRealtimeSubscription() calls and verifies matching cleanup.
 * Prevents memory leaks from unsubscribed channels.
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
  const subscriptions = [];
  const cleanups = [];

  lines.forEach((line, idx) => {
    // Find createRealtimeSubscription calls
    if (line.includes('createRealtimeSubscription')) {
      const match = /(?:const|let)\s+(\w+)\s*=\s*createRealtimeSubscription/.exec(line);
      const varName = match ? match[1] : 'unnamed';
      subscriptions.push({
        line: idx + 1,
        variable: varName,
        code: line.trim()
      });
    }

    // Find removeRealtimeSubscription calls
    if (line.includes('removeRealtimeSubscription')) {
      const match = /removeRealtimeSubscription\s*\(\s*(\w+)\s*\)/.exec(line);
      const varName = match ? match[1] : 'unknown';
      cleanups.push({
        line: idx + 1,
        variable: varName,
        code: line.trim()
      });
    }
  });

  return { subscriptions, cleanups };
}

function main() {
  const jsFiles = walkDir('.');
  const filesToCheck = jsFiles.filter(f => {
    const normalized = normalizePath(f)
    return (normalized.startsWith('portals/') || normalized.startsWith('core/') || normalized.startsWith('utils/')) &&
    !f.includes('test')
  })

  console.log(`\n🔁 Subscription Cleanup Auditor\n${'═'.repeat(40)}\n`);
  console.log(`Scanning ${filesToCheck.length} JS files for subscriptions...\n`);

  let totalSubscriptions = 0;
  let uncleanedSubscriptions = [];

  filesToCheck.forEach(file => {
    const { subscriptions, cleanups } = analyzeFile(file);

    if (subscriptions.length > 0) {
      console.log(`\n📡 ${file} (${subscriptions.length} subscription${subscriptions.length !== 1 ? 's' : ''})`);

      subscriptions.forEach(sub => {
        const hasCleanup = cleanups.some(c => c.variable === sub.variable);
        const status = hasCleanup ? '✅' : '❌';
        console.log(`  ${status} Line ${sub.line}: ${sub.variable}`);
        console.log(`     ${sub.code.substring(0, 80)}${sub.code.length > 80 ? '...' : ''}`);

        if (!hasCleanup) {
          uncleanedSubscriptions.push({
            file,
            variable: sub.variable,
            line: sub.line
          });
        }
      });

      if (cleanups.length > 0) {
        console.log(`\n  Cleanups found:`);
        cleanups.forEach(cleanup => {
          console.log(`    Line ${cleanup.line}: removeRealtimeSubscription(${cleanup.variable})`);
        });
      }

      totalSubscriptions += subscriptions.length;
    }
  });

  console.log(`\n${'─'.repeat(40)}\n`);
  console.log(`📊 Summary:\n`);
  console.log(`  Total subscriptions: ${totalSubscriptions}`);
  console.log(`  Uncleaned subscriptions: ${uncleanedSubscriptions.length}\n`);

  if (uncleanedSubscriptions.length > 0) {
    console.log(`❌ MEMORY LEAK RISK:\n`);
    uncleanedSubscriptions.forEach(sub => {
      console.log(`  ${sub.file}:${sub.line} — ${sub.variable}`);
      console.log(`    → Missing: removeRealtimeSubscription(${sub.variable})\n`);
    });

    console.log(`\n📋 CLEANUP PATTERN:\n`);
    console.log(`  When leaving a portal or closing a feature:\n`);
    console.log(`  1. Store subscription reference: const subRef = createRealtimeSubscription(...)`);
    console.log(`  2. Add cleanup on navigate: removeRealtimeSubscription(subRef)`);
    console.log(`  3. Or use navigate() function which auto-cleans known features\n`);
  } else {
    console.log(`✅ All subscriptions have cleanup handlers!\n`);
  }

  console.log(`${'─'.repeat(40)}\n`);
  console.log(`🔍 KNOWN FEATURES WITH AUTO-CLEANUP (via navigate()):\n`);
  console.log(`  - capacity`);
  console.log(`  - product-development`);
  console.log(`  - bugreports`);
  console.log(`  - production`);
  console.log(`  - operations\n`);

  process.exit(uncleanedSubscriptions.length > 0 ? 1 : 0);
}

main();
