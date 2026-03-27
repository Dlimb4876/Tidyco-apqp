#!/usr/bin/env node

/**
 * Mobile Breakpoint Verifier
 * Scans CSS files for missing mobile-first responsive design.
 * Ensures @media (max-width: 767px) and @media (min-width: 768px) for new files.
 */

const fs = require('fs');
const path = require('path');

// Known CSS files that should have breakpoints (portal features, not core)
const PORTAL_CSS_PATTERN = /^portals\/.*\.css$/;

function normalizePath(filePath) {
  return String(filePath || '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function walkDir(dir, ext = '.css') {
  const files = [];
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...walkDir(fullPath, ext));
      } else if (fullPath.endsWith(ext)) {
        files.push(fullPath);
      }
    } catch (e) {}
  });

  return files;
}

function analyzeCss(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  const hasMobileMax = /@media\s*\(\s*max-width\s*:\s*767px\s*\)/.test(content);
  const hasTabletMin = /@media\s*\(\s*min-width\s*:\s*768px\s*\)/.test(content);
  const hasResponsive = hasMobileMax || hasTabletMin;

  // Calculate rule count
  const rules = (content.match(/{[^}]+}/g) || []).length;
  const mediaQueries = (content.match(/@media/g) || []).length;

  return {
    hasMobileMax,
    hasTabletMin,
    hasResponsive,
    rules,
    mediaQueries
  };
}

function main() {
  const allCss = walkDir('.');
  const portalCss = allCss.filter(f => PORTAL_CSS_PATTERN.test(normalizePath(f)));

  console.log(`\n📱 Mobile Breakpoint Verifier\n${'═'.repeat(40)}\n`);
  console.log(`Scanning ${portalCss.length} portal CSS files...\n`);

  const missing = [];
  const partial = [];
  const good = [];

  portalCss.forEach(file => {
    const analysis = analyzeCss(file);
    const shortPath = normalizePath(file);

    if (!analysis.hasResponsive) {
      missing.push(shortPath);
      console.log(`❌ ${shortPath}`);
      console.log(`   No responsive breakpoints found\n`);
    } else if (!analysis.hasMobileMax || !analysis.hasTabletMin) {
      partial.push(shortPath);
      console.log(`⚠️  ${shortPath}`);
      if (!analysis.hasMobileMax) console.log(`   Missing: @media (max-width: 767px)`);
      if (!analysis.hasTabletMin) console.log(`   Missing: @media (min-width: 768px)\n`);
    } else {
      good.push(shortPath);
      console.log(`✅ ${shortPath}`);
      console.log(`   ${analysis.mediaQueries} media queries, ${analysis.rules} rules\n`);
    }
  });

  console.log(`\n${'─'.repeat(40)}\n`);
  console.log(`📊 Summary:\n`);
  console.log(`  Good (both breakpoints):     ${good.length}`);
  console.log(`  Partial (missing one):       ${partial.length}`);
  console.log(`  Missing (no breakpoints):    ${missing.length}\n`);

  if (missing.length > 0 || partial.length > 0) {
    console.log(`${'─'.repeat(40)}\n`);
    console.log(`📋 MOBILE-FIRST RESPONSIVE TEMPLATE:\n`);
    console.log(`\`\`\`css`);
    console.log(`/* Mobile first (480px and up) */`);
    console.log(`.selector {`);
    console.log(`  display: flex;`);
    console.log(`  flex-direction: column;`);
    console.log(`  gap: 12px;`);
    console.log(`}`);
    console.log(`\n/* Tablet and up (768px and up) */`);
    console.log(`@media (min-width: 768px) {`);
    console.log(`  .selector {`);
    console.log(`    flex-direction: row;`);
    console.log(`    gap: 16px;`);
    console.log(`  }`);
    console.log(`}`);
    console.log(`\n/* Desktop (1200px and up) - optional */`);
    console.log(`@media (min-width: 1200px) {`);
    console.log(`  .selector {`);
    console.log(`    gap: 20px;`);
    console.log(`  }`);
    console.log(`}`);
    console.log(`\`\`\`\n`);

    console.log(`${'─'.repeat(40)}\n`);
    console.log(`✓ TESTING CHECKLIST:\n`);
    console.log(`  1. [ ] Test layout at 375px (mobile)`);
    console.log(`  2. [ ] Test layout at 768px (tablet)`);
    console.log(`  3. [ ] Test layout at 1920px (desktop)`);
    console.log(`  4. [ ] No horizontal scrolling (tables scroll, don't wrap)`);
    console.log(`  5. [ ] Viewport gutter maintained (10px mobile, 14px tablet+)`);
    console.log(`  6. [ ] All interactions work on touch (buttons, inputs)\n`);
  } else {
    console.log(`✅ All portal CSS files have proper breakpoints!\n`);
  }

  process.exit((missing.length + partial.length) > 0 ? 1 : 0);
}

main();
