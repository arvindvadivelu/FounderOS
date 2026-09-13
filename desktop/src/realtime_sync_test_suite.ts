/**
 * FOUNDEROS REAL-TIME SYNCHRONIZATION & ZERO-MOCK ENGINE TEST SUITE
 *
 * Verifies:
 * 1. RealtimeSyncManager broadcast and subscription bus
 * 2. Event-driven autonomous workflow dispatch on database mutations (Deal Won, Overdue Invoice, Critical Bug, Churn Risk)
 * 3. Dynamic RICE backlog computation directly from db.features
 * 4. Persistent db.feedbackClusters synced from real database customers
 * 5. Real payment synchronization from db.webhookEvents and db.transactions
 * 6. Executive Boardroom Deliberation grounded on live company metrics
 */

import 'fake-indexeddb/auto';
import { db } from './db';
import { realtimeSync, type RealtimeEvent } from './services/realtimeSyncService';
import { WorkflowEngine, FOUNDER_WORKFLOW_RECIPES } from './engines/workflowEngine';
import { ProductIntelligenceEngine } from './engines/productIntelligenceEngine';
import { PaymentAdapter } from './integrations/paymentAdapter';
import { ExecutiveAgentService } from './engines/executiveAgentService';
import { createDeal, updateDeal } from './db/services/dealService';
import { createInvoice, updateInvoice, createTransaction } from './db/services/financeService';
import { createBug } from './db/services/productEngineeringService';

let totalTests = 0;
let passedTests = 0;

