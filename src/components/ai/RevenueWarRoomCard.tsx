import React, { useState } from 'react';
import {
  Swords,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  FileText,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Target,
  Sparkles,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { db } from '../../db/db';
import { updateAIMessage } from '../../db/services/aiStorageService';
import { undoConfirmedToolAction } from '../../ai/undoService';
import { runRevenueWarRoom } from '../../db/services/founderWorkflowsService';
import type { RevenueWarRoomPayload, RevenueWarRoomResult, AIToolCall } from '../../types';

interface RevenueWarRoomCardProps {
  messageId?: string;
  toolCall?: AIToolCall;
  initialData?: Partial<RevenueWarRoomPayload>;
  onSuccess?: (result: RevenueWarRoomResult | null) => void;
  onNavigate?: (route: string) => void;
}

export const RevenueWarRoomCard: React.FC<RevenueWarRoomCardProps> = ({
  messageId,
  toolCall,
  initialData,
  onSuccess,
  onNavigate,
}) => {
  const [sprintRevenueTarget, setSprintRevenueTarget] = useState<number>(
    initialData?.sprintRevenueTarget || 10000
  );
  const [focusArea, setFocusArea] = useState<
    'closing_pipeline' | 'upsell_existing' | 'debt_recovery' | 'burn_optimization'
  >((initialData?.focusArea as any) || 'closing_pipeline');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAlreadyExecuted = toolCall?.status === 'executed';
  const [result, setResult] = useState<RevenueWarRoomResult | null>(
    isAlreadyExecuted && toolCall?.result ? toolCall.result : null
  );
  const [isUndone, setIsUndone] = useState<boolean>(toolCall?.status === 'undone');
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await runRevenueWarRoom({
        sprintRevenueTarget,
        focusArea,
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
      setError(err.message || 'Failed to initialize weekly revenue war room.');
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
          border: '1px solid rgba(168, 85, 247, 0.35)',
          background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          borderRadius: '12px',
          padding: '18px',
          marginTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.2)' }}>
            <Swords size={20} color="#c084fc" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#c084fc' }}>
              Monday Revenue War Room Activated
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Target: ${result.metrics.targetSprintRevenue.toLocaleString()} • Top 3 CEO Priority Tasks locked • Executive Briefing published
            </div>
          </div>
        </div>

        {/* Business Pulse Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>Live MRR</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#34d399' }}>
              ${result.metrics.currentMrr.toLocaleString()}
            </div>
          </div>

          <div
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>Active Pipeline</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}>
              ${result.metrics.activePipelineValue.toLocaleString()}
            </div>
          </div>

          <div
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>Overdue AR</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: result.metrics.overdueInvoiceCount > 0 ? '#f87171' : '#a1a1aa' }}>
              {result.metrics.overdueInvoiceCount} Unpaid
            </div>
          </div>

          <div
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>Deliverables</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fbbf24' }}>
              {result.metrics.activeDeliverablesCount} In Progress
            </div>
          </div>
        </div>

        {/* Priority Action Tasks list */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
            TOP 3 CEO REVENUE PRIORITIES:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {result.priorityTasks.map((t, idx) => (
              <div
                key={t.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: 'rgba(168, 85, 247, 0.1)',
                  fontSize: '12.5px',
                  color: 'var(--text-main)',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#c084fc' }}>#{idx + 1}</span>
                <span style={{ flex: 1 }}>{t.title}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  Due: {t.dueDate}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Jump Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => jumpTo('notes')}
            className="action-pill-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid rgba(168, 85, 247, 0.3)',
              cursor: 'pointer',
            }}
          >
            <FileText size={13} />
            Open War Room Briefing
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
            View CEO Priorities
            <ExternalLink size={11} />
          </button>

          <button
            onClick={() => jumpTo('deals')}
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
            <DollarSign size={13} />
            View CRM Pipeline
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
                Revenue War Room Undone & Rolled Back
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {undoMessage || 'Executive briefing note and CEO priority sprint tasks were cleanly removed.'}
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
        border: '1px solid rgba(168, 85, 247, 0.3)',
        background: 'linear-gradient(145deg, rgba(168, 85, 247, 0.04) 0%, rgba(15, 23, 42, 0.7) 100%)',
        borderRadius: '12px',
        padding: '18px',
        marginTop: '12px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.2)' }}>
          <Swords size={18} color="#c084fc" />
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
            Monday Revenue War Room & CEO Alignment
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Conduct a 360° financial pulse check, select sprint focus, and lock in top-3 CEO execution priorities
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
            WEEKLY SPRINT REVENUE TARGET ($)
          </label>
          <input
            type="number"
            min={500}
            step={500}
            value={sprintRevenueTarget}
            onChange={(e) => setSprintRevenueTarget(Math.max(500, parseFloat(e.target.value) || 10000))}
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
            SPRINT STRATEGIC EMPHASIS
          </label>
          <select
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value as any)}
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
            <option value="closing_pipeline">Closing Late-Stage Deals in Pipeline</option>
            <option value="upsell_existing">Pitching Retainers & Upsells to Existing Clients</option>
            <option value="debt_recovery">Collecting Overdue Invoices & Cash Recovery</option>
            <option value="burn_optimization">Auditing Vendor Subscriptions & Burn Rate</option>
          </select>
        </div>
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
          WAR ROOM AUTOMATION DELIVERABLES:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#c084fc' }}>●</span>
            <span><strong>Pulse Synthesis:</strong> Live query of MRR, pipeline size, delivery health, and receivables</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#38bdf8' }}>●</span>
            <span><strong>Top 3 CEO Priorities:</strong> Pin high-urgency tasks scheduled across the next 3 days</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#a78bfa' }}>●</span>
            <span><strong>Executive Briefing:</strong> Publish formatted War Room Strategy Briefing directly to Notes</span>
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
            background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
          }}
        >
          {isSubmitting ? (
            <>Synthesizing War Room...</>
          ) : (
            <>
              <Swords size={15} />
              Approve & Lock Weekly Priorities
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
