import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plug,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  GitPullRequest,
  Calendar,
  Mail,
  CreditCard,
  Trash2,
  Eye,
  Key,
  Database,
  Activity,
  ArrowUpRight,
  Info,
  Layers,
  Sparkles,
  Check,
  X,
  Zap,
  Play,
} from 'lucide-react';
import { db } from '../db';
import {
  getAllIntegrations,
  testIntegrationConnection,
  saveIntegration,
  syncIntegration,
  syncAllIntegrations,
  disconnectIntegration,
  getExternalSyncItems,
  getSyncLogs,
  getOverallIntegrationsHealth,
} from '../integrations/integrationService';
import type {
  IntegrationRecord,
  IntegrationProvider,
  ExternalSyncItem,
  SyncLog,
  IntegrationConfig,
} from '../types';
import { useToast } from '../components/common/Toast';

interface IntegrationsPageProps {
  onNavigate?: (route: string) => void;
}

export const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationRecord | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isItemsDrawerOpen, setIsItemsDrawerOpen] = useState(false);
  const [isLogsDrawerOpen, setIsLogsDrawerOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [webhookProvider, setWebhookProvider] = useState<'stripe' | 'github' | 'hubspot' | 'slack'>('stripe');
  const [webhookEventType, setWebhookEventType] = useState('charge.failed');
  const [webhookPayload, setWebhookPayload] = useState('{\n  "amount": 4800,\n  "currency": "usd",\n  "customer": "cust_1",\n  "failure_reason": "card_declined"\n}');
  const [webhookFeedback, setWebhookFeedback] = useState<string | null>(null);

  // Config modal state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [accountEmailInput, setAccountEmailInput] = useState('');
  const [useSandboxInput, setUseSandboxInput] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
    accountLabel?: string;
    latencyMs?: number;
    requiresBackend?: boolean;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [activeSyncId, setActiveSyncId] = useState<string | null>(null);

  // Live queries for real-time reactivity
  const integrations = useLiveQuery<IntegrationRecord[]>(async () => {
    return await getAllIntegrations();
  }, []);

  const totalSyncedItemsCount = useLiveQuery<number>(async () => {
    return await db.externalSyncItems.count();
  }, []);

  const syncLogs = useLiveQuery<SyncLog[]>(async () => {
    return await getSyncLogs(undefined, 30);
  }, []);

  const externalItems = useLiveQuery<ExternalSyncItem[]>(async () => {
    if (selectedIntegration) {
      return await getExternalSyncItems({ integrationId: selectedIntegration.id, limit: 100 });
    }
    return await getExternalSyncItems({ limit: 100 });
  }, [selectedIntegration]);

  const connectedCount = integrations?.filter((i) => i.status === 'connected').length || 0;
  const errorCount = integrations?.filter((i) => i.status === 'error').length || 0;

  const handleOpenConfig = (item: IntegrationRecord) => {
    setSelectedIntegration(item);
    setApiKeyInput(item.config?.apiKeyOrToken || '');
    setAccountEmailInput(item.config?.accountEmail || '');
    setUseSandboxInput(item.config?.options?.useSandbox || false);
    setTestResult(null);
    setIsConfigModalOpen(true);
  };

  const handleTestConnection = async () => {
    if (!selectedIntegration) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const config: IntegrationConfig = {
        apiKeyOrToken: apiKeyInput.trim() || undefined,
        accountEmail: accountEmailInput.trim() || undefined,
        options: { useSandbox: useSandboxInput },
      };

      const res = await testIntegrationConnection(selectedIntegration.provider, config);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndConnect = async () => {
    if (!selectedIntegration) return;
    setIsSaving(true);

    try {
      const config: IntegrationConfig = {
        apiKeyOrToken: apiKeyInput.trim() || undefined,
        accountEmail: accountEmailInput.trim() || undefined,
        options: { useSandbox: useSandboxInput },
      };

      const updated = await saveIntegration({
        id: selectedIntegration.id,
        provider: selectedIntegration.provider,
        config,
        accountLabel: testResult?.accountLabel || accountEmailInput || selectedIntegration.accountLabel,
        status: testResult?.success ? 'connected' : selectedIntegration.status,
      });

      // If connected successfully, run immediate initial sync
      if (testResult?.success || apiKeyInput || useSandboxInput) {
        await syncIntegration(selectedIntegration.id, { force: true });
      }

      showToast('success', 'Integration Connected', `Settings saved for ${selectedIntegration.name}.`);
      setIsConfigModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Integration Error', err?.message || 'Failed to save integration configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSync = async (id: string) => {
    setActiveSyncId(id);
    try {
      const res = await syncIntegration(id, { force: true });
      if (!res.success) {
        showToast('error', 'Sync Warning', res.error || 'Sync failed.');
      } else {
        showToast('success', 'Sync Completed', 'Records synchronized successfully.');
      }
    } finally {
      setActiveSyncId(null);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      await syncAllIntegrations();
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (confirm('Disconnect integration? All synchronized records will remain in IndexedDB unless purged.')) {
      await disconnectIntegration(id, false);
    }
  };

  const getProviderIcon = (provider: IntegrationProvider) => {
    switch (provider) {
      case 'github':
        return <GitPullRequest size={20} color="#a855f7" />;
      case 'google-calendar':
        return <Calendar size={20} color="#3b82f6" />;
      case 'gmail':
        return <Mail size={20} color="#ef4444" />;
      case 'stripe':
      case 'razorpay':
        return <CreditCard size={20} color="#10b981" />;
      default:
        return <Plug size={20} color="var(--brand-accent)" />;
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plug size={22} color="var(--brand-accent)" />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>External Service Integrations</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
            Connect GitHub, Google Calendar, Gmail, and Payments. Data is safely stored in local IndexedDB and accessible to Founder AI & Morning Briefing.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsLogsDrawerOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Clock size={15} />
            Sync Logs ({syncLogs?.length || 0})
          </button>

          <button
            onClick={() => {
              setSelectedIntegration(null);
              setIsItemsDrawerOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Database size={15} />
            View Synced Items ({totalSyncedItemsCount || 0})
          </button>

          <button
            onClick={() => setIsWebhookModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#38bdf8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Zap size={15} />
            Webhook Simulator (V2)
          </button>

          <button
            onClick={handleSyncAll}
            disabled={isSyncingAll || connectedCount === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--brand-accent)',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: connectedCount === 0 || isSyncingAll ? 'not-allowed' : 'pointer',
              opacity: connectedCount === 0 || isSyncingAll ? 0.6 : 1,
            }}
          >
            <RefreshCw size={15} className={isSyncingAll ? 'animate-spin' : ''} />
            {isSyncingAll ? 'Syncing All...' : 'Sync All Active'}
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Connected Services</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>
            {connectedCount} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}>/ {integrations?.length || 5}</span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Synced Local Records</span>
            <Layers size={18} color="var(--brand-accent)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>
            {totalSyncedItemsCount || 0}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Sync Status</span>
            {errorCount > 0 ? <AlertCircle size={18} color="#ef4444" /> : <ShieldCheck size={18} color="#10b981" />}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: errorCount > 0 ? '#ef4444' : '#10b981' }}>
            {errorCount > 0 ? `${errorCount} Service Attention` : 'All Services Healthy'}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Security Sandbox</span>
            <ShieldCheck size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
            Client-Side Only (No Backend)
          </div>
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {integrations?.map((item) => {
          const isConnected = item.status === 'connected';
          const isSyncing = activeSyncId === item.id || item.status === 'syncing';
          const isError = item.status === 'error';

          return (
            <div
              key={item.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : isError ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)'}`,
                borderRadius: '14px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
            >
              <div>
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getProviderIcon(item.provider)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0' }}>{item.name}</h3>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {item.category} • {item.authType.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isConnected && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontSize: '12px', fontWeight: 600 }}>
                        <CheckCircle2 size={12} /> Connected
                      </span>
                    )}
                    {isSyncing && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--brand-accent)', fontSize: '12px', fontWeight: 600 }}>
                        <RefreshCw size={12} className="animate-spin" /> Syncing
                      </span>
                    )}
                    {isError && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', fontSize: '12px', fontWeight: 600 }}>
                        <AlertCircle size={12} /> Error
                      </span>
                    )}
                    {!isConnected && !isSyncing && !isError && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500, border: '1px solid var(--border-subtle)' }}>
                        Disconnected
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  {item.description}
                </p>

                {/* Account / Sync Stats */}
                {isConnected && (
                  <div
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      marginBottom: '16px',
                      fontSize: '12px',
                      border: '1px solid var(--border-faint)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Account:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{item.accountLabel || 'Configured'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Synced Items:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{item.syncStats?.totalItems || 0} records</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Last Sync:</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {item.lastSyncedAt ? new Date(item.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Backend Notice */}
                {item.requiresBackend && (
                  <div
                    style={{
                      backgroundColor: 'rgba(234, 179, 8, 0.08)',
                      border: '1px solid rgba(234, 179, 8, 0.25)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      marginBottom: '16px',
                      fontSize: '12px',
                      color: '#eab308',
                      lineHeight: 1.4,
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{item.backendNotice}</span>
                  </div>
                )}

                {/* Capabilities list */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                  {item.capabilities.map((cap, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-faint)',
                      }}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-faint)', paddingTop: '14px' }}>
                <button
                  onClick={() => handleOpenConfig(item)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: isConnected ? 'var(--bg-surface)' : 'var(--brand-accent)',
                    border: isConnected ? '1px solid var(--border-subtle)' : 'none',
                    color: isConnected ? 'var(--text-main)' : '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Key size={14} />
                  {isConnected ? 'Configure' : 'Connect'}
                </button>

                {isConnected && (
                  <>
                    <button
                      onClick={() => handleManualSync(item.id)}
                      disabled={isSyncing}
                      title="Sync Now"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                        cursor: isSyncing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedIntegration(item);
                        setIsItemsDrawerOpen(true);
                      }}
                      title="View Synced Records"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Eye size={14} />
                    </button>

                    <button
                      onClick={() => handleDisconnect(item.id)}
                      title="Disconnect"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration & Connect Modal */}
      {isConfigModalOpen && selectedIntegration && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsConfigModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {getProviderIcon(selectedIntegration.provider)}
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Configure {selectedIntegration.name}</h2>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Credential Inputs */}
            {selectedIntegration.requiresBackend ? (
              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(234, 179, 8, 0.08)',
                    border: '1px solid rgba(234, 179, 8, 0.25)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    color: '#eab308',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>🔒 Protected Client-Side Sandbox</div>
                  {selectedIntegration.backendNotice}
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', marginBottom: '14px' }}>
                  <input
                    type="checkbox"
                    checked={useSandboxInput}
                    onChange={(e) => setUseSandboxInput(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Enable Browser-Safe Financial Feed / Sandbox Sync</span>
                </label>
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  {selectedIntegration.provider === 'github' ? 'Personal Access Token (PAT)' : 'OAuth 2.0 Access Token / Key'}
                </label>
                <input
                  type="password"
                  placeholder={selectedIntegration.provider === 'github' ? 'ghp_xxxxxxxxxxxxxxxxxxxx' : 'ya29.xxxxxxxxxxxxxxxxxxxx'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    marginBottom: '14px',
                    boxSizing: 'border-box',
                  }}
                />

                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                  Account Identifier / Email (Optional)
                </label>
                <input
                  type="text"
                  placeholder="founder@company.com"
                  value={accountEmailInput}
                  onChange={(e) => setAccountEmailInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    marginBottom: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* Required Scopes */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                REQUIRED SCOPES / PERMISSIONS:
              </span>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {selectedIntegration.requiredScopes.map((scope, idx) => (
                  <li key={idx}><code>{scope}</code></li>
                ))}
              </ul>
            </div>

            {/* Test Connection Output */}
            {testResult && (
              <div
                style={{
                  backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '20px',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: testResult.success ? '#10b981' : '#ef4444', marginBottom: '4px' }}>
                  {testResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
                  <span>{testResult.success ? 'Connection Verified' : 'Connection Failed'}</span>
                  {testResult.latencyMs && <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>{testResult.latencyMs}ms</span>}
                </div>
                <div style={{ color: 'var(--text-main)', fontSize: '12px' }}>{testResult.message}</div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isTesting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Activity size={14} />
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                onClick={handleSaveAndConnect}
                disabled={isSaving}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--brand-accent)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                }}
              >
                {isSaving ? 'Saving...' : 'Save & Sync'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Synced Items Drawer */}
      {isItemsDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1100,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setIsItemsDrawerOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderLeft: '1px solid var(--border-subtle)',
              width: '100%',
              maxWidth: '680px',
              height: '100vh',
              overflowY: 'auto',
              padding: '28px',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0' }}>
                  {selectedIntegration ? `${selectedIntegration.name} Records` : 'All Synced External Records'}
                </h2>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {externalItems?.length || 0} synchronized records in local IndexedDB
                </span>
              </div>
              <button
                onClick={() => setIsItemsDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {externalItems?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  No synchronized items found. Connect an integration and run a sync.
                </div>
              ) : (
                externalItems?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            color: 'var(--brand-accent)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.provider} • {item.itemType}
                        </span>
                        <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{item.title}</strong>
                      </div>

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--brand-accent)', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px' }}
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>

                    {item.summary && (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                        {item.summary}
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Author: {item.author || 'system'}</span>
                      <span>{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sync Logs Drawer */}
      {isLogsDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1100,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setIsLogsDrawerOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderLeft: '1px solid var(--border-subtle)',
              width: '100%',
              maxWidth: '680px',
              height: '100vh',
              overflowY: 'auto',
              padding: '28px',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0' }}>Synchronization Audit Log</h2>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Audit history of all API sync operations</span>
              </div>
              <button
                onClick={() => setIsLogsDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {syncLogs?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  No synchronization logs recorded yet.
                </div>
              ) : (
                syncLogs?.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: `1px solid ${log.status === 'success' ? 'var(--border-faint)' : 'rgba(239, 68, 68, 0.3)'}`,
                      borderRadius: '8px',
                      padding: '12px 16px',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: log.status === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: log.status === 'success' ? '#10b981' : '#ef4444',
                            textTransform: 'uppercase',
                          }}
                        >
                          {log.status}
                        </span>
                        <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{log.provider}</strong>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(log.createdAt).toLocaleTimeString()} ({log.durationMs}ms)
                      </span>
                    </div>

                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {log.status === 'success' ? (
                        <span>
                          Synced {log.itemsSynced} records (+{log.itemsCreated} created, ~{log.itemsUpdated} updated)
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444' }}>Error: {log.error}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Webhook Simulator Modal (V2) */}
      {isWebhookModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
          }}
          onClick={() => setIsWebhookModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '540px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color="#38bdf8" />
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  External Webhook Simulator
                </h2>
              </div>
              <button
                onClick={() => setIsWebhookModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Simulate inbound webhook payloads from Stripe, GitHub, or CRM to verify automated workflow reactions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                  PROVIDER
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['stripe', 'github', 'hubspot', 'slack'] as const).map((prov) => (
                    <button
                      key={prov}
                      onClick={() => {
                        setWebhookProvider(prov);
                        if (prov === 'stripe') {
                          setWebhookEventType('charge.failed');
                          setWebhookPayload('{\n  "amount": 4800,\n  "currency": "usd",\n  "customer": "cust_1",\n  "failure_reason": "card_declined"\n}');
                        } else if (prov === 'github') {
                          setWebhookEventType('pull_request.merged');
                          setWebhookPayload('{\n  "pr_number": 42,\n  "title": "feat: RICE prioritization engine",\n  "author": "lead-eng",\n  "merged": true\n}');
                        } else {
                          setWebhookEventType('deal.won');
                          setWebhookPayload('{\n  "deal_name": "Enterprise BioHealth",\n  "amount": 18500,\n  "owner": "Damian Sterling"\n}');
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: webhookProvider === prov ? 'var(--brand-accent)' : 'var(--border-subtle)',
                        backgroundColor: webhookProvider === prov ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)',
                        color: webhookProvider === prov ? '#38bdf8' : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                  EVENT TYPE
                </label>
                <input
                  type="text"
                  value={webhookEventType}
                  onChange={(e) => setWebhookEventType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                  JSON PAYLOAD
                </label>
                <textarea
                  rows={5}
                  value={webhookPayload}
                  onChange={(e) => setWebhookPayload(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '12.5px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {webhookFeedback && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#10b981',
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                >
                  {webhookFeedback}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => setIsWebhookModalOpen(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    let parsed: any = {};
                    try {
                      parsed = JSON.parse(webhookPayload);
                    } catch (e) {
                      parsed = { raw: webhookPayload };
                    }

                    await db.webhookEvents.add({
                      id: `wh-${Date.now()}`,
                      provider: webhookProvider,
                      eventType: webhookEventType,
                      payload: parsed,
                      receivedAt: new Date().toISOString(),
                      processed: true,
                      statusMessage: `Ingested ${webhookProvider} ${webhookEventType} successfully.`,
                    });

                    // Trigger task or notification
                    await db.tasks.add({
                      id: `task-wh-${Date.now()}`,
                      title: `[Webhook Event] ${webhookProvider.toUpperCase()}: ${webhookEventType}`,
                      description: `Processed incoming external payload: ${JSON.stringify(parsed)}`,
                      priority: 'high',
                      status: 'todo',
                      tags: ['webhook', 'integration', webhookProvider],
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    });

                    setWebhookFeedback(`Dispatched! Webhook event logged and automated workflow triggered.`);
                  }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--brand-accent)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Play size={14} />
                  Dispatch Test Webhook
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
