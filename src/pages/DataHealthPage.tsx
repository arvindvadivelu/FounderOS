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
import { MetricCard } from '../components/common/MetricCard';
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
    if (st === 'healthy') return '#10b981';
    if (st === 'warning') return '#f59e0b';
    return '#ef4444';
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
            SYSTEM RELIABILITY • LOCAL STORAGE INTEGRITY & DIAGNOSTICS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1
              style={{
                fontSize: 'clamp(24px, 3vw, 32px)',
                fontWeight: 800,
                color: '#f8fafc',
                letterSpacing: '-0.04em',
                margin: 0,
              }}
            >
              Data Health & Diagnostics
            </h1>
            {report && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '4px 10px',
                  borderRadius: '10px', // DESIGN.md --radius-small: 10px
                  backgroundColor: `rgba(${
                    report.status === 'healthy' ? '16, 185, 129' : report.status === 'warning' ? '245, 158, 11' : '239, 68, 68'
                  }, 0.12)`,
                  color: getStatusColor(report.status),
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: `1px solid rgba(${
                    report.status === 'healthy' ? '16, 185, 129' : report.status === 'warning' ? '245, 158, 11' : '239, 68, 68'
                  }, 0.28)`,
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(report.status),
                    boxShadow: `0 0 8px ${getStatusColor(report.status)}`,
                  }}
                />
                {report.status}
              </span>
            )}
          </div>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '6px', maxWidth: '680px' }}>
            Real-time IndexedDB schema verification, entity record audits, orphan reference detection, and backup health.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleExport}
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
            <Download size={15} color="#94a3b8" />
            <span>Export Backup</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
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
            <Upload size={15} color="#94a3b8" />
            <span>Restore</span>
          </button>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('/settings')}
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
              <span>Configure DB</span>
              <ArrowUpRight size={14} />
            </button>
          )}

          {/* Primary CTA with Action Indicator Dot */}
          <button
            type="button"
            onClick={runScan}
            disabled={isScanning}
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
              cursor: isScanning ? 'not-allowed' : 'pointer',
              opacity: isScanning ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(0, 80, 255, 0.35)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isScanning) e.currentTarget.style.backgroundColor = '#1a66ff';
            }}
            onMouseLeave={(e) => {
              if (!isScanning) e.currentTarget.style.backgroundColor = '#0050FF';
            }}
          >
            <RefreshCw size={15} className={isScanning ? 'animate-spin' : ''} />
            <span>{isScanning ? 'Auditing DB...' : 'Run Health Check'}</span>
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

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '16px', // DESIGN.md inner rounded container
            backgroundColor: actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: actionMessage.type === 'success' ? '#10b981' : '#ef4444',
            fontSize: '13.5px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
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
        <MetricCard
          title="Integrity Score"
          value={report ? `${report.healthScore}/100` : '...'}
          subtitle={`Status: ${report?.status || 'Scanning'}`}
          icon={<Activity size={18} color={getStatusColor(report?.status)} />}
        />

        <MetricCard
          title="Total Records"
          value={report ? report.totalRecords.toLocaleString() : '...'}
          subtitle="Across 21 IndexedDB tables"
          icon={<Database size={18} color="#38bdf8" />}
        />

        <MetricCard
          title="Storage Usage"
          value={report?.storage ? formatBytes(report.storage.usageBytes) : '< 5 MB'}
          subtitle={report?.storage ? `${report.storage.usagePercent}% quota (${formatBytes(report.storage.quotaBytes)})` : 'Local Origin Storage Active'}
          icon={<HardDrive size={18} color="#a855f7" />}
        />

        <MetricCard
          title="Last Backup"
          value={report?.lastBackupAt ? new Date(report.lastBackupAt).toLocaleDateString() : 'No Backup Yet'}
          subtitle={report?.lastBackupAt ? new Date(report.lastBackupAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Export recommended'}
          icon={<ShieldCheck size={18} color="#10b981" />}
        />
      </div>

      {/* Main Grid: Data Integrity Audit Log & Engine Specs */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }} className="health-grid-layout">
        {/* Left Column: Integrity Checks & Anomalies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SpotlightCard style={{ padding: '24px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: '0 0 4px 0' }}>
                  Data Integrity & Anomaly Audit
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0 }}>
                  Deep inspection of foreign-key links, duplicate keys, missing required fields, and invariant rules.
                </p>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  padding: '4px 10px',
                  borderRadius: '10px', // DESIGN.md --radius-small: 10px
                  backgroundColor: report?.anomalies.length === 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: report?.anomalies.length === 0 ? '#10b981' : '#ef4444',
                  border: `1px solid ${report?.anomalies.length === 0 ? 'rgba(16, 185, 129, 0.28)' : 'rgba(239, 68, 68, 0.28)'}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: report?.anomalies.length === 0 ? '#10b981' : '#ef4444',
                    boxShadow: `0 0 8px ${report?.anomalies.length === 0 ? '#10b981' : '#ef4444'}`,
                  }}
                />
                {report?.anomalies.length === 0 ? '0 Anomalies Found' : `${report?.anomalies.length} Issues Detected`}
              </span>
            </div>

            {report && report.anomalies.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '16px', // DESIGN.md inner container
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%', // Circular emblem
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px',
                    boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <ShieldCheck size={26} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', marginBottom: '6px', letterSpacing: '-0.02em' }}>
                  Database 100% Intact & Synchronized
                </h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
                  All foreign-key references, customer links, ledger transaction balances, department bindings, and invariant configs are healthy.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {report?.anomalies.map((anom) => (
                  <div
                    key={anom.id}
                    style={{
                      padding: '16px 18px',
                      borderRadius: '16px', // DESIGN.md inner rounded container
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${
                        anom.severity === 'high' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)'
                      }`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '14px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '240px' }}>
                      <div style={{ marginTop: '2px' }}>
                        {anom.severity === 'high' ? (
                          <XCircle size={18} color="#ef4444" />
                        ) : (
                          <AlertTriangle size={18} color="#f59e0b" />
                        )}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                            {anom.title}
                          </h5>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              backgroundColor: anom.severity === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: anom.severity === 'high' ? '#ef4444' : '#f59e0b',
                              border: `1px solid ${anom.severity === 'high' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                              textTransform: 'uppercase',
                            }}
                          >
                            {anom.entity}
                          </span>
                        </div>
                        <p style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                          {anom.description}
                        </p>
                      </div>
                    </div>

                    {anom.autoFixable && (
                      <button
                        type="button"
                        onClick={() => handleFix(anom)}
                        disabled={fixingId === anom.id}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                          backgroundColor: '#0050FF',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: fixingId === anom.id ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(0, 80, 255, 0.3)',
                          flexShrink: 0,
                        }}
                      >
                        <Wrench size={13} className={fixingId === anom.id ? 'animate-spin' : ''} />
                        <span>{fixingId === anom.id ? 'Fixing...' : 'Auto-Fix'}</span>
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            opacity: 0.9,
                          }}
                        />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SpotlightCard>

          {/* Record Counts Breakdown by Entity Category */}
          <SpotlightCard style={{ padding: '24px', borderRadius: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: '0 0 6px 0' }}>
              Entity Record Counts ({report?.entityCounts.length || 20} Tables)
            </h3>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 18px 0' }}>
              Real-time ledger counts across company models and operational tables in IndexedDB.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '12px',
              }}
            >
              {report?.entityCounts.map((item) => (
                <div
                  key={item.tableName}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px', // Replaces sharp var(--radius-sm)
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '13.5px', fontWeight: 800, letterSpacing: '-0.02em', color: item.count > 0 ? '#38bdf8' : '#64748b' }}>
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                    {item.entity}
                  </span>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </div>

        {/* Right Column: Database Engine & Architecture Specs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SpotlightCard style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Cpu size={18} color="#38bdf8" /> Database Engine Specs
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ color: '#94a3b8' }}>Database Name:</span>
                <strong style={{ color: '#f8fafc' }}>{report?.databaseName || 'FounderOS'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ color: '#94a3b8' }}>Schema Version:</span>
                <strong style={{ color: '#38bdf8' }}>v{report?.schemaVersion || 2}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ color: '#94a3b8' }}>Engine Standard:</span>
                <strong style={{ color: '#f8fafc' }}>IndexedDB (W3C)</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ color: '#94a3b8' }}>Architecture:</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  100% Frontend-Only
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ color: '#94a3b8' }}>Persistence:</span>
                <strong style={{ color: report?.storage?.persisted ? '#10b981' : '#94a3b8' }}>
                  {report?.storage?.persisted ? 'Persisted Active' : 'Standard'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Backend Dependency:</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  Zero Servers Required
                </span>
              </div>
            </div>

            {/* Security Guarantee Box (replaces sharp var(--radius-sm)) */}
            <div
              style={{
                marginTop: '4px',
                padding: '14px',
                borderRadius: '16px', // DESIGN.md inner container
                backgroundColor: 'rgba(0, 80, 255, 0.08)',
                border: '1px solid rgba(0, 80, 255, 0.2)',
                fontSize: '12px',
                color: '#94a3b8',
                lineHeight: 1.5,
                display: 'flex',
                gap: '10px',
              }}
            >
              <Lock size={16} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#f8fafc', display: 'block', marginBottom: '3px' }}>
                  Zero-Telemetry Local Privacy:
                </strong>
                All analytics, financials, invoices, and company strategy notes remain 100% inside your browser device.
              </div>
            </div>
          </SpotlightCard>

          {/* Quick Management Shortcuts */}
          <SpotlightCard style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', margin: 0 }}>
              Data Control Shortcuts
            </h4>

            {onNavigate && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => onNavigate('/settings?tab=data')}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 16px',
                    borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <span>Backup & Data Portability</span>
                  <ArrowUpRight size={14} color="#94a3b8" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('/settings?tab=providers')}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 16px',
                    borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <span>AI Model & Provider Config</span>
                  <ArrowUpRight size={14} color="#94a3b8" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 16px',
                    borderRadius: '50px', // DESIGN.md --radius-buttons: 50px
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#f8fafc',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <span>Founder Command Center</span>
                  <ArrowUpRight size={14} color="#94a3b8" />
                </button>
              </div>
            )}
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
};
