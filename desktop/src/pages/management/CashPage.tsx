import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Wallet,
  Landmark,
  Plus,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { db } from '../../db';
import { SpotlightCard } from '../../components/common/SpotlightCard';
import { MetricCard } from '../../components/common/MetricCard';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import {
  getAllBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getCashPositionSummary,
} from '../../db/services/managementService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../components/common/Toast';
import type { BankAccount, BankAccountType, Currency } from '../../types';

export const CashPage: React.FC = () => {
  const { showToast } = useToast();
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  // Form State
  const [fName, setFName] = useState('');
  const [fInstitution, setFInstitution] = useState('');
  const [fMask, setFMask] = useState('•••• 0000');
  const [fType, setFType] = useState<BankAccountType>('checking');
  const [fBalance, setFBalance] = useState<number>(50000);
  const [fApy, setFApy] = useState<number>(0);
  const [fIsPrimary, setFIsPrimary] = useState(false);
  const [fNotes, setFNotes] = useState('');

  // Live Queries
  const company = useLiveQuery(async () => (await db.companies.toArray())[0], []);
  const accounts = useLiveQuery(async () => await getAllBankAccounts(), []) || [];
  const transactions = useLiveQuery(async () => await db.transactions.toArray(), []) || [];

  const currency = company?.currency || 'USD';

  // Metrics
  let totalCash = 0;
  let checkingCash = 0;
  let treasuryCash = 0;
  let estimatedAnnualYield = 0;

  for (const a of accounts) {
    totalCash += a.balance || 0;
    if (a.accountType === 'checking' || a.accountType === 'stripe') {
      checkingCash += a.balance || 0;
    } else if (a.accountType === 'treasury' || a.accountType === 'savings') {
      treasuryCash += a.balance || 0;
      if (a.apy) {
        estimatedAnnualYield += (a.balance * a.apy) / 100;
      }
    }
  }

  const openCreateModal = () => {
    setEditingAccount(null);
    setFName('Operating Checking');
    setFInstitution('Silicon Valley Bank');
    setFMask('•••• 1234');
    setFType('checking');
    setFBalance(50000);
    setFApy(0);
    setFIsPrimary(accounts.length === 0);
    setFNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (acc: BankAccount) => {
    setEditingAccount(acc);
    setFName(acc.accountName);
    setFInstitution(acc.institution);
    setFMask(acc.accountNumberMask);
    setFType(acc.accountType);
    setFBalance(acc.balance);
    setFApy(acc.apy || 0);
    setFIsPrimary(acc.isPrimary);
    setFNotes(acc.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim() || !fInstitution.trim()) return;

    if (editingAccount) {
      await updateBankAccount(editingAccount.id, {
        accountName: fName,
        institution: fInstitution,
        accountNumberMask: fMask,
        accountType: fType,
        balance: Number(fBalance),
        apy: fApy ? Number(fApy) : undefined,
        isPrimary: fIsPrimary,
        notes: fNotes || undefined,
        lastReconciledAt: new Date().toISOString(),
      });
      showToast('success', 'Bank Account Updated', `Account "${fName}" updated successfully.`);
    } else {
      await createBankAccount({
        accountName: fName,
        institution: fInstitution,
        accountNumberMask: fMask,
        accountType: fType,
        balance: Number(fBalance),
        apy: fApy ? Number(fApy) : undefined,
        currency,
        isPrimary: fIsPrimary,
        notes: fNotes || undefined,
        lastReconciledAt: new Date().toISOString(),
      });
      showToast('success', 'Bank Account Added', `Account "${fName}" saved.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Remove bank account "${name}"?`)) {
      await deleteBankAccount(id);
      showToast('info', 'Bank Account Removed', `Account "${name}" deleted.`);
    }
  };

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
              MANAGEMENT / TREASURY & LIQUIDITY
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Cash & Treasury Management
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '600px' }}>
            Track liquid company reserves across operating checking, high-yield treasury vaults, and Stripe merchant balances.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '13.5px' }}
        >
          <Plus size={16} /> Link Bank Account
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
          title="Total Cash Reserves"
          value={formatCurrency(totalCash, currency)}
          subtitle={`${accounts.length} connected accounts`}
          icon={<Wallet size={18} />}
        />

        <MetricCard
          title="Operating Checking"
          value={formatCurrency(checkingCash, currency)}
          subtitle="Immediate liquid capital"
          icon={<DollarSign size={18} />}
        />

        <MetricCard
          title="Treasury & Savings"
          value={formatCurrency(treasuryCash, currency)}
          subtitle="Yield-generating reserves"
          icon={<Landmark size={18} />}
        />

        <MetricCard
          title="Est. Annual Treasury Yield"
          value={formatCurrency(Math.round(estimatedAnnualYield), currency)}
          change="Passive return"
          changeType="positive"
          subtitle="From T-Bills & High-Yield APY"
          icon={<TrendingUp size={18} />}
        />
      </div>

      {/* Connected Accounts Cards */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-dim)' }}>
            Connected Bank & Treasury Accounts ({accounts.length})
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            🔒 Local IndexedDB Encrypted Ledger
          </span>
        </div>

        {accounts.length === 0 ? (
          <EmptyState
            title="No cash accounts linked"
            description="Link operating checking, Mercury Treasury, or Stripe payout accounts to monitor real-time company cash."
            actionText="Link First Account"
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
            {accounts.map((acc) => (
              <SpotlightCard
                key={acc.id}
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  border: acc.isPrimary ? '1px solid var(--border-active)' : undefined,
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
                      <Landmark size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--text-main)' }}>
                          {acc.accountName}
                        </h4>
                        {acc.isPrimary && (
                          <span
                            style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '999px',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              fontWeight: 700,
                            }}
                          >
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {acc.institution} • <span style={{ fontFamily: 'var(--font-mono)' }}>{acc.accountNumberMask}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(acc)}
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(acc.id, acc.accountName)}
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--accent-rose)' }}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Current Balance
                    </span>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                      {formatCurrency(acc.balance, currency)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-page)',
                        border: '1px solid var(--border-faint)',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      {acc.accountType}
                    </span>
                    {acc.apy ? (
                      <div style={{ fontSize: '11.5px', color: '#34d399', fontWeight: 700, marginTop: '4px' }}>
                        +{acc.apy}% APY Yield
                      </div>
                    ) : null}
                  </div>
                </div>

                {acc.notes && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {acc.notes}
                  </p>
                )}

                {acc.lastReconciledAt && (
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                    <CheckCircle2 size={12} color="#34d399" /> Last synchronized: {formatDate(acc.lastReconciledAt)}
                  </div>
                )}
              </SpotlightCard>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Bank Account Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? 'Edit Cash Account' : 'Link Cash Account'}
        subtitle="Manage bank balance, account masks, and treasury yields"
        maxWidth="500px"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Account Nickname *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Operating Checking or Treasury Vault"
              value={fName}
              onChange={(e) => setFName(e.target.value)}
              className="input-field"
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Financial Institution *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Silicon Valley Bank"
                value={fInstitution}
                onChange={(e) => setFInstitution(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Account Mask
              </label>
              <input
                type="text"
                placeholder="•••• 4821"
                value={fMask}
                onChange={(e) => setFMask(e.target.value)}
                className="input-field"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Account Type
              </label>
              <select
                value={fType}
                onChange={(e) => setFType(e.target.value as BankAccountType)}
                className="input-field"
              >
                <option value="checking">Operating Checking</option>
                <option value="treasury">Treasury / T-Bills</option>
                <option value="savings">High-Yield Savings</option>
                <option value="stripe">Stripe Escrow</option>
                <option value="paypal">PayPal</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Current Balance ({currency}) *
              </label>
              <input
                type="number"
                required
                step="100"
                value={fBalance}
                onChange={(e) => setFBalance(Number(e.target.value))}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Annual Percentage Yield (APY % if applicable)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.05"
              placeholder="e.g. 5.15"
              value={fApy}
              onChange={(e) => setFApy(Number(e.target.value))}
              className="input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Notes / Purpose
            </label>
            <textarea
              rows={2}
              placeholder="Primary payroll clearing, vendor direct debits..."
              value={fNotes}
              onChange={(e) => setFNotes(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="fPrimary"
              checked={fIsPrimary}
              onChange={(e) => setFIsPrimary(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--brand-accent)' }}
            />
            <label htmlFor="fPrimary" style={{ fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }}>
              Set as Primary Operating Account
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingAccount ? 'Update Account' : 'Save Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
