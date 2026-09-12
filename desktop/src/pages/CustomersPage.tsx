import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Users,
  Plus,
  Search,
  ExternalLink,
  Mail,
  Phone,
  Edit2,
  Trash2,
  X,
  TrendingUp,
  Receipt,
  Building2,
  Calendar,
} from 'lucide-react';
import { db } from '../db';
import { MetricCard } from '../components/common/MetricCard';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { createCustomer, updateCustomer, deleteCustomer } from '../db/services/customerService';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import type { Customer, CustomerStatus } from '../types';

const CUSTOMER_STATUS_CONFIG: Record<CustomerStatus, { color: string; bg: string; border: string }> = {
  active: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' },
  lead: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
  prospect: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.25)' },
  inactive: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)' },
  churned: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)' },
  at_risk: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.25)' },
};

export const CustomersPage: React.FC = () => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<CustomerStatus>('active');
  const [plan, setPlan] = useState('Growth Pro');
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(2400);
  const [source, setSource] = useState('Inbound');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Live Queries
  const company = useLiveQuery(async () => (await db.companies.toArray())[0], []);
  const customers = useLiveQuery(async () => await db.customers.toArray(), []) || [];
  const deals = useLiveQuery(async () => await db.deals.toArray(), []) || [];
  const invoices = useLiveQuery(async () => await db.invoices.toArray(), []) || [];

  const currency = company?.currency || 'USD';

  // Metrics
  const activeCusts = customers.filter((c) => c.status === 'active');
  const leadsCount = customers.filter((c) => c.status === 'lead' || c.status === 'prospect').length;
  const churnedCount = customers.filter((c) => c.status === 'churned').length;
  const totalMrr = activeCusts.reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0);

  // Filtered List
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.tags && c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const customerDeals = deals.filter((d) => d.customerId === selectedCustomerId);
  const customerInvoices = invoices.filter((i) => i.customerId === selectedCustomerId);

  const openAddModal = () => {
    setEditingCustomer(null);
    setCompanyName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setStatus('active');
    setPlan('Growth Pro');
    setMonthlyRevenue(2400);
    setSource('Inbound');
    setNotes('');
    setTagsInput('Enterprise');
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setCompanyName(cust.companyName);
    setContactName(cust.contactName);
    setEmail(cust.email);
    setPhone(cust.phone || '');
    setWebsite(cust.website || '');
    setStatus(cust.status);
    setPlan(cust.plan || 'Custom');
    setMonthlyRevenue(cust.monthlyRevenue || 0);
    setSource(cust.source || '');
    setNotes(cust.notes || '');
    setTagsInput(cust.tags?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactName || !email) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, {
        companyName,
        contactName,
        email,
        phone: phone || undefined,
        website: website || undefined,
        status,
        plan,
        monthlyRevenue: Number(monthlyRevenue),
        source,
        notes,
        tags: parsedTags,
      });
      showToast('success', 'Customer Updated', `Customer "${companyName}" saved successfully.`);
    } else {
      await createCustomer({
        companyName,
        contactName,
        email,
        phone: phone || undefined,
        website: website || undefined,
        status,
        plan,
        monthlyRevenue: Number(monthlyRevenue),
        source,
        notes,
        tags: parsedTags,
      });
      showToast('success', 'Customer Created', `Customer "${companyName}" added successfully.`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      await deleteCustomer(id);
      if (selectedCustomerId === id) setSelectedCustomerId(null);
      showToast('info', 'Customer Deleted', 'Customer record was removed.');
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
            RELATIONSHIP INTELLIGENCE • ACCOUNT HEALTH DIRECTORY
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
            Customer Relationship Management
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', maxWidth: '640px' }}>
            Manage enterprise accounts, active subscriptions, contract values, and prospect pipeline history.
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
          <span>Add Customer</span>
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
          title="Total Customers"
          value={customers.length}
          subtitle={`${activeCusts.length} paying accounts`}
          icon={<Users size={18} />}
        />

        <MetricCard
          title="Customer MRR"
          value={formatCurrency(totalMrr, currency)}
          subtitle="Monthly recurring revenue"
          changeType="positive"
          icon={<TrendingUp size={18} />}
        />

        <MetricCard
          title="Pipeline Leads"
          value={leadsCount}
          subtitle="Leads & qualified prospects"
          icon={<Users size={18} />}
        />

        <MetricCard
          title="Churned Accounts"
          value={churnedCount}
          subtitle={churnedCount === 0 ? '0% churn rate' : `${churnedCount} past clients`}
          changeType={churnedCount === 0 ? 'positive' : 'negative'}
          icon={<Users size={18} />}
        />
      </div>

      {/* Main Customers Card */}
      <div
        style={{
          backgroundColor: '#0b0f19',
          borderRadius: '24px', // DESIGN.md --radius-cards: 24px
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '22px 26px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Filter & Search Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          {/* 50px Pill Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', 'active', 'lead', 'prospect', 'at_risk', 'inactive', 'churned'].map((st) => {
              const isActive = statusFilter === st;
              const count = st === 'all' ? customers.length : customers.filter((c) => c.status === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '50px', // 50px pill button
                    backgroundColor: isActive ? '#0050FF' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    border: isActive ? '1px solid #0050FF' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isActive ? '0 0 12px rgba(0, 80, 255, 0.4)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>

          {/* 50px Pill Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '14px', top: '11px', color: '#64748b' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies, contacts, tags..."
              style={{
                padding: '7px 16px 7px 36px',
                borderRadius: '50px', // 50px pill search
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '12.5px',
                width: '260px',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(0, 80, 255, 0.4)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            title="No customers found"
            description="Add your first customer account to track relationships, revenue subscriptions, and communication logs."
            actionText="Add New Customer"
            onAction={openAddModal}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Company / Account</th>
                  <th>Contact Person</th>
                  <th>Status</th>
                  <th>Plan Tier</th>
                  <th style={{ textAlign: 'right' }}>MRR</th>
                  <th>Tags</th>
                  <th>Last Activity</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => {
                  const statusCfg = CUSTOMER_STATUS_CONFIG[cust.status] || {
                    color: '#94a3b8',
                    bg: 'rgba(148, 163, 184, 0.12)',
                    border: 'rgba(148, 163, 184, 0.25)',
                  };

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setSelectedCustomerId(cust.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{cust.companyName}</div>
                        {cust.website && (
                          <span style={{ fontSize: '11px', color: '#38bdf8' }}>
                            {cust.website.replace(/^https?:\/\//, '')}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{cust.contactName}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{cust.email}</div>
                      </td>
                      <td>
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
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'capitalize',
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
                          {cust.status}
                        </div>
                      </td>
                      <td style={{ color: '#94a3b8' }}>{cust.plan || '—'}</td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: cust.monthlyRevenue > 0 ? '#34d399' : '#64748b',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {cust.monthlyRevenue > 0 ? formatCurrency(cust.monthlyRevenue, currency) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {cust.tags?.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '10px', // DESIGN.md --radius-small: 10px (replaced sharp 4px)
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: '#94a3b8',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {formatRelativeTime(cust.lastActivityAt)}
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(cust)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%', // Circular 50% radius
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
                            title="Edit Customer"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomer(cust.id)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%', // Circular 50% radius
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
                            title="Delete Customer"
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

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 2200,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setSelectedCustomerId(null)}
        >
          <div
            className="animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '520px',
              height: '100%',
              backgroundColor: '#0b0f19',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.6)',
              overflowY: 'auto',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '22px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                {(() => {
                  const sCfg = CUSTOMER_STATUS_CONFIG[selectedCustomer.status] || {
                    color: '#94a3b8',
                    bg: 'rgba(148, 163, 184, 0.12)',
                    border: 'rgba(148, 163, 184, 0.25)',
                  };
                  return (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 10px',
                        borderRadius: '10px', // 10px tag chip
                        backgroundColor: sCfg.bg,
                        border: `1px solid ${sCfg.border}`,
                        color: sCfg.color,
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        marginBottom: '8px',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: sCfg.color,
                          boxShadow: `0 0 6px ${sCfg.color}`,
                        }}
                      />
                      {selectedCustomer.status}
                    </div>
                  );
                })()}
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em', margin: 0 }}>
                  {selectedCustomer.companyName}
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                  {selectedCustomer.plan || 'Standard Account'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* MRR Banner */}
            <div
              style={{
                padding: '18px 20px',
                borderRadius: '16px', // Replaced sharp radius with 16px
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  MONTHLY VALUE (MRR)
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#34d399', letterSpacing: '-0.03em', marginTop: '2px' }}>
                  {formatCurrency(selectedCustomer.monthlyRevenue, currency)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => openEditModal(selectedCustomer)}
                style={{
                  borderRadius: '50px', // 50px pill button
                  padding: '7px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Edit2 size={13} /> Edit Account
              </button>
            </div>

            {/* Contact Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={15} color="#38bdf8" />
                <span style={{ color: '#64748b' }}>Contact:</span>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>{selectedCustomer.contactName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={15} color="#38bdf8" />
                <span style={{ color: '#64748b' }}>Email:</span>
                <a href={`mailto:${selectedCustomer.email}`} style={{ color: '#38bdf8' }}>
                  {selectedCustomer.email}
                </a>
              </div>
              {selectedCustomer.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone size={15} color="#38bdf8" />
                  <span style={{ color: '#64748b' }}>Phone:</span>
                  <span style={{ color: '#f8fafc' }}>{selectedCustomer.phone}</span>
                </div>
              )}
              {selectedCustomer.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ExternalLink size={15} color="#38bdf8" />
                  <span style={{ color: '#64748b' }}>Website:</span>
                  <a href={selectedCustomer.website} target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>
                    {selectedCustomer.website}
                  </a>
                </div>
              )}
            </div>

            {/* Notes */}
            {selectedCustomer.notes && (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px', // Replaced sharp 4px with 14px
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  fontSize: '12.5px',
                  color: '#94a3b8',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ display: 'block', color: '#f8fafc', marginBottom: '4px' }}>Relationship Notes:</strong>
                {selectedCustomer.notes}
              </div>
            )}

            {/* Linked Deals */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
                Sales Pipeline Deals ({customerDeals.length})
              </h4>
              {customerDeals.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#64748b' }}>No deals attached to this customer.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {customerDeals.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px', // Replaced sharp 4px with 14px
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>{d.name}</div>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '1px 7px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(0, 80, 255, 0.12)',
                            color: '#38bdf8',
                            display: 'inline-block',
                            marginTop: '2px',
                          }}
                        >
                          {d.stage}
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, color: '#34d399', letterSpacing: '-0.02em' }}>
                        {formatCurrency(d.value, currency)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked Invoices */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
                Invoices ({customerInvoices.length})
              </h4>
              {customerInvoices.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#64748b' }}>No invoices issued yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {customerInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px', // Replaced sharp 4px with 14px
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>
                          {inv.invoiceNumber}
                        </div>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '1px 7px',
                            borderRadius: '10px',
                            backgroundColor: inv.status === 'paid' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: inv.status === 'paid' ? '#34d399' : '#f59e0b',
                            display: 'inline-block',
                            marginTop: '2px',
                          }}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                        {formatCurrency(inv.amount, currency)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer Account' : 'Add New Customer Account'}
        subtitle="Manage CRM account details, subscription tier, and contact information"
      >
        <form onSubmit={handleSaveCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Company Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Primary Contact Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="sarah@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              >
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="active">Active</option>
                <option value="at_risk">At Risk</option>
                <option value="inactive">Inactive</option>
                <option value="churned">Churned</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Plan Tier
              </label>
              <input
                type="text"
                placeholder="Enterprise, Growth Pro"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Monthly MRR ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(parseFloat(e.target.value) || 0)}
                placeholder="2400"
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Website
              </label>
              <input
                type="text"
                placeholder="https://acme.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="Enterprise, High-ACV, Security"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="input-field"
                style={{ borderRadius: '12px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Relationship Notes
            </label>
            <textarea
              rows={3}
              placeholder="Important context, expansion opportunities, or contract notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              style={{ borderRadius: '12px' }}
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
              <span>{editingCustomer ? 'Update Customer' : 'Add Customer'}</span>
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
