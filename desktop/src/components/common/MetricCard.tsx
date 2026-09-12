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
        padding: '20px 22px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span
          style={{
            fontSize: '12px',
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
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--primary-blue-surface)',
              color: 'var(--brand-accent)',
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
        <h3
          style={{
            fontSize: '26px',
            fontWeight: 700,
            letterSpacing: '-0.8px',
            color: 'var(--text-main)',
            lineHeight: 1.2,
          }}
        >
          {value}
        </h3>
        {change && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '999px',
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
