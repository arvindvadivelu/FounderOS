import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  ListTodo,
  FileCode,
  ArrowRight,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { db } from '../../db/db';
import { updateAIMessage } from '../../db/services/aiStorageService';
import { undoConfirmedToolAction } from '../../ai/undoService';
import { launchFeatureSprint } from '../../db/services/founderWorkflowsService';
import type { FeatureSprintPayload, FeatureSprintResult, Priority, AIToolCall } from '../../types';

interface FeatureSprintCardProps {
  messageId?: string;
  toolCall?: AIToolCall;
  initialData?: Partial<FeatureSprintPayload>;
  onSuccess?: (result: FeatureSprintResult | null) => void;
  onNavigate?: (route: string) => void;
}

export const FeatureSprintCard: React.FC<FeatureSprintCardProps> = ({
  messageId,
  toolCall,
  initialData,
  onSuccess,
  onNavigate,
}) => {
  const [title, setTitle] = useState(initialData?.title || 'Invoice PDF & CSV Multi-Format Export');
  const [description, setDescription] = useState(
    initialData?.description || 'Enable 1-click download of filtered financial invoices in formatted PDF and raw CSV formats.'
  );
  const [priority, setPriority] = useState<Priority>(initialData?.priority || 'high');
  const [impact, setImpact] = useState<'high' | 'medium' | 'low'>(initialData?.impact || 'high');
  const [effort, setEffort] = useState<'high' | 'medium' | 'low'>(initialData?.effort || 'medium');
  const [projectName, setProjectName] = useState(initialData?.projectName || 'Core Product Sprints');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAlreadyExecuted = toolCall?.status === 'executed';
  const [result, setResult] = useState<FeatureSprintResult | null>(
    isAlreadyExecuted && toolCall?.result ? toolCall.result : null
  );
  const [isUndone, setIsUndone] = useState<boolean>(toolCall?.status === 'undone');
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!title.trim()) {
      setError('Please provide a feature title.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await launchFeatureSprint({
        title: title.trim(),
        description: description.trim(),
        priority,
        impact,
        effort,
        projectName,
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
      setError(err.message || 'Failed to launch feature sprint.');
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
          border: '1px solid rgba(59, 130, 246, 0.35)',
          background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          borderRadius: '12px',
          padding: '18px',
          marginTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.2)' }}>
            <Zap size={20} color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#60a5fa' }}>
              Feature Sprint Successfully Launched!
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Provisions created for <strong>{result.feature.title}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Product Roadmap</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <CheckCircle2 size={13} /> {result.feature.priority.toUpperCase()} Backlog
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Project</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <FolderGit2 size={13} color="#a855f7" /> {result.project?.name || 'Core Sprints'}
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sprint Tasks</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <ListTodo size={13} color="#f59e0b" /> {result.tasks.length} Subtasks
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Specification</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <FileCode size={13} color="#10b981" /> Mini-PRD Saved
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => jumpTo('/features')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            View Roadmap <ExternalLink size={12} />
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
            View Sprint Tasks <ExternalLink size={12} />
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
            View Mini-PRD <ExternalLink size={12} />
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
                Feature Sprint Undone & Rolled Back
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {undoMessage || 'Feature backlog item, subtasks, and PRD specification note were cleanly removed.'}
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
        border: '1px solid rgba(59, 130, 246, 0.3)',
        background: 'linear-gradient(145deg, rgba(59, 130, 246, 0.04) 0%, rgba(15, 23, 42, 0.5) 100%)',
        borderRadius: '12px',
        padding: '18px',
        marginTop: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Zap size={18} color="#3b82f6" />
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
          Feature Spec to Engineering Sprint
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            background: 'rgba(59, 130, 246, 0.15)',
            color: '#60a5fa',
            padding: '2px 8px',
            borderRadius: '10px',
            fontWeight: 600,
          }}
        >
          Sprint Architect
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

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Feature Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
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
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Strategic Impact
          </label>
          <select
            value={impact}
            onChange={(e) => setImpact(e.target.value as any)}
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
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Estimated Effort
          </label>
          <select
            value={effort}
            onChange={(e) => setEffort(e.target.value as any)}
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
            <option value="low">Low (1-2 days)</option>
            <option value="medium">Medium (3-5 days)</option>
            <option value="high">High (1-2 weeks)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Target Project
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
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
          Feature Description / User Story
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          border: 'none',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          opacity: isSubmitting ? 0.7 : 1,
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
        }}
      >
        {isSubmitting ? (
          'Launching Sprint...'
        ) : (
          <>
            Approve & Launch Sprint <ArrowRight size={15} />
          </>
        )}
      </button>
    </div>
  );
};
