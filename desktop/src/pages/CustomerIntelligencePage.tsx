import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Users,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Mail,
  ArrowUpRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { db } from '../db';
import { CustomerIntelligenceEngine } from '../engines/customerIntelligenceEngine';
import type { CustomerHealthMetric, AccountExpansionOpportunity } from '../types';

export const CustomerIntelligencePage: React.FC = () => {
  const healthScores = useLiveQuery(() => db.customerHealthScores.toArray(), []);
  const expansionOpps = useLiveQuery(() => db.expansionOpportunities.toArray(), []);

  const [selectedQuadrant, setSelectedQuadrant] = useState<string>('all');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRunHealthScan = async () => {
    setIsScanning(true);
    try {
      await CustomerIntelligenceEngine.evaluateAllCustomers();
      await CustomerIntelligenceEngine.discoverExpansionOpportunities();
      setToastMessage('Customer health radar and expansion opportunities updated successfully.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleTriggerIntervention = async (item: CustomerHealthMetric) => {
    // Create an urgent task for founder
    await db.tasks.add({
      id: `task-retention-${Date.now()}`,
      title: `Founder VIP Retention Check-In: ${item.companyName}`,
      description: `Targeted intervention based on churn risk score ${item.churnRiskScore}/100. Factors: ${item.churnRiskFactors.join(', ')}.`,
      priority: 'critical',
      status: 'todo',
      tags: ['churn-preemption', 'vip-client'],
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setToastMessage(`Intervention task created for ${item.companyName}.`);
  };

  const filteredScores = healthScores
    ? healthScores.filter(s => selectedQuadrant === 'all' || s.quadrant === selectedQuadrant)
    : [];

  const atRiskCount = healthScores?.filter(s => s.quadrant === 'at_risk').length || 0;
  const championsCount = healthScores?.filter(s => s.quadrant === 'champion').length || 0;
  const totalUpsideArr = expansionOpps?.reduce((sum, opp) => sum + opp.upsideArr, 0) || 0;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.35)',
              }}
            >
              <Users size={18} color="#fff" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              Customer Intelligence & Churn Radar
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                padding: '3px 9px',
                borderRadius: '999px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              V2 RADAR
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Algorithmic 0–100 health scoring, early churn warning signals, and AI account expansion opportunities.
          </p>
        </div>

        <button
          onClick={handleRunHealthScan}
          disabled={isScanning}
          style={{
            padding: '9px 16px',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
          }}
        >
          <RefreshCw size={15} className={isScanning ? 'spin' : ''} />
          Refresh Radar Diagnostics
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

      {/* Top 3 Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>AT-RISK ACCOUNTS</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: atRiskCount > 0 ? '#ef4444' : '#10b981', marginTop: '4px' }}>
            {atRiskCount} Accounts
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Requiring proactive founder retention intervention
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>CHAMPION ACCOUNTS</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
            {championsCount} Accounts
          </div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
            High NPS & candidate for multi-seat expansion
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>EXPANSION UPSIDE</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            +${totalUpsideArr.toLocaleString()} ARR
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Identified across existing customer contracts
          </div>
        </div>
      </div>

      {/* Main Grid: Customer Radar Table & Expansion Queue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '22px' }}>
        {/* Left Column: Health Radar Table */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Account Health Radar
            </h3>

            {/* Quadrant Filter */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['all', 'champion', 'loyalist', 'at_risk'] as const).map(q => (
                <button
                  key={q}
                  onClick={() => setSelectedQuadrant(q)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: selectedQuadrant === q ? 'var(--brand-accent)' : 'var(--border-faint)',
                    backgroundColor: selectedQuadrant === q ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface)',
                    color: selectedQuadrant === q ? '#38bdf8' : 'var(--text-muted)',
                    textTransform: 'capitalize',
                  }}
                >
                  {q.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>ACCOUNT</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>HEALTH</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>CHURN RISK</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>QUADRANT</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredScores.map(score => (
                  <tr key={score.id} style={{ borderBottom: '1px solid var(--border-faint)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{score.companyName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        ${score.mrr.toLocaleString()}/mo • {score.plan}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '38px', height: '6px', backgroundColor: 'var(--bg-surface)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${score.healthScore}%`, height: '100%', backgroundColor: score.healthScore > 75 ? '#10b981' : score.healthScore > 50 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                        <span style={{ fontWeight: 700, color: score.healthScore > 75 ? '#10b981' : score.healthScore > 50 ? '#f59e0b' : '#ef4444' }}>
                          {score.healthScore}/100
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: score.churnRiskScore > 40 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: score.churnRiskScore > 40 ? '#ef4444' : '#10b981',
                        }}
                      >
                        {score.churnRiskScore}% Risk
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: score.quadrant === 'champion' ? '#38bdf8' : score.quadrant === 'at_risk' ? '#ef4444' : '#10b981',
                        }}
                      >
                        {score.quadrant.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {score.quadrant === 'at_risk' && (
                        <button
                          onClick={() => handleTriggerIntervention(score)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Intervene
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Expansion Opportunities Queue */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={18} color="#10b981" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Account Expansion Opportunities
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {expansionOpps && expansionOpps.length > 0 ? (
              expansionOpps.map(opp => (
                <div
                  key={opp.id}
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
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>{opp.companyName}</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#10b981' }}>+${opp.upsideArr.toLocaleString()} ARR</span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    {opp.strategicAngle}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      Confidence: {opp.confidencePct}% • Type: {opp.expansionType.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => setToastMessage(`AI CRO proposal drafted for ${opp.companyName}`)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Draft Pitch
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                No expansion candidates identified yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
