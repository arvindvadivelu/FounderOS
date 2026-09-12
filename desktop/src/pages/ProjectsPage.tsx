import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ListTodo,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { db } from '../db';
import { SpotlightCard } from '../components/common/SpotlightCard';
import { MetricCard } from '../components/common/MetricCard';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { createProject, updateProject, deleteProject } from '../db/services/taskProjectService';
import { formatDate } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import type { Project, ProjectStatus, Priority } from '../types';

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
    }

    setIsModalOpen(false);
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('Delete this project?')) {
      await deleteProject(id);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
            Strategic Initiatives & Projects
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Orchestrate high-priority multi-week engineering & business milestones.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn-primary"
        >
          <Plus size={15} /> New Project
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
          icon={<ListTodo size={18} />}
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
            gap: '18px',
          }}
        >
          {projects.map((proj) => {
            const linkedTasks = tasks.filter((t) => t.projectId === proj.id);
            const doneTasks = linkedTasks.filter((t) => t.status === 'done');

            return (
              <SpotlightCard
                key={proj.id}
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Badge variant={getStatusBadgeVariant(proj.priority)}>{proj.priority}</Badge>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginTop: '6px' }}>
                      {proj.name}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(proj)}
                      style={{ color: 'var(--text-dim)', padding: '4px' }}
                      title="Edit Project"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(proj.id)}
                      style={{ color: 'var(--text-dim)', padding: '4px' }}
                      title="Delete Project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {proj.description && (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {proj.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Progress</span>
                    <strong style={{ color: 'var(--text-main)' }}>{proj.progress}%</strong>
                  </div>
                  <div
                    style={{
                      height: '6px',
                      borderRadius: '999px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${proj.progress}%`,
                        backgroundColor: 'var(--brand-accent)',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease',
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
                    color: 'var(--text-dim)',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-faint)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} />
                    <span>Target: {proj.targetDate ? formatDate(proj.targetDate) : 'Open'}</span>
                  </div>

                  <span>
                    Tasks: {doneTasks.length}/{linkedTasks.length}
                  </span>
                </div>
              </SpotlightCard>
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
        <form onSubmit={handleSaveProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Agentic Workflow Orchestrator V2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Description & Goals
            </label>
            <textarea
              rows={3}
              placeholder="Scope, objectives, and deliverables..."
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
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="input-field"
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
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
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Target Deadline
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Progress ({progress}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              style={{ width: '100%', marginTop: '6px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
