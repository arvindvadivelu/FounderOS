import 'fake-indexeddb/auto';
import { db } from './db';
import { seedDemoData, clearAllCompanyData } from './db/seed';
import { onboardClientProject, getDefaultMilestones } from './db/services/onboardingService';
import { processConversationTurn, executeConfirmedToolAction } from './ai/toolRunner';
import { createConversation } from './db/services/aiStorageService';

interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ name, passed: true, durationMs });
    console.log(`  ✓ PASS: ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ name, passed: false, durationMs, error: err.message || String(err) });
    console.error(`  ✗ FAIL: ${name}:`, err.message || err);
  }
}

async function runClientOnboardingSuite() {
  console.log('\n======================================================');
  console.log('🚀 FOUNDEROS CLIENT DEAL INTAKE & AUTO-PROVISIONING SUITE');
  console.log('======================================================\n');

  await seedDemoData();

  // ----------------------------------------------------
  // TEST 1: Atomic Multi-Module Provisioning
  // ----------------------------------------------------
  console.log('--- 1. ATOMIC MULTI-MODULE PROVISIONING ---');

  let provisionResult: any = null;

  await test('onboardClientProject provisions all 7 company modules atomically', async () => {
    const initialGoal = (await db.goals.toArray()).find(g => g.unit === '$' || g.title.includes('Revenue'));
    const initialGoalVal = initialGoal?.currentValue || 0;

    provisionResult = await onboardClientProject({
      companyName: 'CloudWave SaaS',
      contactName: 'Liam Carter',
      email: 'liam@cloudwave.io',
      projectTitle: 'Enterprise Web Portal',
      serviceCategory: 'Website Development',
      totalDealValue: 2000,
      depositAmount: 1000,
      targetDeliveryDate: '2026-10-15',
      notes: 'Custom web portal with client dashboard.',
    });

    if (!provisionResult.success) throw new Error('Provisioning returned success: false');

    // 1. Customer Check
    const storedCust = await db.customers.get(provisionResult.customer.id);
    if (!storedCust || storedCust.companyName !== 'CloudWave SaaS' || storedCust.status !== 'active') {
      throw new Error('Customer CRM record not properly provisioned');
    }

    // 2. Sales Deal Check
    const storedDeal = await db.deals.get(provisionResult.deal.id);
    if (!storedDeal || storedDeal.value !== 2000 || storedDeal.stage !== 'Won' || storedDeal.customerId !== storedCust.id) {
      throw new Error('Sales deal not properly provisioned as Won ($2,000)');
    }

    // 3. Invoice Check
    const storedInv = await db.invoices.get(provisionResult.invoice.id);
    if (!storedInv || storedInv.amount !== 2000 || storedInv.customerId !== storedCust.id) {
      throw new Error('Finance invoice not properly provisioned');
    }

    // 4. Deposit Transaction Check
    if (!provisionResult.transaction) throw new Error('Expected deposit transaction to be created');
    const storedTx = await db.transactions.get(provisionResult.transaction.id);
    if (!storedTx || storedTx.amount !== 1000 || storedTx.type !== 'income' || storedTx.status !== 'cleared') {
      throw new Error('Deposit income transaction not properly provisioned');
    }

    // 5. Project Check
    const storedProj = await db.projects.get(provisionResult.project.id);
    if (!storedProj || storedProj.name !== 'Enterprise Web Portal' || storedProj.status !== 'in_progress') {
      throw new Error('Project workspace record not properly provisioned');
    }

    // 6. Tasks Check (Milestones)
    const storedTasks = await db.tasks.where('projectId').equals(storedProj.id).toArray();
    if (storedTasks.length < 4) {
      throw new Error(`Expected at least 4 milestone tasks, found ${storedTasks.length}`);
    }
    if (!storedTasks.some(t => t.title.toLowerCase().includes('scope') || t.title.toLowerCase().includes('discovery'))) {
      throw new Error('Missing discovery milestone task');
    }
    if (!storedTasks.some(t => t.title.toLowerCase().includes('launch') || t.title.toLowerCase().includes('domain'))) {
      throw new Error('Missing launch milestone task');
    }

    // 7. Strategy Note Check
    const storedNote = await db.notes.get(provisionResult.note.id);
    if (!storedNote || !storedNote.content.includes('CloudWave SaaS') || !storedNote.content.includes('$2,000')) {
      throw new Error('Kickoff Strategy Note not properly written');
    }

    // 8. Goal (OKR) Check
    if (initialGoal) {
      const updatedGoal = await db.goals.get(initialGoal.id);
      if (!updatedGoal || updatedGoal.currentValue !== initialGoalVal + 2000) {
        throw new Error(`Quarterly Revenue OKR not incremented: expected ${initialGoalVal + 2000}, got ${updatedGoal?.currentValue}`);
      }
    }
  });

  // ----------------------------------------------------
  // TEST 2: AI CEO Chat Intent Detection
  // ----------------------------------------------------
  console.log('\n--- 2. AI CEO IN-CHAT DEAL INTENT DETECTION ---');

  await test('AI CEO detects "client for building website of 2000$" and generates intake toolCall', async () => {
    const conv = await createConversation('Deal Intake Test Conversation');

    const result = await processConversationTurn({
      conversationId: conv.id,
      userPrompt: 'i got a client for buiding website of 2000$',
      history: [],
    });

    const toolCalls = result.proposedActions || result.assistantMessage.toolCalls;
    if (!toolCalls || toolCalls.length === 0) {
      throw new Error('Expected assistant message to contain proposed tool calls');
    }

    const intakeCall = toolCalls.find(tc => tc.name === 'onboardClientProject');
    if (!intakeCall) {
      throw new Error('Expected onboardClientProject tool call to be proposed');
    }

    if (intakeCall.arguments.totalDealValue !== 2000) {
      throw new Error(`Expected totalDealValue 2000, got ${intakeCall.arguments.totalDealValue}`);
    }

    if (!intakeCall.arguments.projectTitle.toLowerCase().includes('website')) {
      throw new Error(`Expected projectTitle to indicate Website, got ${intakeCall.arguments.projectTitle}`);
    }
  });

  // ----------------------------------------------------
  // TEST 3: Execution & Post-Verification
  // ----------------------------------------------------
  console.log('\n--- 3. CONFIRMED ACTION EXECUTION & VERIFICATION ---');

  await test('executeConfirmedToolAction commits onboarding across database and updates message', async () => {
    const conv = await createConversation('Execution Test Conversation');

    const turn = await processConversationTurn({
      conversationId: conv.id,
      userPrompt: 'I closed a new client for building website of 2000$ called Horizon Logistics',
      history: [],
    });

    const callId = turn.proposedActions![0].id;
    const msgId = turn.assistantMessage.id;

    const exec = await executeConfirmedToolAction(msgId, callId, 'onboardClientProject', {
      companyName: 'Horizon Logistics',
      contactName: 'Elena Ray',
      email: 'elena@horizonlogistics.com',
      projectTitle: 'Website Design & Development',
      totalDealValue: 2000,
      depositAmount: 1000,
    });

    if (!exec.success) throw new Error('Tool execution failed');
    if (!exec.verification?.verified) throw new Error(`Post-execution verification failed: ${exec.verification?.message}`);

    // Verify stored in IndexedDB
    const cust = await db.customers.where('companyName').equals('Horizon Logistics').first();
    if (!cust) throw new Error('Horizon Logistics was not found in customers store');

    const deal = await db.deals.where('customerId').equals(cust.id).first();
    if (!deal || deal.value !== 2000) throw new Error('Horizon deal not found in deals store');

    const proj = await db.projects.get(exec.result.project.id);
    if (!proj || proj.name !== 'Website Design & Development') throw new Error('Project not found or name mismatch');
  });

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log('📊 CLIENT ONBOARDING VERIFICATION SUMMARY');
  console.log('======================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed:          ${passed}`);
  console.log(`Failed:          ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runClientOnboardingSuite().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
