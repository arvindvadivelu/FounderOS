import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  RefreshCw,
  Sliders,
  Filter,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { db } from '../db';
import { WorkflowEngine, FOUNDER_WORKFLOW_RECIPES } from '../engines/workflowEngine';
import type { WorkflowRule, WorkflowExecutionLog } from '../types';

export const WorkflowsPage: React.FC = () => {
  const workflows = useLiveQuery(() => db.workflows.toArray(), []);
  const logs = useLiveQuery(() => db.workflowLogs.orderBy('executedAt').reverse().limit(20).toArray(), []);

  const [executingId, setExecutingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'workflows' | 'logs'>('workflows');
  const [lastExecutedLog, setLastExecutedLog] = useState<WorkflowExecutionLog | null>(null);

  const handleToggleActive = async (wf: WorkflowRule) => {
    await db.workflows.update(wf.id, {
      isActive: !wf.isActive,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleTestRun = async (wf: WorkflowRule) => {
    setExecutingId(wf.id);
    try {
      const log = await WorkflowEngine.executeWorkflow(wf, {
        source: 'manual_dashboard_test',
        amount: 2500,
        healthScore: 45,
        runwayMonths: 5.4,
        severity: 'critical',
      });
      setLastExecutedLog(log);
    } finally {
      setExecutingId(null);
    }
  };

  const handleRunAllActive = async () => {
    setExecutingId('all');
    try {
      const runLogs = await WorkflowEngine.runAllActiveWorkflows();
      if (runLogs.length > 0) {
        setLastExecutedLog(runLogs[0]);
      }
    } finally {
      setExecutingId(null);
    }
  };

  const filteredWorkflows = workflows
    ? workflows.filter(w => selectedCategory === 'all' || w.category === selectedCategory)
    : [];

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.35) 0%, rgba(139, 92, 246, 0.15) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(59, 130, 246, 0.25)',
                flexShrink: 0,
              }}
            >
              <Zap size={20} color="#38bdf8" />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.035em', margin: 0 }}>
              Automated Workflows & Triggers
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                padding: '3px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              V2 AUTOPILOT
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0 }}>
            Configure event-driven triggers, conditional filters, and automated founder interventions across revenue, retention, and cash.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleRunAllActive}
            disabled={executingId !== null}
            style={{
              padding: '9px 18px',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={15} className={executingId === 'all' ? 'spin' : ''} />
            Evaluate Active Triggers
          </button>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '22px',
          borderBottom: '1px solid var(--border-faint)',
          paddingBottom: '12px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('workflows')}
            style={{
              padding: '7px 18px',
              borderRadius: '50px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'workflows' ? 'var(--brand-accent)' : 'transparent',
              color: activeTab === 'workflows' ? '#fff' : 'var(--text-muted)',
              boxShadow: activeTab === 'workflows' ? '0 0 12px rgba(0, 80, 255, 0.35)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Configured Workflows ({workflows?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '7px 18px',
              borderRadius: '50px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'logs' ? 'var(--brand-accent)' : 'transparent',
              color: activeTab === 'logs' ? '#fff' : 'var(--text-muted)',
              boxShadow: activeTab === 'logs' ? '0 0 12px rgba(0, 80, 255, 0.35)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Execution Audit Logs ({logs?.length || 0})
          </button>
        </div>

        {activeTab === 'workflows' && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', marginRight: '6px' }}>Category:</span>
            {['all', 'finance', 'retention', 'sales', 'engineering'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? 'var(--brand-accent)' : 'var(--border-faint)',
                  backgroundColor: selectedCategory === cat ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)',
                  color: selectedCategory === cat ? '#38bdf8' : 'var(--text-muted)',
                  textTransform: 'capitalize',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Live Feedback Toast if Last Execution Log Exists */}
      {lastExecutedLog && (
        <div
          style={{
            marginBottom: '20px',
            padding: '14px 18px',
            borderRadius: '8px',
            backgroundColor: lastExecutedLog.status === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${lastExecutedLog.status === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {lastExecutedLog.status === 'success' ? (
              <CheckCircle2 size={18} color="#10b981" />
            ) : (
              <AlertTriangle size={18} color="#f59e0b" />
            )}
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                {lastExecutedLog.workflowName}:
              </span>{' '}
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                {lastExecutedLog.summary} ({lastExecutedLog.durationMs}ms)
              </span>
            </div>
          </div>
          <button
            onClick={() => setLastExecutedLog(null)}
            style={{ fontSize: '12px', color: 'var(--text-dim)', border: 'none', background: 'none', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab 1: Workflows List */}
      {activeTab === 'workflows' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '18px' }}>
          {filteredWorkflows.map(wf => (
            <div
              key={wf.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                position: 'relative',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor:
                        wf.category === 'finance'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : wf.category === 'retention'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : wf.category === 'sales'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(59, 130, 246, 0.15)',
                      color:
                        wf.category === 'finance'
                          ? '#34d399'
                          : wf.category === 'retention'
                          ? '#f87171'
                          : wf.category === 'sales'
                          ? '#fbbf24'
                          : '#60a5fa',
                    }}
                  >
                    {wf.category}
                  </span>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    {wf.name}
                  </h3>
                </div>

                {/* Active Toggle */}
                <button
                  onClick={() => handleToggleActive(wf)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: wf.isActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(156, 163, 175, 0.3)',
                    backgroundColor: wf.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(156, 163, 175, 0.1)',
                    color: wf.isActive ? '#10b981' : 'var(--text-dim)',
                  }}
                >
                  {wf.isActive ? 'Active' : 'Paused'}
                </button>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                {wf.description}
              </p>

              {/* Trigger -> Conditions -> Actions Flow Visualizer */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-faint)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-dim)', width: '70px' }}>TRIGGER:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600, fontFamily: 'monospace' }}>
                    {wf.triggerType}
                  </span>
                </div>

                {wf.conditions.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-dim)', width: '70px' }}>IF:</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 500, fontFamily: 'monospace' }}>
                      {wf.conditions.map(c => `${c.field} ${c.operator} ${c.value}`).join(' AND ')}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-dim)', width: '70px', paddingTop: '2px' }}>
                    THEN:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {wf.actions.map((act, i) => (
                      <span key={i} style={{ color: '#34d399', fontWeight: 600 }}>
                        ↳ {act.description}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Meta & Test Trigger */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-faint)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: 'var(--text-dim)' }}>
                  <span>Runs: {wf.runCount || 0}</span>
                  {wf.lastRunAt && <span>Last: {new Date(wf.lastRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>

                <button
                  onClick={() => handleTestRun(wf)}
                  disabled={executingId !== null}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Play size={12} />
                  Test Trigger
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Execution Audit Logs */}
      {activeTab === 'logs' && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '12px 18px', color: 'var(--text-dim)', fontWeight: 700 }}>TIMESTAMP</th>
                <th style={{ padding: '12px 18px', color: 'var(--text-dim)', fontWeight: 700 }}>WORKFLOW</th>
                <th style={{ padding: '12px 18px', color: 'var(--text-dim)', fontWeight: 700 }}>TRIGGER SOURCE</th>
                <th style={{ padding: '12px 18px', color: 'var(--text-dim)', fontWeight: 700 }}>STATUS</th>
                <th style={{ padding: '12px 18px', color: 'var(--text-dim)', fontWeight: 700 }}>DURATION</th>
                <th style={{ padding: '12px 18px', color: 'var(--text-dim)', fontWeight: 700 }}>SUMMARY</th>
              </tr>
            </thead>
            <tbody>
              {logs && logs.length > 0 ? (
                logs.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--border-faint)' }}>
                    <td style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>
                      {new Date(l.executedAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {l.workflowName}
                    </td>
                    <td style={{ padding: '12px 18px', fontFamily: 'monospace', color: '#38bdf8' }}>
                      {l.triggerSource}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor:
                            l.status === 'success'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : l.status === 'warning'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          color:
                            l.status === 'success' ? '#10b981' : l.status === 'warning' ? '#f59e0b' : '#ef4444',
                        }}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', color: 'var(--text-dim)' }}>
                      {l.durationMs}ms
                    </td>
                    <td style={{ padding: '12px 18px', color: 'var(--text-muted)' }}>
                      {l.summary}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No workflow execution logs recorded yet. Click "Test Trigger" or "Evaluate Active Triggers" to see live execution history.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
