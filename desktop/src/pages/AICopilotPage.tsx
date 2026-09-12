import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Bot,
  MessageSquare,
  Loader2,
  ArrowRight,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { db } from '../db';
import { AIMessageView } from '../components/ai/AIMessageView';
import { aiChatService, useAIChatState } from '../ai/aiChatService';
import {
  createConversation,
  deleteConversation,
  getMessagesByConversation,
} from '../db/services/aiStorageService';
import { FOUNDER_BRIEFING_PROMPT } from '../ai/prompts';
import type { AIConversation, AIMessage } from '../types';

interface AICopilotPageProps {
  onNavigateToSettings: () => void;
  initialAction?: string;
}

export const AICopilotPage: React.FC<AICopilotPageProps> = ({ onNavigateToSettings, initialAction }) => {
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitializingRef = useRef(false);
  const briefingExecutedRef = useRef(false);

  // Background execution state for this conversation and globally
  const { isActive: isConvActive, status: liveStatus, allActive } = useAIChatState(selectedConvId);
  const isLoading = isConvActive;
  const loadingStatus = liveStatus || 'Connecting to AI CEO...';

  // Live Query for messages in active conversation - auto-updates across background writes
  const messages = useLiveQuery(
    () => (selectedConvId ? getMessagesByConversation(selectedConvId) : []),
    [selectedConvId]
  ) || [];

  // Live Queries for conversations and providers
  const conversations = useLiveQuery(async () => {
    const list = await db.aiConversations.toArray();
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, []) || [];

  const defaultProvider = useLiveQuery(async () => {
    const providers = await db.aiProviders.toArray();
    return providers.find((p) => p.isDefault) || providers[0];
  }, []);

  // Initialize or select active single conversation
  useEffect(() => {
    async function init() {
      if (isInitializingRef.current) return;
      isInitializingRef.current = true;

      try {
        const allConvs = await db.aiConversations.toArray();
        let targetId = '';

        if (allConvs.length > 0) {
          allConvs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          targetId = allConvs[0].id;
        } else {
          const newConv = await createConversation('Founder Copilot Session');
          targetId = newConv.id;
        }

        setSelectedConvId(targetId);

        // If briefing action requested, execute automatically on this conversation
        if (initialAction === 'briefing' && !briefingExecutedRef.current) {
          briefingExecutedRef.current = true;
          window.history.replaceState(null, '', '#/ai');
          aiChatService.startConversationTurn({
            conversationId: targetId,
            userPrompt: FOUNDER_BRIEFING_PROMPT,
          });
        }
      } catch (err) {
        console.error('Failed to initialize AI conversation:', err);
      }
    }

    init();
  }, [initialAction]);

  // Scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  const executeTurn = async (convId: string, textToSend: string, currentHistory?: AIMessage[]) => {
    if (!textToSend.trim() || !convId) return;

    try {
      await aiChatService.startConversationTurn({
        conversationId: convId,
        userPrompt: textToSend,
        history: currentHistory,
      });
    } catch (err: any) {
      console.error('Chat execution failed:', err);
    }
  };

  const handleCreateNewConversation = async () => {
    const newConv = await createConversation(`Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    setSelectedConvId(newConv.id);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      await deleteConversation(id);
      if (selectedConvId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        if (remaining.length > 0) {
          setSelectedConvId(remaining[0].id);
        } else {
          const fresh = await createConversation('Founder Copilot Session');
          setSelectedConvId(fresh.id);
        }
      }
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() || isLoading || !selectedConvId) return;

    setPrompt('');
    await executeTurn(selectedConvId, textToSend, messages);
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* =========================================================================
          1. EDITORIAL PAGE HEADER (DESIGN.md Typography & 50px Pill Actions)
         ========================================================================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Tag Chip (10px radius) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '10px', // --radius-small: 10px
              backgroundColor: 'rgba(0, 80, 255, 0.12)',
              border: '1px solid rgba(0, 80, 255, 0.3)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.04em',
              width: 'fit-content',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#0050FF',
                boxShadow: '0 0 8px #0050FF',
              }}
            />
            AUTONOMOUS AI CEO • STRATEGIC ADVISORY ENGINE
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1
              style={{
                fontSize: 'clamp(24px, 3vw, 32px)',
                fontWeight: 700,
                color: '#f8fafc',
                letterSpacing: '-0.04em',
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              AI CEO Workspace
            </h1>

            {/* Model Provider Pill Badge (10px radius) */}
            <span
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '10px',
                backgroundColor: 'rgba(0, 80, 255, 0.15)',
                color: '#38bdf8',
                fontWeight: 600,
                border: '1px solid rgba(0, 80, 255, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Zap size={11} color="#0050FF" />
              <span>Model: {defaultProvider?.model || 'Unconfigured'}</span>
            </span>
          </div>

          <p
            style={{
              fontSize: '14px',
              color: '#94a3b8',
              margin: 0,
              maxWidth: '740px',
              lineHeight: 1.5,
            }}
          >
            Autonomous strategic intelligence, automated burn & runway stress-testing, and verified execution actions over your local company data.
          </p>
        </div>

        {/* 50px Pill Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Generate Briefing Button with Embedded Circular Dot */}
          <button
            type="button"
            onClick={() => handleSend(FOUNDER_BRIEFING_PROMPT)}
            style={{
              backgroundColor: '#0050FF',
              color: '#ffffff',
              border: '1px solid #1a62ff',
              borderRadius: '50px', // --radius-buttons: 50px
              padding: '12px 20px',
              fontSize: '13.5px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0, 80, 255, 0.35)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a62ff';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 0 26px rgba(0, 80, 255, 0.55)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0050FF';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 80, 255, 0.35)';
            }}
          >
            <span>Executive Briefing</span>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                color: '#0050FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={12} strokeWidth={2.5} />
            </div>
          </button>

          {/* Providers Settings Button (50px Pill) */}
          <button
            type="button"
            onClick={onNavigateToSettings}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '50px',
              padding: '12px 18px',
              fontSize: '13.5px',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
            title="Configure Provider Settings"
          >
            <Settings size={14} color="#94a3b8" />
            <span>Providers</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. TWO-PANE CHAT WORKSPACE (28px Rounded Glass Containers)
         ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '270px 1fr',
          gap: '20px',
          height: 'calc(100vh - 210px)',
          minHeight: '600px',
        }}
        className="ai-workspace-grid"
      >
        {/* =======================================================================
            LEFT PANE: SESSIONS & THREADS
           ======================================================================= */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)', // --bg-card
            backdropFilter: 'blur(16px)',
            borderRadius: '28px', // --radius-cards
            padding: '20px 16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* New Conversation Button (50px Pill) */}
          <button
            type="button"
            onClick={handleCreateNewConversation}
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: '50px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 80, 255, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.4)';
              e.currentTarget.style.color = '#38bdf8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = '#f8fafc';
            }}
          >
            <Plus size={14} />
            <span>New Session</span>
          </button>

          {/* Sessions Header Tag */}
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1px',
              color: '#64748b',
              textTransform: 'uppercase',
              paddingLeft: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>SESSIONS</span>
            <span
              style={{
                fontSize: '10.5px',
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#94a3b8',
              }}
            >
              {conversations.length}
            </span>
          </div>

          {/* Sessions List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              overflowY: 'auto',
              flex: 1,
              paddingRight: '2px',
            }}
          >
            {conversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              const isThreadWorking = allActive.some((a) => a.conversationId === conv.id);

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '16px',
                    backgroundColor: isSelected ? 'rgba(0, 80, 255, 0.14)' : 'transparent',
                    color: isSelected ? '#38bdf8' : '#94a3b8',
                    border: isSelected ? '1px solid rgba(0, 80, 255, 0.45)' : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: isSelected ? 600 : 500,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <MessageSquare size={13} style={{ flexShrink: 0, color: isSelected ? '#0050FF' : '#64748b' }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.title}
                    </span>
                    {isThreadWorking && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(0, 80, 255, 0.25)',
                          color: '#38bdf8',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        <Loader2 size={10} className="animate-spin" />
                        Live
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    style={{
                      color: '#64748b',
                      padding: '4px',
                      marginLeft: '6px',
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.15s ease',
                    }}
                    title="Delete thread"
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Privacy Note Badge */}
          <div
            style={{
              padding: '12px',
              borderRadius: '16px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '11px',
              color: '#94a3b8',
              lineHeight: 1.4,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <ShieldCheck size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>Encrypted local runtime. Sovereign API keys stored in browser IndexedDB.</span>
          </div>
        </div>

        {/* =======================================================================
            RIGHT PANE: CHAT WORKSPACE & STREAM
           ======================================================================= */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(16px)',
            borderRadius: '28px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
          }}
        >
          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {messages.length === 0 ? (
              <div style={{ margin: 'auto 0', textAlign: 'center', padding: '32px 16px' }}>
                {/* Circular Bot Icon Container (DESIGN.md Circular Emblem) */}
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 80, 255, 0.14)',
                    color: '#38bdf8',
                    border: '2px solid #0050FF',
                    boxShadow: '0 0 24px rgba(0, 80, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 18px',
                  }}
                >
                  <Bot size={30} />
                </div>

                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#f8fafc',
                    marginBottom: '8px',
                    letterSpacing: '-0.03em',
                  }}
                >
                  Ask anything about your company
                </h3>

                <p
                  style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    maxWidth: '500px',
                    margin: '0 auto 32px',
                    lineHeight: 1.5,
                  }}
                >
                  I can analyze your monthly burn, project runway scenarios, evaluate customer cohort retention, triage bugs, and execute local database tasks.
                </p>

                {/* Prompt Starters (Rounded Cards with Circular Dots) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '12px',
                    maxWidth: '720px',
                    margin: '0 auto',
                    textAlign: 'left',
                  }}
                >
                  {[
                    'How is my company doing?',
                    'What are my biggest risks?',
                    'What should I focus on today?',
                    'How much runway do I have?',
                    'Which deals need attention?',
                    'Who are my highest-risk customers?',
                    'What tasks are overdue?',
                    'What should I build next?',
                    'Create a task to follow up with Acme Corp tomorrow',
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSend(q)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '18px', // --radius-lg
                        backgroundColor: 'rgba(30, 41, 59, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: '13px',
                        color: '#f8fafc',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(0, 80, 255, 0.5)';
                        e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.75)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.45)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span style={{ lineHeight: 1.4 }}>{q}</span>
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(0, 80, 255, 0.2)',
                          color: '#38bdf8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <ArrowRight size={11} strokeWidth={2.5} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m) => (
                  <AIMessageView
                    key={m.id}
                    message={m}
                    onActionExecuted={() => {
                      // useLiveQuery automatically updates messages reactively from IndexedDB
                    }}
                  />
                ))}

                {isLoading && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 18px',
                      borderRadius: '50px',
                      backgroundColor: 'rgba(0, 80, 255, 0.12)',
                      border: '1px solid rgba(0, 80, 255, 0.35)',
                      color: '#38bdf8',
                      margin: '16px 0',
                      width: 'fit-content',
                    }}
                  >
                    <Loader2 size={16} className="animate-spin" color="#0050FF" />
                    <span style={{ fontSize: '13.5px', fontWeight: 600 }}>
                      {loadingStatus || 'Consulting AI CEO engine...'}
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Chat Input Bar (50px Pill Form Geometry) */}
          <div
            style={{
              padding: '18px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(11, 15, 25, 0.9)',
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '50px', // --radius-full
                padding: '6px 8px 6px 20px',
                border: '1.5px solid rgba(255, 255, 255, 0.1)',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={() => {
                // Focus styling
              }}
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask about burn, cash runway, customer churn, or propose strategic actions..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                }}
                autoFocus
              />

              {/* 50px Pill Send Button */}
              <button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                style={{
                  backgroundColor: !prompt.trim() || isLoading ? 'rgba(255, 255, 255, 0.08)' : '#0050FF',
                  color: !prompt.trim() || isLoading ? '#64748b' : '#ffffff',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '10px 18px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: !prompt.trim() || isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: !prompt.trim() || isLoading ? 'none' : '0 0 16px rgba(0, 80, 255, 0.4)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Send</span>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: !prompt.trim() || isLoading ? 'rgba(255, 255, 255, 0.1)' : '#ffffff',
                    color: !prompt.trim() || isLoading ? '#64748b' : '#0050FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isLoading ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} strokeWidth={2.5} />}
                </div>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Embedded CSS for Workspace Grid Responsiveness */}
      <style>{`
        @media (max-width: 960px) {
          .ai-workspace-grid {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
        }
      `}</style>
    </div>
  );
};
