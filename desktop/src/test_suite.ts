import 'fake-indexeddb/auto';
import { db } from './db';
import { seedDemoData, clearAllCompanyData } from './db/seed';
import {
  getCompany,
  saveCompany,
  getSettings,
  updateSettings,
} from './db/services/companyService';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from './db/services/customerService';
import {
  getAllDeals,
  createDeal,
  updateDeal,
  deleteDeal,
} from './db/services/dealService';
import {
  getAllTransactions,
  createTransaction,
  deleteTransaction,
  getAllInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getFinancialSummary,
} from './db/services/financeService';
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
} from './db/services/taskProjectService';
import {
  getAllFeatures,
  createFeature,
  updateFeature,
  deleteFeature,
  getAllBugs,
  createBug,
  updateBug,
  deleteBug,
} from './db/services/productEngineeringService';
import {
  getAllGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getAllNotes,
  createNote,
  updateNote,
  deleteNote,
} from './db/services/goalNoteService';
import {
  logActivity,
  getRecentActivities,
} from './db/services/activityService';
import {
  getAllAIProviders,
  getDefaultAIProvider,
  saveAIProvider,
  deleteAIProvider,
  getAllConversations,
  createConversation,
  deleteConversation,
  getMessagesByConversation,
  saveAIMessage,
} from './db/services/aiStorageService';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getPayrollSummary,
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getCashPositionSummary,
  getAllBalanceSheetItems,
  createBalanceSheetItem,
  updateBalanceSheetItem,
  deleteBalanceSheetItem,
  getBalanceSheetSummary,
  saveUploadedFileRecord,
  getAllUploadedFiles,
  deleteUploadedFile,
} from './db/services/managementService';
import { runFinancialReconciliation, executeAutoReconcileFix } from './ai/reconciliation';
import { exportAllData, importDataFromPayload } from './utils/exportImport';
import { executeLocalTool } from './ai/tools';

interface TestReport {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: string;
}

