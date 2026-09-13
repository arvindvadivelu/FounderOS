import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Cpu,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Flame,
  Wrench,
} from 'lucide-react';
import { db } from '../db';
import { AutonomousRoutineService } from '../engines/autonomousRoutineService';
import type { AutonomousRoutine, OperationalAnomaly, RoutineExecutionRecord } from '../types';

export const AutonomousOperationsPage: React.FC = () => {
  const routines = useLiveQuery(() => db.autonomousRoutines.toArray(), []);
  const anomalies = useLiveQuery(() => db.anomalies.filter(a => !a.resolved).toArray(), []);
  const routineLogs = useLiveQuery(() => db.routineLogs.orderBy('executedAt').reverse().limit(15).toArray(), []);

  const [runningRoutineId, setRunningRoutineId] = useState<string | null>(null);
  const [healingAnomalyId, setHealingAnomalyId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkInitialScan() {
      const count = await db.anomalies.count();
      if (count === 0) {
        await AutonomousRoutineService.scanForAnomalies();
      }
    }
    checkInitialScan();
  }, []);

  const handleExecuteRoutine = async (routine: AutonomousRoutine) => {
    setRunningRoutineId(routine.id);
    try {
      const record = await AutonomousRoutineService.executeRoutine(routine);
      setToastMessage(`${routine.name}: ${record.summary}`);
    } finally {
      setRunningRoutineId(null);
    }
  };

  const handleAutoHeal = async (anomaly: OperationalAnomaly) => {
    setHealingAnomalyId(anomaly.id);
    try {
      await AutonomousRoutineService.autoHealAnomaly(anomaly.id);
      setToastMessage(`Auto-healed: ${anomaly.title}. Mitigation task created.`);
    } finally {
      setHealingAnomalyId(null);
    }
  };

  const handleScanNow = async () => {
    setRunningRoutineId('scan');
    try {
      const found = await AutonomousRoutineService.scanForAnomalies();
      setToastMessage(`System scan complete: ${found.length} active operational anomalies identified.`);
    } finally {
      setRunningRoutineId(null);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.35) 0%, rgba(59, 130, 246, 0.15) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)',
                flexShrink: 0,
              }}
            >
              <Cpu size={20} color="#34d399" />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.035em', margin: 0 }}>
              Autonomous Routine Operations & Auto-Healing
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                padding: '3px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              V2 AUTONOMOUS
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0 }}>
            Scheduled operational heartbeat, background anomaly scanner, and 1-click self-healing mitigation engine.
          </p>
        </div>

        <button
          onClick={handleScanNow}
          disabled={runningRoutineId !== null}
          style={{
            padding: '9px 18px',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '50px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            transition: 'all 0.15s ease',
          }}
        >
          <RefreshCw size={15} className={runningRoutineId === 'scan' ? 'spin' : ''} />
          Scan For Anomalies
        </button>
      </div>

      {toastMessage && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#10b981',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '12px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Scheduled Routines & Real-time Anomaly Stream */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '22px', marginBottom: '28px' }}>
        {/* Left Column: Scheduled Routines */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Clock size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Scheduled Operating Routines
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {routines?.map(routine => (
              <div
                key={routine.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-faint)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 800,
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                      }}
                    >
                      {routine.timeSlot}
                    </span>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                      {routine.name}
                    </h4>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor:
                        routine.lastStatus === 'healthy'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : routine.lastStatus === 'auto_healed'
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      color:
                        routine.lastStatus === 'healthy'
                          ? '#10b981'
                          : routine.lastStatus === 'auto_healed'
                          ? '#60a5fa'
                          : '#f59e0b',
                    }}
                  >
                    {routine.lastStatus.replace('_', ' ')}
                  </span>
                </div>

                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {routine.description}
                </p>

                {routine.lastRunSummary && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    Last summary: {routine.lastRunSummary}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    onClick={() => handleExecuteRoutine(routine)}
                    disabled={runningRoutineId !== null}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Play size={12} />
                    Run Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Operational Anomalies & Auto-Heal */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="#ef4444" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Active Operational Anomalies ({anomalies?.length || 0})
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {anomalies && anomalies.length > 0 ? (
              anomalies.map(anom => (
                <div
                  key={anom.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-faint)',
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {anom.title}
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor:
                          anom.severity === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: anom.severity === 'critical' ? '#ef4444' : '#f59e0b',
                      }}
                    >
                      {anom.severity}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    {anom.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      Detected: {new Date(anom.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {anom.autoHealable && (
                      <button
                        onClick={() => handleAutoHeal(anom)}
                        disabled={healingAnomalyId === anom.id}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <Wrench size={12} />
                        1-Click Auto-Heal
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '24px', color: '#10b981' }}>
                <CheckCircle2 size={32} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>All operational streams healthy. No active anomalies.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Routine Execution Records Table */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Autonomous Routine Execution Trail
          </h3>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>TIMESTAMP</th>
              <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>ROUTINE</th>
              <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>ANOMALIES DETECTED</th>
              <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>AUTO-HEALED</th>
              <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>SUMMARY</th>
            </tr>
          </thead>
          <tbody>
            {routineLogs && routineLogs.length > 0 ? (
              routineLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-faint)' }}>
                  <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>
                    {new Date(log.executedAt).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {log.routineName}
                  </td>
                  <td style={{ padding: '10px 16px', color: log.anomaliesDetectedCount > 0 ? '#f59e0b' : 'var(--text-dim)' }}>
                    {log.anomaliesDetectedCount}
                  </td>
                  <td style={{ padding: '10px 16px', color: '#10b981', fontWeight: 700 }}>
                    {log.anomaliesAutoHealedCount}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>
                    {log.summary}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No routine logs recorded. Click "Run Now" on any scheduled routine.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
