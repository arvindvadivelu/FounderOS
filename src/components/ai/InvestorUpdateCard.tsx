import React, { useState } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Shield,
  Users,
  Send,
  ArrowRight,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { db } from '../../db/db';
import { updateAIMessage } from '../../db/services/aiStorageService';
import { undoConfirmedToolAction } from '../../ai/undoService';
import { generateInvestorReport } from '../../db/services/founderWorkflowsService';
import type { InvestorUpdatePayload, InvestorUpdateResult, AIToolCall } from '../../types';

interface InvestorUpdateCardProps {
  messageId?: string;
  toolCall?: AIToolCall;
  initialData?: Partial<InvestorUpdatePayload>;
  onSuccess?: (result: InvestorUpdateResult | null) => void;
  onNavigate?: (route: string) => void;
}

export const InvestorUpdateCard: React.FC<InvestorUpdateCardProps> = ({
  messageId,
  toolCall,
  initialData,
  onSuccess,
  onNavigate,
}) => {
  const currentMonthYear = `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`;
  const [monthYear, setMonthYear] = useState(initialData?.monthYear || currentMonthYear);
  const [customWins, setCustomWins] = useState(
    'Expanded customer base, closed high-value contracts, and shipped key infrastructure improvements.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAlreadyExecuted = toolCall?.status === 'executed';
  const [result, setResult] = useState<InvestorUpdateResult | null>(
    isAlreadyExecuted && toolCall?.result ? toolCall.result : null
  );
  const [isUndone, setIsUndone] = useState<boolean>(toolCall?.status === 'undone');
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await generateInvestorReport({
        monthYear: monthYear.trim() || currentMonthYear,
        keyWins: customWins.split('\n').filter((w) => w.trim().length > 0),
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
      setError(err.message || 'Failed to generate investor update.');
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

  if (result) {
    return (
      <div
        style={{
          border: '1px solid rgba(168, 85, 247, 0.35)',
          background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          borderRadius: '12px',
          padding: '18px',
          marginTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.2)' }}>
            <TrendingUp size={20} color="#a855f7" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#c084fc' }}>
              Investor Update Memo Published!
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Synthesized ground-truth metrics and saved board brief in Notes
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Monthly Revenue</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <DollarSign size={13} /> ${result.metrics.mrr.toLocaleString()} MRR
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Runway</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <Shield size={13} color="#38bdf8" /> {result.metrics.runwayMonths} Months
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active Accounts</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <Users size={13} color="#f59e0b" /> {result.metrics.activeCustomersCount} Customers
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Strategy Note</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <CheckCircle2 size={13} /> {result.note.title}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => jumpTo('/notes')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#c084fc',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            View Investor Memo in Notes <ExternalLink size={12} />
          </button>
          <button
            onClick={() => jumpTo('/tasks')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            View Distribution Task <ExternalLink size={12} />
          </button>
          <button
            onClick={() => jumpTo('/kpi')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            View KPI Center <ExternalLink size={12} />
          </button>

          {messageId && toolCall && (
            <button
              onClick={handleUndo}
              disabled={isUndoing}
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
                Investor Update Memo Undone & Rolled Back
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {undoMessage || 'Investor brief note and shareholder distribution task were cleanly removed.'}
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

  return (
    <div
      style={{
        border: '1px solid rgba(168, 85, 247, 0.3)',
        background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.04) 0%, rgba(15, 23, 42, 0.5) 100%)',
        borderRadius: '12px',
        padding: '18px',
        marginTop: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <TrendingUp size={18} color="#a855f7" />
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
          Monthly Investor & Board Update Generator
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            background: 'rgba(168, 85, 247, 0.15)',
            color: '#c084fc',
            padding: '2px 8px',
            borderRadius: '10px',
            fontWeight: 600,
          }}
        >
          Ground Truth Synthesis
        </span>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            marginBottom: '12px',
          }}
        >
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Report Period
          </label>
          <input
            type="text"
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-main)',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Custom Wins & Strategic Context
        </label>
        <textarea
          rows={2}
          value={customWins}
          onChange={(e) => setCustomWins(e.target.value)}
          placeholder="Key accomplishments to highlight..."
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)',
            color: 'var(--text-main)',
            fontSize: '12.5px',
            resize: 'vertical',
          }}
        />
      </div>

      <button
        onClick={handleApprove}
        disabled={isSubmitting}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          padding: '10px 16px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          border: 'none',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.7 : 1,
          boxShadow: '0 4px 12px rgba(168, 85, 247, 0.25)',
        }}
      >
        {isSubmitting ? (
          'Synthesizing Company Metrics...'
        ) : (
          <>
            Approve & Publish to Notes <ArrowRight size={15} />
          </>
        )}
      </button>
    </div>
  );
};
