import fs from 'node:fs';
import path from 'node:path';
import childProcess from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkDir(dir, ext = '.js', exclude = ['node_modules', '.git', 'tests']) {
  const files = [];
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    if (exclude.includes(item)) return;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...walkDir(fullPath, ext, exclude));
    } else if (fullPath.endsWith(ext)) {
      files.push(fullPath);
    }
  });

  return files;
}

function normalizePath(filePath) {
  return String(filePath || '').replace(/\\/g, '/').replace(/^\.\//, '')
}

function validateFile(filePath) {
  try {
    childProcess.execFileSync(process.execPath, ['--check', filePath], {
      stdio: 'pipe',
      encoding: 'utf8'
    });
    return [];
  } catch (error) {
    const stderr = String(error.stderr || '').trim();
    const stdout = String(error.stdout || '').trim();
    const details = stderr || stdout || String(error.message || 'Unknown syntax error');
    return details
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .slice(0, 4);
  }
}

function main() {
  const jsFiles = walkDir('.');
  let totalErrors = 0;
  const filesToCheck = jsFiles.filter(f => {
    const normalized = normalizePath(f)
    return (normalized.startsWith('portals/') || normalized.startsWith('core/') || normalized.startsWith('utils/')) &&
    !f.includes('test')
  })

  console.log(`\n✓ Syntax Validator\n${'═'.repeat(40)}\n`);
  console.log(`Scanning ${filesToCheck.length} JS files...\n`);

  filesToCheck.forEach(file => {
    const errors = validateFile(file);
    if (errors.length > 0) {
      console.log(`\n❌ ${file}`);
      errors.forEach(err => console.log(`   ${err}`));
      totalErrors += errors.length;
    }
  });

  if (totalErrors === 0) {
    console.log(`✅ No syntax errors found!\n`);
  } else {
    console.log(`\n⚠️  Found ${totalErrors} potential syntax errors.\n`);
  }

  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
