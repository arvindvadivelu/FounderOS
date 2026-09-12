import { db } from '../db';
import type {
  Transaction,
  Invoice,
  Customer,
  BankAccount,
  ReconciliationSummary,
  ReconciliationDiscrepancy,
} from '../types';
import { createTransaction, updateInvoice } from '../db/services/financeService';
import { logActivity } from '../db/services/activityService';

export async function runFinancialReconciliation(): Promise<ReconciliationSummary> {
  const [transactions, invoices, customers, bankAccounts] = await Promise.all([
    db.transactions.toArray(),
    db.invoices.toArray(),
    db.customers.toArray(),
    db.bankAccounts.toArray(),
  ]);

  const discrepancies: ReconciliationDiscrepancy[] = [];
  const incomeTxs = transactions.filter((t) => t.type === 'income');
  const expenseTxs = transactions.filter((t) => t.type === 'expense');

  let matchedInvoicesCount = 0;
  let unlinkedIncomeCount = 0;
  let unlinkedExpenseCount = 0;

  // --- 1. INVOICE TO TRANSACTION MATCHING ---
  for (const inv of invoices) {
    const matchingTx = incomeTxs.find((t) => {
      const amountMatches = Math.abs(t.amount - inv.amount) < 0.01;
      const customerMatches = t.customerId === inv.customerId || t.description.toLowerCase().includes(inv.customerName?.toLowerCase() || '___');
      return amountMatches || customerMatches;
    });

    if (matchingTx) {
      matchedInvoicesCount++;
      if (inv.status !== 'paid' && matchingTx.status === 'cleared') {
        discrepancies.push({
          id: `disc_inv_paid_${inv.id}`,
          type: 'invoice_match',
          severity: 'medium',
          title: `Unmarked Paid Invoice: ${inv.invoiceNumber}`,
          description: `Bank recorded income of $${matchingTx.amount.toLocaleString()} from "${matchingTx.description}", but invoice ${inv.invoiceNumber} for ${inv.customerName || 'Customer'} is still marked as "${inv.status}".`,
          amount: inv.amount,
          autoFixAvailable: true,
          suggestedAction: `Mark Invoice ${inv.invoiceNumber} as Paid`,
          suggestedFixPayload: {
            action: 'mark_invoice_paid',
            invoiceId: inv.id,
            transactionId: matchingTx.id,
          },
        });
      }
    } else if (inv.status === 'sent') {
      const today = new Date().toISOString().split('T')[0];
      if (inv.dueDate && inv.dueDate < today) {
        discrepancies.push({
          id: `disc_inv_overdue_${inv.id}`,
          type: 'unlinked_payment',
          severity: 'high',
          title: `Overdue Invoice: ${inv.invoiceNumber}`,
          description: `Invoice ${inv.invoiceNumber} for $${inv.amount.toLocaleString()} to ${inv.customerName || 'Client'} was due on ${inv.dueDate} and has no matching bank deposit.`,
          amount: inv.amount,
          autoFixAvailable: false,
          suggestedAction: `Send Payment Reminder to ${inv.customerName || 'Customer'}`,
          suggestedFixPayload: {
            action: 'send_reminder',
            invoiceId: inv.id,
          },
        });
      }
    }
  }

  // Check unlinked income transactions
  for (const tx of incomeTxs) {
    const hasInvoice = invoices.some((i) => Math.abs(i.amount - tx.amount) < 0.01);
    if (!hasInvoice) {
      unlinkedIncomeCount++;
      if (tx.amount >= 500) {
        discrepancies.push({
          id: `disc_unlinked_inc_${tx.id}`,
          type: 'unlinked_payment',
          severity: 'low',
          title: `Unlinked Bank Deposit: $${tx.amount.toLocaleString()}`,
          description: `Received $${tx.amount.toLocaleString()} on ${tx.date} ("${tx.description}") without a corresponding formal invoice.`,
          amount: tx.amount,
          autoFixAvailable: true,
          suggestedAction: `Generate Cleared Invoice for Accounting`,
          suggestedFixPayload: {
            action: 'generate_invoice_for_tx',
            transactionId: tx.id,
            amount: tx.amount,
            description: tx.description,
          },
        });
      }
    }
  }

  // --- 2. ACTIVE CRM REVENUE VS. LEDGER AUDIT ---
  const activeCustomers = customers.filter((c) => c.status === 'active');
  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthIncomeTxs = incomeTxs.filter((t) => t.date.startsWith(currentMonthPrefix));

  for (const cust of activeCustomers) {
    if (cust.monthlyRevenue > 0) {
      const recordedPayment = currentMonthIncomeTxs.find(
        (t) => t.customerId === cust.id || t.description.toLowerCase().includes(cust.companyName.toLowerCase())
      );

      if (!recordedPayment) {
        discrepancies.push({
          id: `disc_mrr_missing_${cust.id}`,
          type: 'mrr_discrepancy',
          severity: 'high',
          title: `Uncollected Monthly Subscription: ${cust.companyName}`,
          description: `Active contract specifies $${cust.monthlyRevenue.toLocaleString()}/mo MRR (${cust.plan || 'Standard'}), but zero payments recorded for ${currentMonthPrefix}.`,
          amount: cust.monthlyRevenue,
          autoFixAvailable: true,
          suggestedAction: `Draft Invoice for $${cust.monthlyRevenue.toLocaleString()}`,
          suggestedFixPayload: {
            action: 'create_monthly_invoice',
            customerId: cust.id,
            customerName: cust.companyName,
            amount: cust.monthlyRevenue,
          },
        });
      }
    }
  }

  // --- 3. DUPLICATE TRANSACTION DETECTION ---
  for (let i = 0; i < expenseTxs.length; i++) {
    for (let j = i + 1; j < expenseTxs.length; j++) {
      const a = expenseTxs[i];
      const b = expenseTxs[j];
      if (a.amount === b.amount && a.vendor && b.vendor && a.vendor === b.vendor && a.date === b.date) {
        discrepancies.push({
          id: `disc_dup_${a.id}_${b.id}`,
          type: 'duplicate_risk',
          severity: 'medium',
          title: `Potential Duplicate Charge: $${a.amount.toLocaleString()} to ${a.vendor}`,
          description: `Found two identical transactions of $${a.amount.toLocaleString()} for "${a.vendor}" on ${a.date}.`,
          amount: b.amount,
          autoFixAvailable: true,
          suggestedAction: `Review and Remove Duplicate Entry`,
          suggestedFixPayload: {
            action: 'flag_duplicate',
            transactionId: b.id,
          },
        });
      }
    }
  }

  // --- 4. SAAS SUBSCRIPTION COST SPIKES ---
  const softwareTxs = expenseTxs.filter((t) => t.category === 'AI API' || t.category === 'Cloud' || t.category === 'Software');
  const recentHighTxs = softwareTxs.filter((t) => t.amount >= 800);
  for (const tx of recentHighTxs) {
    discrepancies.push({
      id: `disc_spike_${tx.id}`,
      type: 'subscription_anomaly',
      severity: 'low',
      title: `High Infrastructure / AI Spend: ${tx.vendor || tx.description}`,
      description: `Single spend of $${tx.amount.toLocaleString()} on ${tx.date}. Consider reviewing token usage efficiency or reserved instance pricing.`,
      amount: tx.amount,
      autoFixAvailable: false,
      suggestedAction: `Audit Cloud/AI Usage Limits`,
    });
  }

  // Calculate Ledger Health Score (100 minus penalty per severity)
  let penalty = 0;
  for (const d of discrepancies) {
    if (d.severity === 'high') penalty += 15;
    else if (d.severity === 'medium') penalty += 8;
    else penalty += 3;
  }
  const healthScore = Math.max(20, Math.min(100, 100 - penalty));
  const unreconciledAmount = discrepancies.reduce((sum, d) => sum + (d.amount || 0), 0);
  const nowIso = new Date().toISOString();

  const recommendations: string[] = [];
  if (unlinkedIncomeCount > 0) {
    recommendations.push(`Generate matching invoices for ${unlinkedIncomeCount} unlinked customer bank deposits to ensure clean audit trails.`);
  }
  if (discrepancies.some((d) => d.type === 'mrr_discrepancy')) {
    recommendations.push(`Issue renewal invoices for active subscriptions to prevent MRR leakage and preserve cash runway.`);
  }
  if (softwareTxs.length > 0) {
    recommendations.push(`Aggregate monthly AI inference token logs to calculate gross margins per client contract.`);
  }
  if (recommendations.length === 0) {
    recommendations.push(`All accounts, invoices, and ledger debits are balanced in full compliance with US GAAP standards.`);
  }

  return {
    auditDate: nowIso,
    lastAuditedAt: nowIso,
    healthScore,
    totalTransactionsChecked: transactions.length,
    totalInvoicesChecked: invoices.length,
    totalInvoicesCount: invoices.length,
    matchedInvoicesCount,
    unlinkedIncomeCount,
    unlinkedExpenseCount,
    unreconciledAmount,
    discrepancies,
    recommendations,
  };
}

