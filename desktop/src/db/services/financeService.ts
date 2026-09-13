import { db } from '../db';
import type { Transaction, Invoice } from '../../types';
import { logActivity } from './activityService';
import { realtimeSync } from '../../services/realtimeSyncService';

export async function getAllTransactions(): Promise<Transaction[]> {
  const list = await db.transactions.toArray();
  return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
  const now = new Date().toISOString();
  const tx: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await db.transactions.put(tx);
  await logActivity(
    'created_transaction',
    'transaction',
    `Recorded ${tx.type === 'income' ? 'Income' : 'Expense'} of $${tx.amount.toLocaleString()} (${tx.category})`,
    tx.id
  );
  realtimeSync.broadcast('transactions', 'create', tx);
  return tx;
}

export async function deleteTransaction(id: string): Promise<void> {
  const existing = await db.transactions.get(id);
  if (existing) {
    await db.transactions.delete(id);
    await logActivity('deleted_transaction', 'transaction', `Deleted transaction of $${existing.amount}`, id);
    realtimeSync.broadcast('transactions', 'delete', existing);
  }
}

export async function getAllInvoices(): Promise<Invoice[]> {
  const list = await db.invoices.toArray();
  return list.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
}

export async function createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
  const now = new Date().toISOString();
  const inv: Invoice = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await db.invoices.put(inv);
  await logActivity('created_invoice', 'invoice', `Created invoice ${inv.invoiceNumber} for $${inv.amount.toLocaleString()}`, inv.id);
  realtimeSync.broadcast('invoices', 'create', inv);
  return inv;
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
  const existing = await db.invoices.get(id);
  if (!existing) throw new Error(`Invoice with ID ${id} not found`);

  const updated: Invoice = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await db.invoices.put(updated);
  await logActivity('updated_invoice', 'invoice', `Updated invoice ${updated.invoiceNumber} (${updated.status})`, id);
  realtimeSync.broadcast('invoices', 'update', updated);
  return updated;
}

export async function deleteInvoice(id: string): Promise<void> {
  const existing = await db.invoices.get(id);
  if (existing) {
    await db.invoices.delete(id);
    await logActivity('deleted_invoice', 'invoice', `Deleted invoice ${existing.invoiceNumber}`, id);
    realtimeSync.broadcast('invoices', 'delete', existing);
  }
}

// Aggregation calculations
export async function getFinancialSummary() {
  const [txs, customers, bankAccounts] = await Promise.all([
    db.transactions.toArray(),
    db.customers.toArray(),
    db.bankAccounts.toArray(),
  ]);

  let totalIncome = 0;
  let totalExpenses = 0;
  const expensesByCategory: Record<string, number> = {};

  for (const t of txs) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    }
  }

  // Monthly Recurring Revenue from active customers
  const mrr = customers
    .filter((c) => c.status === 'active')
    .reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0);

  const arr = mrr * 12;
  const netProfit = totalIncome - totalExpenses;

  // Real cash calculation: Use live bank account balances if present, otherwise calculate net cash
  const totalBankBalance = bankAccounts.reduce((sum, b) => sum + (b.balance || 0), 0);
  const hasData = txs.length > 0 || mrr > 0 || bankAccounts.length > 0;
  const estimatedCash = bankAccounts.length > 0
    ? totalBankBalance
    : (hasData ? Math.max(0, 150000 + netProfit) : 0);
  const monthlyBurn = totalExpenses;

  // Runway calculation:
  // If no expenses/burn or no data, runway is 0. If burn > 0 and cash > 0, runway = cash / burn
  let runwayMonths = 0;
  if (hasData && monthlyBurn > 0 && estimatedCash > 0) {
    runwayMonths = Math.round((estimatedCash / monthlyBurn) * 10) / 10;
  } else if (hasData && monthlyBurn === 0 && estimatedCash > 0 && (totalIncome > 0 || mrr > 0)) {
    runwayMonths = 99; // Profitable / Zero burn
  }

  return {
    totalIncome,
    totalExpenses,
    netProfit,
    mrr,
    arr,
    runwayMonths,
    estimatedCash,
    expensesByCategory,
  };
}

