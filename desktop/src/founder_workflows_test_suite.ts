import 'fake-indexeddb/auto';
import { db } from './db/db';
import { seedDemoData } from './db/seed';
import { processConversationTurn, executeConfirmedToolAction } from './ai/toolRunner';
import { createConversation } from './db/services/aiStorageService';
import {
  mitigateCustomerRisk,
  onboardEmployee,
  launchFeatureSprint,
  auditVendorExpense,
  generateInvestorReport,
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
  console.log('🚀 FOUNDEROS 5 AI CEO WORKFLOWS TEST SUITE');
  console.log('======================================================\n');

  // Seed DB before tests
  await seedDemoData();

  // ----------------------------------------------------
  // WORKFLOW 1: CUSTOMER CHURN RISK & FIRE DRILL
  // ----------------------------------------------------
  console.log('--- 1. WORKFLOW 1: CUSTOMER CHURN FIRE DRILL ---');

  await test('mitigateCustomerRisk provisions CRM, P0 Bug, Tasks, and Retention Memo', async () => {
    const res = await mitigateCustomerRisk({
      companyName: 'Acme MegaCorp',
      issueDescription: 'Mobile app crash on PDF export threatening immediate cancellation.',
      monthlyRevenue: 3500,
      severity: 'critical',
    });

    if (!res.success) throw new Error('Mitigation failed');
    if (res.customer.status !== 'at_risk') throw new Error('Customer status was not updated to at_risk');
    if (res.bug.priority !== 'critical') throw new Error('Bug was not set to critical');
    if (res.tasks.length < 2) throw new Error('Did not create 2 emergency tasks');
    if (!res.note.title.includes('Acme MegaCorp')) throw new Error('Retention note not titled properly');

    // Raw IndexedDB verification
    const custInDb = await db.customers.get(res.customer.id);
    if (!custInDb || custInDb.status !== 'at_risk') throw new Error('Customer not verified at_risk in DB');

    const bugInDb = await db.bugs.get(res.bug.id);
    if (!bugInDb) throw new Error('Bug not found in DB');

    const noteInDb = await db.notes.get(res.note.id);
    if (!noteInDb) throw new Error('Retention note not found in DB');
  });

  await test('In-chat intent detects churn risk and generates mitigateCustomerRisk toolCall', async () => {
    const conv = await createConversation('Risk Chat');

    const turn = await processConversationTurn({
      conversationId: conv.id,
      userPrompt: 'Acme Corp is upset because the CSV export is broken and they might cancel their 2500$ plan',
      history: [],
    });

    const calls = turn.proposedActions || [];
    const riskCall = calls.find((c) => c.name === 'mitigateCustomerRisk');
    if (!riskCall) throw new Error('Expected mitigateCustomerRisk tool call to be proposed');
    if (riskCall.arguments.companyName !== 'Acme Corp') throw new Error('Failed to extract Acme Corp');
  });

  // ----------------------------------------------------
  // WORKFLOW 2: TEAM HIRE & ONBOARDING
  // ----------------------------------------------------
  console.log('\n--- 2. WORKFLOW 2: TEAM HIRE & ONBOARDING ---');

  await test('onboardEmployee provisions Directory, Payroll, Tasks, and 90-Day Goal', async () => {
    const res = await onboardEmployee({
      name: 'Elena Rostova',
      role: 'Staff Frontend Engineer',
      departmentName: 'Engineering',
      monthlySalary: 6000,
    });

    if (!res.success) throw new Error('Onboarding failed');
    if (res.employee.name !== 'Elena Rostova') throw new Error('Employee name mismatch');
    if (res.transaction.amount !== 6000 || (res.transaction.category !== 'Salary' && res.transaction.category !== 'payroll')) {
      throw new Error('Payroll transaction incorrect');
    }
    if (res.tasks.length !== 5) throw new Error('Expected 5 ramp-up tasks');
    if (!res.goal.title.includes('Elena Rostova')) throw new Error('90-day goal not set');

    // DB verification
    const empInDb = await db.employees.get(res.employee.id);
    if (!empInDb) throw new Error('Employee not found in DB');

    const txInDb = await db.transactions.get(res.transaction.id);
    if (!txInDb) throw new Error('Payroll transaction not found in DB');
  });

  await test('In-chat intent detects team hire and generates onboardEmployee toolCall', async () => {
    const conv = await createConversation('Hire Chat');

    const turn = await processConversationTurn({
      conversationId: conv.id,
      userPrompt: 'I just hired Alex as a Full-Stack Engineer for $4500/month starting next Monday',
      history: [],
    });

    const calls = turn.proposedActions || [];
    const hireCall = calls.find((c) => c.name === 'onboardEmployee');
    if (!hireCall) throw new Error('Expected onboardEmployee tool call to be proposed');
    if (hireCall.arguments.monthlySalary !== 4500) throw new Error('Salary not parsed correctly');
  });

  // ----------------------------------------------------
  // WORKFLOW 3: FEATURE SPEC TO ENGINEERING SPRINT
  // ----------------------------------------------------
  console.log('\n--- 3. WORKFLOW 3: FEATURE SPEC TO SPRINT ---');

  await test('launchFeatureSprint provisions Feature, Subtasks, and Mini-PRD Note', async () => {
    const res = await launchFeatureSprint({
      title: 'Stripe Webhook Event Bus',
      description: 'Reliable event streaming for incoming Stripe subscription charges.',
      priority: 'high',
      impact: 'high',
      effort: 'medium',
    });

    if (!res.success) throw new Error('Sprint launch failed');
    if (res.feature.title !== 'Stripe Webhook Event Bus') throw new Error('Feature title mismatch');
    if (res.tasks.length < 3) throw new Error('Expected at least 3 subtasks');
    if (!res.note.title.includes('Stripe Webhook Event Bus')) throw new Error('Mini-PRD note not created');

    // DB verification
    const featInDb = await db.features.get(res.feature.id);
    if (!featInDb) throw new Error('Feature not found in DB');

    const noteInDb = await db.notes.get(res.note.id);
    if (!noteInDb) throw new Error('PRD Note not found in DB');
  });

  await test('In-chat intent detects feature request and generates launchFeatureSprint toolCall', async () => {
    const conv = await createConversation('Feature Chat');

    const turn = await processConversationTurn({
      conversationId: conv.id,
      userPrompt: 'Let us build a 1-click PDF and CSV invoice export feature for the Finance tab',
      history: [],
    });

    const calls = turn.proposedActions || [];
    const sprintCall = calls.find((c) => c.name === 'launchFeatureSprint');
    if (!sprintCall) throw new Error('Expected launchFeatureSprint tool call to be proposed');
  });

  // ----------------------------------------------------
  // WORKFLOW 4: VENDOR EXPENSE & RUNWAY SHIELD
  // ----------------------------------------------------
  console.log('\n--- 4. WORKFLOW 4: VENDOR EXPENSE & RUNWAY SHIELD ---');

  await test('auditVendorExpense provisions Expense Transaction, Audit Task, and Contract Note', async () => {
    const res = await auditVendorExpense({
      vendorName: 'Datadog APM & Logs',
      monthlyCost: 950,
      category: 'software',
    });

    if (!res.success) throw new Error('Vendor expense audit failed');
    if (res.transaction.amount !== 950) throw new Error('Amount mismatch');
    if (!res.task.title.includes('Datadog APM')) throw new Error('Renewal audit task not created');
    if (!res.note.title.includes('Datadog APM')) throw new Error('Vendor profile note not created');
    if (res.runwayMonthsEstimate <= 0) throw new Error('Runway estimate invalid');

    // DB verification
    const txInDb = await db.transactions.get(res.transaction.id);
    if (!txInDb) throw new Error('Transaction not found in DB');
  });

  await test('In-chat intent detects vendor expense and generates auditVendorExpense toolCall', async () => {
    const conv = await createConversation('Expense Chat');

    const turn = await processConversationTurn({
      conversationId: conv.id,
      userPrompt: 'We just signed up for AWS Enterprise and Figma costing 850$ per month',
      history: [],
    });

    const calls = turn.proposedActions || [];
    const expenseCall = calls.find((c) => c.name === 'auditVendorExpense');
    if (!expenseCall) throw new Error('Expected auditVendorExpense tool call to be proposed');
    if (expenseCall.arguments.monthlyCost !== 850) throw new Error('Monthly cost not parsed');
  });

  // ----------------------------------------------------
  // WORKFLOW 5: MONTHLY INVESTOR UPDATE & BOARD REPORT
  // ----------------------------------------------------
  console.log('\n--- 5. WORKFLOW 5: MONTHLY INVESTOR UPDATE ---');

  await test('generateInvestorReport synthesizes live DB metrics and saves Investor Memo', async () => {
    const res = await generateInvestorReport({
      monthYear: 'September 2026',
      keyWins: ['Closed $25k in ARR', 'Shipped V3 Integrations'],
    });

    if (!res.success) throw new Error('Report generation failed');
    if (!res.note.title.includes('September 2026')) throw new Error('Note title mismatch');
    if (res.metrics.mrr <= 0) throw new Error('MRR was not calculated from DB');
    if (res.tasks.length === 0) throw new Error('Distribution task not created');

    // DB verification
    const noteInDb = await db.notes.get(res.note.id);
    if (!noteInDb || !noteInDb.content.includes('Executive Snapshot')) {
      throw new Error('Investor Memo not properly structured in DB');
    }
  });

  await test('In-chat intent detects investor request and generates generateInvestorReport toolCall', async () => {
    const conv = await createConversation('Investor Chat');

    const turn = await processConversationTurn({
      conversationId: conv.id,
      userPrompt: 'Generate my monthly investor update for this month',
      history: [],
    });

    const calls = turn.proposedActions || [];
    const reportCall = calls.find((c) => c.name === 'generateInvestorReport');
    if (!reportCall) throw new Error('Expected generateInvestorReport tool call to be proposed');
  });

  // ----------------------------------------------------
  // END-TO-END EXECUTION & POST-EXECUTION VERIFICATION
  // ----------------------------------------------------
  console.log('\n--- 6. EXECUTE CONFIRMED ACTION ENGINE ---');

  await test('executeConfirmedToolAction verifies Customer Risk execution in DB', async () => {
    const msgId = `msg_test_${Date.now()}`;
    const callId = `call_test_${Date.now()}`;

    await db.aiMessages.put({
      id: msgId,
      conversationId: 'conv_test',
      role: 'assistant',
      content: 'Testing risk execution',
      toolCalls: [
        {
          id: callId,
          name: 'mitigateCustomerRisk',
          arguments: { companyName: 'Starlight Retail', issueDescription: 'Downtime issue' },
          status: 'pending_confirmation',
        },
      ],
      createdAt: new Date().toISOString(),
    });

    const exec = await executeConfirmedToolAction(msgId, callId, 'mitigateCustomerRisk', {
      companyName: 'Starlight Retail',
      issueDescription: 'Downtime issue',
      monthlyRevenue: 1800,
    });

    if (!exec.success) throw new Error('Execution failed');
    if (!exec.verification?.verified) throw new Error(`Verification failed: ${exec.verification?.message}`);
  });

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log('📊 5 WORKFLOWS TEST SUITE SUMMARY');
  console.log('======================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed:          ${passed}`);
  console.log(`Failed:          ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
