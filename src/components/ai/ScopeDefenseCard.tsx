import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  FileText,
  DollarSign,
  ArrowRight,
  ExternalLink,
  FolderKanban,
  FileCheck,
  RotateCcw,
} from 'lucide-react';
import { db } from '../../db/db';
import { updateAIMessage } from '../../db/services/aiStorageService';
import { undoConfirmedToolAction } from '../../ai/undoService';
import { createScopeChangeOrder } from '../../db/services/founderWorkflowsService';
import type { ScopeDefensePayload, ScopeDefenseResult, AIToolCall } from '../../types';

interface ScopeDefenseCardProps {
  messageId?: string;
  toolCall?: AIToolCall;
  initialData?: Partial<ScopeDefensePayload>;
  onSuccess?: (result: ScopeDefenseResult | null) => void;
  onNavigate?: (route: string) => void;
}

export const ScopeDefenseCard: React.FC<ScopeDefenseCardProps> = ({
  messageId,
  toolCall,
  initialData,
  onSuccess,
  onNavigate,
}) => {
  const [clientName, setClientName] = useState<string>(initialData?.clientName || 'Acme Corp');
  const [featureRequested, setFeatureRequested] = useState<string>(
    initialData?.featureRequested || 'Custom multi-currency billing integration not in initial SOW'
  );
  const [additionalFee, setAdditionalFee] = useState<number>(initialData?.additionalFee || 1200);
  const [additionalDays, setAdditionalDays] = useState<number>(initialData?.additionalDays || 7);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAlreadyExecuted = toolCall?.status === 'executed';
  const [result, setResult] = useState<ScopeDefenseResult | null>(
    isAlreadyExecuted && toolCall?.result ? toolCall.result : null
  );
  const [isUndone, setIsUndone] = useState<boolean>(toolCall?.status === 'undone');
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!clientName.trim()) {
      setError('Please provide a client name.');
      return;
    }
    if (!featureRequested.trim()) {
      setError('Please specify the requested out-of-scope feature.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createScopeChangeOrder({
        clientName: clientName.trim(),
        featureRequested: featureRequested.trim(),
        additionalFee,
        additionalDays,
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
      setError(err.message || 'Failed to issue scope-creep change order.');
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
          border: '1px solid rgba(239, 68, 68, 0.35)',
          background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          borderRadius: '12px',
          padding: '18px',
          marginTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)' }}>
            <ShieldAlert size={20} color="#f87171" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#f87171' }}>
              Scope Change Order Formulated & Margin Defended
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Draft invoice generated • Project timeline shifted • Scope backlog isolated • 3-option counter-offer ready
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
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '3px' }}>Change Order Fee</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399' }}>
              +${result.invoice.amount.toLocaleString()} ({result.invoice.invoiceNumber})
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
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '3px' }}>Timeline Adjusted</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f59e0b' }}>
              +{result.adjustedDays} days (Due {result.updatedProject.targetDate})
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
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '3px' }}>Backlog Tasks</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#38bdf8' }}>
              {result.scopeTasks.length} Scope-Frozen Tasks
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
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '3px' }}>Counter-Offer Memo</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#a78bfa', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {result.counterOfferNote.title}
            </div>
          </div>
        </div>

        {/* Action Jump Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => jumpTo('invoices')}
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
            View Change Order Invoice
            <ExternalLink size={11} />
          </button>

          <button
            onClick={() => jumpTo('projects')}
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
            <FolderKanban size={13} />
            View Project Schedule
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
            View Backlog Tasks
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
            Open Counter-Offer Memo
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
                Scope Change Order Undone & Rolled Back
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {undoMessage || 'Change order invoice, counter-offer memo, and scope backlog tasks were removed.'}
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
        border: '1px solid rgba(239, 68, 68, 0.3)',
        background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.04) 0%, rgba(15, 23, 42, 0.7) 100%)',
        borderRadius: '12px',
        padding: '18px',
        marginTop: '12px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)' }}>
          <ShieldAlert size={18} color="#f87171" />
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
            Configure Scope-Creep Defense & Change Order
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Protect project delivery margins, avoid free work, and present professional choices to the client
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
            CLIENT NAME
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
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
            ADDITIONAL FEE ($)
          </label>
          <input
            type="number"
            min={0}
            step={100}
            value={additionalFee}
            onChange={(e) => setAdditionalFee(Math.max(0, parseFloat(e.target.value) || 0))}
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
            SCHEDULE EXTENSION (DAYS)
          </label>
          <input
            type="number"
            min={0}
            max={90}
            value={additionalDays}
            onChange={(e) => setAdditionalDays(Math.max(0, parseInt(e.target.value) || 0))}
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
          REQUESTED OUT-OF-SCOPE FEATURE / CHANGE
        </label>
        <textarea
          rows={2}
          value={featureRequested}
          onChange={(e) => setFeatureRequested(e.target.value)}
          placeholder="e.g. Custom multi-currency billing integration requested after initial contract signing..."
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-faint)',
            color: 'var(--text-main)',
            fontSize: '13px',
            resize: 'vertical',
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
          AUTOMATIC CHANGE ORDER ACTIONS:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#34d399' }}>●</span>
            <span><strong>Finance & Invoicing:</strong> Draft formal Change Order Invoice for +${additionalFee.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#f59e0b' }}>●</span>
            <span><strong>Project Timeline:</strong> Extend project deadline by +{additionalDays} days to preserve quality</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#38bdf8' }}>●</span>
            <span><strong>Scope Backlog:</strong> Place new request into pending state until client signature</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#a78bfa' }}>●</span>
            <span><strong>3-Option Memo:</strong> Draft executive counter-offer (Approve & Pay, Trade-off feature, or Phase 2)</span>
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
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
          }}
        >
          {isSubmitting ? (
            <>Generating Change Order...</>
          ) : (
            <>
              <ShieldAlert size={15} />
              Approve & Issue Change Order
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
