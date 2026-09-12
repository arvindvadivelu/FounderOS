import { db } from '../db';
import type { ExportDataPayload } from '../types';
import { getSettings } from '../db/services/companyService';

export async function exportAllData(): Promise<ExportDataPayload> {
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

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    company: companies[0] || null,
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
    aiProviders: aiProviders.map((p) => ({
      ...p,
      apiKey: '', // API keys are never included in exported JSON backup files for security
    })),
    aiConversations,
    aiMessages,
    settings,
  };
}

export function downloadJsonFile(data: object, filename: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importDataFromPayload(payload: any): Promise<{ success: boolean; message: string }> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Invalid backup file: Payload is not a valid JSON backup object.');
  }

  if (payload.version !== 1 && payload.version !== 2 && !payload.company && !payload.customers && !payload.transactions) {
    throw new Error('Unrecognized database schema version or invalid data payload structure.');
  }

  // Pre-fetch existing local AI provider keys so we preserve them during restore
  const existingProviders = await db.aiProviders.toArray();
  const existingKeyMap = new Map(existingProviders.map((p) => [p.id, p.apiKey]));

  await db.transaction('rw', db.tables, async () => {
    await db.companies.clear();
    await db.customers.clear();
    await db.deals.clear();
    await db.transactions.clear();
    await db.invoices.clear();
    await db.projects.clear();
    await db.tasks.clear();
    await db.features.clear();
    await db.bugs.clear();
    await db.goals.clear();
    await db.notes.clear();
    await db.activities.clear();
    await db.employees.clear();
    await db.departments.clear();
    await db.bankAccounts.clear();
    await db.balanceSheetItems.clear();
    await db.uploadedFiles.clear();
    await db.aiProviders.clear();
    await db.aiConversations.clear();
    await db.aiMessages.clear();

    if (payload.company) await db.companies.put(payload.company);
    if (Array.isArray(payload.customers)) await db.customers.bulkPut(payload.customers);
    if (Array.isArray(payload.deals)) await db.deals.bulkPut(payload.deals);
    if (Array.isArray(payload.transactions)) await db.transactions.bulkPut(payload.transactions);
    if (Array.isArray(payload.invoices)) await db.invoices.bulkPut(payload.invoices);
    if (Array.isArray(payload.projects)) await db.projects.bulkPut(payload.projects);
    if (Array.isArray(payload.tasks)) await db.tasks.bulkPut(payload.tasks);
    if (Array.isArray(payload.features)) await db.features.bulkPut(payload.features);
    if (Array.isArray(payload.bugs)) await db.bugs.bulkPut(payload.bugs);
    if (Array.isArray(payload.goals)) await db.goals.bulkPut(payload.goals);
    if (Array.isArray(payload.notes)) await db.notes.bulkPut(payload.notes);
    if (Array.isArray(payload.activities)) await db.activities.bulkPut(payload.activities);
    if (Array.isArray(payload.employees)) await db.employees.bulkPut(payload.employees);
    if (Array.isArray(payload.departments)) await db.departments.bulkPut(payload.departments);
    if (Array.isArray(payload.bankAccounts)) await db.bankAccounts.bulkPut(payload.bankAccounts);
    if (Array.isArray(payload.balanceSheetItems)) await db.balanceSheetItems.bulkPut(payload.balanceSheetItems);
    if (Array.isArray(payload.uploadedFiles)) await db.uploadedFiles.bulkPut(payload.uploadedFiles);

    if (Array.isArray(payload.aiProviders)) {
      const providersToPut = payload.aiProviders.map((p: any) => ({
        ...p,
        apiKey: p.apiKey || existingKeyMap.get(p.id) || '',
      }));
      await db.aiProviders.bulkPut(providersToPut);
    }
    if (Array.isArray(payload.aiConversations)) await db.aiConversations.bulkPut(payload.aiConversations);
    if (Array.isArray(payload.aiMessages)) await db.aiMessages.bulkPut(payload.aiMessages);

    if (payload.settings) {
      await db.settings.put({
        ...payload.settings,
        id: 'singleton',
        lastBackupAt: new Date().toISOString(),
      });
    }
  });

  return { success: true, message: 'Database successfully restored from backup.' };
}
