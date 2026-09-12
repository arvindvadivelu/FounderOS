import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Users,
  Plus,
  Search,
  DollarSign,
  Briefcase,
  Calendar,
  Building,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Filter,
  UserPlus,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { db } from '../../db';
import { SpotlightCard } from '../../components/common/SpotlightCard';
import { MetricCard } from '../../components/common/MetricCard';
import { Badge, getStatusBadgeVariant } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAllDepartments,
} from '../../db/services/managementService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Employee, EmploymentType, EmployeeStatus, Currency } from '../../types';

export const EmployeesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fRole, setFRole] = useState('');
  const [fDeptId, setFDeptId] = useState('');
  const [fType, setFType] = useState<EmploymentType>('full_time');
  const [fSalary, setFSalary] = useState<number>(0);
  const [fSalaryPeriod, setFSalaryPeriod] = useState<'annual' | 'monthly' | 'hourly'>('annual');
  const [fStatus, setFStatus] = useState<EmployeeStatus>('active');
  const [fStartDate, setFStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [fNotes, setFNotes] = useState('');

  // Live Queries
  const company = useLiveQuery(async () => (await db.companies.toArray())[0], []);
  const employees = useLiveQuery(async () => await getAllEmployees(), []) || [];
  const departments = useLiveQuery(async () => await getAllDepartments(), []) || [];

  const currency = company?.currency || 'USD';

  // Metrics
  const activeEmployees = employees.filter((e) => e.status === 'active');
  let totalAnnualPayroll = 0;
  let totalMonthlyPayroll = 0;

  for (const emp of activeEmployees) {
    let annual = 0;
    if (emp.salaryPeriod === 'annual') annual = emp.salary || 0;
    else if (emp.salaryPeriod === 'monthly') annual = (emp.salary || 0) * 12;
    else if (emp.salaryPeriod === 'hourly') annual = (emp.salary || 0) * 2080;

    totalAnnualPayroll += annual;
    totalMonthlyPayroll += annual / 12;
  }

  const openCreateModal = () => {
    setEditingEmployee(null);
    setFName('');
    setFEmail('');
    setFPhone('');
    setFRole('');
    setFDeptId(departments[0]?.id || '');
    setFType('full_time');
    setFSalary(120000);
    setFSalaryPeriod('annual');
    setFStatus('active');
    setFStartDate(new Date().toISOString().split('T')[0]);
    setFNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFName(emp.name);
    setFEmail(emp.email);
    setFPhone(emp.phone || '');
    setFRole(emp.role);
    setFDeptId(emp.departmentId || '');
    setFType(emp.employmentType);
    setFSalary(emp.salary);
    setFSalaryPeriod(emp.salaryPeriod);
    setFStatus(emp.status);
    setFStartDate(emp.startDate);
    setFNotes(emp.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim() || !fEmail.trim() || !fRole.trim()) return;

    const selectedDept = departments.find((d) => d.id === fDeptId);

    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, {
        name: fName,
        email: fEmail,
        phone: fPhone || undefined,
        role: fRole,
        departmentId: fDeptId || undefined,
        departmentName: selectedDept?.name,
        employmentType: fType,
        salary: Number(fSalary),
        salaryPeriod: fSalaryPeriod,
        status: fStatus,
        startDate: fStartDate,
        notes: fNotes || undefined,
      });
    } else {
      await createEmployee({
        name: fName,
        email: fEmail,
        phone: fPhone || undefined,
        role: fRole,
        departmentId: fDeptId || undefined,
        departmentName: selectedDept?.name,
        employmentType: fType,
        salary: Number(fSalary),
        salaryPeriod: fSalaryPeriod,
        currency,
        status: fStatus,
        startDate: fStartDate,
        notes: fNotes || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Remove employee record for "${name}"?`)) {
      await deleteEmployee(id);
    }
  };

  // Filtered List
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'all' || emp.departmentId === deptFilter;
    const matchesType = typeFilter === 'all' || emp.employmentType === typeFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesType && matchesStatus;
  });

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
              MANAGEMENT / HUMAN CAPITAL
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Employee & Team Directory
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '600px' }}>
            Manage startup headcount, roles, department assignments, and track monthly payroll obligations.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '13.5px' }}
        >
          <UserPlus size={16} /> Add Team Member
        </button>
      </SpotlightCard>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <MetricCard
          title="Active Headcount"
          value={`${activeEmployees.length} Members`}
          subtitle={`${employees.filter((e) => e.employmentType === 'full_time').length} Full-Time • ${employees.filter((e) => e.employmentType === 'contractor').length} Contractors`}
          icon={<Users size={18} />}
        />

        <MetricCard
          title="Monthly Payroll Burn"
          value={formatCurrency(Math.round(totalMonthlyPayroll), currency)}
          subtitle="Direct compensation outflow"
          icon={<DollarSign size={18} />}
        />

        <MetricCard
          title="Annualized Payroll"
          value={formatCurrency(Math.round(totalAnnualPayroll), currency)}
          subtitle="Annualized run rate"
          icon={<Briefcase size={18} />}
        />

        <MetricCard
          title="Departments"
          value={`${departments.length} Teams`}
          subtitle="Organizational units"
          icon={<Building size={18} />}
        />
      </div>

      {/* Controls Bar: Search & Filters */}
      <SpotlightCard style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px', maxWidth: '450px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
              <input
                type="text"
                placeholder="Search by name, role, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', fontSize: '12.5px' }}
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', fontSize: '12.5px' }}
            >
              <option value="all">All Types</option>
              <option value="full_time">Full-Time</option>
              <option value="part_time">Part-Time</option>
              <option value="contractor">Contractor</option>
              <option value="advisor">Advisor</option>
              <option value="intern">Intern</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', fontSize: '12.5px' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>
      </SpotlightCard>

      {/* Employees Table */}
      {filteredEmployees.length === 0 ? (
        <EmptyState
          title="No team members found"
          description="No employees match your search filter. Click 'Add Team Member' to record a new team member."
          actionText="Add First Team Member"
          onAction={openCreateModal}
        />
      ) : (
        <SpotlightCard style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Role & Title</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Compensation</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => {
                  const dept = departments.find((d) => d.id === emp.departmentId);
                  const initials = emp.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '999px',
                              backgroundColor: 'var(--primary-blue-surface)',
                              color: 'var(--brand-accent)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '12px',
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{emp.name}</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={11} /> {emp.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp.role}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11.5px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-faint)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {dept?.name || emp.departmentName || 'General'}
                        </span>
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {emp.employmentType.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--brand-accent)' }}>
                          {formatCurrency(emp.salary, currency)}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginLeft: '4px' }}>
                          /{emp.salaryPeriod === 'annual' ? 'yr' : emp.salaryPeriod === 'monthly' ? 'mo' : 'hr'}
                        </span>
                      </td>
                      <td>
                        <Badge
                          variant={emp.status === 'active' ? 'green' : emp.status === 'on_leave' ? 'amber' : 'red'}
                        >
                          {emp.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                          {formatDate(emp.startDate)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(emp)}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(emp.id, emp.name)}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--accent-rose)' }}
                            title="Delete"
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
        </SpotlightCard>
      )}

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? 'Edit Team Member' : 'Add Team Member'}
        subtitle="Manage employee profile, compensation, and department assignment"
        maxWidth="560px"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Mercer"
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                className="input-field"
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Job Title / Role *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Founding AI Engineer"
                value={fRole}
                onChange={(e) => setFRole(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="alex@company.com"
                value={fEmail}
                onChange={(e) => setFEmail(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={fPhone}
                onChange={(e) => setFPhone(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Department
              </label>
              <select
                value={fDeptId}
                onChange={(e) => setFDeptId(e.target.value)}
                className="input-field"
              >
                <option value="">No Department Assigned</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Employment Type
              </label>
              <select
                value={fType}
                onChange={(e) => setFType(e.target.value as EmploymentType)}
                className="input-field"
              >
                <option value="full_time">Full-Time</option>
                <option value="part_time">Part-Time</option>
                <option value="contractor">Contractor</option>
                <option value="advisor">Advisor</option>
                <option value="intern">Intern</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Compensation ({currency}) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={fSalary}
                onChange={(e) => setFSalary(Number(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Period
              </label>
              <select
                value={fSalaryPeriod}
                onChange={(e) => setFSalaryPeriod(e.target.value as any)}
                className="input-field"
              >
                <option value="annual">Annual</option>
                <option value="monthly">Monthly</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={fStatus}
                onChange={(e) => setFStatus(e.target.value as EmployeeStatus)}
                className="input-field"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Start Date
              </label>
              <input
                type="date"
                value={fStartDate}
                onChange={(e) => setFStartDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Notes & Background
            </label>
            <textarea
              rows={2}
              placeholder="Responsibilities, equity, key milestones..."
              value={fNotes}
              onChange={(e) => setFNotes(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingEmployee ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
