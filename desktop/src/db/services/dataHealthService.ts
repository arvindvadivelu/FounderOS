import { db } from '../db';
import { getSettings } from './companyService';
import type {
  DataHealthReport,
  DataHealthStatus,
  DataAnomaly,
  EntityRecordCount,
  StorageEstimateInfo,
} from '../../types';

export async function getDataHealthReport(): Promise<DataHealthReport> {
  const checkedAt = new Date().toISOString();
  const anomalies: DataAnomaly[] = [];

  // 1. Query all tables in parallel
  const [
    companies,
    customers,
    deals,
    transactions,
    invoices,
    projects,
    tasks,
    features,
    bugs,
    goals,
    notes,
    activities,
    employees,
    departments,
    bankAccounts,
    balanceSheetItems,
    uploadedFiles,
    aiProviders,
    aiConversations,
    aiMessages,
    settings,
  ] = await Promise.all([
    db.companies.toArray(),
    db.customers.toArray(),
    db.deals.toArray(),
    db.transactions.toArray(),
    db.invoices.toArray(),
    db.projects.toArray(),
    db.tasks.toArray(),
    db.features.toArray(),
    db.bugs.toArray(),
    db.goals.toArray(),
    db.notes.toArray(),
    db.activities.toArray(),
    db.employees.toArray(),
    db.departments.toArray(),
    db.bankAccounts.toArray(),
    db.balanceSheetItems.toArray(),
    db.uploadedFiles.toArray(),
    db.aiProviders.toArray(),
    db.aiConversations.toArray(),
    db.aiMessages.toArray(),
    getSettings(),
  ]);

  // 2. Entity Record Counts List
  const entityCounts: EntityRecordCount[] = [
    { entity: 'Company Profile', tableName: 'companies', count: companies.length, category: 'Core' },
    { entity: 'Customers', tableName: 'customers', count: customers.length, category: 'Business' },
    { entity: 'Deals', tableName: 'deals', count: deals.length, category: 'Business' },
    { entity: 'Transactions', tableName: 'transactions', count: transactions.length, category: 'Business' },
    { entity: 'Invoices', tableName: 'invoices', count: invoices.length, category: 'Business' },
    { entity: 'Projects', tableName: 'projects', count: projects.length, category: 'Product' },
    { entity: 'Tasks', tableName: 'tasks', count: tasks.length, category: 'Execution' },
    { entity: 'Features', tableName: 'features', count: features.length, category: 'Product' },
    { entity: 'Bugs', tableName: 'bugs', count: bugs.length, category: 'Product' },
    { entity: 'Goals', tableName: 'goals', count: goals.length, category: 'Execution' },
    { entity: 'Notes', tableName: 'notes', count: notes.length, category: 'Core' },
    { entity: 'Activity Log', tableName: 'activities', count: activities.length, category: 'Core' },
    { entity: 'Employees', tableName: 'employees', count: employees.length, category: 'Management' },
    { entity: 'Departments', tableName: 'departments', count: departments.length, category: 'Management' },
    { entity: 'Bank Accounts', tableName: 'bankAccounts', count: bankAccounts.length, category: 'Management' },
    { entity: 'Assets & Liabilities', tableName: 'balanceSheetItems', count: balanceSheetItems.length, category: 'Management' },
    { entity: 'Vault Files', tableName: 'uploadedFiles', count: uploadedFiles.length, category: 'Management' },
    { entity: 'AI Providers', tableName: 'aiProviders', count: aiProviders.length, category: 'AI & System' },
    { entity: 'AI Conversations', tableName: 'aiConversations', count: aiConversations.length, category: 'AI & System' },
    { entity: 'AI Messages', tableName: 'aiMessages', count: aiMessages.length, category: 'AI & System' },
  ];

  const totalRecords = entityCounts.reduce((sum, item) => sum + item.count, 0);

  // 3. ID Maps for Reference Checks
  const customerIdSet = new Set(customers.map((c) => c.id));
  const projectIdSet = new Set(projects.map((p) => p.id));
  const departmentIdSet = new Set(departments.map((d) => d.id));
  const conversationIdSet = new Set(aiConversations.map((c) => c.id));

  // --- Integrity Check A: Orphaned / Dangling Foreign References ---
  for (const deal of deals) {
    if (deal.customerId && !customerIdSet.has(deal.customerId)) {
      anomalies.push({
        id: `orphan_deal_${deal.id}`,
        type: 'orphan',
        entity: 'Deals',
        recordId: deal.id,
        title: `Orphan Customer on Deal "${deal.name}"`,
        description: `Deal references customer ID "${deal.customerId}", which does not exist in the database.`,
        severity: 'medium',
        autoFixable: true,
      });
    }
  }

  for (const inv of invoices) {
    if (inv.customerId && !customerIdSet.has(inv.customerId)) {
      anomalies.push({
        id: `orphan_inv_${inv.id}`,
        type: 'orphan',
        entity: 'Invoices',
        recordId: inv.id,
        title: `Orphan Customer on Invoice "${inv.invoiceNumber}"`,
        description: `Invoice references customer ID "${inv.customerId}", which does not exist in the database.`,
        severity: 'medium',
        autoFixable: true,
      });
    }
  }

  for (const task of tasks) {
    if (task.projectId && !projectIdSet.has(task.projectId)) {
      anomalies.push({
        id: `orphan_task_${task.id}`,
        type: 'orphan',
        entity: 'Tasks',
        recordId: task.id,
        title: `Orphan Project on Task "${task.title}"`,
        description: `Task references project ID "${task.projectId}", which does not exist in the database.`,
        severity: 'low',
        autoFixable: true,
      });
    }
  }

  for (const feat of features) {
    if (feat.projectId && !projectIdSet.has(feat.projectId)) {
      anomalies.push({
        id: `orphan_feat_${feat.id}`,
        type: 'orphan',
        entity: 'Features',
        recordId: feat.id,
        title: `Orphan Project on Feature "${feat.title}"`,
        description: `Feature references project ID "${feat.projectId}", which does not exist in the database.`,
        severity: 'low',
        autoFixable: true,
      });
    }
  }

  for (const bug of bugs) {
    if (bug.projectId && !projectIdSet.has(bug.projectId)) {
      anomalies.push({
        id: `orphan_bug_${bug.id}`,
        type: 'orphan',
        entity: 'Bugs',
        recordId: bug.id,
        title: `Orphan Project on Bug "${bug.title}"`,
        description: `Bug references project ID "${bug.projectId}", which does not exist in the database.`,
        severity: 'low',
        autoFixable: true,
      });
    }
  }

  for (const emp of employees) {
    if (emp.departmentId && !departmentIdSet.has(emp.departmentId)) {
      anomalies.push({
        id: `orphan_emp_dept_${emp.id}`,
        type: 'orphan',
        entity: 'Employees',
        recordId: emp.id,
        title: `Orphan Department on Employee "${emp.name}"`,
        description: `Employee references department ID "${emp.departmentId}", which does not exist in the database.`,
        severity: 'low',
        autoFixable: true,
      });
    }
  }

  for (const msg of aiMessages) {
    if (msg.conversationId && !conversationIdSet.has(msg.conversationId)) {
      anomalies.push({
        id: `orphan_msg_${msg.id}`,
        type: 'orphan',
        entity: 'AI Messages',
        recordId: msg.id,
        title: `Orphan Message in Chat History`,
        description: `Message references deleted conversation ID "${msg.conversationId}".`,
        severity: 'low',
        autoFixable: true,
      });
    }
  }

  // --- Integrity Check B: Duplicate Key Detections ---
  const seenCustomerEmails = new Set<string>();
  for (const cust of customers) {
    if (cust.email && cust.email.trim()) {
      const emailLower = cust.email.toLowerCase().trim();
      if (seenCustomerEmails.has(emailLower)) {
        anomalies.push({
          id: `dup_cust_email_${cust.id}`,
          type: 'duplicate',
          entity: 'Customers',
          recordId: cust.id,
          title: `Duplicate Customer Email: ${cust.email}`,
          description: `Multiple customer records share the same contact email address.`,
          severity: 'medium',
          autoFixable: false,
        });
      } else {
        seenCustomerEmails.add(emailLower);
      }
    }
  }

  const seenInvoiceNums = new Set<string>();
  for (const inv of invoices) {
    if (inv.invoiceNumber && inv.invoiceNumber.trim()) {
      if (seenInvoiceNums.has(inv.invoiceNumber.trim())) {
        anomalies.push({
          id: `dup_inv_num_${inv.id}`,
          type: 'duplicate',
          entity: 'Invoices',
          recordId: inv.id,
          title: `Duplicate Invoice Number: ${inv.invoiceNumber}`,
          description: `Multiple invoice entries share the identical invoice identifier.`,
          severity: 'high',
          autoFixable: false,
        });
      } else {
        seenInvoiceNums.add(inv.invoiceNumber.trim());
      }
    }
  }

  // --- Integrity Check C: Missing Required Attributes ---
  for (const cust of customers) {
    if (!cust.companyName || !cust.companyName.trim()) {
      anomalies.push({
        id: `missing_cust_name_${cust.id}`,
        type: 'missing_field',
        entity: 'Customers',
        recordId: cust.id,
        title: 'Customer Missing Company Name',
        description: `Customer record #${cust.id} is missing a valid company name string.`,
        severity: 'high',
        autoFixable: false,
      });
    }
  }

  for (const tx of transactions) {
    if (typeof tx.amount !== 'number' || isNaN(tx.amount) || !tx.date) {
      anomalies.push({
        id: `invalid_tx_${tx.id}`,
        type: 'invalid_state',
        entity: 'Transactions',
        recordId: tx.id,
        title: `Invalid Ledger Transaction "${tx.description || tx.id}"`,
        description: 'Transaction amount is NaN or missing a valid transaction date.',
        severity: 'high',
        autoFixable: false,
      });
    }
  }

  for (const task of tasks) {
    if (!task.title || !task.title.trim()) {
      anomalies.push({
        id: `missing_task_title_${task.id}`,
        type: 'missing_field',
        entity: 'Tasks',
        recordId: task.id,
        title: 'Task Missing Title',
        description: `Task record #${task.id} has no title specified.`,
        severity: 'medium',
        autoFixable: false,
      });
    }
  }

  // --- Integrity Check D: Invariant Warnings ---
  if (aiProviders.length > 0 && !aiProviders.some((p) => p.isDefault)) {
    anomalies.push({
      id: 'invariant_no_default_ai',
      type: 'invariant_warning',
      entity: 'AI Providers',
      title: 'No Default AI Provider Designated',
      description: 'You have AI providers configured, but none is flagged as the default active provider.',
      severity: 'medium',
      autoFixable: true,
    });
  }

  if (bankAccounts.length > 0 && !bankAccounts.some((b) => b.isPrimary)) {
    anomalies.push({
      id: 'invariant_no_primary_bank',
      type: 'invariant_warning',
      entity: 'Bank Accounts',
      title: 'No Primary Bank Account Designated',
      description: 'You have bank accounts connected, but none is flagged as the primary operating account.',
      severity: 'medium',
      autoFixable: true,
    });
  }

  if (companies.length === 0) {
    anomalies.push({
      id: 'missing_company_profile',
      type: 'invalid_state',
      entity: 'Company Profile',
      title: 'Company Profile Uninitialized',
      description: 'No company profile singleton exists in IndexedDB.',
      severity: 'high',
      autoFixable: true,
    });
  }

  // 4. Calculate Health Score and Status
  let healthScore = 100;
  for (const anom of anomalies) {
    if (anom.severity === 'high') healthScore -= 15;
    else if (anom.severity === 'medium') healthScore -= 6;
    else healthScore -= 2;
  }
  healthScore = Math.max(0, Math.min(100, healthScore));

  let status: DataHealthStatus = 'healthy';
  if (healthScore < 70 || anomalies.some((a) => a.severity === 'high')) {
    status = 'error';
  } else if (healthScore < 95 || anomalies.length > 0) {
    status = 'warning';
  }

  // 5. Browser Storage Estimate
  let storage: StorageEstimateInfo | null = null;
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const isPersisted = navigator.storage.persisted ? await navigator.storage.persisted() : true;
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 1;
      storage = {
        usageBytes: usage,
        quotaBytes: quota,
        usagePercent: Math.round((usage / quota) * 10000) / 100,
        persisted: isPersisted,
      };
    } catch {
      storage = null;
    }
  }

  return {
    status,
    healthScore,
    databaseName: 'FounderOS',
    schemaVersion: db.verno || 3,
    migrationStatus: `Up-to-date (Version ${db.verno || 3})`,
    totalRecords,
    entityCounts,
    storage,
    lastBackupAt: settings?.lastBackupAt,
    lastRestoreStatus: settings?.lastBackupAt ? `Restored/Backed up on ${new Date(settings.lastBackupAt).toLocaleDateString()}` : undefined,
    anomalies,
    checkedAt,
  };
}

