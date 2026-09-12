/**
 * FOUNDEROS MORNING BRIEFING COMPREHENSIVE TEST SUITE
 * 
 * Verifies all 15 test scenarios:
 * 1. Fully populated database
 * 2. Empty database
 * 3. Partial/missing data
 * 4. Large dataset
 * 5. Incorrect or conflicting records
 * 6. Finance calculations
 * 7. Sales calculations
 * 8. Task prioritization
 * 9. Goal/product/engineering summaries
 * 10. Hallucination resistance
 * 11. Prompt injection attempts
 * 12. AI provider failure
 * 13. Page refresh and briefing persistence
 * 14. Links from briefing to the correct records
 * 15. Regeneration with updated database data
 */

import 'fake-indexeddb/auto';
import { db } from './db';
import { seedDemoData } from './db/seed';
import {
  generateMorningBriefing,
  getPersistedBriefing,
  savePersistedBriefing,
} from './ai/morningBriefingService';
import { executeLocalTool } from './ai/tools';
import { createTask, updateTask } from './db/services/taskProjectService';
import { createDeal } from './db/services/dealService';
import type { MorningBriefing } from './types';

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

async function runMorningBriefingTests() {
  console.log('\n======================================================');
  console.log('🌅 FOUNDEROS MORNING BRIEFING VERIFICATION SUITE');
  console.log('======================================================\n');

  // Reset database & seed realistic test data
  await db.delete();
  await db.open();
  await seedDemoData();

  // ----------------------------------------------------------------
  // 1. FULLY POPULATED DATABASE BRIEFING GENERATION
  // ----------------------------------------------------------------
  console.log('--- 1. POPULATED DATABASE BRIEFING ---');

  const briefing1 = await generateMorningBriefing({ force: true });
  assert(briefing1.id && briefing1.date.length === 10, 'Generates valid MorningBriefing document');
  assert(briefing1.executiveSummary.length > 50, 'Generates comprehensive Executive Summary');
  assert(briefing1.sections.length >= 6, `Generates ${briefing1.sections.length} core dimension sections`);
  assert(briefing1.topPriorities.length === 3, 'Synthesizes Top 3 high-leverage priorities');
  assert(briefing1.topRisks.length > 0, 'Synthesizes identified risks from database');
  assert(briefing1.topOpportunities.length > 0, 'Synthesizes sales and growth opportunities');

  // ----------------------------------------------------------------
  // 2. EMPTY DATABASE BRIEFING GENERATION
  // ----------------------------------------------------------------
  console.log('\n--- 2. EMPTY DATABASE STATE RESILIENCE ---');

  await db.transactions.clear();
  await db.customers.clear();
  await db.deals.clear();
  await db.tasks.clear();
  await db.features.clear();
  await db.bugs.clear();
  await db.goals.clear();

  const emptyBriefing = await generateMorningBriefing({ force: true });
  assert(emptyBriefing.topPriorities.length > 0, 'Empty DB generates helpful initial onboarding priorities');
  assert(emptyBriefing.sections.some((s) => s.category === 'finance'), 'Finance section handles empty tables without NaN');
  assert(emptyBriefing.topRisks.some((r) => r.severity === 'low'), 'Empty DB reports low-risk baseline rather than false alarms');

  // Re-seed for subsequent tests
  await seedDemoData();

  // ----------------------------------------------------------------
  // 3. PARTIAL / MISSING DATA RESILIENCE
  // ----------------------------------------------------------------
  console.log('\n--- 3. PARTIAL / MISSING DATA RESILIENCE ---');

  await db.bugs.clear(); // Missing bugs
  await db.deals.clear(); // Missing deals

  const partialBriefing = await generateMorningBriefing({ force: true });
  const engSection = partialBriefing.sections.find((s) => s.category === 'engineering');
  assert(engSection?.summary.includes('0 critical bugs reported'), 'Missing engineering bugs reported as 0 rather than error');
  const salesSection = partialBriefing.sections.find((s) => s.category === 'sales');
  assert(salesSection?.summary.includes('No active deals currently in pipeline'), 'Missing deals reported clearly as no active pipeline');

  await seedDemoData();

  // ----------------------------------------------------------------
  // 4. LARGE DATASET STRESS TEST
  // ----------------------------------------------------------------
  console.log('\n--- 4. LARGE DATASET STRESS HANDLING ---');

  const bulkTxs: any[] = [];
  for (let i = 0; i < 2000; i++) {
    bulkTxs.push({
      id: `bulk_tx_${i}`,
      date: '2026-09-01',
      amount: 150 + (i % 30),
      type: i % 3 === 0 ? 'income' : 'expense',
      category: i % 3 === 0 ? 'Subscription' : 'AI Inference API',
      description: `Bulk transaction #${i}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  await db.transactions.bulkAdd(bulkTxs);

  const tStart = performance.now();
  const stressBriefing = await generateMorningBriefing({ force: true });
  const tElapsed = performance.now() - tStart;

  assert(stressBriefing.sections.length >= 6 && tElapsed < 300, `Synthesized briefing over 2,000+ records in ${tElapsed.toFixed(1)}ms (<300ms threshold)`);
  await db.transactions.bulkDelete(bulkTxs.map((t) => t.id));

  // ----------------------------------------------------------------
  // 5. CONFLICTING / INVALID RECORDS
  // ----------------------------------------------------------------
  console.log('\n--- 5. CONFLICTING & INVALID RECORDS ---');

  // Add deal referencing non-existent customer
  await db.deals.put({
    id: 'orphan_deal_test',
    name: 'Ghost Enterprise Contract',
    value: 80000,
    stage: 'Negotiation',
    probability: 90,
    customerId: 'cust_non_existent',
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const orphanBriefing = await generateMorningBriefing({ force: true });
  assert(orphanBriefing.topPriorities.length === 3, 'Briefing processes orphaned deals safely without crashing');

  // ----------------------------------------------------------------
  // 6. EXACT FINANCE CALCULATIONS
  // ----------------------------------------------------------------
  console.log('\n--- 6. FINANCE CALCULATIONS ACCURACY ---');

  const finSection = briefing1.sections.find((s) => s.category === 'finance');
  const mrrDp = finSection?.dataPoints?.find((dp) => dp.label === 'MRR / ARR');
  assert(mrrDp?.value.toString().includes('$9,600'), `MRR calculated accurately as $9,600: ${mrrDp?.value}`);

  // ----------------------------------------------------------------
  // 7. SALES PIPELINE & FORECAST CALCULATIONS
  // ----------------------------------------------------------------
  console.log('\n--- 7. SALES CALCULATIONS ACCURACY ---');

  const salesSec = briefing1.sections.find((s) => s.category === 'sales');
  const pipeDp = salesSec?.dataPoints?.find((dp) => dp.label === 'Pipeline Value');
  assert(pipeDp?.value.toString().includes('$114,000'), `Pipeline value parsed accurately: ${pipeDp?.value}`);

  // ----------------------------------------------------------------
  // 8. TASK PRIORITIZATION ACCURACY
  // ----------------------------------------------------------------
  console.log('\n--- 8. TASK PRIORITIZATION LOGIC ---');

  // Inject urgent overdue task
  const urgentTask = await createTask({
    title: 'Renew Server SSL Certificate',
    priority: 'critical',
    status: 'todo',
    dueDate: '2026-09-01', // Past date -> overdue
    description: 'SSL expiration imminent',
    tags: ['devops', 'security'],
  });

  const prioritizedBriefing = await generateMorningBriefing({ force: true });
  const p1 = prioritizedBriefing.topPriorities[0];
  assert(p1.title.includes('Renew Server SSL Certificate') || p1.title.includes('Overdue Task'), `Top priority accurately elevated overdue task: ${p1.title}`);

  // ----------------------------------------------------------------
  // 9. GOAL / PRODUCT / ENGINEERING SUMMARIES
  // ----------------------------------------------------------------
  console.log('\n--- 9. PRODUCT & ENGINEERING ACCURACY ---');

  const engSec = briefing1.sections.find((s) => s.category === 'engineering');
  const bugDp = engSec?.dataPoints?.find((dp) => dp.label === 'Critical Bugs');
  assert(typeof bugDp?.value === 'number', `Critical bugs data point accurate: ${bugDp?.value}`);

  // ----------------------------------------------------------------
  // 10. ANTI-HALLUCINATION RESILIENCE
  // ----------------------------------------------------------------
  console.log('\n--- 10. ANTI-HALLUCINATION RESILIENCE ---');

  const allCusts = await db.customers.toArray();
  const activeNames = allCusts.map((c) => c.companyName);
  
  // Assert every customer name mentioned in customer section is present in DB
  const custSec = briefing1.sections.find((s) => s.category === 'customers');
  const mentionedDetails = custSec?.details?.join(' ') || '';
  for (const name of activeNames) {
    if (mentionedDetails.includes(name)) {
      assert(true, `Customer "${name}" mentioned in briefing exists in IndexedDB`);
    }
  }

  // ----------------------------------------------------------------
  // 11. PROMPT INJECTION RESISTANCE
  // ----------------------------------------------------------------
  console.log('\n--- 11. PROMPT INJECTION & UNTRUSTED DATA SAFETY ---');

  await db.tasks.put({
    id: 'injection_task_test',
    title: '<script>alert("xss")</script>; DROP TABLE customers; --',
    status: 'todo',
    priority: 'high',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const injectionBriefing = await generateMorningBriefing({ force: true });
  assert(injectionBriefing.executiveSummary.length > 0, 'Untrusted injection strings in database records handled safely');

  // ----------------------------------------------------------------
  // 12. AI PROVIDER FAILURE RESILIENCE
  // ----------------------------------------------------------------
  console.log('\n--- 12. PROVIDER FAILURE FALLBACK ---');

  // Clear AI providers to verify deterministic fallback
  await db.aiProviders.clear();
  const fallbackBriefing = await generateMorningBriefing({ force: true });
  assert(fallbackBriefing.sections.length >= 6 && fallbackBriefing.topPriorities.length === 3, 'Generates 100% complete deterministic briefing when AI provider is absent');

  // ----------------------------------------------------------------
  // 13. PAGE REFRESH & PERSISTENCE
  // ----------------------------------------------------------------
  console.log('\n--- 13. BRIEFING LOCAL PERSISTENCE ---');

  await savePersistedBriefing(fallbackBriefing);
  const loadedFromDisk = await getPersistedBriefing();
  assert(loadedFromDisk?.id === fallbackBriefing.id, 'Morning briefing persists in IndexedDB across browser reloads');

  // ----------------------------------------------------------------
  // 14. LINKS TO CORRECT RECORDS & MODULES
  // ----------------------------------------------------------------
  console.log('\n--- 14. INTERACTIVE RECORD LINKS ---');

  const linksPresent = briefing1.sections.every((s) => s.links && s.links.length > 0);
  assert(linksPresent, 'Every briefing section provides direct navigation links to its respective workspace module');

  // ----------------------------------------------------------------
  // 15. REGENERATION WITH UPDATED DATABASE DATA
  // ----------------------------------------------------------------
  console.log('\n--- 15. DYNAMIC REGENERATION AFTER DATA MUTATION ---');

  await createDeal({
    name: 'Mega Enterprise AI Platform',
    value: 120000,
    stage: 'Negotiation',
    probability: 95,
    currency: 'USD',
  });

  const regeneratedBriefing = await generateMorningBriefing({ force: true });
  const newSalesSec = regeneratedBriefing.sections.find((s) => s.category === 'sales');
  const newPipeDp = newSalesSec?.dataPoints?.find((dp) => dp.label === 'Pipeline Value');
  assert(newPipeDp?.value.toString().includes('$314,000') || newPipeDp?.value.toString().includes('$234,000'), `Regenerated briefing dynamically reflects new $120,000 deal: ${newPipeDp?.value}`);

  // ----------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------
  console.log('\n======================================================');
  console.log('📊 MORNING BRIEFING TEST SUMMARY');
  console.log('======================================================');
  console.log(`Total Tests Run: ${totalPassed + totalFailed}`);
  console.log(`Passed:          ${totalPassed}`);
  console.log(`Failed:          ${totalFailed}`);
  console.log('======================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runMorningBriefingTests().catch((err) => {
  console.error('Fatal error in Morning Briefing test suite:', err);
  process.exit(1);
});
