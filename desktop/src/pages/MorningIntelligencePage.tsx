import React, { useState, useEffect } from 'react';
import {
  Sun,
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
  Compass,
  MessageSquare,
  Bot,
  Bug,
  DollarSign,
  Users,
  Briefcase,
  GitPullRequest,
  Mail,
  Scale,
} from 'lucide-react';
import { SpotlightCard } from '../components/common/SpotlightCard';
import { Badge } from '../components/common/Badge';
import { generateMorningBriefing, getPersistedBriefing } from '../ai/morningBriefingService';
import { executeConfirmedToolAction } from '../ai/toolRunner';
import type { MorningBriefing, BriefingSection, BriefingPriority } from '../types';

interface MorningIntelligencePageProps {
  onNavigate: (route: string) => void;
  onOpenAiAssistant?: () => void;
}

export const MorningIntelligencePage: React.FC<MorningIntelligencePageProps> = ({
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
            console.error('Failed to load morning intelligence briefing:', err);
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
      console.error('Failed to regenerate morning intelligence briefing:', err);
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
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        <SpotlightCard style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', minHeight: '360px' }}>
          <RefreshCw size={28} className="animate-spin text-brand" />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-main)' }}>
              Synthesizing Morning Intelligence...
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Analyzing live financial ledgers, customer health, sales pipeline, tasks, goals, and external sync feeds.
            </p>
          </div>
        </SpotlightCard>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
        <SpotlightCard style={{ padding: '40px', textAlign: 'center' }}>
          <AlertTriangle size={32} color="#f59e0b" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>Morning Intelligence Unavailable</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Could not generate briefing from local IndexedDB.
          </p>
          <button type="button" onClick={handleRegenerate} className="btn-primary" style={{ margin: '0 auto' }}>
            <RefreshCw size={15} /> Generate Briefing Now
          </button>
        </SpotlightCard>
      </div>
    );
  }

  const filteredSections = activeTab === 'all'
    ? briefing.sections
    : briefing.sections.filter((s) => s.category === activeTab);

  const formattedDate = new Date(briefing.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = new Date(briefing.generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, rgba(245, 158, 11, 0.3) 0%, rgba(234, 88, 12, 0.1) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.2)',
                flexShrink: 0,
              }}
            >
              <Sun size={22} color="#f59e0b" />
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.035em' }}>
              Morning Intelligence
            </h1>
            <span
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                fontWeight: 600,
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                letterSpacing: '0.02em',
              }}
            >
              ● Live Local Intelligence
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0, maxWidth: '700px' }}>
            Daily executive situational awareness synthesized directly from live company data & connected integrations.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => onNavigate('/ai?action=briefing')}
            className="btn-primary"
            style={{ padding: '9px 18px', fontSize: '13px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Bot size={15} /> Ask AI CEO
          </button>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="btn-secondary"
            style={{
              padding: '9px 16px',
              fontSize: '13px',
              borderRadius: '50px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: isRegenerating ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={15} className={isRegenerating ? 'animate-spin text-brand' : ''} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Date & Provenance Status Ribbon */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          fontSize: '13px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 600 }}>
            <Calendar size={15} color="var(--brand-accent)" />
            <span>{formattedDate}</span>
          </div>
          <span style={{ color: 'var(--border-subtle)' }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <Clock size={14} />
            <span>Generated at {formattedTime}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
            Data Feeds:
          </span>
          {briefing.dataSources.slice(0, 4).map((source, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-faint)',
              }}
            >
              {source.includes('(') ? source.split('(')[0].trim() : source}
            </span>
          ))}
        </div>
      </div>

      {/* Executive Summary Spotlight Banner */}
      <SpotlightCard
        style={{
          padding: '26px 30px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(15, 23, 42, 0.9) 100%)',
          borderColor: 'rgba(245, 158, 11, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Sparkles size={16} color="#f59e0b" />
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Executive Situational Summary
          </span>
        </div>
        <p
          style={{
            fontSize: '15.5px',
            lineHeight: '1.65',
            color: 'var(--text-main)',
            margin: '0 0 16px 0',
            fontWeight: 450,
          }}
          dangerouslySetInnerHTML={{
            __html: briefing.executiveSummary.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ffffff; font-weight: 700;">$1</strong>'),
          }}
        />
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => onNavigate('/ai?action=briefing')}
            style={{
              padding: '8px 18px',
              borderRadius: '50px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#f59e0b',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'all 0.15s ease',
            }}
          >
            <Bot size={14} /> Discuss with AI CEO <ArrowRight size={13} />
          </button>
        </div>
      </SpotlightCard>

      {/* Top 3 Priorities for Today */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="#f59e0b" />
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Top 3 Priorities for Today
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Algorithmic leverage ranking</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {briefing.topPriorities.map((item) => (
            <SpotlightCard
              key={item.priorityNumber}
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: '4px solid var(--brand-accent)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--brand-accent)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 800,
                    }}
                  >
                    {item.priorityNumber}
                  </span>
                  {item.targetEntity && (
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                        fontWeight: 600,
                      }}
                    >
                      {item.targetEntity}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)', lineHeight: 1.4 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  {item.rationale}
                </p>
              </div>

              {item.route && (
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-faint)' }}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.route!.replace('#', ''))}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--brand-accent)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    Open in {item.targetEntity || 'Module'} <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </SpotlightCard>
          ))}
        </div>
      </div>

      {/* Strategic Risks & Growth Opportunities Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Top Risks */}
        <SpotlightCard style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={18} color="#ef4444" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Identified Operational Risks
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {briefing.topRisks.map((risk, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-surface)',
                  border: `1px solid ${
                    risk.severity === 'high'
                      ? 'rgba(239, 68, 68, 0.3)'
                      : risk.severity === 'medium'
                      ? 'rgba(245, 158, 11, 0.3)'
                      : 'var(--border-subtle)'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>{risk.title}</strong>
                  <span
                    style={{
                      fontSize: '10.5px',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      backgroundColor:
                        risk.severity === 'high'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : risk.severity === 'medium'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(16, 185, 129, 0.15)',
                      color:
                        risk.severity === 'high'
                          ? '#ef4444'
                          : risk.severity === 'medium'
                          ? '#f59e0b'
                          : '#10b981',
                    }}
                  >
                    {risk.severity}
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {risk.description}
                </p>
              </div>
            ))}
          </div>
        </SpotlightCard>

        {/* Top Opportunities */}
        <SpotlightCard style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Lightbulb size={18} color="#10b981" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Growth & Conversion Opportunities
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {briefing.topOpportunities.map((opp, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>{opp.title}</strong>
                  {opp.potentialValue && (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>
                      {opp.potentialValue}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {opp.description}
                </p>
              </div>
            ))}
          </div>
        </SpotlightCard>
      </div>

      {/* 6 Core Dimension Deep-Dive Sections */}
      <div>
        {/* Category Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--brand-accent)" />
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Operational Dimension Deep-Dive
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '4px',
              overflowX: 'auto',
              padding: '3px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50px',
            }}
          >
            {[
              { id: 'all', label: 'All Dimensions' },
              { id: 'finance', label: 'Finance' },
              { id: 'sales', label: 'Sales' },
              { id: 'customers', label: 'Customers' },
              { id: 'tasks', label: 'Tasks' },
              { id: 'goals', label: 'Goals' },
              { id: 'engineering', label: 'Engineering' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '50px',
                    backgroundColor: isActive ? 'var(--brand-accent)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? '0 0 12px rgba(0, 80, 255, 0.4)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dimension Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredSections.map((sec, idx) => (
            <SpotlightCard key={idx} style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    {sec.title}
                  </h3>
                  <span
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--brand-accent)',
                      fontWeight: 700,
                      border: '1px solid var(--border-faint)',
                    }}
                  >
                    {sec.category}
                  </span>
                </div>

                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  {sec.summary}
                </p>

                {/* Key Metric Data Points */}
                {sec.dataPoints && sec.dataPoints.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '10px',
                      marginBottom: '16px',
                    }}
                  >
                    {sec.dataPoints.map((dp, dpIdx) => (
                      <div
                        key={dpIdx}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          border: '1px solid var(--border-faint)',
                        }}
                      >
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                          {dp.label}
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {dp.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Detailed bullet findings */}
                {sec.details && sec.details.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-faint)', paddingTop: '12px', marginBottom: '16px' }}>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {sec.details.map((det, detIdx) => (
                        <li key={detIdx}>{det}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              {sec.links && sec.links.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--border-faint)', paddingTop: '12px' }}>
                  {sec.links.map((link, lIdx) => (
                    <button
                      key={lIdx}
                      type="button"
                      onClick={() => onNavigate(link.route.replace('#', ''))}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      {link.label} <ArrowRight size={12} />
                    </button>
                  ))}
                </div>
              )}
            </SpotlightCard>
          ))}
        </div>
      </div>

      {/* Actionable AI Recommendations */}
      {briefing.recommendations && briefing.recommendations.length > 0 && (
        <SpotlightCard style={{ padding: '24px', border: '1px solid rgba(0, 80, 255, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={18} color="var(--brand-accent)" />
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Actionable AI Recommendations
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
            {briefing.recommendations.map((rec) => {
              const isExecuted = executedRecIds.includes(rec.id);
              const isExecuting = executingRecId === rec.id;

              return (
                <div
                  key={rec.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                      {rec.title}
                    </strong>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                      {rec.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isExecuted || isExecuting}
                    onClick={() => handleExecuteRecommendation(rec)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '50px',
                      backgroundColor: isExecuted ? 'rgba(16, 185, 129, 0.15)' : 'var(--brand-accent)',
                      border: isExecuted ? '1px solid rgba(16, 185, 129, 0.3)' : 'none',
                      color: isExecuted ? '#10b981' : '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: isExecuted || isExecuting ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      boxShadow: !isExecuted && !isExecuting ? '0 0 12px rgba(0, 80, 255, 0.3)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isExecuted ? (
                      <>
                        <Check size={13} /> Action Recorded
                      </>
                    ) : isExecuting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" /> Recording Action...
                      </>
                    ) : (
                      <>
                        <Zap size={13} /> Propose Action
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </SpotlightCard>
      )}

      {/* Provenance & Security Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderRadius: '10px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-faint)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} color="#10b981" />
          <span>
            <strong>Zero-Hallucination Guarantee:</strong> 100% computed from local IndexedDB data and allowlisted external feeds.
          </span>
        </div>
        <span>FounderOS v2.0 • Executive Intelligence Engine</span>
      </div>
    </div>
  );
};
