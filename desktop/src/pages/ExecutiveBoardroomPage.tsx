import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Users,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Play,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { db } from '../db';
import { ExecutiveAgentService, EXECUTIVE_AGENTS } from '../engines/executiveAgentService';
import type { AgentDebateSession, ExecutiveAgentRole } from '../types';

export const ExecutiveBoardroomPage: React.FC = () => {
  const sessions = useLiveQuery(() => db.agentDebates.orderBy('createdAt').reverse().toArray(), []);
  const agents = ExecutiveAgentService.getAllAgents();

  const [selectedTopic, setSelectedTopic] = useState<string>('Capital Allocation: Sales Team vs Engineering Bandwidth');
  const [customQuestion, setCustomQuestion] = useState<string>(
    'Should we invest $25k/mo into 2 senior engineers to accelerate RICE roadmap, or hire 2 Account Executives to monetize existing pipeline?'
  );
  const [selectedRoles, setSelectedRoles] = useState<ExecutiveAgentRole[]>(['ceo', 'cfo', 'cro', 'cpo', 'coo']);
  const [isDeliberating, setIsDeliberating] = useState<boolean>(false);
  const [currentSession, setCurrentSession] = useState<AgentDebateSession | null>(null);

  const STRATEGIC_DILEMMAS = [
    {
      topic: 'Capital Allocation: Sales Team vs Engineering Bandwidth',
      question: 'Should we invest $25k/mo into 2 senior engineers to accelerate RICE roadmap, or hire 2 Account Executives to monetize existing pipeline?',
    },
    {
      topic: 'Enterprise Pricing: Upfront Cash Discount vs Monthly Retainer',
      question: 'Should we offer a mandatory 20% discount on annual upfront prepayments to extend runway, or hold firm on full-price monthly subscriptions?',
    },
    {
      topic: 'Feature Scope Defense: Custom SLA for $30k Enterprise Prospect',
      question: 'An enterprise lead offers $30k ARR but demands custom multi-tenant isolation and 99.99% uptime SLA. Do we accept or reject to preserve roadmap velocity?',
    },
  ];

  const handleSelectDilemma = (dilemma: typeof STRATEGIC_DILEMMAS[0]) => {
    setSelectedTopic(dilemma.topic);
    setCustomQuestion(dilemma.question);
  };

  const handleToggleRole = (role: ExecutiveAgentRole) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length > 2) {
        setSelectedRoles(selectedRoles.filter(r => r !== role));
      }
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleConveneBoardroom = async () => {
    setIsDeliberating(true);
    try {
      const session = await ExecutiveAgentService.startBoardroomDeliberation(
        selectedTopic,
        customQuestion,
        selectedRoles
      );
      setCurrentSession(session);
    } finally {
      setIsDeliberating(false);
    }
  };

  const activeDisplaySession = currentSession || (sessions && sessions[0]) || null;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)',
              }}
            >
              <Users size={18} color="#fff" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              Executive Boardroom & Multi-Agent Deliberation
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#ec4899',
                backgroundColor: 'rgba(236, 72, 153, 0.12)',
                padding: '3px 9px',
                borderRadius: '999px',
                border: '1px solid rgba(236, 72, 153, 0.25)',
              }}
            >
              V2 C-SUITE
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Convene your virtual C-Suite. AI CEO, CFO, CRO, CPO, and COO debate trade-offs in real time to reach executive consensus.
          </p>
        </div>
      </div>

      {/* C-Suite Executive Persona Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '28px' }}>
        {agents.map(agent => {
          const isSelected = selectedRoles.includes(agent.role);
          return (
            <div
              key={agent.id}
              onClick={() => handleToggleRole(agent.role)}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: `1.5px solid ${isSelected ? agent.avatarColor : 'var(--border-subtle)'}`,
                borderRadius: '10px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: isSelected ? 1 : 0.45,
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: agent.avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px',
                    color: '#fff',
                  }}
                >
                  {agent.role.toUpperCase()}
                </div>
                <div>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                    {agent.name}
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{agent.title}</span>
                </div>
              </div>

              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: agent.avatarColor,
                  backgroundColor: `${agent.avatarColor}18`,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginBottom: '8px',
                }}
              >
                {agent.accentBadge}
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                {agent.focusAreas.slice(0, 2).join(' • ')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deliberation Launcher Section */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '22px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
            Pose Strategic Question to Boardroom
          </h3>

          {/* Quick Dilemmas */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {STRATEGIC_DILEMMAS.map((d, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectDilemma(d)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  border: '1px solid var(--border-faint)',
                  backgroundColor: selectedTopic === d.topic ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-surface)',
                  color: selectedTopic === d.topic ? '#a78bfa' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Dilemma #{idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            value={selectedTopic}
            onChange={e => setSelectedTopic(e.target.value)}
            placeholder="Dilemma Topic (e.g. Sales Hiring vs Engineering Acceleration)"
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '14px',
              fontWeight: 600,
            }}
          />

          <textarea
            rows={2}
            value={customQuestion}
            onChange={e => setCustomQuestion(e.target.value)}
            placeholder="Detailed context and tradeoff for the executive team to deliberate..."
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '13px',
              resize: 'vertical',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Participating: {selectedRoles.map(r => r.toUpperCase()).join(', ')}
            </span>

            <button
              onClick={handleConveneBoardroom}
              disabled={isDeliberating}
              style={{
                padding: '10px 22px',
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
              }}
            >
              <Sparkles size={16} />
              {isDeliberating ? 'Executives Deliberating...' : 'Convene Boardroom Debate'}
            </button>
          </div>
        </div>
      </div>

      {/* Boardroom Debate Results Canvas */}
      {activeDisplaySession && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '22px' }}>
          {/* Left Column: Debate Transcript */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ borderBottom: '1px solid var(--border-faint)', paddingBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase' }}>
                Deliberation Session
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 6px 0' }}>
                {activeDisplaySession.topic}
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
                "{activeDisplaySession.contextQuestion}"
              </p>
            </div>

            {/* Messages Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeDisplaySession.messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-faint)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: msg.avatarColor,
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {msg.role.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                        {msg.agentName}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        ({msg.role.toUpperCase()})
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor:
                          msg.stance === 'support'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : msg.stance === 'caution'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                        color:
                          msg.stance === 'support'
                            ? '#10b981'
                            : msg.stance === 'caution'
                            ? '#f59e0b'
                            : '#60a5fa',
                        textTransform: 'uppercase',
                      }}
                    >
                      {msg.stance}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    {msg.content}
                  </p>

                  {/* Stance arguments */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                    {msg.keyArguments.map((arg, i) => (
                      <div key={i} style={{ color: 'var(--text-main)', display: 'flex', gap: '6px' }}>
                        <span style={{ color: msg.avatarColor }}>•</span>
                        <span>{arg}</span>
                      </div>
                    ))}
                  </div>

                  {/* Proposed Action pill */}
                  <div
                    style={{
                      fontSize: '11.5px',
                      color: 'var(--text-dim)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      borderLeft: `3px solid ${msg.avatarColor}`,
                    }}
                  >
                    <strong>Action:</strong> {msg.proposedAction}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Unified Consensus & Action Plan */}
          {activeDisplaySession.consensus && (
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div style={{ borderBottom: '1px solid var(--border-faint)', paddingBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>
                    Executive Consensus Reached
                  </span>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      padding: '4px 10px',
                      borderRadius: '999px',
                    }}
                  >
                    {activeDisplaySession.consensus.alignmentScore}% Alignment
                  </div>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: '8px 0 6px 0' }}>
                  Unified Executive Resolution
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                  {activeDisplaySession.consensus.summary}
                </p>
              </div>

              {/* Unanimous Recommendations */}
              <div>
                <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px' }}>
                  UNANIMOUS RECOMMENDATIONS
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeDisplaySession.consensus.unanimousRecommendations.map((rec, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        fontSize: '12.5px',
                        color: 'var(--text-main)',
                      }}
                    >
                      <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flagged Risks */}
              <div>
                <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px' }}>
                  FLAGGED EXECUTIVE RISKS
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeDisplaySession.consensus.risksIdentified.map((risk, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        fontSize: '12px',
                        color: '#f59e0b',
                      }}
                    >
                      <AlertCircle size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Checklist */}
              <div>
                <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px' }}>
                  DELEGATED ACTION CHECKLIST
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeDisplaySession.consensus.actionChecklist.map((act, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-faint)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{act.taskTitle}</span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: `${EXECUTIVE_AGENTS[act.ownerRole].avatarColor}20`,
                          color: EXECUTIVE_AGENTS[act.ownerRole].avatarColor,
                        }}
                      >
                        {act.ownerRole.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
