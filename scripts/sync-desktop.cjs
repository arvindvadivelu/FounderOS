const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const destDir = path.join(rootDir, 'desktop', 'src');

console.log('[Sync] Synchronizing Web src -> Desktop src...');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy recursively with force
fs.cpSync(srcDir, destDir, { recursive: true, force: true });

console.log('[Sync] Successfully synchronized Web src to Desktop src.');
