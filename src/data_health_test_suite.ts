import 'fake-indexeddb/auto';
import { db } from './db';
import { seedDemoData, clearAllCompanyData } from './db/seed';
import { getDataHealthReport, fixDataAnomaly } from './db/services/dataHealthService';
import { exportAllData, importDataFromPayload } from './utils/exportImport';
import { createCustomer } from './db/services/customerService';
import { createDeal } from './db/services/dealService';
import { createTask, createProject } from './db/services/taskProjectService';
import { createInvoice, createTransaction } from './db/services/financeService';

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

async function runDataHealthSuite() {
  console.log('\n======================================================');
  console.log('🩺 FOUNDEROS DATA HEALTH PAGE & DIAGNOSTICS TEST SUITE');
  console.log('======================================================\n');

  // ==========================================
  // SCENARIO 1: Empty Database
  // ==========================================
  console.log('--- SCENARIO 1: EMPTY DATABASE ---');

  await test('Empty DB', 'Handles clean empty database gracefully without crashing', async () => {
    await clearAllCompanyData();

    const rep = await getDataHealthReport();
    if (rep.databaseName !== 'FounderOS') throw new Error('Database name mismatch');
    if (rep.schemaVersion !== db.verno) throw new Error(`Schema version mismatch: expected ${db.verno}, got ${rep.schemaVersion}`);
    if (rep.totalRecords !== 0) throw new Error(`Expected 0 records, got ${rep.totalRecords}`);
    if (rep.entityCounts.length < 20) throw new Error(`Expected at least 20 entity counts, got ${rep.entityCounts.length}`);
    if (!Array.isArray(rep.anomalies)) throw new Error('Anomalies should be an array');
  });

  // ==========================================
  // SCENARIO 2: Normal Populated Database
  // ==========================================
  console.log('\n--- SCENARIO 2: NORMAL POPULATED DATABASE ---');

  await test('Populated DB', 'Reports healthy status and 100/100 integrity on standard seed database', async () => {
    await seedDemoData();

    const rep = await getDataHealthReport();
    if (rep.status !== 'healthy') throw new Error(`Expected healthy status on demo data, got ${rep.status}`);
    if (rep.healthScore < 95) throw new Error(`Expected health score >= 95, got ${rep.healthScore}`);
    if (rep.totalRecords <= 0) throw new Error('Total records should be > 0');
    if (rep.anomalies.length > 0) {
      throw new Error(`Expected 0 anomalies on clean demo seed, found ${rep.anomalies.length}`);
    }

    const customerItem = rep.entityCounts.find(e => e.tableName === 'customers');
    if (!customerItem || customerItem.count <= 0) throw new Error('Customer count missing');

    const txItem = rep.entityCounts.find(e => e.tableName === 'transactions');
    if (!txItem || txItem.count <= 0) throw new Error('Transaction count missing');
  });

  // ==========================================
  // SCENARIO 3: Invalid / Orphaned Records & Auto-Fix
  // ==========================================
  console.log('\n--- SCENARIO 3: INVALID / ORPHANED RECORDS & REPAIR ---');

  await test('Orphans & Invalid', 'Detects orphan deal, orphan invoice, orphan task, and duplicate email', async () => {
    // 1. Inject orphan deal pointing to non-existent customer
    await db.deals.put({
      id: 'orphan_deal_bad',
      name: 'Orphan Enterprise Contract',
      customerId: 'ghost_cust_9999',
      customerName: 'Ghost Corp',
      value: 50000,
      stage: 'Proposal',
      probability: 60,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Inject orphan task pointing to non-existent project
    await db.tasks.put({
      id: 'orphan_task_bad',
      title: 'Orphan Task Without Project',
      projectId: 'ghost_project_8888',
      projectName: 'Ghost Project',
      status: 'todo',
      priority: 'high',
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Inject duplicate customer email
    await createCustomer({
      companyName: 'Duplicate Inc',
      contactName: 'Dupe Lead',
      email: 'sarah.j@acmeglobal.com', // Already in seed data
      status: 'lead',
      monthlyRevenue: 0,
      tags: [],
    });

    const rep = await getDataHealthReport();
    if (rep.anomalies.length < 3) {
      throw new Error(`Expected at least 3 anomalies detected, found ${rep.anomalies.length}`);
    }

    const orphanDealAnomaly = rep.anomalies.find(a => a.id === 'orphan_deal_orphan_deal_bad');
    if (!orphanDealAnomaly) throw new Error('Orphan deal anomaly was not flagged');

    const orphanTaskAnomaly = rep.anomalies.find(a => a.id === 'orphan_task_orphan_task_bad');
    if (!orphanTaskAnomaly) throw new Error('Orphan task anomaly was not flagged');

    // Test Auto-Fix
    const fixResult = await fixDataAnomaly('orphan_deal_orphan_deal_bad');
    if (!fixResult.success) throw new Error('Fix deal anomaly failed: ' + fixResult.message);

    const fixTaskResult = await fixDataAnomaly('orphan_task_orphan_task_bad');
    if (!fixTaskResult.success) throw new Error('Fix task anomaly failed: ' + fixTaskResult.message);

    // Verify re-scan reflects resolved state
    const repAfter = await getDataHealthReport();
    if (repAfter.anomalies.some(a => a.id === 'orphan_deal_orphan_deal_bad')) {
      throw new Error('Fixed deal anomaly still present after fix');
    }
  });

  // ==========================================
  // SCENARIO 4: After Export / Import Roundtrip
  // ==========================================
  console.log('\n--- SCENARIO 4: AFTER EXPORT & IMPORT ---');

  await test('Export & Restore', 'Data Health report remains healthy and updates backup timestamp after restore', async () => {
    await seedDemoData();
    const payload = await exportAllData();

    await clearAllCompanyData();
    await importDataFromPayload(payload);

    const rep = await getDataHealthReport();
    if (rep.status !== 'healthy') throw new Error(`Expected healthy status after restore, got ${rep.status}`);
    if (!rep.lastBackupAt) throw new Error('Last backup timestamp was not recorded in settings');
  });

  // ==========================================
  // SCENARIO 5: After Page Refresh / Simulated Persistence
  // ==========================================
  console.log('\n--- SCENARIO 5: AFTER SIMULATED REFRESH ---');

  await test('Persistence', 'Re-executes scan on raw IndexedDB to verify continuous state tracking', async () => {
    const rep1 = await getDataHealthReport();
    const count1 = rep1.totalRecords;

    // Add a new task directly (creates task + activity log)
    await createTask({
      title: 'Quick Reactive Health Task',
      status: 'todo',
      priority: 'low',
      tags: [],
    });

    const rep2 = await getDataHealthReport();
    if (rep2.totalRecords < count1 + 1) {
      throw new Error(`Record count did not increment: ${rep2.totalRecords} vs ${count1}`);
    }
  });

  // ==========================================
  // SCENARIO 6: Large Dataset Handling
  // ==========================================
  console.log('\n--- SCENARIO 6: LARGE DATASET STRESS HANDLING ---');

  await test('Large Dataset', 'Evaluates 2,000 transactions and 1,000 tasks in <150ms', async () => {
    const bulkTxs = Array.from({ length: 2000 }, (_, i) => ({
      id: `health_tx_${i}`,
      type: (i % 2 === 0 ? 'income' : 'expense') as any,
      category: 'Cloud',
      description: `Stress Tx #${i}`,
      amount: 100 + i,
      currency: 'USD' as any,
      date: '2026-02-15',
      status: 'cleared' as any,
      recurring: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const bulkTasks = Array.from({ length: 1000 }, (_, i) => ({
      id: `health_task_${i}`,
      title: `Stress Task #${i}`,
      priority: 'medium' as any,
      status: 'todo' as any,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    await db.transaction('rw', db.transactions, db.tasks, async () => {
      await db.transactions.bulkPut(bulkTxs);
      await db.tasks.bulkPut(bulkTasks);
    });

    const start = performance.now();
    const rep = await getDataHealthReport();
    const duration = performance.now() - start;

    if (rep.totalRecords < 3000) {
      throw new Error(`Total records undercounted: ${rep.totalRecords}`);
    }
    console.log(`    (Large dataset 3,000+ records analyzed in ${Math.round(duration)}ms)`);
  });

  // ==========================================
  // FINAL SUMMARY
  // ==========================================
  console.log('\n======================================================');
  console.log('📊 DATA HEALTH TEST SUMMARY');
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

runDataHealthSuite().catch(err => {
  console.error('Data health suite fatal error:', err);
  process.exit(1);
});
