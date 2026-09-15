const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const destDir = path.join(rootDir, 'desktop', 'src');

console.log('[Watch Sync] Starting auto-sync watcher (Web src -> Desktop src)...');

// Perform initial sync
fs.cpSync(srcDir, destDir, { recursive: true, force: true });
console.log('[Watch Sync] Initial sync complete.');

let debounceTimer = null;
const syncQueue = new Set();

function processQueue() {
  for (const relPath of syncQueue) {
    const srcPath = path.join(srcDir, relPath);
    const targetPath = path.join(destDir, relPath);

    try {
      if (fs.existsSync(srcPath)) {
        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
          if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true });
          }
        } else {
          const parent = path.dirname(targetPath);
          if (!fs.existsSync(parent)) {
            fs.mkdirSync(parent, { recursive: true });
          }
          fs.copyFileSync(srcPath, targetPath);
          console.log(`[Watch Sync] Synced: ${relPath}`);
        }
      } else {
        if (fs.existsSync(targetPath)) {
          fs.rmSync(targetPath, { recursive: true, force: true });
          console.log(`[Watch Sync] Removed: ${relPath}`);
        }
      }
    } catch (err) {
      console.error(`[Watch Sync] Error syncing ${relPath}:`, err.message);
    }
  }
  syncQueue.clear();
}

fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  syncQueue.add(filename);
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(processQueue, 150);
});

console.log('[Watch Sync] Watching for changes in src/... (web -> desktop auto-updating)');
