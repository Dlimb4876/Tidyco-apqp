/* Build wiki/content/_meta/search-index.json from markdown files. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const wikiContent = path.join(root, 'wiki', 'content');
const outFile = path.join(wikiContent, '_meta', 'search-index.json');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walk(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

function parseMarkdownInfo(markdown) {
  const lines = markdown.split(/\r?\n/);
  const titleLine = lines.find((line) => line.startsWith('# ')) || '# Untitled';
  const title = titleLine.replace(/^#\s+/, '').trim();
  const headings = lines
    .filter((line) => /^##\s+/.test(line))
    .map((line) => line.replace(/^##\s+/, '').trim())
    .slice(0, 8);

  const body = lines
    .filter((line) => line.trim() && !line.startsWith('#'))
    .join(' ')
    .replace(/`/g, '')
    .replace(/\[[^\]]+\]\(([^)]+)\)/g, '$1');

  const excerpt = body.slice(0, 140);
  const keywords = [...new Set((title + ' ' + headings.join(' ')).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean))].slice(0, 16);

  return { title, headings, excerpt, keywords };
}

function main() {
  const files = walk(wikiContent)
    .filter((file) => !file.includes(path.join('_meta', '')))
    .sort();

  const index = files.map((file) => {
    const relFromWiki = path.relative(path.join(root, 'wiki'), file).replace(/\\/g, '/');
    const markdown = fs.readFileSync(file, 'utf8');
    const info = parseMarkdownInfo(markdown);
    return {
      title: info.title,
      path: relFromWiki,
      headings: info.headings,
      keywords: info.keywords,
      excerpt: info.excerpt
    };
  });

  fs.writeFileSync(outFile, JSON.stringify(index, null, 2) + '\n', 'utf8');
  console.log('Updated', outFile, 'with', index.length, 'entries.');
}

main();
