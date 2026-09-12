import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Layers,
  Rocket,
  Flame,
} from 'lucide-react';
import { db } from '../db';
import { MetricCard } from '../components/common/MetricCard';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { createFeature, updateFeature, deleteFeature } from '../db/services/productEngineeringService';
import { useToast } from '../components/common/Toast';
import type { Feature, FeatureStatus, Priority } from '../types';

const FEATURE_STATUS_CONFIG: Record<
  FeatureStatus,
  { color: string; bg: string; border: string; label: string }
> = {
  idea: { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.25)', label: 'Idea' },
  backlog: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)', label: 'Backlog' },
  planned: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)', label: 'Planned' },
  in_progress: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', label: 'In Progress' },
  testing: { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.25)', label: 'Testing' },
  released: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)', label: 'Released' },
  cancelled: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)', label: 'Cancelled' },
};

export const ProductPage: React.FC = () => {
  const { showToast } = useToast();
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
      showToast('success', 'Feature Updated', `Feature "${title}" updated successfully.`);
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
      showToast('success', 'Feature Created', `Feature "${title}" added to roadmap.`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteFeature = async (id: string) => {
    if (confirm('Delete this feature item?')) {
      await deleteFeature(id);
      showToast('info', 'Feature Deleted', 'Feature removed from roadmap.');
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
            PRODUCT ROADMAP • FEATURE BACKLOG & IMPACT SCORING
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
            Product Roadmap & Feature Backlog
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', maxWidth: '640px' }}>
            Prioritize high-impact roadmap initiatives using Effort vs Impact scoring to accelerate user adoption.
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
          <span>Add Feature Idea</span>
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
          icon={<Flame size={18} />}
        />

        <MetricCard
          title="Shipped to Production"
          value={releasedCount}
          subtitle="Released features"
          changeType="positive"
          icon={<Rocket size={18} />}
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
          const statusCfg = FEATURE_STATUS_CONFIG[st];

          return (
            <div
              key={st}
              style={{
                backgroundColor: '#0b0f19',
                borderRadius: '24px', // DESIGN.md --radius-cards: 24px
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '18px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                minHeight: '440px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 10px',
                    borderRadius: '10px', // DESIGN.md --radius-small: 10px
                    backgroundColor: statusCfg.bg,
                    border: `1px solid ${statusCfg.border}`,
                    color: statusCfg.color,
                    fontSize: '11.5px',
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: statusCfg.color,
                      boxShadow: `0 0 6px ${statusCfg.color}`,
                    }}
                  />
                  {statusCfg.label}
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                  ({colFeatures.length})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {colFeatures.length === 0 ? (
                  <div
                    style={{
                      margin: 'auto 0',
                      textAlign: 'center',
                      padding: '30px 12px',
                      color: '#64748b',
                      fontSize: '12px',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.01)',
                    }}
                  >
                    No features in {statusCfg.label}
                  </div>
                ) : (
                  colFeatures.map((feat) => (
                    <div
                      key={feat.id}
                      style={{
                        padding: '14px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '16px', // Modern 16px card inside column
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '9px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.35)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#f8fafc', lineHeight: 1.3 }}>
                          {feat.title}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(feat)}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%', // Circular 26px button
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
                            title="Edit Feature"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFeature(feat.id)}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%', // Circular 26px button
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
                            title="Delete Feature"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {feat.description && (
                        <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4, margin: 0 }}>
                          {feat.description}
                        </p>
                      )}

                      {/* 10px Tag Chips for Impact & Effort */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            padding: '2px 8px',
                            borderRadius: '10px', // Replaced sharp 4px with 10px tag chip
                            backgroundColor: feat.impact === 'high' ? 'rgba(0, 80, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: feat.impact === 'high' ? '#38bdf8' : '#94a3b8',
                            border: `1px solid ${feat.impact === 'high' ? 'rgba(0, 80, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                            fontWeight: 700,
                            textTransform: 'capitalize',
                          }}
                        >
                          Impact: {feat.impact}
                        </span>
                        <span
                          style={{
                            fontSize: '10.5px',
                            padding: '2px 8px',
                            borderRadius: '10px', // Replaced sharp 4px with 10px tag chip
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            color: '#94a3b8',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        >
                          Effort: {feat.effort}
                        </span>
                      </div>

                      {/* Status Move Selector — 50px Pill Style */}
                      <div style={{ marginTop: '2px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <select
                          value={feat.status}
                          onChange={(e) => updateFeature(feat.id, { status: e.target.value as FeatureStatus })}
                          style={{
                            width: '100%',
                            padding: '5px 10px',
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
                          {statuses.map((s) => (
                            <option key={s} value={s} style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>
                              Move to {s.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
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
        <form onSubmit={handleSaveFeature} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Feature Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Real-time streaming tool execution"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Description & Specifications
            </label>
            <textarea
              rows={3}
              placeholder="What problem does this solve for our users?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FeatureStatus)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
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
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Impact
              </label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as any)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              >
                <option value="high">High Impact</option>
                <option value="medium">Medium Impact</option>
                <option value="low">Low Impact</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Effort
              </label>
              <select
                value={effort}
                onChange={(e) => setEffort(e.target.value as any)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              >
                <option value="low">Low Effort (Quick Win)</option>
                <option value="medium">Medium Effort</option>
                <option value="high">High Effort</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Linked Strategic Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="input-field"
              style={{ borderRadius: '12px' }}
            >
              <option value="">None / Standalone Feature</option>
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
              <span>{editingFeature ? 'Update Feature' : 'Save Feature'}</span>
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
