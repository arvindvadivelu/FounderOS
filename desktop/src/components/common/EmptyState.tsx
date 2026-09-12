import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  return (
    <div
      className="glass-card"
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {icon && (
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
            marginBottom: '16px',
          }}
        >
          {icon}
        </div>
      )}

      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', marginBottom: '20px', lineHeight: 1.5 }}>
        {description}
      </p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {secondaryActionText && onSecondaryAction && (
          <button type="button" onClick={onSecondaryAction} className="btn-secondary">
            {secondaryActionText}
          </button>
        )}
        {actionText && onAction && (
          <button type="button" onClick={onAction} className="btn-primary">
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};
