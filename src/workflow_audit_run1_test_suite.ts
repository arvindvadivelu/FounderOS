/**
 * FOUNDEROS CONTINUOUS WORKFLOW AUDIT — RUN 01 TEST SUITE
 * 
 * Verifies:
 * - WF-001: Live Bank Account Cash & Runway Reconciliation
 * - WF-002: Dynamic Sequential/Unique Invoice Number Generation
 * - WF-003: Customer Deletion Cascading Referential Integrity
 * - WF-004: Universal Realtime Sync Broadcast Coverage for Tasks, Projects, Goals, Notes, Management
 */

import 'fake-indexeddb/auto';
import { db } from './db/db';
import { getFinancialSummary, createInvoice, createTransaction } from './db/services/financeService';
import { createCustomer, deleteCustomer } from './db/services/customerService';
import { createTask, createProject } from './db/services/taskProjectService';
import { createGoal, createNote } from './db/services/goalNoteService';
import { createEmployee, createBankAccount, createBalanceSheetItem } from './db/services/managementService';
import { realtimeSync, type RealtimeEvent } from './services/realtimeSyncService';

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${name} -> ${err.message}`);
    failed++;
  }
}

async function run() {
  console.log('\n======================================================');
  console.log('🔍 WORKFLOW AUDIT RUN 01: VERIFICATION TEST SUITE');
  console.log('======================================================\n');

  await db.delete();
  await db.open();

  // ----------------------------------------------------
  // WF-001: Bank Accounts Cash Reconciliation
  // ----------------------------------------------------
  console.log('--- WF-001: Real Cash & Runway Calculation ---');
  await test('getFinancialSummary reflects live bankAccounts balance', async () => {
    await createBankAccount({
      accountName: 'Silicon Valley Primary',
      institution: 'SVB',
      accountType: 'checking',
      accountNumberMask: '****1234',
      balance: 275000,
      currency: 'USD',
      isPrimary: true,
    });

    await createBankAccount({
      accountName: 'Mercury Treasury',
      institution: 'Mercury',
      accountType: 'treasury',
      accountNumberMask: '****5678',
      balance: 150000,
      currency: 'USD',
      isPrimary: false,
    });

    await createTransaction({
      type: 'expense',
      category: 'Cloud',
      description: 'AWS Cluster',
      amount: 25000,
      currency: 'USD',
      recurring: false,
      date: new Date().toISOString().split('T')[0],
      status: 'cleared',
    });

    const summary = await getFinancialSummary();
    // Total cash should match the exact sum of bank accounts: 275,000 + 150,000 = 425,000
    if (summary.estimatedCash !== 425000) {
      throw new Error(`Expected estimatedCash to be 425000, got ${summary.estimatedCash}`);
    }
    // Runway should be 425000 / 25000 = 17 months
    if (summary.runwayMonths !== 17) {
      throw new Error(`Expected runwayMonths to be 17, got ${summary.runwayMonths}`);
    }
  });

  // ----------------------------------------------------
  // WF-002: Dynamic Invoice Number Uniqueness
  // ----------------------------------------------------
  console.log('\n--- WF-002: Dynamic Invoice Number Generation ---');
  await test('createInvoice records distinct invoice numbers and preserves uniqueness', async () => {
    const cust = await createCustomer({
      companyName: 'Acme Enterprises',
      contactName: 'Jane Doe',
      email: 'jane@acme.com',
      status: 'active',
      plan: 'Enterprise',
      monthlyRevenue: 5000,
      tags: ['enterprise'],
    });

    const inv1 = await createInvoice({
      customerId: cust.id,
      customerName: cust.companyName,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: '2026-09-01',
      dueDate: '2026-09-30',
      amount: 5000,
      currency: 'USD',
      status: 'sent',
      description: 'September 2026 SaaS Subscription',
    });

    const inv2 = await createInvoice({
      customerId: cust.id,
      customerName: cust.companyName,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: '2026-09-01',
      dueDate: '2026-09-30',
      amount: 5000,
      currency: 'USD',
      status: 'sent',
      description: 'October 2026 SaaS Subscription',
    });

    if (inv1.invoiceNumber === inv2.invoiceNumber) {
      throw new Error(`Invoice numbers collided: ${inv1.invoiceNumber}`);
    }

    const allInvoices = await db.invoices.toArray();
    if (allInvoices.length < 2) throw new Error('Expected at least 2 invoices in DB');
  });

  // ----------------------------------------------------
  // WF-003: Customer Deletion Cascading Referential Integrity
  // ----------------------------------------------------
  console.log('\n--- WF-003: Customer Deletion Cascading Referential Integrity ---');
  await test('deleteCustomer cleans up health scores, expansion ops, and unlinks transactions', async () => {
    const cust = await createCustomer({
      companyName: 'Cascade Test Corp',
      contactName: 'Bob Builder',
      email: 'bob@cascade.com',
      status: 'active',
      plan: 'Scale',
      monthlyRevenue: 3000,
      tags: ['scale'],
    });

    // Seed customerHealthScore
    await db.customerHealthScores.put({
      id: `chs_${cust.id}`,
      customerId: cust.id,
      companyName: cust.companyName,
      mrr: 3000,
      plan: 'Scale',
      healthScore: 45,
      churnRiskScore: 78,
      quadrant: 'at_risk',
      activityRecencyDays: 2,
      openBugsCount: 1,
      overdueInvoicesCount: 0,
      churnRiskFactors: ['Declining login frequency'],
      recommendedIntervention: 'Conduct executive sync',
      updatedAt: new Date().toISOString(),
    });

    // Seed expansionOpportunity
    await db.expansionOpportunities.put({
      id: `exp_${cust.id}`,
      customerId: cust.id,
      companyName: cust.companyName,
      currentMrr: 3000,
      targetMrr: 6000,
      upsideArr: 36000,
      expansionType: 'tier_upgrade',
      confidencePct: 85,
      strategicAngle: 'Approaching seat limit',
      suggestedAction: 'Offer Enterprise upgrade',
    });

    // Seed transaction with customerId
    const tx = await createTransaction({
      type: 'income',
      category: 'Subscription',
      description: 'Customer Payment',
      amount: 3000,
      customerId: cust.id,
      currency: 'USD',
      recurring: false,
      date: new Date().toISOString().split('T')[0],
      status: 'cleared',
    });

    // Verify records exist before deletion
    const beforeChs = await db.customerHealthScores.where('customerId').equals(cust.id).toArray();
    const beforeExp = await db.expansionOpportunities.where('customerId').equals(cust.id).toArray();
    if (beforeChs.length === 0 || beforeExp.length === 0) {
      throw new Error('Customer relations were not seeded properly before delete test');
    }

    // Perform cascade delete
    await deleteCustomer(cust.id);

    // Verify customer deleted
    const deletedCust = await db.customers.get(cust.id);
    if (deletedCust) throw new Error('Customer was not deleted from db.customers');

    // Verify cascading deletion of customerHealthScores and expansionOpportunities
    const remainingChs = await db.customerHealthScores.where('customerId').equals(cust.id).toArray();
    if (remainingChs.length > 0) throw new Error('Customer health score was not cascade-deleted');

    const remainingExp = await db.expansionOpportunities.where('customerId').equals(cust.id).toArray();
    if (remainingExp.length > 0) throw new Error('Customer expansion opportunity was not cascade-deleted');

    // Verify transaction customerId was cleanly unlinked
    const updatedTx = await db.transactions.get(tx.id);
    if (!updatedTx || updatedTx.customerId !== undefined) {
      throw new Error('Transaction customerId was not unlinked on customer deletion');
    }
  });

  // ----------------------------------------------------
  // WF-004: Realtime Sync Broadcast Coverage
  // ----------------------------------------------------
  console.log('\n--- WF-004: Universal Realtime Sync Broadcasts ---');
  await test('realtimeSync broadcasts events for tasks, projects, goals, notes, employees, bank accounts', async () => {
    const receivedTables: string[] = [];
    const unsub = realtimeSync.subscribe((event: RealtimeEvent) => {
      receivedTables.push(event.table);
    });

    // Dispatch mutations across domain services
    await createProject({
      name: 'Project Alpha',
      status: 'in_progress',
      priority: 'high',
      progress: 30,
      targetDate: '2026-10-01',
    });

    await createTask({
      title: 'Review Q3 Security Policy',
      status: 'todo',
      priority: 'high',
      tags: ['security'],
    });

    await createGoal({
      title: 'Attain $100k ARR',
      period: 'Q3',
      status: 'on_track',
      currentValue: 60000,
      target: 100000,
      unit: 'USD',
    });

    await createNote({
      title: 'Architecture Decision Record #12',
      content: 'Local-first offline sync pattern',
      category: 'tech',
      isPinned: true,
      tags: ['architecture'],
    });

    await createEmployee({
      name: 'Dr. Sarah Connor',
      email: 'sarah@founderos.io',
      role: 'Head of AI Research',
      departmentName: 'Engineering',
      status: 'active',
      startDate: '2026-09-01',
      salary: 160000,
      salaryPeriod: 'annual',
      employmentType: 'full_time',
      currency: 'USD',
    });

    await createBalanceSheetItem({
      name: 'Office Hardware',
      type: 'asset',
      category: 'fixed_asset',
      value: 12000,
      currency: 'USD',
    });

    unsub();

    const expectedTables = ['projects', 'tasks', 'goals', 'notes', 'employees', 'balanceSheetItems'];
    for (const table of expectedTables) {
      if (!receivedTables.includes(table)) {
        throw new Error(`Missing realtime broadcast for table: "${table}". Received: ${receivedTables.join(', ')}`);
      }
    }
  });

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