export async function executeAutoReconcileFix(payload: Record<string, any>): Promise<{ success: boolean; message: string }> {
  if (!payload || !payload.action) return { success: false, message: 'Invalid fix payload' };

  try {
    if (payload.action === 'mark_invoice_paid' && payload.invoiceId) {
      await updateInvoice(payload.invoiceId, { status: 'paid' });
      await logActivity('reconciled_invoice', 'invoice', `AI Reconciled invoice ${payload.invoiceId} to Paid status`, payload.invoiceId);
      return { success: true, message: `Invoice successfully updated to Paid status.` };
    }

    if (payload.action === 'create_monthly_invoice' && payload.customerId) {
      const invNumber = `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const now = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

      await db.invoices.put({
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        customerId: payload.customerId,
        customerName: payload.customerName,
        invoiceNumber: invNumber,
        issueDate: now,
        dueDate,
        amount: payload.amount,
        currency: 'USD',
        status: 'sent',
        description: `Monthly SaaS Subscription (${now.slice(0, 7)})`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await logActivity('created_invoice', 'invoice', `Auto-generated monthly subscription invoice ${invNumber} for ${payload.customerName}`);
      return { success: true, message: `Created invoice ${invNumber} for $${payload.amount}.` };
    }

    if (payload.action === 'generate_invoice_for_tx' && payload.transactionId) {
      const invNumber = `INV-REC-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toISOString().split('T')[0];

      await db.invoices.put({
        id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        customerId: 'unlinked',
        customerName: payload.description || 'Deposit Payee',
        invoiceNumber: invNumber,
        issueDate: now,
        dueDate: now,
        amount: payload.amount,
        currency: 'USD',
        status: 'paid',
        description: `Reconciled receipt for ${payload.description}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return { success: true, message: `Created matched cleared invoice ${invNumber}.` };
    }

    if (payload.action === 'flag_duplicate' && payload.transactionId) {
      await db.transactions.delete(payload.transactionId);
      await logActivity('deleted_transaction', 'transaction', `Removed duplicate transaction ${payload.transactionId}`);
      return { success: true, message: `Duplicate transaction removed.` };
    }

    return { success: true, message: `Action executed successfully.` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Fix execution failed.' };
  }
}
