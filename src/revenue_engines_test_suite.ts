import 'fake-indexeddb/auto';
import { db } from './db/db';
import { seedDemoData } from './db/seed';
import { processConversationTurn, executeConfirmedToolAction } from './ai/toolRunner';
import { createConversation } from './db/services/aiStorageService';
import { executeLocalTool } from './ai/tools';
import { getActionPreview, verifyActionExecution } from './ai/actionPreviewService';
import {
  reengageStalledDeals,
  recoverOverdueInvoices,
  launchAccountExpansion,
  createScopeChangeOrder,
  runRevenueWarRoom,
} from './db/services/founderWorkflowsService';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = performance.now();
  try {
    await fn();
    const durationMs = Math.round(performance.now() - start);
    results.push({ name, passed: true, durationMs });
    console.log(`  ✓ PASS: ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - start);
    results.push({ name, passed: false, error: err.message, durationMs });
    console.error(`  ✗ FAIL: ${name}: ${err.message}`);
  }
}

async function runAll() {
  console.log('\n======================================================');
  console.log('🚀 FOUNDEROS 5 REVENUE BOOSTER & EFFICIENCY WORKFLOWS');
  console.log('======================================================\n');

  // Seed DB before tests
  await seedDemoData();

  // ----------------------------------------------------
  // WORKFLOW 1: STALLED DEAL RE-ENGAGEMENT & WIN-BACK
  // ----------------------------------------------------
  console.log('--- 1. WORKFLOW 1: STALLED DEAL RE-ENGAGEMENT ---');

  await test('reengageStalledDeals revives dormant deals, schedules 48h tasks, and drafts playbook note', async () => {
    const res = await reengageStalledDeals({
      daysInactive: 10,
      discountPercent: 15,
      strategy: 'value_add',
      customNote: 'Pitch the new enterprise security module.',
    });

    if (!res.success) throw new Error('reengageStalledDeals returned false');
    if (!res.revivedDeals || res.revivedDeals.length === 0) throw new Error('No deals were revived');
    if (!res.tasksCreated || res.tasksCreated.length !== res.revivedDeals.length) {
      throw new Error('Tasks count does not match revived deals');
    }
    if (!res.playbookNote || !res.playbookNote.title.includes('Win-Back Playbook')) {
      throw new Error('Playbook note was not created or title mismatch');
    }

    // Verify in DB directly
    const firstTask = await db.tasks.get(res.tasksCreated[0].id);
    if (!firstTask || firstTask.priority !== 'high') throw new Error('First task not in DB or wrong priority');

    const note = await db.notes.get(res.playbookNote.id);
    if (!note || !note.content.includes('15%')) throw new Error('Playbook note not stored in DB or missing discount');
  });

  // ----------------------------------------------------
  // WORKFLOW 2: OVERDUE INVOICE & RECEIVABLES CASH RECOVERY
  // ----------------------------------------------------
  console.log('\n--- 2. WORKFLOW 2: OVERDUE INVOICE CASH RECOVERY ---');

  await test('recoverOverdueInvoices tags customers, creates wire tasks, and audits AR', async () => {
    // Add an overdue invoice first to guarantee test data
    const overdueDate = new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0];
    await db.invoices.add({
      id: `inv_test_${Date.now()}`,
      customerId: 'cust_test_999',
      customerName: 'Test Overdue Corp',
      invoiceNumber: 'INV-TEST-999',
      amount: 4200,
      currency: 'USD',
      status: 'sent',
      issueDate: overdueDate,
      dueDate: overdueDate,
      createdAt: overdueDate,
      updatedAt: overdueDate,
    });

    const res = await recoverOverdueInvoices({
      gracePeriodDays: 3,
      reminderTone: 'firm',
    });

    if (!res.success) throw new Error('recoverOverdueInvoices returned false');
    if (res.totalChased < 4200) throw new Error(`Expected at least $4200 chased, got ${res.totalChased}`);
    if (res.invoicesChased.length === 0) throw new Error('No invoices chased');
    if (res.tasksCreated.length === 0) throw new Error('No wire audit tasks created');
    if (!res.auditNote || !res.auditNote.title.includes('Accounts Receivable')) {
      throw new Error('Audit note not created in Notes');
    }
  });

  // ----------------------------------------------------
  // WORKFLOW 3: EXISTING CUSTOMER RETAINER & EXPANSION
  // ----------------------------------------------------
  console.log('\n--- 3. WORKFLOW 3: CUSTOMER RETAINER & EXPANSION ---');

  await test('launchAccountExpansion creates deal, pitch task, 1-page proposal, and updates goal', async () => {
    const res = await launchAccountExpansion({
      customerName: 'Stark Industries',
      monthlyRetainer: 2500,
      serviceTier: 'growth',
      focusAreas: ['API Optimization', 'Security Patches', '24/7 Monitoring'],
      targetPitchDate: '2026-10-15',
    });

    if (!res.success) throw new Error('launchAccountExpansion returned false');
    if (res.deal.value !== 2500) throw new Error(`Deal value mismatch: expected 2500, got ${res.deal.value}`);
    if (!res.deal.name.includes('Retainer Expansion')) throw new Error('Deal title mismatch');
    if (res.pitchTask.dueDate !== '2026-10-15') throw new Error('Pitch task dueDate mismatch');
    if (!res.proposalNote.content.includes('$30,000')) throw new Error('Proposal note missing annual value ($30,000)');
    if (res.updatedGoal.target < 30000) throw new Error('Company OKR goal target not updated');
  });

  // ----------------------------------------------------
  // WORKFLOW 4: SCOPE-CREEP DEFENSE & CHANGE ORDER
  // ----------------------------------------------------
  console.log('\n--- 4. WORKFLOW 4: SCOPE DEFENSE & CHANGE ORDER ---');

  await test('createScopeChangeOrder issues invoice, extends project timeline, and writes counter-offer memo', async () => {
    const res = await createScopeChangeOrder({
      clientName: 'Wayne Enterprises',
      featureRequested: 'Real-time WebSocket streaming analytics engine',
      additionalFee: 2800,
      additionalDays: 10,
    });

    if (!res.success) throw new Error('createScopeChangeOrder returned false');
    if (res.invoice.amount !== 2800) throw new Error(`Invoice amount mismatch: expected 2800, got ${res.invoice.amount}`);
    if (res.adjustedDays !== 10) throw new Error('Adjusted days mismatch');
    if (res.scopeTasks.length === 0) throw new Error('No scope backlog tasks created');
    if (!res.counterOfferNote.content.includes('Option 1: Approve Change Order')) {
      throw new Error('Counter-offer memo missing Option 1');
    }

    // Verify invoice is stored in db
    const inv = await db.invoices.get(res.invoice.id);
    if (!inv || inv.amount !== 2800) throw new Error('Change order invoice not found in DB');
  });

  // ----------------------------------------------------
  // WORKFLOW 5: MONDAY REVENUE WAR ROOM
  // ----------------------------------------------------
  console.log('\n--- 5. WORKFLOW 5: MONDAY REVENUE WAR ROOM ---');

  await test('runRevenueWarRoom calculates financial metrics, pins top 3 CEO tasks, and publishes briefing', async () => {
    const res = await runRevenueWarRoom({
      sprintRevenueTarget: 15000,
      focusArea: 'closing_pipeline',
    });

    if (!res.success) throw new Error('runRevenueWarRoom returned false');
    if (res.metrics.targetSprintRevenue !== 15000) throw new Error('Sprint target mismatch');
    if (res.priorityTasks.length !== 3) throw new Error(`Expected 3 priority tasks, got ${res.priorityTasks.length}`);
    if (!res.warRoomNote.title.includes('Revenue War Room')) {
      throw new Error('War room briefing note not created');
    }

    // Verify tasks in db
    for (const t of res.priorityTasks) {
      const task = await db.tasks.get(t.id);
      if (!task || !task.tags.includes('war-room')) throw new Error('Priority task missing war-room tag');
    }
  });

  // ----------------------------------------------------
  // AI TOOLS DISPATCH (executeLocalTool)
  // ----------------------------------------------------
  console.log('\n--- 6. AI TOOL DISPATCH (executeLocalTool) ---');

  await test('executeLocalTool dispatches all 5 new tools properly', async () => {
    const t1 = await executeLocalTool('reengageStalledDeals', { daysInactive: 14 });
    if (!t1.success) throw new Error('t1 reengageStalledDeals failed');

    const t2 = await executeLocalTool('recoverOverdueInvoices', { gracePeriodDays: 5 });
    if (!t2.success) throw new Error('t2 recoverOverdueInvoices failed');

    const t3 = await executeLocalTool('launchAccountExpansion', {
      customerName: 'Globex Corp',
      monthlyRetainer: 2000,
      serviceTier: 'growth',
    });
    if (!t3.success) throw new Error('t3 launchAccountExpansion failed');

    const t4 = await executeLocalTool('createScopeChangeOrder', {
      clientName: 'Globex Corp',
      featureRequested: 'SSO SAML Integration',
      additionalFee: 1500,
      additionalDays: 7,
    });
    if (!t4.success) throw new Error('t4 createScopeChangeOrder failed');

    const t5 = await executeLocalTool('runRevenueWarRoom', {
      sprintRevenueTarget: 12000,
      focusArea: 'upsell_existing',
    });
    if (!t5.success) throw new Error('t5 runRevenueWarRoom failed');
  });

  // ----------------------------------------------------
  // ACTION PREVIEWS & VERIFICATION
  // ----------------------------------------------------
  console.log('\n--- 7. ACTION PREVIEWS & VERIFICATION ---');

  await test('getActionPreview provides accurate diffs and affected tables for all 5 tools', async () => {
    const p1 = await getActionPreview('reengageStalledDeals', { daysInactive: 14 });
    if (!p1.affectedTables.includes('deals') || !p1.affectedTables.includes('tasks') || !p1.affectedTables.includes('notes')) {
      throw new Error('p1 affectedTables mismatch');
    }

    const p2 = await getActionPreview('recoverOverdueInvoices', { gracePeriodDays: 5 });
    if (!p2.affectedTables.includes('invoices') || !p2.affectedTables.includes('tasks')) {
      throw new Error('p2 affectedTables mismatch');
    }

    const p3 = await getActionPreview('launchAccountExpansion', { customerName: 'Cyberdyne', monthlyRetainer: 3000 });
    if (!p3.affectedTables.includes('goals') || !p3.affectedTables.includes('deals')) {
      throw new Error('p3 affectedTables mismatch');
    }

    const p4 = await getActionPreview('createScopeChangeOrder', { clientName: 'Cyberdyne', additionalFee: 2000 });
    if (!p4.affectedTables.includes('projects') || !p4.affectedTables.includes('invoices')) {
      throw new Error('p4 affectedTables mismatch');
    }

    const p5 = await getActionPreview('runRevenueWarRoom', { sprintRevenueTarget: 20000 });
    if (!p5.affectedTables.includes('tasks') || !p5.affectedTables.includes('notes')) {
      throw new Error('p5 affectedTables mismatch');
    }
  });

  await test('verifyActionExecution confirms database mutations for all 5 tools', async () => {
    const v1 = await verifyActionExecution('reengageStalledDeals', {}, {});
    if (!v1.verified) throw new Error(`v1 verification failed: ${v1.message}`);

    const v2 = await verifyActionExecution('recoverOverdueInvoices', {}, {});
    if (!v2.verified) throw new Error(`v2 verification failed: ${v2.message}`);

    const v3 = await verifyActionExecution('launchAccountExpansion', {}, { customerName: 'Cyberdyne' });
    if (!v3.verified) throw new Error(`v3 verification failed: ${v3.message}`);

    const v4 = await verifyActionExecution('createScopeChangeOrder', {}, { clientName: 'Cyberdyne' });
    if (!v4.verified) throw new Error(`v4 verification failed: ${v4.message}`);

    const v5 = await verifyActionExecution('runRevenueWarRoom', {}, {});
    if (!v5.verified) throw new Error(`v5 verification failed: ${v5.message}`);
  });

  // ----------------------------------------------------
  // CONVERSATIONAL INTENT DETECTION & CONFIRMED EXECUTION
  // ----------------------------------------------------
  console.log('\n--- 8. INTENT DETECTION & CONFIRMED EXECUTION ---');

  await test('Process turn detects Stalled Deals win-back prompt', async () => {
    const conv = await createConversation('Test Stalled Deals Turn');
    const res = await processConversationTurn({
      conversationId: conv.id,
      userPrompt: 'We have stalled deals inactive for 25 days, offer 10% discount and win back the pipeline',
      history: [],
    });

    if (!res.proposedActions || res.proposedActions.length === 0) {
      throw new Error('No proposed actions returned');
    }
    const action = res.proposedActions[0];
    if (action.name !== 'reengageStalledDeals') {
      throw new Error(`Expected reengageStalledDeals, got ${action.name}`);
    }
    if (action.arguments.daysInactive !== 25) {
      throw new Error(`Expected daysInactive 25, got ${action.arguments.daysInactive}`);
    }
    if (action.arguments.discountPercent !== 10) {
      throw new Error(`Expected discountPercent 10, got ${action.arguments.discountPercent}`);
    }
  });

  await test('Process turn detects Overdue Invoice Cash Recovery prompt', async () => {
    const conv = await createConversation('Test Overdue Invoices Turn');
    const res = await processConversationTurn({
      conversationId: conv.id,
      userPrompt: 'Chase overdue invoices with 7 days grace period and recover cash',
      history: [],
    });

    if (!res.proposedActions || res.proposedActions.length === 0) {
      throw new Error('No proposed actions returned');
    }
    const action = res.proposedActions[0];
    if (action.name !== 'recoverOverdueInvoices') {
      throw new Error(`Expected recoverOverdueInvoices, got ${action.name}`);
    }
    if (action.arguments.gracePeriodDays !== 7) {
      throw new Error(`Expected gracePeriodDays 7, got ${action.arguments.gracePeriodDays}`);
    }
  });

  await test('Process turn detects Account Expansion prompt', async () => {
    const conv = await createConversation('Test Retainer Turn');
    const res = await processConversationTurn({
      conversationId: conv.id,
      userPrompt: 'Let us pitch a retainer to Oscorp for $3000 per month',
      history: [],
    });

    if (!res.proposedActions || res.proposedActions.length === 0) {
      throw new Error('No proposed actions returned');
    }
    const action = res.proposedActions[0];
    if (action.name !== 'launchAccountExpansion') {
      throw new Error(`Expected launchAccountExpansion, got ${action.name}`);
    }
    if (action.arguments.monthlyRetainer !== 3000) {
      throw new Error(`Expected monthlyRetainer 3000, got ${action.arguments.monthlyRetainer}`);
    }
  });

  await test('Process turn detects Scope-Creep Defense prompt', async () => {
    const conv = await createConversation('Test Scope Defense Turn');
    const res = await processConversationTurn({
      conversationId: conv.id,
      userPrompt: 'Client Oscorp is having scope creep asking for custom exports costing $1800 with 6 days delay',
      history: [],
    });

    if (!res.proposedActions || res.proposedActions.length === 0) {
      throw new Error('No proposed actions returned');
    }
    const action = res.proposedActions[0];
    if (action.name !== 'createScopeChangeOrder') {
      throw new Error(`Expected createScopeChangeOrder, got ${action.name}`);
    }
    if (action.arguments.additionalFee !== 1800) {
      throw new Error(`Expected additionalFee 1800, got ${action.arguments.additionalFee}`);
    }
    if (action.arguments.additionalDays !== 6) {
      throw new Error(`Expected additionalDays 6, got ${action.arguments.additionalDays}`);
    }
  });

  await test('Process turn detects Revenue War Room prompt and executes with verification', async () => {
    const conv = await createConversation('Test War Room Turn');
    const res = await processConversationTurn({
      conversationId: conv.id,
      userPrompt: 'Launch the Monday revenue war room with target of $18000',
      history: [],
    });

    if (!res.proposedActions || res.proposedActions.length === 0) {
      throw new Error('No proposed actions returned');
    }
    const action = res.proposedActions[0];
    if (action.name !== 'runRevenueWarRoom') {
      throw new Error(`Expected runRevenueWarRoom, got ${action.name}`);
    }
    if (action.arguments.sprintRevenueTarget !== 18000) {
      throw new Error(`Expected sprintRevenueTarget 18000, got ${action.arguments.sprintRevenueTarget}`);
    }

    // Now test executeConfirmedToolAction on this tool call
    const execRes = await executeConfirmedToolAction(
      res.assistantMessage.id,
      action.id,
      action.name,
      action.arguments
    );

    if (!execRes.success) throw new Error('executeConfirmedToolAction failed');
    if (!execRes.verification?.verified) {
      throw new Error(`Verification failed on confirmed tool action: ${execRes.verification?.message}`);
    }
  });

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n======================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TESTS COMPLETED: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error('Fatal error running test suite:', err);
  process.exit(1);
});
