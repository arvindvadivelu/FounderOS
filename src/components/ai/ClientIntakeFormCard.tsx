import React, { useState } from 'react';
import {
  Rocket,
  CheckCircle2,
  AlertCircle,
  Building2,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  ListTodo,
  FileText,
  User,
  Mail,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { db } from '../../db/db';
import { updateAIMessage } from '../../db/services/aiStorageService';
import { undoConfirmedToolAction } from '../../ai/undoService';
import { onboardClientProject, getDefaultMilestones } from '../../db/services/onboardingService';
import type { ClientOnboardingPayload, ClientOnboardingResult, Priority, AIToolCall } from '../../types';

interface ClientIntakeFormCardProps {
  messageId?: string;
  toolCall?: AIToolCall;
  initialData?: Partial<ClientOnboardingPayload>;
  onSuccess?: (result: ClientOnboardingResult | null) => void;
  onNavigate?: (route: string) => void;
}

export const ClientIntakeFormCard: React.FC<ClientIntakeFormCardProps> = ({
  messageId,
  toolCall,
  initialData,
  onSuccess,
  onNavigate,
}) => {
  const [companyName, setCompanyName] = useState(initialData?.companyName || 'New Client');
  const [contactName, setContactName] = useState(initialData?.contactName || 'Lead Contact');
  const [email, setEmail] = useState(initialData?.email || '');
  const [projectTitle, setProjectTitle] = useState(initialData?.projectTitle || 'Website Design & Development');
  const [serviceCategory, setServiceCategory] = useState(initialData?.serviceCategory || 'Website Development');
  const [totalDealValue, setTotalDealValue] = useState<number>(initialData?.totalDealValue || 2000);
  const [depositAmount, setDepositAmount] = useState<number>(
    initialData?.depositAmount !== undefined ? initialData.depositAmount : Math.round((initialData?.totalDealValue || 2000) * 0.5)
  );
  const [targetDeliveryDate, setTargetDeliveryDate] = useState(
    initialData?.targetDeliveryDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(initialData?.notes || 'Complete website design, responsive layouts, and production deployment.');
  const [showMilestones, setShowMilestones] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAlreadyExecuted = toolCall?.status === 'executed';
  const [result, setResult] = useState<ClientOnboardingResult | null>(
    isAlreadyExecuted && toolCall?.result ? toolCall.result : null
  );
  const [isUndone, setIsUndone] = useState<boolean>(toolCall?.status === 'undone');
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  const milestones = getDefaultMilestones(serviceCategory, projectTitle);

  const handleApproveAndProvision = async () => {
    if (!companyName.trim()) {
      setError('Please provide a client or company name.');
      return;
    }
    if (!projectTitle.trim()) {
      setError('Please provide a project deliverable title.');
      return;
    }
    if (totalDealValue <= 0) {
      setError('Total deal value must be greater than $0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await onboardClientProject({
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        email: email.trim() || `contact@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        projectTitle: projectTitle.trim(),
        serviceCategory,
        totalDealValue,
        depositAmount,
        targetDeliveryDate,
        notes,
        milestones: milestones.map((m) => ({ title: m.title, priority: m.priority })),
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

      onSuccess?.(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to onboard client project');
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
        onSuccess?.(null as any);
      } else {
        setError(undoRes.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to undo action.');
    } finally {
      setIsUndoing(false);
    }
  };

  // If already provisioned, render the completed success showcase
  if (result) {
    return (
      <div
        style={{
          marginTop: '14px',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#34d399', margin: 0 }}>
              🎉 Client Onboarded & 7 Modules Auto-Provisioned!
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              All records were atomically committed to local IndexedDB. No manual sidebar entry required.
            </p>
          </div>
        </div>

        {/* Provisioned Breakdown Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Customers CRM</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
              ✓ {result.customer.companyName} <span style={{ fontSize: '11px', color: '#34d399' }}>(Active Client)</span>
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sales Pipeline</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
              ✓ Deal Won: ${result.deal.value.toLocaleString()} USD
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Finance & Ledger</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
              ✓ Invoice #{result.invoice.invoiceNumber} + ${result.transaction?.amount.toLocaleString() || '0'} Deposit
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Project Workspace</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
              ✓ {result.project.name}
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tasks & Milestones</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
              ✓ {result.tasks.length} Milestone Tasks scheduled
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes & Strategy</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
              ✓ Pinned Kickoff Brief published
            </div>
          </div>
        </div>

        {result.goalUpdated && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: '12px',
              color: '#fbbf24',
              marginBottom: '16px',
            }}
          >
            🎯 <strong>Quarterly OKR Incremented:</strong> "{result.goalUpdated.goalTitle}" progress increased from ${result.goalUpdated.previousValue.toLocaleString()} to <strong>${result.goalUpdated.newValue.toLocaleString()}</strong>.
          </div>
        )}

        {/* Direct Action Links */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => (window.location.hash = '/projects')}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <Layers size={13} /> View Project
          </button>
          <button
            type="button"
            onClick={() => (window.location.hash = '/tasks')}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <ListTodo size={13} /> View Tasks ({result.tasks.length})
          </button>
          <button
            type="button"
            onClick={() => (window.location.hash = '/customers')}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <User size={13} /> View Customer
          </button>
          <button
            type="button"
            onClick={() => (window.location.hash = '/finance')}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <DollarSign size={13} /> View Ledger
          </button>
          <button
            type="button"
            onClick={() => (window.location.hash = '/notes')}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <FileText size={13} /> View Kickoff Brief
          </button>

          {messageId && toolCall && (
            <button
              type="button"
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
                Client Provisioning Undone & Rolled Back
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {undoMessage || 'Customer, project, invoice, and milestone tasks were cleanly removed from local storage.'}
              </div>
            </div>
          </div>
          <button
            type="button"
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
        marginTop: '14px',
        padding: '20px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-medium)',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
      }}
    >
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'rgba(0, 80, 255, 0.15)',
            color: 'var(--brand-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles size={18} />
        </div>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Instant Client Deal Intake & Provisioning
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Review or adjust details. Clicking Approve will automatically populate 7 sidebar modules.
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            fontSize: '12.5px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Form Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '14px' }}>
        {/* Company Name */}
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
            Client / Company Name *
          </label>
          <div style={{ position: 'relative' }}>
            <Building2 size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-main)',
                fontSize: '13px',
              }}
            />
          </div>
        </div>

        {/* Project Title */}
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
            Project Deliverable Title *
          </label>
          <div style={{ position: 'relative' }}>
            <Layers size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g. Custom Web Design & Development"
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-main)',
                fontSize: '13px',
              }}
            />
          </div>
        </div>

        {/* Contact Name */}
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
            Primary Contact Person
          </label>
          <div style={{ position: 'relative' }}>
            <User size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-main)',
                fontSize: '13px',
              }}
            />
          </div>
        </div>

        {/* Contact Email */}
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
            Contact Email
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-dim)' }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sarah@acme.com"
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-main)',
                fontSize: '13px',
              }}
            />
          </div>
        </div>

        {/* Total Deal Value */}
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
            Total Contract Value (USD) *
          </label>
          <div style={{ position: 'relative' }}>
            <DollarSign size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-dim)' }} />
            <input
              type="number"
              value={totalDealValue}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setTotalDealValue(val);
                setDepositAmount(Math.round(val * 0.5));
              }}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            />
          </div>
        </div>

        {/* Upfront Deposit */}
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
            Initial Upfront Deposit (USD)
          </label>
          <div style={{ position: 'relative' }}>
            <DollarSign size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-dim)' }} />
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-main)',
                fontSize: '13px',
              }}
            />
          </div>
        </div>

        {/* Target Delivery Date */}
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
            Target Launch / Delivery Date
          </label>
          <div style={{ position: 'relative' }}>
            <Calendar size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-dim)' }} />
            <input
              type="date"
              value={targetDeliveryDate}
              onChange={(e) => setTargetDeliveryDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-main)',
                fontSize: '13px',
              }}
            />
          </div>
        </div>

        {/* Service Scope Dropdown */}
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
            Service Scope / Category
          </label>
          <select
            value={serviceCategory}
            onChange={(e) => setServiceCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-main)',
              fontSize: '13px',
            }}
          >
            <option value="Website Development">Website Development</option>
            <option value="Mobile App">Mobile App Development</option>
            <option value="AI Consulting">AI Consulting & Architecture</option>
            <option value="UI/UX Design">UI/UX Design & Branding</option>
            <option value="Custom Software">Custom Software Engineering</option>
          </select>
        </div>
      </div>

      {/* Scope Notes */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px' }}>
          Scope Notes & Requirements
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Summary of client deliverables..."
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-main)',
            fontSize: '13px',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Collapsible Milestones Preview */}
      <div style={{ marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setShowMilestones(!showMilestones)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--brand-accent)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: 0,
          }}
        >
          {showMilestones ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{showMilestones ? 'Hide' : 'Preview'} Auto-Generated Milestone Tasks ({milestones.length})</span>
        </button>

        {showMilestones && (
          <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '6px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-faint)' }}>
            {milestones.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', padding: '4px 0', color: 'var(--text-main)' }}>
                <CheckCircle2 size={13} color="var(--brand-accent)" />
                <span>{m.title}</span>
                <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginLeft: 'auto' }}>
                  {m.priority} priority • {m.estimatedMinutes}m
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-faint)', paddingTop: '14px' }}>
        <div style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
          ⚡ 1-Click provisions: CRM, Sales, Invoice, Transaction, Project, Tasks, Note & OKR
        </div>

        <button
          type="button"
          onClick={handleApproveAndProvision}
          disabled={isSubmitting}
          className="btn-primary"
          style={{
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(0, 80, 255, 0.4)',
          }}
        >
          <Rocket size={15} />
          <span>{isSubmitting ? 'Provisioning Entire Company...' : 'Approve & Auto-Provision Entire Company'}</span>
        </button>
      </div>
    </div>
  );
};
