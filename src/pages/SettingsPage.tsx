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
    initialTab === 'providers' ? 'providers' : 'providers'
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
    setPApiKey(prov.apiKey);
    setPModel(prov.model);
    setPOrgId(prov.organizationId || '');
    setPTemperature(prov.temperature);
    setPMaxTokens(prov.maxTokens || 4096);
    setPCustomHeaders(prov.customHeaders ? JSON.stringify(prov.customHeaders, null, 2) : '');
    setPIsDefault(prov.isDefault);
    setShowApiKey(false);
    setIsProviderModalOpen(true);
  };

  const handleModeSwitch = (mode: 'openrouter' | 'custom') => {
    setProviderMode(mode);
    if (mode === 'openrouter') {
      setPType('openrouter');
      setPBaseUrl('https://openrouter.ai/api/v1');
      if (!editingProvider) {
        setPName('OpenRouter');
        setPModel('anthropic/claude-3.7-sonnet');
      }
    } else {
      setPType('openai-compatible');
      if (pBaseUrl === 'https://openrouter.ai/api/v1') {
        setPBaseUrl('https://api.openai.com/v1');
      }
      if (pName === 'OpenRouter') {
        setPName('Custom AI Provider');
        setPModel('gpt-4o');
      }
    }
  };

  const applyCustomPreset = (preset: { name: string; url: string; model: string }) => {
    setPName(preset.name);
    setPBaseUrl(preset.url);
    setPModel(preset.model);
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pBaseUrl || !pModel) return;

    let parsedHeaders: Record<string, string> = {};
    if (pCustomHeaders.trim()) {
      try {
        parsedHeaders = JSON.parse(pCustomHeaders);
      } catch {
        showToast('error', 'Invalid Headers', 'Invalid JSON in Custom Headers field. Please fix format.');
        return;
      }
    }

    await saveAIProvider({
      id: editingProvider?.id,
      name: pName,
      type: pType,
      baseUrl: pBaseUrl,
      apiKey: pApiKey,
      model: pModel,
      organizationId: pOrgId || undefined,
      temperature: Number(pTemperature),
      maxTokens: Number(pMaxTokens),
      customHeaders: parsedHeaders,
      isDefault: pIsDefault,
    });

    showToast('success', 'AI Provider Saved', `Configuration for "${pName}" has been saved.`);
    setIsProviderModalOpen(false);
  };

  const handleDeleteProvider = async (id: string) => {
    if (confirm('Delete this AI provider configuration?')) {
      await deleteAIProvider(id);
    }
  };

  const handleTestConnection = async (prov: AIProvider) => {
    setTestingProviderId(prov.id);
    const result = await testProviderConnection(prov);
    setTestResults((prev) => ({ ...prev, [prov.id]: result }));
    setTestingProviderId(null);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCompany({
      name: compName,
      legalName: compLegalName,
      website: compWebsite,
      industry: compIndustry,
      currency: compCurrency,
    });
    await updateSettings({ currency: compCurrency });
    showToast('success', 'Company Profile Saved', 'Company profile and preferences updated successfully.');
  };

  const handleExportData = async () => {
    const data = await exportAllData();
    const filename = `founderos_backup_${new Date().toISOString().split('T')[0]}.json`;
    downloadJsonFile(data, filename);
    showToast('info', 'Backup Exported', 'Downloaded encrypted JSON database backup.');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('⚠️ Restoring a backup will overwrite current local database records with data from this backup file. Do you wish to proceed?')) {
      e.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await importDataFromPayload(json);
      setImportStatus(res);
      showToast('success', 'Backup Restored', 'Database successfully imported and restored from backup!');
    } catch (err: any) {
      setImportStatus({ success: false, message: err.message || 'Import failed' });
      showToast('error', 'Import Failed', err.message || 'Import error occurred.');
    } finally {
      e.target.value = '';
    }
  };

  const handleResetDatabase = async () => {
    await clearAllCompanyData();
    showToast('danger', 'Database Cleared', 'All company data deleted. Database is now a clean slate.');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.035em' }}>
          Settings & Provider Architecture
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Configure user-owned AI credentials, local IndexedDB backup/export, and company details.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-faint)', paddingBottom: '12px', flexWrap: 'wrap' }}>
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
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isActive ? 'var(--brand-accent)' : 'var(--bg-surface-elevated)',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: isActive ? '1px solid var(--border-active)' : '1px solid var(--border-faint)',
                transition: 'all 0.15s ease',
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
          {/* Security Notice */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(0, 80, 255, 0.08)',
              border: '1px solid rgba(0, 80, 255, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <Shield size={20} color="var(--brand-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                Local-First Browser Security Notice:
              </strong>
              API keys entered here are stored strictly in your browser's local IndexedDB and are used directly from your browser.
              No backend server or proxy ever intercepts your credentials. For maximum security, do not use sensitive production credentials.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              Configured AI Providers ({providers.length})
            </h3>
            <button
              type="button"
              onClick={openAddProviderModal}
              className="btn-primary"
              style={{ borderRadius: '50px', padding: '9px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} /> Add Provider
            </button>
          </div>

          {/* Providers List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {providers.map((prov) => {
              const test = testResults[prov.id];
              const isTesting = testingProviderId === prov.id;

              return (
                <SpotlightCard
                  key={prov.id}
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--primary-blue-surface)',
                          color: 'var(--brand-accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Cpu size={18} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                            {prov.name}
                          </h4>
                          {prov.isDefault && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                padding: '1px 6px',
                                borderRadius: '999px',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#34d399',
                                fontWeight: 600,
                              }}
                            >
                              Default Provider
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          Type: <strong>{prov.type}</strong> • Endpoint: {prov.baseUrl}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!prov.isDefault && (
                        <button
                          type="button"
                          onClick={() => setDefaultAIProvider(prov.id)}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--brand-accent)' }}
                          title="Set as Default Provider for Copilot"
                        >
                          Make Default
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleTestConnection(prov)}
                        disabled={isTesting}
                        className="btn-secondary"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                      >
                        {isTesting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                        <span>{isTesting ? 'Pinging...' : 'Test Connection'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditProviderModal(prov)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProvider(prov.id)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--accent-rose)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Config Details */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '10px',
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      fontSize: '12px',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Model:</span>{' '}
                      <strong style={{ color: 'var(--text-main)' }}>{prov.model}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>API Key:</span>{' '}
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {prov.apiKey ? `••••••••${prov.apiKey.slice(-4)}` : '(None set)'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)' }}>Temperature:</span>{' '}
                      <strong style={{ color: 'var(--text-main)' }}>{prov.temperature}</strong>
                    </div>
                  </div>

                  {/* Test Connection Results Card */}
                  {test && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: test.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                        border: `1px solid ${test.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                        fontSize: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: test.success ? '#34d399' : '#fb7185' }}>
                        {test.success ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                        <span>{test.message}</span>
                      </div>
                      {test.errorDetails && (
                        <div style={{ color: 'var(--text-dim)', fontSize: '11.5px', marginTop: '2px' }}>
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
          <SpotlightCard style={{ padding: '20px 24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
              Local Database Backup & Data Portability
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Because all company records live inside your browser's IndexedDB, clearing browser storage will erase records unless you keep a backup.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleExportData}
                className="btn-primary"
              >
                <Download size={15} /> Export All Company Data (JSON)
              </button>

              <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                <Upload size={15} /> Import Backup File (JSON)
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
              padding: '20px 24px',
              borderColor: 'rgba(244, 63, 94, 0.3)',
              backgroundColor: 'rgba(244, 63, 94, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)', marginBottom: '6px' }}>
              <AlertTriangle size={18} />
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Danger Zone</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Irreversibly delete all local company records, customers, deals, financial transactions, tasks, bugs, and notes from IndexedDB.
            </p>

            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="btn-danger"
            >
              <Trash2 size={14} /> Delete All Company Data
            </button>
          </SpotlightCard>
        </div>
      )}

      {/* Tab 3: Company Profile */}
      {activeTab === 'company' && (
        <SpotlightCard style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
            Company Profile & Preferences
          </h3>

          <form onSubmit={handleSaveCompany} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '560px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Company Display Name *
              </label>
              <input
                type="text"
                required
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Legal Entity Name
              </label>
              <input
                type="text"
                value={compLegalName}
                onChange={(e) => setCompLegalName(e.target.value)}
                className="input-field"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Default Currency
                </label>
                <select
                  value={compCurrency}
                  onChange={(e) => setCompCurrency(e.target.value as Currency)}
                  className="input-field"
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Website
                </label>
                <input
                  type="text"
                  value={compWebsite}
                  onChange={(e) => setCompWebsite(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Industry
              </label>
              <input
                type="text"
                value={compIndustry}
                onChange={(e) => setCompIndustry(e.target.value)}
                className="input-field"
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '8px', alignSelf: 'flex-start' }}>
              Save Company Settings
            </button>
          </form>
        </SpotlightCard>
      )}

      {/* Tab 4: Architecture & About */}
      {activeTab === 'about' && (
        <SpotlightCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
            System Architecture & Privacy Design
          </h3>

          <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <p style={{ marginBottom: '10px' }}>
              <strong>FounderOS</strong> is an autonomous, single-user founder operating system built with a 100% frontend-only, local-first architecture.
            </p>

            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              <li><strong>Database Engine:</strong> Browser IndexedDB (Dexie) with structured relational schema and versioning.</li>
              <li><strong>AI Interface:</strong> Client-side function calling pipeline supporting OpenRouter and custom OpenAI-compatible endpoints.</li>
              <li><strong>Hosting:</strong> Deployable as a static single-page application on Netlify (zero backend servers).</li>
              <li><strong>CORS Compliance:</strong> Requests to custom AI endpoints originate directly from the browser window.</li>
            </ul>
          </div>
        </SpotlightCard>
      )}

      {/* Add / Edit AI Provider Modal */}
      <Modal
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        title={editingProvider ? 'Edit AI Provider' : 'Configure AI Provider'}
        subtitle="Connect OpenRouter or any custom OpenAI-compatible API endpoint"
        maxWidth="600px"
      >
        <form onSubmit={handleSaveProvider} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Segmented Mode Selector */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => handleModeSwitch('openrouter')}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: providerMode === 'openrouter' ? 'var(--brand-accent)' : 'transparent',
                color: providerMode === 'openrouter' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
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
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: providerMode === 'custom' ? 'var(--brand-accent)' : 'transparent',
                color: providerMode === 'custom' ? '#ffffff' : 'var(--text-muted)',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
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
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(0, 80, 255, 0.08)',
                  border: '1px solid rgba(0, 80, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="var(--brand-accent)" />
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Auto-Configured Base URL
                    </span>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      https://openrouter.ai/api/v1
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    fontWeight: 600,
                  }}
                >
                  🔒 Locked & Ready
                </span>
              </div>

              {/* OpenRouter API Key */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    OpenRouter API Key *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey((prev) => !prev)}
                    style={{ fontSize: '11px', color: 'var(--brand-accent)', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
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
                  className="input-field"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  autoFocus
                />
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                  Get your key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-accent)', textDecoration: 'underline' }}>openrouter.ai/keys</a>
                </span>
              </div>

              {/* OpenRouter Model Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
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
                        borderRadius: '999px',
                        fontSize: '11.5px',
                        border: pModel === m.id ? '1px solid var(--brand-accent)' : '1px solid var(--border-subtle)',
                        backgroundColor: pModel === m.id ? 'rgba(0, 80, 255, 0.15)' : 'var(--bg-surface-elevated)',
                        color: pModel === m.id ? 'var(--brand-accent)' : 'var(--text-muted)',
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
                  className="input-field"
                />
              </div>
            </div>
          )}

          {/* CUSTOM URL & API MODE */}
          {providerMode === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Quick Presets */}
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '6px', textTransform: 'uppercase' }}>
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
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Provider Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OpenAI or Ollama"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Model Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. gpt-4o or llama3.2"
                    value={pModel}
                    onChange={(e) => setPModel(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Custom Base URL */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Custom Base URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://api.openai.com/v1 or http://localhost:11434/v1"
                  value={pBaseUrl}
                  onChange={(e) => setPBaseUrl(e.target.value)}
                  className="input-field"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                  Must support OpenAI-compatible <code>/chat/completions</code> endpoint.
                </span>
              </div>

              {/* Custom API Key */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    API Key (Leave blank for local Ollama)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey((prev) => !prev)}
                    style={{ fontSize: '11px', color: 'var(--brand-accent)', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
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
                  className="input-field"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>

              {/* Custom HTTP Headers */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Custom HTTP Headers (Optional JSON)
                </label>
                <textarea
                  rows={2}
                  placeholder='{ "HTTP-Referer": "https://localhost", "X-Custom": "value" }'
                  value={pCustomHeaders}
                  onChange={(e) => setPCustomHeaders(e.target.value)}
                  className="input-field"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}
                />
              </div>
            </div>
          )}

          {/* Advanced Model Parameters */}
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-faint)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Temperature ({pTemperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={pTemperature}
                onChange={(e) => setPTemperature(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand-accent)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                Max Output Tokens
              </label>
              <input
                type="number"
                min="256"
                step="256"
                value={pMaxTokens}
                onChange={(e) => setPMaxTokens(parseInt(e.target.value) || 4096)}
                className="input-field"
                style={{ padding: '4px 8px', fontSize: '12px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="pDefault"
              checked={pIsDefault}
              onChange={(e) => setPIsDefault(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--brand-accent)' }}
            />
            <label htmlFor="pDefault" style={{ fontSize: '13px', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }}>
              Set as Default AI Provider
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={() => setIsProviderModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingProvider ? 'Update Provider' : 'Save & Activate Provider'}
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
