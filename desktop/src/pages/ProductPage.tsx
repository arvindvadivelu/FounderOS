import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { db } from '../db';
import { SpotlightCard } from '../components/common/SpotlightCard';
import { MetricCard } from '../components/common/MetricCard';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { createFeature, updateFeature, deleteFeature } from '../db/services/productEngineeringService';
import type { Feature, FeatureStatus, Priority } from '../types';

export const ProductPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<FeatureStatus>('backlog');
  const [priority, setPriority] = useState<Priority>('medium');
  const [impact, setImpact] = useState<'low' | 'medium' | 'high'>('high');
  const [effort, setEffort] = useState<'low' | 'medium' | 'high'>('medium');
  const [projectId, setProjectId] = useState('');

  // Live Queries
  const features = useLiveQuery(async () => await db.features.toArray(), []) || [];
  const projects = useLiveQuery(async () => await db.projects.toArray(), []) || [];

  const statuses: FeatureStatus[] = ['idea', 'backlog', 'planned', 'in_progress', 'testing', 'released'];

  // Metrics
  const inProgressCount = features.filter((f) => f.status === 'in_progress').length;
  const releasedCount = features.filter((f) => f.status === 'released').length;
  const highImpactCount = features.filter((f) => f.impact === 'high').length;

  const openAddModal = () => {
    setEditingFeature(null);
    setTitle('');
    setDescription('');
    setStatus('backlog');
    setPriority('medium');
    setImpact('high');
    setEffort('medium');
    setProjectId('');
    setIsModalOpen(true);
  };

  const openEditModal = (f: Feature) => {
    setEditingFeature(f);
    setTitle(f.title);
    setDescription(f.description || '');
    setStatus(f.status);
    setPriority(f.priority);
    setImpact(f.impact);
    setEffort(f.effort);
    setProjectId(f.projectId || '');
    setIsModalOpen(true);
  };

  const handleSaveFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    if (editingFeature) {
      await updateFeature(editingFeature.id, {
        title,
        description,
        status,
        priority,
        impact,
        effort,
        projectId: projectId || undefined,
      });
    } else {
      await createFeature({
        title,
        description,
        status,
        priority,
        impact,
        effort,
        projectId: projectId || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleDeleteFeature = async (id: string) => {
    if (confirm('Delete this feature item?')) {
      await deleteFeature(id);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
            Product Roadmap & Feature Backlog
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Prioritize high-impact roadmap initiatives using Effort vs Impact scoring.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn-primary"
        >
          <Plus size={15} /> Add Feature Idea
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
          title="Total Features in Backlog"
          value={features.length}
          subtitle="Roadmap initiatives"
          icon={<FolderKanban size={18} />}
        />

        <MetricCard
          title="Currently Building"
          value={inProgressCount}
          subtitle="In active engineering"
          changeType="positive"
          icon={<Sparkles size={18} />}
        />

        <MetricCard
          title="High Impact Items"
          value={highImpactCount}
          subtitle="Highest leverage opportunities"
          changeType="positive"
          icon={<FolderKanban size={18} />}
        />

        <MetricCard
          title="Shipped to Production"
          value={releasedCount}
          subtitle="Released features"
          changeType="positive"
          icon={<FolderKanban size={18} />}
        />
      </div>

      {/* Features Kanban Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          alignItems: 'start',
          overflowX: 'auto',
          paddingBottom: '16px',
        }}
      >
        {statuses.map((st) => {
          const colFeatures = features.filter((f) => f.status === st);

          return (
            <div
              key={st}
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-faint)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minHeight: '380px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge variant={getStatusBadgeVariant(st)}>{st.replace('_', ' ')}</Badge>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>
                  ({colFeatures.length})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {colFeatures.length === 0 ? (
                  <div
                    style={{
                      margin: 'auto 0',
                      textAlign: 'center',
                      padding: '24px 8px',
                      color: 'var(--text-dim)',
                      fontSize: '12px',
                      border: '1px dashed var(--border-faint)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    No features in {st.replace('_', ' ')}
                  </div>
                ) : (
                  colFeatures.map((feat) => (
                    <SpotlightCard
                      key={feat.id}
                      style={{
                        padding: '14px',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-main)' }}>
                          {feat.title}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(feat)}
                            style={{ color: 'var(--text-dim)', padding: '2px' }}
                            title="Edit Feature"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFeature(feat.id)}
                            style={{ color: 'var(--text-dim)', padding: '2px' }}
                            title="Delete Feature"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {feat.description && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          {feat.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(0, 80, 255, 0.12)',
                            color: 'var(--brand-accent)',
                            fontWeight: 600,
                          }}
                        >
                          Impact: {feat.impact}
                        </span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            color: 'var(--text-dim)',
                          }}
                        >
                          Effort: {feat.effort}
                        </span>
                      </div>

                      <div style={{ marginTop: '6px', paddingTop: '8px', borderTop: '1px solid var(--border-faint)' }}>
                        <select
                          value={feat.status}
                          onChange={(e) => updateFeature(feat.id, { status: e.target.value as FeatureStatus })}
                          className="input-field"
                          style={{ padding: '4px 8px', fontSize: '11.5px', width: '100%' }}
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              Move to {s.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </SpotlightCard>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Feature Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFeature ? 'Edit Feature' : 'Add Feature Idea'}
        subtitle="Specify product impact, engineering effort, and target release status"
      >
        <form onSubmit={handleSaveFeature} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Feature Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Real-time streaming tool execution"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Description & Specifications
            </label>
            <textarea
              rows={3}
              placeholder="What problem does this solve for our users?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FeatureStatus)}
                className="input-field"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
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
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Impact
              </label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as any)}
                className="input-field"
              >
                <option value="high">High Impact</option>
                <option value="medium">Medium Impact</option>
                <option value="low">Low Impact</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Effort
              </label>
              <select
                value={effort}
                onChange={(e) => setEffort(e.target.value as any)}
                className="input-field"
              >
                <option value="low">Low Effort (Quick Win)</option>
                <option value="medium">Medium Effort</option>
                <option value="high">High Effort</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Linked Strategic Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="input-field"
            >
              <option value="">None / Standalone Feature</option>
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
              {editingFeature ? 'Update Feature' : 'Save Feature'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
