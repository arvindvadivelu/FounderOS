import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  Plus,
  DollarSign,
  Award,
  CheckCircle2,
  Trash2,
  Edit2,
  ArrowRight,
} from 'lucide-react';
import { db } from '../db';
import { SpotlightCard } from '../components/common/SpotlightCard';
import { MetricCard } from '../components/common/MetricCard';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { createDeal, updateDeal, deleteDeal } from '../db/services/dealService';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Deal, DealStage } from '../types';

export const SalesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [value, setValue] = useState<number>(10000);
  const [stage, setStage] = useState<DealStage>('Lead');
  const [probability, setProbability] = useState<number>(50);
  const [customerId, setCustomerId] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [source, setSource] = useState('Inbound');
  const [notes, setNotes] = useState('');

  // Live Queries
  const company = useLiveQuery(async () => (await db.companies.toArray())[0], []);
  const customers = useLiveQuery(async () => await db.customers.toArray(), []) || [];
  const deals = useLiveQuery(async () => await db.deals.toArray(), []) || [];

  const currency = company?.currency || 'USD';

  const stages: DealStage[] = ['Lead', 'Qualified', 'Demo', 'Proposal', 'Negotiation', 'Won', 'Lost'];

  // Metrics
  const openDeals = deals.filter((d) => d.stage !== 'Won' && d.stage !== 'Lost');
  const totalPipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const weightedRevenue = Math.round(
    openDeals.reduce((sum, d) => sum + ((d.value || 0) * (d.probability || 0)) / 100, 0)
  );

  const wonDeals = deals.filter((d) => d.stage === 'Won');
  const totalWonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;

  const openAddModal = () => {
    setEditingDeal(null);
    setName('');
    setValue(24000);
    setStage('Lead');
    setProbability(30);
    setCustomerId('');
    setExpectedCloseDate('');
    setSource('Inbound');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (d: Deal) => {
    setEditingDeal(d);
    setName(d.name);
    setValue(d.value);
    setStage(d.stage);
    setProbability(d.probability);
    setCustomerId(d.customerId || '');
    setExpectedCloseDate(d.expectedCloseDate || '');
    setSource(d.source || '');
    setNotes(d.notes || '');
    setIsModalOpen(true);
  };

  const handleStageChange = async (dealId: string, newStage: DealStage) => {
    const defaultProbabilities: Record<DealStage, number> = {
      Lead: 20,
      Qualified: 40,
      Demo: 50,
      Proposal: 70,
      Negotiation: 85,
      Won: 100,
      Lost: 0,
    };

    await updateDeal(dealId, {
      stage: newStage,
      probability: defaultProbabilities[newStage],
    });

    if (newStage === 'Won') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || value <= 0) return;

    const cust = customers.find((c) => c.id === customerId);

    if (editingDeal) {
      await updateDeal(editingDeal.id, {
        name,
        value: Number(value),
        currency,
        stage,
        probability: Number(probability),
        customerId: customerId || undefined,
        customerName: cust?.companyName || undefined,
        expectedCloseDate: expectedCloseDate || undefined,
        source,
        notes,
      });
    } else {
      await createDeal({
        name,
        value: Number(value),
        currency,
        stage,
        probability: Number(probability),
        customerId: customerId || undefined,
        customerName: cust?.companyName || undefined,
        expectedCloseDate: expectedCloseDate || undefined,
        source,
        notes,
      });

      if (stage === 'Won') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }

    setIsModalOpen(false);
  };

  const handleDeleteDeal = async (id: string) => {
    if (confirm('Delete this sales deal?')) {
      await deleteDeal(id);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
            Sales Pipeline & Deal Flow
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Track sales stages from qualification to closing with probability-weighted revenue forecasts.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn-primary"
        >
          <Plus size={15} /> Create Deal
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
          title="Active Pipeline Value"
          value={formatCurrency(totalPipelineValue, currency)}
          subtitle={`${openDeals.length} active opportunities`}
          icon={<TrendingUp size={18} />}
        />

        <MetricCard
          title="Weighted Forecast"
          value={formatCurrency(weightedRevenue, currency)}
          subtitle="Probability adjusted expectation"
          changeType="positive"
          icon={<DollarSign size={18} />}
        />

        <MetricCard
          title="Total Won Revenue"
          value={formatCurrency(totalWonValue, currency)}
          subtitle={`${wonDeals.length} closed deals`}
          change={`${winRate}% win rate`}
          changeType="positive"
          icon={<Award size={18} />}
        />
      </div>

      {/* Kanban Pipeline Board */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          alignItems: 'start',
          overflowX: 'auto',
          paddingBottom: '16px',
        }}
      >
        {stages.map((stg) => {
          const stageDeals = deals.filter((d) => d.stage === stg);
          const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

          return (
            <div
              key={stg}
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-faint)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minHeight: '400px',
              }}
            >
              {/* Stage Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge variant={getStatusBadgeVariant(stg)}>{stg}</Badge>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>
                    ({stageDeals.length})
                  </span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {formatCurrency(stageTotal, currency)}
                </span>
              </div>

              {/* Deal Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {stageDeals.length === 0 ? (
                  <div
                    style={{
                      margin: 'auto 0',
                      textAlign: 'center',
                      padding: '24px 8px',
                      color: 'var(--text-dim)',
                      fontSize: '12px',
                      border: '1px dashed var(--border-faint)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    No deals in {stg}
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <SpotlightCard
                      key={deal.id}
                      style={{
                        padding: '14px',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-main)' }}>
                          {deal.name}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(deal)}
                            style={{ color: 'var(--text-dim)', padding: '2px' }}
                            title="Edit Deal"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDeal(deal.id)}
                            style={{ color: 'var(--text-dim)', padding: '2px' }}
                            title="Delete Deal"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        {deal.customerName || 'Inbound prospect'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#34d399' }}>
                          {formatCurrency(deal.value, currency)}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--brand-accent)', fontWeight: 600 }}>
                          {deal.probability}% probability
                        </span>
                      </div>

                      {deal.expectedCloseDate && (
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          Close: {formatDate(deal.expectedCloseDate)}
                        </div>
                      )}

                      {/* Move Stage Selector */}
                      <div style={{ marginTop: '6px', paddingTop: '8px', borderTop: '1px solid var(--border-faint)' }}>
                        <select
                          value={deal.stage}
                          onChange={(e) => handleStageChange(deal.id, e.target.value as DealStage)}
                          className="input-field"
                          style={{ padding: '4px 8px', fontSize: '11.5px', width: '100%' }}
                        >
                          {stages.map((s) => (
                            <option key={s} value={s}>
                              Move to {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </SpotlightCard>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Deal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDeal ? 'Edit Sales Deal' : 'Create Sales Opportunity'}
        subtitle="Track potential contracts, ACV values, and expected close dates"
      >
        <form onSubmit={handleSaveDeal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Deal Opportunity Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Enterprise Annual Pilot, Multi-Team Expansion"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Deal Value ({currency}) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                placeholder="24000"
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Associated Customer
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="input-field"
              >
                <option value="">None / Inbound Lead</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Sales Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as DealStage)}
                className="input-field"
              >
                {stages.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Win Probability ({probability}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={probability}
                onChange={(e) => setProbability(parseInt(e.target.value))}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Expected Close Date
              </label>
              <input
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Lead Source
              </label>
              <input
                type="text"
                placeholder="e.g. Outbound, Demo Form, LinkedIn"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Deal Notes & Next Steps
            </label>
            <textarea
              rows={3}
              placeholder="Next call date, proposal revision notes, decision-makers..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingDeal ? 'Update Deal' : 'Create Deal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
