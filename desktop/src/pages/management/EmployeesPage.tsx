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
import { useToast } from '../../components/common/Toast';
import type { Employee, EmploymentType, EmployeeStatus, Currency } from '../../types';

export const EmployeesPage: React.FC = () => {
  const { showToast } = useToast();
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
      showToast('success', 'Employee Updated', `Profile for "${fName}" updated.`);
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
      showToast('success', 'Employee Added', `Employee "${fName}" added.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Remove employee record for "${name}"?`)) {
      await deleteEmployee(id);
      showToast('info', 'Employee Removed', `Record for "${name}" deleted.`);
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
            MANAGEMENT • HUMAN CAPITAL & HEADCOUNT LEDGER
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
            Employee & Team Directory
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', maxWidth: '640px' }}>
            Manage startup headcount, roles, department assignments, and track monthly payroll obligations.
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
          <UserPlus size={16} />
          <span>Add Team Member</span>
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
      <SpotlightCard
        style={{
          padding: '16px 20px',
          borderRadius: '24px', // DESIGN.md --radius-cards: 24px
          backgroundColor: '#0b0f19',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px', maxWidth: '450px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '12px' }} />
              <input
                type="text"
                placeholder="Search by name, role, email..."
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

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{
                borderRadius: '50px', // DESIGN.md 50px pill
                padding: '8px 16px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '12.5px',
                cursor: 'pointer',
                outline: 'none',
              }}
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
              style={{
                borderRadius: '50px', // DESIGN.md 50px pill
                padding: '8px 16px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '12.5px',
                cursor: 'pointer',
                outline: 'none',
              }}
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
              style={{
                borderRadius: '50px', // DESIGN.md 50px pill
                padding: '8px 16px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '12.5px',
                cursor: 'pointer',
                outline: 'none',
              }}
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
        <SpotlightCard
          style={{
            padding: 0,
            borderRadius: '24px', // DESIGN.md --radius-cards: 24px
            backgroundColor: '#0b0f19',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
          }}
        >
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

                  const statusConfig = {
                    active: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.28)', color: '#34d399', dot: '#10b981', label: 'Active' },
                    on_leave: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.28)', color: '#fbbf24', dot: '#f59e0b', label: 'On Leave' },
                    terminated: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.28)', color: '#f87171', dot: '#ef4444', label: 'Terminated' },
                  }[emp.status] || { bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.28)', color: '#94a3b8', dot: '#94a3b8', label: emp.status };

                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, rgba(0, 80, 255, 0.25) 0%, rgba(56, 189, 248, 0.15) 100%)',
                              border: '1px solid rgba(0, 80, 255, 0.35)',
                              color: '#38bdf8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '12px',
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>{emp.name}</div>
                            <div style={{ fontSize: '11.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Mail size={11} /> {emp.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px' }}>{emp.role}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11.5px',
                            padding: '3px 9px',
                            borderRadius: '10px', // DESIGN.md 10px tag chip (replaces 4px)
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#94a3b8',
                            fontWeight: 600,
                          }}
                        >
                          {dept?.name || emp.departmentName || 'General'}
                        </span>
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize', fontSize: '12.5px', color: '#cbd5e1' }}>
                          {emp.employmentType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                          {formatCurrency(emp.salary, currency)}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '4px' }}>
                          /{emp.salaryPeriod === 'annual' ? 'yr' : emp.salaryPeriod === 'monthly' ? 'mo' : 'hr'}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 9px',
                            borderRadius: '10px', // DESIGN.md 10px tag chip
                            backgroundColor: statusConfig.bg,
                            border: `1px solid ${statusConfig.border}`,
                            color: statusConfig.color,
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                          }}
                        >
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              backgroundColor: statusConfig.dot,
                              boxShadow: `0 0 6px ${statusConfig.dot}`,
                            }}
                          />
                          {statusConfig.label.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                          {formatDate(emp.startDate)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(emp)}
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
                            title="Edit Team Member"
                          >
                            <Edit2 size={12.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(emp.id, emp.name)}
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
                            title="Delete Record"
                          >
                            <Trash2 size={12.5} />
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
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Mercer"
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
                Job Title / Role *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Founding AI Engineer"
                value={fRole}
                onChange={(e) => setFRole(e.target.value)}
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="alex@company.com"
                value={fEmail}
                onChange={(e) => setFEmail(e.target.value)}
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
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={fPhone}
                onChange={(e) => setFPhone(e.target.value)}
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Department
              </label>
              <select
                value={fDeptId}
                onChange={(e) => setFDeptId(e.target.value)}
                className="input-field"
                style={{
                  borderRadius: '12px',
                  padding: '10px 14px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <option value="">No Department Assigned</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Employment Type
              </label>
              <select
                value={fType}
                onChange={(e) => setFType(e.target.value as EmploymentType)}
                className="input-field"
                style={{
                  borderRadius: '12px',
                  padding: '10px 14px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
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
                Period
              </label>
              <select
                value={fSalaryPeriod}
                onChange={(e) => setFSalaryPeriod(e.target.value as any)}
                className="input-field"
                style={{
                  borderRadius: '12px',
                  padding: '10px 14px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <option value="annual">Annual</option>
                <option value="monthly">Monthly</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={fStatus}
                onChange={(e) => setFStatus(e.target.value as EmployeeStatus)}
                className="input-field"
                style={{
                  borderRadius: '12px',
                  padding: '10px 14px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Start Date
              </label>
              <input
                type="date"
                value={fStartDate}
                onChange={(e) => setFStartDate(e.target.value)}
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
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Notes & Background
            </label>
            <textarea
              rows={2}
              placeholder="Responsibilities, equity, key milestones..."
              value={fNotes}
              onChange={(e) => setFNotes(e.target.value)}
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
              <span>{editingEmployee ? 'Update Member' : 'Add Member'}</span>
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
