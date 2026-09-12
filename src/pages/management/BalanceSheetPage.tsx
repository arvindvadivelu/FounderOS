import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Scale,
  Plus,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  Cpu,
  Layers,
  FileCheck,
} from 'lucide-react';
import { db } from '../../db';
import { SpotlightCard } from '../../components/common/SpotlightCard';
import { MetricCard } from '../../components/common/MetricCard';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import {
  getAllBalanceSheetItems,
  createBalanceSheetItem,
  updateBalanceSheetItem,
  deleteBalanceSheetItem,
  getAllBankAccounts,
} from '../../db/services/managementService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../components/common/Toast';
import type { BalanceSheetItem, BalanceSheetCategory, Currency } from '../../types';

export const BalanceSheetPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'assets' | 'liabilities'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BalanceSheetItem | null>(null);

  // Form State
  const [fName, setFName] = useState('');
  const [fType, setFType] = useState<'asset' | 'liability'>('asset');
  const [fCategory, setFCategory] = useState<BalanceSheetCategory>('current_asset');
  const [fValue, setFValue] = useState<number>(10000);
  const [fDate, setFDate] = useState(new Date().toISOString().split('T')[0]);
  const [fRate, setFRate] = useState<number>(0);
  const [fCreditor, setFCreditor] = useState('');
  const [fNotes, setFNotes] = useState('');

  // Live Queries
  const company = useLiveQuery(async () => (await db.companies.toArray())[0], []);
  const items = useLiveQuery(async () => await getAllBalanceSheetItems(), []) || [];
  const bankAccounts = useLiveQuery(async () => await getAllBankAccounts(), []) || [];

  const currency = company?.currency || 'USD';

  // Metrics
  const totalCash = bankAccounts.reduce((sum, b) => sum + (b.balance || 0), 0);
  let otherCurrentAssets = 0;
  let fixedAssets = 0;
  let intangibleAssets = 0;

  let currentLiabilities = 0;
  let longTermLiabilities = 0;

  for (const item of items) {
    if (item.type === 'asset') {
      if (item.category === 'current_asset') otherCurrentAssets += item.value || 0;
      else if (item.category === 'fixed_asset') fixedAssets += item.value || 0;
      else if (item.category === 'intangible_asset') intangibleAssets += item.value || 0;
    } else {
      if (item.category === 'current_liability') currentLiabilities += item.value || 0;
      else if (item.category === 'long_term_liability') longTermLiabilities += item.value || 0;
    }
  }

  const totalCurrentAssets = totalCash + otherCurrentAssets;
  const totalAssets = totalCurrentAssets + fixedAssets + intangibleAssets;
  const totalLiabilities = currentLiabilities + longTermLiabilities;
  const netWorth = totalAssets - totalLiabilities;

  const openCreateModal = (type: 'asset' | 'liability' = 'asset') => {
    setEditingItem(null);
    setFName('');
    setFType(type);
    setFCategory(type === 'asset' ? 'current_asset' : 'current_liability');
    setFValue(10000);
    setFDate(new Date().toISOString().split('T')[0]);
    setFRate(0);
    setFCreditor('');
    setFNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: BalanceSheetItem) => {
    setEditingItem(item);
    setFName(item.name);
    setFType(item.type);
    setFCategory(item.category);
    setFValue(item.value);
    setFDate(item.acquisitionDate || new Date().toISOString().split('T')[0]);
    setFRate(item.depreciationRateAnnual || item.interestRateAnnual || 0);
    setFCreditor(item.creditorOrVendor || '');
    setFNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) return;

    if (editingItem) {
      await updateBalanceSheetItem(editingItem.id, {
        name: fName,
        type: fType,
        category: fCategory,
        value: Number(fValue),
        acquisitionDate: fDate,
        depreciationRateAnnual: fType === 'asset' ? fRate : undefined,
        interestRateAnnual: fType === 'liability' ? fRate : undefined,
        creditorOrVendor: fCreditor || undefined,
        notes: fNotes || undefined,
      });
      showToast('success', 'Balance Item Updated', `Entry "${fName}" updated successfully.`);
    } else {
      await createBalanceSheetItem({
        name: fName,
        type: fType,
        category: fCategory,
        value: Number(fValue),
        currency,
        acquisitionDate: fDate,
        depreciationRateAnnual: fType === 'asset' ? fRate : undefined,
        interestRateAnnual: fType === 'liability' ? fRate : undefined,
        creditorOrVendor: fCreditor || undefined,
        notes: fNotes || undefined,
      });
      showToast('success', 'Balance Item Added', `Entry "${fName}" recorded on balance sheet.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete balance sheet entry "${name}"?`)) {
      await deleteBalanceSheetItem(id);
      showToast('info', 'Balance Item Deleted', `Entry "${name}" removed.`);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === 'assets') return item.type === 'asset';
    if (activeTab === 'liabilities') return item.type === 'liability';
    return true;
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
            MANAGEMENT • CORPORATE SOLVENCY & CAPITALIZATION
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
            Assets & Liabilities (Balance Sheet)
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', maxWidth: '640px' }}>
            Comprehensive corporate balance sheet tracking fixed assets, software IP, SAFE notes, and calculated Net Worth.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => openCreateModal('asset')}
            style={{
              borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
              padding: '10px 20px',
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
            <Plus size={15} />
            <span>Add Asset</span>
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

          <button
            type="button"
            onClick={() => openCreateModal('liability')}
            style={{
              borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
              padding: '10px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
          >
            <Plus size={15} />
            <span>Add Liability</span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#f87171',
                boxShadow: '0 0 6px rgba(248, 113, 113, 0.6)',
              }}
            />
          </button>
        </div>
      </div>

      {/* Primary Net Worth & Solvency Matrix */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <MetricCard
          title="Company Net Worth"
          value={formatCurrency(netWorth, currency)}
          change={netWorth >= 0 ? 'Solvent' : 'Deficit'}
          changeType={netWorth >= 0 ? 'positive' : 'negative'}
          subtitle="Total Assets minus Liabilities"
          icon={<Scale size={18} />}
        />

        <MetricCard
          title="Total Assets"
          value={formatCurrency(totalAssets, currency)}
          subtitle={`Cash: ${formatCurrency(totalCash, currency)} • IP: ${formatCurrency(intangibleAssets, currency)}`}
          icon={<TrendingUp size={18} />}
        />

        <MetricCard
          title="Total Liabilities"
          value={formatCurrency(totalLiabilities, currency)}
          subtitle={`Current AP: ${formatCurrency(currentLiabilities, currency)} • Debt/SAFEs: ${formatCurrency(longTermLiabilities, currency)}`}
          icon={<ShieldAlert size={18} />}
        />

        <MetricCard
          title="Debt-to-Asset Ratio"
          value={totalAssets > 0 ? `${((totalLiabilities / totalAssets) * 100).toFixed(1)}%` : '0%'}
          change={totalLiabilities < totalAssets ? 'Conservative' : 'High Leverage'}
          changeType={totalLiabilities < totalAssets ? 'positive' : 'negative'}
          subtitle="Financial leverage index"
          icon={<Layers size={18} />}
        />
      </div>

      {/* Segmented Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '4px',
          borderRadius: '50px', // DESIGN.md 50px pill container
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          width: 'fit-content',
        }}
      >
        {[
          { id: 'all', label: 'All Items', count: items.length },
          { id: 'assets', label: 'Assets', count: items.filter((i) => i.type === 'asset').length },
          { id: 'liabilities', label: 'Liabilities', count: items.filter((i) => i.type === 'liability').length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '7px 18px',
                borderRadius: '50px', // DESIGN.md 50px pill
                backgroundColor: isActive ? '#0050FF' : 'transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                fontSize: '12.5px',
                fontWeight: isActive ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isActive ? '0 2px 10px rgba(0, 80, 255, 0.35)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {isActive && (
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                  }}
                />
              )}
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                  color: isActive ? '#ffffff' : '#64748b',
                  fontWeight: 600,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="No balance sheet items recorded"
          description="Record capital assets like computers and intellectual property or liabilities like vendor payables and SAFE notes."
          actionText="Add Asset"
          onAction={() => openCreateModal('asset')}
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
                  <th>Item Name</th>
                  <th>Type</th>
                  <th>Classification</th>
                  <th>Book Value</th>
                  <th>Vendor / Creditor</th>
                  <th>Acquisition Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isAsset = item.type === 'asset';
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>{item.name}</div>
                        {item.notes && (
                          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px', fontStyle: 'italic' }}>
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 9px',
                            borderRadius: '10px', // DESIGN.md 10px tag chip
                            backgroundColor: isAsset ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            border: isAsset ? '1px solid rgba(16, 185, 129, 0.28)' : '1px solid rgba(239, 68, 68, 0.28)',
                            color: isAsset ? '#34d399' : '#f87171',
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
                              backgroundColor: isAsset ? '#10b981' : '#ef4444',
                              boxShadow: isAsset ? '0 0 6px #10b981' : '0 0 6px #ef4444',
                            }}
                          />
                          {item.type.toUpperCase()}
                        </span>
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
                            textTransform: 'capitalize',
                            fontWeight: 600,
                          }}
                        >
                          {item.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: '14px',
                            letterSpacing: '-0.02em',
                            fontFamily: 'var(--font-mono)',
                            color: isAsset ? '#34d399' : '#f87171',
                          }}
                        >
                          {isAsset ? '+' : '-'}{formatCurrency(item.value, currency)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px', color: '#cbd5e1' }}>
                          {item.creditorOrVendor || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                          {item.acquisitionDate ? formatDate(item.acquisitionDate) : '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
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
                            title="Edit Entry"
                          >
                            <Edit2 size={12.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.name)}
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
                            title="Delete Entry"
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Balance Sheet Entry' : `Add ${fType === 'asset' ? 'Asset' : 'Liability'}`}
        subtitle="Manage corporate solvency and capitalization records"
        maxWidth="520px"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MacBook Pro Fleet or SAFE Note"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Classification Type
              </label>
              <select
                value={fType}
                onChange={(e) => {
                  const nextType = e.target.value as 'asset' | 'liability';
                  setFType(nextType);
                  setFCategory(nextType === 'asset' ? 'current_asset' : 'current_liability');
                }}
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
                <option value="asset">Asset (+Value)</option>
                <option value="liability">Liability (-Debt)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Sub-Category
              </label>
              <select
                value={fCategory}
                onChange={(e) => setFCategory(e.target.value as BalanceSheetCategory)}
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
                {fType === 'asset' ? (
                  <>
                    <option value="current_asset">Current Asset (Cash / AR)</option>
                    <option value="fixed_asset">Fixed Asset (Hardware / Equipment)</option>
                    <option value="intangible_asset">Intangible Asset (IP / Software)</option>
                  </>
                ) : (
                  <>
                    <option value="current_liability">Current Liability (AP / Accruals)</option>
                    <option value="long_term_liability">Long-Term Debt (SAFEs / Loans)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Book Value ({currency}) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="500"
                value={fValue}
                onChange={(e) => setFValue(Number(e.target.value))}
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
                Acquisition / Incurred Date
              </label>
              <input
                type="date"
                value={fDate}
                onChange={(e) => setFDate(e.target.value)}
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
              Creditor / Vendor / Entity (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Angel Investor, Apple Inc, AWS"
              value={fCreditor}
              onChange={(e) => setFCreditor(e.target.value)}
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
              Notes & Depreciation / Terms
            </label>
            <textarea
              rows={2}
              placeholder="Valuation methodology, terms, repayment schedule..."
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
              <span>{editingItem ? 'Update Entry' : 'Save Entry'}</span>
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