async function test(group: string, name: string, fn: () => Promise<void>) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ PASS [${group}]: ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ✗ FAIL [${group}]: ${name}`);
    console.error(`    Error: ${err.message || err}`);
  }
}

async function runRealtimeSyncTestSuite() {
  console.log('\n======================================================');
  console.log('⚡ FOUNDEROS REAL-TIME & ZERO-MOCK VERIFICATION SUITE');
  console.log('======================================================\n');

  // Reset database before test run
  await db.delete();
  await db.open();

  // --- 1. Realtime Event Bus ---
  await test('Realtime Bus', 'Broadcast event notifies registered subscribers', async () => {
    let receivedEvent: RealtimeEvent | null = null;
    const unsub = realtimeSync.subscribe((evt) => {
      receivedEvent = evt;
    });

    const testPayload = { id: 'test_rec_1', name: 'Acme Test' };
    realtimeSync.broadcast('customers', 'create', testPayload);

    unsub();
    if (!receivedEvent || (receivedEvent as any).record.id !== 'test_rec_1') {
      throw new Error('Subscriber did not receive the broadcasted event');
    }
  });

  await test('Realtime Bus', 'Status reflects connection and event count increments', async () => {
    const status = realtimeSync.getStatus();
    if (typeof status.eventCount !== 'number' || status.eventCount < 1) {
      throw new Error(`Expected eventCount >= 1, got ${status.eventCount}`);
    }
    if (!status.lastEventAt) {
      throw new Error('Expected lastEventAt to be populated');
    }
  });

  // --- 2. Event-Driven Workflow Triggers ---
  await test('Workflows', 'Deal closure > $10k triggers VIP Deal Won Concierge workflow', async () => {
    // 1. Initialize recipes in db.workflows
    const now = new Date().toISOString();
    const recipes = FOUNDER_WORKFLOW_RECIPES.map((r, i) => ({
      ...r,
      id: `rule_test_${i + 1}`,
      createdAt: now,
      updatedAt: now,
      runCount: 0,
    }));
    await db.workflows.bulkPut(recipes as any);

    // 2. Create deal and mark Won for $25,000
    const deal = await createDeal({
      name: 'Enterprise Cloud Retainer',
      value: 25000,
      currency: 'USD',
      stage: 'Negotiation',
      probability: 80,
      expectedCloseDate: '2026-10-01',
    });

    const logs = await WorkflowEngine.handleDatabaseEvent('deals', 'update', {
      ...deal,
      stage: 'Won',
    });

    if (logs.length === 0) {
      throw new Error('Expected at least 1 workflow execution log for Deal Won event');
    }

    const wonLog = logs[0];
    if (wonLog.status !== 'success') {
      throw new Error(`Workflow execution failed: ${wonLog.summary}`);
    }

    // Verify task was automatically created
    const createdTasks = await db.tasks.toArray();
    const conciergeTask = createdTasks.find(t => t.tags.includes('automated-workflow'));
    if (!conciergeTask) {
      throw new Error('Expected automated task created by VIP Deal Won workflow');
    }
  });

  await test('Workflows', 'Overdue invoice event triggers Overdue Invoice Sentinel workflow', async () => {
    const inv = await createInvoice({
      customerId: 'cust_test_1',
      invoiceNumber: 'INV-TEST-009',
      amount: 4500,
      currency: 'USD',
      status: 'sent',
      issueDate: '2026-08-01',
      dueDate: '2026-08-15',
    });

    const logs = await WorkflowEngine.handleDatabaseEvent('invoices', 'update', {
      ...inv,
      status: 'overdue',
    });

    if (logs.length === 0) {
      throw new Error('Expected workflow execution log for overdue invoice');
    }

    const overdueLog = logs[0];
    if (overdueLog.status !== 'success') {
      throw new Error(`Overdue invoice workflow failed: ${overdueLog.summary}`);
    }

    // Verify task was created
    const tasks = await db.tasks.toArray();
    const chaseTask = tasks.find(t => t.title.toLowerCase().includes('overdue payment'));
    if (!chaseTask) {
      throw new Error('Expected collection task created by Overdue Invoice Sentinel');
    }
  });

  await test('Workflows', 'Critical bug creation triggers Stale Bug Auto-Escalation', async () => {
    const bug = await createBug({
      title: 'Payment gateway SSL handshake timeout',
      severity: 'critical',
      status: 'reported',
      priority: 'critical',
    });

    const logs = await WorkflowEngine.handleDatabaseEvent('bugs', 'create', bug);
    if (logs.length === 0) {
      throw new Error('Expected workflow execution for critical bug report');
    }

    if (logs[0].status !== 'success') {
      throw new Error(`Critical bug workflow failed: ${logs[0].summary}`);
    }
  });

  // --- 3. Dynamic Product Intelligence ---
  await test('Product RICE', 'Computes standard RICE formula and classifies quadrant correctly', async () => {
    // Reach = 8, Impact = 5, Confidence = 90%, Effort = 2
    // RICE = (8 * 5 * 0.9) / 2 * 10 = (36) / 2 * 10 = 180
    const result = ProductIntelligenceEngine.calculateRice(8, 5, 90, 2);
    if (result.riceScore !== 180) {
      throw new Error(`Expected RICE score 180, got ${result.riceScore}`);
    }
    if (result.quadrant !== 'quick_win') {
      throw new Error(`Expected quadrant 'quick_win', got '${result.quadrant}'`);
    }
  });

  await test('Product RICE', 'syncBacklogPriorities persists real priorities in db.productPriorities', async () => {
    const priorities = await ProductIntelligenceEngine.syncBacklogPriorities();
    if (!priorities || priorities.length === 0) {
      throw new Error('Expected priorities returned from backlog sync');
    }

    const dbCount = await db.productPriorities.count();
    if (dbCount !== priorities.length) {
      throw new Error(`Expected ${priorities.length} records in db.productPriorities, found ${dbCount}`);
    }

    // Verify sorted in descending order of RICE score
    for (let i = 0; i < priorities.length - 1; i++) {
      if (priorities[i].riceScore < priorities[i + 1].riceScore) {
        throw new Error('Priorities are not properly sorted descending by riceScore');
      }
    }
  });

  await test('Product RICE', 'syncFeedbackClusters persists synthesized clusters to db.feedbackClusters', async () => {
    const clusters = await ProductIntelligenceEngine.syncFeedbackClusters();
    if (!clusters || clusters.length === 0) {
      throw new Error('Expected clusters returned from syncFeedbackClusters');
    }

    const count = await db.feedbackClusters.count();
    if (count !== clusters.length) {
      throw new Error(`Expected ${clusters.length} clusters in db.feedbackClusters, found ${count}`);
    }
  });

  // --- 4. Payment Synchronization ---
  await test('Payment Adapter', 'sync ingests real webhook events from db.webhookEvents', async () => {
    // Ingest a webhook charge
    await db.webhookEvents.add({
      id: 'wh_evt_charge_9981',
      provider: 'stripe',
      eventType: 'charge.succeeded',
      payload: {
        amount: 500000, // $5,000.00 in cents
        currency: 'usd',
        customer_name: 'Acme Mega Corp',
        description: 'Annual Enterprise Retainer',
      },
      receivedAt: new Date().toISOString(),
      processed: true,
    });

    const adapter = new PaymentAdapter('stripe');
    const syncRes = await adapter.sync({
      options: { useSandbox: true },
    });

    if (!syncRes.success) {
      throw new Error(`Payment sync failed: ${syncRes.syncSummary}`);
    }

    const matchedItem = syncRes.items.find(it => it.externalId === 'wh_evt_charge_9981');
    if (!matchedItem) {
      throw new Error('Sync items did not include the webhook charge record');
    }
    if (matchedItem.metadata.amount !== 5000) {
      throw new Error(`Expected amount 5000, got ${matchedItem.metadata.amount}`);
    }
  });

  await test('Payment Adapter', 'sync includes local income transactions as synced records', async () => {
    await createTransaction({
      type: 'income',
      category: 'Subscription',
      amount: 3200,
      currency: 'USD',
      status: 'cleared',
      recurring: false,
      date: new Date().toISOString().split('T')[0],
      description: 'Monthly SaaS Expansion',
    });

    const adapter = new PaymentAdapter('stripe');
    const syncRes = await adapter.sync({
      options: { useSandbox: true },
    });

    const txItem = syncRes.items.find(it => it.summary.includes('Monthly SaaS Expansion'));
    if (!txItem) {
      throw new Error('Expected local revenue transaction in synced payment items');
    }
  });

  // --- 5. Executive Boardroom Deliberation ---
  await test('Boardroom', 'startBoardroomDeliberation synthesizes grounded consensus into db.agentDebates', async () => {
    const session = await ExecutiveAgentService.startBoardroomDeliberation(
      'Enterprise Retainer Pricing & Expansion',
      'Should we mandate 100% annual upfront cash collection for new enterprise prospects?'
    );

    if (!session || !session.id) {
      throw new Error('Deliberation session missing or invalid');
    }

    if (session.status !== 'consensus_reached') {
      throw new Error(`Expected status 'consensus_reached', got '${session.status}'`);
    }

    if (!session.consensus || typeof session.consensus.alignmentScore !== 'number') {
      throw new Error('Consensus or alignmentScore missing in deliberation session');
    }

    if (session.messages.length < 5) {
      throw new Error(`Expected at least 5 executive messages, got ${session.messages.length}`);
    }

    // Verify session persisted in IndexedDB
    const saved = await db.agentDebates.get(session.id);
    if (!saved) {
      throw new Error('Debate session not found in db.agentDebates');
    }
  });

  console.log('\n======================================================');
  console.log('📊 REAL-TIME & ZERO-MOCK TEST SUMMARY');
  console.log('======================================================');
  console.log(`Total Tests Run: ${totalTests}`);
  console.log(`Passed:          ${passedTests}`);
  console.log(`Failed:          ${totalTests - passedTests}`);
  console.log('======================================================\n');

  if (totalTests !== passedTests) {
    process.exit(1);
  }
}

runRealtimeSyncTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
