import React, { useState } from 'react';
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Users,
  DollarSign,
  ListTodo,
  Target,
  ArrowRight,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { db } from '../../db/db';
import { updateAIMessage } from '../../db/services/aiStorageService';
import { undoConfirmedToolAction } from '../../ai/undoService';
import { onboardEmployee } from '../../db/services/founderWorkflowsService';
import type { EmployeeOnboardingPayload, EmployeeOnboardingResult, AIToolCall } from '../../types';

interface EmployeeOnboardingCardProps {
  messageId?: string;
  toolCall?: AIToolCall;
  initialData?: Partial<EmployeeOnboardingPayload>;
  onSuccess?: (result: EmployeeOnboardingResult | null) => void;
  onNavigate?: (route: string) => void;
}

export const EmployeeOnboardingCard: React.FC<EmployeeOnboardingCardProps> = ({
  messageId,
  toolCall,
  initialData,
  onSuccess,
  onNavigate,
}) => {
  const [name, setName] = useState(initialData?.name || 'Alex Rivera');
  const [role, setRole] = useState(initialData?.role || 'Full-Stack Engineer');
  const [departmentName, setDepartmentName] = useState(initialData?.departmentName || 'Engineering');
  const [monthlySalary, setMonthlySalary] = useState<number>(initialData?.monthlySalary || 4500);
  const [startDate, setStartDate] = useState(
    initialData?.startDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAlreadyExecuted = toolCall?.status === 'executed';
  const [result, setResult] = useState<EmployeeOnboardingResult | null>(
    isAlreadyExecuted && toolCall?.result ? toolCall.result : null
  );
  const [isUndone, setIsUndone] = useState<boolean>(toolCall?.status === 'undone');
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!name.trim()) {
      setError('Please provide the employee name.');
      return;
    }
    if (!role.trim()) {
      setError('Please provide the job role.');
      return;
    }
    if (monthlySalary <= 0) {
      setError('Salary must be greater than $0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await onboardEmployee({
        name: name.trim(),
        role: role.trim(),
        departmentName: departmentName.trim(),
        monthlySalary,
        startDate,
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
      setError(err.message || 'Failed to onboard team member.');
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
          border: '1px solid rgba(16, 185, 129, 0.35)',
          background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          borderRadius: '12px',
          padding: '18px',
          marginTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)' }}>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>
              Team Member Successfully Onboarded!
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Auto-provisioned directory, payroll, checklist, and OKR for <strong>{result.employee.name}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Team Directory</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <Users size={13} color="#38bdf8" /> {result.employee.name} ({result.department.name})
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Finance Payroll</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <DollarSign size={13} /> ${result.transaction.amount.toLocaleString()}/mo Recurring
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ramp Checklist</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <ListTodo size={13} color="#f59e0b" /> 5 Tasks Scheduled
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>90-Day Milestone</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <Target size={13} color="#a855f7" /> Initialized
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => jumpTo('/team')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            View Team Directory <ExternalLink size={12} />
          </button>
          <button
            onClick={() => jumpTo('/finance')}
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
            View Payroll Ledger <ExternalLink size={12} />
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
            View Ramp Tasks <ExternalLink size={12} />
          </button>
          <button
            onClick={() => jumpTo('/goals')}
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
            View 90-Day Goal <ExternalLink size={12} />
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
                Employee Onboarding Undone & Rolled Back
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {undoMessage || 'Employee record, payroll transaction, ramp tasks, and 90-day goal were cleanly removed.'}
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
        border: '1px solid rgba(16, 185, 129, 0.3)',
        background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.04) 0%, rgba(15, 23, 42, 0.5) 100%)',
        borderRadius: '12px',
        padding: '18px',
        marginTop: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <UserPlus size={18} color="#10b981" />
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
          Instant Team Member Onboarding
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            padding: '2px 8px',
            borderRadius: '10px',
            fontWeight: 600,
          }}
        >
          4-Module Auto-Provision
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            Role / Title
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
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
            Department
          </label>
          <select
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
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
            <option value="Engineering">Engineering</option>
            <option value="Product">Product</option>
            <option value="Design">Design</option>
            <option value="Growth">Growth / Sales</option>
            <option value="Operations">Operations</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Monthly Salary ($ USD)
          </label>
          <input
            type="number"
            value={monthlySalary}
            onChange={(e) => setMonthlySalary(parseFloat(e.target.value) || 0)}
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
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
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
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          border: 'none',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.7 : 1,
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
        }}
      >
        {isSubmitting ? (
          'Onboarding Team Member...'
        ) : (
          <>
            Approve & Onboard Team Member <ArrowRight size={15} />
          </>
        )}
      </button>
    </div>
  );
};
