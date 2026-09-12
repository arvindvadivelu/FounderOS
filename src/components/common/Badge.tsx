import React from 'react';

export type BadgeVariant = 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'grey';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  className = '',
  icon,
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
};

export function getStatusBadgeVariant(status: string): BadgeVariant {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'won':
    case 'paid':
    case 'cleared':
    case 'done':
    case 'resolved':
    case 'released':
    case 'achieved':
    case 'on_track':
      return 'green';

    case 'in_progress':
    case 'negotiation':
    case 'sent':
    case 'investigating':
    case 'planned':
    case 'high':
      return 'blue';

    case 'prospect':
    case 'proposal':
    case 'demo':
    case 'planning':
    case 'medium':
    case 'at_risk':
      return 'amber';

    case 'lead':
    case 'idea':
    case 'backlog':
    case 'low':
      return 'purple';

    case 'churned':
    case 'lost':
    case 'overdue':
    case 'blocked':
    case 'critical':
    case 'behind':
    case 'cancelled':
      return 'red';

    default:
      return 'grey';
  }
}
