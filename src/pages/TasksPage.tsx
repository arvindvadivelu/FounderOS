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
import { MetricCard } from '../components/common/MetricCard';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { createTask, updateTask, deleteTask } from '../db/services/taskProjectService';
import { formatDate } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import type { Task, TaskStatus, Priority } from '../types';

const TASK_STATUS_CONFIG: Record<TaskStatus, { color: string; bg: string; border: string; label: string }> = {
  todo: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)', label: 'Todo' },
  in_progress: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', label: 'In Progress' },
  blocked: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)', label: 'Blocked' },
  done: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)', label: 'Done' },
};

const TASK_PRIORITY_CONFIG: Record<Priority, { color: string; bg: string; border: string; label: string }> = {
  low: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)', label: 'Low' },
  medium: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)', label: 'Medium' },
  high: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', label: 'High' },
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)', label: 'Critical' },
};

export const TasksPage: React.FC = () => {
  const { showToast } = useToast();
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
      showToast('success', 'Task Updated', `Task "${title}" saved successfully.`);
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
      showToast('success', 'Task Created', `Task "${title}" added to queue.`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('Delete this task?')) {
      await deleteTask(id);
      showToast('info', 'Task Deleted', 'Task removed from queue.');
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
            DAILY EXECUTION • SPRINT & TASK BACKLOG
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
            Execution Tasks & Daily Workflow
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', maxWidth: '640px' }}>
            Manage daily founder tasks, sprint assignments, priority queues, and time estimations.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Segmented View Switcher — 50px Pill Style */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '50px',
              padding: '4px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              style={{
                padding: '6px 16px',
                borderRadius: '50px',
                backgroundColor: viewMode === 'kanban' ? '#0050FF' : 'transparent',
                color: viewMode === 'kanban' ? '#ffffff' : '#94a3b8',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: viewMode === 'kanban' ? '0 0 12px rgba(0, 80, 255, 0.4)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <LayoutGrid size={13} /> Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 16px',
                borderRadius: '50px',
                backgroundColor: viewMode === 'list' ? '#0050FF' : 'transparent',
                color: viewMode === 'list' ? '#ffffff' : '#94a3b8',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: viewMode === 'list' ? '0 0 12px rgba(0, 80, 255, 0.4)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <ListIcon size={13} /> List
            </button>
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
            <span>New Task</span>
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

      {/* Quick Add Bar & Filters Card */}
      <div
        style={{
          backgroundColor: '#0b0f19',
          borderRadius: '24px', // DESIGN.md --radius-cards: 24px
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '18px 22px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* 50px Pill Inline Quick Add Form */}
          <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Quick add task and hit enter..."
              style={{
                flex: 1,
                padding: '9px 18px',
                borderRadius: '50px', // 50px pill input
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(0, 80, 255, 0.4)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            />
            <button
              type="submit"
              style={{
                padding: '9px 18px',
                borderRadius: '50px', // 50px pill button
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <Plus size={14} /> Quick Add
            </button>
          </form>

          {/* Search & Priority Filters */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
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
              <option value="all" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>All Priorities</option>
              <option value="critical" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>Critical</option>
              <option value="high" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>High</option>
              <option value="medium" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>Medium</option>
              <option value="low" style={{ backgroundColor: '#0b0f19', color: '#f8fafc' }}>Low</option>
            </select>

            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '14px', top: '11px', color: '#64748b' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                style={{
                  padding: '8px 16px 8px 36px',
                  borderRadius: '50px', // 50px pill search
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '12.5px',
                  width: '180px',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(0, 80, 255, 0.4)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
              />
            </div>
          </div>
        </div>
      </div>

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
            const statusCfg = TASK_STATUS_CONFIG[st];

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
                    ({colTasks.length})
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {colTasks.length === 0 ? (
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
                      No tasks in {statusCfg.label}
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const priorityCfg = TASK_PRIORITY_CONFIG[task.priority] || {
                        color: '#94a3b8',
                        bg: 'rgba(148, 163, 184, 0.12)',
                        border: 'rgba(148, 163, 184, 0.25)',
                        label: task.priority,
                      };

                      return (
                        <div
                          key={task.id}
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
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0 }}>
                              <input
                                type="checkbox"
                                checked={task.status === 'done'}
                                onChange={() => handleToggleTask(task)}
                                style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#0050FF' }}
                              />
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: '13px',
                                  color: task.status === 'done' ? '#64748b' : '#f8fafc',
                                  textDecoration: task.status === 'done' ? 'line-through' : 'none',
                                  wordBreak: 'break-word',
                                  lineHeight: 1.35,
                                }}
                              >
                                {task.title}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => openEditModal(task)}
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
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
                                title="Edit Task"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                style={{
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: '50%',
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
                                title="Delete Task"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {task.projectName && (
                            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                              {task.projectName}
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
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
                                fontSize: '10.5px',
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

                            {task.dueDate && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                                <Calendar size={11} color={task.status !== 'done' && task.dueDate < today ? '#f87171' : '#64748b'} />
                                <span
                                  style={{
                                    color: task.status !== 'done' && task.dueDate < today ? '#f87171' : '#64748b',
                                    fontWeight: task.status !== 'done' && task.dueDate < today ? 700 : 400,
                                  }}
                                >
                                  {formatDate(task.dueDate)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Status Move Selector — 50px Pill Style */}
                          <div style={{ marginTop: '2px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <select
                              value={task.status}
                              onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
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
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div
          style={{
            backgroundColor: '#0b0f19',
            borderRadius: '24px', // DESIGN.md --radius-cards: 24px
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '22px 26px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
          }}
        >
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
              <table className="data-table" style={{ width: '100%' }}>
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
                  {filteredTasks.map((task) => {
                    const priorityCfg = TASK_PRIORITY_CONFIG[task.priority];
                    const statusCfg = TASK_STATUS_CONFIG[task.status];

                    return (
                      <tr key={task.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={task.status === 'done'}
                            onChange={() => handleToggleTask(task)}
                            style={{ cursor: 'pointer', accentColor: '#0050FF' }}
                          />
                        </td>
                        <td>
                          <div
                            style={{
                              fontWeight: 600,
                              color: task.status === 'done' ? '#64748b' : '#f8fafc',
                              textDecoration: task.status === 'done' ? 'line-through' : 'none',
                            }}
                          >
                            {task.title}
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
                        <td style={{ color: '#94a3b8' }}>{task.projectName || '—'}</td>
                        <td
                          style={{
                            color: task.status !== 'done' && task.dueDate && task.dueDate < today ? '#f87171' : '#94a3b8',
                            fontWeight: task.status !== 'done' && task.dueDate && task.dueDate < today ? 700 : 400,
                          }}
                        >
                          {formatDate(task.dueDate)}
                        </td>
                        <td style={{ color: '#64748b' }}>
                          {task.estimatedMinutes ? `${task.estimatedMinutes}m` : '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => openEditModal(task)}
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
                              title="Edit Task"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
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
                              title="Delete Task"
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
      )}

      {/* Add / Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
        subtitle="Schedule execution tasks with priority and time estimations"
      >
        <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Follow up with FinVantage on revised SLA terms"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Description & Details
            </label>
            <textarea
              rows={3}
              placeholder="Acceptance criteria or reference notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
              style={{ borderRadius: '12px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="input-field"
                style={{ borderRadius: '12px' }}
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                style={{ borderRadius: '12px' }}
              />
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
              <option value="">None / Standalone Task</option>
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
              <span>{editingTask ? 'Update Task' : 'Create Task'}</span>
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
