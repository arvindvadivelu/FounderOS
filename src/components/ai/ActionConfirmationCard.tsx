import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  ShieldAlert,
  Sparkles,
  Loader2,
  ArrowRight,
  AlertTriangle,
  Database,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { executeConfirmedToolAction } from '../../ai/toolRunner';
import { getActionPreview } from '../../ai/actionPreviewService';
import { undoConfirmedToolAction } from '../../ai/undoService';
import type { AIToolCall, ActionPreview } from '../../types';

interface ActionConfirmationCardProps {
  messageId: string;
  toolCall: AIToolCall;
  onExecuted?: () => void;
}

export const ActionConfirmationCard: React.FC<ActionConfirmationCardProps> = ({
  messageId,
  toolCall,
  onExecuted,
}) => {
  const [status, setStatus] = useState<'pending' | 'executing' | 'executed' | 'cancelled' | 'undone'>(
    toolCall.status === 'executed'
      ? 'executed'
      : toolCall.status === 'cancelled'
      ? 'cancelled'
      : toolCall.status === 'undone'
      ? 'undone'
      : 'pending'
  );
  const [preview, setPreview] = useState<ActionPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  const isDestructive = toolCall.name.startsWith('delete');
  const [destructiveConfirmed, setDestructiveConfirmed] = useState(!isDestructive);

  useEffect(() => {
    let isMounted = true;
    getActionPreview(toolCall.name, toolCall.arguments)
      .then((p) => {
        if (isMounted) {
          setPreview(p);
          setLoadingPreview(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to generate action preview.');
          setLoadingPreview(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [toolCall.name, toolCall.arguments]);

  const handleConfirm = async () => {
    if (isDestructive && !destructiveConfirmed) {
      setError('Please check the confirmation box to proceed with permanent deletion.');
      return;
    }
    if (preview && preview.exists === false) {
      setError(`Cannot execute: ${preview.warning || 'Target record not found in local database.'}`);
      return;
    }

    setStatus('executing');
    setError(null);
    try {
      const { success, verification } = await executeConfirmedToolAction(
        messageId,
        toolCall.id,
        toolCall.name,
        toolCall.arguments
      );

      if (success) {
        setStatus('executed');
        if (verification?.message) {
          setVerificationMessage(verification.message);
        }
        onExecuted?.();
      }
    } catch (err: any) {
      setStatus('pending');
      setError(err.message || 'Execution failed against IndexedDB');
    }
  };

  const handleUndo = async () => {
    setIsUndoing(true);
    setError(null);
    try {
      const undoRes = await undoConfirmedToolAction(
        messageId,
        toolCall.id,
        toolCall.name,
        toolCall.result,
        toolCall.arguments
      );
      if (undoRes.success) {
        setStatus('undone');
      } else {
        setError(undoRes.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to undo action.');
    } finally {
      setIsUndoing(false);
    }
  };

  const handleCancel = () => {
    setStatus('cancelled');
  };

  return (
    <div
      style={{
        marginTop: '14px',
        marginBottom: '14px',
        padding: '16px 18px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: isDestructive ? 'rgba(244, 63, 94, 0.04)' : 'var(--bg-surface-elevated)',
        border: `1px solid ${
          isDestructive ? 'rgba(244, 63, 94, 0.35)' : 'var(--border-active)'
        }`,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDestructive ? (
            <ShieldAlert size={17} color="var(--accent-rose)" />
          ) : (
            <Sparkles size={17} color="var(--brand-accent)" />
          )}
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: isDestructive ? 'var(--accent-rose)' : 'var(--brand-accent)',
            }}
          >
            {isDestructive ? 'High-Impact Action Request' : 'Proposed Database Action'}
          </span>
        </div>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '999px',
            backgroundColor:
              status === 'executed'
                ? 'rgba(16, 185, 129, 0.15)'
                : status === 'cancelled' || status === 'undone'
                ? 'rgba(148, 163, 184, 0.15)'
                : isDestructive
                ? 'rgba(244, 63, 94, 0.15)'
                : 'rgba(0, 80, 255, 0.15)',
            color:
              status === 'executed'
                ? '#34d399'
                : status === 'cancelled' || status === 'undone'
                ? 'var(--text-muted)'
                : isDestructive
                ? '#fb7185'
                : 'var(--brand-accent)',
          }}
        >
          {status === 'executed'
            ? 'Executed & Verified'
            : status === 'undone'
            ? 'Action Undone & Rolled Back'
            : status === 'cancelled'
            ? 'Cancelled'
            : isDestructive
            ? 'Requires Strong Confirmation'
            : 'Awaiting Confirmation'}
        </span>
      </div>

      {/* Target Record & Action Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-main)' }}>
            {preview?.displayName || toolCall.name}
          </h4>
          {preview?.targetEntity && (
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-faint)',
                color: 'var(--text-muted)',
              }}
            >
              {preview.targetEntity}
            </span>
          )}
        </div>

        {preview?.targetRecordTitle && (
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Target Record: <strong style={{ color: 'var(--text-main)' }}>{preview.targetRecordTitle}</strong>
          </p>
        )}
      </div>

      {/* Warning banner if record missing or destructive */}
      {preview?.warning && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: preview.exists === false ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${preview.exists === false ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            color: preview.exists === false ? '#f87171' : '#fbbf24',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>{preview.warning}</span>
        </div>
      )}

      {/* Action Preview: Field Diffs Table */}
      {loadingPreview ? (
        <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
          <Loader2 size={13} className="animate-spin" /> Analyzing target database record...
        </div>
      ) : (
        preview && preview.diffs.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-faint)',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-faint)' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 600, width: '30%' }}>Field</th>
                  {preview.diffs.some((d) => d.oldValue !== undefined) && (
                    <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 600, width: '35%' }}>Current Value</th>
                  )}
                  <th style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 600 }}>Proposed Value</th>
                </tr>
              </thead>
              <tbody>
                {preview.diffs.map((diff) => (
                  <tr key={diff.field} style={{ borderBottom: '1px solid var(--border-faint)' }}>
                    <td style={{ padding: '6px 10px', color: 'var(--text-dim)', fontWeight: 500 }}>
                      {diff.label}
                    </td>
                    {preview.diffs.some((d) => d.oldValue !== undefined) && (
                      <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>
                        <span style={{ textDecoration: diff.oldValue !== diff.newValue ? 'line-through' : 'none' }}>
                          {String(diff.oldValue ?? '(none)')}
                        </span>
                      </td>
                    )}
                    <td style={{ padding: '6px 10px', color: isDestructive ? '#fb7185' : 'var(--brand-accent)', fontWeight: 600 }}>
                      {String(diff.newValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Strong Confirmation Checkbox for Destructive Actions */}
      {isDestructive && status === 'pending' && (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#fb7185',
            backgroundColor: 'rgba(244, 63, 94, 0.08)',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={destructiveConfirmed}
            onChange={(e) => setDestructiveConfirmed(e.target.checked)}
            style={{ cursor: 'pointer', accentColor: 'var(--accent-rose)' }}
          />
          <span>I understand this will permanently delete this record from local storage.</span>
        </label>
      )}

      {error && (
        <p style={{ fontSize: '12px', color: 'var(--accent-rose)', margin: '2px 0' }}>
          {error}
        </p>
      )}

      {/* Action Buttons */}
      {status === 'pending' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '2px' }}>
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            <X size={14} /> Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={(isDestructive && !destructiveConfirmed) || (preview?.exists === false)}
            className={isDestructive ? 'btn-danger' : 'btn-primary'}
            style={{
              padding: '6px 16px',
              fontSize: '12px',
              opacity: (isDestructive && !destructiveConfirmed) || (preview?.exists === false) ? 0.5 : 1,
              cursor: (isDestructive && !destructiveConfirmed) || (preview?.exists === false) ? 'not-allowed' : 'pointer',
            }}
          >
            <Check size={14} /> {isDestructive ? 'Permanently Delete' : 'Confirm & Execute'}
          </button>
        </div>
      )}

      {status === 'executing' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-accent)', fontSize: '12.5px', padding: '4px 0' }}>
          <Loader2 size={14} className="animate-spin" /> Executing & verifying in local IndexedDB...
        </div>
      )}

      {status === 'executed' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', padding: '2px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '12.5px', fontWeight: 600 }}>
            <Check size={14} /> {verificationMessage || 'Action verified & committed to local database.'}
          </div>
          <button
            type="button"
            onClick={handleUndo}
            disabled={isUndoing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              fontSize: '11.5px',
              fontWeight: 600,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              cursor: isUndoing ? 'not-allowed' : 'pointer',
            }}
          >
            <RotateCcw size={12} />
            {isUndoing ? 'Undoing...' : 'Undo'}
          </button>
        </div>
      )}

      {status === 'undone' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', padding: '4px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12.5px' }}>
            <RotateCcw size={14} /> Action undone & rolled back from local database.
          </div>
          <button
            type="button"
            onClick={() => setStatus('pending')}
            className="btn-secondary"
            style={{ fontSize: '11.5px', padding: '4px 10px' }}
          >
            Re-confirm
          </button>
        </div>
      )}

      {status === 'cancelled' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '12px', fontStyle: 'italic', padding: '2px 0' }}>
          <X size={13} /> Action was cancelled by founder. No database changes were made.
        </div>
      )}
    </div>
  );
};
