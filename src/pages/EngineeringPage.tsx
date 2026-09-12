import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Bug as BugIcon,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Search,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import { db } from '../db';
import { MetricCard } from '../components/common/MetricCard';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { createBug, updateBug, deleteBug } from '../db/services/productEngineeringService';
import { formatDate } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import type { Bug, BugSeverity, BugStatus, Priority } from '../types';

const BUG_SEVERITY_CONFIG: Record<
  BugSeverity,
  { color: string; bg: string; border: string; label: string }
> = {
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)', label: 'Critical' },
  high: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', label: 'High' },
  medium: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)', label: 'Medium' },
  low: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)', label: 'Low' },
};

const BUG_STATUS_CONFIG: Record<
  BugStatus,
  { color: string; bg: string; border: string; label: string }
> = {
  reported: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)', label: 'Reported' },
  investigating: { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.25)', label: 'Investigating' },
  in_progress: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', label: 'In Progress' },
  resolved: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)', label: 'Resolved' },
  wont_fix: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)', label: "Won't Fix" },
};

export const EngineeringPage: React.FC = () => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBug, setEditingBug] = useState<Bug | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<BugSeverity>('medium');
  const [status, setStatus] = useState<BugStatus>('reported');
  const [priority, setPriority] = useState<Priority>('medium');
  const [environment, setEnvironment] = useState('Production');
  const [projectId, setProjectId] = useState('');

  // Live Queries
  const bugs = useLiveQuery(async () => await db.bugs.toArray(), []) || [];
  const projects = useLiveQuery(async () => await db.projects.toArray(), []) || [];

  // Metrics
  const criticalBugs = bugs.filter((b) => b.severity === 'critical' && b.status !== 'resolved');
  const openBugs = bugs.filter((b) => b.status !== 'resolved' && b.status !== 'wont_fix');
  const resolvedBugs = bugs.filter((b) => b.status === 'resolved');

  // Filtered List
  const filteredBugs = bugs.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.environment?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSev = severityFilter === 'all' || b.severity === severityFilter;
    const matchesSt = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesSev && matchesSt;
  });

  const openAddModal = () => {
    setEditingBug(null);
    setTitle('');
    setDescription('');
    setSeverity('medium');
    setStatus('reported');
    setPriority('medium');
    setEnvironment('Production');
    setProjectId('');
    setIsModalOpen(true);
  };

  const openEditModal = (b: Bug) => {
    setEditingBug(b);
    setTitle(b.title);
    setDescription(b.description || '');
    setSeverity(b.severity);
    setStatus(b.status);
    setPriority(b.priority);
    setEnvironment(b.environment || 'Production');
    setProjectId(b.projectId || '');
    setIsModalOpen(true);
  };

  const handleSaveBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    if (editingBug) {
      await updateBug(editingBug.id, {
        title,
        description,
        severity,
        status,
        priority,
        environment,
        projectId: projectId || undefined,
      });
      showToast('success', 'Bug Updated', `Bug report "${title}" updated.`);
    } else {
      await createBug({
        title,
        description,
        severity,
        status,
        priority,
        environment,
        projectId: projectId || undefined,
      });
      showToast('success', 'Bug Reported', `Bug "${title}" logged successfully.`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteBug = async (id: string) => {
    if (confirm('Delete this bug report?')) {
      await deleteBug(id);
      showToast('info', 'Bug Deleted', 'Bug report removed.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Editorial Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '10px', // DESIGN.md --radius-small: 10px
              backgroundColor: 'rgba(0, 80, 255, 0.1)',
              border: '1px solid rgba(0, 80, 255, 0.25)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 8px #38bdf8',
              }}
            />
            SYSTEM STABILITY • DEFECT TRIAGE & TELEMETRY
          </div>
          <h1
            style={{
              fontSize: 'clamp(24px, 3vw, 32px)',
              fontWeight: 800,
              color: '#f8fafc',
              letterSpacing: '-0.04em',
              margin: 0,
            }}
          >
            Engineering Stability & Bug Tracker
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', maxWidth: '640px' }}>
            Monitor production anomalies, security observations, regressions, and defect triage workflows.
          </p>
        </div>

        {/* Primary CTA Button with Action Indicator Dot */}
        <button
          type="button"
          onClick={openAddModal}
          style={{
            borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
            padding: '10px 22px',
            backgroundColor: '#0050FF',
            color: '#ffffff',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 14px rgba(0, 80, 255, 0.35)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a66ff')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0050FF')}
        >
          <Plus size={15} />
          <span>Report Bug</span>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              opacity: 0.9,
            }}
          />
        </button>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <MetricCard
          title="Active Defects"
          value={openBugs.length}
          subtitle="Unresolved engineering bugs"
          icon={<BugIcon size={18} />}
        />

        <MetricCard
          title="Critical Blockers"
          value={criticalBugs.length}
          subtitle="High-impact defects"
          changeType={criticalBugs.length > 0 ? 'negative' : 'positive'}
          icon={<ShieldAlert size={18} />}
        />

        <MetricCard
          title="Resolved Defects"
          value={resolvedBugs.length}
          subtitle="Fixed & verified in prod"
          changeType="positive"
          icon={<CheckCircle2 size={18} />}
        />
      </div>

      {/* Main Bugs Table Card */}
      <div
        style={{
          backgroundColor: '#0b0f19',
          borderRadius: '24px', // DESIGN.md --radius-cards: 24px
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '22px 26px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Filter & Search Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          {/* 50px Pill Filter Dropdowns */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '50px', // 50px pill select
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '12.5px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>All Severities</option>
              <option value="critical" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>Critical</option>
              <option value="high" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>High</option>
              <option value="medium" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>Medium</option>
              <option value="low" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '50px', // 50px pill select
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '12.5px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>All Statuses</option>
              <option value="reported" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>Reported</option>
              <option value="investigating" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>Investigating</option>
              <option value="in_progress" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>In Progress</option>
              <option value="resolved" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>Resolved</option>
              <option value="wont_fix" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>Won't Fix</option>
            </select>
          </div>

          {/* 50px Pill Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '14px', top: '11px', color: '#64748b' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bugs, description, env..."
              style={{
                padding: '8px 16px 8px 36px',
                borderRadius: '50px', // 50px pill search
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '12.5px',
                width: '240px',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(0, 80, 255, 0.4)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            />
          </div>
        </div>

        {filteredBugs.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={24} />}
            title="Zero reported bugs"
            description="All systems operating stably. No active defects matching filters."
            actionText="Report New Bug"
            onAction={openAddModal}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Defect / Issue</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Environment</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'center' }}>Mark Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBugs.map((bug) => {
                  const sevCfg = BUG_SEVERITY_CONFIG[bug.severity] || {
                    color: '#94a3b8',
                    bg: 'rgba(148, 163, 184, 0.12)',
                    border: 'rgba(148, 163, 184, 0.25)',
                    label: bug.severity,
                  };
                  const statusCfg = BUG_STATUS_CONFIG[bug.status] || {
                    color: '#38bdf8',
                    bg: 'rgba(56, 189, 248, 0.12)',
                    border: 'rgba(56, 189, 248, 0.25)',
                    label: bug.status,
                  };

                  return (
                    <tr key={bug.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{bug.title}</div>
                        {bug.description && (
                          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px', maxWidth: '360px', lineHeight: 1.4 }}>
                            {bug.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '2px 8px',
                            borderRadius: '10px', // 10px tag chip
                            backgroundColor: sevCfg.bg,
                            border: `1px solid ${sevCfg.border}`,
                            color: sevCfg.color,
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              backgroundColor: sevCfg.color,
                              boxShadow: `0 0 6px ${sevCfg.color}`,
                            }}
                          />
                          {sevCfg.label}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '2px 8px',
                            borderRadius: '10px', // 10px tag chip
                            backgroundColor: statusCfg.bg,
                            border: `1px solid ${statusCfg.border}`,
                            color: statusCfg.color,
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              backgroundColor: statusCfg.color,
                            }}
                          />
                          {statusCfg.label}
                        </div>
                      </td>
                      <td style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{bug.priority}</td>
                      <td style={{ color: '#64748b' }}>{bug.environment || 'Production'}</td>
                      <td style={{ color: '#64748b', fontSize: '11.5px' }}>{formatDate(bug.createdAt)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <select
                          value={bug.status}
                          onChange={(e) => updateBug(bug.id, { status: e.target.value as BugStatus })}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '50px', // 50px pill selector
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#f8fafc',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="reported" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>Reported</option>
                          <option value="investigating" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>Investigating</option>
                          <option value="in_progress" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>In Progress</option>
                          <option value="resolved" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>Resolved</option>
                          <option value="wont_fix" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>Won't Fix</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(bug)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%', // Circular 28px button
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#38bdf8';
                              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#94a3b8';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                            title="Edit Bug"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBug(bug.id)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%', // Circular 28px button
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#ef4444';
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#94a3b8';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                            title="Delete Bug"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Bug Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBug ? 'Edit Bug Details' : 'Report Engineering Defect'}
        subtitle="Log issue reproduction steps, environment, and severity level"
      >
        <form onSubmit={handleSaveBug} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Bug Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CORS rejection on custom AI proxy endpoint"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Description & Reproduction Steps
            </label>
            <textarea
              rows={3}
              placeholder="Observed vs expected behavior..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as BugSeverity)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              >
                <option value="critical">Critical (Blocking)</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BugStatus)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              >
                <option value="reported">Reported</option>
                <option value="investigating">Investigating</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="wont_fix">Won't Fix</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Environment
              </label>
              <input
                type="text"
                placeholder="Production, Staging, Browser"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Linked Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="input-field"
              style={{ borderRadius: '12px' }}
            >
              <option value="">None / General</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                borderRadius: '50px',
                padding: '9px 18px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                borderRadius: '50px',
                padding: '9px 22px',
                backgroundColor: '#0050FF',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 80, 255, 0.35)',
              }}
            >
              <span>{editingBug ? 'Update Bug' : 'Log Bug'}</span>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                }}
              />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
