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
} from 'lucide-react';
import { db } from '../db';
import { SpotlightCard } from '../components/common/SpotlightCard';
import { MetricCard } from '../components/common/MetricCard';
import { Badge, getStatusBadgeVariant } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { createCustomer, updateCustomer, deleteCustomer } from '../db/services/customerService';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';
import type { Customer, CustomerStatus } from '../types';

export const CustomersPage: React.FC = () => {
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
    }

    setIsModalOpen(false);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      await deleteCustomer(id);
      if (selectedCustomerId === id) setSelectedCustomerId(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
            Customer Relationship Management (CRM)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Manage enterprise accounts, active subscriptions, and prospect pipelines.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn-primary"
        >
          <Plus size={15} /> Add Customer
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

      {/* Main Customers Spotlight Table */}
      <SpotlightCard style={{ padding: '20px 24px' }}>
        {/* Filter & Search Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', 'active', 'lead', 'prospect', 'inactive', 'churned'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: statusFilter === st ? 'var(--brand-accent)' : 'var(--bg-surface-elevated)',
                  color: statusFilter === st ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  border: statusFilter === st ? '1px solid var(--border-active)' : '1px solid var(--border-faint)',
                  transition: 'all 0.15s ease',
                }}
              >
                {st} {st !== 'all' ? `(${customers.filter((c) => c.status === st).length})` : `(${customers.length})`}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-dim)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies, contacts, tags..."
              className="input-field"
              style={{ paddingLeft: '32px', width: '240px', padding: '6px 10px 6px 32px', fontSize: '12.5px' }}
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
            <table className="data-table">
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
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{cust.companyName}</div>
                      {cust.website && (
                        <span style={{ fontSize: '11px', color: 'var(--brand-accent)' }}>
                          {cust.website.replace(/^https?:\/\//, '')}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{cust.contactName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{cust.email}</div>
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(cust.status)}>{cust.status}</Badge>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{cust.plan || '—'}</td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: cust.monthlyRevenue > 0 ? '#34d399' : 'var(--text-dim)',
                      }}
                    >
                      {cust.monthlyRevenue > 0 ? formatCurrency(cust.monthlyRevenue, currency) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {cust.tags?.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '10.5px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-surface-elevated)',
                              color: 'var(--text-dim)',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
                      {formatRelativeTime(cust.lastActivityAt)}
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => openEditModal(cust)}
                          style={{ padding: '4px', color: 'var(--text-muted)' }}
                          title="Edit Customer"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(cust.id)}
                          style={{ padding: '4px', color: 'var(--text-dim)' }}
                          title="Delete Customer"
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

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.65)',
            backdropFilter: 'blur(6px)',
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
              backgroundColor: 'var(--bg-surface)',
              borderLeft: '1px solid var(--border-subtle)',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.6)',
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Badge variant={getStatusBadgeVariant(selectedCustomer.status)}>{selectedCustomer.status}</Badge>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: '6px' }}>
                  {selectedCustomer.companyName}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {selectedCustomer.plan || 'Standard Account'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                style={{ padding: '6px', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* MRR Banner */}
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-faint)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>MONTHLY VALUE</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#34d399' }}>
                  {formatCurrency(selectedCustomer.monthlyRevenue, currency)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => openEditModal(selectedCustomer)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                <Edit2 size={13} /> Edit Account
              </button>
            </div>

            {/* Contact Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={15} color="var(--brand-accent)" />
                <span style={{ color: 'var(--text-muted)' }}>Contact:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedCustomer.contactName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={15} color="var(--brand-accent)" />
                <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                <a href={`mailto:${selectedCustomer.email}`} style={{ color: 'var(--brand-accent)' }}>
                  {selectedCustomer.email}
                </a>
              </div>
              {selectedCustomer.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone size={15} color="var(--brand-accent)" />
                  <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                  <span style={{ color: 'var(--text-main)' }}>{selectedCustomer.phone}</span>
                </div>
              )}
              {selectedCustomer.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ExternalLink size={15} color="var(--brand-accent)" />
                  <span style={{ color: 'var(--text-muted)' }}>Website:</span>
                  <a href={selectedCustomer.website} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-accent)' }}>
                    {selectedCustomer.website}
                  </a>
                </div>
              )}
            </div>

            {/* Notes */}
            {selectedCustomer.notes && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-faint)',
                  fontSize: '12.5px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '4px' }}>Notes:</strong>
                {selectedCustomer.notes}
              </div>
            )}

            {/* Linked Deals */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
                Sales Pipeline Deals ({customerDeals.length})
              </h4>
              {customerDeals.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>No deals attached to this customer.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {customerDeals.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{d.name}</div>
                        <Badge variant={getStatusBadgeVariant(d.stage)}>{d.stage}</Badge>
                      </div>
                      <div style={{ fontWeight: 700, color: '#34d399' }}>
                        {formatCurrency(d.value, currency)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked Invoices */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
                Invoices ({customerInvoices.length})
              </h4>
              {customerInvoices.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>No invoices issued yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {customerInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{inv.invoiceNumber}</div>
                        <Badge variant={getStatusBadgeVariant(inv.status)}>{inv.status}</Badge>
                      </div>
                      <div style={{ fontWeight: 700 }}>
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
        <form onSubmit={handleSaveCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Company Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Primary Contact Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
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
                placeholder="sarah@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                className="input-field"
              >
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="churned">Churned</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Plan Tier
              </label>
              <input
                type="text"
                placeholder="Enterprise, Growth Pro"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Monthly MRR ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(parseFloat(e.target.value) || 0)}
                placeholder="2400"
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Website
              </label>
              <input
                type="text"
                placeholder="https://acme.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="Enterprise, High-ACV, Security"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Relationship Notes
            </label>
            <textarea
              rows={3}
              placeholder="Important context, expansion opportunities, or contract notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingCustomer ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
