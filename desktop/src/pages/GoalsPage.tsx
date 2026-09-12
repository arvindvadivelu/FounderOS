import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import confetti from 'canvas-confetti';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { db } from '../db';
import { MetricCard } from '../components/common/MetricCard';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { createGoal, updateGoal, deleteGoal } from '../db/services/goalNoteService';
import { formatDate } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import type { Goal } from '../types';

const GOAL_STATUS_CONFIG: Record<
  'on_track' | 'at_risk' | 'behind' | 'achieved',
  { color: string; bg: string; border: string; label: string }
> = {
  on_track: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)', label: 'On Track' },
  at_risk: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', label: 'At Risk' },
  behind: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)', label: 'Behind' },
  achieved: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)', label: 'Achieved' },
};

export const GoalsPage: React.FC = () => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState<Goal['period']>('Q1');
  const [target, setTarget] = useState<number>(100000);
  const [currentValue, setCurrentValue] = useState<number>(25000);
  const [unit, setUnit] = useState('$');
  const [status, setStatus] = useState<Goal['status']>('on_track');
  const [deadline, setDeadline] = useState('');

  // Live Queries
  const goals = useLiveQuery(async () => await db.goals.toArray(), []) || [];

  // Metrics
  const onTrackGoals = goals.filter((g) => g.status === 'on_track' || g.status === 'achieved');
  const achievedGoals = goals.filter((g) => g.status === 'achieved');

  const openAddModal = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setPeriod('Q1');
    setTarget(25000);
    setCurrentValue(10000);
    setUnit('$');
    setStatus('on_track');
    setDeadline('');
    setIsModalOpen(true);
  };

  const openEditModal = (g: Goal) => {
    setEditingGoal(g);
    setTitle(g.title);
    setDescription(g.description || '');
    setPeriod(g.period);
    setTarget(g.target);
    setCurrentValue(g.currentValue);
    setUnit(g.unit);
    setStatus(g.status);
    setDeadline(g.deadline || '');
    setIsModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || target <= 0) return;

    const isNowAchieved = currentValue >= target || status === 'achieved';

    if (editingGoal) {
      await updateGoal(editingGoal.id, {
        title,
        description,
        period,
        target: Number(target),
        currentValue: Number(currentValue),
        unit,
        status: isNowAchieved ? 'achieved' : status,
        deadline: deadline || undefined,
      });
      showToast('success', 'Goal Updated', `Milestone "${title}" updated.`);
    } else {
      await createGoal({
        title,
        description,
        period,
        target: Number(target),
        currentValue: Number(currentValue),
        unit,
        status: isNowAchieved ? 'achieved' : status,
        deadline: deadline || undefined,
      });
      showToast('success', 'Goal Created', `Strategic goal "${title}" set.`);
    }

    if (isNowAchieved) {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }

    setIsModalOpen(false);
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm('Delete this goal?')) {
      await deleteGoal(id);
      showToast('info', 'Goal Deleted', 'Milestone removed.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Editorial Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '10px', // DESIGN.md --radius-small: 10px
              backgroundColor: 'rgba(0, 80, 255, 0.1)',
              border: '1px solid rgba(0, 80, 255, 0.25)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 8px #38bdf8',
              }}
            />
            COMPANY STRATEGY • QUARTERLY & ANNUAL OKRS
          </div>
          <h1
            style={{
              fontSize: 'clamp(24px, 3vw, 32px)',
              fontWeight: 800,
              color: '#f8fafc',
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Company Goals & OKR Tracking
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', maxWidth: '640px' }}>
            Set quarterly and annual company targets for revenue, customer count, unit economics, and operational efficiency.
          </p>
        </div>

        {/* Primary CTA Button with Action Indicator Dot */}
        <button
          type="button"
          onClick={openAddModal}
          style={{
            borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
            padding: '10px 22px',
            backgroundColor: '#0050FF',
            color: '#ffffff',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 14px rgba(0, 80, 255, 0.35)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a66ff')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0050FF')}
        >
          <Plus size={15} />
          <span>Set New Goal</span>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              opacity: 0.9,
            }}
          />
        </button>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <MetricCard
          title="Active Company Goals"
          value={goals.length}
          subtitle="Strategic targets"
          icon={<Target size={18} />}
        />

        <MetricCard
          title="On Track / Achieved"
          value={onTrackGoals.length}
          subtitle="Healthy progress"
          changeType="positive"
          icon={<CheckCircle2 size={18} />}
        />

        <MetricCard
          title="Completed OKRs"
          value={achievedGoals.length}
          subtitle="100% target reached"
          changeType="positive"
          icon={<Sparkles size={18} />}
        />
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <EmptyState
          icon={<Target size={24} />}
          title="No company goals established"
          description="Create measurable OKRs ($100K ARR, 100 Customers, 20% Growth) to align your execution priorities."
          actionText="Create First Goal"
          onAction={openAddModal}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '20px',
          }}
        >
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.currentValue / g.target) * 100));
            const statusKey = (g.status in GOAL_STATUS_CONFIG) ? (g.status as keyof typeof GOAL_STATUS_CONFIG) : 'on_track';
            const statusCfg = GOAL_STATUS_CONFIG[statusKey];

            return (
              <div
                key={g.id}
                style={{
                  backgroundColor: '#0b0f19',
                  borderRadius: '24px', // DESIGN.md --radius-cards: 24px
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.35)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Header with Period & Status Tags */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
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
                        {g.period} OKR
                      </span>

                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '2px 8px',
                          borderRadius: '10px', // 10px tag chip
                          backgroundColor: statusCfg.bg,
                          border: `1px solid ${statusCfg.border}`,
                          color: statusCfg.color,
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: statusCfg.color,
                          }}
                        />
                        {statusCfg.label}
                      </div>
                    </div>

                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                      {g.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(g)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%', // Circular 28px button
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#38bdf8';
                        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#94a3b8';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                      title="Edit Goal"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(g.id)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%', // Circular 28px button
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#94a3b8';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                      title="Delete Goal"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {g.description && (
                  <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                    {g.description}
                  </p>
                )}

                {/* Numbers & Progress Gauge */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '16px', // 16px container
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em' }}>
                      {g.unit === '$' ? `$${g.currentValue.toLocaleString()}` : `${g.currentValue.toLocaleString()} ${g.unit}`}
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginLeft: '6px' }}>
                        / {g.unit === '$' ? `$${g.target.toLocaleString()}` : `${g.target.toLocaleString()} ${g.unit}`}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: pct >= 100 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 80, 255, 0.12)',
                        color: pct >= 100 ? '#34d399' : '#38bdf8',
                        border: `1px solid ${pct >= 100 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0, 80, 255, 0.25)'}`,
                      }}
                    >
                      {pct}%
                    </span>
                  </div>

                  <div
                    style={{
                      height: '7px',
                      borderRadius: '50px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: pct >= 100 ? '#10b981' : 'linear-gradient(90deg, #0050FF 0%, #38bdf8 100%)',
                        borderRadius: '50px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Footer Metadata */}
                {g.deadline && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: '#64748b',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <Calendar size={13} color="#38bdf8" />
                    <span>Target Deadline: {formatDate(g.deadline)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoal ? 'Edit Company Goal' : 'Create Company Goal'}
        subtitle="Specify target metrics, measurement units, and target timeframe"
      >
        <form onSubmit={handleSaveGoal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Goal Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Reach $25,000 Monthly Recurring Revenue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Context and execution drivers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              >
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
                <option value="Annual">Annual</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              >
                <option value="on_track">On Track</option>
                <option value="at_risk">At Risk</option>
                <option value="behind">Behind</option>
                <option value="achieved">Achieved</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Current Value *
              </label>
              <input
                type="number"
                required
                value={currentValue}
                onChange={(e) => setCurrentValue(parseFloat(e.target.value) || 0)}
                placeholder="10000"
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Target Metric *
              </label>
              <input
                type="number"
                required
                min="1"
                value={target}
                onChange={(e) => setTarget(parseFloat(e.target.value) || 0)}
                placeholder="25000"
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Unit Symbol
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="$, customers, users, %"
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Target Deadline Date
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input-field"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                borderRadius: '50px',
                padding: '9px 18px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                borderRadius: '50px',
                padding: '9px 22px',
                backgroundColor: '#0050FF',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 80, 255, 0.35)',
              }}
            >
              <span>{editingGoal ? 'Update Goal' : 'Set Goal'}</span>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                }}
              />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
