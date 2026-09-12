import 'fake-indexeddb/auto';
import { db } from './db/db';
import { seedDemoData } from './db/seed';
import { undoConfirmedToolAction } from './ai/undoService';
import { updateAIMessage, createConversation, saveAIMessage } from './db/services/aiStorageService';
import { onboardClientProject } from './db/services/onboardingService';
import {
  reengageStalledDeals,
  mitigateCustomerRisk,
  onboardEmployee,
  launchFeatureSprint,
  auditVendorExpense,
  generateInvestorReport,
  recoverOverdueInvoices,
  launchAccountExpansion,
  createScopeChangeOrder,
  runRevenueWarRoom,
} from './db/services/founderWorkflowsService';
import { executeLocalTool } from './ai/tools';

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
  console.log('\n================================================================');
  console.log('🔄 FOUNDEROS APPROVAL PERSISTENCE & AUTO-UNDO TEST SUITE');
  console.log('================================================================\n');

  await seedDemoData();

  const conv = await createConversation('Undo & Persistence Verification');
  const convId = conv.id;

  // Helper to create a test message with a tool call
  const setupTestMessage = async (name: string, args: Record<string, any>) => {
    const toolCallId = `tc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const msg = await saveAIMessage({
      conversationId: convId,
      role: 'assistant',
      content: `Proposed action for ${name}`,
      toolCalls: [
        {
          id: toolCallId,
          name,
          arguments: args,
          status: 'pending_confirmation',
        },
      ],
    });
    return { messageId: msg.id, toolCallId };
  };

  // ----------------------------------------------------
  // TEST 1: Client Intake Onboarding -> Approval -> Undo
  // ----------------------------------------------------
  console.log('--- 1. CLIENT INTAKE PROVISIONING & UNDO ---');

  await test('Approving client intake provisions 7 modules, persisting executed state to aiMessages', async () => {
    const { messageId, toolCallId } = await setupTestMessage('onboardClientProject', {
      companyName: 'Apex Robotics',
      projectTitle: 'E-commerce Portal',
      totalDealValue: 4000,
    });

    const res = await onboardClientProject({
      companyName: 'Apex Robotics',
      contactName: 'Sarah Connor',
      email: 'sarah@apexrobotics.io',
      projectTitle: 'E-commerce Portal',
      serviceCategory: 'Website Development',
      totalDealValue: 4000,
      depositAmount: 2000,
      notes: 'Autonomous navigation portal',
      milestones: [{ title: 'Setup Repo', priority: 'high' }],
    });

    // Persist to aiMessages
    const msg = await db.aiMessages.get(messageId);
    const updated = msg!.toolCalls!.map((tc) =>
      tc.id === toolCallId ? { ...tc, status: 'executed' as const, result: res } : tc
    );
    await updateAIMessage(messageId, { toolCalls: updated });

    // Verify DB records exist
    const cust = await db.customers.get(res.customer.id);
    if (!cust) throw new Error('Customer was not created in DB');

    const proj = await db.projects.get(res.project.id);
    if (!proj) throw new Error('Project was not created in DB');

    // Verify aiMessage has executed status and result stored
    const checkMsg = await db.aiMessages.get(messageId);
    const checkTc = checkMsg!.toolCalls!.find((t) => t.id === toolCallId);
    if (checkTc?.status !== 'executed' || !checkTc.result) {
      throw new Error('aiMessages tool call status was not updated to executed with result');
    }

    // Now execute UNDO
    const undoRes = await undoConfirmedToolAction(
      messageId,
      toolCallId,
      'onboardClientProject',
      res,
      {}
    );

    if (!undoRes.success) throw new Error(`Undo failed: ${undoRes.message}`);

    // Verify records are rolled back/deleted
    const custAfter = await db.customers.get(res.customer.id);
    if (custAfter) throw new Error('Customer was not removed on undo');

    const projAfter = await db.projects.get(res.project.id);
    if (projAfter) throw new Error('Project was not removed on undo');

    // Verify aiMessage tool call status is now 'undone'
    const finalMsg = await db.aiMessages.get(messageId);
    const finalTc = finalMsg!.toolCalls!.find((t) => t.id === toolCallId);
    if (finalTc?.status !== 'undone') {
      throw new Error(`Expected status 'undone', found '${finalTc?.status}'`);
    }
  });

  // ----------------------------------------------------
  // TEST 2: Deal Win-Back Campaign -> Approval -> Undo
  // ----------------------------------------------------
  console.log('--- 2. STALLED DEAL WIN-BACK & UNDO ---');

  await test('Deal win-back campaign can be undone, reverting deal stages and removing tasks/notes', async () => {
    const { messageId, toolCallId } = await setupTestMessage('reengageStalledDeals', {
      daysInactive: 14,
    });

    const res = await reengageStalledDeals({
      daysInactive: 7,
      discountPercent: 10,
      strategy: 'value_add',
      customNote: 'Pitch the redesign roadmap.',
    });

    if (res.revivedDeals.length === 0) throw new Error('No deals were revived');

    // Persist executed status
    const msg = await db.aiMessages.get(messageId);
    const updated = msg!.toolCalls!.map((tc) =>
      tc.id === toolCallId ? { ...tc, status: 'executed' as const, result: res } : tc
    );
    await updateAIMessage(messageId, { toolCalls: updated });

    // Verify playbook note exists
    const note = await db.notes.get(res.playbookNote.id);
    if (!note) throw new Error('Playbook note not found');

    // Run Undo
    const undoRes = await undoConfirmedToolAction(
      messageId,
      toolCallId,
      'reengageStalledDeals',
      res,
      {}
    );
    if (!undoRes.success) throw new Error(`Undo failed: ${undoRes.message}`);

    // Verify note is deleted
    const noteAfter = await db.notes.get(res.playbookNote.id);
    if (noteAfter) throw new Error('Playbook note was not deleted on undo');

    // Verify follow-up tasks were removed
    for (const t of res.tasksCreated) {
      const taskAfter = await db.tasks.get(t.id);
      if (taskAfter) throw new Error(`Task ${t.id} was not deleted on undo`);
    }

    // Verify aiMessage tool call is undone
    const checkMsg = await db.aiMessages.get(messageId);
    if (checkMsg!.toolCalls![0].status !== 'undone') {
      throw new Error('Tool call status was not updated to undone');
    }
  });

  // ----------------------------------------------------
  // TEST 3: Customer Churn Mitigation -> Approval -> Undo
  // ----------------------------------------------------
  console.log('--- 3. CUSTOMER RISK MITIGATION & UNDO ---');

  await test('Customer risk protocol can be undone, restoring customer status and removing tickets', async () => {
    const { messageId, toolCallId } = await setupTestMessage('mitigateCustomerRisk', {
      companyName: 'Acme Test Corp',
    });

    const res = await mitigateCustomerRisk({
      companyName: 'Acme Test Corp',
      issueDescription: 'API integration timeout issue',
      monthlyRevenue: 3000,
      severity: 'critical',
    });

    // Check customer is at_risk
    const cust = await db.customers.get(res.customer.id);
    if (cust?.status !== 'at_risk') throw new Error('Customer was not marked at_risk');

    // Undo
    const undoRes = await undoConfirmedToolAction(
      messageId,
      toolCallId,
      'mitigateCustomerRisk',
      res,
      {}
    );
    if (!undoRes.success) throw new Error(`Undo failed: ${undoRes.message}`);

    // Verify customer status reverted to active
    const custAfter = await db.customers.get(res.customer.id);
    if (custAfter?.status !== 'active') {
      throw new Error(`Customer status not restored to active, got: ${custAfter?.status}`);
    }

    // Verify bug ticket removed
    const bugAfter = await db.bugs.get(res.bug.id);
    if (bugAfter) throw new Error('Bug ticket was not removed on undo');
  });

  // ----------------------------------------------------
  // TEST 4: Employee Onboarding -> Approval -> Undo
  // ----------------------------------------------------
  console.log('--- 4. EMPLOYEE ONBOARDING & UNDO ---');

  await test('Employee onboarding can be undone, removing employee, payroll, and ramp tasks', async () => {
    const { messageId, toolCallId } = await setupTestMessage('onboardEmployee', {
      name: 'Jordan Miller',
    });

    const res = await onboardEmployee({
      name: 'Jordan Miller',
      role: 'DevOps Specialist',
      departmentName: 'Infrastructure',
      monthlySalary: 5500,
    });

    const emp = await db.employees.get(res.employee.id);
    if (!emp) throw new Error('Employee was not created');

    // Undo
    const undoRes = await undoConfirmedToolAction(
      messageId,
      toolCallId,
      'onboardEmployee',
      res,
      {}
    );
    if (!undoRes.success) throw new Error(`Undo failed: ${undoRes.message}`);

    const empAfter = await db.employees.get(res.employee.id);
    if (empAfter) throw new Error('Employee was not removed on undo');

    const txAfter = await db.transactions.get(res.transaction.id);
    if (txAfter) throw new Error('Payroll transaction was not removed on undo');
  });

  // ----------------------------------------------------
  // TEST 5: Feature Sprint -> Approval -> Undo
  // ----------------------------------------------------
  console.log('--- 5. FEATURE SPRINT & UNDO ---');

  await test('Feature sprint launch can be undone, removing feature, tasks, and PRD', async () => {
    const { messageId, toolCallId } = await setupTestMessage('launchFeatureSprint', {
      title: 'Dark Mode Switcher',
    });

    const res = await launchFeatureSprint({
      title: 'Dark Mode Switcher',
      description: 'Theme preference toggle',
      priority: 'medium',
      impact: 'medium',
      effort: 'low',
    });

    const feat = await db.features.get(res.feature.id);
    if (!feat) throw new Error('Feature was not created');

    // Undo
    const undoRes = await undoConfirmedToolAction(
      messageId,
      toolCallId,
      'launchFeatureSprint',
      res,
      {}
    );
    if (!undoRes.success) throw new Error(`Undo failed: ${undoRes.message}`);

    const featAfter = await db.features.get(res.feature.id);
    if (featAfter) throw new Error('Feature was not removed on undo');
  });

  // ----------------------------------------------------
  // TEST 6: Vendor Expense Audit -> Approval -> Undo
  // ----------------------------------------------------
  console.log('--- 6. VENDOR EXPENSE & UNDO ---');

  await test('Vendor expense can be undone, removing outflow transaction and audit task', async () => {
    const { messageId, toolCallId } = await setupTestMessage('auditVendorExpense', {
      vendorName: 'Datadog Monitoring',
    });

    const res = await auditVendorExpense({
      vendorName: 'Datadog Monitoring',
      monthlyCost: 600,
      category: 'saas_tools',
      renewalCycle: 'monthly',
      notes: 'APM metrics monitoring',
    });

    const tx = await db.transactions.get(res.transaction.id);
    if (!tx) throw new Error('Expense transaction not found');

    // Undo
    const undoRes = await undoConfirmedToolAction(
      messageId,
      toolCallId,
      'auditVendorExpense',
      res,
      {}
    );
    if (!undoRes.success) throw new Error(`Undo failed: ${undoRes.message}`);

    const txAfter = await db.transactions.get(res.transaction.id);
    if (txAfter) throw new Error('Transaction was not removed on undo');
  });

  // ----------------------------------------------------
  // TEST 7: Investor Update -> Approval -> Undo
  // ----------------------------------------------------
  console.log('--- 7. INVESTOR UPDATE & UNDO ---');

  await test('Investor report can be undone, removing investor note and task', async () => {
    const { messageId, toolCallId } = await setupTestMessage('generateInvestorReport', {});

    const res = await generateInvestorReport({
      monthYear: 'October 2026',
      keyWins: ['Signed 2 enterprise pilots'],
    });

    const note = await db.notes.get(res.note.id);
    if (!note) throw new Error('Investor note not found');

    // Undo
    const undoRes = await undoConfirmedToolAction(
      messageId,
      toolCallId,
      'generateInvestorReport',
      res,
      {}
    );
    if (!undoRes.success) throw new Error(`Undo failed: ${undoRes.message}`);

    const noteAfter = await db.notes.get(res.note.id);
    if (noteAfter) throw new Error('Investor note was not removed on undo');
  });

  // ----------------------------------------------------
  // TEST 8: Invoice Recovery Sequence -> Approval -> Undo
  // ----------------------------------------------------
  console.log('--- 8. INVOICE RECOVERY & UNDO ---');

  await test('Invoice recovery can be undone, removing verification tasks and note', async () => {
    const { messageId, toolCallId } = await setupTestMessage('recoverOverdueInvoices', {});

    const res = await recoverOverdueInvoices({
      gracePeriodDays: 5,
      reminderTone: 'firm',
    });

    // Undo
    const undoRes = await undoConfirmedToolAction(
      messageId,
      toolCallId,
      'recoverOverdueInvoices',
      res,
      {}
    );
    if (!undoRes.success) throw new Error(`Undo failed: ${undoRes.message}`);

    const noteAfter = await db.notes.get(res.auditNote.id);
    if (noteAfter) throw new Error('AR audit note was not removed on undo');
  });

  // ----------------------------------------------------
  // TEST 9: Account Expansion Deal -> Approval -> Undo
  // ----------------------------------------------------
  console.log('--- 9. ACCOUNT EXPANSION & UNDO ---');

  await test('Account expansion deal can be undone, removing expansion deal and proposal note', async () => {
    const { messageId, toolCallId } = await setupTestMessage('launchAccountExpansion', {
      customerName: 'Acme Growth Corp',
    });

    const res = await launchAccountExpansion({
      customerName: 'Acme Growth Corp',
      monthlyRetainer: 2000,
      serviceTier: 'enterprise',
      focusAreas: ['Priority SLA', 'Custom Integrations'],
    });

    const deal = await db.deals.get(res.deal.id);
    if (!deal) throw new Error('Expansion deal not found');

    // Undo
    const undoRes = await undoConfirmedToolAction(
      messageId,
      toolCallId,
      'launchAccountExpansion',
      res,
      {}
    );
    if (!undoRes.success) throw new Error(`Undo failed: ${undoRes.message}`);

    const dealAfter = await db.deals.get(res.deal.id);
    if (dealAfter) throw new Error('Expansion deal was not removed on undo');
  });

  // ----------------------------------------------------
  // TEST 10: Scope-Creep Defense Order -> Approval -> Undo
  // ----------------------------------------------------
  console.log('--- 10. SCOPE DEFENSE & UNDO ---');

  await test('Scope defense change order can be undone, removing change order invoice and memo', async () => {
    const { messageId, toolCallId } = await setupTestMessage('createScopeChangeOrder', {
      clientName: 'Globex Corp',
    });

    const res = await createScopeChangeOrder({
      clientName: 'Globex Corp',
      featureRequested: 'AI Chatbot Integration',
      additionalFee: 1800,
      additionalDays: 10,
    });

    const inv = await db.invoices.get(res.invoice.id);
    if (!inv) throw new Error('Change order invoice not found');

    // Undo
    const undoRes = await undoConfirmedToolAction(
      messageId,
      toolCallId,
      'createScopeChangeOrder',
      res,
      {}
    );
    if (!undoRes.success) throw new Error(`Undo failed: ${undoRes.message}`);

    const invAfter = await db.invoices.get(res.invoice.id);
    if (invAfter) throw new Error('Change order invoice was not removed on undo');
  });

  // ----------------------------------------------------
  // TEST 11: Monday Revenue War Room -> Approval -> Undo
  // ----------------------------------------------------
  console.log('--- 11. REVENUE WAR ROOM & UNDO ---');

  await test('Revenue war room can be undone, removing CEO priorities and briefing note', async () => {
    const { messageId, toolCallId } = await setupTestMessage('runRevenueWarRoom', {
      sprintRevenueTarget: 15000,
    });

    const res = await runRevenueWarRoom({
      sprintRevenueTarget: 15000,
      focusArea: 'closing_pipeline',
    });

    const note = await db.notes.get(res.note.id);
    if (!note) throw new Error('War room briefing note not found');

    // Undo
    const undoRes = await undoConfirmedToolAction(
      messageId,
      toolCallId,
      'runRevenueWarRoom',
      res,
      {}
    );
    if (!undoRes.success) throw new Error(`Undo failed: ${undoRes.message}`);

    const noteAfter = await db.notes.get(res.note.id);
    if (noteAfter) throw new Error('War room note was not removed on undo');

    for (const t of res.tasks) {
      const taskAfter = await db.tasks.get(t.id);
      if (taskAfter) throw new Error(`Task ${t.id} was not deleted on undo`);
    }
  });

  // ----------------------------------------------------
  // TEST 12: Generic CRUD Tool Call -> Approval -> Undo
  // ----------------------------------------------------
  console.log('--- 12. GENERIC CRUD TOOL ACTION & UNDO ---');

  await test('Generic tool call (createTask) can be undone, removing created record from IndexedDB', async () => {
    const { messageId, toolCallId } = await setupTestMessage('createTask', {
      title: 'Review Quarterly Taxes',
      priority: 'high',
    });

    const taskRes = await executeLocalTool('createTask', {
      title: 'Review Quarterly Taxes',
      priority: 'high',
    });

    if (!taskRes.success || !taskRes.task?.id) throw new Error('createTask failed');
    const taskId = taskRes.task.id;

    // Update message toolCall to executed
    const msg = await db.aiMessages.get(messageId);
    const updated = msg!.toolCalls!.map((tc) =>
      tc.id === toolCallId ? { ...tc, status: 'executed' as const, result: taskRes } : tc
    );
    await updateAIMessage(messageId, { toolCalls: updated });

    // Verify task exists
    const task = await db.tasks.get(taskId);
    if (!task) throw new Error('Task was not created');

    // Undo
    const undoRes = await undoConfirmedToolAction(
      messageId,
      toolCallId,
      'createTask',
      taskRes,
      { title: 'Review Quarterly Taxes' }
    );
    if (!undoRes.success) throw new Error(`Undo failed: ${undoRes.message}`);

    // Verify task deleted
    const taskAfter = await db.tasks.get(taskId);
    if (taskAfter) throw new Error('Task was not removed on undo');

    // Verify aiMessages status is undone
    const checkMsg = await db.aiMessages.get(messageId);
    if (checkMsg!.toolCalls![0].status !== 'undone') {
      throw new Error('Tool call status was not updated to undone');
    }
  });

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n================================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
