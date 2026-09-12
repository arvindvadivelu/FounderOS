import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Bot, Send, X, Sparkles, Loader2, Maximize2, Trash2, ArrowRight } from 'lucide-react';
import { db } from '../../db';
import { AIMessageView } from './AIMessageView';
import { aiChatService, useAIChatState } from '../../ai/aiChatService';
import { createConversation, getMessagesByConversation } from '../../db/services/aiStorageService';
import { FOUNDER_BRIEFING_PROMPT } from '../../ai/prompts';
import type { AIMessage } from '../../types';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToFullAi?: () => void;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToFullAi,
}) => {
  const [conversationId, setConversationId] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitializingRef = useRef<boolean>(false);

  // Background execution state for this drawer conversation
  const { isActive: isConvActive, status: liveStatus } = useAIChatState(conversationId);
  const isLoading = isConvActive;
  const loadingStatus = liveStatus || 'Connecting to AI...';

  // Live Query for messages - auto-updates even if drawer is closed and reopened
  const messages = useLiveQuery(
    () => (conversationId ? getMessagesByConversation(conversationId) : []),
    [conversationId]
  ) || [];

  // Initialize or load existing conversation
  useEffect(() => {
    async function init() {
      if (isInitializingRef.current) return;
      isInitializingRef.current = true;
      try {
        const allConvs = await db.aiConversations.toArray();
        if (allConvs.length > 0) {
          allConvs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          setConversationId(allConvs[0].id);
        } else {
          const conv = await createConversation('Founder Copilot Session');
          setConversationId(conv.id);
        }
      } catch (err) {
        console.error('Failed to init copilot drawer chat:', err);
      } finally {
        isInitializingRef.current = false;
      }
    }
    if (isOpen && !conversationId) {
      init();
    }
  }, [isOpen, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || prompt;
    if (!textToSend.trim() || isLoading || !conversationId) return;

    setPrompt('');
    try {
      await aiChatService.startConversationTurn({
        conversationId,
        userPrompt: textToSend,
        history: messages,
      });
    } catch (err: any) {
      console.error('Chat error:', err);
    }
  };

  const handleClear = async () => {
    const conv = await createConversation('Copilot Quick Chat');
    setConversationId(conv.id);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 2500,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 2501,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-faint)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary-blue-surface)',
                color: 'var(--brand-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                FounderOS AI CEO
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Autonomous intelligence over your local company database
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onNavigateToFullAi && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToFullAi();
                }}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '12px' }}
                title="Open Fullscreen Workspace"
              >
                <Maximize2 size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              title="Clear & New Chat"
            >
              <Trash2 size={13} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px',
                borderRadius: '8px',
                color: 'var(--text-muted)',
              }}
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {messages.length === 0 ? (
            <div style={{ margin: 'auto 0', textAlign: 'center', padding: '20px 10px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--primary-blue-surface)',
                  color: 'var(--brand-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Sparkles size={24} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Ask your company anything
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '360px', margin: '0 auto 24px' }}>
                I have read/write access to your local financial records, customers, sales pipeline, tasks, bugs, and strategy notes.
              </p>

              {/* Quick Prompts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                  Recommended Questions
                </span>
                {[
                  'What should I focus on today?',
                  'How much did I spend this month & what is my runway?',
                  'Show my active customers and revenue breakdown',
                  'What deals are close to closing?',
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSend(q)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-faint)',
                      fontSize: '12.5px',
                      color: 'var(--text-main)',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--brand-accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-faint)')}
                  >
                    <span>{q}</span>
                    <ArrowRight size={13} color="var(--brand-accent)" />
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handleSend(FOUNDER_BRIEFING_PROMPT)}
                  className="btn-primary"
                  style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}
                >
                  <Sparkles size={14} /> Generate Executive Founder Briefing
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <AIMessageView
                  key={m.id}
                  message={m}
                  onActionExecuted={() => {
                    // useLiveQuery automatically updates messages reactively
                  }}
                />
              ))}

              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 0', color: 'var(--brand-accent)' }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{loadingStatus || 'Thinking...'}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-faint)',
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{ display: 'flex', gap: '10px' }}
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask about finances, tasks, customers, or create items..."
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
                opacity: !prompt.trim() || isLoading ? 0.5 : 1,
                cursor: !prompt.trim() || isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Shortcut: <kbd style={{ padding: '1px 4px', background: 'var(--bg-surface)', borderRadius: '4px' }}>Ctrl+/</kbd>
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              🔒 Local-first IndexedDB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
