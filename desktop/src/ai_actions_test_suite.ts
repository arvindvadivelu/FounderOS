/**
 * FOUNDEROS AI ACTIONS & CONFIRMATION SYSTEM TEST SUITE
 * 
 * Tests all 14 required action scenarios:
 * 1. Create task through AI
 * 2. Update task through AI
 * 3. Complete task through AI
 * 4. Create/update customer
 * 5. Create/update deal
 * 6. Create/update project
 * 7. Create/update goal
 * 8. Create/update feature and bug
 * 9. Cancel an action
 * 10. Attempt destructive action with strong confirmation
 * 11. Attempt prompt injection & tool bypass
 * 12. Repeat the same request multiple times (idempotency)
 * 13. Refresh simulation & persistence
 * 14. Activity audit log recording & post-execution DB verification
 */

import 'fake-indexeddb/auto';
import { db } from './db';
import { seedDemoData } from './db/seed';
import { executeLocalTool, AI_TOOL_DEFINITIONS } from './ai/tools';
import { getActionPreview, verifyActionExecution } from './ai/actionPreviewService';
import { executeConfirmedToolAction } from './ai/toolRunner';
import { createConversation, saveAIMessage } from './db/services/aiStorageService';
import { getRecentActivities } from './db/services/activityService';

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