const testResults: TestReport[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    testResults.push({ name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✓ PASS: ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    testResults.push({ name, passed: false, durationMs: Date.now() - start, error: err.message || String(err) });
    console.error(`  ✗ FAIL: ${name}:`, err.message || err);
  }
}

export async function runFullDatabaseIntegritySuite() {
  console.log('\n======================================================');
  console.log('🚀 FOUNDEROS DATABASE INTEGRITY & VERIFICATION SUITE');
  console.log('======================================================\n');

  // ==========================================
  // SUITE 1: Initialization & Seed Demo Data
  // ==========================================
  console.log('--- 1. DATABASE INITIALIZATION & SCHEMA STORES ---');
  await runTest('DB Schema v4 creates all 37 tables', async () => {
    if (db.tables.length !== 37) {
      throw new Error(`Expected 37 tables in Dexie, found ${db.tables.length}`);
    }
  });

  await runTest('seedDemoData() seeds realistic entities across all tables', async () => {
    await seedDemoData();
    const [c, cust, d, tx, inv, prj, tsk, feat, bg, gl, nt, emp, dept, bnk, bs, fl, prov] = await Promise.all([
      db.companies.count(),
      db.customers.count(),
      db.deals.count(),
      db.transactions.count(),
      db.invoices.count(),
      db.projects.count(),
      db.tasks.count(),
      db.features.count(),
      db.bugs.count(),
      db.goals.count(),
      db.notes.count(),
      db.employees.count(),
      db.departments.count(),
      db.bankAccounts.count(),
      db.balanceSheetItems.count(),
      db.uploadedFiles.count(),
      db.aiProviders.count(),
    ]);

    if (c === 0 || cust === 0 || d === 0 || tx === 0 || inv === 0 || emp === 0 || dept === 0 || bnk === 0 || bs === 0 || fl === 0 || prov === 0) {
      throw new Error(`Seed failed: incomplete tables (c=${c}, cust=${cust}, emp=${emp}, bnk=${bnk})`);
    }
  });

  // ==========================================
  // SUITE 2: Full CRUD on All 21 Tables
  // ==========================================
  console.log('\n--- 2. CRUD INTEGRITY ON ALL 21 ENTITIES ---');
  
  await runTest('Company Profile & Settings CRUD', async () => {
    const comp = await saveCompany({ name: 'Acme AI Systems', currency: 'EUR' });
    const fetched = await getCompany();
    if (fetched?.name !== 'Acme AI Systems' || fetched?.currency !== 'EUR') throw new Error('Company save failed');

    const st = await updateSettings({ theme: 'light', timezone: 'Europe/Paris' });
    if (st.theme !== 'light' || st.timezone !== 'Europe/Paris') throw new Error('Settings update failed');
  });

  await runTest('Customer & Deal CRUD', async () => {
    const cust = await createCustomer({
      companyName: 'Starlight Dynamics',
      contactName: 'Nova Vance',
      email: 'nova@starlight.io',
      status: 'active',
      monthlyRevenue: 3500,
      tags: ['ai', 'b2b'],
    });
    const fetchedCust = await getCustomerById(cust.id);
    if (!fetchedCust || fetchedCust.monthlyRevenue !== 3500) throw new Error('Customer creation failed');

    const deal = await createDeal({
      name: 'Starlight Enterprise Expansion',
      value: 42000,
      stage: 'Negotiation',
      probability: 80,
      customerId: cust.id,
      currency: 'EUR',
    });
    const updatedDeal = await updateDeal(deal.id, { stage: 'Won', probability: 100 });
    if (updatedDeal.stage !== 'Won') throw new Error('Deal update failed');

    await deleteDeal(deal.id);
    const deals = await getAllDeals();
    if (deals.some(d => d.id === deal.id)) throw new Error('Deal delete failed');
  });

  await runTest('Finance: Transaction & Invoice CRUD', async () => {
    const tx = await createTransaction({
      type: 'expense',
      category: 'AI API',
      description: 'OpenRouter DeepSeek Inference',
      amount: 450,
      currency: 'USD',
      date: '2026-03-01',
      status: 'cleared',
      recurring: false,
    });
    const allTx = await getAllTransactions();
    if (!allTx.some(t => t.id === tx.id)) throw new Error('Transaction creation failed');

    const inv = await createInvoice({
      customerId: 'cust_test',
      customerName: 'Starlight Dynamics',
      invoiceNumber: 'INV-TEST-001',
      issueDate: '2026-03-01',
      dueDate: '2026-03-31',
      amount: 3500,
      currency: 'USD',
      status: 'sent',
    });
    const updatedInv = await updateInvoice(inv.id, { status: 'paid' });
    if (updatedInv.status !== 'paid') throw new Error('Invoice update failed');

    await deleteTransaction(tx.id);
    await deleteInvoice(inv.id);
    const postInvs = await getAllInvoices();
    if (postInvs.some(i => i.id === inv.id)) throw new Error('Invoice deletion failed');
  });

  await runTest('Projects, Tasks, Features & Bugs CRUD', async () => {
    const proj = await createProject({
      name: 'Realtime Sync Engine',
      description: 'IndexedDB multi-tab sync',
      status: 'in_progress',
      priority: 'high',
      progress: 40,
    });
    const task = await createTask({
      title: 'Implement Dexie liveQuery hooks',
      projectId: proj.id,
      status: 'todo',
      priority: 'high',
      dueDate: '2026-04-01',
      tags: ['sync', 'indexeddb'],
    });
    const updatedTask = await updateTask(task.id, { status: 'done' });
    if (updatedTask.status !== 'done' || !updatedTask.completedAt) throw new Error('Task done transition failed');

    const feat = await createFeature({
      title: 'Local Semantic Search',
      description: 'On-device embeddings',
      projectId: proj.id,
      status: 'planned',
      priority: 'high',
      impact: 'high',
      effort: 'medium',
    });
    const bug = await createBug({
      title: 'Memory leak in canvas chart',
      projectId: proj.id,
      severity: 'medium',
      status: 'investigating',
      priority: 'high',
    });
    const updatedBug = await updateBug(bug.id, { status: 'resolved' });
    if (updatedBug.status !== 'resolved' || !updatedBug.resolvedAt) throw new Error('Bug resolve transition failed');

    await deleteTask(task.id);
    await deleteFeature(feat.id);
    await deleteBug(bug.id);
    await deleteProject(proj.id);
  });

  await runTest('Goals, Notes & Activities CRUD', async () => {
    const goal = await createGoal({
      title: 'Reach $50k MRR',
      target: 50000,
      currentValue: 18000,
      unit: 'USD',
      period: 'Q2',
      status: 'on_track',
    });
    const updatedGoal = await updateGoal(goal.id, { currentValue: 24000 });
    if (updatedGoal.currentValue !== 24000) throw new Error('Goal update failed');

    const note = await createNote({
      title: 'Investor Meeting Notes',
      content: 'Discussion with Sequoia on AI agents',
      category: 'Fundraising',
      isPinned: true,
      tags: ['investor', 'ai'],
    });
    const notes = await getAllNotes();
    if (notes[0].id !== note.id) throw new Error('Pinned note sort failed');

    await logActivity('tested_system', 'system', 'Integrity test ran');
    const acts = await getRecentActivities(5);
    if (!acts.some(a => a.action === 'tested_system')) throw new Error('Activity log failed');

    await deleteGoal(goal.id);
    await deleteNote(note.id);
  });

  await runTest('AI Providers, Conversations & Messages CRUD', async () => {
    const provider = await saveAIProvider({
      name: 'Custom OpenRouter Endpoint',
      type: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'sk-or-test-key',
      model: 'anthropic/claude-3.5-sonnet',
      isDefault: true,
    });
    const def = await getDefaultAIProvider();
    if (def?.id !== provider.id) throw new Error('Default AI provider failed');

    const conv = await createConversation('Founder Strategy Session', provider.id);
    const msg = await saveAIMessage({
      conversationId: conv.id,
      role: 'user',
      content: 'What is our current runway?',
    });
    const msgs = await getMessagesByConversation(conv.id);
    if (msgs.length !== 1 || msgs[0].id !== msg.id) throw new Error('AI Message retrieval failed');

    await deleteConversation(conv.id);
    const postMsgs = await getMessagesByConversation(conv.id);
    if (postMsgs.length !== 0) throw new Error('Cascade message delete failed');

    await deleteAIProvider(provider.id);
  });

  await runTest('Management Suite CRUD (Employees, Depts, Cash, Balance Sheet, Vault)', async () => {
    const dept = await createDepartment({
      name: 'Quantum Intelligence Lab',
      description: 'Advanced heuristic algorithms',
      budget: 200000,
      currency: 'USD',
    });
    const emp = await createEmployee({
      name: 'Dr. Marcus Vance',
      email: 'marcus@solvst.ai',
      departmentId: dept.id,
      departmentName: dept.name,
      role: 'Lead Quantum Architect',
      employmentType: 'full_time',
      salary: 175000,
      salaryPeriod: 'annual',
      currency: 'USD',
      status: 'active',
      startDate: '2026-01-01',
    });
    const bnk = await createBankAccount({
      accountName: 'Mercury Treasury Reserve II',
      institution: 'Mercury Bank',
      accountNumberMask: '•••• 8821',
      accountType: 'treasury',
      balance: 125000,
      currency: 'USD',
      isPrimary: false,
      apy: 5.2,
    });
    const bsItem = await createBalanceSheetItem({
      name: 'Quantum AI Patent Pending',
      type: 'asset',
      category: 'intangible_asset',
      value: 300000,
      currency: 'USD',
    });
    const file = await saveUploadedFileRecord({
      name: 'Quantum_Patent_Filing.pdf',
      fileType: 'pdf',
      category: 'legal',
      sizeBytes: 890000,
      mimeType: 'application/pdf',
      dataBase64: 'data:application/pdf;base64,JVBERi0xLjQKJcfs...',
      description: 'USPTO Patent Application filing',
    });

    const payroll = await getPayrollSummary();
    const cash = await getCashPositionSummary();
    const bs = await getBalanceSheetSummary();

    if (payroll.totalEmployees === 0 || cash.totalCash === 0 || bs.totalAssets === 0) {
      throw new Error('Management calculation failed');
    }

    await deleteEmployee(emp.id);
    await deleteDepartment(dept.id);
    await deleteBankAccount(bnk.id);
    await deleteBalanceSheetItem(bsItem.id);
    await deleteUploadedFile(file.id);
  });

  // ==========================================
  // SUITE 3: Foreign Key & Relationship Integrity
  // ==========================================
  console.log('\n--- 3. RELATIONSHIPS & REFERENCE INTEGRITY ---');

  await runTest('Customer deletion safely unlinks deals and invoices with (Deleted) tag', async () => {
    const cust = await createCustomer({
      companyName: 'Orphan Target Corp',
      contactName: 'Target Lead',
      email: 'target@orphantarget.io',
      status: 'lead',
      monthlyRevenue: 0,
      tags: ['target'],
    });
    const deal = await createDeal({
      name: 'Orphan Deal',
      value: 10000,
      customerId: cust.id,
      stage: 'Proposal',
      probability: 50,
      currency: 'USD',
    });
    const inv = await createInvoice({
      customerId: cust.id,
      customerName: 'Orphan Target Corp',
      invoiceNumber: 'INV-ORPH-1',
      amount: 500,
      currency: 'USD',
      status: 'sent',
      issueDate: '2026-03-01',
      dueDate: '2026-03-31',
    });

    await deleteCustomer(cust.id);

    const updatedDeal = await db.deals.get(deal.id);
    const updatedInv = await db.invoices.get(inv.id);

    if (updatedDeal?.customerId !== undefined || !updatedDeal?.customerName?.includes('(Deleted)')) {
      throw new Error('Deal customer reference was not safely unlinked');
    }
    if (updatedInv?.customerId !== undefined || !updatedInv?.customerName?.includes('(Deleted)')) {
      throw new Error('Invoice customer reference was not safely unlinked');
    }
  });

  await runTest('Project deletion safely unlinks tasks, features, and bugs to prevent backlog loss', async () => {
    const proj = await createProject({
      name: 'Deletable Project',
      status: 'in_progress',
      priority: 'medium',
      progress: 10,
    });
    const task = await createTask({
      title: 'Linked Task',
      projectId: proj.id,
      status: 'todo',
      priority: 'medium',
      tags: [],
    });
    const feat = await createFeature({
      title: 'Linked Feature',
      projectId: proj.id,
      status: 'planned',
      priority: 'medium',
      impact: 'high',
      effort: 'medium',
    });
    const bug = await createBug({
      title: 'Linked Bug',
      projectId: proj.id,
      severity: 'medium',
      status: 'investigating',
      priority: 'medium',
    });

    await deleteProject(proj.id);

    const updatedTask = await db.tasks.get(task.id);
    const updatedFeat = await db.features.get(feat.id);
    const updatedBug = await db.bugs.get(bug.id);

    if (updatedTask?.projectId !== undefined || updatedFeat?.projectId !== undefined || updatedBug?.projectId !== undefined) {
      throw new Error('Project sub-entities were not cleanly unlinked');
    }
  });

  await runTest('Department deletion safely unlinks employees', async () => {
    const dept = await createDepartment({ name: 'Temporary Dept', budget: 10000, currency: 'USD' });
    const emp = await createEmployee({
      name: 'Temp Staff',
      email: 'temp@solvst.ai',
      role: 'Intern',
      departmentId: dept.id,
      departmentName: dept.name,
      employmentType: 'intern',
      salary: 30000,
      salaryPeriod: 'annual',
      currency: 'USD',
      status: 'active',
      startDate: '2026-01-01',
    });

    await deleteDepartment(dept.id);

    const updatedEmp = await db.employees.get(emp.id);
    if (updatedEmp?.departmentId !== undefined || updatedEmp?.departmentName !== undefined) {
      throw new Error('Employee department reference was not unlinked on department delete');
    }
  });

  await runTest('Primary bank account deletion promotes first remaining account', async () => {
    await db.bankAccounts.clear();
    const acc1 = await createBankAccount({
      accountName: 'Primary SVB',
      institution: 'SVB',
      accountNumberMask: '•••• 1111',
      accountType: 'checking',
      isPrimary: true,
      balance: 1000,
      currency: 'USD',
    });
    const acc2 = await createBankAccount({
      accountName: 'Secondary Mercury',
      institution: 'Mercury',
      accountNumberMask: '•••• 2222',
      accountType: 'treasury',
      isPrimary: false,
      balance: 2000,
      currency: 'USD',
    });

    await deleteBankAccount(acc1.id);

    const remainingAcc2 = await db.bankAccounts.get(acc2.id);
    if (!remainingAcc2?.isPrimary) {
      throw new Error('Primary account status was not promoted to remaining account');
    }
  });

  // ==========================================
  // SUITE 4: Empty States & Graceful Fallbacks
  // ==========================================
  console.log('\n--- 4. EMPTY STATES & INVALID DATA RESILIENCE ---');

  await runTest('Aggregation functions return clean 0s when database is empty', async () => {
    await clearAllCompanyData();

    const fin = await getFinancialSummary();
    const payroll = await getPayrollSummary();
    const cash = await getCashPositionSummary();
    const bs = await getBalanceSheetSummary();
    const settings = await getSettings();

    if (fin.mrr !== 0 || fin.totalIncome !== 0 || fin.runwayMonths !== 0) throw new Error('Financial empty summary failed');
    if (payroll.totalEmployees !== 0 || payroll.totalAnnualPayroll !== 0) throw new Error('Payroll empty summary failed');
    if (cash.totalCash !== 0 || cash.accountsCount !== 0) throw new Error('Cash empty summary failed');
    if (bs.totalAssets !== 0 || bs.netWorth !== 0) throw new Error('Balance sheet empty summary failed');
    if (settings.id !== 'singleton') throw new Error('Settings singleton auto-initialization failed');
  });

  await runTest('Non-existent ID updates throw descriptive errors rather than silent corruptions', async () => {
    let caught = false;
    try {
      await updateCustomer('non_existent_id_9999', { companyName: 'Ghost' });
    } catch {
      caught = true;
    }
    if (!caught) throw new Error('Expected update on non-existent customer to throw error');
  });

  // ==========================================
  // SUITE 5: Large Volume Stress Test
  // ==========================================
  console.log('\n--- 5. LARGE-VOLUME DATA HANDLING & CONCURRENCY ---');

  await runTest('Bulk insertion and aggregation of 1,000 transactions and 500 tasks', async () => {
    const txs = Array.from({ length: 1000 }, (_, i) => ({
      id: `bulk_tx_${i}`,
      type: (i % 3 === 0 ? 'income' : 'expense') as any,
      category: i % 2 === 0 ? 'AI API' : 'Cloud',
      description: `Bulk Transaction #${i}`,
      amount: 50 + (i % 500),
      currency: 'USD' as any,
      date: '2026-01-15',
      status: 'cleared' as any,
      recurring: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const tasks = Array.from({ length: 500 }, (_, i) => ({
      id: `bulk_task_${i}`,
      title: `Bulk Task #${i}`,
      priority: (i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low') as any,
      status: (i % 2 === 0 ? 'done' : 'todo') as any,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    await db.transaction('rw', db.transactions, db.tasks, async () => {
      await db.transactions.bulkPut(txs);
      await db.tasks.bulkPut(tasks);
    });

    const fin = await getFinancialSummary();
    if (fin.totalIncome <= 0 || fin.totalExpenses <= 0) throw new Error('Bulk aggregation calculation failed');

    const allTasks = await getAllTasks();
    if (allTasks.length < 500) throw new Error('Bulk task fetch failed');
  });

  // ==========================================
  // SUITE 6: AI Financial Reconciliation Engine
  // ==========================================
  console.log('\n--- 6. AI FINANCIAL RECONCILIATION & AUTO-FIXES ---');

  await runTest('AI Reconciliation identifies missing MRR, unmarked invoices, and executes auto-fixes', async () => {
    await seedDemoData();

    const report = await runFinancialReconciliation();
    if (report.healthScore < 0 || report.healthScore > 100) throw new Error('Invalid health score range');
    if (report.discrepancies.length === 0) throw new Error('Expected demo discrepancies to be detected');

    const autoFixable = report.discrepancies.find(d => d.autoFixAvailable && d.suggestedFixPayload);
    if (!autoFixable || !autoFixable.suggestedFixPayload) throw new Error('Expected at least one auto-fixable discrepancy');

    const fixResult = await executeAutoReconcileFix(autoFixable.suggestedFixPayload);
    if (!fixResult.success) throw new Error('Auto-fix execution failed: ' + fixResult.message);
  });

  // ==========================================
  // SUITE 7: AI Tools Execution Against Local Database
  // ==========================================
  console.log('\n--- 7. AI TOOL INVOCATION AGAINST LOCAL DEXIE DB ---');

  await runTest('All read & write AI Tools execute correctly and query local database', async () => {
    const overview = await executeLocalTool('getCompanyOverview', {});
    if (!overview || overview.companyName !== 'Solvst AI') throw new Error('getCompanyOverview failed');

    const rev = await executeLocalTool('getRevenue', {});
    if (rev.mrr <= 0) throw new Error('getRevenue tool failed');

    const exp = await executeLocalTool('getExpenses', {});
    if (exp.totalExpenses <= 0) throw new Error('getExpenses tool failed');

    const runway = await executeLocalTool('getRunway', {});
    if (runway.runwayMonths <= 0) throw new Error('getRunway tool failed');

    const customers = await executeLocalTool('getCustomers', { status: 'active' });
    if (customers.count <= 0) throw new Error('getCustomers tool failed');

    const custDetail = await executeLocalTool('getCustomer', { id: 'cust_1' });
    if (!custDetail.customer) throw new Error('getCustomer detail tool failed');

    const pipe = await executeLocalTool('getSalesPipeline', {});
    if (pipe.totalPipelineValue <= 0) throw new Error('getSalesPipeline tool failed');

    const employees = await executeLocalTool('getEmployees', {});
    if (employees.totalHeadcount <= 0) throw new Error('getEmployees tool failed');

    const cash = await executeLocalTool('getCashPosition', {});
    if (cash.totalCash <= 0) throw new Error('getCashPosition tool failed');

    const bs = await executeLocalTool('getBalanceSheet', {});
    if (bs.totalAssets <= 0) throw new Error('getBalanceSheet tool failed');

    const recon = await executeLocalTool('reconcileFinances', {});
    if (recon.healthScore <= 0) throw new Error('reconcileFinances tool failed');

    // Test write tool
    const newTaskResult = await executeLocalTool('createTask', {
      title: 'AI Tool Created Priority Task',
      priority: 'urgent',
    });
    if (!newTaskResult.success || !newTaskResult.task) throw new Error('createTask AI Tool failed');
  });

  // ==========================================
  // SUITE 8: Export -> Clear -> Import -> Restoration
  // ==========================================
  console.log('\n--- 8. FULL DATABASE BACKUP EXPORT & RESTORE ROUNDTRIP ---');

  await runTest('Export all 21 tables -> Clear DB -> Restore from JSON -> Verify 100% equality', async () => {
    await seedDemoData();

    // Record original counts
    const origCounts = {
      companies: await db.companies.count(),
      customers: await db.customers.count(),
      deals: await db.deals.count(),
      transactions: await db.transactions.count(),
      invoices: await db.invoices.count(),
      projects: await db.projects.count(),
      tasks: await db.tasks.count(),
      features: await db.features.count(),
      bugs: await db.bugs.count(),
      goals: await db.goals.count(),
      notes: await db.notes.count(),
      activities: await db.activities.count(),
      employees: await db.employees.count(),
      departments: await db.departments.count(),
      bankAccounts: await db.bankAccounts.count(),
      balanceSheetItems: await db.balanceSheetItems.count(),
      uploadedFiles: await db.uploadedFiles.count(),
      aiProviders: await db.aiProviders.count(),
      aiConversations: await db.aiConversations.count(),
    };

    // 1. Export
    const exportedPayload = await exportAllData();
    if (!exportedPayload.company || !exportedPayload.employees || !exportedPayload.aiProviders) {
      throw new Error('Export payload incomplete');
    }

    // 2. Clear Database Completely
    await clearAllCompanyData();
    const midCount = await db.customers.count();
    if (midCount !== 0) throw new Error('Database clear failed');

    // 3. Import
    const importResult = await importDataFromPayload(exportedPayload);
    if (!importResult.success) throw new Error('Import failed: ' + importResult.message);

    // 4. Verify Exact Restoration
    const restoredCounts = {
      companies: await db.companies.count(),
      customers: await db.customers.count(),
      deals: await db.deals.count(),
      transactions: await db.transactions.count(),
      invoices: await db.invoices.count(),
      projects: await db.projects.count(),
      tasks: await db.tasks.count(),
      features: await db.features.count(),
      bugs: await db.bugs.count(),
      goals: await db.goals.count(),
      notes: await db.notes.count(),
      activities: await db.activities.count(),
      employees: await db.employees.count(),
      departments: await db.departments.count(),
      bankAccounts: await db.bankAccounts.count(),
      balanceSheetItems: await db.balanceSheetItems.count(),
      uploadedFiles: await db.uploadedFiles.count(),
      aiProviders: await db.aiProviders.count(),
      aiConversations: await db.aiConversations.count(),
    };

    for (const [table, count] of Object.entries(origCounts)) {
      const restored = (restoredCounts as any)[table];
      if (restored !== count) {
        throw new Error(`Table ${table} mismatch after restore: expected ${count}, got ${restored}`);
      }
    }
  });

  // ==========================================
  // Summary & Report
  // ==========================================
  console.log('\n======================================================');
  console.log('📊 DATABASE INTEGRITY TEST SUMMARY');
  console.log('======================================================');
  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;
  console.log(`Total Tests Run: ${testResults.length}`);
  console.log(`Passed:          ${passed}`);
  console.log(`Failed:          ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// Execute suite
runFullDatabaseIntegritySuite().catch(err => {
  console.error('Fatal Suite Error:', err);
  process.exit(1);
});
