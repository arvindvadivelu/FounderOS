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
} from 'lucide-react';
import { db } from '../db';
import { SpotlightCard } from '../components/common/SpotlightCard';
import { MetricCard } from '../components/common/MetricCard';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { createGoal, updateGoal, deleteGoal } from '../db/services/goalNoteService';
import { formatDate } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import type { Goal } from '../types';

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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.035em' }}>
            Company Goals & OKR Tracking
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Set quarterly and annual company targets for revenue, customer count, and efficiency.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn-primary"
          style={{ borderRadius: '50px', padding: '9px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} /> Set New Goal
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
          icon={<Target size={18} />}
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
            gap: '18px',
          }}
        >
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.currentValue / g.target) * 100));

            return (
              <SpotlightCard
                key={g.id}
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-accent)' }}>
                        {g.period} OKR
                      </span>
                      <Badge variant={getStatusBadgeVariant(g.status)}>{g.status.replace('_', ' ')}</Badge>
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>{g.title}</h3>
                  </div>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(g)}
                      style={{ color: 'var(--text-dim)', padding: '2px' }}
                      title="Edit Goal"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(g.id)}
                      style={{ color: 'var(--text-dim)', padding: '2px' }}
                      title="Delete Goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {g.description && (
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {g.description}
                  </p>
                )}

                {/* Numbers & Progress Gauge */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {g.unit === '$' ? `$${g.currentValue.toLocaleString()}` : `${g.currentValue.toLocaleString()} ${g.unit}`}
                      <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: 500, marginLeft: '6px' }}>
                        / {g.unit === '$' ? `$${g.target.toLocaleString()}` : `${g.target.toLocaleString()} ${g.unit}`}
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand-accent)' }}>
                      {pct}%
                    </span>
                  </div>

                  <div
                    style={{
                      height: '8px',
                      borderRadius: '999px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: pct >= 100 ? '#10b981' : 'var(--brand-accent)',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Footer */}
                {g.deadline && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11.5px',
                      color: 'var(--text-dim)',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-faint)',
                    }}
                  >
                    <Calendar size={13} />
                    <span>Target Target: {formatDate(g.deadline)}</span>
                  </div>
                )}
              </SpotlightCard>
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
        <form onSubmit={handleSaveGoal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Goal Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Reach $25,000 Monthly Recurring Revenue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Context and execution drivers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="input-field"
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="input-field"
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Current Value *
              </label>
              <input
                type="number"
                required
                value={currentValue}
                onChange={(e) => setCurrentValue(parseFloat(e.target.value) || 0)}
                placeholder="10000"
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Target Target *
              </label>
              <input
                type="number"
                required
                min="1"
                value={target}
                onChange={(e) => setTarget(parseFloat(e.target.value) || 0)}
                placeholder="25000"
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Unit Symbol
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="$, customers, users, %"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Target Deadline Date
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingGoal ? 'Update Goal' : 'Set Goal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
