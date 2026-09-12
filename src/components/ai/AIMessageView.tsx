import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Database, Clock, Sparkles } from 'lucide-react';
import { ActionConfirmationCard } from './ActionConfirmationCard';
import { ClientIntakeFormCard } from './ClientIntakeFormCard';
import { CustomerRiskCard } from './CustomerRiskCard';
import { EmployeeOnboardingCard } from './EmployeeOnboardingCard';
import { FeatureSprintCard } from './FeatureSprintCard';
import { VendorExpenseCard } from './VendorExpenseCard';
import { InvestorUpdateCard } from './InvestorUpdateCard';
import { DealWinBackCard } from './DealWinBackCard';
import { InvoiceRecoveryCard } from './InvoiceRecoveryCard';
import { AccountExpansionCard } from './AccountExpansionCard';
import { ScopeDefenseCard } from './ScopeDefenseCard';
import { RevenueWarRoomCard } from './RevenueWarRoomCard';
import type { AIMessage } from '../../types';

interface AIMessageViewProps {
  message: AIMessage;
  onActionExecuted?: () => void;
}

export const AIMessageView: React.FC<AIMessageViewProps> = ({
  message,
  onActionExecuted,
}) => {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        gap: '14px',
        padding: '16px 0',
        borderBottom: '1px solid var(--border-faint)',
        alignItems: 'flex-start',
      }}
    >
      {/* Role Avatar */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isUser ? 'var(--brand-accent)' : 'var(--bg-surface-elevated)',
          color: isUser ? '#fff' : 'var(--brand-accent)',
          border: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Content Container */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>
            {isUser ? 'Founder' : 'Founder AI (AI CEO)'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Ground Truth Data Source Tags */}
        {!isUser && message.metadata?.dataSources && message.metadata.dataSources.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '10px',
              alignItems: 'center',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            <Database size={12} color="var(--brand-accent)" />
            <span>Ground Truth Data:</span>
            {message.metadata.dataSources.map((ds) => (
              <span
                key={ds}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {ds}()
              </span>
            ))}
          </div>
        )}

        {/* Markdown Content */}
        <div
          className="markdown-prose"
          style={{
            fontSize: '13.5px',
            lineHeight: 1.6,
            color: 'var(--text-main)',
            wordBreak: 'break-word',
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ children }) => (
                <div style={{ overflowX: 'auto', margin: '14px 0' }}>
                  <table className="data-table" style={{ width: '100%', border: '1px solid var(--border-faint)', borderRadius: '8px' }}>
                    {children}
                  </table>
                </div>
              ),
              a: ({ href, children }) => {
                const isSafe = href && /^(https?:|mailto:)/i.test(href);
                if (!isSafe) {
                  return <span style={{ color: 'var(--brand-accent)' }}>{children}</span>;
                }
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--brand-accent)', textDecoration: 'underline' }}
                  >
                    {children}
                  </a>
                );
              },
              p: ({ children }) => <p style={{ marginBottom: '10px' }}>{children}</p>,
              ul: ({ children }) => <ul style={{ paddingLeft: '20px', marginBottom: '10px' }}>{children}</ul>,
              ol: ({ children }) => <ol style={{ paddingLeft: '20px', marginBottom: '10px' }}>{children}</ol>,
              li: ({ children }) => <li style={{ marginBottom: '4px' }}>{children}</li>,
              h1: ({ children }) => <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '14px 0 8px' }}>{children}</h1>,
              h2: ({ children }) => <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '12px 0 6px' }}>{children}</h2>,
              h3: ({ children }) => <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '10px 0 4px', color: 'var(--brand-accent)' }}>{children}</h3>,
              code: ({ children, className }) => {
                const isBlock = className?.includes('language-');
                return isBlock ? (
                  <pre style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: '8px', overflowX: 'auto', margin: '10px 0' }}>
                    <code style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}>{children}</code>
                  </pre>
                ) : (
                  <code style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--brand-accent)' }}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Action Confirmation Cards & Instant Intake Form */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            {message.toolCalls.map((tc) => {
              if (tc.name === 'onboardClientProject') {
                return (
                  <ClientIntakeFormCard
                    key={tc.id}
                    messageId={message.id}
                    toolCall={tc}
                    initialData={tc.arguments}
                    onSuccess={onActionExecuted}
                  />
                );
              }
              if (tc.name === 'mitigateCustomerRisk') {
                return (
                  <CustomerRiskCard
                    key={tc.id}
                    messageId={message.id}
                    toolCall={tc}
                    initialData={tc.arguments}
                    onSuccess={onActionExecuted}
                  />
                );
              }
              if (tc.name === 'onboardEmployee') {
                return (
                  <EmployeeOnboardingCard
                    key={tc.id}
                    messageId={message.id}
                    toolCall={tc}
                    initialData={tc.arguments}
                    onSuccess={onActionExecuted}
                  />
                );
              }
              if (tc.name === 'launchFeatureSprint') {
                return (
                  <FeatureSprintCard
                    key={tc.id}
                    messageId={message.id}
                    toolCall={tc}
                    initialData={tc.arguments}
                    onSuccess={onActionExecuted}
                  />
                );
              }
              if (tc.name === 'auditVendorExpense') {
                return (
                  <VendorExpenseCard
                    key={tc.id}
                    messageId={message.id}
                    toolCall={tc}
                    initialData={tc.arguments}
                    onSuccess={onActionExecuted}
                  />
                );
              }
              if (tc.name === 'generateInvestorReport') {
                return (
                  <InvestorUpdateCard
                    key={tc.id}
                    messageId={message.id}
                    toolCall={tc}
                    initialData={tc.arguments}
                    onSuccess={onActionExecuted}
                  />
                );
              }
              if (tc.name === 'reengageStalledDeals') {
                return (
                  <DealWinBackCard
                    key={tc.id}
                    messageId={message.id}
                    toolCall={tc}
                    initialData={tc.arguments}
                    onSuccess={onActionExecuted}
                  />
                );
              }
              if (tc.name === 'recoverOverdueInvoices') {
                return (
                  <InvoiceRecoveryCard
                    key={tc.id}
                    messageId={message.id}
                    toolCall={tc}
                    initialData={tc.arguments}
                    onSuccess={onActionExecuted}
                  />
                );
              }
              if (tc.name === 'launchAccountExpansion') {
                return (
                  <AccountExpansionCard
                    key={tc.id}
                    messageId={message.id}
                    toolCall={tc}
                    initialData={tc.arguments}
                    onSuccess={onActionExecuted}
                  />
                );
              }
              if (tc.name === 'createScopeChangeOrder') {
                return (
                  <ScopeDefenseCard
                    key={tc.id}
                    messageId={message.id}
                    toolCall={tc}
                    initialData={tc.arguments}
                    onSuccess={onActionExecuted}
                  />
                );
              }
              if (tc.name === 'runRevenueWarRoom') {
                return (
                  <RevenueWarRoomCard
                    key={tc.id}
                    messageId={message.id}
                    toolCall={tc}
                    initialData={tc.arguments}
                    onSuccess={onActionExecuted}
                  />
                );
              }
              return (
                <ActionConfirmationCard
                  key={tc.id}
                  messageId={message.id}
                  toolCall={tc}
                  onExecuted={onActionExecuted}
                />
              );
            })}
          </div>
        )}

        {/* Fallback inline intake card if message content includes [CLIENT_INTAKE_FORM] marker without toolCall */}
        {message.content.includes('[CLIENT_INTAKE_FORM]') && (!message.toolCalls || !message.toolCalls.some((tc) => tc.name === 'onboardClientProject')) && (
          <ClientIntakeFormCard
            initialData={(message.metadata as any)?.intakeData}
            onSuccess={onActionExecuted}
          />
        )}

        {/* Metadata Footer */}
        {message.metadata && (message.metadata.durationMs || message.metadata.usage) && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              fontSize: '11px',
              color: 'var(--text-dim)',
              marginTop: '10px',
              alignItems: 'center',
            }}
          >
            {message.metadata.durationMs && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} /> {message.metadata.durationMs}ms
              </span>
            )}
            {message.metadata.usage?.totalTokens && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={11} /> {message.metadata.usage.totalTokens} tokens
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
