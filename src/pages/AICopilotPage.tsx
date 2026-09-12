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
  Database,
  ArrowRight,
  Settings,
} from 'lucide-react';
import { db } from '../db';
import { SpotlightCard } from '../components/common/SpotlightCard';
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
              AI CEO Workspace
            </h2>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: 'rgba(0, 80, 255, 0.15)',
                color: 'var(--brand-accent)',
                fontWeight: 600,
              }}
            >
              Model: {defaultProvider?.model || 'Unconfigured'}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Autonomous AI CEO for natural language intelligence, strategic decision support, and verified actions over local company data.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => handleSend(FOUNDER_BRIEFING_PROMPT)}
            className="btn-primary"
          >
            <Sparkles size={15} /> Generate Executive Briefing
          </button>
          <button
            type="button"
            onClick={onNavigateToSettings}
            className="btn-secondary"
            title="Configure Provider Settings"
          >
            <Settings size={15} /> Providers
          </button>
        </div>
      </div>

      {/* 2-Pane Chat Workspace */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '16px',
          height: 'calc(100vh - 200px)',
          minHeight: '560px',
        }}
        className="ai-workspace-grid"
      >
        {/* Left Pane: Conversation Threads */}
        <SpotlightCard style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            onClick={handleCreateNewConversation}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Plus size={14} /> New Conversation
          </button>

          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '4px' }}>
            Past Sessions ({conversations.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1 }}>
            {conversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              const isThreadWorking = allActive.some((a) => a.conversationId === conv.id);

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected ? 'var(--primary-blue-surface)' : 'transparent',
                    color: isSelected ? 'var(--brand-accent)' : 'var(--text-muted)',
                    border: isSelected ? '1px solid var(--border-active)' : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: isSelected ? 600 : 500,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <MessageSquare size={14} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.title}
                    </span>
                    {isThreadWorking && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(0, 80, 255, 0.2)',
                          color: 'var(--brand-accent)',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        <Loader2 size={10} className="animate-spin" />
                        Working
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    style={{ color: 'var(--text-dim)', padding: '2px', marginLeft: '6px' }}
                    title="Delete thread"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Privacy Note */}
          <div
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-elevated)',
              fontSize: '11px',
              color: 'var(--text-dim)',
              lineHeight: 1.4,
            }}
          >
            🔒 Minimum necessary data sent. Secrets remain strictly in local browser storage.
          </div>
        </SpotlightCard>

        {/* Right Pane: Chat Window */}
        <SpotlightCard style={{ padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {messages.length === 0 ? (
              <div style={{ margin: 'auto 0', textAlign: 'center', padding: '32px 16px' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--primary-blue-surface)',
                    color: 'var(--brand-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Bot size={28} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Ask anything about your company
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 28px' }}>
                  I can analyze your monthly burn, calculate runway, retrieve customer accounts, triage open bugs, and create new execution tasks.
                </p>

                {/* Prompt Starters */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '10px',
                    maxWidth: '680px',
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
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-faint)',
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-accent)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-faint)')}
                    >
                      <span>{q}</span>
                      <ArrowRight size={14} color="var(--brand-accent)" />
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 0', color: 'var(--brand-accent)' }}>
                    <Loader2 size={18} className="animate-spin" />
                    <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{loadingStatus || 'Consulting AI provider...'}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Chat Input Bar */}
          <div
            style={{
              padding: '18px 24px',
              borderTop: '1px solid var(--border-faint)',
              backgroundColor: 'var(--bg-surface-elevated)',
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{ display: 'flex', gap: '12px' }}
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask about finances, customers, tasks, or propose write actions..."
                disabled={isLoading}
                className="input-field"
                style={{ flex: 1 }}
                autoFocus
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isLoading}
                className="btn-primary"
                style={{
                  padding: '8px 20px',
                  opacity: !prompt.trim() || isLoading ? 0.5 : 1,
                  cursor: !prompt.trim() || isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                <span>Send</span>
              </button>
            </form>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
};
