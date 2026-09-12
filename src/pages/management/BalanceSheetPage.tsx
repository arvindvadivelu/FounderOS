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
import { Badge } from '../../components/common/Badge';
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
              MANAGEMENT / CORPORATE SOLVENCY
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Assets & Liabilities (Balance Sheet)
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '600px' }}>
            Comprehensive corporate balance sheet tracking fixed assets, software IP, SAFE notes, and calculated Net Worth.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => openCreateModal('asset')}
            className="btn-primary"
            style={{ padding: '10px 18px', fontSize: '13px' }}
          >
            <Plus size={15} /> Add Asset
          </button>
          <button
            type="button"
            onClick={() => openCreateModal('liability')}
            className="btn-secondary"
            style={{ padding: '10px 18px', fontSize: '13px' }}
          >
            <Plus size={15} /> Add Liability
          </button>
        </div>
      </SpotlightCard>

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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-faint)', paddingBottom: '12px' }}>
        {[
          { id: 'all', label: `All Items (${items.length})` },
          { id: 'assets', label: `Assets (${items.filter((i) => i.type === 'asset').length})` },
          { id: 'liabilities', label: `Liabilities (${items.filter((i) => i.type === 'liability').length})` },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isActive ? 'var(--brand-accent)' : 'var(--bg-surface-elevated)',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                fontSize: '12.5px',
                fontWeight: 600,
                border: isActive ? '1px solid var(--border-active)' : '1px solid var(--border-faint)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
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
        <SpotlightCard style={{ padding: 0, overflow: 'hidden' }}>
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
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.name}</div>
                        {item.notes && (
                          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge
                          variant={isAsset ? 'green' : 'red'}
                        >
                          {item.type.toUpperCase()}
                        </Badge>
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
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: isAsset ? '#34d399' : '#f87171' }}>
                          {isAsset ? '+' : '-'}{formatCurrency(item.value, currency)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                          {item.creditorOrVendor || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                          {item.acquisitionDate ? formatDate(item.acquisitionDate) : '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.name)}
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

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Balance Sheet Entry' : `Add ${fType === 'asset' ? 'Asset' : 'Liability'}`}
        subtitle="Manage corporate solvency and capitalization records"
        maxWidth="520px"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MacBook Pro Fleet or SAFE Note"
              value={fName}
              onChange={(e) => setFName(e.target.value)}
              className="input-field"
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
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
              >
                <option value="asset">Asset (+Value)</option>
                <option value="liability">Liability (-Debt)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Sub-Category
              </label>
              <select
                value={fCategory}
                onChange={(e) => setFCategory(e.target.value as BalanceSheetCategory)}
                className="input-field"
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
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
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Acquisition / Incurred Date
              </label>
              <input
                type="date"
                value={fDate}
                onChange={(e) => setFDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Creditor / Vendor / Entity (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Angel Investor, Apple Inc, AWS"
              value={fCreditor}
              onChange={(e) => setFCreditor(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Notes & Depreciation / Terms
            </label>
            <textarea
              rows={2}
              placeholder="Valuation methodology, terms, repayment schedule..."
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
              {editingItem ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
