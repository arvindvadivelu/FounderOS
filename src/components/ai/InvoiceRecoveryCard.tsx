import React, { useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  FileText,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Users,
  CreditCard,
  RotateCcw,
} from 'lucide-react';
import { db } from '../../db/db';
import { updateAIMessage } from '../../db/services/aiStorageService';
import { undoConfirmedToolAction } from '../../ai/undoService';
import { recoverOverdueInvoices } from '../../db/services/founderWorkflowsService';
import type { InvoiceRecoveryPayload, InvoiceRecoveryResult, AIToolCall } from '../../types';

interface InvoiceRecoveryCardProps {
  messageId?: string;
  toolCall?: AIToolCall;
  initialData?: Partial<InvoiceRecoveryPayload>;
  onSuccess?: (result: InvoiceRecoveryResult | null) => void;
  onNavigate?: (route: string) => void;
}

export const InvoiceRecoveryCard: React.FC<InvoiceRecoveryCardProps> = ({
  messageId,
  toolCall,
  initialData,
  onSuccess,
  onNavigate,
}) => {
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(initialData?.gracePeriodDays || 5);
  const [reminderTone, setReminderTone] = useState<'gentle' | 'firm' | 'urgent'>(
    initialData?.reminderTone || 'firm'
  );
  const [minInvoiceAmount, setMinInvoiceAmount] = useState<number>(initialData?.minInvoiceAmount || 0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAlreadyExecuted = toolCall?.status === 'executed';
  const [result, setResult] = useState<InvoiceRecoveryResult | null>(
    isAlreadyExecuted && toolCall?.result ? toolCall.result : null
  );
  const [isUndone, setIsUndone] = useState<boolean>(toolCall?.status === 'undone');
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await recoverOverdueInvoices({
        gracePeriodDays,
        reminderTone,
        minInvoiceAmount: minInvoiceAmount > 0 ? minInvoiceAmount : undefined,
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
      setError(err.message || 'Failed to trigger overdue invoice recovery.');
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
          border: '1px solid rgba(16, 185, 129, 0.35)',
          background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          borderRadius: '12px',
          padding: '18px',
          marginTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)' }}>
            <Banknote size={20} color="#34d399" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#34d399' }}>
              Receivables Cash Recovery Sequence Activated
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Overdue balances tagged • Wire verification tasks scheduled • Recovery audit logged
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
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
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '3px' }}>Total Chased Cash</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399' }}>
              ${result.totalChased.toLocaleString()}
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
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '3px' }}>Invoices Followed Up</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
              {result.invoicesChased.length} Receivables
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
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '3px' }}>Wire Audit Tasks</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#38bdf8' }}>
              {result.tasksCreated.length} Verification Tasks
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
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '3px' }}>Accounts Flagged</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#f59e0b' }}>
              {result.customersFlagged.length} Client Profiles
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
            <CreditCard size={13} />
            View Invoices
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
            View Verification Tasks
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
            View AR Audit Note
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
                Invoice Recovery Sequence Undone & Rolled Back
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {undoMessage || 'Follow-up verification tasks and audit notes were removed, and customer risk flags cleared.'}
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
        border: '1px solid rgba(16, 185, 129, 0.3)',
        background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.04) 0%, rgba(15, 23, 42, 0.7) 100%)',
        borderRadius: '12px',
        padding: '18px',
        marginTop: '12px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)' }}>
          <Banknote size={18} color="#34d399" />
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
            Configure Overdue Invoice Cash Recovery
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Chase outstanding invoices, tag overdue customers, and schedule bank deposit checks
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
            GRACE PERIOD (DAYS BEYOND DUE DATE)
          </label>
          <input
            type="number"
            min={0}
            max={60}
            value={gracePeriodDays}
            onChange={(e) => setGracePeriodDays(Math.max(0, parseInt(e.target.value) || 0))}
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
            REMINDER COMMUNICATION TONE
          </label>
          <select
            value={reminderTone}
            onChange={(e) => setReminderTone(e.target.value as any)}
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
            <option value="gentle">Gentle & Friendly Courtesy Check</option>
            <option value="firm">Professional & Firm Statement</option>
            <option value="urgent">Urgent Final Notice / Suspension Warning</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '5px' }}>
            MINIMUM INVOICE THRESHOLD ($)
          </label>
          <input
            type="number"
            min={0}
            step={50}
            value={minInvoiceAmount}
            onChange={(e) => setMinInvoiceAmount(Math.max(0, parseFloat(e.target.value) || 0))}
            placeholder="0 for all invoices"
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
          AUTOMATIC CASH RECOVERY ACTIONS:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#34d399' }}>●</span>
            <span><strong>Finance & Invoices:</strong> Scan all sent/overdue invoices past {gracePeriodDays} days grace</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#38bdf8' }}>●</span>
            <span><strong>Accounting Tasks:</strong> Schedule prompt bank deposit and wire verification tasks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#f59e0b' }}>●</span>
            <span><strong>Customer Tagging:</strong> Append <code>overdue_notice</code> tag for CRM risk visibility</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#a78bfa' }}>●</span>
            <span><strong>Executive Memo:</strong> Save Accounts Receivable Recovery Audit in Notes</span>
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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          }}
        >
          {isSubmitting ? (
            <>Processing Receivables...</>
          ) : (
            <>
              <Banknote size={15} />
              Approve & Chase Receivables
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
