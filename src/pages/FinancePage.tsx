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
  ArrowUpRight,
  Filter,
  Calendar,
  Layers,
  PieChart,
} from 'lucide-react';
import { db } from '../db';
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
import type {
  TransactionCategory,
  TransactionType,
  InvoiceStatus,
  ReconciliationSummary,
  ReconciliationDiscrepancy,
} from '../types';

/* ------------------------------------------------------------------ */
/* MindMarket Paper-Cut Character Illustration (Dark Mode Palette)    */
/* ------------------------------------------------------------------ */
const MindMarketHeroIllustration: React.FC = () => (
  <svg
    width="220"
    height="170"
    viewBox="0 0 220 170"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
    aria-hidden="true"
  >
    {/* Floating Decorative Confetti / Paper Cutouts */}
    <circle cx="195" cy="22" r="11" fill="#f5e211" />
    <circle cx="16" cy="74" r="8" fill="#2ba0ff" />
    <rect x="24" y="24" width="16" height="16" rx="4" transform="rotate(15 24 24)" fill="#ff705d" />
    <rect x="182" y="110" width="18" height="18" rx="5" transform="rotate(-20 182 110)" fill="#8ed462" />

    {/* Character Shadow Base (Soft Dark Glow) */}
    <ellipse cx="110" cy="155" rx="58" ry="9" fill="rgba(255, 255, 255, 0.06)" />

    {/* Body / Torso (Sky Pop with dark outline) */}
    <path
      d="M78 88C78 68 142 68 142 88V146C142 152 136 156 130 156H90C84 156 78 152 78 146V88Z"
      fill="#2ba0ff"
      stroke="#0b0f19"
      strokeWidth="2.5"
    />

    {/* Big Round Paper-Cut Head (Warm Paper on Dark) */}
    <circle cx="110" cy="54" r="28" fill="#fdf8eb" stroke="#0b0f19" strokeWidth="2.5" />

    {/* Friendly Face Dots & Smile */}
    <circle cx="102" cy="52" r="3.2" fill="#0b0f19" />
    <circle cx="118" cy="52" r="3.2" fill="#0b0f19" />
    <path
      d="M104 62C107 66 113 66 116 62"
      stroke="#0b0f19"
      strokeWidth="2.2"
      strokeLinecap="round"
    />

    {/* Paper Cut Hair Accent (Fresh Grass) */}
    <path
      d="M89 44C92 30 128 30 131 44C124 38 96 38 89 44Z"
      fill="#8ed462"
      stroke="#0b0f19"
      strokeWidth="2"
    />

    {/* Big Round Coin / Ledger Shield (Sunshine Pop) */}
    <g transform="translate(112, 84)">
      <circle cx="28" cy="28" r="24" fill="#f5e211" stroke="#0b0f19" strokeWidth="2.5" />
      <text
        x="28"
        y="36"
        textAnchor="middle"
        fill="#0b0f19"
        fontSize="22"
        fontWeight="800"
        fontFamily="'Inter', sans-serif"
      >
        $
      </text>
    </g>

    {/* Hand holding the Coin (Fresh Grass glove) */}
    <circle cx="120" cy="112" r="8.5" fill="#8ed462" stroke="#0b0f19" strokeWidth="2.2" />

    {/* Left Arm Raised in Friendly Greeting */}
    <path
      d="M80 96C66 92 56 82 54 68"
      stroke="#0b0f19"
      strokeWidth="7"
      strokeLinecap="round"
    />
    <circle cx="53" cy="67" r="8" fill="#ff705d" stroke="#0b0f19" strokeWidth="2" />
  </svg>
);

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
  const [invNumber, setInvNumber] = useState(
    `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [invAmount, setInvAmount] = useState<number>(0);
  const [invDueDate, setInvDueDate] = useState('');
  const [invDescription, setInvDescription] = useState('');

  // Live Queries
  const company = useLiveQuery(async () => (await db.companies.toArray())[0], []);
  const customers = useLiveQuery(async () => await db.customers.toArray(), []) || [];
  const transactions =
    useLiveQuery(async () => {
      const list = await db.transactions.toArray();
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, []) || [];
  const invoices =
    useLiveQuery(async () => {
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

  const unpaidInvoices = invoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled');
  const totalUnpaidAmount = unpaidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);

  const categories: TransactionCategory[] = [
    'AI API',
    'Cloud',
    'Software',
    'Marketing',
    'Hardware',
    'Legal',
    'Accounting',
    'Office',
    'Salary',
    'Subscription',
    'Contractor',
    'Other',
  ];

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.vendor && t.vendor.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  // Automated Reconciliation Runner
  const handleRunAudit = async () => {
    setIsAuditing(true);
    setFixSuccessMsg('');
    try {
      const report = await runFinancialReconciliation();
      setReconciliationReport(report);
      showToast('info', 'Reconciliation Complete', `Financial audit health score: ${report.healthScore}%`);
    } catch (err) {
      console.error(err);
      showToast('error', 'Audit Failed', 'Unable to complete financial reconciliation.');
    } finally {
      setIsAuditing(false);
    }
  };

  // Automated Auto-Fix Handler
  const handleExecuteFix = async (discrepancy: ReconciliationDiscrepancy) => {
    try {
      const success = await executeAutoReconcileFix(discrepancy);
      if (success) {
        showToast('success', 'Discrepancy Resolved', `Successfully executed: ${discrepancy.suggestedAction}`);
        setFixSuccessMsg(`Resolved discrepancy: "${discrepancy.title}"`);
        const updatedReport = await runFinancialReconciliation();
        setReconciliationReport(updatedReport);
      } else {
        showToast('error', 'Fix Failed', 'Auto-fix action could not be executed.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Execution Error', 'An error occurred while auto-fixing.');
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDescription || txAmount <= 0) return;

    await createTransaction({
      date: new Date().toISOString().split('T')[0],
      type: txType,
      category: txCategory as TransactionCategory,
      amount: Number(txAmount),
      currency,
      description: txDescription,
      vendor: txVendor || undefined,
      recurring: txRecurring,
      status: 'cleared',
    });

    showToast('success', 'Transaction Saved', `${txType === 'income' ? 'Income' : 'Expense'} of ${formatCurrency(txAmount, currency)} recorded.`);
    setIsTxModalOpen(false);
    setTxDescription('');
    setTxAmount(0);
    setTxVendor('');
    setTxRecurring(false);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invCustomerId || invAmount <= 0) return;

    const cust = customers.find((c) => c.id === invCustomerId);

    await createInvoice({
      customerId: invCustomerId,
      customerName: cust?.companyName,
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

  const handleDeleteTransaction = async (id: string, desc: string) => {
    if (confirm(`Remove transaction "${desc}" from ledger?`)) {
      await deleteTransaction(id);
      showToast('info', 'Transaction Removed', 'Entry removed from ledger.');
    }
  };

  const handleDeleteInvoice = async (id: string, num: string) => {
    if (confirm(`Delete invoice "${num}"?`)) {
      await deleteInvoice(id);
      showToast('info', 'Invoice Deleted', `Invoice ${num} removed.`);
    }
  };

  return (
    <div
      className="mindmarket-finance-canvas animate-fade-in"
      style={{
        margin: '-24px',
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: '#0b0f19', // Deep Obsidian Dark Canvas
        color: '#f8fafc', // Crisp White
        fontFamily: "'Inter', sans-serif",
        padding: '36px 44px 60px',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
        boxSizing: 'border-box',
      }}
    >
      {/* Scoped CSS for MindMarket Dark Mode System */}
      <style>{`
        .mindmarket-finance-canvas * {
          box-sizing: border-box;
        }
        .mindmarket-card {
          background-color: #141b2b;
          border-radius: 50px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .mindmarket-pill-btn {
          border-radius: 50px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          border: none;
        }
        .mindmarket-pill-btn:hover {
          transform: translateY(-1px);
        }
        .mindmarket-pill-btn:active {
          transform: translateY(0);
        }
        .mindmarket-table th {
          background-color: #182236;
          color: #f8fafc;
          font-weight: 600;
          font-size: 13.5px;
          padding: 14px 20px;
          border: none;
        }
        .mindmarket-table td {
          padding: 16px 20px;
          font-size: 14px;
          color: #f8fafc;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .mindmarket-table tr:hover td {
          background-color: rgba(255, 255, 255, 0.03);
        }
        .mindmarket-input {
          width: 100%;
          background-color: #0b0f19;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          padding: 12px 18px;
          font-size: 14px;
          color: #f8fafc;
          outline: none;
          font-family: 'Inter', sans-serif;
          transition: border-color 0.15s ease;
        }
        .mindmarket-input:focus {
          border-color: #2ba0ff;
          background-color: #101626;
        }
        .mindmarket-select {
          background-color: #141b2b;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 50px;
          padding: 8px 16px;
          font-size: 13px;
          color: #f8fafc;
          outline: none;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
        }
        .mindmarket-select:focus {
          border-color: #2ba0ff;
        }
      `}</style>

      {/* ------------------------------------------------------------------ */}
      {/* 1. MindMarket Hero Display Section (Dark Mode)                      */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '24px',
          paddingBottom: '8px',
        }}
      >
        <div style={{ flex: '1 1 560px', maxWidth: '820px' }}>
          {/* Micro Brand Tag (10px radius) */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span
              style={{
                backgroundColor: '#8ed462', // Fresh Grass
                color: '#0b0f19',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                padding: '4px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              MINDMARKET EDITORIAL SYSTEM
            </span>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
              FounderOS Financial Engine
            </span>
          </div>

          {/* Enormous Inter Headline (53px Inter 500, tight tracking) */}
          <h1
            style={{
              fontSize: 'clamp(36px, 4.5vw, 53px)',
              fontWeight: 500,
              lineHeight: 1.08,
              letterSpacing: '-2.12px',
              color: '#f8fafc',
              margin: '0 0 16px 0',
            }}
          >
            Financial Health &amp; Runway Ledger
          </h1>

          {/* Editorial Subheadline (18px Inter 400) */}
          <p
            style={{
              fontSize: '18px',
              lineHeight: 1.5,
              color: '#94a3b8',
              margin: 0,
              maxWidth: '680px',
            }}
          >
            Track recurring revenues, operational burn rates, cash flow, and client invoices with calm,
            warm storybook editorial clarity.
          </p>

          {/* Action Button Strip */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '26px' }}>
            {/* Primary Action: Coral Pop Filled Pill Button */}
            <button
              type="button"
              onClick={() => setIsTxModalOpen(true)}
              className="mindmarket-pill-btn"
              style={{
                backgroundColor: '#ff705d', // Coral Pop
                color: '#ffffff',
                padding: '13px 26px',
                fontSize: '15px',
                boxShadow: '0 4px 16px rgba(255, 112, 93, 0.35)',
              }}
            >
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  color: '#ff705d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                }}
              >
                +
              </span>
              Record Transaction
            </button>

            {/* Secondary Action: Pill with Sky Pop dot */}
            <button
              type="button"
              onClick={() => setIsInvModalOpen(true)}
              className="mindmarket-pill-btn"
              style={{
                backgroundColor: '#141b2b',
                color: '#f8fafc',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                padding: '13px 26px',
                fontSize: '15px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#2ba0ff', // Sky Pop dot
                  display: 'inline-block',
                }}
              />
              Create Client Invoice
            </button>

            {/* Audit Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('reconciliation');
                if (!reconciliationReport) handleRunAudit();
              }}
              className="mindmarket-pill-btn"
              style={{
                backgroundColor: '#141b2b',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '13px 22px',
                fontSize: '15px',
              }}
            >
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: '#8ed462', // Fresh Grass
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0b0f19',
                }}
              >
                <Sparkles size={12} />
              </span>
              Audit Books
            </button>
          </div>
        </div>

        {/* Paper-cut Character Illustration Component */}
        <div style={{ alignSelf: 'center' }}>
          <MindMarketHeroIllustration />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Elevated Content Cards: Financial Metrics (Dark Mode, 50px)     */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Card 1: MRR */}
        <div className="mindmarket-card" style={{ padding: '26px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Monthly Recurring Revenue
            </span>
            <span
              style={{
                backgroundColor: '#8ed462', // Fresh Grass
                color: '#0b0f19',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '10px',
              }}
            >
              {activeCusts.length} clients
            </span>
          </div>
          <div
            style={{
              fontSize: '40px',
              fontWeight: 500,
              color: '#f8fafc',
              letterSpacing: '-1.8px',
              lineHeight: 1.1,
              marginTop: '12px',
            }}
          >
            {formatCurrency(mrr, currency)}
          </div>
          <div style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '8px' }}>
            Annual Run Rate: <strong style={{ color: '#f8fafc' }}>{formatCurrency(arr, currency)}</strong>
          </div>
        </div>

        {/* Card 2: Burn */}
        <div className="mindmarket-card" style={{ padding: '26px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Monthly Outflows (Burn)
            </span>
            <span
              style={{
                backgroundColor: '#ff705d', // Coral Pop
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '10px',
              }}
            >
              Outflow
            </span>
          </div>
          <div
            style={{
              fontSize: '40px',
              fontWeight: 500,
              color: '#f8fafc',
              letterSpacing: '-1.8px',
              lineHeight: 1.1,
              marginTop: '12px',
            }}
          >
            {formatCurrency(totalExpenses, currency)}
          </div>
          <div style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '8px' }}>
            Cloud hosting, AI token APIs &amp; operations
          </div>
        </div>

        {/* Card 3: Runway */}
        <div className="mindmarket-card" style={{ padding: '26px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Cash Runway
            </span>
            <span
              style={{
                backgroundColor: runwayMonths > 12 ? '#8ed462' : '#f5e211', // Fresh Grass or Sunshine Pop
                color: '#0b0f19',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '10px',
              }}
            >
              {runwayMonths > 12 ? 'Healthy' : runwayMonths > 0 ? 'Monitor' : 'No Data'}
            </span>
          </div>
          <div
            style={{
              fontSize: '40px',
              fontWeight: 500,
              color: '#f8fafc',
              letterSpacing: '-1.8px',
              lineHeight: 1.1,
              marginTop: '12px',
            }}
          >
            {runwayMonths} <span style={{ fontSize: '24px', fontWeight: 400, color: '#94a3b8' }}>Months</span>
          </div>
          <div style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '8px' }}>
            Liquid Reserves: <strong style={{ color: '#f8fafc' }}>{formatCurrency(estimatedCash, currency)}</strong>
          </div>
        </div>

        {/* Card 4: Net Generated */}
        <div className="mindmarket-card" style={{ padding: '26px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Net Cash Generated
            </span>
            <span
              style={{
                backgroundColor: netProfit >= 0 ? '#8ed462' : '#ff705d',
                color: netProfit >= 0 ? '#0b0f19' : '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '10px',
              }}
            >
              {netProfit >= 0 ? 'Surplus' : 'Deficit'}
            </span>
          </div>
          <div
            style={{
              fontSize: '40px',
              fontWeight: 500,
              color: netProfit >= 0 ? '#f8fafc' : '#ff705d',
              letterSpacing: '-1.8px',
              lineHeight: 1.1,
              marginTop: '12px',
            }}
          >
            {formatCurrency(netProfit, currency)}
          </div>
          <div style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '8px' }}>
            Total Inflow: <strong style={{ color: '#f8fafc' }}>{formatCurrency(totalIncome, currency)}</strong>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Operational Spend by Category (Dark Card with Insets)           */}
      {/* ------------------------------------------------------------------ */}
      {Object.keys(categorySpend).length > 0 && (
        <div className="mindmarket-card" style={{ padding: '32px 36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 500, color: '#f8fafc', margin: 0 }}>
                Operational Spend Breakdown
              </h3>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: '3px 0 0' }}>
                Distribution of monthly expenses by functional ledger category
              </p>
            </div>
            <span
              style={{
                fontSize: '12px',
                backgroundColor: '#0b0f19',
                color: '#f8fafc',
                padding: '4px 12px',
                borderRadius: '50px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                fontWeight: 600,
              }}
            >
              Total Burn: {formatCurrency(totalExpenses, currency)}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            {Object.entries(categorySpend).map(([cat, amt]) => {
              const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
              return (
                <div
                  key={cat}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '25.5px',
                    backgroundColor: '#0b0f19', // Dark Inset
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    {cat}
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 500, color: '#f8fafc', marginTop: '4px', letterSpacing: '-0.5px' }}>
                    {formatCurrency(amt, currency)}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                    <span
                      style={{
                        backgroundColor: '#8ed462', // Fresh Grass
                        color: '#0b0f19',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '10px',
                      }}
                    >
                      {pct}%
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>of outflows</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. Floating Pill Navigation Tabs & Filter Bar (Dark Mode)          */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Floating Pill Tab Bar (Dark Surface with 50px radius) */}
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: '#141b2b',
            borderRadius: '50px',
            border: '1.5px solid rgba(255, 255, 255, 0.15)',
            padding: '6px 8px',
            gap: '6px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className="mindmarket-pill-btn"
            style={{
              padding: '9px 20px',
              fontSize: '14px',
              backgroundColor: activeTab === 'transactions' ? '#ffffff' : 'transparent',
              color: activeTab === 'transactions' ? '#0b0f19' : '#94a3b8',
              fontWeight: activeTab === 'transactions' ? 600 : 500,
            }}
          >
            {activeTab === 'transactions' && (
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00c978' }} />
            )}
            Transactions Ledger ({transactions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className="mindmarket-pill-btn"
            style={{
              padding: '9px 20px',
              fontSize: '14px',
              backgroundColor: activeTab === 'invoices' ? '#ffffff' : 'transparent',
              color: activeTab === 'invoices' ? '#0b0f19' : '#94a3b8',
              fontWeight: activeTab === 'invoices' ? 600 : 500,
            }}
          >
            {activeTab === 'invoices' && (
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#2ba0ff' }} />
            )}
            Client Invoices ({invoices.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('reconciliation');
              if (!reconciliationReport) handleRunAudit();
            }}
            className="mindmarket-pill-btn"
            style={{
              padding: '9px 20px',
              fontSize: '14px',
              backgroundColor: activeTab === 'reconciliation' ? '#ffffff' : 'transparent',
              color: activeTab === 'reconciliation' ? '#0b0f19' : '#94a3b8',
              fontWeight: activeTab === 'reconciliation' ? 600 : 500,
            }}
          >
            {activeTab === 'reconciliation' && (
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#f5e211' }} />
            )}
            AI Reconciliation &amp; Audit
          </button>
        </div>

        {/* Search & Filter Bar for Transactions */}
        {activeTab === 'transactions' && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '14px', top: '11px', color: '#94a3b8' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ledger..."
                className="mindmarket-input"
                style={{
                  paddingLeft: '38px',
                  width: '210px',
                  borderRadius: '50px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  backgroundColor: '#141b2b',
                }}
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="mindmarket-select"
              style={{ backgroundColor: '#141b2b' }}
            >
              <option value="all">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expense Only</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="mindmarket-select"
              style={{ backgroundColor: '#141b2b' }}
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

      {/* ------------------------------------------------------------------ */}
      {/* 5. Main Content Panel (Dark 50px Card)                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="mindmarket-card" style={{ padding: '32px 36px' }}>
        {/* TAB 1: Transactions Table */}
        {activeTab === 'transactions' &&
          (filteredTransactions.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50px',
                  backgroundColor: '#0b0f19',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f8fafc',
                  marginBottom: '16px',
                }}
              >
                <Receipt size={28} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 500, color: '#f8fafc', margin: '0 0 8px 0' }}>
                No ledger transactions found
              </h3>
              <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '440px', margin: '0 auto 24px' }}>
                Record your subscription revenues, cloud hosting costs, or AI model token expenses to track live runway.
              </p>
              <button
                type="button"
                onClick={() => setIsTxModalOpen(true)}
                className="mindmarket-pill-btn"
                style={{
                  backgroundColor: '#ff705d',
                  color: '#ffffff',
                  padding: '12px 24px',
                  fontSize: '14px',
                }}
              >
                + Record First Transaction
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="mindmarket-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ borderTopLeftRadius: '20px', borderBottomLeftRadius: '20px' }}>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Vendor / Client</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center', borderTopRightRadius: '20px', borderBottomRightRadius: '20px' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t) => (
                    <tr key={t.id}>
                      <td style={{ color: '#94a3b8', fontWeight: 500 }}>{formatDate(t.date)}</td>
                      <td>
                        <span
                          style={{
                            backgroundColor: t.type === 'income' ? '#8ed462' : 'rgba(255, 112, 93, 0.2)',
                            color: t.type === 'income' ? '#0b0f19' : '#ff705d',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '10px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500, color: '#f8fafc' }}>{t.category}</td>
                      <td style={{ fontWeight: 600, color: '#f8fafc' }}>
                        {t.description}
                        {t.recurring && (
                          <span
                            style={{
                              marginLeft: '8px',
                              backgroundColor: '#2ba0ff',
                              color: '#ffffff',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '10px',
                            }}
                          >
                            RECURRING
                          </span>
                        )}
                      </td>
                      <td style={{ color: '#94a3b8' }}>{t.vendor || '—'}</td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: '15px',
                          color: t.type === 'income' ? '#8ed462' : '#f8fafc',
                        }}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount, currency)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteTransaction(t.id, t.description)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '50%',
                            transition: 'color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ff705d')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                          title="Delete transaction"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {/* TAB 2: Invoices Table */}
        {activeTab === 'invoices' &&
          (invoices.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50px',
                  backgroundColor: '#0b0f19',
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f8fafc',
                  marginBottom: '16px',
                }}
              >
                <FileText size={28} />
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 500, color: '#f8fafc', margin: '0 0 8px 0' }}>
                No client invoices recorded
              </h3>
              <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '440px', margin: '0 auto 24px' }}>
                Issue invoices to client customer accounts and track settlement statuses.
              </p>
              <button
                type="button"
                onClick={() => setIsInvModalOpen(true)}
                className="mindmarket-pill-btn"
                style={{
                  backgroundColor: '#2ba0ff',
                  color: '#ffffff',
                  padding: '12px 24px',
                  fontSize: '14px',
                }}
              >
                + Create First Invoice
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="mindmarket-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ borderTopLeftRadius: '20px', borderBottomLeftRadius: '20px' }}>Invoice #</th>
                    <th>Customer</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center' }}>Status Shift</th>
                    <th style={{ textAlign: 'center', borderTopRightRadius: '20px', borderBottomRightRadius: '20px' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const isPaid = inv.status === 'paid';
                    const isOverdue = inv.status === 'overdue';
                    const badgeBg = isPaid ? '#8ed462' : isOverdue ? '#ff705d' : 'rgba(255, 255, 255, 0.1)';
                    const badgeColor = isOverdue ? '#ffffff' : isPaid ? '#0b0f19' : '#f8fafc';

                    return (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 700, color: '#f8fafc' }}>{inv.invoiceNumber}</td>
                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>{inv.customerName || 'Client'}</td>
                        <td style={{ color: '#94a3b8' }}>{formatDate(inv.issueDate)}</td>
                        <td style={{ color: '#94a3b8' }}>{formatDate(inv.dueDate)}</td>
                        <td>
                          <span
                            style={{
                              backgroundColor: badgeBg,
                              color: badgeColor,
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: '10px',
                              textTransform: 'uppercase',
                            }}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '15px', color: '#f8fafc' }}>
                          {formatCurrency(inv.amount, currency)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <select
                            value={inv.status}
                            onChange={(e) =>
                              updateInvoice(inv.id, { status: e.target.value as InvoiceStatus })
                            }
                            className="mindmarket-select"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                          >
                            <option value="draft">Draft</option>
                            <option value="sent">Sent</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '50%',
                              transition: 'color 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ff705d')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                            title="Delete invoice"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}

        {/* TAB 3: AI Reconciliation & Audit */}
        {activeTab === 'reconciliation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            {/* Action & Status Card */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#0b0f19',
                border: '1.5px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '32px',
                padding: '24px 30px',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50px',
                    backgroundColor: '#8ed462', // Fresh Grass
                    border: '1.5px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0b0f19',
                  }}
                >
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: 500, color: '#f8fafc', margin: 0 }}>
                    Autonomous Financial Ledger Audit &amp; Verification
                  </h4>
                  <p style={{ fontSize: '14px', color: '#94a3b8', margin: '3px 0 0' }}>
                    Audits bank transactions against customer contracts, flags discrepancies, and spots duplicate debits.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunAudit}
                disabled={isAuditing}
                className="mindmarket-pill-btn"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#0b0f19',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                <RefreshCw size={14} className={isAuditing ? 'animate-spin' : ''} />
                {isAuditing ? 'Auditing Books...' : 'Run Reconciliation Audit'}
              </button>
            </div>

            {/* Success Notification */}
            {fixSuccessMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: '#8ed462', // Fresh Grass
                  color: '#0b0f19',
                  padding: '14px 20px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
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
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    padding: '20px 24px',
                    borderRadius: '25.5px',
                    backgroundColor: '#0b0f19',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    Audit Health Score
                  </div>
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 500,
                      color: '#f8fafc',
                      letterSpacing: '-1px',
                      marginTop: '6px',
                    }}
                  >
                    {reconciliationReport.healthScore}%
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                    {reconciliationReport.matchedInvoicesCount} of {reconciliationReport.totalInvoicesCount} reconciled
                  </div>
                </div>

                <div
                  style={{
                    padding: '20px 24px',
                    borderRadius: '25.5px',
                    backgroundColor: '#0b0f19',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    Identified Discrepancies
                  </div>
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 500,
                      color: reconciliationReport.discrepancies.length > 0 ? '#ff705d' : '#8ed462',
                      letterSpacing: '-1px',
                      marginTop: '6px',
                    }}
                  >
                    {reconciliationReport.discrepancies.length}
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                    Requiring resolution
                  </div>
                </div>

                <div
                  style={{
                    padding: '20px 24px',
                    borderRadius: '25.5px',
                    backgroundColor: '#0b0f19',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    Unreconciled Exposure
                  </div>
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 500,
                      color: '#f8fafc',
                      letterSpacing: '-1px',
                      marginTop: '6px',
                    }}
                  >
                    {formatCurrency(reconciliationReport.unreconciledAmount, currency)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                    Net variance across books
                  </div>
                </div>

                <div
                  style={{
                    padding: '20px 24px',
                    borderRadius: '25.5px',
                    backgroundColor: '#0b0f19',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    Audit Engine Run
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 500, color: '#f8fafc', marginTop: '10px' }}>
                    {new Date(reconciliationReport.lastAuditedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                    Deterministic rule system
                  </div>
                </div>
              </div>
            )}

            {/* Discrepancies List */}
            {reconciliationReport && reconciliationReport.discrepancies.length === 0 ? (
              <div
                style={{
                  padding: '40px',
                  borderRadius: '32px',
                  backgroundColor: '#0b0f19',
                  border: '1.5px solid rgba(255, 255, 255, 0.12)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#8ed462',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0b0f19',
                  }}
                >
                  <CheckCircle2 size={26} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 500, color: '#f8fafc', margin: 0 }}>
                  Financial Books Are 100% Reconciled
                </h4>
                <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '520px', margin: 0, lineHeight: 1.5 }}>
                  All bank transactions cleanly match client invoices, recurring MRR contracts are up-to-date, and zero duplicate charges were detected.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    margin: '8px 0 0',
                  }}
                >
                  Actionable Discrepancies &amp; Automated Fixes
                </h4>

                {reconciliationReport?.discrepancies.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: '20px 24px',
                      borderRadius: '25.5px',
                      backgroundColor: '#0b0f19',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: '280px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: d.severity === 'high' ? '#ff705d' : '#f5e211',
                          marginTop: '6px',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
                            {d.title}
                          </span>
                          <span
                            style={{
                              backgroundColor: d.severity === 'high' ? '#ff705d' : '#f5e211',
                              color: d.severity === 'high' ? '#ffffff' : '#0b0f19',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              textTransform: 'uppercase',
                            }}
                          >
                            {d.severity}
                          </span>
                        </div>
                        <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '4px 0 0', lineHeight: 1.45 }}>
                          {d.description}
                        </p>
                        <div style={{ fontSize: '13px', color: '#f8fafc', marginTop: '6px', fontWeight: 500 }}>
                          Action: {d.suggestedAction}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {d.amount > 0 && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Variance</div>
                          <div style={{ fontSize: '17px', fontWeight: 600, color: '#f8fafc' }}>
                            {formatCurrency(d.amount, currency)}
                          </div>
                        </div>
                      )}

                      {d.autoFixAvailable && (
                        <button
                          type="button"
                          onClick={() => handleExecuteFix(d)}
                          className="mindmarket-pill-btn"
                          style={{
                            backgroundColor: '#ff705d', // Coral Pop
                            color: '#ffffff',
                            padding: '10px 20px',
                            fontSize: '13px',
                          }}
                        >
                          <Zap size={14} /> Auto-Fix
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI Accounting Recommendations */}
            {reconciliationReport && reconciliationReport.recommendations.length > 0 && (
              <div
                style={{
                  padding: '24px 28px',
                  borderRadius: '32px',
                  backgroundColor: '#0b0f19',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <h4
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#f8fafc',
                    margin: '0 0 14px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Sparkles size={16} color="#8ed462" />
                  AI Accounting &amp; Cash Flow Insights
                </h4>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {reconciliationReport.recommendations.map((rec, idx) => (
                    <li key={idx} style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.5 }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 6. Footer Accent Block (Dark Gold Luminous Band)                    */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(245, 226, 17, 0.08) 0%, rgba(20, 27, 43, 0.95) 100%)',
          borderRadius: '50px',
          padding: '28px 36px',
          border: '1.5px solid rgba(245, 226, 17, 0.35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#f5e211',
                display: 'inline-block',
              }}
            />
            <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              Real Human Insights — FounderOS Financial Engine
            </h4>
          </div>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
            All ledger transactions, operational runway calculations, and automated reconciliation audits are processed
            100% on your device with local IndexedDB privacy.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="mindmarket-pill-btn"
          style={{
            backgroundColor: '#ffffff',
            color: '#0b0f19',
            padding: '11px 22px',
            fontSize: '13.5px',
            fontWeight: 600,
          }}
        >
          Back to Top ↑
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 7. Modal: Record Transaction (Dark Mode, 40px radius)              */}
      {/* ------------------------------------------------------------------ */}
      {isTxModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
          onClick={() => setIsTxModalOpen(false)}
        >
          <div
            className="mindmarket-card"
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '36px 40px',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: '#141b2b',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
              <div>
                <h3 style={{ fontSize: '24px', fontWeight: 500, color: '#f8fafc', margin: 0 }}>
                  Record Transaction
                </h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '4px 0 0' }}>
                  Log cash inflow or operational expense into the ledger
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTxModalOpen(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50px',
                  backgroundColor: '#0b0f19',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                    Type
                  </label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as TransactionType)}
                    className="mindmarket-input"
                    style={{ borderRadius: '50px', padding: '10px 16px' }}
                  >
                    <option value="expense">Expense (Outflow)</option>
                    <option value="income">Income (Inflow)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="mindmarket-input"
                    style={{ borderRadius: '50px', padding: '10px 16px' }}
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                  Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OpenRouter API Tokens, AWS Aurora Serverless"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="mindmarket-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
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
                    className="mindmarket-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                    Vendor / Counterparty
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. OpenRouter, Stripe"
                    value={txVendor}
                    onChange={(e) => setTxVendor(e.target.value)}
                    className="mindmarket-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="txRecurringInput"
                  checked={txRecurring}
                  onChange={(e) => setTxRecurring(e.target.checked)}
                  style={{ accentColor: '#8ed462', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="txRecurringInput" style={{ fontSize: '14px', color: '#f8fafc', cursor: 'pointer' }}>
                  Recurring monthly commitment
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="mindmarket-pill-btn"
                  style={{
                    backgroundColor: '#141b2b',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '11px 22px',
                    fontSize: '14px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mindmarket-pill-btn"
                  style={{
                    backgroundColor: '#ff705d', // Coral Pop
                    color: '#ffffff',
                    padding: '11px 26px',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 8. Modal: Create Invoice (Dark Mode, 40px radius)                  */}
      {/* ------------------------------------------------------------------ */}
      {isInvModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
          onClick={() => setIsInvModalOpen(false)}
        >
          <div
            className="mindmarket-card"
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '36px 40px',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: '#141b2b',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
              <div>
                <h3 style={{ fontSize: '24px', fontWeight: 500, color: '#f8fafc', margin: 0 }}>
                  Create Customer Invoice
                </h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '4px 0 0' }}>
                  Issue client licensing or retainer invoice
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInvModalOpen(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50px',
                  backgroundColor: '#0b0f19',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                  Customer Account *
                </label>
                <select
                  required
                  value={invCustomerId}
                  onChange={(e) => setInvCustomerId(e.target.value)}
                  className="mindmarket-input"
                  style={{ borderRadius: '50px', padding: '10px 16px' }}
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={invNumber}
                    onChange={(e) => setInvNumber(e.target.value)}
                    className="mindmarket-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                    Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={invAmount || ''}
                    onChange={(e) => setInvAmount(parseFloat(e.target.value) || 0)}
                    placeholder="2400"
                    className="mindmarket-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={invDueDate}
                  onChange={(e) => setInvDueDate(e.target.value)}
                  className="mindmarket-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                  Description / Service Retainer
                </label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise Tier Retainer (Q1)"
                  value={invDescription}
                  onChange={(e) => setInvDescription(e.target.value)}
                  className="mindmarket-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsInvModalOpen(false)}
                  className="mindmarket-pill-btn"
                  style={{
                    backgroundColor: '#141b2b',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '11px 22px',
                    fontSize: '14px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mindmarket-pill-btn"
                  style={{
                    backgroundColor: '#2ba0ff', // Sky Pop action for invoices
                    color: '#ffffff',
                    padding: '11px 26px',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
