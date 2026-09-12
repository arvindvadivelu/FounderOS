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
} from 'lucide-react';
import { db } from '../db';
import { SpotlightCard } from '../components/common/SpotlightCard';
import { MetricCard } from '../components/common/MetricCard';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { createBug, updateBug, deleteBug } from '../db/services/productEngineeringService';
import { formatDate } from '../utils/formatters';
import type { Bug, BugSeverity, BugStatus, Priority } from '../types';

export const EngineeringPage: React.FC = () => {
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
    }

    setIsModalOpen(false);
  };

  const handleDeleteBug = async (id: string) => {
    if (confirm('Delete this bug report?')) {
      await deleteBug(id);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
            Engineering Stability & Bug Tracker
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Monitor production anomalies, security observations, and defect resolutions.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn-primary"
        >
          <Plus size={15} /> Report Bug
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
          icon={<AlertTriangle size={18} />}
        />

        <MetricCard
          title="Resolved Defects"
          value={resolvedBugs.length}
          subtitle="Fixed & verified in prod"
          changeType="positive"
          icon={<CheckCircle2 size={18} />}
        />
      </div>

      {/* Main Bugs Table */}
      <SpotlightCard style={{ padding: '20px 24px' }}>
        {/* Filter & Search Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
            >
              <option value="all">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="investigating">Investigating</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="wont_fix">Won't Fix</option>
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bugs, description, env..."
              className="input-field"
              style={{ paddingLeft: '32px', width: '220px', padding: '6px 10px 6px 32px', fontSize: '12.5px' }}
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
            <table className="data-table">
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
                {filteredBugs.map((bug) => (
                  <tr key={bug.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{bug.title}</div>
                      {bug.description && (
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '350px' }}>
                          {bug.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(bug.severity)}>{bug.severity}</Badge>
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(bug.status)}>{bug.status.replace('_', ' ')}</Badge>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{bug.priority}</td>
                    <td style={{ color: 'var(--text-dim)' }}>{bug.environment || 'Production'}</td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '11.5px' }}>{formatDate(bug.createdAt)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <select
                        value={bug.status}
                        onChange={(e) => updateBug(bug.id, { status: e.target.value as BugStatus })}
                        className="input-field"
                        style={{ padding: '2px 8px', fontSize: '11.5px', width: 'auto' }}
                      >
                        <option value="reported">reported</option>
                        <option value="investigating">investigating</option>
                        <option value="in_progress">in_progress</option>
                        <option value="resolved">resolved</option>
                        <option value="wont_fix">wont_fix</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => openEditModal(bug)}
                          style={{ padding: '4px', color: 'var(--text-muted)' }}
                          title="Edit Bug"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBug(bug.id)}
                          style={{ padding: '4px', color: 'var(--text-dim)' }}
                          title="Delete Bug"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SpotlightCard>

      {/* Add / Edit Bug Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBug ? 'Edit Bug Details' : 'Report Engineering Defect'}
        subtitle="Log issue reproduction steps, environment, and severity level"
      >
        <form onSubmit={handleSaveBug} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Bug Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CORS rejection on custom AI proxy endpoint"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Description & Reproduction Steps
            </label>
            <textarea
              rows={3}
              placeholder="Observed vs expected behavior..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as BugSeverity)}
                className="input-field"
              >
                <option value="critical">Critical (Blocking)</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BugStatus)}
                className="input-field"
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Environment
              </label>
              <input
                type="text"
                placeholder="Production, Staging, Browser"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="input-field"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Linked Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="input-field"
            >
              <option value="">None / General</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingBug ? 'Update Bug' : 'Log Bug'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
