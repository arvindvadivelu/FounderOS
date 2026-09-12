import 'fake-indexeddb/auto';
import { db } from './db';
import { seedDemoData, clearAllCompanyData } from './db/seed';
import { AI_TOOL_DEFINITIONS, executeLocalTool } from './ai/tools';
import { getSystemPrompt, FOUNDER_BRIEFING_PROMPT } from './ai/prompts';
import { testProviderConnection, sendChatMessage, type ChatMessagePayload } from './ai/providerClient';
import { processConversationTurn, executeConfirmedToolAction } from './ai/toolRunner';
import {
  createConversation,
  getAllConversations,
  getMessagesByConversation,
  saveAIMessage,
  updateAIMessage,
  deleteConversation,
  saveAIProvider,
  getAllAIProviders,
  getDefaultAIProvider,
} from './db/services/aiStorageService';
import type { AIProvider, AIMessage, Company } from './types';

interface TestReport {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: string;
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

async function runAIAgentIntegritySuite() {
  console.log('\n======================================================');
  console.log('🤖 FOUNDEROS AI AGENT DEEP INTEGRITY & VALIDATION SUITE');
  console.log('======================================================\n');

  // Seed baseline data
  await seedDemoData();

  // ==========================================
  // SUITE 1: Precision Reading Across All Domains
  // ==========================================
  console.log('--- SUITE 1: PRECISION READING ACROSS ALL DOMAINS ---');

  await test('Reading', 'getCompanyOverview returns ground truth database metrics', async () => {
    const overview = await executeLocalTool('getCompanyOverview', {});
    if (overview.companyName !== 'Solvst AI') throw new Error(`Unexpected company name: ${overview.companyName}`);
    if (overview.mrr <= 0) throw new Error('MRR was not calculated from database customers');
    if (overview.arr !== overview.mrr * 12) throw new Error('ARR calculation mismatch');
    if (overview.totalCustomers <= 0) throw new Error('Customer count mismatch');
    if (overview.pipelineValue <= 0) throw new Error('Pipeline value calculation mismatch');
    if (overview.openTasksCount <= 0) throw new Error('Open tasks count mismatch');
  });

  await test('Reading', 'getRevenue returns exact customer breakdown and MRR/ARR', async () => {
    const rev = await executeLocalTool('getRevenue', {});
    if (rev.mrr <= 0 || rev.arr <= 0) throw new Error('Revenue calculation failed');
    if (!Array.isArray(rev.breakdownByCustomer) || rev.breakdownByCustomer.length === 0) {
      throw new Error('Expected customer breakdown list');
    }
    const computedMRR = rev.breakdownByCustomer.reduce((sum: number, c: any) => sum + (c.monthlyRevenue || 0), 0);
    if (computedMRR !== rev.mrr) throw new Error(`MRR sum mismatch: ${computedMRR} vs ${rev.mrr}`);
  });

  await test('Reading', 'getExpenses aggregates spend by category and filters accurately', async () => {
    const allExpenses = await executeLocalTool('getExpenses', {});
    if (allExpenses.totalExpenses <= 0) throw new Error('Total expenses should be > 0');
    if (!allExpenses.expensesByCategory['AI API']) throw new Error('AI API expense category missing');

    const filtered = await executeLocalTool('getExpenses', { category: 'AI API' });
    if (filtered.category !== 'AI API') throw new Error('Category filter mismatch');
    if (filtered.totalSpend <= 0 || filtered.transactionCount <= 0) throw new Error('Category spend calculation failed');
  });

  await test('Reading', 'getRunway accurately computes monthly burn and runway months', async () => {
    const runway = await executeLocalTool('getRunway', {});
    if (runway.runwayMonths <= 0) throw new Error('Runway months should be > 0 with positive cash');
    if (runway.estimatedCashBalance <= 0) throw new Error('Cash balance calculation failed');
    if (typeof runway.netMonthlyBurn !== 'number') throw new Error('Net monthly burn missing');
  });

  await test('Reading', 'getCustomers filters by status and returns targeted projections', async () => {
    const active = await executeLocalTool('getCustomers', { status: 'active' });
    if (active.count === 0 || active.customers.some((c: any) => c.status !== 'active')) {
      throw new Error('Active customer filter failed');
    }
  });

  await test('Reading', 'getCustomer returns joined customer, deals, and invoices', async () => {
    const res = await executeLocalTool('getCustomer', { id: 'cust_1' });
    if (!res.customer || res.customer.id !== 'cust_1') throw new Error('Customer query failed');
    if (!Array.isArray(res.associatedDeals) || !Array.isArray(res.associatedInvoices)) {
      throw new Error('Associated deals/invoices not joined');
    }
  });

  await test('Reading', 'getSalesPipeline, getTasks, getProjects, getFeatures, getBugs, getGoals', async () => {
    const pipe = await executeLocalTool('getSalesPipeline', {});
    if (pipe.totalPipelineValue <= 0 || pipe.openDealsCount <= 0) throw new Error('Pipeline calculation failed');

    const tasks = await executeLocalTool('getTasks', { status: 'todo' });
    if (tasks.tasks.some((t: any) => t.status !== 'todo')) throw new Error('Task status filter failed');

    const overdue = await executeLocalTool('getOverdueTasks', {});
    if (typeof overdue.count !== 'number') throw new Error('Overdue task query failed');

    const projs = await executeLocalTool('getProjects', {});
    if (projs.count <= 0) throw new Error('Projects query failed');

    const feats = await executeLocalTool('getFeatures', {});
    if (feats.count <= 0) throw new Error('Features query failed');

    const bugs = await executeLocalTool('getBugs', {});
    if (bugs.count <= 0) throw new Error('Bugs query failed');

    const goals = await executeLocalTool('getGoals', {});
    if (goals.count <= 0) throw new Error('Goals query failed');
  });

  // ==========================================
  // SUITE 2: Anti-Hallucination & Missing Data Gating
  // ==========================================
  console.log('\n--- SUITE 2: ANTI-HALLUCINATION & MISSING DATA GATING ---');

  await test('Anti-Hallucination', 'Non-existent customer returns explicit error object rather than fake data', async () => {
    const res = await executeLocalTool('getCustomer', { id: 'non_existent_cust_999' });
    if (!res.error || res.customer) throw new Error('Expected explicit error for non-existent customer');
  });

  await test('Anti-Hallucination', 'Non-existent expense category returns 0 spend and empty transactions', async () => {
    const res = await executeLocalTool('getExpenses', { category: 'Space Exploration Rocket Fuel' });
    if (res.totalSpend !== 0 || res.transactionCount !== 0 || res.transactions.length !== 0) {
      throw new Error('Non-existent expense category should return 0 spend and 0 transactions');
    }
  });

  await test('Anti-Hallucination', 'System Prompt explicitly forbids inventing metrics and enforces ground truth', async () => {
    const prompt = getSystemPrompt({ name: 'Alpha AI', currency: 'EUR' } as Company);
    if (!prompt.includes('Ground Truth & Facts')) {
      throw new Error('System prompt missing ground truth directive');
    }
    if (!prompt.includes('NEVER invent, extrapolate, or hallucinate')) {
      throw new Error('System prompt missing anti-hallucination directive');
    }
    if (!prompt.includes('EUR')) {
      throw new Error('System prompt currency injection failed');
    }
  });

  // ==========================================
  // SUITE 3: Empty Database State Resilience
  // ==========================================
  console.log('\n--- SUITE 3: EMPTY DATABASE STATE RESILIENCE ---');

  await test('Empty States', 'All read tools handle totally empty database gracefully without NaN or errors', async () => {
    await clearAllCompanyData();

    const overview = await executeLocalTool('getCompanyOverview', {});
    if (overview.mrr !== 0 || overview.totalCustomers !== 0 || overview.runwayMonths !== 0) {
      throw new Error('Empty overview did not return 0s');
    }

    const rev = await executeLocalTool('getRevenue', {});
    if (rev.mrr !== 0 || rev.activeCustomersCount !== 0 || rev.breakdownByCustomer.length !== 0) {
      throw new Error('Empty revenue failed');
    }

    const exp = await executeLocalTool('getExpenses', {});
    if (exp.totalExpenses !== 0 || exp.recentExpenses.length !== 0) {
      throw new Error('Empty expenses failed');
    }

    const runway = await executeLocalTool('getRunway', {});
    if (runway.runwayMonths !== 0 || runway.estimatedCashBalance !== 0) {
      throw new Error('Empty runway failed');
    }

    const pipe = await executeLocalTool('getSalesPipeline', {});
    if (pipe.totalPipelineValue !== 0 || pipe.openDealsCount !== 0) {
      throw new Error('Empty pipeline failed');
    }

    const tasks = await executeLocalTool('getTasks', {});
    if (tasks.count !== 0 || tasks.tasks.length !== 0) {
      throw new Error('Empty tasks failed');
    }

    const cash = await executeLocalTool('getCashPosition', {});
    if (cash.totalCash !== 0 || cash.accountsCount !== 0) {
      throw new Error('Empty cash failed');
    }

    const bs = await executeLocalTool('getBalanceSheet', {});
    if (bs.totalAssets !== 0 || bs.netWorth !== 0) {
      throw new Error('Empty balance sheet failed');
    }
  });

  // Restore seed data for remaining suites
  await seedDemoData();

  // ==========================================
  // SUITE 4: Unknown Tools & Invalid Input Handling
  // ==========================================
  console.log('\n--- SUITE 4: UNKNOWN TOOLS & INVALID INPUT HANDLING ---');

  await test('Safety', 'Executing unwhitelisted tool throws descriptive error', async () => {
    let caught = false;
    try {
      await executeLocalTool('unauthorizedDropDatabase', {});
    } catch (err: any) {
      caught = true;
      if (!err.message.includes('not registered in the approved tool whitelist')) {
        throw new Error('Unexpected error message: ' + err.message);
      }
    }
    if (!caught) throw new Error('Unwhitelisted tool execution should have thrown');
  });

  // ==========================================
  // SUITE 5: Read vs Write Confirmation Gating
  // ==========================================
  console.log('\n--- SUITE 5: READ VS WRITE CONFIRMATION GATING ---');

  await test('Confirmation Gating', 'All read tools are categorized as "read", write as "write", and deletes as "destructive"', async () => {
    const readNames = [
      'getCompanyOverview', 'getRevenue', 'getExpenses', 'getRunway', 'getCustomers',
      'getCustomer', 'getSalesPipeline', 'getTasks', 'getOverdueTasks', 'getProjects',
      'getFeatures', 'getBugs', 'getGoals', 'getRecentActivity', 'getEmployees',
      'getDepartments', 'getCashPosition', 'getBalanceSheet', 'reconcileFinances',
    ];

    const writeNames = [
      'createTask', 'updateTask', 'createCustomer', 'createDeal',
      'createFeature', 'createNote', 'createEmployee',
    ];

    const destructiveNames = [
      'deleteCustomer', 'deleteTask', 'deleteTransaction',
    ];

    for (const name of readNames) {
      const def = AI_TOOL_DEFINITIONS.find(d => d.function.name === name);
      if (!def || def.function.category !== 'read') {
        throw new Error(`Tool ${name} must be categorized as "read"`);
      }
    }

    for (const name of writeNames) {
      const def = AI_TOOL_DEFINITIONS.find(d => d.function.name === name);
      if (!def || def.function.category !== 'write') {
        throw new Error(`Tool ${name} must be categorized as "write"`);
      }
    }

    for (const name of destructiveNames) {
      const def = AI_TOOL_DEFINITIONS.find(d => d.function.name === name);
      if (!def || def.function.category !== 'destructive') {
        throw new Error(`Tool ${name} must be categorized as "destructive"`);
      }
    }
  });

  await test('Confirmation Gating', 'Destructive actions are identifiable by delete prefix', async () => {
    const destructive = AI_TOOL_DEFINITIONS.filter(d => d.function.name.startsWith('delete'));
    if (destructive.length !== 3) {
      throw new Error(`Expected 3 delete tools, found ${destructive.length}`);
    }
  });

  // ==========================================
  // SUITE 6: Confirmed Actions Update IndexedDB & UI State
  // ==========================================
  console.log('\n--- SUITE 6: CONFIRMED ACTIONS UPDATE INDEXEDDB ---');

  await test('Write Execution', 'executeConfirmedToolAction writes task to IndexedDB and updates message state', async () => {
    const conv = await createConversation('Test Task Flow');
    const msg = await saveAIMessage({
      conversationId: conv.id,
      role: 'assistant',
      content: 'I have prepared a new task:',
      toolCalls: [
        {
          id: 'call_123',
          name: 'createTask',
          arguments: {
            title: 'Verified AI Generated Task',
            priority: 'high',
            dueDate: '2026-05-01',
          },
          status: 'pending_confirmation',
        },
      ],
    });

    // Founder clicks "Confirm & Execute"
    const execResult = await executeConfirmedToolAction(msg.id, 'call_123', 'createTask', {
      title: 'Verified AI Generated Task',
      priority: 'high',
      dueDate: '2026-05-01',
    });

    if (!execResult.success || !execResult.result?.task?.id) {
      throw new Error('Task creation execution failed');
    }

    // Verify written to db.tasks
    const dbTask = await db.tasks.get(execResult.result.task.id);
    if (!dbTask || dbTask.title !== 'Verified AI Generated Task' || dbTask.priority !== 'high') {
      throw new Error('Task was not persisted in IndexedDB db.tasks');
    }

    // Verify message status updated to 'executed'
    const updatedMsg = await db.aiMessages.get(msg.id);
    if (updatedMsg?.toolCalls?.[0].status !== 'executed') {
      throw new Error('Message toolCall status was not updated to executed');
    }
  });

  await test('Write Execution', 'executeConfirmedToolAction executes destructive delete against IndexedDB', async () => {
    // Create customer to delete
    const cust = await executeLocalTool('createCustomer', {
      companyName: 'Temporary AI Client',
      contactName: 'Alex Smith',
      email: 'temp@ai.com',
      monthlyRevenue: 1000,
    });
    const custId = cust.customer.id;

    // Execute delete
    const delResult = await executeConfirmedToolAction('dummy_msg', 'call_del', 'deleteCustomer', { id: custId });
    if (!delResult.success) throw new Error('Delete tool execution failed');

    const checkCust = await db.customers.get(custId);
    if (checkCust) throw new Error('Customer was not deleted from IndexedDB');
  });

  // ==========================================
  // SUITE 7: Provider Configuration & Error Handling
  // ==========================================
  console.log('\n--- SUITE 7: PROVIDER CONFIGURATION & ERROR HANDLING ---');

  await test('Provider Config', 'Missing API key on OpenRouter provider returns clear validation message', async () => {
    const unconfiguredProvider: AIProvider = {
      id: 'openrouter_test',
      name: 'OpenRouter',
      type: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: '',
      model: 'deepseek/deepseek-chat',
      temperature: 0.2,
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await testProviderConnection(unconfiguredProvider);
    if (result.success || !result.message.includes('API Key is missing')) {
      throw new Error('Expected missing API key failure message');
    }
  });

  await test('Provider Config', 'Unconfigured provider in processConversationTurn provides setup guidance without crashing', async () => {
    // Clear providers
    await db.aiProviders.clear();

    const conv = await createConversation('Test Unconfigured');
    const { assistantMessage } = await processConversationTurn({
      conversationId: conv.id,
      userPrompt: 'What is our MRR?',
      history: [],
    });

    if (!assistantMessage.content.includes('AI Provider Not Configured')) {
      throw new Error('Expected setup guidance response');
    }
  });

  await test('Provider Config', 'Timeout simulation aborts fetch cleanly with user-friendly duration', async () => {
    const mockTimeoutProvider: AIProvider = {
      id: 'mock_timeout',
      name: 'Simulated Timeout',
      type: 'custom',
      baseUrl: 'http://10.255.255.1', // Non-routable IP that times out
      apiKey: 'dummy',
      model: 'mock-model',
      temperature: 0.2,
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Test with 50ms fast timeout
    const res = await testProviderConnection(mockTimeoutProvider, 50);
    if (res.success) throw new Error('Timeout provider should not succeed');
    if (!res.message.includes('Timed Out') && !res.message.includes('Connection failed') && !res.message.includes('Network')) {
      throw new Error('Unexpected timeout response: ' + res.message);
    }
  });

  // ==========================================
  // SUITE 8: Conversation Persistence & Reload
  // ==========================================
  console.log('\n--- SUITE 8: CONVERSATION PERSISTENCE & RELOAD ---');

  await test('Persistence', 'Conversations, messages, and tool metadata persist and reload across sessions', async () => {
    const conv = await createConversation('Persistence Test Session');
    
    await saveAIMessage({
      conversationId: conv.id,
      role: 'user',
      content: 'Give me a founder briefing',
    });

    await saveAIMessage({
      conversationId: conv.id,
      role: 'assistant',
      content: 'Here is your executive summary for today.',
      metadata: {
        usage: { promptTokens: 120, completionTokens: 45, totalTokens: 165 },
        durationMs: 450,
        dataSources: ['getCompanyOverview', 'getRevenue', 'getTasks'],
      },
    });

    // Simulate page reload by querying directly from Dexie
    const reloadedConvs = await getAllConversations();
    const foundConv = reloadedConvs.find(c => c.id === conv.id);
    if (!foundConv) throw new Error('Conversation not found in database');

    const reloadedMsgs = await getMessagesByConversation(conv.id);
    if (reloadedMsgs.length !== 2) throw new Error(`Expected 2 messages, found ${reloadedMsgs.length}`);
    if (reloadedMsgs[1].metadata?.dataSources?.[0] !== 'getCompanyOverview') {
      throw new Error('Message metadata persistence failed');
    }

    // Delete conversation and verify cleanup
    await deleteConversation(conv.id);
    const postDeleteMsgs = await getMessagesByConversation(conv.id);
    if (postDeleteMsgs.length !== 0) throw new Error('Conversation messages were not deleted during cascade');
  });

  // ==========================================
  // FINAL SUMMARY
  // ==========================================
  console.log('\n======================================================');
  console.log('📊 AI AGENT INTEGRITY TEST SUMMARY');
  console.log('======================================================');
  const total = reports.length;
  const passed = reports.filter(r => r.passed).length;
  const failed = reports.filter(r => r.error).length;

  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed:          ${passed}`);
  console.log(`Failed:          ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAIAgentIntegritySuite().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
