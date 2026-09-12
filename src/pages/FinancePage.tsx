import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Plus,
  Trash2,
  Receipt,
  FileText,
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { db } from '../db';
import { SpotlightCard } from '../components/common/SpotlightCard';
import { MetricCard } from '../components/common/MetricCard';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import {
  createTransaction,
  deleteTransaction,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from '../db/services/financeService';
import { runFinancialReconciliation, executeAutoReconcileFix } from '../ai/reconciliation';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import type { TransactionCategory, TransactionType, InvoiceStatus, ReconciliationSummary, ReconciliationDiscrepancy } from '../types';

export const FinancePage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'transactions' | 'invoices' | 'reconciliation'>('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // AI Reconciliation State
  const [reconciliationReport, setReconciliationReport] = useState<ReconciliationSummary | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [fixSuccessMsg, setFixSuccessMsg] = useState<string>('');

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);

  // New Transaction Form State
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txCategory, setTxCategory] = useState<string>('AI API');
  const [txDescription, setTxDescription] = useState('');
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txVendor, setTxVendor] = useState('');
  const [txRecurring, setTxRecurring] = useState(false);

  // New Invoice Form State
  const [invCustomerId, setInvCustomerId] = useState('');
  const [invNumber, setInvNumber] = useState(`INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [invAmount, setInvAmount] = useState<number>(0);
  const [invDueDate, setInvDueDate] = useState('');
  const [invDescription, setInvDescription] = useState('');

  // Live Queries
  const company = useLiveQuery(async () => (await db.companies.toArray())[0], []);
  const customers = useLiveQuery(async () => await db.customers.toArray(), []) || [];
  const transactions = useLiveQuery(async () => {
    const list = await db.transactions.toArray();
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []) || [];
  const invoices = useLiveQuery(async () => {
    const list = await db.invoices.toArray();
    return list.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, []) || [];

  const currency = company?.currency || 'USD';

  // Metrics
  const activeCusts = customers.filter((c) => c.status === 'active');
  const mrr = activeCusts.reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0);
  const arr = mrr * 12;

  let totalIncome = 0;
  let totalExpenses = 0;
  const categorySpend: Record<string, number> = {};

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
      categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount;
    }
  }

  const netProfit = totalIncome - totalExpenses;
  const hasData = transactions.length > 0 || mrr > 0;
  const estimatedCash = hasData ? Math.max(0, 150000 + netProfit) : 0;
  const monthlyBurn = totalExpenses;
  let runwayMonths = 0;
  if (hasData && monthlyBurn > 0 && estimatedCash > 0) {
    runwayMonths = Math.round((estimatedCash / monthlyBurn) * 10) / 10;
  } else if (hasData && monthlyBurn === 0 && estimatedCash > 0) {
    runwayMonths = 99;
  }

  // Handle running reconciliation audit
  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const report = await runFinancialReconciliation();
      setReconciliationReport(report);
    } catch (err) {
      console.error('Reconciliation error:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleExecuteFix = async (discrepancy: ReconciliationDiscrepancy) => {
    const res = await executeAutoReconcileFix(discrepancy);
    if (res.success) {
      setFixSuccessMsg(res.message);
      setTimeout(() => setFixSuccessMsg(''), 4000);
      const updated = await runFinancialReconciliation();
      setReconciliationReport(updated);
    }
  };

  useEffect(() => {
    if (activeTab === 'reconciliation' && !reconciliationReport) {
      handleRunAudit();
    }
  }, [activeTab]);

  const categories: TransactionCategory[] = [
    'AI API',
    'Cloud',
    'Software',
    'Marketing',
    'Hardware',
    'Legal',
    'Accounting',
    'Travel',
    'Office',
    'Salary',
    'Subscription',
    'Contractor',
    'Other',
  ];

  // Filtered Transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesCat = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesType && matchesCat;
  });

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDescription || txAmount <= 0) return;

    await createTransaction({
      type: txType,
      category: txCategory,
      description: txDescription,
      amount: Number(txAmount),
      currency,
      date: new Date().toISOString().split('T')[0],
      vendor: txVendor || undefined,
      recurring: txRecurring,
      status: 'cleared',
    });

    showToast('success', 'Transaction Recorded', `${txType === 'income' ? 'Income' : 'Expense'} of ${formatCurrency(Number(txAmount), currency)} logged.`);
    setIsTxModalOpen(false);
    setTxDescription('');
    setTxAmount(0);
    setTxVendor('');
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invCustomerId || invAmount <= 0) return;

    const cust = customers.find((c) => c.id === invCustomerId);

    await createInvoice({
      customerId: invCustomerId,
      customerName: cust?.companyName || 'Client',
      invoiceNumber: invNumber,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: invDueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      amount: Number(invAmount),
      currency,
      status: 'sent',
      description: invDescription,
    });

    showToast('success', 'Invoice Issued', `Invoice #${invNumber} generated for ${cust?.companyName || 'Client'}.`);
    setIsInvModalOpen(false);
    setInvAmount(0);
    setInvDescription('');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.035em' }}>
            Financial Health & Runway Ledger
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Track recurring revenues, operational burn rates, cash flow, and client invoices.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsTxModalOpen(true)}
            className="btn-primary"
            style={{ borderRadius: '50px', padding: '9px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> Record Transaction
          </button>
          <button
            type="button"
            onClick={() => setIsInvModalOpen(true)}
            className="btn-secondary"
            style={{ borderRadius: '50px', padding: '9px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Receipt size={15} /> Create Invoice
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(mrr, currency)}
          subtitle={`Annual Run Rate: ${formatCurrency(arr, currency)}`}
          change={`${activeCusts.length} clients`}
          changeType="positive"
          icon={<DollarSign size={18} />}
        />

        <MetricCard
          title="Monthly Outflows (Burn)"
          value={formatCurrency(totalExpenses, currency)}
          subtitle="Cloud, AI tokens, tools"
          changeType="negative"
          icon={<CreditCard size={18} />}
        />

        <MetricCard
          title="Cash Runway"
          value={`${runwayMonths} Months`}
          subtitle={`Cash: ${formatCurrency(estimatedCash, currency)}`}
          change={runwayMonths > 12 ? 'Healthy' : 'Monitor'}
          changeType={runwayMonths > 12 ? 'positive' : 'negative'}
          icon={<TrendingUp size={18} />}
        />

        <MetricCard
          title="Net Cash Generated"
          value={formatCurrency(netProfit, currency)}
          subtitle={`Total Income: ${formatCurrency(totalIncome, currency)}`}
          changeType={netProfit >= 0 ? 'positive' : 'negative'}
          icon={<Receipt size={18} />}
        />
      </div>

      {/* Category Spend Distribution */}
      {Object.keys(categorySpend).length > 0 && (
        <SpotlightCard style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-dim)', marginBottom: '14px' }}>
            Operational Spend by Category
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            {Object.entries(categorySpend).map(([cat, amt]) => {
              const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
              return (
                <div
                  key={cat}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-faint)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>{cat}</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                    {formatCurrency(amt, currency)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--brand-accent)', marginTop: '2px' }}>
                    {pct}% of total burn
                  </div>
                </div>
              );
            })}
          </div>
        </SpotlightCard>
      )}

      {/* Tabs & Table */}
      <SpotlightCard style={{ padding: '20px 24px' }}>
        {/* Tab Headers */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-faint)',
            paddingBottom: '14px',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: activeTab === 'transactions' ? 'var(--brand-accent)' : 'transparent',
                color: activeTab === 'transactions' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                border: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Transactions Ledger ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: activeTab === 'invoices' ? 'var(--brand-accent)' : 'transparent',
                color: activeTab === 'invoices' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                border: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Client Invoices ({invoices.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('reconciliation');
                if (!reconciliationReport) {
                  handleRunAudit();
                }
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: activeTab === 'reconciliation' ? 'var(--brand-accent)' : 'transparent',
                color: activeTab === 'reconciliation' ? '#ffffff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                border: 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={14} /> AI Reconciliation & Audit
            </button>
          </div>

          {/* Search & Filter Bar */}
          {activeTab === 'transactions' && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ledger..."
                  className="input-field"
                  style={{ paddingLeft: '32px', width: '180px', padding: '6px 10px 6px 32px', fontSize: '12.5px' }}
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-field"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
              >
                <option value="all">All Types</option>
                <option value="income">Income Only</option>
                <option value="expense">Expense Only</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input-field"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Transactions Table */}
        {activeTab === 'transactions' && (
          filteredTransactions.length === 0 ? (
            <EmptyState
              icon={<Receipt size={24} />}
              title="No transactions recorded"
              description="Record your subscription income, AI API costs, and cloud hosting expenses to track runway."
              actionText="Record First Transaction"
              onAction={() => setIsTxModalOpen(true)}
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Vendor / Client</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t) => (
                    <tr key={t.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{formatDate(t.date)}</td>
                      <td>
                        <Badge variant={t.type === 'income' ? 'green' : 'amber'}>
                          {t.type}
                        </Badge>
                      </td>
                      <td style={{ fontWeight: 500 }}>{t.category}</td>
                      <td style={{ color: 'var(--text-main)', fontWeight: 600 }}>{t.description}</td>
                      <td style={{ color: 'var(--text-dim)' }}>{t.vendor || '—'}</td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: t.type === 'income' ? '#34d399' : 'var(--text-main)',
                        }}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount, currency)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => deleteTransaction(t.id)}
                          style={{ color: 'var(--text-dim)', padding: '4px' }}
                          title="Delete transaction"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Tab 2: Invoices Table */}
        {activeTab === 'invoices' && (
          invoices.length === 0 ? (
            <EmptyState
              icon={<FileText size={24} />}
              title="No client invoices created"
              description="Create and track invoice payment states across your customer accounts."
              actionText="Create New Invoice"
              onAction={() => setIsInvModalOpen(true)}
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center' }}>Mark Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700, color: 'var(--brand-accent)', fontFamily: 'var(--font-mono)' }}>
                        {inv.invoiceNumber}
                      </td>
                      <td style={{ fontWeight: 600 }}>{inv.customerName || 'Client'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatDate(inv.issueDate)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{formatDate(inv.dueDate)}</td>
                      <td>
                        <Badge variant={getStatusBadgeVariant(inv.status)}>{inv.status}</Badge>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatCurrency(inv.amount, currency)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <select
                          value={inv.status}
                          onChange={(e) => updateInvoice(inv.id, { status: e.target.value as InvoiceStatus })}
                          className="input-field"
                          style={{ padding: '2px 8px', fontSize: '11.5px', width: 'auto' }}
                        >
                          <option value="draft">draft</option>
                          <option value="sent">sent</option>
                          <option value="paid">paid</option>
                          <option value="overdue">overdue</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => deleteInvoice(inv.id)}
                          style={{ color: 'var(--text-dim)', padding: '4px' }}
                          title="Delete invoice"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Tab 3: AI Reconciliation & Audit */}
        {activeTab === 'reconciliation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Action & Status Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 80, 255, 0.05)',
                border: '1px solid rgba(0, 80, 255, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(0, 80, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-accent)',
                  }}
                >
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    Autonomous Financial & Contract Reconciliation
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Audits bank transactions against client contracts, detects duplicate debits & missing MRR invoices.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunAudit}
                disabled={isAuditing}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <RefreshCw size={14} className={isAuditing ? 'animate-spin' : ''} />
                {isAuditing ? 'Auditing Ledger...' : 'Run Reconciliation Audit'}
              </button>
            </div>

            {/* Success Notification */}
            {fixSuccessMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={18} />
                {fixSuccessMsg}
              </div>
            )}

            {/* Report Summary Cards */}
            {reconciliationReport && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-faint)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>Ledger Audit Health</div>
                  <div
                    style={{
                      fontSize: '22px',
                      fontWeight: 800,
                      color: reconciliationReport.healthScore >= 90 ? '#34d399' : reconciliationReport.healthScore >= 70 ? '#fbbf24' : '#ef4444',
                      marginTop: '4px',
                    }}
                  >
                    {reconciliationReport.healthScore}%
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {reconciliationReport.matchedInvoicesCount} of {reconciliationReport.totalInvoicesCount} invoices reconciled
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-faint)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>Identified Discrepancies</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: reconciliationReport.discrepancies.length > 0 ? '#fbbf24' : '#34d399', marginTop: '4px' }}>
                    {reconciliationReport.discrepancies.length}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Requiring resolution
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-faint)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>Unreconciled Exposure</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                    {formatCurrency(reconciliationReport.unreconciledAmount, currency)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Variance across books
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-faint)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>Last Audit Timestamp</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px' }}>
                    {new Date(reconciliationReport.lastAuditedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Deterministic rule-engine
                  </div>
                </div>
              </div>
            )}

            {/* Discrepancies List */}
            {reconciliationReport && reconciliationReport.discrepancies.length === 0 ? (
              <div
                style={{
                  padding: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <CheckCircle2 size={36} color="#34d399" />
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#34d399', margin: 0 }}>
                  Financial Books Are 100% Reconciled
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '480px', margin: 0 }}>
                  All bank transactions match client invoices, recurring MRR contracts are up-to-date, and zero duplicate charges were detected.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Actionable Discrepancies & Automated Fixes
                </h4>

                {reconciliationReport?.discrepancies.map((d) => {
                  const badgeVariant = d.severity === 'high' ? 'red' : d.severity === 'medium' ? 'amber' : 'blue';

                  return (
                    <div
                      key={d.id}
                      style={{
                        padding: '16px 20px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-faint)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: '280px' }}>
                        <div style={{ marginTop: '2px' }}>
                          <AlertCircle
                            size={20}
                            color={d.severity === 'high' ? '#ef4444' : d.severity === 'medium' ? '#fbbf24' : '#60a5fa'}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                              {d.title}
                            </span>
                            <Badge variant={badgeVariant}>{d.severity.toUpperCase()}</Badge>
                            <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                              {d.type.replace('_', ' ')}
                            </span>
                          </div>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                            {d.description}
                          </p>
                          <div style={{ fontSize: '12px', color: 'var(--brand-accent)', marginTop: '4px', fontWeight: 500 }}>
                            Suggested: {d.suggestedAction}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {d.amount > 0 && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Variance</div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                              {formatCurrency(d.amount, currency)}
                            </div>
                          </div>
                        )}

                        {d.autoFixAvailable && (
                          <button
                            type="button"
                            onClick={() => handleExecuteFix(d)}
                            className="btn-primary"
                            style={{
                              padding: '8px 14px',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <Zap size={14} /> Auto-Fix Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI Recommendations */}
            {reconciliationReport && reconciliationReport.recommendations.length > 0 && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-faint)',
                }}
              >
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-accent)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} /> AI Accounting & Cash Optimization Insights
                </h4>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {reconciliationReport.recommendations.map((rec, idx) => (
                    <li key={idx} style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </SpotlightCard>

      {/* Record Transaction Modal */}
      <Modal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        title="Record Financial Transaction"
        subtitle="Log company cash inflows or operational expenses into local IndexedDB"
      >
        <form onSubmit={handleCreateTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Type
              </label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as TransactionType)}
                className="input-field"
              >
                <option value="expense">Expense (Outflow)</option>
                <option value="income">Income (Inflow)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="input-field"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. OpenRouter Inference Tokens, AWS Aurora Serverless"
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Amount ({currency}) *
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                value={txAmount || ''}
                onChange={(e) => setTxAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Vendor / Counterparty
              </label>
              <input
                type="text"
                placeholder="e.g. OpenRouter, Stripe, Amazon"
                value={txVendor}
                onChange={(e) => setTxVendor(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input
              type="checkbox"
              id="txRecurring"
              checked={txRecurring}
              onChange={(e) => setTxRecurring(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="txRecurring" style={{ fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer' }}>
              Recurring monthly expense/income
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsTxModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Transaction
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isInvModalOpen}
        onClose={() => setIsInvModalOpen(false)}
        title="Create Customer Invoice"
        subtitle="Issue an invoice for client licensing or services"
      >
        <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Customer Account *
            </label>
            <select
              required
              value={invCustomerId}
              onChange={(e) => setInvCustomerId(e.target.value)}
              className="input-field"
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.contactName})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Invoice Number *
              </label>
              <input
                type="text"
                required
                value={invNumber}
                onChange={(e) => setInvNumber(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Amount ({currency}) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={invAmount || ''}
                onChange={(e) => setInvAmount(parseFloat(e.target.value) || 0)}
                placeholder="2400"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Due Date
            </label>
            <input
              type="date"
              value={invDueDate}
              onChange={(e) => setInvDueDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Description / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Enterprise Tier Retainer (Q1)"
              value={invDescription}
              onChange={(e) => setInvDescription(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsInvModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Issue Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
