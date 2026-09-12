import React, { useState } from 'react';
import {
  Flame,
  CheckCircle2,
  AlertCircle,
  Clock,
  Percent,
  FileText,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Target,
  Sparkles,
} from 'lucide-react';
import { db } from '../../db/db';
import { updateAIMessage } from '../../db/services/aiStorageService';
import { undoConfirmedToolAction } from '../../ai/undoService';
import { reengageStalledDeals } from '../../db/services/founderWorkflowsService';
import type { DealWinBackPayload, DealWinBackResult, AIToolCall } from '../../types';
import { RotateCcw } from 'lucide-react';

interface DealWinBackCardProps {
  messageId?: string;
  toolCall?: AIToolCall;
  initialData?: Partial<DealWinBackPayload>;
  onSuccess?: (result: DealWinBackResult | null) => void;
  onNavigate?: (route: string) => void;
}

export const DealWinBackCard: React.FC<DealWinBackCardProps> = ({
  messageId,
  toolCall,
  initialData,
  onSuccess,
  onNavigate,
}) => {
  const [daysInactive, setDaysInactive] = useState<number>(initialData?.daysInactive || 14);
  const [discountPercent, setDiscountPercent] = useState<number>(initialData?.discountPercent || 10);
  const [strategy, setStrategy] = useState<'value_add' | 'discount' | 'new_feature' | 'urgency'>(
    (initialData?.strategy as any) || 'value_add'
  );
  const [customNote, setCustomNote] = useState<string>(
    initialData?.customNote || 'Focus on value unlocking and removing onboarding blockers.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAlreadyExecuted = toolCall?.status === 'executed';
  const [result, setResult] = useState<DealWinBackResult | null>(
    isAlreadyExecuted && toolCall?.result ? toolCall.result : null
  );
  const [isUndone, setIsUndone] = useState<boolean>(toolCall?.status === 'undone');
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await reengageStalledDeals({
        daysInactive,
        discountPercent,
        strategy,
        customNote,
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
      setError(err.message || 'Failed to trigger stalled deal re-engagement campaign.');
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
          border: '1px solid rgba(245, 158, 11, 0.35)',
          background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          borderRadius: '12px',
          padding: '18px',
          marginTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)' }}>
            <Flame size={20} color="#fbbf24" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fbbf24' }}>
              Stalled Deal Win-Back Campaign Deployed
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Pipeline updated • 48h tasks scheduled • Win-back playbook generated
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '3px' }}>Deals Re-Engaged</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
              {result.revivedDeals.length} Opportunities
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
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '3px' }}>48h High-Priority Tasks</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#38bdf8' }}>
              {result.tasksCreated.length} Action Items
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
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '3px' }}>Executive Playbook</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#a78bfa', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {result.playbookNote.title}
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
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid rgba(245, 158, 11, 0.3)',
              cursor: 'pointer',
            }}
          >
            <Target size={13} />
            View CRM Deals
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
            View 48h Tasks
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
            Open Win-Back Note
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
                Win-Back Campaign Undone & Rolled Back
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {undoMessage || 'All follow-up tasks and notes were removed from your local database.'}
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
        border: '1px solid rgba(245, 158, 11, 0.3)',
        background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.04) 0%, rgba(15, 23, 42, 0.7) 100%)',
        borderRadius: '12px',
        padding: '18px',
        marginTop: '12px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)' }}>
          <Flame size={18} color="#fbbf24" />
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
            Configure Stalled Deal Win-Back Campaign
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Audit pipeline dormancy, craft tailored reactivation scripts, and lock 48h accountability
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

      {/* Configuration Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '5px' }}>
            INACTIVITY THRESHOLD (DAYS)
          </label>
          <input
            type="number"
            min={3}
            max={180}
            value={daysInactive}
            onChange={(e) => setDaysInactive(Math.max(1, parseInt(e.target.value) || 14))}
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
            OPTIONAL DISCOUNT (%)
          </label>
          <input
            type="number"
            min={0}
            max={50}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Math.max(0, parseInt(e.target.value) || 0))}
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
            RE-ENGAGEMENT HOOK
          </label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as any)}
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
            <option value="value_add">Value-Add Insight & Audit</option>
            <option value="discount">Direct Incentive Discount</option>
            <option value="new_feature">New Feature Release Announcement</option>
            <option value="urgency">Quarter-End Urgency & Locking</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '5px' }}>
          STRATEGY NOTES & SPECIAL CONTEXT
        </label>
        <input
          type="text"
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          placeholder="e.g. Highlight recent client case studies and rapid turnaround..."
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
          AUTOMATIC PROVISIONING TARGETS:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#fbbf24' }}>●</span>
            <span><strong>CRM Pipeline (Deals):</strong> Scan deals inactive &gt; {daysInactive} days and update to Negotiation/Won</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#38bdf8' }}>●</span>
            <span><strong>CEO Priority Tasks:</strong> Generate 48-hour follow-up actions with custom outreach scripts</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#a78bfa' }}>●</span>
            <span><strong>Command Notes:</strong> Save comprehensive Win-Back Strategy Playbook memo</span>
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
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
          }}
        >
          {isSubmitting ? (
            <>Deploying Win-Back Campaign...</>
          ) : (
            <>
              <Flame size={15} />
              Approve & Deploy Win-Back
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
