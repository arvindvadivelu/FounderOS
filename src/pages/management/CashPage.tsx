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
  Lock,
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
            MANAGEMENT • TREASURY & LIQUIDITY LEDGER
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
            Cash & Treasury Management
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', maxWidth: '640px' }}>
            Track liquid company reserves across operating checking, high-yield treasury vaults, and Stripe merchant balances.
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
          <Plus size={15} />
          <span>Add Bank Account</span>
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3
              style={{
                fontSize: '13.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#f8fafc',
                margin: 0,
              }}
            >
              Connected Accounts & Vaults
            </h3>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 10px',
                borderRadius: '10px', // DESIGN.md 10px tag chip
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '11px',
                fontWeight: 600,
                color: '#94a3b8',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: '#38bdf8',
                }}
              />
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
            </span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '10px', // DESIGN.md 10px tag chip
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              fontSize: '11.5px',
              fontWeight: 600,
              color: '#34d399',
            }}
          >
            <ShieldCheck size={14} color="#10b981" />
            <span>Encrypted Local Ledger</span>
          </div>
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
                  borderRadius: '24px', // DESIGN.md --radius-cards: 24px
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  backdropFilter: 'blur(16px)',
                  border: acc.isPrimary
                    ? '1px solid rgba(0, 80, 255, 0.45)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: acc.isPrimary
                    ? '0 8px 30px rgba(0, 80, 255, 0.12)'
                    : '0 4px 20px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
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
                        background: 'linear-gradient(135deg, rgba(0, 80, 255, 0.2) 0%, rgba(56, 189, 248, 0.1) 100%)',
                        border: '1px solid rgba(0, 80, 255, 0.3)',
                        color: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Landmark size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                          {acc.accountName}
                        </h4>
                        {acc.isPrimary && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '10.5px',
                              padding: '2px 8px',
                              borderRadius: '10px', // DESIGN.md 10px tag chip
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#34d399',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                            }}
                          >
                            <span
                              style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                backgroundColor: '#10b981',
                                boxShadow: '0 0 6px #10b981',
                              }}
                            />
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '3px' }}>
                        {acc.institution} • <span style={{ fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>{acc.accountNumberMask}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(acc)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50px', // DESIGN.md 50px pill
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
                      title="Edit Account"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(acc.id, acc.accountName)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50px', // DESIGN.md 50px pill
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
                      title="Delete Account"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: '16px', // Eliminates sharp 4px/8px corners
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      Current Balance
                    </span>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.03em', marginTop: '2px' }}>
                      {formatCurrency(acc.balance, currency)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '10px', // DESIGN.md 10px tag chip
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {acc.accountType}
                    </span>
                    {acc.apy ? (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '11.5px',
                          color: '#34d399',
                          fontWeight: 700,
                          marginTop: '6px',
                        }}
                      >
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: '#10b981',
                            boxShadow: '0 0 5px #10b981',
                          }}
                        />
                        +{acc.apy}% APY Yield
                      </div>
                    ) : null}
                  </div>
                </div>

                {acc.notes && (
                  <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                    "{acc.notes}"
                  </p>
                )}

                {acc.lastReconciledAt && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginTop: 'auto',
                      paddingTop: '6px',
                    }}
                  >
                    <CheckCircle2 size={13} color="#10b981" />
                    <span>Synchronized {formatDate(acc.lastReconciledAt)}</span>
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
        maxWidth="520px"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              Account Nickname *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Operating Checking or Treasury Vault"
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
                Financial Institution *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Silicon Valley Bank"
                value={fInstitution}
                onChange={(e) => setFInstitution(e.target.value)}
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
                Account Mask
              </label>
              <input
                type="text"
                placeholder="•••• 4821"
                value={fMask}
                onChange={(e) => setFMask(e.target.value)}
                className="input-field"
                style={{
                  borderRadius: '12px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  fontFamily: 'var(--font-mono)',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Account Type
              </label>
              <select
                value={fType}
                onChange={(e) => setFType(e.target.value as BankAccountType)}
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
                <option value="checking">Operating Checking</option>
                <option value="treasury">Treasury / T-Bills</option>
                <option value="savings">High-Yield Savings</option>
                <option value="stripe">Stripe Escrow</option>
                <option value="paypal">PayPal</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Current Balance ({currency}) *
              </label>
              <input
                type="number"
                required
                step="100"
                value={fBalance}
                onChange={(e) => setFBalance(Number(e.target.value))}
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
              Notes / Purpose
            </label>
            <textarea
              rows={2}
              placeholder="Primary payroll clearing, vendor direct debits..."
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
            <input
              type="checkbox"
              id="fPrimary"
              checked={fIsPrimary}
              onChange={(e) => setFIsPrimary(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0050FF' }}
            />
            <label htmlFor="fPrimary" style={{ fontSize: '13px', color: '#f8fafc', cursor: 'pointer', fontWeight: 500 }}>
              Set as Primary Operating Account
            </label>
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
              <span>{editingAccount ? 'Update Account' : 'Save Account'}</span>
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
