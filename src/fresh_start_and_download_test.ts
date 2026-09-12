import 'fake-indexeddb/auto';
import { db } from './db';
import { initFreshDatabase } from './db/seed';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('======================================================');
  console.log('🧪 FRESH START & DESKTOP DOWNLOAD VERIFICATION TEST');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    ${err.message}`);
    }
  }

  async function asyncTest(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    ${err.message}`);
    }
  }

  console.log('--- 1. FRESH DATABASE INITIALIZATION ---');
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });

  await asyncTest('All operational tables are 0 before init', async () => {
    const companies = await db.companies.count();
    const customers = await db.customers.count();
    const deals = await db.deals.count();
    const tasks = await db.tasks.count();
    if (companies !== 0 || customers !== 0 || deals !== 0 || tasks !== 0) {
      throw new Error('Database not fully cleared');
    }
  });

  await asyncTest('initFreshDatabase sets singleton settings without demo company records', async () => {
    await initFreshDatabase();
    const companies = await db.companies.count();
    const customers = await db.customers.count();
    const deals = await db.deals.count();
    const tasks = await db.tasks.count();
    const transactions = await db.transactions.count();

    if (companies !== 0) throw new Error(`Expected 0 companies, found ${companies}`);
    if (customers !== 0) throw new Error(`Expected 0 customers, found ${customers}`);
    if (deals !== 0) throw new Error(`Expected 0 deals, found ${deals}`);
    if (tasks !== 0) throw new Error(`Expected 0 tasks, found ${tasks}`);
    if (transactions !== 0) throw new Error(`Expected 0 transactions, found ${transactions}`);
  });

  await asyncTest('initFreshDatabase configures settings with demoLoaded: false', async () => {
    const settings = await db.settings.get('singleton');
    if (!settings) throw new Error('Settings singleton was not created');
    if (settings.demoLoaded !== false) throw new Error(`Expected demoLoaded: false, got ${settings.demoLoaded}`);
    if (settings.theme !== 'dark') throw new Error(`Expected dark theme default, got ${settings.theme}`);
  });

  await asyncTest('initFreshDatabase configures default OpenRouter provider template', async () => {
    const providers = await db.aiProviders.toArray();
    if (providers.length === 0) throw new Error('Expected at least 1 provider template');
    const def = providers.find((p) => p.isDefault);
    if (!def) throw new Error('Expected default provider');
    if (def.type !== 'openrouter') throw new Error(`Expected openrouter type, got ${def.type}`);
  });

  console.log('\n--- 2. DESKTOP SETUP INSTALLER BINARY VERIFICATION ---');
  test('public/downloads/FounderOS-Setup.exe exists and is non-empty', () => {
    const setupPath = path.resolve('public/downloads/FounderOS-Setup.exe');
    if (!fs.existsSync(setupPath)) {
      throw new Error(`File does not exist: ${setupPath}`);
    }
    const stat = fs.statSync(setupPath);
    if (stat.size < 10000000) {
      throw new Error(`Expected binary size > 10MB, found ${stat.size} bytes`);
    }
  });

  test('desktop/release/FounderOS Setup 1.0.0.exe exists as source installer', () => {
    const releasePath = path.resolve('desktop/release/FounderOS Setup 1.0.0.exe');
    if (!fs.existsSync(releasePath)) {
      throw new Error(`File does not exist: ${releasePath}`);
    }
  });

  console.log('\n--- 3. GITIGNORE SAFETY CHECK ---');
  test('.gitignore excludes public/downloads/*.exe', () => {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    if (!gitignore.includes('public/downloads/*.exe')) {
      throw new Error('.gitignore is missing public/downloads/*.exe rule');
    }
  });

  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('======================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
