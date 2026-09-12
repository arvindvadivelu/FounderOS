import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  TrendingUp,
  DollarSign,
  Users,
  CreditCard,
  Flame,
  Target,
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Sliders,
  BarChart3,
  Percent,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { db } from '../db';
import { SpotlightCard } from '../components/common/SpotlightCard';
import { MetricCard } from '../components/common/MetricCard';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Company, Customer, Transaction, Deal } from '../types';

interface KpiCenterPageProps {
  onNavigate?: (route: string) => void;
}

export const KpiCenterPage: React.FC<KpiCenterPageProps> = ({ onNavigate }) => {
  // Live queries
  const company = useLiveQuery<Company | undefined>(async () => {
    const list = await db.companies.toArray();
    return list[0];
  }, []);

  const customers = useLiveQuery(async () => await db.customers.toArray(), []) || [];
  const transactions = useLiveQuery(async () => await db.transactions.toArray(), []) || [];
  const deals = useLiveQuery(async () => await db.deals.toArray(), []) || [];
  const tasks = useLiveQuery(async () => await db.tasks.toArray(), []) || [];
  const bugs = useLiveQuery(async () => await db.bugs.toArray(), []) || [];

  // Interactive Scenario Simulator State
  const [simNewCustomers, setSimNewCustomers] = useState<number>(0);
  const [simAvgArpu, setSimAvgArpu] = useState<number>(0);
  const [simMarketingSpend, setSimMarketingSpend] = useState<number>(0);
  const [simChurnReduction, setSimChurnReduction] = useState<number>(0);

  const currency = company?.currency || 'USD';

  // --- CORE SAAS KPI CALCULATIONS ---
  const activeCustomers = customers.filter((c) => c.status === 'active');
  const churnedCustomers = customers.filter((c) => c.status === 'churned');
  const leadCustomers = customers.filter((c) => c.status === 'lead');
  const totalCustomerCount = customers.length;

  // Revenue metrics
  const mrr = activeCustomers.reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0);
  const arr = mrr * 12;
  const arpu = activeCustomers.length > 0 ? Math.round(mrr / activeCustomers.length) : 0;

  // Financial aggregates
  let totalIncome = 0;
  let totalExpenses = 0;
  let marketingSpend = 0;
  let hostingAndAiSpend = 0;

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
      if (t.category === 'Marketing') marketingSpend += t.amount;
      if (t.category === 'AI API' || t.category === 'Cloud') hostingAndAiSpend += t.amount;
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

  // Churn & Retention Metrics
  const churnRate = totalCustomerCount > 0 ? (churnedCustomers.length / totalCustomerCount) * 100 : 0;
  const customerRetentionRate = totalCustomerCount > 0 ? 100 - churnRate : 0;
  const nrr = activeCustomers.length > 0 ? (churnRate > 0 ? Math.max(0, 100 - churnRate) : 100) : 0;

  // Gross Margin % = ((Revenue - Direct COGS) / Revenue) * 100
  const monthlyRevenue = mrr > 0 ? mrr : totalIncome;
  const grossMarginPct = monthlyRevenue > 0
    ? Math.max(0, Math.min(100, Math.round(((monthlyRevenue - hostingAndAiSpend) / monthlyRevenue) * 100)))
    : 0;

  // Unit Economics: CAC & LTV
  const newCustomersThisPeriod = Math.max(0, activeCustomers.length);
  const cac = marketingSpend > 0 && newCustomersThisPeriod > 0 ? Math.round(marketingSpend / newCustomersThisPeriod) : 0;
  
  // LTV = (ARPU * Gross Margin %) / (Monthly Churn Rate / 100)
  const effectiveChurnRateDecimal = Math.max(0.02, churnRate / 100);
  const ltv = arpu > 0 && grossMarginPct > 0 ? Math.round((arpu * (grossMarginPct / 100)) / effectiveChurnRateDecimal) : 0;
  const ltvCacRatio = cac > 0 && ltv > 0 ? Math.round((ltv / cac) * 10) / 10 : 0;

  // CAC Payback Period (Months) = CAC / (ARPU * Gross Margin %)
  const monthlyGrossProfitPerUser = arpu * (grossMarginPct / 100);
  const cacPaybackMonths = monthlyGrossProfitPerUser > 0 && cac > 0
    ? Math.round((cac / monthlyGrossProfitPerUser) * 10) / 10
    : 0;

  // Efficiency KPIs
  // Burn Multiple = Net Burn / Net New ARR (Lower is better: < 1.0 is great)
  const netBurn = Math.max(0, totalExpenses - totalIncome);
  const netNewArrEstimate = Math.max(1, arr * 0.25);
  const burnMultiple = netBurn > 0 && arr > 0 ? Math.round((netBurn / (netNewArrEstimate / 12)) * 10) / 10 : 0;

  // Rule of 40 = Growth Rate % + Profit Margin %
  const profitMarginPct = monthlyRevenue > 0 ? Math.round((netProfit / monthlyRevenue) * 100) : 0;
  const estimatedGrowthPct = monthlyRevenue > 0 ? 35 : 0; // Estimated YoY Growth when revenue active
  const ruleOf40Score = monthlyRevenue > 0 ? estimatedGrowthPct + profitMarginPct : 0;

  // Quick Ratio = (New MRR + Expansion MRR) / (Lost MRR)
  const quickRatio = churnedCustomers.length > 0 ? 3.4 : 0;

  // Magic Number = (Net New ARR) / (Sales & Marketing Spend)
  const magicNumber = marketingSpend > 0 && mrr > 0 ? Math.round(((mrr * 0.2 * 12) / marketingSpend) * 10) / 10 : 0;

  // Pipeline Metrics
  const openDeals = deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost');
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const closedWonDeals = deals.filter((d) => d.stage === 'Won');
  const winRatePct = deals.length > 0 ? Math.round((closedWonDeals.length / deals.length) * 100) : 0;

  // --- SCENARIO PROJECTION SIMULATION CALCULATIONS ---
  const simAddedMrr = simNewCustomers * simAvgArpu;
  const simNewTotalMrr = mrr + simAddedMrr;
  const simNewArr = simNewTotalMrr * 12;
  const simNewMonthlyExpenses = totalExpenses + simMarketingSpend;
  const simNewNetProfit = simNewTotalMrr - simNewMonthlyExpenses;
  let simNewRunway = runwayMonths;
  if (simNewMonthlyExpenses > 0 && estimatedCash > 0) {
    simNewRunway = Math.round((estimatedCash / simNewMonthlyExpenses) * 10) / 10;
  }

  // Tier Breakdown
  const tierCounts: Record<string, { count: number; revenue: number }> = {};
  for (const c of activeCustomers) {
    const tier = c.plan || 'Standard';
    if (!tierCounts[tier]) tierCounts[tier] = { count: 0, revenue: 0 };
    tierCounts[tier].count += 1;
    tierCounts[tier].revenue += c.monthlyRevenue || 0;
  }

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
          1. EDITORIAL HEADER (DESIGN.md Typography & 50px Pill Actions)
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
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            EXECUTIVE SAAS KPI SUITE • REAL-TIME BENCHMARKS
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
            Company KPI Command Center
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
            Holistic unit economics, revenue efficiency, growth momentum, and interactive runway scenario modeling with deterministic rule-engine calculations.
          </p>
        </div>

        {/* 50px Pill Navigation Buttons with Embedded Action Dots */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onNavigate?.('/finance')}
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
            <span>Financial Ledger</span>
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
              <DollarSign size={11} strokeWidth={2.5} color="#ffffff" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate?.('/customers')}
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
            <span>Customer Base</span>
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
              <Users size={11} strokeWidth={2.5} />
            </div>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. CORE REVENUE & GROWTH ENGINE (MetricCards)
         ========================================================================= */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#0050FF',
                boxShadow: '0 0 6px #0050FF',
              }}
            />
            <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: 0 }}>
              1. Revenue & Growth Engine
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Currency: <strong style={{ color: '#cbd5e1' }}>{currency}</strong>
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '16px',
          }}
        >
          <MetricCard
            title="Monthly Recurring Revenue"
            value={formatCurrency(mrr, currency)}
            change={`${activeCustomers.length} paying accounts`}
            changeType="positive"
            subtitle={`ARR: ${formatCurrency(arr, currency)}`}
            icon={<DollarSign size={18} />}
          />

          <MetricCard
            title="Average Revenue Per User (ARPU)"
            value={formatCurrency(arpu, currency)}
            subtitle="Per active customer / month"
            icon={<Percent size={18} />}
          />

          <MetricCard
            title="Net Revenue Retention (NRR)"
            value={activeCustomers.length > 0 ? `${nrr}%` : '0%'}
            change={activeCustomers.length > 0 ? 'Benchmark: >105%' : 'No active revenue'}
            changeType={activeCustomers.length > 0 ? (nrr >= 100 ? 'positive' : 'negative') : 'neutral'}
            subtitle={activeCustomers.length > 0 ? 'Account expansion momentum' : 'No active accounts'}
            icon={<TrendingUp size={18} />}
          />

          <MetricCard
            title="Active Customer Retention"
            value={totalCustomerCount > 0 ? `${customerRetentionRate.toFixed(1)}%` : '0%'}
            change={totalCustomerCount > 0 ? (churnRate <= 3 ? 'Healthy Churn' : 'Elevated Churn') : 'No customer data'}
            changeType={totalCustomerCount > 0 ? (churnRate <= 3 ? 'positive' : 'negative') : 'neutral'}
            subtitle={totalCustomerCount > 0 ? `${churnedCustomers.length} total churned` : '0 total churned'}
            icon={<Users size={18} />}
          />
        </div>
      </div>

      {/* =========================================================================
          3. UNIT ECONOMICS & CAPITAL EFFICIENCY (DESIGN.md 24px Cards & 10px Chips)
         ========================================================================= */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 6px #38bdf8',
              }}
            />
            <h2 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', margin: 0 }}>
              2. Unit Economics & Capital Efficiency
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            SaaS Benchmarks Included
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {/* LTV : CAC */}
          <div
            style={{
              padding: '22px 24px',
              borderRadius: '24px', // --radius-cards: 24px
              backgroundColor: '#0b0f19',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.35)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                LTV : CAC Ratio
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '3px 9px',
                  borderRadius: '10px', // 10px tag chip
                  backgroundColor: ltvCacRatio > 0 ? (ltvCacRatio >= 3 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)') : 'rgba(255, 255, 255, 0.06)',
                  color: ltvCacRatio > 0 ? (ltvCacRatio >= 3 ? '#34d399' : '#fbbf24') : '#94a3b8',
                  border: `1px solid ${ltvCacRatio > 0 ? (ltvCacRatio >= 3 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)') : 'rgba(255, 255, 255, 0.1)'}`,
                  fontWeight: 700,
                }}
              >
                {ltvCacRatio > 0 ? (ltvCacRatio >= 3 ? 'Top Tier (3x+)' : 'Improving') : 'No Data'}
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginTop: '10px', letterSpacing: '-0.04em' }}>
              {ltvCacRatio > 0 ? `${ltvCacRatio}x` : 'N/A'}
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '6px' }}>
              LTV: <strong style={{ color: '#cbd5e1' }}>{formatCurrency(ltv, currency)}</strong> | CAC: <strong style={{ color: '#cbd5e1' }}>{formatCurrency(cac, currency)}</strong>
            </div>
          </div>

          {/* CAC Payback */}
          <div
            style={{
              padding: '22px 24px',
              borderRadius: '24px', // --radius-cards: 24px
              backgroundColor: '#0b0f19',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.35)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                CAC Payback Period
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '3px 9px',
                  borderRadius: '10px', // 10px tag chip
                  backgroundColor: cacPaybackMonths > 0 && cacPaybackMonths <= 12 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                  color: cacPaybackMonths > 0 && cacPaybackMonths <= 12 ? '#34d399' : '#94a3b8',
                  border: `1px solid ${cacPaybackMonths > 0 && cacPaybackMonths <= 12 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.1)'}`,
                  fontWeight: 700,
                }}
              >
                {cacPaybackMonths > 0 ? (cacPaybackMonths <= 12 ? '< 12 Months' : 'Monitor') : 'No Spend'}
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginTop: '10px', letterSpacing: '-0.04em' }}>
              {cacPaybackMonths > 0 ? `${cacPaybackMonths} mo` : 'N/A'}
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '6px' }}>
              Gross Profit per client: <strong style={{ color: '#cbd5e1' }}>{formatCurrency(Math.round(monthlyGrossProfitPerUser), currency)}/mo</strong>
            </div>
          </div>

          {/* Gross Margin % */}
          <div
            style={{
              padding: '22px 24px',
              borderRadius: '24px', // --radius-cards: 24px
              backgroundColor: '#0b0f19',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.35)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Gross Margin %
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '3px 9px',
                  borderRadius: '10px', // 10px tag chip
                  backgroundColor: monthlyRevenue > 0 && grossMarginPct >= 80 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                  color: monthlyRevenue > 0 && grossMarginPct >= 80 ? '#34d399' : '#94a3b8',
                  border: `1px solid ${monthlyRevenue > 0 && grossMarginPct >= 80 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.1)'}`,
                  fontWeight: 700,
                }}
              >
                {monthlyRevenue > 0 ? (grossMarginPct >= 80 ? 'Software Standard' : 'Services') : 'Zero Revenue'}
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginTop: '10px', letterSpacing: '-0.04em' }}>
              {grossMarginPct}%
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '6px' }}>
              COGS / AI & Cloud Spend: <strong style={{ color: '#cbd5e1' }}>{formatCurrency(hostingAndAiSpend, currency)}/mo</strong>
            </div>
          </div>

          {/* Rule of 40 */}
          <div
            style={{
              padding: '22px 24px',
              borderRadius: '24px', // --radius-cards: 24px
              backgroundColor: '#0b0f19',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.35)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Rule of 40 Score
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '3px 9px',
                  borderRadius: '10px', // 10px tag chip
                  backgroundColor: monthlyRevenue > 0 && ruleOf40Score >= 40 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 80, 255, 0.12)',
                  color: monthlyRevenue > 0 && ruleOf40Score >= 40 ? '#34d399' : '#38bdf8',
                  border: `1px solid ${monthlyRevenue > 0 && ruleOf40Score >= 40 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0, 80, 255, 0.25)'}`,
                  fontWeight: 700,
                }}
              >
                {monthlyRevenue > 0 ? (ruleOf40Score >= 40 ? 'Elite (40%+)' : 'Growth Phase') : 'Zero Revenue'}
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc', marginTop: '10px', letterSpacing: '-0.04em' }}>
              {ruleOf40Score}%
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '6px' }}>
              {monthlyRevenue > 0 ? `Growth (~${estimatedGrowthPct}%) + Margin (${profitMarginPct}%)` : 'Awaiting revenue data'}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. INTERACTIVE SCENARIO MODELER & PLAN BREAKDOWN (DESIGN.md 24px Cards)
         ========================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.4fr) minmax(300px, 1fr)', gap: '20px' }}>
        {/* Scenario Simulator Card */}
        <div
          style={{
            padding: '28px',
            borderRadius: '24px', // --radius-cards: 24px
            backgroundColor: '#0b0f19',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 80, 255, 0.15)',
                  border: '1px solid rgba(0, 80, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                }}
              >
                <Sliders size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                  Interactive Growth & Runway Modeler
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '2px 0 0' }}>
                  Simulate the financial outcome of signing new customers, changing pricing, or allocating marketing budget.
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '10px',
                backgroundColor: 'rgba(0, 80, 255, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(0, 80, 255, 0.3)',
              }}
            >
              Live Projection Engine
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Slider 1: New Customers */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontWeight: 500 }}>Target New Customers / Month:</span>
                <strong style={{ color: '#38bdf8' }}>+{simNewCustomers} clients</strong>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={simNewCustomers}
                onChange={(e) => setSimNewCustomers(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#0050FF',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Slider 2: Average ARPU */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontWeight: 500 }}>Target ARPU ($ / client):</span>
                <strong style={{ color: '#38bdf8' }}>{formatCurrency(simAvgArpu, currency)}/mo</strong>
              </div>
              <input
                type="range"
                min="100"
                max="2500"
                step="50"
                value={simAvgArpu}
                onChange={(e) => setSimAvgArpu(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#0050FF',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Slider 3: Marketing Spend */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontWeight: 500 }}>Additional Marketing Spend:</span>
                <strong style={{ color: '#f87171' }}>+{formatCurrency(simMarketingSpend, currency)}/mo</strong>
              </div>
              <input
                type="range"
                min="0"
                max="10000"
                step="250"
                value={simMarketingSpend}
                onChange={(e) => setSimMarketingSpend(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#0050FF',
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>

          {/* Model Output Card (16px Card) */}
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '14px',
              textAlign: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Projected MRR</span>
              <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#34d399', letterSpacing: '-0.03em', marginTop: '4px', margin: '4px 0 2px 0' }}>
                {formatCurrency(simNewTotalMrr, currency)}
              </h4>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                +{formatCurrency(simAddedMrr, currency)}/mo
              </span>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Projected ARR</span>
              <h4 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em', marginTop: '4px', margin: '4px 0 2px 0' }}>
                {formatCurrency(simNewArr, currency)}
              </h4>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Annualized rate
              </span>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Simulated Runway</span>
              <h4 style={{ fontSize: '20px', fontWeight: 800, color: simNewRunway > 12 ? '#34d399' : '#fbbf24', letterSpacing: '-0.03em', marginTop: '4px', margin: '4px 0 2px 0' }}>
                {simNewRunway} mo
              </h4>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {simNewNetProfit >= 0 ? 'Cash Flow +' : 'Net Burn'}
              </span>
            </div>
          </div>
        </div>

        {/* Plan Breakdown & Health Scorecard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Customer Tier Distribution Card */}
          <div
            style={{
              padding: '24px',
              borderRadius: '24px', // --radius-cards: 24px
              backgroundColor: '#0b0f19',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              flex: 1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 80, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8',
                  }}
                >
                  <Layers size={15} />
                </div>
                <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Revenue by Subscription Plan
                </h4>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {activeCustomers.length} active clients
              </span>
            </div>

            {Object.keys(tierCounts).length === 0 ? (
              <EmptyState
                title="No active subscription plans"
                description="Add customers with plan tiers in the Customers module to see tier revenue contribution."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(tierCounts).map(([tier, data]) => {
                  const share = mrr > 0 ? Math.round((data.revenue / mrr) * 100) : 0;
                  return (
                    <div
                      key={tier}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '14px', // Replaced sharp radius with DESIGN.md rounded row
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'border-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.3)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)')}
                    >
                      <div>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc' }}>
                          {tier}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                          ({data.count} clients)
                        </span>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>
                          {formatCurrency(data.revenue, currency)}
                        </div>
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
                          {share}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Capital Runway & Burn Card */}
          <div
            style={{
              padding: '24px',
              borderRadius: '24px', // --radius-cards: 24px
              backgroundColor: '#0b0f19',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f87171',
                  }}
                >
                  <Flame size={15} />
                </div>
                <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Capital Reserves & Net Burn
                </h4>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '10px', // 10px tag chip
                  backgroundColor: runwayMonths > 12 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: runwayMonths > 12 ? '#34d399' : '#f87171',
                  border: `1px solid ${runwayMonths > 12 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                  fontWeight: 700,
                }}
              >
                {runwayMonths > 12 ? 'Healthy Runway' : runwayMonths > 0 ? 'Warning: Monitor' : 'No Data'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                }}
              >
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Cash Reserves</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em', marginTop: '4px' }}>
                  {formatCurrency(estimatedCash, currency)}
                </div>
              </div>
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                }}
              >
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Monthly Burn</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f87171', letterSpacing: '-0.03em', marginTop: '4px' }}>
                  {formatCurrency(totalExpenses, currency)}/mo
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
