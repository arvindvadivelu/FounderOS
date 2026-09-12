import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Building2,
  Plus,
  Search,
  DollarSign,
  Users,
  Briefcase,
  Edit2,
  Trash2,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { db } from '../../db';
import { SpotlightCard } from '../../components/common/SpotlightCard';
import { MetricCard } from '../../components/common/MetricCard';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllEmployees,
} from '../../db/services/managementService';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../components/common/Toast';
import type { Department, Employee, Currency } from '../../types';

export const DepartmentsPage: React.FC = () => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form State
  const [fName, setFName] = useState('');
  const [fDescription, setFDescription] = useState('');
  const [fHeadName, setFHeadName] = useState('');
  const [fBudget, setFBudget] = useState<number>(100000);

  // Live Queries
  const company = useLiveQuery(async () => (await db.companies.toArray())[0], []);
  const departments = useLiveQuery(async () => await getAllDepartments(), []) || [];
  const employees = useLiveQuery(async () => await getAllEmployees(), []) || [];

  const currency = company?.currency || 'USD';

  // Metrics
  const totalBudget = departments.reduce((sum, d) => sum + (d.budget || 0), 0);

  const openCreateModal = () => {
    setEditingDept(null);
    setFName('');
    setFDescription('');
    setFHeadName('');
    setFBudget(120000);
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFName(dept.name);
    setFDescription(dept.description || '');
    setFHeadName(dept.headEmployeeName || '');
    setFBudget(dept.budget);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) return;

    if (editingDept) {
      await updateDepartment(editingDept.id, {
        name: fName,
        description: fDescription || undefined,
        headEmployeeName: fHeadName || undefined,
        budget: Number(fBudget),
      });
      showToast('success', 'Department Updated', `Department "${fName}" updated successfully.`);
    } else {
      await createDepartment({
        name: fName,
        description: fDescription || undefined,
        headEmployeeName: fHeadName || undefined,
        budget: Number(fBudget),
        currency,
      });
      showToast('success', 'Department Created', `Department "${fName}" added.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete department "${name}"? Assigned employees will become unassigned.`)) {
      await deleteDepartment(id);
      showToast('info', 'Department Deleted', `Department "${name}" removed.`);
    }
  };

  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.headEmployeeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            MANAGEMENT • ORGANIZATIONAL UNITS & TEAMS
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
            Departments & Functional Units
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', maxWidth: '640px' }}>
            Structure team responsibilities, track department budgets, and monitor functional headcount distribution.
          </p>
        </div>

        {/* Primary CTA Button with Action Indicator Dot */}
        <button
          type="button"
          onClick={openCreateModal}
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
          <Plus size={16} />
          <span>Create Department</span>
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

      {/* Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <MetricCard
          title="Total Departments"
          value={`${departments.length} Units`}
          subtitle="Active operational divisions"
          icon={<Building2 size={18} />}
        />

        <MetricCard
          title="Combined Annual Budget"
          value={formatCurrency(totalBudget, currency)}
          subtitle="Department allocation cap"
          icon={<DollarSign size={18} />}
        />

        <MetricCard
          title="Avg Team Size"
          value={departments.length > 0 ? `${(employees.length / departments.length).toFixed(1)} people` : '0 people'}
          subtitle={`${employees.length} total team members`}
          icon={<Users size={18} />}
        />
      </div>

      {/* Search Bar */}
      <div style={{ maxWidth: '420px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '12px' }} />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              borderRadius: '50px', // DESIGN.md 50px pill
              padding: '9px 16px 9px 40px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Department Cards Grid */}
      {filteredDepartments.length === 0 ? (
        <EmptyState
          title="No departments found"
          description="Create organizational units like Engineering, Product, Design, or Growth to organize your team."
          actionText="Create First Department"
          onAction={openCreateModal}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '18px',
          }}
        >
          {filteredDepartments.map((dept) => {
            const deptEmployees = employees.filter((e) => e.departmentId === dept.id);
            const deptPayroll = deptEmployees.reduce((sum, e) => {
              if (e.salaryPeriod === 'annual') return sum + (e.salary || 0);
              if (e.salaryPeriod === 'monthly') return sum + (e.salary || 0) * 12;
              return sum + (e.salary || 0) * 2080;
            }, 0);

            const budgetUtilization = dept.budget > 0 ? Math.min(100, Math.round((deptPayroll / dept.budget) * 100)) : 0;

            return (
              <SpotlightCard
                key={dept.id}
                style={{
                  padding: '24px',
                  borderRadius: '24px', // DESIGN.md --radius-cards: 24px
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(0, 80, 255, 0.25) 0%, rgba(56, 189, 248, 0.15) 100%)',
                        border: '1px solid rgba(0, 80, 255, 0.35)',
                        color: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                        {dept.name}
                      </h3>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                        Lead: <strong style={{ color: '#cbd5e1' }}>{dept.headEmployeeName || 'Unassigned'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(dept)}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50px', // DESIGN.md 50px pill button
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
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#94a3b8';
                      }}
                      title="Edit Department"
                    >
                      <Edit2 size={12.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(dept.id, dept.name)}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50px', // DESIGN.md 50px pill button
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.color = '#fca5a5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                        e.currentTarget.style.color = '#f87171';
                      }}
                      title="Delete Department"
                    >
                      <Trash2 size={12.5} />
                    </button>
                  </div>
                </div>

                {dept.description && (
                  <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                    {dept.description}
                  </p>
                )}

                {/* Budget & Headcount Bar */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '16px', // Eliminates sharp 4px/8px corners
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                    <span style={{ color: '#94a3b8' }}>Annual Budget:</span>
                    <strong style={{ color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{formatCurrency(dept.budget, currency)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                    <span style={{ color: '#94a3b8' }}>Allocated Salaries:</span>
                    <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{formatCurrency(deptPayroll, currency)}/yr</strong>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '6px', borderRadius: '999px', backgroundColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', marginTop: '2px' }}>
                    <div
                      style={{
                        width: `${budgetUtilization}%`,
                        height: '100%',
                        background: budgetUtilization > 90 ? '#ef4444' : 'linear-gradient(90deg, #0050FF 0%, #38bdf8 100%)',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                    <span>Utilization</span>
                    <span style={{ fontWeight: 600, color: budgetUtilization > 90 ? '#f87171' : '#34d399' }}>{budgetUtilization}% of budget</span>
                  </div>
                </div>

                {/* Team Members in Department */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                      Team Members ({deptEmployees.length})
                    </span>
                  </div>

                  {deptEmployees.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                      No members assigned to this department yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {deptEmployees.map((emp) => (
                        <span
                          key={emp.id}
                          style={{
                            fontSize: '11px',
                            padding: '3px 10px',
                            borderRadius: '10px', // DESIGN.md 10px tag chip
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                          {emp.name} ({emp.role})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      )}

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Create Department'}
        subtitle="Configure organizational division and budget ceiling"
        maxWidth="500px"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Department Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Engineering & Infrastructure"
              value={fName}
              onChange={(e) => setFName(e.target.value)}
              className="input-field"
              style={{
                borderRadius: '12px',
                padding: '10px 14px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '13.5px',
                width: '100%',
                boxSizing: 'border-box',
              }}
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Department Lead / Head of Unit
            </label>
            <input
              type="text"
              placeholder="e.g. Alex Mercer"
              value={fHeadName}
              onChange={(e) => setFHeadName(e.target.value)}
              className="input-field"
              style={{
                borderRadius: '12px',
                padding: '10px 14px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '13.5px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Annual Allocated Budget ({currency}) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="5000"
              value={fBudget}
              onChange={(e) => setFBudget(Number(e.target.value))}
              className="input-field"
              style={{
                borderRadius: '12px',
                padding: '10px 14px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '13.5px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Mission & Responsibilities
            </label>
            <textarea
              rows={3}
              placeholder="Core focus areas, team objectives, tooling allowances..."
              value={fDescription}
              onChange={(e) => setFDescription(e.target.value)}
              className="input-field"
              style={{
                borderRadius: '12px',
                padding: '10px 14px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '13.5px',
                width: '100%',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                borderRadius: '50px', // DESIGN.md 50px pill button
                padding: '9px 20px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                borderRadius: '50px', // DESIGN.md 50px pill button
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
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a66ff')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0050FF')}
            >
              <span>{editingDept ? 'Update Department' : 'Create Department'}</span>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  opacity: 0.9,
                }}
              />
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
