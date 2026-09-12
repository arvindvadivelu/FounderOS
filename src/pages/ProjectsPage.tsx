import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ListTodo,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { db } from '../db';
import { MetricCard } from '../components/common/MetricCard';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { createProject, updateProject, deleteProject } from '../db/services/taskProjectService';
import { formatDate } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import type { Project, ProjectStatus, Priority } from '../types';

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { color: string; bg: string; border: string; label: string }> = {
  planning: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)', label: 'Planning' },
  in_progress: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', label: 'In Progress' },
  paused: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)', label: 'Paused' },
  completed: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)', label: 'Completed' },
  cancelled: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)', label: 'Cancelled' },
};

const PROJECT_PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; border: string; label: string }> = {
  low: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)', label: 'Low' },
  medium: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)', label: 'Medium' },
  high: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', label: 'High' },
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)', label: 'Critical' },
};

export const ProjectsPage: React.FC = () => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('in_progress');
  const [priority, setPriority] = useState<Priority>('high');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [progress, setProgress] = useState<number>(50);

  // Live Queries
  const projects = useLiveQuery(async () => await db.projects.toArray(), []) || [];
  const tasks = useLiveQuery(async () => await db.tasks.toArray(), []) || [];

  // Metrics
  const inProgressProjects = projects.filter((p) => p.status === 'in_progress');
  const completedProjects = projects.filter((p) => p.status === 'completed');

  const openAddModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setStatus('in_progress');
    setPriority('high');
    setStartDate(new Date().toISOString().split('T')[0]);
    setTargetDate('');
    setProgress(25);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setDescription(p.description || '');
    setStatus(p.status);
    setPriority(p.priority);
    setStartDate(p.startDate || '');
    setTargetDate(p.targetDate || '');
    setProgress(p.progress || 0);
    setIsModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingProject) {
      await updateProject(editingProject.id, {
        name,
        description,
        status,
        priority,
        startDate: startDate || undefined,
        targetDate: targetDate || undefined,
        progress: Number(progress),
      });
      showToast('success', 'Project Updated', `Project "${name}" updated successfully.`);
    } else {
      await createProject({
        name,
        description,
        status,
        priority,
        startDate: startDate || undefined,
        targetDate: targetDate || undefined,
        progress: Number(progress),
      });
      showToast('success', 'Project Created', `Project "${name}" created.`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Delete this project?')) {
      await deleteProject(id);
      showToast('info', 'Project Deleted', 'Project removed.');
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
            STRATEGIC INITIATIVES • MILESTONE & SPRINT TRACKING
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
            Strategic Initiatives & Projects
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', maxWidth: '640px' }}>
            Orchestrate high-priority multi-week engineering milestones, product roadmap deliverables, and strategic OKRs.
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
          <span>New Project</span>
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
          title="Active Projects"
          value={inProgressProjects.length}
          subtitle="Currently advancing"
          icon={<ListTodo size={18} />}
        />

        <MetricCard
          title="Total Initiatives"
          value={projects.length}
          subtitle="Planning & underway"
          icon={<Layers size={18} />}
        />

        <MetricCard
          title="Completed Milestones"
          value={completedProjects.length}
          subtitle="Shipped initiatives"
          changeType="positive"
          icon={<CheckCircle2 size={18} />}
        />
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <EmptyState
          icon={<ListTodo size={24} />}
          title="No strategic projects created"
          description="Create your first initiative (e.g. SOC2 Compliance, Agentic V2, Self-Serve Billing) to organize execution tasks."
          actionText="Create First Project"
          onAction={openAddModal}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '20px',
          }}
        >
          {projects.map((proj) => {
            const linkedTasks = tasks.filter((t) => t.projectId === proj.id);
            const doneTasks = linkedTasks.filter((t) => t.status === 'done');
            const priorityCfg = PROJECT_PRIORITY_CONFIG[proj.priority] || {
              color: '#94a3b8',
              bg: 'rgba(148, 163, 184, 0.12)',
              border: 'rgba(148, 163, 184, 0.25)',
              label: proj.priority,
            };
            const statusCfg = PROJECT_STATUS_CONFIG[proj.status] || {
              color: '#38bdf8',
              bg: 'rgba(56, 189, 248, 0.12)',
              border: 'rgba(56, 189, 248, 0.25)',
              label: proj.status,
            };

            return (
              <div
                key={proj.id}
                style={{
                  backgroundColor: '#0b0f19',
                  borderRadius: '24px', // DESIGN.md --radius-cards: 24px
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.35)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Header with Priority and Status Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '2px 8px',
                          borderRadius: '10px', // 10px tag chip
                          backgroundColor: priorityCfg.bg,
                          border: `1px solid ${priorityCfg.border}`,
                          color: priorityCfg.color,
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: priorityCfg.color,
                          }}
                        />
                        {priorityCfg.label}
                      </div>

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
                    </div>

                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                      {proj.name}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(proj)}
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
                      title="Edit Project"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(proj.id)}
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
                      title="Delete Project"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {proj.description && (
                  <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                    {proj.description}
                  </p>
                )}

                {/* Progress Bar Container */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '16px', // 16px container
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Milestone Completion
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(0, 80, 255, 0.12)',
                        color: '#38bdf8',
                        border: '1px solid rgba(0, 80, 255, 0.25)',
                      }}
                    >
                      {proj.progress}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: '7px',
                      borderRadius: '50px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${proj.progress}%`,
                        background: 'linear-gradient(90deg, #0050FF 0%, #38bdf8 100%)',
                        borderRadius: '50px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Footer Metadata */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: '#64748b',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} color="#38bdf8" />
                    <span>Target: {proj.targetDate ? formatDate(proj.targetDate) : 'Open Roadmap'}</span>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px', // 10px tag chip
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      color: '#94a3b8',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {doneTasks.length}/{linkedTasks.length} tasks completed
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Edit Strategic Project' : 'New Strategic Project'}
        subtitle="Define project milestones, deadlines, and completion percentages"
      >
        <form onSubmit={handleSaveProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Agentic Workflow Orchestrator V2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Description & Goals
            </label>
            <textarea
              rows={3}
              placeholder="Scope, objectives, and deliverables..."
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
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
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
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Target Deadline
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Progress
              </label>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0, 80, 255, 0.15)',
                  color: '#38bdf8',
                }}
              >
                {progress}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              style={{ width: '100%', marginTop: '6px', accentColor: '#0050FF', cursor: 'pointer' }}
            />
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
              <span>{editingProject ? 'Update Project' : 'Create Project'}</span>
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
