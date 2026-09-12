import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Database,
  HardDrive,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  Wrench,
  Layers,
  ArrowUpRight,
  Sparkles,
  ServerOff,
  Cpu,
  Lock,
} from 'lucide-react';
import { db } from '../db';
import { SpotlightCard } from '../components/common/SpotlightCard';
import { Badge } from '../components/common/Badge';
import { getDataHealthReport, fixDataAnomaly } from '../db/services/dataHealthService';
import { exportAllData, downloadJsonFile, importDataFromPayload } from '../utils/exportImport';
import type { DataHealthReport, DataAnomaly } from '../types';

interface DataHealthPageProps {
  onNavigate?: (route: string) => void;
}

export const DataHealthPage: React.FC<DataHealthPageProps> = ({ onNavigate }) => {
  const [report, setReport] = useState<DataHealthReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Live query on settings to track backup updates in real time
  const settings = useLiveQuery(async () => await db.settings.get('singleton'), []);

  const runScan = async () => {
    setIsScanning(true);
    setActionMessage(null);
    try {
      const rep = await getDataHealthReport();
      setReport(rep);
    } catch (err: any) {
      console.error('Health check failed:', err);
      setActionMessage({ type: 'error', text: `Health check failed: ${err.message}` });
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    runScan();
  }, [settings?.lastBackupAt]);

  const handleFix = async (anomaly: DataAnomaly) => {
    setFixingId(anomaly.id);
    try {
      const res = await fixDataAnomaly(anomaly.id);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message });
        await runScan();
      } else {
        setActionMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Fix error: ${err.message}` });
    } finally {
      setFixingId(null);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const filename = `founderos_backup_${new Date().toISOString().split('T')[0]}.json`;
      downloadJsonFile(data, filename);
      setActionMessage({ type: 'success', text: `Database exported successfully as "${filename}".` });
      await runScan();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Export failed: ${err.message}` });
    }
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
      setActionMessage({ type: 'success', text: res.message });
      await runScan();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Import failed: ${err.message}` });
    } finally {
      e.target.value = '';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (st?: string) => {
    if (st === 'healthy') return '#34d399';
    if (st === 'warning') return '#fbbf24';
    return '#fb7185';
  };

  const getStatusBg = (st?: string) => {
    if (st === 'healthy') return 'rgba(16, 185, 129, 0.15)';
    if (st === 'warning') return 'rgba(245, 158, 11, 0.15)';
    return 'rgba(244, 63, 94, 0.15)';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hidden File Input for Restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={22} color="var(--brand-accent)" /> Data Health & Diagnostics
            </h2>
            {report && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: getStatusBg(report.status),
                  color: getStatusColor(report.status),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {report.status === 'healthy' && <ShieldCheck size={13} />}
                {report.status === 'warning' && <AlertTriangle size={13} />}
                {report.status === 'error' && <XCircle size={13} />}
                {report.status}
              </span>
            )}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-time IndexedDB schema verification, entity record audits, orphan reference detection, and backup health.
          </p>
        </div>

        {/* Top Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={runScan}
            disabled={isScanning}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12.5px' }}
          >
            <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
            <span>{isScanning ? 'Auditing DB...' : 'Run Health Check'}</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12.5px' }}
          >
            <Download size={14} /> Export Backup
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12.5px' }}
          >
            <Upload size={14} /> Restore
          </button>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('/settings')}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '12.5px' }}
            >
              Settings & Backup
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            border: `1px solid ${actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            color: actionMessage.type === 'success' ? '#34d399' : '#fb7185',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Top 4 KPI Diagnostic Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Card 1: Health Score */}
        <SpotlightCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Integrity Score
            </span>
            <Activity size={16} color="var(--brand-accent)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: getStatusColor(report?.status) }}>
            {report ? `${report.healthScore}/100` : '...'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Status: <strong style={{ color: getStatusColor(report?.status), textTransform: 'capitalize' }}>{report?.status || 'Scanning'}</strong>
          </div>
        </SpotlightCard>

        {/* Card 2: Total Records */}
        <SpotlightCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Total Records
            </span>
            <Database size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
            {report ? report.totalRecords.toLocaleString() : '...'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across <strong>21 IndexedDB tables</strong>
          </div>
        </SpotlightCard>

        {/* Card 3: Storage Usage */}
        <SpotlightCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Storage Estimate
            </span>
            <HardDrive size={16} color="#a855f7" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)' }}>
            {report?.storage ? formatBytes(report.storage.usageBytes) : '< 5 MB'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {report?.storage ? `${report.storage.usagePercent}% of quota (${formatBytes(report.storage.quotaBytes)})` : 'Local Origin Storage Active'}
          </div>
        </SpotlightCard>

        {/* Card 4: Backup Status */}
        <SpotlightCard style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Last Backup
            </span>
            <ShieldCheck size={16} color="#34d399" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginTop: '6px' }}>
            {report?.lastBackupAt ? new Date(report.lastBackupAt).toLocaleDateString() : 'No Backup Yet'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {report?.lastBackupAt ? new Date(report.lastBackupAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Export recommended'}
          </div>
        </SpotlightCard>
      </div>

      {/* Main Grid: Data Integrity Audit Log & Engine Specs */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }} className="health-grid-layout">
        {/* Left Column: Integrity Checks & Anomalies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SpotlightCard style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Data Integrity & Anomaly Audit
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                  Deep inspection of foreign-key links, duplicate keys, missing required fields, and invariant rules.
                </p>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: report?.anomalies.length === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: report?.anomalies.length === 0 ? '#34d399' : '#fb7185',
                }}
              >
                {report?.anomalies.length === 0 ? '0 Anomalies Found' : `${report?.anomalies.length} Issues Detected`}
              </span>
            </div>

            {report && report.anomalies.length === 0 ? (
              <div
                style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px dashed rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <ShieldCheck size={24} />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                  Database 100% Intact & Synchronized
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
                  All foreign-key references, customer links, ledger transaction balances, department bindings, and invariant configs are healthy.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {report?.anomalies.map((anom) => (
                  <div
                    key={anom.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: `1px solid ${
                        anom.severity === 'high' ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-faint)'
                      }`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: '240px' }}>
                      <div style={{ marginTop: '2px' }}>
                        {anom.severity === 'high' ? (
                          <XCircle size={16} color="#fb7185" />
                        ) : (
                          <AlertTriangle size={16} color="#fbbf24" />
                        )}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                            {anom.title}
                          </h5>
                          <Badge variant={anom.severity === 'high' ? 'red' : 'amber'}>
                            {anom.entity}
                          </Badge>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                          {anom.description}
                        </p>
                      </div>
                    </div>

                    {anom.autoFixable && (
                      <button
                        type="button"
                        onClick={() => handleFix(anom)}
                        disabled={fixingId === anom.id}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0 }}
                      >
                        <Wrench size={13} className={fixingId === anom.id ? 'animate-spin' : ''} />
                        <span>{fixingId === anom.id ? 'Fixing...' : 'Auto-Fix'}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SpotlightCard>

          {/* Record Counts Breakdown by Entity Category */}
          <SpotlightCard style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
              Entity Record Counts ({report?.entityCounts.length || 20} Tables)
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: '10px',
              }}
            >
              {report?.entityCounts.map((item) => (
                <div
                  key={item.tableName}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-faint)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: item.count > 0 ? 'var(--brand-accent)' : 'var(--text-dim)' }}>
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {item.entity}
                  </span>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </div>

        {/* Right Column: Database Engine & Architecture Specs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SpotlightCard style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={16} color="var(--brand-accent)" /> Database Engine Specs
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-faint)' }}>
                <span style={{ color: 'var(--text-dim)' }}>Database Name:</span>
                <strong style={{ color: 'var(--text-main)' }}>{report?.databaseName || 'FounderOS'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-faint)' }}>
                <span style={{ color: 'var(--text-dim)' }}>Schema Version:</span>
                <strong style={{ color: 'var(--brand-accent)' }}>v{report?.schemaVersion || 2}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-faint)' }}>
                <span style={{ color: 'var(--text-dim)' }}>Engine Standard:</span>
                <strong style={{ color: 'var(--text-main)' }}>IndexedDB (W3C)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-faint)' }}>
                <span style={{ color: 'var(--text-dim)' }}>Architecture:</span>
                <strong style={{ color: '#34d399' }}>100% Frontend-Only</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-faint)' }}>
                <span style={{ color: 'var(--text-dim)' }}>Offline Persistence:</span>
                <strong style={{ color: report?.storage?.persisted ? '#34d399' : 'var(--text-muted)' }}>
                  {report?.storage?.persisted ? 'Persisted Active' : 'Standard'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)' }}>Backend Dependency:</span>
                <strong style={{ color: '#34d399' }}>Zero Servers Required</strong>
              </div>
            </div>

            {/* Security Guarantee */}
            <div
              style={{
                marginTop: '6px',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(0, 80, 255, 0.08)',
                border: '1px solid rgba(0, 80, 255, 0.2)',
                fontSize: '11.5px',
                color: 'var(--text-dim)',
                lineHeight: 1.45,
                display: 'flex',
                gap: '8px',
              }}
            >
              <Lock size={15} color="var(--brand-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                  Zero-Telemetry Local Privacy:
                </strong>
                All analytics, financials, invoices, and company strategy notes remain 100% inside your browser device.
              </div>
            </div>
          </SpotlightCard>

          {/* Quick Management Shortcuts */}
          <SpotlightCard style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
              Data Control Shortcuts
            </h4>

            {onNavigate && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('/settings?tab=data')}
                  className="btn-secondary"
                  style={{ justifyContent: 'space-between', fontSize: '12px', padding: '8px 12px' }}
                >
                  <span>Backup & Data Portability</span>
                  <ArrowUpRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('/settings?tab=providers')}
                  className="btn-secondary"
                  style={{ justifyContent: 'space-between', fontSize: '12px', padding: '8px 12px' }}
                >
                  <span>AI Model & Provider Config</span>
                  <ArrowUpRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="btn-secondary"
                  style={{ justifyContent: 'space-between', fontSize: '12px', padding: '8px 12px' }}
                >
                  <span>Founder Command Center</span>
                  <ArrowUpRight size={13} />
                </button>
              </>
            )}
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
};
