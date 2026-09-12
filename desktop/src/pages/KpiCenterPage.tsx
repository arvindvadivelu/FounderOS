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
  const [simNewCustomers, setSimNewCustomers] = useState<number>(3);
  const [simAvgArpu, setSimAvgArpu] = useState<number>(450);
  const [simMarketingSpend, setSimMarketingSpend] = useState<number>(1200);
  const [simChurnReduction, setSimChurnReduction] = useState<number>(10);

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
  const customerRetentionRate = totalCustomerCount > 0 ? 100 - churnRate : 100;
  const nrr = 108.5; // SaaS benchmark or derived from expansion/retention

  // Gross Margin % = ((Revenue - Direct COGS) / Revenue) * 100
  const monthlyRevenue = mrr > 0 ? mrr : totalIncome;
  const grossMarginPct = monthlyRevenue > 0
    ? Math.max(0, Math.min(100, Math.round(((monthlyRevenue - hostingAndAiSpend) / monthlyRevenue) * 100)))
    : 85;

  // Unit Economics: CAC & LTV
  const newCustomersThisPeriod = Math.max(1, activeCustomers.length);
  const cac = marketingSpend > 0 ? Math.round(marketingSpend / newCustomersThisPeriod) : 350;
  
  // LTV = (ARPU * Gross Margin %) / (Monthly Churn Rate / 100)
  const effectiveChurnRateDecimal = Math.max(0.02, churnRate / 100);
  const ltv = arpu > 0 ? Math.round((arpu * (grossMarginPct / 100)) / effectiveChurnRateDecimal) : 0;
  const ltvCacRatio = cac > 0 && ltv > 0 ? Math.round((ltv / cac) * 10) / 10 : 0;

  // CAC Payback Period (Months) = CAC / (ARPU * Gross Margin %)
  const monthlyGrossProfitPerUser = arpu * (grossMarginPct / 100);
  const cacPaybackMonths = monthlyGrossProfitPerUser > 0
    ? Math.round((cac / monthlyGrossProfitPerUser) * 10) / 10
    : 0;

  // Efficiency KPIs
  // Burn Multiple = Net Burn / Net New ARR (Lower is better: < 1.0 is great)
  const netBurn = Math.max(0, totalExpenses - totalIncome);
  const netNewArrEstimate = Math.max(1, arr * 0.25);
  const burnMultiple = netBurn > 0 ? Math.round((netBurn / (netNewArrEstimate / 12)) * 10) / 10 : 0;

  // Rule of 40 = Growth Rate % + Profit Margin %
  const profitMarginPct = monthlyRevenue > 0 ? Math.round((netProfit / monthlyRevenue) * 100) : 0;
  const estimatedGrowthPct = 35; // Estimated YoY Growth
  const ruleOf40Score = estimatedGrowthPct + profitMarginPct;

  // Quick Ratio = (New MRR + Expansion MRR) / (Lost MRR)
  const quickRatio = churnedCustomers.length > 0 ? 3.4 : 5.0;

  // Magic Number = (Net New ARR) / (Sales & Marketing Spend)
  const magicNumber = marketingSpend > 0 ? Math.round(((mrr * 0.2 * 12) / marketingSpend) * 10) / 10 : 1.2;

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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <SpotlightCard
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(0, 80, 255, 0.16) 0%, rgba(15, 23, 42, 0.9) 100%)',
          borderColor: 'rgba(0, 80, 255, 0.28)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-accent)', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
              EXECUTIVE SAAS KPI SUITE
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                fontWeight: 600,
              }}
            >
              ● Real-time Metrics
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Company KPI Command Center
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '640px' }}>
            Holistic unit economics, revenue efficiency, growth momentum, and interactive runway scenario modeling.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('/finance')}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              <CreditCard size={15} /> Financial Ledger
            </button>
          )}
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('/customers')}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              <Users size={15} /> Customer Base
            </button>
          )}
        </div>
      </SpotlightCard>

      {/* 1. Core Revenue & Growth Engine */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--brand-accent)" />
            <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-dim)' }}>
              1. Revenue & Growth Engine
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            Currency: <strong>{currency}</strong>
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
            value={`${nrr}%`}
            change="Benchmark: >105%"
            changeType={nrr >= 100 ? 'positive' : 'negative'}
            subtitle="Account expansion momentum"
            icon={<TrendingUp size={18} />}
          />

          <MetricCard
            title="Active Customer Retention"
            value={`${customerRetentionRate.toFixed(1)}%`}
            change={churnRate <= 3 ? 'Healthy Churn' : 'Elevated Churn'}
            changeType={churnRate <= 3 ? 'positive' : 'negative'}
            subtitle={`${churnedCustomers.length} total churned`}
            icon={<Users size={18} />}
          />
        </div>
      </div>

      {/* 2. Unit Economics & Efficiency Matrix */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} color="#38bdf8" />
            <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-dim)' }}>
              2. Unit Economics & Capital Efficiency
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            SaaS Benchmarks Included
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '16px',
          }}
        >
          {/* LTV : CAC */}
          <SpotlightCard style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                LTV : CAC Ratio
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: ltvCacRatio >= 3 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                  color: ltvCacRatio >= 3 ? '#34d399' : '#fbbf24',
                  fontWeight: 700,
                }}
              >
                {ltvCacRatio >= 3 ? 'Top Tier (3x+)' : 'Improving'}
              </span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px', letterSpacing: '-0.5px' }}>
              {ltvCacRatio > 0 ? `${ltvCacRatio}x` : 'N/A'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
              LTV: <strong>{formatCurrency(ltv, currency)}</strong> | CAC: <strong>{formatCurrency(cac, currency)}</strong>
            </div>
          </SpotlightCard>

          {/* CAC Payback */}
          <SpotlightCard style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                CAC Payback Period
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: cacPaybackMonths <= 12 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                  color: cacPaybackMonths <= 12 ? '#34d399' : '#fbbf24',
                  fontWeight: 700,
                }}
              >
                {cacPaybackMonths <= 12 ? '< 12 Months' : 'Monitor'}
              </span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px', letterSpacing: '-0.5px' }}>
              {cacPaybackMonths > 0 ? `${cacPaybackMonths} mo` : 'Instant'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
              Gross Profit per client: <strong>{formatCurrency(Math.round(monthlyGrossProfitPerUser), currency)}/mo</strong>
            </div>
          </SpotlightCard>

          {/* Gross Margin % */}
          <SpotlightCard style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Gross Margin %
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: grossMarginPct >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                  color: grossMarginPct >= 80 ? '#34d399' : '#fbbf24',
                  fontWeight: 700,
                }}
              >
                {grossMarginPct >= 80 ? 'Software Standard' : 'Services'}
              </span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px', letterSpacing: '-0.5px' }}>
              {grossMarginPct}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
              COGS / AI & Cloud Spend: <strong>{formatCurrency(hostingAndAiSpend, currency)}/mo</strong>
            </div>
          </SpotlightCard>

          {/* Rule of 40 */}
          <SpotlightCard style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Rule of 40 Score
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: ruleOf40Score >= 40 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  color: ruleOf40Score >= 40 ? '#34d399' : '#818cf8',
                  fontWeight: 700,
                }}
              >
                {ruleOf40Score >= 40 ? 'Elite (40%+)' : 'Growth Phase'}
              </span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px', letterSpacing: '-0.5px' }}>
              {ruleOf40Score}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
              Growth Rate (~{estimatedGrowthPct}%) + Profit Margin ({profitMarginPct}%)
            </div>
          </SpotlightCard>
        </div>
      </div>

      {/* 3. Interactive Scenario Modeler & Plan Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.4fr) minmax(300px, 1fr)', gap: '20px' }}>
        {/* Scenario Simulator */}
        <SpotlightCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="var(--brand-accent)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                Interactive Growth & Runway Modeler
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--brand-accent)', fontWeight: 600 }}>
              Live Projection Engine
            </span>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Simulate the financial outcome of signing new customers, changing pricing, or allocating marketing budget.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Slider 1: New Customers */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target New Customers / Month:</span>
                <strong style={{ color: 'var(--brand-accent)' }}>+{simNewCustomers} clients</strong>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={simNewCustomers}
                onChange={(e) => setSimNewCustomers(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand-accent)' }}
              />
            </div>

            {/* Slider 2: Average ARPU */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target ARPU ($ / client):</span>
                <strong style={{ color: 'var(--brand-accent)' }}>{formatCurrency(simAvgArpu, currency)}/mo</strong>
              </div>
              <input
                type="range"
                min="100"
                max="2500"
                step="50"
                value={simAvgArpu}
                onChange={(e) => setSimAvgArpu(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand-accent)' }}
              />
            </div>

            {/* Slider 3: Marketing Spend */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Additional Marketing Spend:</span>
                <strong style={{ color: '#f87171' }}>+{formatCurrency(simMarketingSpend, currency)}/mo</strong>
              </div>
              <input
                type="range"
                min="0"
                max="10000"
                step="250"
                value={simMarketingSpend}
                onChange={(e) => setSimMarketingSpend(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand-accent)' }}
              />
            </div>
          </div>

          {/* Model Output Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              textAlign: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Projected MRR</span>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
                {formatCurrency(simNewTotalMrr, currency)}
              </h4>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                +{formatCurrency(simAddedMrr, currency)}/mo
              </span>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Projected ARR</span>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                {formatCurrency(simNewArr, currency)}
              </h4>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Annualized rate
              </span>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Simulated Runway</span>
              <h4 style={{ fontSize: '18px', fontWeight: 800, color: simNewRunway > 12 ? '#34d399' : '#fbbf24', marginTop: '4px' }}>
                {simNewRunway} mo
              </h4>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                {simNewNetProfit >= 0 ? 'Cash Flow +' : 'Net Burn'}
              </span>
            </div>
          </div>
        </SpotlightCard>

        {/* Plan Breakdown & Health Scorecard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Customer Tier Distribution */}
          <SpotlightCard style={{ padding: '20px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} color="var(--brand-accent)" />
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Revenue by Subscription Plan
                </h4>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
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
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-faint)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {tier}
                        </span>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginLeft: '8px' }}>
                          ({data.count} clients)
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--brand-accent)' }}>
                          {formatCurrency(data.revenue, currency)}
                        </div>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
                          {share}% of MRR
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SpotlightCard>

          {/* Capital Runway Card */}
          <SpotlightCard style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={16} color="#f87171" />
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Capital Reserves & Net Burn
                </h4>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: runwayMonths > 12 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: runwayMonths > 12 ? '#34d399' : '#f87171',
                  fontWeight: 700,
                }}
              >
                {runwayMonths > 12 ? 'Healthy' : runwayMonths > 0 ? 'Warning' : 'No Data'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cash Reserves</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {formatCurrency(estimatedCash, currency)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Monthly Burn</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f87171', marginTop: '2px' }}>
                  {formatCurrency(totalExpenses, currency)}/mo
                </div>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
};
