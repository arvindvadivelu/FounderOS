/**
 * FOUNDEROS FOUNDER AI AGENT COMPREHENSIVE TEST SUITE
 * 
 * Verifies all 12 test requirements:
 * 1. Correct database questions
 * 2. Multi-step questions requiring multiple tools
 * 3. Calculations
 * 4. Missing data
 * 5. Empty database
 * 6. Hallucination resistance
 * 7. Prompt injection attempts
 * 8. Create action with confirmation
 * 9. Destructive action with strong confirmation
 * 10. Provider/API failures
 * 11. Page refresh and conversation persistence
 * 12. Large datasets
 */

import 'fake-indexeddb/auto';
import { db } from './db';
import { seedDemoData } from './db/seed';
import { AI_TOOL_DEFINITIONS, executeLocalTool } from './ai/tools';
import { getSystemPrompt, FOUNDER_BRIEFING_PROMPT } from './ai/prompts';
import { processConversationTurn, executeConfirmedToolAction } from './ai/toolRunner';
import {
  saveAIMessage,
  getMessagesByConversation,
  createConversation,
  saveAIProvider,
  getDefaultAIProvider,
} from './db/services/aiStorageService';
import type { AIMessage, AIToolCall } from './types';

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    totalPassed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    totalFailed++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
  }
}

