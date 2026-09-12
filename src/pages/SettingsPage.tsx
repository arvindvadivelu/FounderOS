import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Settings as SettingsIcon,
  Cpu,
  Database,
  Building,
  Shield,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Upload,
  AlertTriangle,
  Sparkles,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { db } from '../db';
import { SpotlightCard } from '../components/common/SpotlightCard';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';
import {
  getAllAIProviders,
  saveAIProvider,
  deleteAIProvider,
  setDefaultAIProvider,
} from '../db/services/aiStorageService';
import { saveCompany, updateSettings } from '../db/services/companyService';
import { testProviderConnection, type TestConnectionResult } from '../ai/providerClient';
import { exportAllData, downloadJsonFile, importDataFromPayload } from '../utils/exportImport';
import { clearAllCompanyData } from '../db/seed';
import { formatDate } from '../utils/formatters';
import type { AIProvider, AIProviderType, Currency } from '../types';

interface SettingsPageProps {
  initialTab?: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ initialTab }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'providers' | 'data' | 'company' | 'about'>(
    initialTab === 'data' ? 'data' : initialTab === 'company' ? 'company' : 'providers'
  );

  // Live Queries
  const company = useLiveQuery(async () => (await db.companies.toArray())[0], []);
  const settings = useLiveQuery(async () => await db.settings.get('singleton'), []);
  const providers = useLiveQuery(async () => await db.aiProviders.toArray(), []) || [];

  // Provider Modal State
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [providerMode, setProviderMode] = useState<'openrouter' | 'custom'>('openrouter');
  const [pName, setPName] = useState('OpenRouter');
  const [pType, setPType] = useState<AIProviderType>('openrouter');
  const [pBaseUrl, setPBaseUrl] = useState('https://openrouter.ai/api/v1');
  const [pApiKey, setPApiKey] = useState('');
  const [pModel, setPModel] = useState('anthropic/claude-3.7-sonnet');
  const [pOrgId, setPOrgId] = useState('');
  const [pTemperature, setPTemperature] = useState<number>(0.2);
  const [pMaxTokens, setPMaxTokens] = useState<number>(4096);
  const [pCustomHeaders, setPCustomHeaders] = useState('');
  const [pIsDefault, setPIsDefault] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);

  // Connection Test State
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestConnectionResult>>({});

  // Company Form State
  const [compName, setCompName] = useState('');
  const [compLegalName, setCompLegalName] = useState('');
  const [compWebsite, setCompWebsite] = useState('');
  const [compIndustry, setCompIndustry] = useState('');
  const [compCurrency, setCompCurrency] = useState<Currency>('USD');

  // Danger / Import State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    if (company) {
      setCompName(company.name || '');
      setCompLegalName(company.legalName || '');
      setCompWebsite(company.website || '');
      setCompIndustry(company.industry || '');
      setCompCurrency(company.currency || 'USD');
    }
  }, [company]);

  const openAddProviderModal = () => {
    setEditingProvider(null);
    setProviderMode('openrouter');
    setPName('OpenRouter');
    setPType('openrouter');
    setPBaseUrl('https://openrouter.ai/api/v1');
    setPApiKey('');
    setPModel('anthropic/claude-3.7-sonnet');
    setPOrgId('');
    setPTemperature(0.2);
    setPMaxTokens(4096);
    setPCustomHeaders('');
    setPIsDefault(providers.length === 0);
    setShowApiKey(false);
    setIsProviderModalOpen(true);
  };

  const openEditProviderModal = (prov: AIProvider) => {
    setEditingProvider(prov);
    const isOr = prov.type === 'openrouter' || prov.baseUrl.includes('openrouter.ai');
    setProviderMode(isOr ? 'openrouter' : 'custom');
    setPName(prov.name);
    setPType(prov.type);
    setPBaseUrl(prov.baseUrl);
    setPApiKey(prov.apiKey || '');
    setPModel(prov.model);
    setPOrgId(prov.organizationId || '');
    setPTemperature(prov.temperature ?? 0.2);
    setPMaxTokens(prov.maxTokens ?? 4096);
    setPCustomHeaders(prov.customHeaders ? JSON.stringify(prov.customHeaders, null, 2) : '');
    setPIsDefault(prov.isDefault);
    setShowApiKey(false);
    setIsProviderModalOpen(true);
  };

  const handleModeSwitch = (mode: 'openrouter' | 'custom') => {
    setProviderMode(mode);
    if (mode === 'openrouter') {
      setPName('OpenRouter');
      setPType('openrouter');
      setPBaseUrl('https://openrouter.ai/api/v1');
      if (!pModel || pModel === 'gpt-4o') {
        setPModel('anthropic/claude-3.7-sonnet');
      }
    } else {
      if (pName === 'OpenRouter') setPName('Custom AI Provider');
      setPType('custom');
      if (pBaseUrl === 'https://openrouter.ai/api/v1') setPBaseUrl('https://api.openai.com/v1');
    }
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let customHeadersObj: Record<string, string> | undefined;
      if (pCustomHeaders.trim()) {
        try {
          customHeadersObj = JSON.parse(pCustomHeaders);
        } catch {
          showToast('error', 'Invalid JSON', 'Custom HTTP Headers must be valid JSON');
          return;
        }
      }

      const id = editingProvider ? editingProvider.id : `prov-${Date.now()}`;
      await saveAIProvider({
        id,
        name: pName.trim(),
        type: pType,
        baseUrl: pBaseUrl.trim(),
        apiKey: pApiKey.trim(),
        model: pModel.trim(),
        organizationId: pOrgId.trim() || undefined,
        temperature: pTemperature,
        maxTokens: pMaxTokens,
        customHeaders: customHeadersObj,
        isDefault: pIsDefault,
        createdAt: editingProvider ? editingProvider.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      if (pIsDefault) {
        await setDefaultAIProvider(id);
      }

      showToast('success', 'Provider Saved', `${pName} configuration stored in local vault.`);
      setIsProviderModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message || 'Failed to save provider.');
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (confirm('Delete this AI provider configuration from your local browser vault?')) {
      await deleteAIProvider(id);
      showToast('info', 'Provider Removed', 'Provider deleted successfully.');
    }
  };

  const handleTestConnection = async (prov: AIProvider) => {
    setTestingProviderId(prov.id);
    try {
      const res = await testProviderConnection(prov);
      setTestResults((prev) => ({ ...prev, [prov.id]: res }));
      if (res.success) {
        showToast('success', 'Connection Verified', `${prov.name} responded successfully.`);
      } else {
        showToast('error', 'Connection Failed', res.message || 'Test prompt failed.');
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [prov.id]: {
          success: false,
          provider: prov.name,
          model: prov.model,
          durationMs: 0,
          message: err.message || 'Unknown network error',
        },
      }));
      showToast('error', 'Connection Error', err.message || 'Network error.');
    } finally {
      setTestingProviderId(null);
    }
  };

  const applyCustomPreset = (preset: { label: string; name: string; url: string; model: string }) => {
    setPName(preset.name);
    setPBaseUrl(preset.url);
    setPModel(preset.model);
    setPType('custom');
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveCompany({
        id: company?.id || 'singleton',
        name: compName.trim(),
        legalName: compLegalName.trim() || undefined,
        website: compWebsite.trim() || undefined,
        industry: compIndustry.trim() || undefined,
        currency: compCurrency,
        foundedDate: company?.foundedDate || new Date().toISOString(),
      });

      await updateSettings({ currency: compCurrency });
      showToast('success', 'Company Profile Updated', 'Settings saved locally.');
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Failed to save company settings.');
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportAllData();
      const filename = `founderos_export_${compName.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
      downloadJsonFile(data, filename);
      showToast('success', 'Data Exported', 'Full database snapshot downloaded.');
    } catch (err: any) {
      showToast('error', 'Export Failed', err.message || 'Could not export local database.');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const res = await importDataFromPayload(payload);
      if (res.success) {
        setImportStatus({ success: true, message: res.message });
        showToast('success', 'Import Successful', res.message);
      } else {
        setImportStatus({ success: false, message: res.message });
        showToast('error', 'Import Failed', res.message);
      }
    } catch (err: any) {
      setImportStatus({ success: false, message: err.message || 'Invalid JSON format' });
      showToast('error', 'Parse Error', 'File is not valid JSON.');
    } finally {
      e.target.value = '';
    }
  };

  const handleResetDatabase = async () => {
    try {
      await clearAllCompanyData();
      setIsResetConfirmOpen(false);
      showToast('info', 'Database Reset', 'All company records erased.');
      window.location.reload();
    } catch (err: any) {
      showToast('error', 'Reset Failed', err.message || 'Failed to erase data.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Editorial Header */}
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
          SYSTEM ARCHITECTURE • PREFERENCES & AI RUNTIME
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
          Settings & Provider Architecture
        </h1>
        <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', maxWidth: '680px' }}>
          Configure user-owned AI credentials, local IndexedDB backup/export, company identity, and runtime telemetry.
        </p>
      </div>

      {/* Modern Pill Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px' }}>
        {[
          { id: 'providers', label: 'AI Providers', icon: <Cpu size={15} /> },
          { id: 'data', label: 'Data & Backup', icon: <Database size={15} /> },
          { id: 'company', label: 'Company Profile', icon: <Building size={15} /> },
          { id: 'about', label: 'Architecture & Security', icon: <Shield size={15} /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '9px 18px',
                borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                backgroundColor: isActive ? '#0050FF' : 'rgba(255, 255, 255, 0.04)',
                color: isActive ? '#ffffff' : '#94a3b8',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: isActive ? '1px solid rgba(0, 80, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isActive ? '0 0 16px rgba(0, 80, 255, 0.35)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: AI Providers */}
      {activeTab === 'providers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Security Notice Banner */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '16px', // DESIGN.md inner rounded container
              backgroundColor: 'rgba(0, 80, 255, 0.08)',
              border: '1px solid rgba(0, 80, 255, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 80, 255, 0.15)',
                border: '1px solid rgba(0, 80, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <Shield size={18} color="#38bdf8" />
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
              <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '2px' }}>
                Local-First Browser Security Notice:
              </strong>
              API keys entered here are stored strictly in your browser's local IndexedDB and are used directly from your browser.
              No backend server or proxy ever intercepts your credentials. For maximum security, do not use sensitive production credentials.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
              Configured AI Providers ({providers.length})
            </h3>
            <button
              type="button"
              onClick={openAddProviderModal}
              style={{
                borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                padding: '10px 22px',
                backgroundColor: '#0050FF',
                border: 'none',
                color: '#ffffff',
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
              <Plus size={16} />
              <span>Add Provider</span>
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

          {/* Providers List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {providers.map((prov) => {
              const test = testResults[prov.id];
              const isTesting = testingProviderId === prov.id;

              return (
                <SpotlightCard
                  key={prov.id}
                  style={{
                    borderRadius: '24px', // DESIGN.md --radius-cards: 24px
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%', // 50% circular emblem
                          backgroundColor: 'rgba(0, 80, 255, 0.12)',
                          color: '#38bdf8',
                          border: '1px solid rgba(0, 80, 255, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 12px rgba(0, 80, 255, 0.2)',
                          flexShrink: 0,
                        }}
                      >
                        <Cpu size={20} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h4 style={{ fontSize: '16.5px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
                            {prov.name}
                          </h4>
                          {prov.isDefault && (
                            <span
                              style={{
                                fontSize: '11px',
                                padding: '3px 9px',
                                borderRadius: '10px', // DESIGN.md --radius-small: 10px
                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                color: '#10b981',
                                border: '1px solid rgba(16, 185, 129, 0.28)',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
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
                              Default Provider
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '3px' }}>
                          Type: <strong style={{ color: '#f8fafc' }}>{prov.type}</strong> • Endpoint: {prov.baseUrl}
                        </div>
                      </div>
                    </div>

                    {/* Provider Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {!prov.isDefault && (
                        <button
                          type="button"
                          onClick={() => setDefaultAIProvider(prov.id)}
                          style={{
                            padding: '8px 16px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                            backgroundColor: 'rgba(0, 80, 255, 0.1)',
                            border: '1px solid rgba(0, 80, 255, 0.25)',
                            color: '#38bdf8',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 80, 255, 0.2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 80, 255, 0.1)')}
                          title="Set as Default Provider for Copilot"
                        >
                          Make Default
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleTestConnection(prov)}
                        disabled={isTesting}
                        style={{
                          padding: '8px 16px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#f8fafc',
                          cursor: isTesting ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isTesting) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isTesting) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        }}
                      >
                        {isTesting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} color="#38bdf8" />}
                        <span>{isTesting ? 'Pinging...' : 'Test Connection'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditProviderModal(prov)}
                        title="Edit Provider"
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
                        <Edit2 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProvider(prov.id)}
                        title="Delete Provider"
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
                    </div>
                  </div>

                  {/* Config Details Inset (replaces sharp var(--radius-sm)) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: '16px', // DESIGN.md inner rounded container
                      backgroundColor: 'rgba(3, 7, 18, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      fontSize: '12.5px',
                    }}
                  >
                    <div>
                      <span style={{ color: '#64748b' }}>Model:</span>{' '}
                      <strong style={{ color: '#f8fafc' }}>{prov.model}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>API Key:</span>{' '}
                      <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>
                        {prov.apiKey ? `••••••••${prov.apiKey.slice(-4)}` : '(None set)'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Temperature:</span>{' '}
                      <strong style={{ color: '#f8fafc' }}>{prov.temperature}</strong>
                    </div>
                  </div>

                  {/* Test Connection Results Container (replaces sharp var(--radius-sm)) */}
                  {test && (
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '14px',
                        backgroundColor: test.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${test.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        fontSize: '12.5px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: test.success ? '#10b981' : '#ef4444' }}>
                        {test.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        <span>{test.message}</span>
                      </div>
                      {test.errorDetails && (
                        <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                          {test.errorDetails}
                        </div>
                      )}
                    </div>
                  )}
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Data Management & Backup */}
      {activeTab === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Backup Reminder Banner */}
          <SpotlightCard style={{ padding: '24px', borderRadius: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: '0 0 6px 0' }}>
              Local Database Backup & Data Portability
            </h3>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Because all company records live inside your browser's IndexedDB, clearing browser storage will erase records unless you keep a backup.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleExportData}
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
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0, 80, 255, 0.35)',
                }}
              >
                <Download size={15} />
                <span>Export All Company Data (JSON)</span>
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

              <label
                style={{
                  borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                  padding: '10px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Upload size={15} color="#38bdf8" />
                <span>Import Backup File (JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </SpotlightCard>

          {/* Danger Zone */}
          <SpotlightCard
            style={{
              padding: '24px',
              borderRadius: '24px', // DESIGN.md --radius-cards: 24px
              borderColor: 'rgba(239, 68, 68, 0.3)',
              backgroundColor: 'rgba(239, 68, 68, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', marginBottom: '6px' }}>
              <AlertTriangle size={18} />
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Danger Zone</h3>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Irreversibly delete all local company records, customers, deals, financial transactions, tasks, bugs, and notes from IndexedDB.
            </p>

            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              style={{
                borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                padding: '9px 20px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#ef4444',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Trash2 size={14} />
              <span>Delete All Company Data</span>
            </button>
          </SpotlightCard>
        </div>
      )}

      {/* Tab 3: Company Profile */}
      {activeTab === 'company' && (
        <SpotlightCard style={{ padding: '28px', borderRadius: '24px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: '0 0 16px 0' }}>
            Company Profile & Preferences
          </h3>

          <form onSubmit={handleSaveCompany} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '580px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                Company Display Name *
              </label>
              <input
                type="text"
                required
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px', // DESIGN.md rounded input
                  backgroundColor: 'rgba(3, 7, 18, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                Legal Entity Name
              </label>
              <input
                type="text"
                value={compLegalName}
                onChange={(e) => setCompLegalName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(3, 7, 18, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                  Default Currency
                </label>
                <select
                  value={compCurrency}
                  onChange={(e) => setCompCurrency(e.target.value as Currency)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(3, 7, 18, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="SGD">SGD ($)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                  Website
                </label>
                <input
                  type="text"
                  value={compWebsite}
                  onChange={(e) => setCompWebsite(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(3, 7, 18, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                Industry
              </label>
              <input
                type="text"
                value={compIndustry}
                onChange={(e) => setCompIndustry(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(3, 7, 18, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                marginTop: '10px',
                alignSelf: 'flex-start',
                borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                padding: '10px 24px',
                backgroundColor: '#0050FF',
                color: '#ffffff',
                border: 'none',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 80, 255, 0.35)',
              }}
            >
              <span>Save Company Settings</span>
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
          </form>
        </SpotlightCard>
      )}

      {/* Tab 4: Architecture & About */}
      {activeTab === 'about' && (
        <SpotlightCard style={{ padding: '28px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
            System Architecture & Privacy Design
          </h3>

          <div style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.6 }}>
            <p style={{ marginBottom: '14px' }}>
              <strong style={{ color: '#f8fafc' }}>FounderOS</strong> is an autonomous, single-user founder operating system built with a 100% frontend-only, local-first architecture.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '4px' }}>Database Engine</strong>
                Browser IndexedDB (Dexie) with structured relational schema and versioning.
              </div>
              <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '4px' }}>AI Interface</strong>
                Client-side function calling pipeline supporting OpenRouter and custom OpenAI endpoints.
              </div>
              <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '4px' }}>Hosting</strong>
                Static single-page application on Netlify (zero backend servers).
              </div>
              <div style={{ padding: '14px', borderRadius: '14px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '4px' }}>CORS Compliance</strong>
                Requests to custom AI endpoints originate directly from the client browser window.
              </div>
            </div>
          </div>
        </SpotlightCard>
      )}

      {/* Add / Edit AI Provider Modal */}
      <Modal
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        title={editingProvider ? 'Edit AI Provider' : 'Configure AI Provider'}
        subtitle="Connect OpenRouter or any custom OpenAI-compatible API endpoint"
        maxWidth="620px"
      >
        <form onSubmit={handleSaveProvider} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Segmented Mode Selector (50px pill switcher with ambient glow) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              padding: '4px',
              borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <button
              type="button"
              onClick={() => handleModeSwitch('openrouter')}
              style={{
                padding: '8px 16px',
                borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                border: 'none',
                backgroundColor: providerMode === 'openrouter' ? '#0050FF' : 'transparent',
                color: providerMode === 'openrouter' ? '#ffffff' : '#94a3b8',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: providerMode === 'openrouter' ? '0 0 12px rgba(0, 80, 255, 0.35)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Sparkles size={14} />
              <span>OpenRouter (Auto URL)</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeSwitch('custom')}
              style={{
                padding: '8px 16px',
                borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                border: 'none',
                backgroundColor: providerMode === 'custom' ? '#0050FF' : 'transparent',
                color: providerMode === 'custom' ? '#ffffff' : '#94a3b8',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: providerMode === 'custom' ? '0 0 12px rgba(0, 80, 255, 0.35)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Cpu size={14} />
              <span>Custom URL & API</span>
            </button>
          </div>

          {/* OPENROUTER MODE */}
          {providerMode === 'openrouter' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Auto-filled Base URL notice */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(0, 80, 255, 0.08)',
                  border: '1px solid rgba(0, 80, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#38bdf8" />
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Auto-Configured Base URL
                    </span>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', fontFamily: 'monospace' }}>
                      https://openrouter.ai/api/v1
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '10px', // DESIGN.md --radius-small: 10px
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    fontWeight: 700,
                    border: '1px solid rgba(16, 185, 129, 0.28)',
                  }}
                >
                  🔒 Locked & Ready
                </span>
              </div>

              {/* OpenRouter API Key */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#f8fafc' }}>
                    OpenRouter API Key *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey((prev) => !prev)}
                    style={{ fontSize: '11.5px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showApiKey ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showApiKey ? 'Hide Key' : 'Show Key'}</span>
                  </button>
                </div>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  required
                  placeholder="sk-or-v1-..."
                  value={pApiKey}
                  onChange={(e) => setPApiKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(3, 7, 18, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  autoFocus
                />
                <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Get your key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>openrouter.ai/keys</a>
                </span>
              </div>

              {/* OpenRouter Model Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                  Select or Type OpenRouter Model *
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {[
                    { label: 'Claude 3.7 Sonnet', id: 'anthropic/claude-3.7-sonnet' },
                    { label: 'Claude 3.5 Haiku', id: 'anthropic/claude-3.5-haiku' },
                    { label: 'GPT-4o', id: 'openai/gpt-4o' },
                    { label: 'Gemini 2.0 Flash', id: 'google/gemini-2.0-flash-001' },
                    { label: 'DeepSeek V3', id: 'deepseek/deepseek-chat' },
                    { label: 'Llama 3.3 70B', id: 'meta-llama/llama-3.3-70b-instruct' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPModel(m.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '10px', // DESIGN.md --radius-small: 10px
                        fontSize: '11.5px',
                        border: pModel === m.id ? '1px solid rgba(0, 80, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: pModel === m.id ? 'rgba(0, 80, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        color: pModel === m.id ? '#38bdf8' : '#94a3b8',
                        cursor: 'pointer',
                        fontWeight: pModel === m.id ? 700 : 500,
                        transition: 'all 0.1s ease',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="anthropic/claude-3.7-sonnet"
                  value={pModel}
                  onChange={(e) => setPModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(3, 7, 18, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* CUSTOM URL & API MODE */}
          {providerMode === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Quick Presets */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Quick Fill Presets:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    { label: 'OpenAI', name: 'OpenAI', url: 'https://api.openai.com/v1', model: 'gpt-4o' },
                    { label: 'Groq (Ultra-Fast)', name: 'Groq Cloud', url: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
                    { label: 'Ollama (Localhost)', name: 'Ollama Local', url: 'http://localhost:11434/v1', model: 'llama3.2' },
                    { label: 'DeepSeek Direct', name: 'DeepSeek API', url: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
                    { label: 'Together AI', name: 'Together AI', url: 'https://api.together.xyz/v1', model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyCustomPreset(preset)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        borderRadius: '10px', // DESIGN.md --radius-small: 10px
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#f8fafc',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                    Provider Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OpenAI or Ollama"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(3, 7, 18, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f8fafc',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                    Model Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. gpt-4o or llama3.2"
                    value={pModel}
                    onChange={(e) => setPModel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(3, 7, 18, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f8fafc',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Custom Base URL */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                  Custom Base URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://api.openai.com/v1 or http://localhost:11434/v1"
                  value={pBaseUrl}
                  onChange={(e) => setPBaseUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
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
                <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Must support OpenAI-compatible <code>/chat/completions</code> endpoint.
                </span>
              </div>

              {/* Custom API Key */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#f8fafc' }}>
                    API Key (Leave blank for local Ollama)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey((prev) => !prev)}
                    style={{ fontSize: '11.5px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showApiKey ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showApiKey ? 'Hide Key' : 'Show Key'}</span>
                  </button>
                </div>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-... or gsk_..."
                  value={pApiKey}
                  onChange={(e) => setPApiKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
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

              {/* Custom HTTP Headers */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
                  Custom HTTP Headers (Optional JSON)
                </label>
                <textarea
                  rows={2}
                  placeholder='{ "HTTP-Referer": "https://localhost", "X-Custom": "value" }'
                  value={pCustomHeaders}
                  onChange={(e) => setPCustomHeaders(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
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
            </div>
          )}

          {/* Advanced Model Parameters (replaces sharp var(--radius-sm)) */}
          <div
            style={{
              padding: '14px',
              borderRadius: '16px', // DESIGN.md inner container
              backgroundColor: 'rgba(3, 7, 18, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Temperature ({pTemperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={pTemperature}
                onChange={(e) => setPTemperature(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#0050FF' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                Max Output Tokens
              </label>
              <input
                type="number"
                min="256"
                step="256"
                value={pMaxTokens}
                onChange={(e) => setPMaxTokens(parseInt(e.target.value) || 4096)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="pDefault"
              checked={pIsDefault}
              onChange={(e) => setPIsDefault(e.target.checked)}
              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#0050FF' }}
            />
            <label htmlFor="pDefault" style={{ fontSize: '13px', color: '#f8fafc', cursor: 'pointer', fontWeight: 500 }}>
              Set as Default AI Provider
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setIsProviderModalOpen(false)}
              style={{
                padding: '9px 18px',
                borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 22px',
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
                boxShadow: '0 4px 14px rgba(0, 80, 255, 0.35)',
              }}
            >
              <span>{editingProvider ? 'Update Provider' : 'Save & Activate Provider'}</span>
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

      {/* Delete All Data Confirm Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetDatabase}
        title="Delete All Company Data"
        message="This action will permanently wipe all local customers, financial transactions, deals, tasks, bugs, and notes from IndexedDB. This cannot be undone."
        confirmWord="DELETE"
        confirmButtonText="Erase All Data"
        isDestructive={true}
      />
    </div>
  );
};
