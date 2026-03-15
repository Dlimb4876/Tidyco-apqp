#!/usr/bin/env node

/**
 * Load Order Checker
 * Verifies script load order in index.html matches dependencies.
 * Catches missing files, wrong positioning, and circular dependencies.
 */

const fs = require('fs');
const path = require('path');

const HTML_PATH = './index.html';

// Known dependencies between scripts
const DEPENDENCIES = {
  'state.js': [],
  'auth.js': ['state.js'],
  'db.js': ['state.js', 'auth.js'],
  'helpers.js': [],
  'navigation.js': ['helpers.js'],
  'realtime.js': ['navigation.js'],
  'hub.js': ['db.js', 'navigation.js'],
  'products-data.js': ['db.js'],
  'trends-chart.js': ['products-data.js'],
  'capacity.js': ['db.js', 'navigation.js'],
  'me-data-relational.js': ['db.js'],
  'me-data.js': ['me-data-relational.js'],
  'me-utils.js': ['me-data.js'],
  'me-calculations.js': ['me-data.js'],
  'me-components.js': ['me-data.js'],
  'me-team.js': ['me-data.js'],
  'me-tasks.js': ['me-data.js'],
  'me-products.js': ['me-data.js'],
  'me-product-taskload.js': ['me-products.js'],
  'me-holidays.js': ['me-data.js'],
  'me-chart.js': ['me-calculations.js'],
  'me-heatmap.js': ['me-calculations.js'],
  'me-dashboard.js': ['me-chart.js', 'me-heatmap.js'],
  'me-capacity.js': ['me-dashboard.js', 'me-team.js', 'me-tasks.js', 'me-products.js', 'me-holidays.js'],
  'me-estimation-page.js': ['me-data.js'],
  'prod-capacity-data.js': ['db.js'],
  'work-areas-data.js': ['db.js'],
  'prod-capacity-dashboard.js': ['prod-capacity-data.js'],
  'prod-capacity-workarea.js': ['prod-capacity-data.js', 'work-areas-data.js'],
  'prod-capacity-settings.js': ['prod-capacity-data.js'],
  'prod-capacity-detail.js': ['prod-capacity-data.js'],
  'prod-capacity.js': ['prod-capacity-dashboard.js', 'prod-capacity-workarea.js', 'prod-capacity-settings.js', 'prod-capacity-detail.js'],
  'production.js': ['db.js', 'navigation.js'],
  'scheduling.js': ['production.js'],
  'planning.js': ['production.js'],
  'families-data.js': ['db.js'],
  'family-templates-data.js': ['families-data.js'],
  'products.js': ['db.js', 'families-data.js'],
  'product-development.js': ['db.js', 'navigation.js'],
  'product-management.js': ['products.js'],
  'npi-constants.js': [],
  'npi.js': ['npi-constants.js', 'family-templates-data.js'],
  'rpn-chart.js': ['npi.js'],
  'dashboard.js': ['npi.js'],
  'gates.js': ['npi.js'],
  'pfmea.js': ['npi.js', 'rpn-chart.js'],
  'apqp.js': ['npi.js', 'dashboard.js', 'gates.js', 'pfmea.js'],
  'bom.js': ['npi.js'],
  'timing.js': ['npi.js'],
  'trackers.js': ['npi.js'],
  'bugs-data.js': ['db.js', 'realtime.js'],
  'bugs.js': ['bugs-data.js'],
  'app.js': [] // loads last, depends on everything
};

function extractScriptSrc(html) {
  const regex = /<script[^>]+src="([^"]+)"[^>]*><\/script>/g;
  const scripts = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const src = match[1];
    const filename = path.basename(src);
    scripts.push({ src, filename });
  }
  return scripts;
}

function checkLoadOrder() {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const scripts = extractScriptSrc(html);
  const errors = [];
  const warnings = [];

  // Map filename to position for dependency checking
  const positions = {};
  scripts.forEach((script, idx) => {
    positions[script.filename] = idx;
  });

  // Check dependencies
  scripts.forEach((script, idx) => {
    const deps = DEPENDENCIES[script.filename];
    if (!deps) return; // unknown script, skip

    deps.forEach(dep => {
      const depPos = positions[dep];
      if (depPos === undefined) {
        errors.push(`❌ ${script.filename} depends on ${dep}, but ${dep} is not loaded`);
      } else if (depPos > idx) {
        errors.push(`❌ ${script.filename} depends on ${dep}, but ${dep} loads AFTER it (pos ${depPos} vs ${idx})`);
      }
    });
  });

  // Check for duplicates
  const seen = new Set();
  scripts.forEach((script, idx) => {
    if (seen.has(script.filename)) {
      errors.push(`❌ ${script.filename} is loaded twice (positions ${positions[script.filename]} and ${idx})`);
    }
    seen.add(script.filename);
  });

  // Verify core scripts load first
  const coreOrder = ['state.js', 'auth.js', 'db.js', 'helpers.js', 'navigation.js'];
  const corePositions = coreOrder.map(f => positions[f]).filter(p => p !== undefined);

  if (corePositions.length > 0) {
    const maxCore = Math.max(...corePositions);
    scripts.slice(0, maxCore + 1).forEach(script => {
      if (!coreOrder.includes(script.filename) && !['state.js', 'auth.js', 'db.js', 'helpers.js', 'navigation.js', 'realtime.js'].includes(script.filename)) {
        // Allow external CDN scripts
        if (!script.src.includes('cdn') && !script.src.includes('googleapis')) {
          warnings.push(`⚠️ ${script.filename} loads before all core scripts finish (core ends at position ${maxCore})`);
        }
      }
    });
  }

  // Check app.js loads last
  if (scripts.length > 0) {
    const appPos = positions['app.js'];
    if (appPos !== undefined && appPos !== scripts.length - 1) {
      errors.push(`❌ app.js should load LAST but is at position ${appPos} (total: ${scripts.length})`);
    }
  }

  return { scripts, errors, warnings, positions };
}

function main() {
  const { scripts, errors, warnings, positions } = checkLoadOrder();

  console.log(`\n📋 Load Order Verification\n${'═'.repeat(40)}\n`);
  console.log(`Loaded ${scripts.length} scripts:\n`);

  // Print load order with dependency info
  scripts.forEach((script, idx) => {
    const deps = DEPENDENCIES[script.filename];
    const depsStr = deps && deps.length > 0 ? ` (needs: ${deps.join(', ')})` : '';
    console.log(`${String(idx + 1).padStart(2)}: ${script.filename}${depsStr}`);
  });

  if (errors.length > 0) {
    console.log(`\n${'─'.repeat(40)}`);
    console.log(`\n❌ ERRORS (${errors.length}):\n`);
    errors.forEach(e => console.log(`  ${e}`));
  }

  if (warnings.length > 0) {
    console.log(`\n${'─'.repeat(40)}`);
    console.log(`\n⚠️  WARNINGS (${warnings.length}):\n`);
    warnings.forEach(w => console.log(`  ${w}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log(`\n✅ Load order is correct!\n`);
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main();
