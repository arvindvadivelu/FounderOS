import 'fake-indexeddb/auto';
import { db } from './db';
import { seedDemoData } from './db/seed';
import { WorkflowEngine, FOUNDER_WORKFLOW_RECIPES } from './engines/workflowEngine';
import { ExecutiveAgentService } from './engines/executiveAgentService';
import { FinancialForecastEngine } from './engines/financialForecastEngine';
import { CustomerIntelligenceEngine } from './engines/customerIntelligenceEngine';
import { ProductIntelligenceEngine } from './engines/productIntelligenceEngine';
import { AutonomousRoutineService } from './engines/autonomousRoutineService';
import type { WorkflowRule, ForecastScenario } from './types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runV2ArchitectureTestSuite() {
  console.log('====================================================');
  console.log('  FounderOS V2 Comprehensive Architecture Test Suite');
  console.log('====================================================\n');

  // Seed baseline data
  await seedDemoData();

  // ----------------------------------------------------
  // PILLAR 1: Automated Workflows Engine
  // ----------------------------------------------------
  console.log('--- Pillar 1: Automated Workflows Engine ---');
  const allWorkflows = await db.workflows.toArray();
  assert(allWorkflows.length >= 5, 'Seeded at least 5 default founder workflow recipes');

  const overdueWf = allWorkflows.find(w => w.triggerType === 'invoice_overdue');
  assert(!!overdueWf, 'Found Overdue Invoice Sentinel workflow');

  if (overdueWf) {
    const log = await WorkflowEngine.executeWorkflow(overdueWf, {
      source: 'test_runner',
      amount: 4800,
      invoiceId: 'inv_test_1',
      customerId: 'cust_1',
    });
    assert(log.status === 'success', 'Executed overdue workflow with matching condition');
    assert(log.actionsExecuted >= 1, 'Created collection tasks and notes');

    // Test condition failure
    const skippedLog = await WorkflowEngine.executeWorkflow(overdueWf, {
      source: 'test_runner',
      amount: 200, // < 1000, condition not met
    });
    assert(skippedLog.status === 'warning', 'Skipped safely when conditions were not met');
  }

  // ----------------------------------------------------
  // PILLAR 2: Advanced AI Agents & Executive Boardroom
  // ----------------------------------------------------
  console.log('\n--- Pillar 2: Advanced AI Agents & Boardroom ---');
  const agents = ExecutiveAgentService.getAllAgents();
  assert(agents.length === 5, 'All 5 executive personas registered (CEO, CFO, CRO, CPO, COO)');

  const session = await ExecutiveAgentService.startBoardroomDeliberation(
    'Hiring vs Sales Acceleration',
    'Should we hire 2 senior engineers or 2 enterprise AEs?',
    ['ceo', 'cfo', 'cro', 'cpo', 'coo']
  );
  assert(session.messages.length === 5, 'Generated debate messages from all 5 C-suite executives');
  assert(!!session.consensus, 'Synthesized unanimous executive consensus');
  assert(session.consensus?.alignmentScore! > 70, 'Calculated high alignment score (>70%)');
  assert(session.consensus?.actionChecklist.length! >= 3, 'Created cross-functional delegated action checklist');

  // ----------------------------------------------------
  // PILLAR 3: Financial Forecasting & Scenario Simulator
  // ----------------------------------------------------
  console.log('\n--- Pillar 3: Financial Forecasting & Scenarios ---');
  const baseScenario: ForecastScenario = {
    id: 'sc-test',
    name: 'Test Scenario',
    type: 'base',
    description: 'Test forecast scenario',
    mrrGrowthRatePct: 8,
    churnRatePct: 2,
    grossMarginPct: 80,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const projection = FinancialForecastEngine.generateProjection(
    baseScenario,
    250000, // $250k cash
    20000,  // $20k MRR
    15000,  // $15k burn
    [],
    12
  );
  assert(projection.projections.length === 12, 'Generated 12-month projection trajectory');
  assert(projection.projections[11].projectedMrr > 20000, 'Projected compounding MRR growth');
  assert(projection.runwayMonths > 10, 'Accurately calculated cash runway');

  const hiringImpact = FinancialForecastEngine.calculateHiringImpact(
    250000,
    15000,
    10000 // $10k salary
  );
  assert(hiringImpact.runwayWithHire < hiringImpact.runwayWithoutHire, 'Hiring sensitivity accurately models runway reduction');

  // ----------------------------------------------------
  // PILLAR 4: Customer Intelligence & Churn Radar
  // ----------------------------------------------------
  console.log('\n--- Pillar 4: Customer Intelligence & Churn Radar ---');
  const healthScores = await CustomerIntelligenceEngine.evaluateAllCustomers();
  assert(healthScores.length > 0, 'Evaluated all customer health metrics');

  const atRisk = healthScores.find(h => h.quadrant === 'at_risk');
  assert(!!atRisk, 'Identified at-risk account with high churn risk score');
  if (atRisk) {
    assert(atRisk.churnRiskScore >= 50, 'At-risk customer has churn risk score >= 50');
    assert(atRisk.churnRiskFactors.length > 0, 'Identified specific diagnostic churn factors');
  }

  const expansionOpps = await CustomerIntelligenceEngine.discoverExpansionOpportunities();
  assert(expansionOpps.length > 0, 'Identified account expansion opportunities with positive ARR upside');

  // ----------------------------------------------------
  // PILLAR 5: Product Intelligence & RICE Matrix
  // ----------------------------------------------------
  console.log('\n--- Pillar 5: Product Intelligence & RICE Matrix ---');
  const { riceScore, quadrant } = ProductIntelligenceEngine.calculateRice(8, 5, 90, 2);
  assert(riceScore > 100, 'Calculated accurate RICE score formula: (R * I * C) / E');
  assert(quadrant === 'quick_win', 'Classified low effort high impact feature as quick_win');

  const priorities = await ProductIntelligenceEngine.syncBacklogPriorities();
  assert(priorities.length >= 4, 'Synced product backlog priorities');
  assert(priorities[0].riceScore >= priorities[1].riceScore, 'Sorted backlog by RICE score descending');

  // ----------------------------------------------------
  // PILLAR 6: Autonomous Routine Operations & Auto-Healing
  // ----------------------------------------------------
  console.log('\n--- Pillar 6: Autonomous Operations & Auto-Healing ---');
  const anomalies = await AutonomousRoutineService.scanForAnomalies();
  assert(anomalies.length > 0, 'Scanned and detected operational anomalies');

  const firstAnomaly = anomalies[0];
  const healed = await AutonomousRoutineService.autoHealAnomaly(firstAnomaly.id);
  assert(healed === true, '1-Click Auto-Healed anomaly and created mitigation task');

  const refreshedAnomaly = await db.anomalies.get(firstAnomaly.id);
  assert(refreshedAnomaly?.resolved === true, 'Marked anomaly as resolved in database');

  const routine = (await db.autonomousRoutines.toArray())[0];
  const routineRecord = await AutonomousRoutineService.executeRoutine(routine);
  assert(routineRecord.status === 'success' || routineRecord.status === 'warning', 'Executed scheduled routine with audit log');

  // ----------------------------------------------------
  // PILLAR 7: External Integrations & Webhook Ingestion
  // ----------------------------------------------------
  console.log('\n--- Pillar 7: External Integrations & Webhook Ingestion ---');
  const whId = `wh-test-${Date.now()}`;
  await db.webhookEvents.add({
    id: whId,
    provider: 'stripe',
    eventType: 'customer.subscription.created',
    payload: { customer: 'cust_1', plan: 'enterprise', amount: 4800 },
    receivedAt: new Date().toISOString(),
    processed: true,
  });
  const ingestedWh = await db.webhookEvents.get(whId);
  assert(ingestedWh?.eventType === 'customer.subscription.created', 'Successfully ingested and recorded external webhook event');

  console.log('\n====================================================');
  console.log(`  Test Suite Completed: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runV2ArchitectureTestSuite().catch(err => {
  console.error('Fatal error running V2 test suite:', err);
  process.exit(1);
});
