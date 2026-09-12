import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Clock,
  FileText,
  DollarSign,
  ArrowRight,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { db } from '../../db/db';
import { updateAIMessage } from '../../db/services/aiStorageService';
import { undoConfirmedToolAction } from '../../ai/undoService';
import { auditVendorExpense } from '../../db/services/founderWorkflowsService';
import type { VendorExpensePayload, VendorExpenseResult, AIToolCall } from '../../types';

interface VendorExpenseCardProps {
  messageId?: string;
  toolCall?: AIToolCall;
  initialData?: Partial<VendorExpensePayload>;
  onSuccess?: (result: VendorExpenseResult | null) => void;
  onNavigate?: (route: string) => void;
}

export const VendorExpenseCard: React.FC<VendorExpenseCardProps> = ({
  messageId,
  toolCall,
  initialData,
  onSuccess,
  onNavigate,
}) => {
  const [vendorName, setVendorName] = useState(initialData?.vendorName || 'AWS Cloud & Figma Enterprise');
  const [monthlyCost, setMonthlyCost] = useState<number>(initialData?.monthlyCost || 850);
  const [category, setCategory] = useState(initialData?.category || 'cloud_hosting');
  const [renewalCycle, setRenewalCycle] = useState<'monthly' | 'annual'>(initialData?.renewalCycle || 'monthly');
  const [notes, setNotes] = useState(
    initialData?.notes || 'Core engineering infrastructure and design seats. Tracked against monthly operating burn.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAlreadyExecuted = toolCall?.status === 'executed';
  const [result, setResult] = useState<VendorExpenseResult | null>(
    isAlreadyExecuted && toolCall?.result ? toolCall.result : null
  );
  const [isUndone, setIsUndone] = useState<boolean>(toolCall?.status === 'undone');
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!vendorName.trim()) {
      setError('Please provide a vendor or software tool name.');
      return;
    }
    if (monthlyCost <= 0) {
      setError('Monthly cost must be greater than $0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await auditVendorExpense({
        vendorName: vendorName.trim(),
        monthlyCost,
        category,
        renewalCycle,
        notes,
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
      setError(err.message || 'Failed to record vendor expense.');
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
          border: '1px solid rgba(245, 158, 11, 0.35)',
          background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          borderRadius: '12px',
          padding: '18px',
          marginTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)' }}>
            <TrendingDown size={20} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fbbf24' }}>
              Vendor Expense & Runway Shield Activated!
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Logged recurring expense and renewal audit for <strong>{result.transaction.description}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Finance Outflow</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <DollarSign size={13} /> -${result.transaction.amount.toLocaleString()}/mo
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Runway Health</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <CheckCircle2 size={13} /> ~{result.runwayMonthsEstimate} Months Estimated
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Renewal Audit Task</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <Clock size={13} color="#f59e0b" /> Scheduled in 30 Days
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Contract Notes</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <FileText size={13} color="#38bdf8" /> Saved to Notes
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => jumpTo('/finance')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            View Finance Ledger <ExternalLink size={12} />
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
            View Runway in KPI Center <ExternalLink size={12} />
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
            View Audit Task <ExternalLink size={12} />
          </button>
          <button
            onClick={() => jumpTo('/notes')}
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
            View Contract Note <ExternalLink size={12} />
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
                Vendor Expense Audit Undone & Rolled Back
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {undoMessage || 'Finance expense transaction, renewal audit task, and contract notes were cleanly removed.'}
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
        border: '1px solid rgba(245, 158, 11, 0.3)',
        background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.04) 0%, rgba(15, 23, 42, 0.5) 100%)',
        borderRadius: '12px',
        padding: '18px',
        marginTop: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <CreditCard size={18} color="#f59e0b" />
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
          Vendor Expense & Runway Shield
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            padding: '2px 8px',
            borderRadius: '10px',
            fontWeight: 600,
          }}
        >
          Runway Guard
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Vendor / SaaS Tool
          </label>
          <input
            type="text"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
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

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Monthly Cost ($ USD)
          </label>
          <input
            type="number"
            value={monthlyCost}
            onChange={(e) => setMonthlyCost(parseFloat(e.target.value) || 0)}
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

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-main)',
              fontSize: '13px',
            }}
          >
            <option value="cloud_hosting">Cloud Hosting & Infra</option>
            <option value="software">Software & SaaS Tools</option>
            <option value="marketing">Growth & Marketing</option>
            <option value="legal">Legal & Professional</option>
            <option value="other">Other Operations</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Renewal Frequency
          </label>
          <select
            value={renewalCycle}
            onChange={(e) => setRenewalCycle(e.target.value as any)}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
              color: 'var(--text-main)',
              fontSize: '13px',
            }}
          >
            <option value="monthly">Monthly Recurring</option>
            <option value="annual">Annual Pre-pay</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Contract Terms & Scope Notes
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          border: 'none',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.7 : 1,
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
        }}
      >
        {isSubmitting ? (
          'Logging Vendor & Auditing Runway...'
        ) : (
          <>
            Approve & Track Expense <ArrowRight size={15} />
          </>
        )}
      </button>
    </div>
  );
};
