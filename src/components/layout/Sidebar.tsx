import React from 'react';
import {
  LayoutDashboard,
  DollarSign,
  Users,
  TrendingUp,
  Briefcase,
  FolderKanban,
  Bug,
  ListTodo,
  CheckSquare,
  Target,
  Sparkles,
  FileText,
  Cpu,
  Settings,
  X,
  UserCheck,
  Building2,
  Landmark,
  Scale,
  UploadCloud,
  Activity,
  Plug,
  Sun,
  Bot,
  Zap,
  Sliders,
} from 'lucide-react';
import type { Company } from '../../types';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  company: Company | null;
  taskCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  company,
  taskCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const sections: NavSection[] = [
    {
      title: 'COMMAND CENTER',
      items: [
        { id: '/', label: 'Overview', icon: <LayoutDashboard size={16} /> },
        { id: '/morning-intelligence', label: 'Morning Intelligence', icon: <Sun size={16} color="#f59e0b" /> },
        { id: '/kpis', label: 'KPI Center', icon: <TrendingUp size={16} /> },
        { id: '/ai', label: 'AI CEO', icon: <Sparkles size={16} color="var(--brand-accent)" /> },
        { id: '/notes', label: 'Notes', icon: <FileText size={16} color="#38bdf8" /> },
      ],
    },
    {
      title: 'FOUNDEROS V2',
      items: [
        { id: '/workflows', label: 'Automated Workflows', icon: <Zap size={16} color="#38bdf8" /> },
        { id: '/boardroom', label: 'Executive Boardroom', icon: <Users size={16} color="#a78bfa" />, badge: 'C-Suite' },
        { id: '/forecasting', label: 'Financial Forecasting', icon: <TrendingUp size={16} color="#34d399" /> },
        { id: '/customer-intelligence', label: 'Customer Intelligence', icon: <Target size={16} color="#0ea5e9" /> },
        { id: '/product-intelligence', label: 'Product Intelligence', icon: <FolderKanban size={16} color="#f59e0b" /> },
        { id: '/autopilot', label: 'Autonomous Operations', icon: <Cpu size={16} color="#10b981" />, badge: 'Autopilot' },
      ],
    },
    {
      title: 'BUSINESS & REVENUE',
      items: [
        { id: '/finance', label: 'Finance', icon: <DollarSign size={16} /> },
        { id: '/sales', label: 'Sales', icon: <Briefcase size={16} /> },
        { id: '/customers', label: 'Customers', icon: <Users size={16} /> },
      ],
    },
    {
      title: 'EXECUTION',
      items: [
        { id: '/tasks', label: 'Tasks', icon: <CheckSquare size={16} />, badge: taskCount },
        { id: '/projects', label: 'Projects', icon: <ListTodo size={16} /> },
        { id: '/goals', label: 'Goals', icon: <Target size={16} /> },
      ],
    },
    {
      title: 'PRODUCT & TECHNOLOGY',
      items: [
        { id: '/product', label: 'Product', icon: <FolderKanban size={16} /> },
        { id: '/engineering', label: 'Engineering', icon: <Bug size={16} /> },
      ],
    },
    {
      title: 'MANAGEMENT & ASSETS',
      items: [
        { id: '/management/cash', label: 'Cash & Treasury', icon: <Landmark size={16} /> },
        { id: '/management/balance-sheet', label: 'Assets & Liabilities', icon: <Scale size={16} /> },
        { id: '/management/employees', label: 'Employees', icon: <UserCheck size={16} /> },
        { id: '/management/departments', label: 'Departments', icon: <Building2 size={16} /> },
        { id: '/management/uploads', label: 'Corporate Vault', icon: <UploadCloud size={16} /> },
      ],
    },
    {
      title: 'SYSTEM & DATA',
      items: [
        { id: '/integrations', label: 'Integrations', icon: <Plug size={16} /> },
        { id: '/health', label: 'Data Health', icon: <Activity size={16} /> },
        { id: '/settings?tab=providers', label: 'AI Providers', icon: <Cpu size={16} /> },
        { id: '/settings', label: 'Settings', icon: <Settings size={16} /> },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1050,
          }}
          onClick={onCloseMobile}
        />
      )}

      <aside
        style={{
          width: '260px',
          height: '100vh',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-faint)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1100,
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isOpenMobile ? 'translateX(0)' : undefined,
        }}
        className={`sidebar ${isOpenMobile ? 'mobile-open' : ''}`}
      >
        {/* Brand Logo Header */}
        <div
          style={{
            padding: '22px 20px 18px 20px',
            borderBottom: '1px solid var(--border-faint)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            onClick={() => onNavigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0, 80, 255, 0.45)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                backgroundColor: '#030712',
                flexShrink: 0,
              }}
            >
              <img
                src="/founderos-logo.jpg"
                alt="FounderOS"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  color: 'var(--text-main)',
                  lineHeight: 1.1,
                }}
              >
                FounderOS
              </h2>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.8px' }}>
                SINGLE-USER EDITION
              </span>
            </div>
          </div>

          {isOpenMobile && (
            <button
              onClick={onCloseMobile}
              style={{ padding: '4px', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {sections.map((sec) => (
            <div key={sec.title}>
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  letterSpacing: '1.2px',
                  paddingLeft: '12px',
                  marginBottom: '6px',
                }}
              >
                {sec.title}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {sec.items.map((item) => {
                  const isActive = currentRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onNavigate(item.id);
                        onCloseMobile?.();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isActive ? 'var(--primary-blue-surface)' : 'transparent',
                        color: isActive ? 'var(--brand-accent)' : 'var(--text-muted)',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '13px',
                        transition: 'all var(--transition-fast)',
                        border: isActive ? '1px solid var(--border-active)' : '1px solid transparent',
                        textAlign: 'left',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
                          e.currentTarget.style.color = 'var(--text-main)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--text-muted)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: isActive ? 'var(--brand-accent)' : 'inherit', display: 'flex' }}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && Number(item.badge) > 0 && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '999px',
                            backgroundColor: isActive ? 'var(--brand-accent)' : 'var(--bg-surface-elevated)',
                            color: isActive ? '#ffffff' : 'var(--text-dim)',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Company Pill */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--border-faint)',
            backgroundColor: 'var(--bg-surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--text-main)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {company?.name || 'Solvst AI'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              {company?.currency || 'USD'} • V1.0.0
            </div>
          </div>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
            }}
            title="Local Database Active"
          />
        </div>
      </aside>
    </>
  );
};