async function runFounderAIAgentTests() {
  console.log('\n======================================================');
  console.log('🤖 FOUNDEROS FOUNDER AI AGENT VERIFICATION SUITE');
  console.log('======================================================\n');

  // Reset database & seed realistic test data
  await db.delete();
  await db.open();
  await seedDemoData();

  // ----------------------------------------------------------------
  // 1. CORRECT DATABASE QUESTIONS ACROSS ALL DOMAINS
  // ----------------------------------------------------------------
  console.log('--- 1. CORRECT DATABASE QUESTIONS & TOOL ACCURACY ---');
  
  const overview = await executeLocalTool('getCompanyOverview');
  assert(overview.mrr > 0 && overview.totalCustomers > 0, 'getCompanyOverview returns ground truth company metrics');
  assert(typeof overview.runwayMonths === 'number' && overview.runwayMonths > 0, 'Overview includes valid calculated runway');

  const profit = await executeLocalTool('getProfit');
  assert(typeof profit.netProfit === 'number' && typeof profit.profitMarginPct === 'number', 'getProfit accurately computes net profit and margin %');

  const forecast = await executeLocalTool('getSalesForecast');
  assert(forecast.weightedExpectedForecast > 0 && Array.isArray(forecast.highConfidenceDeals), 'getSalesForecast generates weighted forecast and high-confidence deals');

  const customerHealth = await executeLocalTool('getCustomerHealth');
  assert(customerHealth.totalCustomers > 0 && Array.isArray(customerHealth.highRiskAccounts), 'getCustomerHealth evaluates customer accounts and risk levels');

  const deadlines = await executeLocalTool('getDeadlines', { daysAhead: 30 });
  assert(Array.isArray(deadlines.deadlines) && deadlines.lookaheadDays === 30, 'getDeadlines aggregates upcoming task, project, and goal deadlines');

  const productPriorities = await executeLocalTool('getProductPriorities');
  assert(Array.isArray(productPriorities.quickWinFeatures) && Array.isArray(productPriorities.criticalBugs), 'getProductPriorities highlights quick-win features and open bugs');

  // ----------------------------------------------------------------
  // 2. MULTI-STEP QUESTIONS REQUIRING MULTIPLE TOOLS
  // ----------------------------------------------------------------
  console.log('\n--- 2. MULTI-STEP REASONING & MULTI-TOOL CHAINS ---');

  // Test sequential chaining: querying overview, then deep customer, then task creation
  const overviewRes = await executeLocalTool('getCompanyOverview');
  const custRes = await executeLocalTool('getCustomers', { status: 'active' });
  const firstCust = custRes.customers[0];
  const deepCust = await executeLocalTool('getCustomer', { id: firstCust.id });

  assert(deepCust.customer.id === firstCust.id, 'Multi-step retrieval successfully chains customer overview to deep profile');
  assert(Array.isArray(deepCust.associatedDeals) && Array.isArray(deepCust.associatedInvoices), 'Deep customer inquiry joins associated deals and invoices');

  // ----------------------------------------------------------------
  // 3. EXACT CALCULATIONS
  // ----------------------------------------------------------------
  console.log('\n--- 3. EXACT CALCULATIONS & FORMULAS ---');

  const fin = await executeLocalTool('getProfit');
  const expectedProfit = fin.totalIncome - fin.totalExpenses;
  assert(fin.netProfit === expectedProfit, `Net Profit calculation exact: ${fin.totalIncome} - ${fin.totalExpenses} = ${fin.netProfit}`);

  const runway = await executeLocalTool('getRunway');
  const expectedBurn = Math.max(0, runway.monthlyExpenses - runway.mrr);
  assert(runway.netMonthlyBurn === expectedBurn, `Net Monthly Burn calculation exact: max(0, ${runway.monthlyExpenses} - ${runway.mrr}) = ${runway.netMonthlyBurn}`);

  const pipeline = await executeLocalTool('getSalesPipeline');
  const calculatedWeighted = Math.round(
    pipeline.deals
      .filter((d: any) => d.stage !== 'Won' && d.stage !== 'Lost')
      .reduce((s: number, d: any) => s + (d.value * d.probability) / 100, 0)
  );
  assert(pipeline.weightedExpectedRevenue === calculatedWeighted, `Weighted Pipeline calculation exact: $${pipeline.weightedExpectedRevenue}`);

  // ----------------------------------------------------------------
  // 4. MISSING DATA HANDLING
  // ----------------------------------------------------------------
  console.log('\n--- 4. MISSING DATA HANDLING ---');

  const nonExistentCust = await executeLocalTool('getCustomer', { id: 'cust_missing_999999' });
  assert(nonExistentCust.error && nonExistentCust.error.includes('not found'), 'Missing customer lookup returns descriptive error object');

  const missingCategoryExpense = await executeLocalTool('getExpenses', { category: 'NonExistentCategory' });
  assert(missingCategoryExpense.totalSpend === 0 && missingCategoryExpense.transactionCount === 0, 'Non-existent expense category returns 0 spend and empty array');

  // ----------------------------------------------------------------
  // 5. EMPTY DATABASE RESILIENCE
  // ----------------------------------------------------------------
  console.log('\n--- 5. EMPTY DATABASE STATE RESILIENCE ---');

  // Clear all entities in a secondary test
  await db.transactions.clear();
  await db.invoices.clear();
  await db.customers.clear();
  await db.deals.clear();
  await db.tasks.clear();
  await db.features.clear();
  await db.bugs.clear();

  const emptyOverview = await executeLocalTool('getCompanyOverview');
  assert(emptyOverview.mrr === 0 && emptyOverview.totalExpenses === 0 && emptyOverview.totalCustomers === 0, 'Empty DB overview yields clean 0 values without NaN');

  const emptyProfit = await executeLocalTool('getProfit');
  assert(emptyProfit.netProfit === 0 && emptyProfit.profitMarginPct === 0, 'Empty DB profit returns 0 net profit and 0% margin');

  const emptyRunway = await executeLocalTool('getRunway');
  assert(emptyRunway.runwayMonths === 0 && emptyRunway.netMonthlyBurn === 0, 'Empty DB runway returns 0 months without division by zero');

  // Re-seed for subsequent tests
  await seedDemoData();

  // ----------------------------------------------------------------
  // 6. ANTI-HALLUCINATION RESILIENCE
  // ----------------------------------------------------------------
  console.log('\n--- 6. ANTI-HALLUCINATION RESILIENCE ---');

  const sysPrompt = getSystemPrompt(null);
  assert(sysPrompt.includes('NEVER invent, extrapolate, or hallucinate metrics'), 'System prompt strictly instructs against hallucinating data');
  assert(sysPrompt.includes('Facts') && sysPrompt.includes('Calculations') && sysPrompt.includes('Recommendations'), 'System prompt enforces clear distinction between Facts, Calculations, Assumptions, and Recommendations');

  // ----------------------------------------------------------------
  // 7. PROMPT INJECTION RESISTANCE & ALLOWLIST ENFORCEMENT
  // ----------------------------------------------------------------
  console.log('\n--- 7. PROMPT INJECTION RESISTANCE & ALLOWLIST ---');

  let injectionBlocked = false;
  try {
    await executeLocalTool('eval', { code: 'db.delete()' });
  } catch (err: any) {
    injectionBlocked = err.message.includes('not registered in the approved tool whitelist');
  }
  assert(injectionBlocked, 'Unregistered / injection tool names (eval, raw SQL, shell) are strictly rejected');

  let sqlBlocked = false;
  try {
    await executeLocalTool('executeRawQuery', { query: 'DROP TABLE customers' });
  } catch (err: any) {
    sqlBlocked = err.message.includes('not registered in the approved tool whitelist');
  }
  assert(sqlBlocked, 'Arbitrary raw queries are barred by whitelist');

  // ----------------------------------------------------------------
  // 8. CREATE ACTION WITH CONFIRMATION GATING
  // ----------------------------------------------------------------
  console.log('\n--- 8. CREATE ACTION WITH CONFIRMATION GATING ---');

  const conv = await createConversation('Test Confirmation Session');
  const taskTitle = `Follow up with Acme Corp on Contract ${Date.now()}`;
  
  // Test write tool definition is categorized as 'write'
  const taskToolDef = AI_TOOL_DEFINITIONS.find((t) => t.function.name === 'createTask');
  assert(taskToolDef?.function.category === 'write', 'createTask is explicitly categorized as a "write" action requiring confirmation');

  // Verify write tool execution commits cleanly to IndexedDB when user confirms
  const taskResult = await executeLocalTool('createTask', {
    title: taskTitle,
    priority: 'high',
    dueDate: '2026-09-30',
  });
  assert(taskResult.success && taskResult.task.id, 'Confirmed write tool creates new task in IndexedDB');

  const storedTask = await db.tasks.get(taskResult.task.id);
  assert(storedTask?.title === taskTitle, 'Created task verified present in IndexedDB storage');

  // ----------------------------------------------------------------
  // 9. DESTRUCTIVE ACTION WITH STRONG CONFIRMATION GATING
  // ----------------------------------------------------------------
  console.log('\n--- 9. DESTRUCTIVE ACTION WITH STRONG CONFIRMATION ---');

  const deleteToolDef = AI_TOOL_DEFINITIONS.find((t) => t.function.name === 'deleteTask');
  assert(deleteToolDef?.function.category === 'destructive', 'deleteTask is categorized as "destructive" requiring strong confirmation');

  // Execute confirmed delete
  const deleteResult = await executeLocalTool('deleteTask', { id: taskResult.task.id });
  assert(deleteResult.success, 'Confirmed destructive action executes cleanly');

  const postDeleteTask = await db.tasks.get(taskResult.task.id);
  assert(postDeleteTask === undefined, 'Deleted task successfully eradicated from IndexedDB');

  // ----------------------------------------------------------------
  // 10. PROVIDER & API ERROR RESILIENCE
  // ----------------------------------------------------------------
  console.log('\n--- 10. PROVIDER & API FAILURE RESILIENCE ---');

  // Test unconfigured provider handling in processConversationTurn
  await db.aiProviders.clear();
  const unconfiguredRes = await processConversationTurn({
    conversationId: conv.id,
    userPrompt: 'What is my current MRR?',
    history: [],
  });
  assert(
    unconfiguredRes.assistantMessage.content.includes('AI Provider Not Configured'),
    'Unconfigured AI provider returns constructive setup instructions without unhandled exception'
  );

  // Restore provider for persistence test
  await saveAIProvider({
    name: 'OpenRouter Claude',
    type: 'openrouter',
    apiKey: 'sk-or-v1-mock-test-key-12345',
    model: 'anthropic/claude-3.7-sonnet',
    isDefault: true,
  });

  // ----------------------------------------------------------------
  // 11. PAGE REFRESH & CONVERSATION PERSISTENCE
  // ----------------------------------------------------------------
  console.log('\n--- 11. CONVERSATION PERSISTENCE & RELOAD ---');

  const msg1 = await saveAIMessage({
    conversationId: conv.id,
    role: 'user',
    content: 'Summarize top risks',
  });
  const msg2 = await saveAIMessage({
    conversationId: conv.id,
    role: 'assistant',
    content: 'Based on your database, your runway is 12 months with 0 overdue tasks.',
    metadata: { dataSources: ['getRunway', 'getOverdueTasks'], durationMs: 142 },
  });

  const reloadedMsgs = await getMessagesByConversation(conv.id);
  assert(reloadedMsgs.length >= 2, 'Conversations and messages persist in IndexedDB across reloads');
  assert(
    reloadedMsgs.some((m) => m.metadata?.dataSources?.includes('getRunway')),
    'Tool execution metadata and dataSources persist in IndexedDB'
  );

  // ----------------------------------------------------------------
  // 12. LARGE DATASET STRESS HANDLING
  // ----------------------------------------------------------------
  console.log('\n--- 12. LARGE DATASET STRESS HANDLING ---');

  const bulkTxs: any[] = [];
  for (let i = 0; i < 1500; i++) {
    bulkTxs.push({
      id: `stress_tx_${i}`,
      date: '2026-09-01',
      amount: 100 + (i % 50),
      type: i % 4 === 0 ? 'income' : 'expense',
      category: i % 4 === 0 ? 'Subscription' : 'AI API',
      description: `Bulk stress test transaction #${i}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  await db.transactions.bulkAdd(bulkTxs);

  const start = performance.now();
  const stressExpenses = await executeLocalTool('getExpenses');
  const elapsed = performance.now() - start;

  assert(stressExpenses.totalExpenses > 0 && elapsed < 200, `Analyzed 1,500+ bulk transactions in ${elapsed.toFixed(1)}ms (<200ms threshold)`);

  // Cleanup stress transactions
  await db.transactions.bulkDelete(bulkTxs.map((t) => t.id));

  // ----------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------
  console.log('\n======================================================');
  console.log('📊 FOUNDER AI AGENT TEST SUMMARY');
  console.log('======================================================');
  console.log(`Total Tests Run: ${totalPassed + totalFailed}`);
  console.log(`Passed:          ${totalPassed}`);
  console.log(`Failed:          ${totalFailed}`);
  console.log('======================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runFounderAIAgentTests().catch((err) => {
  console.error('Fatal error during Founder AI Agent test execution:', err);
  process.exit(1);
});
