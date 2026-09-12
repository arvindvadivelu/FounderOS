import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  FolderKanban,
  Target,
  Sparkles,
  Zap,
  Layers,
  MessageSquare,
  Bug,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { db } from '../db';
import { ProductIntelligenceEngine } from '../engines/productIntelligenceEngine';
import type { ProductRiceScore, FeedbackCluster, RiceQuadrant } from '../types';

export const ProductIntelligencePage: React.FC = () => {
  const priorities = useLiveQuery(() => db.productPriorities.orderBy('riceScore').reverse().toArray(), []);
  const feedbackClusters = ProductIntelligenceEngine.getFeedbackClusters();

  const [selectedQuadrant, setSelectedQuadrant] = useState<string>('all');

  const filteredPriorities = priorities
    ? priorities.filter(p => selectedQuadrant === 'all' || p.quadrant === selectedQuadrant)
    : [];

  const quickWins = priorities?.filter(p => p.quadrant === 'quick_win') || [];
  const majorBets = priorities?.filter(p => p.quadrant === 'major_bet') || [];
  const totalArrInfluenced = priorities?.reduce((sum, p) => sum + p.arrInfluenceEstimate, 0) || 0;

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
                background: 'radial-gradient(circle at 30% 30%, rgba(245, 158, 11, 0.35) 0%, rgba(236, 72, 153, 0.15) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.25)',
                flexShrink: 0,
              }}
            >
              <FolderKanban size={20} color="#fbbf24" />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.035em', margin: 0 }}>
              Product Intelligence & RICE Matrix
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                padding: '3px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              V2 RICE MATRIX
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0 }}>
            Data-driven roadmap prioritization: (Reach × Impact × Confidence) / Effort tied to ARR leverage and customer feedback clusters.
          </p>
        </div>
      </div>

      {/* Top 3 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>HIGH-ROI QUICK WINS</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {quickWins.length} Features
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Low effort engineering sprints with maximum customer ARR impact
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>MAJOR STRATEGIC BETS</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
            {majorBets.length} Features
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Multi-week platform capabilities required for enterprise deals
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>ROADMAP ARR INFLUENCE</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            ${totalArrInfluenced.toLocaleString()} ARR
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Validated pipeline unlocked by active roadmap delivery
          </div>
        </div>
      </div>

      {/* Main Grid: RICE Prioritization Backlog & Feedback Clusters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '22px' }}>
        {/* Left Column: RICE Prioritization Table */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              RICE Priority Ranking
            </h3>

            {/* Quadrant Selector */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['all', 'quick_win', 'major_bet', 'fill_in'] as const).map(q => (
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
                  <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>FEATURE</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>RICE SCORE</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>QUADRANT</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>EFFORT (DAYS)</th>
                  <th style={{ padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 700 }}>ARR LEVERAGE</th>
                </tr>
              </thead>
              <tbody>
                {filteredPriorities.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-faint)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {p.category.toUpperCase()} • Quarter: {p.suggestedQuarter}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8' }}>
                        {p.riceScore}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor:
                            p.quadrant === 'quick_win'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : p.quadrant === 'major_bet'
                              ? 'rgba(59, 130, 246, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                          color:
                            p.quadrant === 'quick_win'
                              ? '#10b981'
                              : p.quadrant === 'major_bet'
                              ? '#60a5fa'
                              : '#f59e0b',
                          textTransform: 'uppercase',
                        }}
                      >
                        {p.quadrant.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {p.engineeringEffortDays} Days
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#10b981' }}>
                      +${p.arrInfluenceEstimate.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Feedback Clusters */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <MessageSquare size={18} color="#f59e0b" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Synthesized Feedback Clusters
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {feedbackClusters.map(cluster => (
              <div
                key={cluster.id}
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
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {cluster.topic}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#10b981' }}>
                    ${cluster.associatedArr.toLocaleString()} ARR
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  {cluster.customerMentionsCount} Customer Mentions • Sentiment: {cluster.sentiment}
                </div>

                <div style={{ fontStyle: 'italic', fontSize: '12px', color: 'var(--text-muted)', borderLeft: '2px solid var(--border-subtle)', paddingLeft: '8px', margin: '4px 0' }}>
                  {cluster.sampleQuotes[0]}
                </div>

                <div style={{ fontSize: '11.5px', color: '#38bdf8', fontWeight: 600 }}>
                  ↳ Action: {cluster.suggestedRoadmapAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
