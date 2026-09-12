import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  UserPlus,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  Plus,
} from 'lucide-react';
import { db } from '../db';
import { FinancialForecastEngine } from '../engines/financialForecastEngine';
import type { ForecastScenario, HiringPlanRole } from '../types';

export const FinancialForecastingPage: React.FC = () => {
  const scenarios = useLiveQuery(() => db.forecastScenarios.toArray(), []);
  const hiringPlan = useLiveQuery(() => db.hiringPlans.toArray(), []);
  const bankAccounts = useLiveQuery(() => db.bankAccounts.toArray(), []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const transactions = useLiveQuery(() => db.transactions.toArray(), []);

  // Compute live current financial baselines
  const currentCash = bankAccounts?.reduce((sum, b) => sum + (b.balance || 0), 0) || 0;
  const currentMrr = customers?.reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0) || 0;
  const baseMonthlyBurn = 0;

  // Active scenario and slider state
  const [selectedScenarioType, setSelectedScenarioType] = useState<'base' | 'best' | 'worst'>('base');
  const [growthRate, setGrowthRate] = useState<number>(0);
  const [churnRate, setChurnRate] = useState<number>(0);
  const [grossMargin, setGrossMargin] = useState<number>(0);
  const [burnBuffer, setBurnBuffer] = useState<number>(baseMonthlyBurn);

  // Hiring form state
  const [showAddHire, setShowAddHire] = useState<boolean>(false);
  const [newHireTitle, setNewHireTitle] = useState<string>('');
  const [newHireDept, setNewHireDept] = useState<string>('Engineering');
  const [newHireSalary, setNewHireSalary] = useState<number>(10000);
  const [newHireStartDate, setNewHireStartDate] = useState<string>('2026-10-01');

  // Active scenario model
  const activeScenario: ForecastScenario = {
    id: `sc-${selectedScenarioType}`,
    name:
      selectedScenarioType === 'base'
        ? 'Base Case (Expected)'
        : selectedScenarioType === 'best'
        ? 'Best Case (Aggressive Growth)'
        : 'Worst Case (Bear Market)',
    type: selectedScenarioType,
    description: 'Dynamic interactive scenario projection',
    mrrGrowthRatePct: growthRate,
    churnRatePct: churnRate,
    grossMarginPct: grossMargin,
    monthlyBurnOverride: burnBuffer,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const projectionResult = FinancialForecastEngine.generateProjection(
    activeScenario,
    currentCash,
    currentMrr,
    burnBuffer,
    hiringPlan || []
  );

  const handleSelectScenarioPreset = (preset: 'base' | 'best' | 'worst') => {
    setSelectedScenarioType(preset);
    if (preset === 'base') {
      setGrowthRate(8);
      setChurnRate(2);
      setGrossMargin(80);
      setBurnBuffer(baseMonthlyBurn);
    } else if (preset === 'best') {
      setGrowthRate(15);
      setChurnRate(0.8);
      setGrossMargin(85);
      setBurnBuffer(baseMonthlyBurn);
    } else {
      setGrowthRate(3);
      setChurnRate(4.5);
      setGrossMargin(75);
      setBurnBuffer(baseMonthlyBurn * 1.15);
    }
  };

  const handleAddHire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHireTitle) return;

    const newHire: HiringPlanRole = {
      id: `hire-${Date.now()}`,
      title: newHireTitle,
      department: newHireDept,
      monthlySalary: Number(newHireSalary),
      startDate: newHireStartDate,
      priority: 'high',
      status: 'planned',
      impactJustification: 'Simulated growth role added via Financial Forecast Simulator',
    };

    await db.hiringPlans.add(newHire);
    setNewHireTitle('');
    setShowAddHire(false);
  };

  const handleToggleHireStatus = async (hire: HiringPlanRole) => {
    const nextStatus = hire.status === 'frozen' ? 'planned' : 'frozen';
    await db.hiringPlans.update(hire.id, { status: nextStatus });
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
              }}
            >
              <TrendingUp size={18} color="#fff" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              Financial Forecasting & Runway Simulator
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#34d399',
                backgroundColor: 'rgba(52, 211, 153, 0.12)',
                padding: '3px 9px',
                borderRadius: '999px',
                border: '1px solid rgba(52, 211, 153, 0.25)',
              }}
            >
              V2 FORECAST ENGINE
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Model 12-month cash trajectories across Base, Best, and Worst cases. Test hiring impacts and track Default Alive horizons.
          </p>
        </div>

        {/* Preset Selector */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--bg-card)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          {(['base', 'best', 'worst'] as const).map(p => (
            <button
              key={p}
              onClick={() => handleSelectScenarioPreset(p)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                backgroundColor: selectedScenarioType === p ? 'var(--brand-accent)' : 'transparent',
                color: selectedScenarioType === p ? '#fff' : 'var(--text-muted)',
                textTransform: 'capitalize',
              }}
            >
              {p} Case
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>CURRENT TREASURY</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            ${currentCash.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} /> Reconciled Bank Reserves
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>PROJECTED RUNWAY</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: projectionResult.runwayMonths > 12 ? '#10b981' : '#f59e0b', marginTop: '4px' }}>
            {projectionResult.runwayMonths > 50 ? 'Default Alive' : `${projectionResult.runwayMonths} Months`}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {projectionResult.cashExhaustionDate ? `Exhaustion: ${projectionResult.cashExhaustionDate}` : 'Infinite / Breakeven Reached'}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>MONTH 12 MRR</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
            ${projectionResult.projections[11]?.projectedMrr.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#34d399', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUpRight size={14} /> +{growthRate - churnRate}% net MoM growth
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>BREAKEVEN MILESTONE</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            {projectionResult.breakevenMonth || 'Month 14+'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Hiring Investment: ${projectionResult.totalHiringCostFirst12Mo.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Grid: Parameter Sliders & Hiring Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '22px', marginBottom: '28px' }}>
        {/* Sliders Control Panel */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sliders size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Dynamic Sensitivity Sliders
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Growth Rate Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>MRR Growth Rate (% / Month)</span>
                <span style={{ color: '#38bdf8', fontWeight: 800 }}>{growthRate}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="0.5"
                value={growthRate}
                onChange={e => setGrowthRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand-accent)' }}
              />
            </div>

            {/* Churn Rate Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Monthly Churn Rate (% / Month)</span>
                <span style={{ color: churnRate > 3 ? '#ef4444' : '#10b981', fontWeight: 800 }}>{churnRate}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={churnRate}
                onChange={e => setChurnRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ef4444' }}
              />
            </div>

            {/* Monthly Burn Override */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Base Monthly Burn ($)</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>${burnBuffer.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="50000"
                step="1000"
                value={burnBuffer}
                onChange={e => setBurnBuffer(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b' }}
              />
            </div>

            {/* Gross Margin */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Gross Margin (%)</span>
                <span style={{ color: '#34d399', fontWeight: 800 }}>{grossMargin}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="1"
                value={grossMargin}
                onChange={e => setGrossMargin(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#34d399' }}
              />
            </div>
          </div>
        </div>

        {/* Hiring Plan Simulator */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} color="#ec4899" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Hiring Plan Impact Simulator
              </h3>
            </div>
            <button
              onClick={() => setShowAddHire(!showAddHire)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(236, 72, 153, 0.15)',
                color: '#ec4899',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Plus size={14} /> Add Role
            </button>
          </div>

          {/* Add Hire Modal Form */}
          {showAddHire && (
            <form onSubmit={handleAddHire} style={{ backgroundColor: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', marginBottom: '14px', border: '1px solid var(--border-faint)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Role Title (e.g. Senior Backend Engineer)"
                  value={newHireTitle}
                  onChange={e => setNewHireTitle(e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '12.5px' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="number"
                    placeholder="Monthly Salary ($)"
                    value={newHireSalary}
                    onChange={e => setNewHireSalary(Number(e.target.value))}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '12.5px' }}
                  />
                  <input
                    type="date"
                    value={newHireStartDate}
                    onChange={e => setNewHireStartDate(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '12.5px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <button type="button" onClick={() => setShowAddHire(false)} style={{ padding: '6px 12px', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: 'var(--brand-accent)', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Save Role</button>
                </div>
              </div>
            </form>
          )}

          {/* Hiring Plan List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hiringPlan && hiringPlan.length > 0 ? (
              hiringPlan.map(hire => (
                <div
                  key={hire.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-faint)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: hire.status === 'frozen' ? 0.45 : 1,
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{hire.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      {hire.department} • ${hire.monthlySalary.toLocaleString()}/mo • Start: {hire.startDate}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleHireStatus(hire)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: hire.status === 'frozen' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)',
                      backgroundColor: hire.status === 'frozen' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: hire.status === 'frozen' ? '#ef4444' : '#10b981',
                    }}
                  >
                    {hire.status === 'frozen' ? 'Frozen' : 'Active'}
                  </button>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '12.5px', color: 'var(--text-dim)', textAlign: 'center', padding: '18px' }}>
                No hiring additions. Click "Add Role" to simulate headcount impact on runway.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 12-Month Projection Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            12-Month Pro-Forma Cash Trajectory
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Figures in USD</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>MONTH</th>
                <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>PROJECTED MRR</th>
                <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>REVENUE</th>
                <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>HIRING COST</th>
                <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>TOTAL BURN</th>
                <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>NET BURN</th>
                <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>ENDING CASH</th>
                <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>RUNWAY</th>
              </tr>
            </thead>
            <tbody>
              {projectionResult.projections.map(p => (
                <tr key={p.monthIndex} style={{ borderBottom: '1px solid var(--border-faint)' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--text-main)' }}>{p.monthLabel}</td>
                  <td style={{ padding: '10px 16px', color: '#38bdf8', fontWeight: 600 }}>${p.projectedMrr.toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-main)' }}>${p.projectedRevenue.toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', color: p.hiringExpenses > 0 ? '#ec4899' : 'var(--text-dim)' }}>
                    ${p.hiringExpenses.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-main)' }}>${p.totalExpenses.toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', color: p.netBurn > 0 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                    {p.netBurn > 0 ? `-$${p.netBurn.toLocaleString()}` : `+$${Math.abs(p.netBurn).toLocaleString()}`}
                  </td>
                  <td style={{ padding: '10px 16px', fontWeight: 700, color: p.endingCash > 50000 ? 'var(--text-main)' : '#ef4444' }}>
                    ${p.endingCash.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 16px', color: p.runwayMonthsRemaining > 12 ? '#10b981' : p.runwayMonthsRemaining > 6 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
                    {p.runwayMonthsRemaining > 50 ? 'Default Alive' : `${p.runwayMonthsRemaining} Mo`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