export async function fixDataAnomaly(anomalyId: string): Promise<{ success: boolean; message: string }> {
  if (anomalyId.startsWith('orphan_deal_')) {
    const dealId = anomalyId.replace('orphan_deal_', '');
    const deal = await db.deals.get(dealId);
    if (deal) {
      await db.deals.update(dealId, {
        customerId: undefined,
        customerName: `${deal.customerName || 'Customer'} (Unlinked)`,
      });
      return { success: true, message: `Unlinked orphan customer reference from deal "${deal.name}".` };
    }
  }

  if (anomalyId.startsWith('orphan_inv_')) {
    const invId = anomalyId.replace('orphan_inv_', '');
    const inv = await db.invoices.get(invId);
    if (inv) {
      await db.invoices.update(invId, {
        customerId: 'unlinked',
        customerName: `${inv.customerName || 'Customer'} (Unlinked)`,
      });
      return { success: true, message: `Unlinked orphan customer reference from invoice "${inv.invoiceNumber}".` };
    }
  }

  if (anomalyId.startsWith('orphan_task_')) {
    const taskId = anomalyId.replace('orphan_task_', '');
    await db.tasks.update(taskId, { projectId: undefined, projectName: undefined });
    return { success: true, message: 'Moved orphan task to general unassigned backlog.' };
  }

  if (anomalyId.startsWith('orphan_feat_')) {
    const featId = anomalyId.replace('orphan_feat_', '');
    await db.features.update(featId, { projectId: undefined });
    return { success: true, message: 'Moved orphan feature to general backlog.' };
  }

  if (anomalyId.startsWith('orphan_bug_')) {
    const bugId = anomalyId.replace('orphan_bug_', '');
    await db.bugs.update(bugId, { projectId: undefined });
    return { success: true, message: 'Moved orphan bug to general engineering backlog.' };
  }

  if (anomalyId.startsWith('orphan_emp_dept_')) {
    const empId = anomalyId.replace('orphan_emp_dept_', '');
    await db.employees.update(empId, { departmentId: undefined, departmentName: undefined });
    return { success: true, message: 'Cleared orphan department assignment on employee.' };
  }

  if (anomalyId.startsWith('orphan_msg_')) {
    const msgId = anomalyId.replace('orphan_msg_', '');
    await db.aiMessages.delete(msgId);
    return { success: true, message: 'Cleaned up orphaned AI message.' };
  }

  if (anomalyId === 'invariant_no_default_ai') {
    const providers = await db.aiProviders.toArray();
    if (providers.length > 0) {
      await db.aiProviders.update(providers[0].id, { isDefault: true });
      return { success: true, message: `Designated "${providers[0].name}" as the default AI provider.` };
    }
  }

  if (anomalyId === 'invariant_no_primary_bank') {
    const accounts = await db.bankAccounts.toArray();
    if (accounts.length > 0) {
      await db.bankAccounts.update(accounts[0].id, { isPrimary: true });
      return { success: true, message: `Designated "${accounts[0].accountName}" as the primary bank account.` };
    }
  }

  if (anomalyId === 'missing_company_profile') {
    const now = new Date().toISOString();
    await db.companies.put({
      id: 'singleton',
      name: 'My Startup',
      currency: 'USD',
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, message: 'Initialized standard company profile singleton.' };
  }

  return { success: false, message: 'Anomaly requires manual review in the corresponding entity page.' };
}
