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
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* =========================================================================
          1. EDITORIAL PAGE HEADER (DESIGN.md Typography & 50px Pill CTAs)
         ========================================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Tag Chip (10px radius) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '10px', // --radius-small: 10px
              backgroundColor: 'rgba(0, 80, 255, 0.12)',
              border: '1px solid rgba(0, 80, 255, 0.3)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              width: 'fit-content',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#0050FF',
                boxShadow: '0 0 8px #0050FF',
              }}
            />
            SOVEREIGN TREASURY • RUNWAY & INVOICE ENGINE
          </div>

          <h1
            style={{
              fontSize: 'clamp(24px, 3vw, 32px)',
              fontWeight: 700,
              color: '#f8fafc',
              letterSpacing: '-0.04em',
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Financial Health & Runway Ledger
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: '#94a3b8',
              margin: 0,
              maxWidth: '700px',
              lineHeight: 1.5,
            }}
          >
            Track recurring revenues, operational burn rates, cash flow, and client invoices with deterministic local-first IndexedDB reconciliation.
          </p>
        </div>

        {/* Action Buttons (50px Pill with embedded circular action dots) */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsTxModalOpen(true)}
            style={{
              backgroundColor: '#0050FF',
              color: '#ffffff',
              border: '1px solid #1a62ff',
              borderRadius: '50px', // --radius-buttons: 50px
              padding: '11px 22px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 0 16px rgba(0, 80, 255, 0.35)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a62ff';
              e.currentTarget.style.boxShadow = '0 0 24px rgba(0, 80, 255, 0.55)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0050FF';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(0, 80, 255, 0.35)';
            }}
          >
            <span>Record Transaction</span>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={12} strokeWidth={2.5} color="#ffffff" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsInvModalOpen(true)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '50px', // --radius-buttons: 50px
              padding: '11px 20px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
            }}
          >
            <span>Create Invoice</span>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                color: '#030712',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Receipt size={11} strokeWidth={2.5} />
            </div>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. FINANCIAL METRICS CARDS
         ========================================================================= */}
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

      {/* =========================================================================
          3. CATEGORY SPEND DISTRIBUTION (DESIGN.md 24px Card & 10px Chips)
         ========================================================================= */}
      {Object.keys(categorySpend).length > 0 && (
        <div
          style={{
            padding: '24px 28px',
            borderRadius: '24px', // --radius-cards: 24px
            backgroundColor: '#0b0f19',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#38bdf8',
                  boxShadow: '0 0 8px #38bdf8',
                }}
              />
              <h3
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#94a3b8',
                  margin: 0,
                }}
              >
                Operational Spend by Category
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {Object.keys(categorySpend).length} active budget streams
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            {Object.entries(categorySpend).map(([cat, amt]) => {
              const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
              return (
                <div
                  key={cat}
                  style={{
                    padding: '16px 18px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    transition: 'border-color 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>{cat}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px', // 10px tag chip
                        backgroundColor: 'rgba(0, 80, 255, 0.12)',
                        color: '#38bdf8',
                        border: '1px solid rgba(0, 80, 255, 0.25)',
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#f8fafc',
                      letterSpacing: '-0.03em',
                      marginTop: '8px',
                    }}
                  >
                    {formatCurrency(amt, currency)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                    of total burn
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          4. MAIN CARD: TABS, TABLES & RECONCILIATION (DESIGN.md 24px Card)
         ========================================================================= */}
      <div
        style={{
          padding: '24px 28px',
          borderRadius: '24px', // --radius-cards: 24px
          backgroundColor: '#0b0f19',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Tab Headers & Filter Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '18px',
            marginBottom: '22px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          {/* 50px Pill Navigation Switcher */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              style={{
                padding: '9px 18px',
                borderRadius: '50px', // --radius-buttons: 50px
                backgroundColor: activeTab === 'transactions' ? '#0050FF' : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === 'transactions' ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === 'transactions' ? 600 : 500,
                fontSize: '13.5px',
                border: activeTab === 'transactions' ? '1px solid #1a62ff' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: activeTab === 'transactions' ? '0 0 16px rgba(0, 80, 255, 0.4)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Receipt size={14} />
              <span>Transactions Ledger</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'transactions' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  color: activeTab === 'transactions' ? '#ffffff' : '#cbd5e1',
                }}
              >
                {transactions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              style={{
                padding: '9px 18px',
                borderRadius: '50px', // --radius-buttons: 50px
                backgroundColor: activeTab === 'invoices' ? '#0050FF' : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === 'invoices' ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === 'invoices' ? 600 : 500,
                fontSize: '13.5px',
                border: activeTab === 'invoices' ? '1px solid #1a62ff' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: activeTab === 'invoices' ? '0 0 16px rgba(0, 80, 255, 0.4)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FileText size={14} />
              <span>Client Invoices</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'invoices' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  color: activeTab === 'invoices' ? '#ffffff' : '#cbd5e1',
                }}
              >
                {invoices.length}
              </span>
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
                padding: '9px 18px',
                borderRadius: '50px', // --radius-buttons: 50px
                backgroundColor: activeTab === 'reconciliation' ? '#0050FF' : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === 'reconciliation' ? '#ffffff' : '#94a3b8',
                fontWeight: activeTab === 'reconciliation' ? 600 : 500,
                fontSize: '13.5px',
                border: activeTab === 'reconciliation' ? '1px solid #1a62ff' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: activeTab === 'reconciliation' ? '0 0 16px rgba(0, 80, 255, 0.4)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={14} />
              <span>AI Reconciliation & Audit</span>
            </button>
          </div>

          {/* Search & Filter Bar (50px Pill inputs) */}
          {activeTab === 'transactions' && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ledger..."
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '50px',
                    padding: '8px 14px 8px 34px',
                    fontSize: '13px',
                    color: '#f8fafc',
                    outline: 'none',
                    width: '180px',
                  }}
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  backgroundColor: '#0b0f19',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '50px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  color: '#f8fafc',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Types</option>
                <option value="income">Income Only</option>
                <option value="expense">Expense Only</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  backgroundColor: '#0b0f19',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '50px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  color: '#f8fafc',
                  outline: 'none',
                  cursor: 'pointer',
                }}
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

        {/* =====================================================================
            TAB 1: TRANSACTIONS TABLE
           ===================================================================== */}
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
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vendor / Client</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t) => (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>{formatDate(t.date)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '10px', // 10px tag chip
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: t.type === 'income' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: t.type === 'income' ? '#34d399' : '#fbbf24',
                            border: `1px solid ${t.type === 'income' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                          }}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 500, fontSize: '13.5px', color: '#cbd5e1' }}>{t.category}</td>
                      <td style={{ padding: '14px 16px', color: '#f8fafc', fontWeight: 600, fontSize: '14px' }}>{t.description}</td>
                      <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>{t.vendor || '—'}</td>
                      <td
                        style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: '14.5px',
                          letterSpacing: '-0.02em',
                          color: t.type === 'income' ? '#34d399' : '#f8fafc',
                        }}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount, currency)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => deleteTransaction(t.id)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            backgroundColor: 'transparent',
                            color: '#64748b',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#64748b';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          }}
                          title="Delete transaction"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* =====================================================================
            TAB 2: CLIENT INVOICES TABLE
           ===================================================================== */}
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
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice #</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue Date</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Date</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Mark Status</th>
                    <th style={{ padding: '12px 16px', fontSize: '11.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const statusColor =
                      inv.status === 'paid'
                        ? { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)', text: '#34d399' }
                        : inv.status === 'sent'
                        ? { bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)', text: '#38bdf8' }
                        : inv.status === 'overdue'
                        ? { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)', text: '#f87171' }
                        : { bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)', text: '#94a3b8' };

                    return (
                      <tr
                        key={inv.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace', fontSize: '13.5px' }}>
                          {inv.invoiceNumber}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, fontSize: '14px', color: '#f8fafc' }}>
                          {inv.customerName || 'Client'}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>{formatDate(inv.issueDate)}</td>
                        <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '13px' }}>{formatDate(inv.dueDate)}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '10px', // 10px tag chip
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: statusColor.bg,
                              color: statusColor.text,
                              border: `1px solid ${statusColor.border}`,
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em',
                            }}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontSize: '14.5px', color: '#f8fafc' }}>
                          {formatCurrency(inv.amount, currency)}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <select
                            value={inv.status}
                            onChange={(e) => updateInvoice(inv.id, { status: e.target.value as InvoiceStatus })}
                            style={{
                              backgroundColor: '#0b0f19',
                              color: '#f8fafc',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: '50px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            <option value="draft">draft</option>
                            <option value="sent">sent</option>
                            <option value="paid">paid</option>
                            <option value="overdue">overdue</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => deleteInvoice(inv.id)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              backgroundColor: 'transparent',
                              color: '#64748b',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                              e.currentTarget.style.color = '#ef4444';
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#64748b';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                            }}
                            title="Delete invoice"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* =====================================================================
            TAB 3: AI RECONCILIATION & AUDIT
           ===================================================================== */}
        {activeTab === 'reconciliation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Action & Status Banner (DESIGN.md Pill Action & Emblem) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(0, 80, 255, 0.12) 0%, rgba(56, 189, 248, 0.06) 100%)',
                border: '1px solid rgba(0, 80, 255, 0.25)',
                borderRadius: '20px',
                padding: '20px 24px',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 80, 255, 0.2)',
                    border: '1px solid rgba(0, 80, 255, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8',
                    boxShadow: '0 0 16px rgba(0, 80, 255, 0.3)',
                  }}
                >
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                    Autonomous Financial & Contract Reconciliation
                  </h4>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
                    Audits bank transactions against client contracts, detects duplicate debits & missing MRR invoices.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunAudit}
                disabled={isAuditing}
                style={{
                  backgroundColor: '#0050FF',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50px', // --radius-buttons: 50px
                  padding: '11px 22px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: isAuditing ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 16px rgba(0, 80, 255, 0.4)',
                  opacity: isAuditing ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isAuditing) e.currentTarget.style.backgroundColor = '#1a62ff';
                }}
                onMouseLeave={(e) => {
                  if (!isAuditing) e.currentTarget.style.backgroundColor = '#0050FF';
                }}
              >
                <RefreshCw size={14} className={isAuditing ? 'spin-icon' : ''} />
                <span>{isAuditing ? 'Auditing Ledger...' : 'Run Reconciliation Audit'}</span>
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
                  padding: '14px 18px',
                  borderRadius: '16px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={18} />
                <span>{fixSuccessMsg}</span>
              </div>
            )}

            {/* Report Summary Cards (DESIGN.md 16px Cards) */}
            {reconciliationReport && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ledger Audit Health</div>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 800,
                      color: reconciliationReport.healthScore >= 90 ? '#34d399' : reconciliationReport.healthScore >= 70 ? '#fbbf24' : '#ef4444',
                      letterSpacing: '-0.03em',
                      marginTop: '6px',
                    }}
                  >
                    {reconciliationReport.healthScore}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    {reconciliationReport.matchedInvoicesCount} of {reconciliationReport.totalInvoicesCount} invoices reconciled
                  </div>
                </div>

                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Identified Discrepancies</div>
                  <div
                    style={{
                      fontSize: '24px',
                      fontWeight: 800,
                      color: reconciliationReport.discrepancies.length > 0 ? '#fbbf24' : '#34d399',
                      letterSpacing: '-0.03em',
                      marginTop: '6px',
                    }}
                  >
                    {reconciliationReport.discrepancies.length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Requiring resolution
                  </div>
                </div>

                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unreconciled Exposure</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em', marginTop: '6px' }}>
                    {formatCurrency(reconciliationReport.unreconciledAmount, currency)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Variance across books
                  </div>
                </div>

                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Last Audit Timestamp</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginTop: '10px' }}>
                    {new Date(reconciliationReport.lastAuditedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Deterministic rule-engine
                  </div>
                </div>
              </div>
            )}

            {/* Discrepancies List */}
            {reconciliationReport && reconciliationReport.discrepancies.length === 0 ? (
              <div
                style={{
                  padding: '40px 24px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399',
                  }}
                >
                  <CheckCircle2 size={30} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#34d399', margin: 0 }}>
                  Financial Books Are 100% Reconciled
                </h4>
                <p style={{ fontSize: '13.5px', color: '#94a3b8', maxWidth: '480px', margin: 0, lineHeight: 1.5 }}>
                  All bank transactions match client invoices, recurring MRR contracts are up-to-date, and zero duplicate charges were detected.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                  Actionable Discrepancies & Automated Fixes
                </h4>

                {reconciliationReport?.discrepancies.map((d) => {
                  const severityStyle =
                    d.severity === 'high'
                      ? { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)' }
                      : d.severity === 'medium'
                      ? { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' }
                      : { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)' };

                  return (
                    <div
                      key={d.id}
                      style={{
                        padding: '18px 22px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
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
                            color={severityStyle.color}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#f8fafc' }}>
                              {d.title}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                backgroundColor: severityStyle.bg,
                                color: severityStyle.color,
                                border: `1px solid ${severityStyle.border}`,
                                textTransform: 'uppercase',
                              }}
                            >
                              {d.severity}
                            </span>
                            <span style={{ fontSize: '11.5px', color: '#64748b', textTransform: 'uppercase' }}>
                              {d.type.replace('_', ' ')}
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                            {d.description}
                          </p>
                          <div style={{ fontSize: '12.5px', color: '#38bdf8', marginTop: '4px', fontWeight: 500 }}>
                            Suggested: {d.suggestedAction}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                        {d.amount > 0 && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>Variance</div>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                              {formatCurrency(d.amount, currency)}
                            </div>
                          </div>
                        )}

                        {d.autoFixAvailable && (
                          <button
                            type="button"
                            onClick={() => handleExecuteFix(d)}
                            style={{
                              padding: '9px 18px',
                              borderRadius: '50px', // --radius-buttons: 50px
                              backgroundColor: '#0050FF',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              boxShadow: '0 0 14px rgba(0, 80, 255, 0.4)',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a62ff')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0050FF')}
                          >
                            <Zap size={14} />
                            <span>Auto-Fix Now</span>
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
                  padding: '20px 24px',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(0, 80, 255, 0.05)',
                  border: '1px solid rgba(0, 80, 255, 0.2)',
                }}
              >
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#38bdf8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} /> AI Accounting & Cash Optimization Insights
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {reconciliationReport.recommendations.map((rec, idx) => (
                    <li key={idx} style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          5. RECORD TRANSACTION MODAL (DESIGN.md 50px Inputs & Pill Buttons)
         ========================================================================= */}
      <Modal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        title="Record Financial Transaction"
        subtitle="Log company cash inflows or operational expenses into local IndexedDB"
      >
        <form onSubmit={handleCreateTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Type *
              </label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as TransactionType)}
                style={{
                  backgroundColor: '#030712',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '50px',
                  padding: '10px 16px',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  outline: 'none',
                  width: '100%',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <option value="expense">Expense (Outflow)</option>
                <option value="income">Income (Inflow)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Category *
              </label>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                style={{
                  backgroundColor: '#030712',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '50px',
                  padding: '10px 16px',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  outline: 'none',
                  width: '100%',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
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
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. OpenRouter Inference Tokens, AWS Aurora Serverless"
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
              style={{
                backgroundColor: '#030712',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '50px',
                padding: '10px 18px',
                color: '#f8fafc',
                fontSize: '13.5px',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
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
                style={{
                  backgroundColor: '#030712',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '50px',
                  padding: '10px 18px',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Vendor / Counterparty
              </label>
              <input
                type="text"
                placeholder="e.g. OpenRouter, Stripe, AWS"
                value={txVendor}
                onChange={(e) => setTxVendor(e.target.value)}
                style={{
                  backgroundColor: '#030712',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '50px',
                  padding: '10px 18px',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input
              type="checkbox"
              id="txRecurring"
              checked={txRecurring}
              onChange={(e) => setTxRecurring(e.target.checked)}
              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#0050FF' }}
            />
            <label htmlFor="txRecurring" style={{ fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
              Recurring monthly operational expense/income
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsTxModalOpen(false)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '50px',
                padding: '10px 22px',
                fontSize: '13.5px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                backgroundColor: '#0050FF',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50px',
                padding: '10px 26px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(0, 80, 255, 0.4)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a62ff')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0050FF')}
            >
              Save Transaction
            </button>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          6. CREATE INVOICE MODAL (DESIGN.md 50px Inputs & Pill Buttons)
         ========================================================================= */}
      <Modal
        isOpen={isInvModalOpen}
        onClose={() => setIsInvModalOpen(false)}
        title="Create Customer Invoice"
        subtitle="Issue an invoice for client licensing, services, or retainer"
      >
        <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Customer Account *
            </label>
            <select
              required
              value={invCustomerId}
              onChange={(e) => setInvCustomerId(e.target.value)}
              style={{
                backgroundColor: '#030712',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '50px',
                padding: '10px 16px',
                color: '#f8fafc',
                fontSize: '13.5px',
                outline: 'none',
                width: '100%',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.contactName})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Invoice Number *
              </label>
              <input
                type="text"
                required
                value={invNumber}
                onChange={(e) => setInvNumber(e.target.value)}
                style={{
                  backgroundColor: '#030712',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '50px',
                  padding: '10px 18px',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Amount ({currency}) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={invAmount || ''}
                onChange={(e) => setInvAmount(parseFloat(e.target.value) || 0)}
                placeholder="2400"
                style={{
                  backgroundColor: '#030712',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '50px',
                  padding: '10px 18px',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Due Date
            </label>
            <input
              type="date"
              value={invDueDate}
              onChange={(e) => setInvDueDate(e.target.value)}
              style={{
                backgroundColor: '#030712',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '50px',
                padding: '10px 18px',
                color: '#f8fafc',
                fontSize: '13.5px',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Description / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Enterprise Tier Retainer (Q1)"
              value={invDescription}
              onChange={(e) => setInvDescription(e.target.value)}
              style={{
                backgroundColor: '#030712',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '50px',
                padding: '10px 18px',
                color: '#f8fafc',
                fontSize: '13.5px',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsInvModalOpen(false)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '50px',
                padding: '10px 22px',
                fontSize: '13.5px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                backgroundColor: '#0050FF',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50px',
                padding: '10px 26px',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 0 16px rgba(0, 80, 255, 0.4)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a62ff')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0050FF')}
            >
              Issue Invoice
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-icon {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
