/* Validate local markdown links in wiki/content markdown files. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const contentRoot = path.join(root, 'wiki', 'content');

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

function extractLinks(markdown) {
  const links = [];
  const regex = /\[[^\]]+\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(markdown))) {
    links.push(match[1]);
  }
  return links;
}

function main() {
  const files = walk(contentRoot);
  let broken = 0;

  for (const file of files) {
    const markdown = fs.readFileSync(file, 'utf8');
    const links = extractLinks(markdown);

    for (const link of links) {
      if (link.startsWith('http://') || link.startsWith('https://') || link.startsWith('#')) {
        continue;
      }

      const cleanLink = link.split('#')[0];
      const target = path.resolve(path.dirname(file), cleanLink);
      if (!fs.existsSync(target)) {
        broken += 1;
        console.log('[BROKEN]', path.relative(root, file).replace(/\\/g, '/'), '->', link);
      }
    }
  }

  console.log('Link check complete. broken=', broken);
  if (broken > 0) process.exit(1);
}

main();
