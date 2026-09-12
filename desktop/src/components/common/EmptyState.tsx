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
        borderRadius: '24px',
      }}
    >
      {icon && (
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 80, 255, 0.14)',
            color: 'var(--brand-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            border: '1px solid rgba(0, 80, 255, 0.3)',
            boxShadow: '0 0 16px rgba(0, 80, 255, 0.25)',
          }}
        >
          {icon}
        </div>
      )}

      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', letterSpacing: '-0.03em' }}>
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
