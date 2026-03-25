/* Token audit for wiki markdown files.
   Approximation uses chars / 4 per file. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const wikiContent = path.join(root, 'wiki', 'content');
const softCap = 1200;
const hardCap = 1500;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(full));
    if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}

function estimateTokens(text) {
  return Math.ceil((text || '').length / 4);
}

function main() {
  const files = walk(wikiContent).sort();
  let hardViolations = 0;
  let softViolations = 0;

  for (const file of files) {
    const rel = path.relative(root, file).replace(/\\/g, '/');
    const text = fs.readFileSync(file, 'utf8');
    const tokens = estimateTokens(text);
    if (tokens > hardCap) {
      hardViolations += 1;
      console.log('[HARD]', rel, tokens);
    } else if (tokens > softCap) {
      softViolations += 1;
      console.log('[SOFT]', rel, tokens);
    }
  }

  console.log('Token audit complete. soft=', softViolations, 'hard=', hardViolations);
  if (hardViolations > 0) process.exit(1);
}

main();
