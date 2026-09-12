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
import type { Department, Employee, Currency } from '../../types';

export const DepartmentsPage: React.FC = () => {
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
    } else {
      await createDepartment({
        name: fName,
        description: fDescription || undefined,
        headEmployeeName: fHeadName || undefined,
        budget: Number(fBudget),
        currency,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete department "${name}"? Assigned employees will become unassigned.`)) {
      await deleteDepartment(id);
    }
  };

  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.headEmployeeName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <SpotlightCard
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(0, 80, 255, 0.15) 0%, rgba(15, 23, 42, 0.88) 100%)',
          borderColor: 'rgba(0, 80, 255, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-accent)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              MANAGEMENT / ORGANIZATIONAL UNITS
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Departments & Functional Units
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '600px' }}>
            Structure team responsibilities, track department budgets, and monitor functional headcount distribution.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '13.5px' }}
        >
          <Plus size={16} /> Create Department
        </button>
      </SpotlightCard>

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
      <SpotlightCard style={{ padding: '14px 20px' }}>
        <div style={{ position: 'relative', maxWidth: '420px' }}>
          <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </SpotlightCard>

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
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--primary-blue-surface)',
                        color: 'var(--brand-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                        {dept.name}
                      </h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        Lead: <strong style={{ color: 'var(--text-muted)' }}>{dept.headEmployeeName || 'Unassigned'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(dept)}
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(dept.id, dept.name)}
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--accent-rose)' }}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {dept.description && (
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {dept.description}
                  </p>
                )}

                {/* Budget & Headcount Bar */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Annual Budget:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{formatCurrency(dept.budget, currency)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Allocated Salaries:</span>
                    <strong style={{ color: 'var(--brand-accent)' }}>{formatCurrency(deptPayroll, currency)}/yr</strong>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '6px', borderRadius: '999px', backgroundColor: 'var(--bg-page)', overflow: 'hidden', marginTop: '4px' }}>
                    <div
                      style={{
                        width: `${budgetUtilization}%`,
                        height: '100%',
                        backgroundColor: budgetUtilization > 90 ? '#f87171' : 'var(--brand-accent)',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)' }}>
                    <span>Utilization</span>
                    <span>{budgetUtilization}% of budget</span>
                  </div>
                </div>

                {/* Team Members in Department */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)' }}>
                      Team Members ({deptEmployees.length})
                    </span>
                  </div>

                  {deptEmployees.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      No members assigned to this department yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {deptEmployees.map((emp) => (
                        <span
                          key={emp.id}
                          style={{
                            fontSize: '11.5px',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-faint)',
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '999px', backgroundColor: 'var(--brand-accent)' }} />
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
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Department Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Engineering & Infrastructure"
              value={fName}
              onChange={(e) => setFName(e.target.value)}
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Department Lead / Head of Unit
            </label>
            <input
              type="text"
              placeholder="e.g. Alex Mercer"
              value={fHeadName}
              onChange={(e) => setFHeadName(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
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
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Mission & Responsibilities
            </label>
            <textarea
              rows={3}
              placeholder="Core focus areas, team objectives, tooling allowances..."
              value={fDescription}
              onChange={(e) => setFDescription(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingDept ? 'Update Department' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