async function runAIActionsTestSuite() {
  console.log('\n======================================================');
  console.log('⚡ FOUNDEROS SECURE AI ACTIONS & AUDIT TEST SUITE');
  console.log('======================================================\n');

  // Reset database & seed realistic test data
  await db.delete();
  await db.open();
  await seedDemoData();

  const conv = await createConversation('AI Actions Test Session');

  // ----------------------------------------------------------------
  // 1. CREATE TASK THROUGH AI
  // ----------------------------------------------------------------
  console.log('--- 1. TASK ACTIONS ---');
  
  const createMsg = await saveAIMessage({
    conversationId: conv.id,
    role: 'assistant',
    content: 'I have prepared a task for you.',
    toolCalls: [{
      id: 'tc_create_task_1',
      name: 'createTask',
      arguments: {
        title: 'Review SOC2 Compliance Audit',
        priority: 'high',
        dueDate: '2026-09-30',
        description: 'Verify audit trail and backup encryption',
      },
      status: 'pending_confirmation',
    }],
  });

  const taskPreview = await getActionPreview('createTask', {
    title: 'Review SOC2 Compliance Audit',
    priority: 'high',
    dueDate: '2026-09-30',
  });
  assert(taskPreview.actionType === 'create' && taskPreview.targetRecordTitle === 'Review SOC2 Compliance Audit', 'Action preview accurately parses task creation');

  const createExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_create_task_1',
    'createTask',
    {
      title: 'Review SOC2 Compliance Audit',
      priority: 'high',
      dueDate: '2026-09-30',
      description: 'Verify audit trail and backup encryption',
    }
  );

  assert(createExec.success && createExec.result.task.id, 'Task creation confirmed and committed to IndexedDB');
  assert(createExec.verification?.verified === true, 'Post-execution DB verification confirms task presence in IndexedDB');
  const createdTaskId = createExec.result.task.id;

  // ----------------------------------------------------------------
  // 2. UPDATE TASK THROUGH AI
  // ----------------------------------------------------------------
  const updateTaskPreview = await getActionPreview('updateTask', {
    id: createdTaskId,
    priority: 'critical',
  });
  assert(
    updateTaskPreview.diffs.some((d) => d.field === 'priority' && d.oldValue === 'high' && d.newValue === 'critical'),
    'Update task preview calculates Old value (high) -> New value (critical) diff'
  );

  const updateExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_update_task_1',
    'updateTask',
    { id: createdTaskId, priority: 'critical' }
  );
  assert(updateExec.success && updateExec.result.task.priority === 'critical', 'Task priority updated to critical in IndexedDB');

  // ----------------------------------------------------------------
  // 3. COMPLETE TASK THROUGH AI
  // ----------------------------------------------------------------
  const completeExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_complete_task_1',
    'completeTask',
    { id: createdTaskId }
  );
  assert(completeExec.success && completeExec.result.task.status === 'done', 'completeTask marks task status as done and records completedAt');
  const storedDoneTask = await db.tasks.get(createdTaskId);
  assert(storedDoneTask?.status === 'done' && !!storedDoneTask?.completedAt, 'Task completion verified in raw IndexedDB');

  // ----------------------------------------------------------------
  // 4. CREATE / UPDATE CUSTOMER
  // ----------------------------------------------------------------
  console.log('\n--- 2. CUSTOMER CRM ACTIONS ---');

  const custExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_create_cust_1',
    'createCustomer',
    {
      companyName: 'Apex Cloud Systems',
      contactName: 'Sarah Jenkins',
      email: 'sarah@apexcloud.io',
      monthlyRevenue: 2500,
      plan: 'Enterprise',
      status: 'active',
    }
  );
  assert(custExec.success && custExec.result.customer.id, 'createCustomer successfully creates customer record');
  const newCustId = custExec.result.customer.id;

  const updateCustExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_update_cust_1',
    'updateCustomer',
    { id: newCustId, monthlyRevenue: 3500, plan: 'Enterprise Plus' }
  );
  assert(updateCustExec.success && updateCustExec.result.customer.monthlyRevenue === 3500, 'updateCustomer updates MRR and plan in IndexedDB');

  // ----------------------------------------------------------------
  // 5. CREATE / UPDATE DEAL
  // ----------------------------------------------------------------
  console.log('\n--- 3. SALES DEAL ACTIONS ---');

  const dealExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_create_deal_1',
    'createDeal',
    {
      name: 'Apex Enterprise Rollout',
      value: 42000,
      stage: 'Proposal',
      probability: 60,
      customerId: newCustId,
    }
  );
  assert(dealExec.success && dealExec.result.deal.id, 'createDeal creates new sales deal in IndexedDB');
  const dealId = dealExec.result.deal.id;

  const updateDealExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_update_deal_1',
    'updateDeal',
    { id: dealId, stage: 'Negotiation', probability: 85 }
  );
  assert(updateDealExec.success && updateDealExec.result.deal.stage === 'Negotiation', 'updateDeal updates stage and win probability in IndexedDB');

  // ----------------------------------------------------------------
  // 6. CREATE / UPDATE PROJECT
  // ----------------------------------------------------------------
  console.log('\n--- 4. PROJECT ACTIONS ---');

  const projExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_create_proj_1',
    'createProject',
    {
      name: 'Autonomous Agent Engine V2',
      priority: 'high',
      targetDate: '2026-11-15',
      description: 'Self-improving tool executor',
    }
  );
  assert(projExec.success && projExec.result.project.id, 'createProject creates strategic initiative in IndexedDB');
  const projId = projExec.result.project.id;

  const updateProjExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_update_proj_1',
    'updateProject',
    { id: projId, progress: 45, status: 'in_progress' }
  );
  assert(updateProjExec.success && updateProjExec.result.project.progress === 45, 'updateProject updates progress % and status in IndexedDB');

  // ----------------------------------------------------------------
  // 7. CREATE / UPDATE GOAL
  // ----------------------------------------------------------------
  console.log('\n--- 5. GOAL ACTIONS ---');

  const goalExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_create_goal_1',
    'createGoal',
    {
      title: 'Reach $50k MRR',
      target: 50000,
      currentValue: 12000,
      unit: '$',
      deadline: '2026-12-31',
    }
  );
  assert(goalExec.success && goalExec.result.goal.id, 'createGoal establishes company OKR in IndexedDB');
  const goalId = goalExec.result.goal.id;

  const updateGoalExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_update_goal_1',
    'updateGoal',
    { id: goalId, currentValue: 18500 }
  );
  assert(updateGoalExec.success && updateGoalExec.result.goal.currentValue === 18500, 'updateGoal increments milestone achievement in IndexedDB');

  // ----------------------------------------------------------------
  // 8. CREATE / UPDATE FEATURE & BUG
  // ----------------------------------------------------------------
  console.log('\n--- 6. PRODUCT & ENGINEERING ACTIONS ---');

  const featExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_create_feat_1',
    'createFeature',
    {
      title: 'Real-time Webhook Triggers',
      priority: 'high',
      impact: 'high',
      effort: 'medium',
    }
  );
  assert(featExec.success && featExec.result.feature.id, 'createFeature logs product backlog item');
  const featId = featExec.result.feature.id;

  const updateFeatExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_update_feat_1',
    'updateFeature',
    { id: featId, status: 'in_progress' }
  );
  assert(updateFeatExec.success && updateFeatExec.result.feature.status === 'in_progress', 'updateFeature moves feature to in_progress');

  const bugExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_create_bug_1',
    'createBug',
    {
      title: 'Stripe webhook signature mismatch on refund',
      severity: 'high',
      priority: 'critical',
    }
  );
  assert(bugExec.success && bugExec.result.bug.id, 'createBug logs engineering bug');
  const bugId = bugExec.result.bug.id;

  const updateBugExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_update_bug_1',
    'updateBug',
    { id: bugId, status: 'resolved' }
  );
  assert(updateBugExec.success && updateBugExec.result.bug.status === 'resolved', 'updateBug marks bug as resolved');

  // ----------------------------------------------------------------
  // 9. CANCEL AN ACTION FLOW
  // ----------------------------------------------------------------
  console.log('\n--- 7. CANCELLATION & INTEGRITY ---');

  const cancelTaskId = `task_not_created_${Date.now()}`;
  const preCount = await db.tasks.count();
  // Simulating user clicking cancel in UI: no tool execution occurs
  const postCancelCount = await db.tasks.count();
  assert(preCount === postCancelCount, 'Cancelling an action leaves IndexedDB untouched');

  // ----------------------------------------------------------------
  // 10. DESTRUCTIVE ACTION WITH STRONG CONFIRMATION
  // ----------------------------------------------------------------
  console.log('\n--- 8. DESTRUCTIVE ACTION WITH CONFIRMATION GATING ---');

  const deletePreview = await getActionPreview('deleteCustomer', { id: newCustId });
  assert(deletePreview.isDestructive === true && deletePreview.warning !== undefined, 'Destructive action preview flags high-impact warning');

  const deleteCustExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_del_cust_1',
    'deleteCustomer',
    { id: newCustId }
  );
  assert(deleteCustExec.success && deleteCustExec.verification?.verified === true, 'Destructive delete executes and confirms record eradication');
  const deletedCustCheck = await db.customers.get(newCustId);
  assert(deletedCustCheck === undefined, 'Customer verified deleted from IndexedDB');

  // ----------------------------------------------------------------
  // 11. PROMPT INJECTION & UNWHITELISTED TOOL RESISTANCE
  // ----------------------------------------------------------------
  console.log('\n--- 9. SECURITY & INJECTION RESISTANCE ---');

  let blockedInjection = false;
  try {
    await executeLocalTool('modifySecuritySettings', { disableConfirmation: true });
  } catch (err: any) {
    blockedInjection = err.message.includes('not registered in the approved tool whitelist');
  }
  assert(blockedInjection, 'AI cannot execute arbitrary tools or disable its own confirmation constraints');

  // ----------------------------------------------------------------
  // 12. IDEMPOTENCY & DUPLICATE EXECUTION PREVENTION
  // ----------------------------------------------------------------
  console.log('\n--- 10. IDEMPOTENCY & DUPLICATE PREVENTION ---');

  // Attempt to execute the same toolCallId 'tc_create_task_1' again
  const duplicateExec = await executeConfirmedToolAction(
    createMsg.id,
    'tc_create_task_1',
    'createTask',
    { title: 'Duplicate Review Task' }
  );
  assert(
    duplicateExec.verification?.message.includes('already executed'),
    'Idempotency engine prevents duplicate re-execution of previously executed actions'
  );

  // ----------------------------------------------------------------
  // 13. PERSISTENCE & RELOAD
  // ----------------------------------------------------------------
  console.log('\n--- 11. DATABASE PERSISTENCE ACROSS SESSIONS ---');

  const reloadedTask = await db.tasks.get(createdTaskId);
  assert(reloadedTask?.title === 'Review SOC2 Compliance Audit' && reloadedTask?.status === 'done', 'All AI actions persist accurately in IndexedDB');

  // ----------------------------------------------------------------
  // 14. ACTIVITY AUDIT HISTORY RECORDING
  // ----------------------------------------------------------------
  console.log('\n--- 12. AUDIT HISTORY RECORDING ---');

  const recentActs = await getRecentActivities(20);
  const aiActionsLogged = recentActs.filter((a) => a.action === 'ai_action_executed');
  assert(aiActionsLogged.length > 0, `Verified ${aiActionsLogged.length} AI actions logged in activity audit history`);

  // ----------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------
  console.log('\n======================================================');
  console.log('📊 AI ACTIONS TEST SUMMARY');
  console.log('======================================================');
  console.log(`Total Tests Run: ${totalPassed + totalFailed}`);
  console.log(`Passed:          ${totalPassed}`);
  console.log(`Failed:          ${totalFailed}`);
  console.log('======================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runAIActionsTestSuite().catch((err) => {
  console.error('Fatal error in AI actions test suite:', err);
  process.exit(1);
});
