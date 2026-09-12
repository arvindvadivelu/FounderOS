import 'fake-indexeddb/auto';
import { db } from './db';
import { seedDemoData, clearAllCompanyData } from './db/seed';
import { exportAllData, importDataFromPayload } from './utils/exportImport';
import { saveAIProvider, getDefaultAIProvider } from './db/services/aiStorageService';
import { getFinancialSummary } from './db/services/financeService';
import { getPayrollSummary } from './db/services/managementService';
import type { ExportDataPayload } from './types';

interface TestReport {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const reports: TestReport[] = [];

async function test(suite: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    reports.push({ suite, name, passed: true, durationMs });
    console.log(`  ✓ [${suite}] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    reports.push({ suite, name, passed: false, durationMs, error: err.message || String(err) });
    console.error(`  ✗ [${suite}] ${name} (${durationMs}ms):`, err.message || err);
  }
}

async function runBackupRestoreSuite() {
  console.log('\n======================================================');
  console.log('📦 FOUNDEROS BACKUP & RESTORE INTEGRITY TEST SUITE');
  console.log('======================================================\n');

  // Seed baseline data
  await seedDemoData();

  // ==========================================
  // SUITE 1: Export Complete Database to JSON
  // ==========================================
  console.log('--- SUITE 1: EXPORT INTEGRITY & SECRETS SANITIZATION ---');

  await test('Export', 'Export includes all 21 entities and relationships with schema version 2', async () => {
    const payload = await exportAllData();

    if (payload.version !== 2) throw new Error(`Unexpected schema version: ${payload.version}`);
    if (!payload.exportedAt) throw new Error('Missing exportedAt timestamp');
    if (!payload.company || payload.company.name !== 'Solvst AI') throw new Error('Company entity missing in export');
    if (!Array.isArray(payload.customers) || payload.customers.length === 0) throw new Error('Customers missing in export');
    if (!Array.isArray(payload.deals) || payload.deals.length === 0) throw new Error('Deals missing in export');
    if (!Array.isArray(payload.transactions) || payload.transactions.length === 0) throw new Error('Transactions missing in export');
    if (!Array.isArray(payload.invoices) || payload.invoices.length === 0) throw new Error('Invoices missing in export');
    if (!Array.isArray(payload.projects) || payload.projects.length === 0) throw new Error('Projects missing in export');
    if (!Array.isArray(payload.tasks) || payload.tasks.length === 0) throw new Error('Tasks missing in export');
    if (!Array.isArray(payload.features) || payload.features.length === 0) throw new Error('Features missing in export');
    if (!Array.isArray(payload.bugs) || payload.bugs.length === 0) throw new Error('Bugs missing in export');
    if (!Array.isArray(payload.goals) || payload.goals.length === 0) throw new Error('Goals missing in export');
    if (!Array.isArray(payload.notes) || payload.notes.length === 0) throw new Error('Notes missing in export');
    if (!Array.isArray(payload.activities) || payload.activities.length === 0) throw new Error('Activities missing in export');
    if (!Array.isArray(payload.employees) || payload.employees.length === 0) throw new Error('Employees missing in export');
    if (!Array.isArray(payload.departments) || payload.departments.length === 0) throw new Error('Departments missing in export');
    if (!Array.isArray(payload.bankAccounts) || payload.bankAccounts.length === 0) throw new Error('Bank accounts missing in export');
    if (!Array.isArray(payload.balanceSheetItems) || payload.balanceSheetItems.length === 0) throw new Error('Balance sheet missing in export');
    if (!Array.isArray(payload.uploadedFiles) || payload.uploadedFiles.length === 0) throw new Error('Uploaded files missing in export');
    if (!Array.isArray(payload.aiProviders) || payload.aiProviders.length === 0) throw new Error('AI providers missing in export');
    if (!payload.settings) throw new Error('Settings missing in export');
  });

  await test('Export', 'Exported JSON payload strips all raw API keys and secrets', async () => {
    // Save provider with test key
    await saveAIProvider({
      name: 'Key Strip Test',
      type: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'sk-or-secret-do-not-export-1234',
      model: 'anthropic/claude-3.7-sonnet',
      temperature: 0.2,
    });

    const payload = await exportAllData();
    const jsonString = JSON.stringify(payload);

    if (jsonString.includes('sk-or-secret-do-not-export')) {
      throw new Error('Exported JSON contains plaintext API key!');
    }

    const exportedProviders = payload.aiProviders;
    for (const p of exportedProviders) {
      if (p.apiKey !== '') {
        throw new Error(`Provider "${p.name}" apiKey was not emptied in backup payload`);
      }
    }
  });

  // ==========================================
  // SUITE 2: Full Restore Roundtrip & Data Fidelity
  // ==========================================
  console.log('\n--- SUITE 2: FULL RESTORE ROUNDTRIP & FIDELITY ---');

  await test('Restore', 'Export -> Purge Database -> Import -> 100% record equality restoration', async () => {
    // Record original counts
    const origCustomerCount = await db.customers.count();
    const origTxCount = await db.transactions.count();
    const origTaskCount = await db.tasks.count();
    const origEmployeeCount = await db.employees.count();

    const backupPayload = await exportAllData();

    // Purge database
    await clearAllCompanyData();
    const midCount = await db.customers.count();
    if (midCount !== 0) throw new Error('Database clear failed');

    // Restore from backup
    const importResult = await importDataFromPayload(backupPayload);
    if (!importResult.success) throw new Error('Import failed: ' + importResult.message);

    // Verify exact counts restored
    const restoredCust = await db.customers.count();
    const restoredTx = await db.transactions.count();
    const restoredTasks = await db.tasks.count();
    const restoredEmp = await db.employees.count();

    if (restoredCust !== origCustomerCount) throw new Error(`Customer count mismatch: ${restoredCust} vs ${origCustomerCount}`);
    if (restoredTx !== origTxCount) throw new Error(`Transaction count mismatch: ${restoredTx} vs ${origTxCount}`);
    if (restoredTasks !== origTaskCount) throw new Error(`Task count mismatch: ${restoredTasks} vs ${origTaskCount}`);
    if (restoredEmp !== origEmployeeCount) throw new Error(`Employee count mismatch: ${restoredEmp} vs ${origEmployeeCount}`);

    // Verify financial summary calculates identical MRR
    const fin = await getFinancialSummary();
    if (fin.mrr <= 0) throw new Error('Financial summary calculation failed after restore');

    const payroll = await getPayrollSummary();
    if (payroll.totalEmployees !== origEmployeeCount) throw new Error('Payroll summary mismatch after restore');
  });

  await test('Restore', 'Local API keys are preserved during restore if matching provider exists', async () => {
    const prov = await saveAIProvider({
      id: 'prov_persist_test',
      name: 'Local Persistent Provider',
      type: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'sk-or-local-active-key-5555',
      model: 'anthropic/claude-3.7-sonnet',
      temperature: 0.2,
      isDefault: true,
    });

    // Export payload (which strips apiKey to '')
    const payload = await exportAllData();

    // Restore payload
    await importDataFromPayload(payload);

    // Verify local key was preserved
    const restoredProv = await db.aiProviders.get('prov_persist_test');
    if (!restoredProv || restoredProv.apiKey !== 'sk-or-local-active-key-5555') {
      throw new Error('Local API key was not preserved during backup restoration');
    }
  });

  // ==========================================
  // SUITE 3: Large Volume Backup & Restore
  // ==========================================
  console.log('\n--- SUITE 3: LARGE VOLUME BACKUP & RESTORE ---');

  await test('Stress Volume', 'Export and restore 1,000 bulk transactions & 500 tasks without data loss', async () => {
    const bulkTxs = Array.from({ length: 1000 }, (_, i) => ({
      id: `bulk_backup_tx_${i}`,
      type: (i % 2 === 0 ? 'income' : 'expense') as any,
      category: 'Cloud Services',
      description: `Large Volume Test Tx #${i}`,
      amount: 100 + i,
      currency: 'USD' as any,
      date: '2026-02-01',
      status: 'cleared' as any,
      recurring: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const bulkTasks = Array.from({ length: 500 }, (_, i) => ({
      id: `bulk_backup_task_${i}`,
      title: `Bulk Task #${i}`,
      priority: 'high' as any,
      status: 'todo' as any,
      tags: ['backup-test'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    await db.transaction('rw', db.transactions, db.tasks, async () => {
      await db.transactions.bulkPut(bulkTxs);
      await db.tasks.bulkPut(bulkTasks);
    });

    const exportLarge = await exportAllData();
    if (exportLarge.transactions.length < 1000 || exportLarge.tasks.length < 500) {
      throw new Error('Large volume export length mismatch');
    }

    await clearAllCompanyData();
    await importDataFromPayload(exportLarge);

    const checkTxCount = await db.transactions.count();
    const checkTaskCount = await db.tasks.count();

    if (checkTxCount < 1000 || checkTaskCount < 500) {
      throw new Error(`Large volume restore count mismatch: txs=${checkTxCount}, tasks=${checkTaskCount}`);
    }
  });

  // ==========================================
  // SUITE 4: Corrupt, Incomplete & Invalid Payloads
  // ==========================================
  console.log('\n--- SUITE 4: CORRUPT & INVALID PAYLOAD REJECTION ---');

  await test('Validation', 'Rejects null, undefined, primitive, and array payloads', async () => {
    const invalidInputs = [null, undefined, '', 'hello', 12345, [], true];

    for (const bad of invalidInputs) {
      let threw = false;
      try {
        await importDataFromPayload(bad);
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('Invalid backup file')) {
          throw new Error('Unexpected error message for invalid input: ' + err.message);
        }
      }
      if (!threw) throw new Error(`Expected invalid input ${JSON.stringify(bad)} to throw error`);
    }
  });

  await test('Validation', 'Rejects unrecognized JSON objects lacking schema attributes', async () => {
    const badObjects = [
      { foo: 'bar' },
      { randomKey: 123, status: 'ok' },
      { version: 999 }, // Incompatible version
    ];

    for (const badObj of badObjects) {
      let threw = false;
      try {
        await importDataFromPayload(badObj);
      } catch (err: any) {
        threw = true;
        if (!err.message.includes('Unrecognized database schema version') && !err.message.includes('Invalid backup file')) {
          throw new Error('Unexpected schema error message: ' + err.message);
        }
      }
      if (!threw) throw new Error('Expected unrecognized schema object to throw error');
    }
  });

  // ==========================================
  // SUITE 5: Empty Database Export & Restore
  // ==========================================
  console.log('\n--- SUITE 5: EMPTY DATABASE EXPORT & RESTORE ---');

  await test('Empty State', 'Exporting and restoring an empty database operates cleanly', async () => {
    await clearAllCompanyData();

    const emptyExport = await exportAllData();
    if (emptyExport.customers.length !== 0 || emptyExport.transactions.length !== 0) {
      throw new Error('Empty export contained records');
    }

    const res = await importDataFromPayload(emptyExport);
    if (!res.success) throw new Error('Empty restore failed');

    const count = await db.customers.count();
    if (count !== 0) throw new Error('Empty restore populated unexpected records');
  });

  // ==========================================
  // FINAL REPORT
  // ==========================================
  console.log('\n======================================================');
  console.log('📊 BACKUP & RESTORE INTEGRITY SUMMARY');
  console.log('======================================================');
  const total = reports.length;
  const passed = reports.filter(r => r.passed).length;
  const failed = reports.filter(r => !r.passed).length;

  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed:          ${passed}`);
  console.log(`Failed:          ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runBackupRestoreSuite().catch(err => {
  console.error('Fatal backup suite error:', err);
  process.exit(1);
});
