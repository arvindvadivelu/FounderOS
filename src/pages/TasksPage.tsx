import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  CheckSquare,
  Plus,
  Edit2,
  Trash2,
  Search,
  Calendar,
  Clock,
  LayoutGrid,
  List as ListIcon,
} from 'lucide-react';
import { db } from '../db';
import { SpotlightCard } from '../components/common/SpotlightCard';
import { MetricCard } from '../components/common/MetricCard';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { createTask, updateTask, deleteTask } from '../db/services/taskProjectService';
import { formatDate } from '../utils/formatters';
import type { Task, TaskStatus, Priority } from '../types';

export const TasksPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [quickTitle, setQuickTitle] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [projectId, setProjectId] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Live Queries
  const tasks = useLiveQuery(async () => await db.tasks.toArray(), []) || [];
  const projects = useLiveQuery(async () => await db.projects.toArray(), []) || [];

  const statuses: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done'];

  // Metrics
  const today = new Date().toISOString().split('T')[0];
  const openTasks = tasks.filter((t) => t.status !== 'done');
  const criticalTasks = openTasks.filter((t) => t.priority === 'critical');
  const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < today);
  const completedTasks = tasks.filter((t) => t.status === 'done');

  // Filtered List
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const openAddModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setStatus('todo');
    setPriority('medium');
    setDueDate(new Date().toISOString().split('T')[0]);
    setEstimatedMinutes(30);
    setProjectId('');
    setTagsInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Task) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description || '');
    setStatus(t.status);
    setPriority(t.priority);
    setDueDate(t.dueDate || '');
    setEstimatedMinutes(t.estimatedMinutes || 30);
    setProjectId(t.projectId || '');
    setTagsInput(t.tags?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    await createTask({
      title: quickTitle.trim(),
      status: 'todo',
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0],
      tags: [],
    });

    setQuickTitle('');
  };

  const handleToggleTask = async (task: Task) => {
    await updateTask(task.id, {
      status: task.status === 'done' ? 'todo' : 'done',
    });
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const proj = projects.find((p) => p.id === projectId);
    const parsedTags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (editingTask) {
      await updateTask(editingTask.id, {
        title,
        description,
        status,
        priority,
        dueDate: dueDate || undefined,
        estimatedMinutes: Number(estimatedMinutes),
        projectId: projectId || undefined,
        projectName: proj?.name || undefined,
        tags: parsedTags,
      });
    } else {
      await createTask({
        title,
        description,
        status,
        priority,
        dueDate: dueDate || undefined,
        estimatedMinutes: Number(estimatedMinutes),
        projectId: projectId || undefined,
        projectName: proj?.name || undefined,
        tags: parsedTags,
      });
    }

    setIsModalOpen(false);
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('Delete this task?')) {
      await deleteTask(id);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
            Execution Tasks & Daily Workflow
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Manage daily founder tasks, priority assignments, and time estimations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-full)',
              padding: '2px',
              border: '1px solid var(--border-faint)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: viewMode === 'kanban' ? 'var(--brand-accent)' : 'transparent',
                color: viewMode === 'kanban' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <LayoutGrid size={13} /> Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: viewMode === 'list' ? 'var(--brand-accent)' : 'transparent',
                color: viewMode === 'list' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ListIcon size={13} /> List
            </button>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="btn-primary"
          >
            <Plus size={15} /> New Task
          </button>
        </div>
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
          title="Open Tasks"
          value={openTasks.length}
          subtitle="Remaining backlog items"
          icon={<CheckSquare size={18} />}
        />

        <MetricCard
          title="Critical Priority"
          value={criticalTasks.length}
          subtitle="Urgent items"
          changeType={criticalTasks.length > 0 ? 'negative' : 'positive'}
          icon={<CheckSquare size={18} />}
        />

        <MetricCard
          title="Overdue Tasks"
          value={overdueTasks.length}
          subtitle="Passed target due date"
          changeType={overdueTasks.length > 0 ? 'negative' : 'positive'}
          icon={<Clock size={18} />}
        />

        <MetricCard
          title="Completed Tasks"
          value={completedTasks.length}
          subtitle="Total finished"
          changeType="positive"
          icon={<CheckSquare size={18} />}
        />
      </div>

      {/* Quick Add Bar & Filters */}
      <SpotlightCard style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Inline Quick Add Form */}
          <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Quick add task and hit enter..."
              className="input-field"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-secondary" style={{ padding: '8px 16px' }}>
              <Plus size={14} /> Quick Add
            </button>
          </form>

          {/* Search & Priority Filters */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="input-field"
                style={{ paddingLeft: '32px', width: '180px', padding: '6px 10px 6px 32px', fontSize: '12.5px' }}
              />
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
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
            const colTasks = filteredTasks.filter((t) => t.status === st);

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
                  minHeight: '400px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge variant={getStatusBadgeVariant(st)}>{st.replace('_', ' ')}</Badge>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>
                    ({colTasks.length})
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {colTasks.length === 0 ? (
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
                      No tasks in {st.replace('_', ' ')}
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <SpotlightCard
                        key={task.id}
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
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={task.status === 'done'}
                              onChange={() => handleToggleTask(task)}
                              style={{ marginTop: '2px', cursor: 'pointer' }}
                            />
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: '13px',
                                color: task.status === 'done' ? 'var(--text-dim)' : 'var(--text-main)',
                                textDecoration: task.status === 'done' ? 'line-through' : 'none',
                                wordBreak: 'break-word',
                              }}
                            >
                              {task.title}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => openEditModal(task)}
                              style={{ color: 'var(--text-dim)', padding: '2px' }}
                              title="Edit Task"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              style={{ color: 'var(--text-dim)', padding: '2px' }}
                              title="Delete Task"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {task.projectName && (
                          <div style={{ fontSize: '11px', color: 'var(--brand-accent)', fontWeight: 600 }}>
                            {task.projectName}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <Badge variant={getStatusBadgeVariant(task.priority)}>{task.priority}</Badge>

                          {task.dueDate && (
                            <span
                              style={{
                                fontSize: '11px',
                                color: task.status !== 'done' && task.dueDate < today ? 'var(--accent-rose)' : 'var(--text-dim)',
                                fontWeight: task.status !== 'done' && task.dueDate < today ? 700 : 400,
                              }}
                            >
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>

                        {/* Status Move Selector */}
                        <div style={{ marginTop: '4px', paddingTop: '6px', borderTop: '1px solid var(--border-faint)' }}>
                          <select
                            value={task.status}
                            onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
                            className="input-field"
                            style={{ padding: '2px 6px', fontSize: '11px', width: '100%' }}
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
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <SpotlightCard style={{ padding: '20px' }}>
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={<CheckSquare size={24} />}
              title="No tasks match filters"
              description="Create a task to track your daily execution schedule."
              actionText="Create New Task"
              onAction={openAddModal}
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Task Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Project</th>
                    <th>Due Date</th>
                    <th>Est. Time</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={task.status === 'done'}
                          onChange={() => handleToggleTask(task)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td>
                        <div
                          style={{
                            fontWeight: 600,
                            color: task.status === 'done' ? 'var(--text-dim)' : 'var(--text-main)',
                            textDecoration: task.status === 'done' ? 'line-through' : 'none',
                          }}
                        >
                          {task.title}
                        </div>
                      </td>
                      <td>
                        <Badge variant={getStatusBadgeVariant(task.priority)}>{task.priority}</Badge>
                      </td>
                      <td>
                        <Badge variant={getStatusBadgeVariant(task.status)}>{task.status.replace('_', ' ')}</Badge>
                      </td>
                      <td style={{ color: 'var(--text-dim)' }}>{task.projectName || '—'}</td>
                      <td
                        style={{
                          color: task.status !== 'done' && task.dueDate && task.dueDate < today ? 'var(--accent-rose)' : 'var(--text-muted)',
                        }}
                      >
                        {formatDate(task.dueDate)}
                      </td>
                      <td style={{ color: 'var(--text-dim)' }}>
                        {task.estimatedMinutes ? `${task.estimatedMinutes}m` : '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(task)}
                            style={{ color: 'var(--text-muted)', padding: '4px' }}
                            title="Edit Task"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            style={{ color: 'var(--text-dim)', padding: '4px' }}
                            title="Delete Task"
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
      )}

      {/* Add / Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        subtitle="Schedule execution tasks with priority and time estimations"
      >
        <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Follow up with FinVantage on revised SLA terms"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Description & Details
            </label>
            <textarea
              rows={3}
              placeholder="Acceptance criteria or reference notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="input-field"
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Estimated Minutes
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
                placeholder="45"
                className="input-field"
              />
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
              <option value="">None / Standalone Task</option>
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
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
