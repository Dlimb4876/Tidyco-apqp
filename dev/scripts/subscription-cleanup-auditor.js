#!/usr/bin/env node

/**
 * Subscription Cleanup Auditor
 * Finds createRealtimeSubscription() calls and verifies matching cleanup.
 * Prevents memory leaks from unsubscribed channels.
 */

const fs = require('fs');
const path = require('path');

const PERSISTENT_SUBSCRIPTIONS = [
  {
    file: 'core/js/db.js',
    channel: 'global_projects_channel'
  }
];

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

function normalizeToken(token) {
  const value = String(token || '').trim();
  if (!value) return '';

  const quoted = value.match(/^['"](.+?)['"]$/);
  if (quoted) return quoted[1];

  return value.replace(/\s+/g, ' ');
}

function isPersistentSubscription(filePath, channel) {
  const normalizedFile = normalizePath(filePath);
  const normalizedChannel = normalizeToken(channel);
  return PERSISTENT_SUBSCRIPTIONS.some((entry) => {
    return entry.file === normalizedFile && entry.channel === normalizedChannel;
  });
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const subscriptions = [];
  const cleanups = [];
  const prefixCleanups = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (
      trimmed.startsWith('//') ||
      trimmed.includes('function createRealtimeSubscription') ||
      trimmed.includes('typeof createRealtimeSubscription')
    ) {
      return;
    }

    // Find real createRealtimeSubscription calls.
    if (/\bcreateRealtimeSubscription\s*\(/.test(trimmed)) {
      let callBuffer = trimmed;
      for (let offset = 1; offset <= 8; offset += 1) {
        if (/createRealtimeSubscription\s*\(\s*[\s\S]*?,\s*[\s\S]*?(?:,|\))/.test(callBuffer)) break;
        const nextLine = lines[idx + offset];
        if (typeof nextLine !== 'string') break;
        callBuffer += ` ${nextLine.trim()}`;
      }

      const refMatch = /([\w.]+)\s*=\s*createRealtimeSubscription\s*\(/.exec(callBuffer);
      const channelMatch = /createRealtimeSubscription\s*\(\s*[^,]+,\s*([^,]+?)\s*(?:,|\))/.exec(callBuffer);
      const refName = refMatch ? normalizeToken(refMatch[1]) : '';
      const channel = channelMatch ? normalizeToken(channelMatch[1]) : '';
      subscriptions.push({
        line: idx + 1,
        variable: refName,
        channel,
        code: line.trim()
      });
    }

    // Find removeRealtimeSubscription calls
    if (/\bremoveRealtimeSubscription\s*\(/.test(trimmed)) {
      const match = /removeRealtimeSubscription\s*\(\s*([^\)]+?)\s*\)/.exec(trimmed);
      const varName = match ? normalizeToken(match[1]) : 'unknown';
      cleanups.push({
        line: idx + 1,
        variable: varName,
        code: line.trim()
      });
    }

    if (/\bremoveRealtimeSubscriptionsMatching\s*\(/.test(trimmed)) {
      const match = /removeRealtimeSubscriptionsMatching\s*\(\s*([^\)]+?)\s*\)/.exec(trimmed);
      const pattern = match ? normalizeToken(match[1]) : 'unknown';
      prefixCleanups.push({
        line: idx + 1,
        pattern,
        code: line.trim()
      });
    }
  });

  return { subscriptions, cleanups, prefixCleanups };
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
    const { subscriptions, cleanups, prefixCleanups } = analyzeFile(file);

    if (subscriptions.length > 0) {
      console.log(`\n📡 ${file} (${subscriptions.length} subscription${subscriptions.length !== 1 ? 's' : ''})`);

      subscriptions.forEach(sub => {
        const hasDirectCleanup = cleanups.some(c => {
          return c.variable === sub.channel || (sub.variable && c.variable === sub.variable);
        });
        const hasPrefixCleanup = prefixCleanups.some(c => {
          return sub.channel && sub.channel.startsWith(c.pattern);
        });
        const isPersistent = isPersistentSubscription(file, sub.channel);
        const hasCleanup = hasDirectCleanup || hasPrefixCleanup || isPersistent;
        const status = hasCleanup ? '✅' : '❌';
        const label = sub.channel || sub.variable || 'unknown';
        console.log(`  ${status} Line ${sub.line}: ${label}`);
        console.log(`     ${sub.code.substring(0, 80)}${sub.code.length > 80 ? '...' : ''}`);

        if (!hasCleanup) {
          uncleanedSubscriptions.push({
            file,
            variable: label,
            line: sub.line
          });
        }
      });

      if (cleanups.length > 0 || prefixCleanups.length > 0) {
        console.log(`\n  Cleanups found:`);
        cleanups.forEach(cleanup => {
          console.log(`    Line ${cleanup.line}: removeRealtimeSubscription(${cleanup.variable})`);
        });
        prefixCleanups.forEach(cleanup => {
          console.log(`    Line ${cleanup.line}: removeRealtimeSubscriptionsMatching(${cleanup.pattern})`);
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
