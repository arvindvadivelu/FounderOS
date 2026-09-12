import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  Plus,
  DollarSign,
  Award,
  Trash2,
  Edit2,
  Calendar,
} from 'lucide-react';
import { db } from '../db';
import { MetricCard } from '../components/common/MetricCard';
import { Modal } from '../components/common/Modal';
import { createDeal, updateDeal, deleteDeal } from '../db/services/dealService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import type { Deal, DealStage } from '../types';

const STAGE_CONFIG: Record<DealStage, { color: string; bg: string; border: string }> = {
  Lead: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
  Qualified: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)' },
  Demo: { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.25)' },
  Proposal: { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.12)', border: 'rgba(96, 165, 250, 0.25)' },
  Negotiation: { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.25)' },
  Won: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' },
  Lost: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)' },
};

export const SalesPage: React.FC = () => {
  const { showToast } = useToast();
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
      showToast('success', 'Deal Updated', `Sales deal "${name}" updated successfully.`);
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
      showToast('success', 'Deal Created', `Sales deal "${name}" added to pipeline.`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteDeal = async (id: string) => {
    if (confirm('Delete this sales deal?')) {
      await deleteDeal(id);
      showToast('info', 'Deal Removed', 'Sales deal removed from pipeline.');
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
            PIPELINE VELOCITY • REAL-TIME PROBABILITY ENGINE
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
            Sales Pipeline & Deal Flow
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', maxWidth: '640px' }}>
            Track sales stages from qualification to closing with probability-weighted revenue forecasts.
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
          <span>Create Deal</span>
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
          const stageCfg = STAGE_CONFIG[stg];

          return (
            <div
              key={stg}
              style={{
                backgroundColor: '#0b0f19',
                borderRadius: '24px', // DESIGN.md --radius-cards: 24px
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '18px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                minHeight: '440px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
              }}
            >
              {/* Stage Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '3px 10px',
                      borderRadius: '10px', // DESIGN.md --radius-small: 10px
                      backgroundColor: stageCfg.bg,
                      border: `1px solid ${stageCfg.border}`,
                      color: stageCfg.color,
                      fontSize: '11.5px',
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: stageCfg.color,
                        boxShadow: `0 0 6px ${stageCfg.color}`,
                      }}
                    />
                    {stg}
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                    ({stageDeals.length})
                  </span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
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
                      padding: '30px 12px',
                      color: '#64748b',
                      fontSize: '12px',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.01)',
                    }}
                  >
                    No active deals in {stg}
                  </div>
                ) : (
                  stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      style={{
                        padding: '14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '16px', // Modern 16px card inside column
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '9px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.35)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#f8fafc', lineHeight: 1.3 }}>
                          {deal.name}
                        </div>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(deal)}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%', // Circular icon button
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
                            title="Edit Deal"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDeal(deal.id)}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%', // Circular icon button
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
                            title="Delete Deal"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {deal.customerName || 'Inbound prospect'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#34d399', letterSpacing: '-0.03em' }}>
                          {formatCurrency(deal.value, currency)}
                        </span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px', // 10px tag chip
                            backgroundColor: 'rgba(0, 80, 255, 0.12)',
                            color: '#38bdf8',
                            border: '1px solid rgba(0, 80, 255, 0.25)',
                          }}
                        >
                          {deal.probability}% win
                        </span>
                      </div>

                      {deal.expectedCloseDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748b' }}>
                          <Calendar size={11} />
                          <span>Close: {formatDate(deal.expectedCloseDate)}</span>
                        </div>
                      )}

                      {/* Move Stage Selector — 50px Pill Style */}
                      <div style={{ marginTop: '2px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <select
                          value={deal.stage}
                          onChange={(e) => handleStageChange(deal.id, e.target.value as DealStage)}
                          style={{
                            width: '100%',
                            padding: '6px 12px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            borderRadius: '50px', // 50px pill selector
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#f8fafc',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          {stages.map((s) => (
                            <option key={s} value={s} style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>
                              Move to {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
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
        <form onSubmit={handleSaveDeal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Deal Opportunity Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Enterprise Annual Pilot, Multi-Team Expansion"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                style={{ borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Associated Customer
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="input-field"
                style={{ borderRadius: '12px' }}
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Sales Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as DealStage)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              >
                {stages.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Win Probability
                </label>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(0, 80, 255, 0.15)',
                    color: '#38bdf8',
                  }}
                >
                  {probability}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={probability}
                onChange={(e) => setProbability(parseInt(e.target.value))}
                style={{ width: '100%', marginTop: '6px', accentColor: '#0050FF', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Expected Close Date
              </label>
              <input
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Lead Source
              </label>
              <input
                type="text"
                placeholder="e.g. Outbound, Demo Form, LinkedIn"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Deal Notes & Next Steps
            </label>
            <textarea
              rows={3}
              placeholder="Next call date, proposal revision notes, decision-makers..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              <span>{editingDeal ? 'Update Deal' : 'Create Deal'}</span>
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
