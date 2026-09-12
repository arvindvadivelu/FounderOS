import React from 'react';
import { SpotlightCard } from './SpotlightCard';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  subtitle,
  icon,
  onClick,
}) => {
  return (
    <SpotlightCard
      onClick={onClick}
      className={`p-5 transition-all ${onClick ? 'cursor-pointer hover:border-blue-500/40' : ''}`}
      style={{
        padding: '22px 24px',
        borderRadius: '28px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <span
          style={{
            fontSize: '11.5px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            color: 'var(--text-muted)',
          }}
        >
          {title}
        </span>
        {icon && (
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--primary-blue-surface)',
              color: 'var(--brand-accent)',
              border: '1px solid var(--border-subtle)',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
        <h3
          style={{
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            color: 'var(--text-main)',
            lineHeight: 1.15,
          }}
        >
          {value}
        </h3>
        {change && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '10px', // MindMarket 10px tag chip
              backgroundColor:
                changeType === 'positive'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : changeType === 'negative'
                  ? 'rgba(244, 63, 94, 0.15)'
                  : 'rgba(148, 163, 184, 0.15)',
              color:
                changeType === 'positive'
                  ? '#34d399'
                  : changeType === 'negative'
                  ? '#fb7185'
                  : 'var(--text-muted)',
            }}
          >
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <p
          style={{
            fontSize: '12.5px',
            color: 'var(--text-dim)',
            marginTop: '2px',
          }}
        >
          {subtitle}
        </p>
      )}
    </SpotlightCard>
  );
};
