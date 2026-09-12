import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Target,
  Clock,
  Layers,
  Check,
} from 'lucide-react';
import { SpotlightCard } from '../common/SpotlightCard';
import { Badge } from '../common/Badge';
import { generateMorningBriefing, getPersistedBriefing } from '../../ai/morningBriefingService';
import { executeConfirmedToolAction } from '../../ai/toolRunner';
import type { MorningBriefing, BriefingSection, BriefingPriority } from '../../types';

interface MorningBriefingCardProps {
  onNavigate: (route: string) => void;
  onOpenAiAssistant?: () => void;
}

export const MorningBriefingCard: React.FC<MorningBriefingCardProps> = ({
  onNavigate,
  onOpenAiAssistant,
}) => {
  const [briefing, setBriefing] = useState<MorningBriefing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [executedRecIds, setExecutedRecIds] = useState<string[]>([]);
  const [executingRecId, setExecutingRecId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getPersistedBriefing().then((cached) => {
      if (cached && isMounted) {
        setBriefing(cached);
        setIsLoading(false);
      } else {
        generateMorningBriefing({ force: false })
          .then((fresh) => {
            if (isMounted) {
              setBriefing(fresh);
              setIsLoading(false);
            }
          })
          .catch((err) => {
            console.error('Failed to load morning briefing:', err);
            if (isMounted) setIsLoading(false);
          });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const fresh = await generateMorningBriefing({ force: true });
      setBriefing(fresh);
    } catch (err) {
      console.error('Failed to regenerate morning briefing:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleExecuteRecommendation = async (rec: any) => {
    if (!rec.suggestedActionTool || !rec.suggestedActionPayload) return;
    setExecutingRecId(rec.id);
    try {
      await executeConfirmedToolAction(
        `briefing_action_${Date.now()}`,
        `tool_rec_${Date.now()}`,
        rec.suggestedActionTool,
        rec.suggestedActionPayload
      );
      setExecutedRecIds((prev) => [...prev, rec.id]);
    } catch (err) {
      console.error('Failed to execute recommendation:', err);
    } finally {
      setExecutingRecId(null);
    }
  };

  if (isLoading) {
    return (
      <SpotlightCard style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', minHeight: '180px' }}>
        <RefreshCw size={18} className="animate-spin text-brand" />
        <span style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
          Synthesizing daily founder briefing from local IndexedDB data...
        </span>
      </SpotlightCard>
    );
  }

  if (!briefing) {
    return (
      <SpotlightCard style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          No morning briefing generated yet.
        </p>
        <button type="button" onClick={handleRegenerate} className="btn-primary">
          <Sparkles size={15} /> Generate Morning Briefing
        </button>
      </SpotlightCard>
    );
  }

  const generatedTimeStr = new Date(briefing.generatedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <SpotlightCard
      style={{
        padding: '24px 28px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
        border: '1px solid rgba(0, 80, 255, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(0, 80, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-accent)',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                Founder Morning Intelligence Briefing
              </h3>
              <Badge variant="blue">
                Live Ground Truth
              </Badge>
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
              Compiled today at {generatedTimeStr} from {briefing.dataSources.length} local database domains.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Re-query IndexedDB and synthesize fresh briefing"
          >
            <RefreshCw size={13} className={isRegenerating ? 'animate-spin' : ''} />
            <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/morning-intelligence')}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            title="Open dedicated Morning Intelligence workspace"
          >
            <span>Full Briefing</span>
            <ArrowRight size={13} />
          </button>

          {onOpenAiAssistant && (
            <button
              type="button"
              onClick={onOpenAiAssistant}
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '12px' }}
            >
              <span>Ask AI CEO</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Executive Summary Narrative */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(0, 80, 255, 0.06)',
          borderLeft: '4px solid var(--brand-accent)',
          fontSize: '13.5px',
          lineHeight: 1.6,
          color: 'var(--text-main)',
        }}
      >
        <span dangerouslySetInnerHTML={{ __html: briefing.executiveSummary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
      </div>

      {/* Top 3 Priorities for Today */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Zap size={15} color="var(--brand-accent)" />
          <h4 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)' }}>
            Top 3 High-Leverage Priorities for Today
          </h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {briefing.topPriorities.map((p) => (
            <div
              key={p.priorityNumber}
              onClick={() => p.route && onNavigate(p.route.replace('#', ''))}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-faint)',
                cursor: p.route ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-faint)')}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(0, 80, 255, 0.15)',
                      color: 'var(--brand-accent)',
                    }}
                  >
                    Priority #{p.priorityNumber}
                  </span>
                  {p.targetEntity && (
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      {p.targetEntity}
                    </span>
                  )}
                </div>
                <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {p.title}
                </h5>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                  {p.rationale}
                </p>
              </div>

              {p.route && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--brand-accent)', fontWeight: 600, marginTop: '4px' }}>
                  <span>Open in {p.targetEntity || 'Module'}</span>
                  <ArrowRight size={12} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Category Section Metrics */}
      <div>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '14px', borderBottom: '1px solid var(--border-faint)', paddingBottom: '8px' }}>
          {['all', 'finance', 'sales', 'customers', 'tasks', 'goals', 'engineering'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: activeTab === tab ? 700 : 500,
                backgroundColor: activeTab === tab ? 'var(--primary-blue-surface)' : 'transparent',
                color: activeTab === tab ? 'var(--brand-accent)' : 'var(--text-dim)',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'all' ? 'All Dimensions' : tab}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {briefing.sections
            .filter((sec) => activeTab === 'all' || sec.category === activeTab)
            .map((sec) => (
              <div
                key={sec.title}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-faint)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {sec.title}
                  </h5>
                  {sec.links?.[0] && (
                    <button
                      type="button"
                      onClick={() => sec.links?.[0]?.route && onNavigate(sec.links[0].route.replace('#', ''))}
                      style={{ fontSize: '11px', color: 'var(--brand-accent)', display: 'flex', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <span>{sec.links[0].label}</span>
                      <ExternalLink size={11} />
                    </button>
                  )}
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {sec.summary}
                </p>

                {sec.dataPoints && sec.dataPoints.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    {sec.dataPoints.map((dp) => (
                      <div
                        key={dp.label}
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                        }}
                      >
                        <span style={{ color: 'var(--text-dim)' }}>{dp.label}: </span>
                        <strong style={{ color: 'var(--text-main)' }}>{dp.value}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Top Risks & Opportunities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        {/* Risks */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(244, 63, 94, 0.04)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <AlertTriangle size={15} color="var(--accent-rose)" />
            <h5 style={{ fontSize: '12.5px', fontWeight: 700, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Identified Operational Risks
            </h5>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {briefing.topRisks.map((r, i) => (
              <div key={i} style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                <strong>• {r.title}:</strong> <span style={{ color: 'var(--text-muted)' }}>{r.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(16, 185, 129, 0.04)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Lightbulb size={15} color="#34d399" />
            <h5 style={{ fontSize: '12.5px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Strategic Growth Opportunities
            </h5>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {briefing.topOpportunities.map((o, i) => (
              <div key={i} style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                <strong>• {o.title}:</strong> <span style={{ color: 'var(--text-muted)' }}>{o.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actionable Recommendations (1-Click Safe Action Generation) */}
      {briefing.recommendations && briefing.recommendations.length > 0 && (
        <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-faint)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Zap size={14} color="var(--brand-accent)" />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-dim)' }}>
              1-Click Proposable Actions
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {briefing.recommendations.map((rec) => {
              const isExecuted = executedRecIds.includes(rec.id);
              const isExecuting = executingRecId === rec.id;

              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => !isExecuted && handleExecuteRecommendation(rec)}
                  disabled={isExecuting || isExecuted}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isExecuted ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-elevated)',
                    border: `1px solid ${isExecuted ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-active)'}`,
                    color: isExecuted ? '#34d399' : 'var(--text-main)',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: isExecuted ? 'default' : 'pointer',
                  }}
                >
                  {isExecuted ? (
                    <>
                      <Check size={13} color="#34d399" />
                      <span>Task Created</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} color="var(--brand-accent)" />
                      <span>{rec.title}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </SpotlightCard>
  );
};
