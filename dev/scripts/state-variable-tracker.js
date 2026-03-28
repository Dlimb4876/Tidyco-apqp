#!/usr/bin/env node

/**
 * State Variable Tracker
 * Verifies new state variables are defined in state.js and used consistently.
 * Prevents duplicate state variables scattered across files.
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

function extractStateVariables(content) {
  const vars = new Map();

  // Look for variable declarations (const/let)
  const declareRegex = /(?:const|let|var)\s+(\w+)\s*=/g;
  let match;
  while ((match = declareRegex.exec(content)) !== null) {
    const varName = match[1];
    if (!vars.has(varName)) {
      vars.set(varName, { declarations: [], uses: [] });
    }
    vars.get(varName).declarations.push(match.index);
  }

  return vars;
}

function readStateFile() {
  try {
    const content = fs.readFileSync('./core/js/state.js', 'utf8');
    const stateVars = new Map();

    // Extract variable declarations from state.js
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const match = /(?:const|let|var)\s+(\w+)\s*=/.exec(line);
      if (match) {
        const varName = match[1];
        stateVars.set(varName, {
          line: idx + 1,
          definition: line.trim()
        });
      }
    });

    return stateVars;
  } catch (e) {
    console.error('Error reading state.js:', e.message);
    return new Map();
  }
}

function findStateUsages(jsFiles, stateVars) {
  const usages = new Map();

  Array.from(stateVars.keys()).forEach(varName => {
    usages.set(varName, []);
  });

  jsFiles.forEach(file => {
    if (file.includes('state.js') || file.includes('test')) return;

    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        stateVars.forEach((_, varName) => {
          // Look for uses (excluding definitions)
          if (!line.includes(`const ${varName}`) && !line.includes(`let ${varName}`)) {
            if (new RegExp(`\\b${varName}\\b`).test(line)) {
              if (!usages.get(varName)) usages.set(varName, []);
              usages.get(varName).push({
                file,
                line: idx + 1,
                code: line.trim()
              });
            }
          }
        });
      });
    } catch (e) {}
  });

  return usages;
}

function main() {
  const jsFiles = walkDir('.');
  const filesToCheck = jsFiles.filter(f => {
    const normalized = normalizePath(f)
    return (normalized.startsWith('portals/') || normalized.startsWith('core/') || normalized.startsWith('utils/')) &&
    !f.includes('test')
  })

  console.log(`\n🗂️  State Variable Tracker\n${'═'.repeat(40)}\n`);

  const stateVars = readStateFile();
  const usages = findStateUsages(filesToCheck, stateVars);

  console.log(`Found ${stateVars.size} state variables in state.js:\n`);

  // Known important state variables
  const important = [
    'db', 'progId', 'currentSection', 'apqpTab', 'capacityTab',
    'productionTab', 'productDevelopmentTab', 'bomSubTab', 'bomPartsRegisterView',
    'meStartOffset', 'prodPlanMonthOffset'
  ];

  stateVars.forEach((info, varName) => {
    const isImportant = important.includes(varName);
    const badge = isImportant ? '⭐' : '  ';
    const usage = usages.get(varName) || [];
    const usageCount = usage.length;

    console.log(`${badge} ${varName}`);
    console.log(`   Line ${info.line}: ${info.definition.substring(0, 60)}${info.definition.length > 60 ? '...' : ''}`);
    console.log(`   Used in: ${usageCount} location${usageCount !== 1 ? 's' : ''}\n`);
  });

  // Look for potential undeclared globals
  console.log(`\n${'─'.repeat(40)}\n`);
  console.log(`🔍 Checking for undeclared state-like variables...\n`);

  const suspiciousPatterns = /^(prog|app|modal|modal\w+|portalState|\w+State|current\w+|active\w+)$/;
  const globalVars = new Map();

  filesToCheck.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        // Look for assignments to globals (no const/let/var)
        if (suspiciousPatterns.test(line) && !line.includes('const ') && !line.includes('let ') && !line.includes('var ')) {
          const match = /^\s*(\w+)\s*=/.exec(line);
          if (match && !line.includes('this.') && !line.includes('->') && !line.includes('function')) {
            const varName = match[1];
            if (!globalVars.has(varName)) {
              globalVars.set(varName, []);
            }
            globalVars.get(varName).push({ file, line: idx + 1 });
          }
        }
      });
    } catch (e) {}
  });

  if (globalVars.size > 0) {
    console.log(`⚠️  Potential undeclared global variables:\n`);
    globalVars.forEach((locations, varName) => {
      if (!stateVars.has(varName)) {
        console.log(`  ${varName}`);
        locations.slice(0, 2).forEach(loc => {
          console.log(`    - ${loc.file}:${loc.line}`);
        });
        if (locations.length > 2) console.log(`    ... and ${locations.length - 2} more`);
        console.log(`    → Add to state.js? ${varName} = ?;\n`);
      }
    });
  }

  console.log(`\n${'─'.repeat(40)}\n`);
  console.log(`📋 STATE.JS CHECKLIST:\n`);
  console.log(`For any new global state variable:\n`);
  console.log(`  1. [ ] Define in state.js with default value`);
  console.log(`  2. [ ] Comment what the variable does`);
  console.log(`  3. [ ] Document in CLAUDE.md state table (if important)`);
  console.log(`  4. [ ] Add to this tracker's 'important' list if core\n`);

  console.log(`📝 TEMPLATE:\n`);
  console.log(`\`\`\`javascript\n`);
  console.log(`// core/js/state.js`);
  console.log(`\n// Active section of the portal (hub, capacity, product-development, etc.)`);
  console.log(`let currentSection = 'hub';\n`);
  console.log(`// Active tab within current section`);
  console.log(`let apqpTab = 'ctq';  // ctq, pfd, pfmea, cp, gates, bom, timing, trackers\n`);
  console.log(`\`\`\`\n`);
}

main();
