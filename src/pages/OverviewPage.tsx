import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Flame,
  Users,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  FolderKanban,
  Bug,
  Plus,
  Clock,
  Briefcase,
  Sun,
} from 'lucide-react';
import { db } from '../db';
import { SpotlightCard } from '../components/common/SpotlightCard';
import { MetricCard } from '../components/common/MetricCard';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';
import { updateTask } from '../db/services/taskProjectService';
import type { Company } from '../types';

interface OverviewPageProps {
  onNavigate: (route: string) => void;
  onOpenAiBriefing: () => void;
  onCreateTask: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigate,
  onOpenAiBriefing,
  onCreateTask,
}) => {
  const company = useLiveQuery<Company | undefined>(async () => {
    const list = await db.companies.toArray();
    return list[0];
  }, []);

  const customers = useLiveQuery(async () => await db.customers.toArray(), []) || [];
  const deals = useLiveQuery(async () => await db.deals.toArray(), []) || [];
  const tasks = useLiveQuery(async () => await db.tasks.toArray(), []) || [];
  const transactions = useLiveQuery(async () => await db.transactions.toArray(), []) || [];
  const projects = useLiveQuery(async () => await db.projects.toArray(), []) || [];
  const bugs = useLiveQuery(async () => await db.bugs.toArray(), []) || [];
  const features = useLiveQuery(async () => await db.features.toArray(), []) || [];
  const activities = useLiveQuery(
    async () => {
      const list = await db.activities.toArray();
      return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);
    },
    []
  ) || [];

  const defaultProvider = useLiveQuery(async () => {
    const providers = await db.aiProviders.toArray();
    return providers.find((p) => p.isDefault) || providers[0];
  }, []);

  // Compute key metrics
  const activeCustomers = customers.filter((c) => c.status === 'active');
  const mrr = activeCustomers.reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0);
  const arr = mrr * 12;

  let totalIncome = 0;
  let totalExpenses = 0;
  for (const t of transactions) {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpenses += t.amount;
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

  const openDeals = deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost');
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  const today = new Date().toISOString().split('T')[0];
  const openTasks = tasks.filter((t) => t.status !== 'done');
  const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < today);
  const todayTasks = openTasks.filter((t) => t.dueDate === today || t.priority === 'critical' || t.priority === 'high');

  const criticalBugs = bugs.filter((b) => b.severity === 'critical' && b.status !== 'resolved');
  const inProgressFeatures = features.filter((f) => f.status === 'in_progress');

  const currency = company?.currency || 'USD';

  const handleToggleTask = async (task: any) => {
    await updateTask(task.id, {
      status: task.status === 'done' ? 'todo' : 'done',
    });
  };

  const isBrandNew = customers.length === 0 && tasks.length === 0 && transactions.length === 0;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner & Daily Briefing Banner */}
      <SpotlightCard
        style={{
          padding: '28px 32px',
          background: 'linear-gradient(135deg, rgba(0, 80, 255, 0.14) 0%, rgba(15, 23, 42, 0.85) 100%)',
          borderColor: 'rgba(0, 80, 255, 0.3)',
          borderRadius: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '18px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '10px',
                backgroundColor: 'rgba(0, 80, 255, 0.15)',
                border: '1px solid rgba(0, 80, 255, 0.35)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              AUTONOMOUS FOUNDER OPERATING SYSTEM
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                fontWeight: 600,
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              ● Local Database Sync Active
            </span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.04em', margin: 0 }}>
            Welcome back, {company?.name || 'Founder'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '640px', lineHeight: 1.5 }}>
            Your business is operating at <strong style={{ color: '#f8fafc' }}>{formatCurrency(mrr, currency)} MRR</strong> with approximately{' '}
            <strong style={{ color: '#38bdf8' }}>{runwayMonths} months</strong> of cash runway.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => onNavigate('/morning-intelligence')}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '50px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sun size={12} color="#f59e0b" />
            </div>
            <span>Morning Intelligence</span>
          </button>

          <button
            type="button"
            onClick={onOpenAiBriefing}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '50px',
              backgroundColor: '#0050FF',
              color: '#ffffff',
              border: '1px solid #1a62ff',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(0, 80, 255, 0.35)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a62ff';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0050FF';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                color: '#0050FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={11} strokeWidth={2.5} />
            </div>
            <span>Open AI CEO</span>
          </button>
        </div>
      </SpotlightCard>

      {/* Primary Financial & Company Health Matrix */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-dim)' }}>
            Company Health Matrix
          </h3>
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
            title="Monthly Revenue (MRR)"
            value={formatCurrency(mrr, currency)}
            change={`${activeCustomers.length} active clients`}
            changeType="positive"
            subtitle={`ARR: ${formatCurrency(arr, currency)}`}
            icon={<DollarSign size={18} />}
            onClick={() => onNavigate('/finance')}
          />

          <MetricCard
            title="Monthly Burn & Spend"
            value={formatCurrency(totalExpenses, currency)}
            subtitle="Cloud, AI APIs, tooling"
            icon={<CreditCard size={18} />}
            onClick={() => onNavigate('/finance')}
          />

          <MetricCard
            title="Estimated Runway"
            value={`${runwayMonths} mo`}
            change={runwayMonths > 12 ? 'Healthy' : 'Caution'}
            changeType={runwayMonths > 12 ? 'positive' : 'negative'}
            subtitle={`Cash: ${formatCurrency(estimatedCash, currency)}`}
            icon={<Flame size={18} />}
            onClick={() => onNavigate('/finance')}
          />

          <MetricCard
            title="Sales Pipeline"
            value={formatCurrency(pipelineValue, currency)}
            change={`${openDeals.length} active deals`}
            changeType="neutral"
            subtitle="Weighted pipeline value"
            icon={<TrendingUp size={18} />}
            onClick={() => onNavigate('/sales')}
          />
        </div>
      </div>

      {/* Two Column Layout: Today's Work & Strategic Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Left Column: Today's High-Leverage Tasks & Overdue Items */}
        <SpotlightCard style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--brand-accent)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                Today's Priority Focus ({todayTasks.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={onCreateTask}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11.5px' }}
            >
              <Plus size={13} /> Add Task
            </button>
          </div>

          {overdueTasks.length > 0 && (
            <div
              style={{
                marginBottom: '14px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12.5px',
                color: 'var(--accent-rose)',
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>{overdueTasks.length} task(s)</strong> have passed their target deadline.
              </span>
            </div>
          )}

          {todayTasks.length === 0 ? (
            <div style={{ padding: '28px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No critical or due tasks scheduled for today.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayTasks.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-faint)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={t.status === 'done'}
                      onChange={() => handleToggleTask(t)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: t.status === 'done' ? 'var(--text-dim)' : 'var(--text-main)',
                          textDecoration: t.status === 'done' ? 'line-through' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {t.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', gap: '8px' }}>
                        {t.projectName && <span>{t.projectName}</span>}
                        {t.dueDate && (
                          <span style={{ color: t.dueDate < today ? 'var(--accent-rose)' : 'inherit' }}>
                            Due {formatDate(t.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge variant={getStatusBadgeVariant(t.priority)}>{t.priority}</Badge>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigate('/tasks')}
            style={{
              width: '100%',
              marginTop: '14px',
              padding: '8px',
              textAlign: 'center',
              fontSize: '12px',
              color: 'var(--brand-accent)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            View all {openTasks.length} tasks <ArrowUpRight size={13} />
          </button>
        </SpotlightCard>

        {/* Right Column: Pipeline & Engineering Pulse */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sales Pipeline Summary */}
          <SpotlightCard style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--brand-accent)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Active Deals ({openDeals.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/sales')}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '11.5px' }}
              >
                Pipeline Kanban
              </button>
            </div>

            {openDeals.length === 0 ? (
              <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active deals in sales pipeline.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {openDeals.slice(0, 3).map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{d.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{d.customerName || 'Inbound'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399' }}>
                        {formatCurrency(d.value, currency)}
                      </div>
                      <Badge variant={getStatusBadgeVariant(d.stage)}>{d.stage}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SpotlightCard>

          {/* Product & AI Pulse */}
          <SpotlightCard style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--brand-accent)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                  AI System & Product Velocity
                </h3>
              </div>
              <Badge variant={defaultProvider?.apiKey ? 'green' : 'amber'}>
                {defaultProvider?.apiKey ? 'Connected' : 'Provider Unconfigured'}
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12.5px' }}>
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)' }}>
                <div style={{ color: 'var(--text-dim)', fontSize: '11px', fontWeight: 600 }}>ACTIVE MODEL</div>
                <div style={{ color: 'var(--text-main)', fontWeight: 600, marginTop: '2px' }}>
                  {defaultProvider?.model || 'None configured'}
                </div>
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-surface-elevated)' }}>
                <div style={{ color: 'var(--text-dim)', fontSize: '11px', fontWeight: 600 }}>PRODUCT BACKLOG</div>
                <div style={{ color: 'var(--text-main)', fontWeight: 600, marginTop: '2px' }}>
                  {inProgressFeatures.length} feature(s) building
                </div>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>

      {/* Activity Timeline Feed */}
      <SpotlightCard style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={17} color="var(--brand-accent)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              Operational Activity Feed
            </h3>
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
            Real-time audit log
          </span>
        </div>

        {activities.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No recent activity recorded yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activities.map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  fontSize: '12.5px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--brand-accent)',
                    }}
                  />
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{act.title}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', flexShrink: 0 }}>
                  {formatRelativeTime(act.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </SpotlightCard>
    </div>
  );
};
