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
import { SpotlightCard } from '../components/common/SpotlightCard';
import { MetricCard } from '../components/common/MetricCard';
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
        return <Calendar size={20} color="#38bdf8" />;
      case 'gmail':
        return <Mail size={20} color="#ef4444" />;
      case 'stripe':
      case 'razorpay':
        return <CreditCard size={20} color="#10b981" />;
      default:
        return <Plug size={20} color="#38bdf8" />;
    }
  };

  const getProviderColor = (provider: IntegrationProvider) => {
    switch (provider) {
      case 'github':
        return '#a855f7';
      case 'google-calendar':
        return '#38bdf8';
      case 'gmail':
        return '#ef4444';
      case 'stripe':
      case 'razorpay':
        return '#10b981';
      default:
        return '#38bdf8';
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
            SYSTEM ARCHITECTURE • CONNECTIVITY & INGESTION PIPELINE
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
            External Service Integrations
          </h1>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', maxWidth: '680px' }}>
            Connect GitHub, Google Calendar, Gmail, and Payments. Data is safely stored in local IndexedDB and accessible to Founder AI & Morning Briefing.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsLogsDrawerOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <Clock size={15} color="#94a3b8" />
            <span>Sync Logs ({syncLogs?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedIntegration(null);
              setIsItemsDrawerOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <Database size={15} color="#94a3b8" />
            <span>View Synced Items ({totalSyncedItemsCount || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsWebhookModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
              backgroundColor: 'rgba(0, 80, 255, 0.1)',
              border: '1px solid rgba(0, 80, 255, 0.25)',
              color: '#38bdf8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 80, 255, 0.18)';
              e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 80, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.25)';
            }}
          >
            <Zap size={15} color="#38bdf8" />
            <span>Webhook Simulator (V2)</span>
          </button>

          {/* Primary CTA with Action Indicator Dot */}
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={isSyncingAll || connectedCount === 0}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 22px',
              borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
              backgroundColor: '#0050FF',
              border: 'none',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: connectedCount === 0 || isSyncingAll ? 'not-allowed' : 'pointer',
              opacity: connectedCount === 0 || isSyncingAll ? 0.6 : 1,
              boxShadow: '0 4px 14px rgba(0, 80, 255, 0.35)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isSyncingAll && connectedCount > 0) e.currentTarget.style.backgroundColor = '#1a66ff';
            }}
            onMouseLeave={(e) => {
              if (!isSyncingAll && connectedCount > 0) e.currentTarget.style.backgroundColor = '#0050FF';
            }}
          >
            <RefreshCw size={15} className={isSyncingAll ? 'animate-spin' : ''} />
            <span>{isSyncingAll ? 'Syncing All...' : 'Sync All Active'}</span>
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
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <MetricCard
          title="Connected Services"
          value={`${connectedCount} / ${integrations?.length || 5}`}
          subtitle="Live external links"
          icon={<CheckCircle2 size={18} color="#10b981" />}
        />

        <MetricCard
          title="Synced Local Records"
          value={`${totalSyncedItemsCount || 0} Records`}
          subtitle="IndexedDB cache"
          icon={<Layers size={18} color="#38bdf8" />}
        />

        <MetricCard
          title="Sync Health"
          value={errorCount > 0 ? `${errorCount} Attention` : 'All Healthy'}
          subtitle={errorCount > 0 ? 'Sync failure detected' : 'No operational errors'}
          icon={errorCount > 0 ? <AlertCircle size={18} color="#ef4444" /> : <ShieldCheck size={18} color="#10b981" />}
        />

        <MetricCard
          title="Security Sandbox"
          value="Client-Side"
          subtitle="Zero backend leakage"
          icon={<ShieldCheck size={18} color="#6366f1" />}
        />
      </div>

      {/* Integration Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {integrations?.map((item) => {
          const isConnected = item.status === 'connected';
          const isSyncing = activeSyncId === item.id || item.status === 'syncing';
          const isError = item.status === 'error';
          const provColor = getProviderColor(item.provider);

          return (
            <SpotlightCard
              key={item.id}
              style={{
                borderRadius: '24px', // DESIGN.md --radius-cards: 24px
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: isConnected
                  ? 'rgba(16, 185, 129, 0.35)'
                  : isError
                  ? 'rgba(239, 68, 68, 0.35)'
                  : 'rgba(255, 255, 255, 0.08)',
                background: 'linear-gradient(180deg, #0d1527 0%, #080d1a 100%)',
              }}
            >
              <div>
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: `rgba(${
                          item.provider === 'stripe' || item.provider === 'razorpay'
                            ? '16, 185, 129'
                            : item.provider === 'github'
                            ? '168, 85, 247'
                            : item.provider === 'gmail'
                            ? '239, 68, 68'
                            : '56, 189, 248'
                        }, 0.12)`,
                        border: `1px solid rgba(${
                          item.provider === 'stripe' || item.provider === 'razorpay'
                            ? '16, 185, 129'
                            : item.provider === 'github'
                            ? '168, 85, 247'
                            : item.provider === 'gmail'
                            ? '239, 68, 68'
                            : '56, 189, 248'
                        }, 0.25)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {getProviderIcon(item.provider)}
                    </div>
                    <div>
                      <h3
                        style={{
                          fontSize: '16.5px',
                          fontWeight: 700,
                          color: '#f8fafc',
                          letterSpacing: '-0.02em',
                          margin: '0 0 3px 0',
                        }}
                      >
                        {item.name}
                      </h3>
                      <span style={{ fontSize: '11.5px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {item.category} • {item.authType.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Status Chip (10px pill with glowing dot) */}
                  <div>
                    {isConnected && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '10px', // DESIGN.md --radius-small: 10px
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.28)',
                          color: '#10b981',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#10b981',
                            boxShadow: '0 0 8px #10b981',
                          }}
                        />
                        Connected
                      </span>
                    )}
                    {isSyncing && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '10px', // DESIGN.md --radius-small: 10px
                          backgroundColor: 'rgba(56, 189, 248, 0.12)',
                          border: '1px solid rgba(56, 189, 248, 0.28)',
                          color: '#38bdf8',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                        }}
                      >
                        <RefreshCw size={11} className="animate-spin" />
                        Syncing
                      </span>
                    )}
                    {isError && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '10px', // DESIGN.md --radius-small: 10px
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.28)',
                          color: '#ef4444',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            boxShadow: '0 0 8px #ef4444',
                          }}
                        />
                        Error
                      </span>
                    )}
                    {!isConnected && !isSyncing && !isError && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '10px', // DESIGN.md --radius-small: 10px
                          backgroundColor: 'rgba(148, 163, 184, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#94a3b8',
                          fontSize: '11.5px',
                          fontWeight: 600,
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#64748b',
                          }}
                        />
                        Disconnected
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  {item.description}
                </p>

                {/* Account / Sync Stats Inset Container */}
                {isConnected && (
                  <div
                    style={{
                      backgroundColor: 'rgba(3, 7, 18, 0.55)',
                      borderRadius: '16px', // Standard inner metric container
                      padding: '12px 14px',
                      marginBottom: '16px',
                      fontSize: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Account:</span>
                      <strong style={{ color: '#f8fafc' }}>{item.accountLabel || 'Configured'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Synced Items:</span>
                      <strong style={{ color: '#38bdf8' }}>{item.syncStats?.totalItems || 0} records</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Last Sync:</span>
                      <span style={{ color: '#94a3b8' }}>
                        {item.lastSyncedAt ? new Date(item.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Backend Sandbox Notice */}
                {item.requiresBackend && (
                  <div
                    style={{
                      backgroundColor: 'rgba(234, 179, 8, 0.08)',
                      border: '1px solid rgba(234, 179, 8, 0.25)',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      marginBottom: '16px',
                      fontSize: '12px',
                      color: '#fbbf24',
                      lineHeight: 1.45,
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#f59e0b' }} />
                    <span>{item.backendNotice}</span>
                  </div>
                )}

                {/* Capabilities Chips (10px radius, eliminates sharp 4px) */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
                  {item.capabilities.map((cap, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '11px',
                        padding: '3px 9px',
                        borderRadius: '10px', // DESIGN.md --radius-small: 10px
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        color: '#94a3b8',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        fontWeight: 500,
                      }}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '16px',
                }}
              >
                {/* Connect / Configure Button */}
                <button
                  type="button"
                  onClick={() => handleOpenConfig(item)}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                    backgroundColor: isConnected ? 'rgba(255, 255, 255, 0.06)' : '#0050FF',
                    border: isConnected ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: isConnected ? 'none' : '0 4px 12px rgba(0, 80, 255, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isConnected ? 'rgba(255, 255, 255, 0.12)' : '#1a66ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isConnected ? 'rgba(255, 255, 255, 0.06)' : '#0050FF';
                  }}
                >
                  <Key size={14} />
                  <span>{isConnected ? 'Configure' : 'Connect'}</span>
                  {!isConnected && (
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        opacity: 0.9,
                      }}
                    />
                  )}
                </button>

                {/* Connected Secondary Actions (32px circular icon buttons) */}
                {isConnected && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleManualSync(item.id)}
                      disabled={isSyncing}
                      title="Sync Now"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%', // 50% circular icon button
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#f8fafc',
                        cursor: isSyncing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSyncing) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSyncing) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                    >
                      <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIntegration(item);
                        setIsItemsDrawerOpen(true);
                      }}
                      title="View Synced Records"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%', // 50% circular icon button
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
                    >
                      <Eye size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDisconnect(item.id)}
                      title="Disconnect"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%', // 50% circular icon button
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </SpotlightCard>
          );
        })}
      </div>

      {/* Configuration & Connect Modal */}
      {isConfigModalOpen && selectedIntegration && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(12px)',
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
              backgroundColor: '#0b0f19',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px', // DESIGN.md --radius-cards: 24px
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(0, 80, 255, 0.12)',
                    border: '1px solid rgba(0, 80, 255, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getProviderIcon(selectedIntegration.provider)}
                </div>
                <h2 style={{ fontSize: '19px', fontWeight: 800, margin: 0, color: '#f8fafc', letterSpacing: '-0.03em' }}>
                  Configure {selectedIntegration.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Credential Inputs */}
            {selectedIntegration.requiresBackend ? (
              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(234, 179, 8, 0.08)',
                    border: '1px solid rgba(234, 179, 8, 0.25)',
                    borderRadius: '14px',
                    padding: '14px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    color: '#fbbf24',
                    lineHeight: 1.45,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="#fbbf24" />
                    <span>Protected Client-Side Sandbox</span>
                  </div>
                  {selectedIntegration.backendNotice}
                </div>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginBottom: '14px',
                    color: '#f8fafc',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={useSandboxInput}
                    onChange={(e) => setUseSandboxInput(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#0050FF' }}
                  />
                  <span>Enable Browser-Safe Financial Feed / Sandbox Sync</span>
                </label>
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
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
                    borderRadius: '12px', // DESIGN.md input styling
                    backgroundColor: 'rgba(3, 7, 18, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '13px',
                    marginBottom: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />

                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
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
                    borderRadius: '12px',
                    backgroundColor: 'rgba(3, 7, 18, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '13px',
                    marginBottom: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {/* Required Scopes */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px', letterSpacing: '0.04em' }}>
                REQUIRED SCOPES / PERMISSIONS:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedIntegration.requiredScopes.map((scope, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      padding: '3px 8px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#94a3b8',
                    }}
                  >
                    {scope}
                  </span>
                ))}
              </div>
            </div>

            {/* Test Connection Output */}
            {testResult && (
              <div
                style={{
                  backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  borderRadius: '14px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: testResult.success ? '#10b981' : '#ef4444', marginBottom: '4px' }}>
                  {testResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
                  <span>{testResult.success ? 'Connection Verified' : 'Connection Failed'}</span>
                  {testResult.latencyMs && <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }}>{testResult.latencyMs}ms</span>}
                </div>
                <div style={{ color: '#f8fafc', fontSize: '12px' }}>{testResult.message}</div>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                style={{
                  padding: '10px 18px',
                  borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isTesting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Activity size={14} color="#38bdf8" />
                <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndConnect}
                disabled={isSaving}
                style={{
                  padding: '10px 22px',
                  borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                  backgroundColor: '#0050FF',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 80, 255, 0.35)',
                }}
              >
                <span>{isSaving ? 'Saving...' : 'Save & Sync'}</span>
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
          </div>
        </div>
      )}

      {/* Synced Items Drawer */}
      {isItemsDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 1100,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setIsItemsDrawerOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#0b0f19',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              width: '100%',
              maxWidth: '680px',
              height: '100vh',
              overflowY: 'auto',
              padding: '28px',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0', color: '#f8fafc', letterSpacing: '-0.03em' }}>
                  {selectedIntegration ? `${selectedIntegration.name} Records` : 'All Synced External Records'}
                </h2>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  {externalItems?.length || 0} synchronized records in local IndexedDB
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsItemsDrawerOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {externalItems?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                  No synchronized items found. Connect an integration and run a sync.
                </div>
              ) : (
                externalItems?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(0, 80, 255, 0.12)',
                            color: '#38bdf8',
                            border: '1px solid rgba(0, 80, 255, 0.25)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.provider} • {item.itemType}
                        </span>
                        <strong style={{ fontSize: '14px', color: '#f8fafc' }}>{item.title}</strong>
                      </div>

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                        >
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>

                    {item.summary && (
                      <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 10px 0', lineHeight: 1.45 }}>
                        {item.summary}
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
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
            backgroundColor: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 1100,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setIsLogsDrawerOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#0b0f19',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              width: '100%',
              maxWidth: '680px',
              height: '100vh',
              overflowY: 'auto',
              padding: '28px',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0', color: '#f8fafc', letterSpacing: '-0.03em' }}>
                  Synchronization Audit Log
                </h2>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Audit history of all API sync operations</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLogsDrawerOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {syncLogs?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                  No synchronization logs recorded yet.
                </div>
              ) : (
                syncLogs?.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${log.status === 'success' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(239, 68, 68, 0.3)'}`,
                      borderRadius: '14px',
                      padding: '14px 16px',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '10px',
                            backgroundColor: log.status === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: log.status === 'success' ? '#10b981' : '#ef4444',
                            border: `1px solid ${log.status === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            textTransform: 'uppercase',
                          }}
                        >
                          {log.status}
                        </span>
                        <strong style={{ color: '#f8fafc', textTransform: 'capitalize' }}>{log.provider}</strong>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {new Date(log.createdAt).toLocaleTimeString()} ({log.durationMs}ms)
                      </span>
                    </div>

                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>
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
            backgroundColor: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            padding: '20px',
          }}
          onClick={() => setIsWebhookModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#0b0f19',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px', // DESIGN.md --radius-cards: 24px
              width: '100%',
              maxWidth: '540px',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(0, 80, 255, 0.12)',
                    border: '1px solid rgba(0, 80, 255, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Zap size={18} color="#38bdf8" />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f8fafc', letterSpacing: '-0.03em' }}>
                  External Webhook Simulator
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsWebhookModalOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '18px', lineHeight: 1.45 }}>
              Simulate inbound webhook payloads from Stripe, GitHub, or CRM to verify automated workflow reactions.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px', letterSpacing: '0.04em' }}>
                  PROVIDER
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(['stripe', 'github', 'hubspot', 'slack'] as const).map((prov) => (
                    <button
                      key={prov}
                      type="button"
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
                        padding: '6px 14px',
                        borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                        border: '1px solid',
                        borderColor: webhookProvider === prov ? 'rgba(0, 80, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                        backgroundColor: webhookProvider === prov ? 'rgba(0, 80, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        color: webhookProvider === prov ? '#38bdf8' : '#94a3b8',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px', letterSpacing: '0.04em' }}>
                  EVENT TYPE
                </label>
                <input
                  type="text"
                  value={webhookEventType}
                  onChange={(e) => setWebhookEventType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(3, 7, 18, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px', letterSpacing: '0.04em' }}>
                  JSON PAYLOAD
                </label>
                <textarea
                  rows={5}
                  value={webhookPayload}
                  onChange={(e) => setWebhookPayload(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(3, 7, 18, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {webhookFeedback && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.28)',
                    color: '#10b981',
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                >
                  {webhookFeedback}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsWebhookModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '50px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
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
                    padding: '8px 20px',
                    borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                    backgroundColor: '#0050FF',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0, 80, 255, 0.35)',
                  }}
                >
                  <Play size={14} />
                  <span>Dispatch Test Webhook</span>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
