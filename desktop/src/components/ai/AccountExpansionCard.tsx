import React, { useState } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
  FileText,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { db } from '../../db/db';
import { updateAIMessage } from '../../db/services/aiStorageService';
import { undoConfirmedToolAction } from '../../ai/undoService';
import { launchAccountExpansion } from '../../db/services/founderWorkflowsService';
import type { AccountExpansionPayload, AccountExpansionResult, AIToolCall } from '../../types';

interface AccountExpansionCardProps {
  messageId?: string;
  toolCall?: AIToolCall;
  initialData?: Partial<AccountExpansionPayload>;
  onSuccess?: (result: AccountExpansionResult | null) => void;
  onNavigate?: (route: string) => void;
}

export const AccountExpansionCard: React.FC<AccountExpansionCardProps> = ({
  messageId,
  toolCall,
  initialData,
  onSuccess,
  onNavigate,
}) => {
  const [customerName, setCustomerName] = useState<string>(initialData?.customerName || 'Acme Corp');
  const [monthlyRetainer, setMonthlyRetainer] = useState<number>(initialData?.monthlyRetainer || 1500);
  const [serviceTier, setServiceTier] = useState<'starter' | 'growth' | 'enterprise'>(
    initialData?.serviceTier || 'growth'
  );
  const [focusAreas, setFocusAreas] = useState<string>(
    initialData?.focusAreas?.join(', ') || 'Ongoing Maintenance, Performance Tuning, Priority SLA Support'
  );
  const [targetPitchDate, setTargetPitchDate] = useState<string>(
    initialData?.targetPitchDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAlreadyExecuted = toolCall?.status === 'executed';
  const [result, setResult] = useState<AccountExpansionResult | null>(
    isAlreadyExecuted && toolCall?.result ? toolCall.result : null
  );
  const [isUndone, setIsUndone] = useState<boolean>(toolCall?.status === 'undone');
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!customerName.trim()) {
      setError('Please provide a client name.');
      return;
    }
    if (monthlyRetainer <= 0) {
      setError('Monthly retainer amount must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await launchAccountExpansion({
        customerName: customerName.trim(),
        monthlyRetainer,
        serviceTier,
        focusAreas: focusAreas.split(',').map((s) => s.trim()).filter(Boolean),
        targetPitchDate,
      });

      setResult(res);
      setIsUndone(false);

      if (messageId && toolCall?.id) {
        const msg = await db.aiMessages.get(messageId);
        if (msg && msg.toolCalls) {
          const updated = msg.toolCalls.map((tc) =>
            tc.id === toolCall.id ? { ...tc, status: 'executed' as const, result: res } : tc
          );
          await updateAIMessage(messageId, { toolCalls: updated });
        }
      }

      if (onSuccess) onSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize customer account expansion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (!messageId || !toolCall?.id) return;
    setIsUndoing(true);
    setError(null);

    try {
      const undoRes = await undoConfirmedToolAction(
        messageId,
        toolCall.id,
        toolCall.name,
        result,
        toolCall.arguments
      );
      if (undoRes.success) {
        setResult(null);
        setIsUndone(true);
        setUndoMessage(undoRes.message);
        if (onSuccess) onSuccess(null);
      } else {
        setError(undoRes.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to undo action.');
    } finally {
      setIsUndoing(false);
    }
  };

  const jumpTo = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      window.location.hash = `#${route}`;
    }
  };

  // SUCCESS STATE
  if (result) {
    return (
      <div
        style={{
          border: '1px solid rgba(59, 130, 246, 0.35)',
          background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          borderRadius: '12px',
          padding: '18px',
          marginTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.2)' }}>
            <TrendingUp size={20} color="#60a5fa" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#60a5fa' }}>
              Account Retainer Expansion Initialized
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Expansion deal logged • Proposal memo drafted • Pitch task scheduled • OKR goal updated
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '3px' }}>Deal Stage & Value</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#60a5fa' }}>
              ${result.deal.value.toLocaleString()}/mo (${(result.deal.value * 12).toLocaleString()}/yr)
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '3px' }}>Pitch Call Due</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#38bdf8' }}>
              {result.pitchTask.dueDate}
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '3px' }}>Proposal Memo</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#a78bfa', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {result.proposalNote.title}
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '3px' }}>Company Goal</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#34d399' }}>
              ${result.updatedGoal.target.toLocaleString()} Target
            </div>
          </div>
        </div>

        {/* Action Jump Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => jumpTo('deals')}
            className="action-pill-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid rgba(59, 130, 246, 0.3)',
              cursor: 'pointer',
            }}
          >
            <TrendingUp size={13} />
            View Deal in CRM
            <ExternalLink size={11} />
          </button>

          <button
            onClick={() => jumpTo('tasks')}
            className="action-pill-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid rgba(56, 189, 248, 0.3)',
              cursor: 'pointer',
            }}
          >
            <Clock size={13} />
            View Pitch Task
            <ExternalLink size={11} />
          </button>

          <button
            onClick={() => jumpTo('notes')}
            className="action-pill-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(167, 139, 250, 0.15)',
              color: '#c4b5fd',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid rgba(167, 139, 250, 0.3)',
              cursor: 'pointer',
            }}
          >
            <FileText size={13} />
            Open 1-Page Proposal
            <ExternalLink size={11} />
          </button>

          <button
            onClick={() => jumpTo('goals')}
            className="action-pill-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid rgba(16, 185, 129, 0.3)',
              cursor: 'pointer',
            }}
          >
            <Target size={13} />
            View Goals
            <ExternalLink size={11} />
          </button>

          {messageId && toolCall && (
            <button
              onClick={handleUndo}
              disabled={isUndoing}
              className="action-pill-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                cursor: isUndoing ? 'not-allowed' : 'pointer',
                marginLeft: 'auto',
              }}
            >
              <RotateCcw size={12} />
              {isUndoing ? 'Rolling back...' : 'Undo Decision'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // UNDONE STATE
  if (isUndone) {
    return (
      <div
        style={{
          border: '1px solid rgba(148, 163, 184, 0.3)',
          background: 'linear-gradient(145deg, rgba(148, 163, 184, 0.05) 0%, rgba(15, 23, 42, 0.6) 100%)',
          borderRadius: '12px',
          padding: '16px 18px',
          marginTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(148, 163, 184, 0.15)' }}>
              <RotateCcw size={18} color="#94a3b8" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
                Account Expansion Undone & Rolled Back
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {undoMessage || 'Expansion deal, proposal note, and pitch scheduling task were removed.'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setIsUndone(false);
              setResult(null);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-faint)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Re-configure / Approve Again
          </button>
        </div>
      </div>
    );
  }

  // INTERACTIVE INTAKE CARD
  return (
    <div
      style={{
        border: '1px solid rgba(59, 130, 246, 0.3)',
        background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.04) 0%, rgba(15, 23, 42, 0.7) 100%)',
        borderRadius: '12px',
        padding: '18px',
        marginTop: '12px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.2)' }}>
          <TrendingUp size={18} color="#60a5fa" />
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
            Configure Customer Retainer & Expansion Deal
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Convert one-off project clients into long-term monthly recurring revenue (MRR)
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '12px',
            marginBottom: '14px',
          }}
        >
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '5px' }}>
            CLIENT / COMPANY NAME
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Acme Corp"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-faint)',
              color: 'var(--text-main)',
              fontSize: '13px',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '5px' }}>
            MONTHLY RETAINER ($/MO)
          </label>
          <input
            type="number"
            min={100}
            step={100}
            value={monthlyRetainer}
            onChange={(e) => setMonthlyRetainer(Math.max(100, parseFloat(e.target.value) || 1500))}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-faint)',
              color: 'var(--text-main)',
              fontSize: '13px',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '5px' }}>
            SERVICE TIER
          </label>
          <select
            value={serviceTier}
            onChange={(e) => setServiceTier(e.target.value as any)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '6px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-faint)',
              color: 'var(--text-main)',
              fontSize: '13px',
            }}
          >
            <option value="starter">Starter Retainer (Foundational Support)</option>
            <option value="growth">Growth Retainer (Active Iteration & Optimization)</option>
            <option value="enterprise">Enterprise Retainer (Dedicated Pod & 24/7 SLA)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '5px' }}>
            TARGET PITCH DATE
          </label>
          <input
            type="date"
            value={targetPitchDate}
            onChange={(e) => setTargetPitchDate(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-faint)',
              color: 'var(--text-main)',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '5px' }}>
          SCOPE & VALUE DRIVERS (COMMA-SEPARATED)
        </label>
        <input
          type="text"
          value={focusAreas}
          onChange={(e) => setFocusAreas(e.target.value)}
          placeholder="Ongoing Maintenance, Performance Tuning, Priority Support"
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-faint)',
            color: 'var(--text-main)',
            fontSize: '13px',
          }}
        />
      </div>

      {/* Action Plan Preview */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '12px',
        }}
      >
        <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
          MULTI-MODULE EXPANSION IMPACT:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#60a5fa' }}>●</span>
            <span><strong>CRM Deals:</strong> Create Proposal deal for ${monthlyRetainer}/mo (${(monthlyRetainer * 12).toLocaleString()}/yr)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#38bdf8' }}>●</span>
            <span><strong>Priority Tasks:</strong> Schedule CEO pitch deck presentation call due {targetPitchDate}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#a78bfa' }}>●</span>
            <span><strong>Notes & Playbooks:</strong> Generate formatted 1-page Retainer Pitch Memo</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#34d399' }}>●</span>
            <span><strong>Strategic OKRs:</strong> Increment target on recurring revenue growth milestone</span>
          </div>
        </div>
      </div>

      {/* Execution Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          onClick={handleApprove}
          disabled={isSubmitting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          }}
        >
          {isSubmitting ? (
            <>Launching Expansion Deal...</>
          ) : (
            <>
              <TrendingUp size={15} />
              Approve & Launch Expansion
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
