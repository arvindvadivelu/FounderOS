import React from 'react';
import {
  Menu,
  Search,
  Sparkles,
  Sun,
  Moon,
  Database,
  Wifi,
  FileCheck,
  Loader2,
  MonitorDown,
  Check,
} from 'lucide-react';
import { useAIChatState } from '../../ai/aiChatService';
import type { Company } from '../../types';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  onOpenCommandPalette: () => void;
  onOpenAiCopilot: () => void;
  onNavigateToAi?: () => void;
  onGenerateBriefing: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  company: Company | null;
  currentRoute: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileMenu,
  onOpenCommandPalette,
  onOpenAiCopilot,
  onNavigateToAi,
  onGenerateBriefing,
  theme,
  onToggleTheme,
  currentRoute,
}) => {
  const { anyActive, status: aiStatus } = useAIChatState();
  const isDesktop = typeof window !== 'undefined' && Boolean((window as any).desktopBridge);
  const [downloadStatus, setDownloadStatus] = React.useState<'idle' | 'downloading' | 'done'>('idle');

  const handleDownloadDesktop = (e: React.MouseEvent) => {
    e.preventDefault();
    setDownloadStatus('downloading');

    const link = document.createElement('a');
    link.href = '/downloads/FounderOS-Setup.exe';
    link.download = 'FounderOS-Setup.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadStatus('done');
      setTimeout(() => setDownloadStatus('idle'), 3500);
    }, 1200);
  };
  const getPageTitle = (route: string) => {
    switch (route) {
      case '/': return 'Command Center';
      case '/kpis': return 'Executive KPI Center';
      case '/management/employees': return 'Employee Directory & Payroll';
      case '/management/departments': return 'Departments & Budgets';
      case '/management/cash': return 'Cash & Treasury Management';
      case '/management/balance-sheet': return 'Balance Sheet (Assets & Liabilities)';
      case '/management/uploads': return 'Corporate Vault & Uploads';
      case '/finance': return 'Finance & Runway';
      case '/customers': return 'Customers & CRM';
      case '/sales': return 'Sales Pipeline';
      case '/product': return 'Product Backlog';
      case '/engineering': return 'Engineering & Bugs';
      case '/projects': return 'Strategic Projects';
      case '/tasks': return 'Tasks & Execution';
      case '/goals': return 'Goals & OKRs';
      case '/notes': return 'Knowledge & Notes';
      case '/morning-intelligence': return 'Morning Intelligence';
      case '/ai': return 'AI CEO';
      case '/integrations': return 'External Integrations';
      case '/health': return 'Data Health';
      case '/settings':
      case '/settings?tab=providers': return 'Settings & Providers';
      default: return 'Command Center';
    }
  };

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-faint)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* Left Area: Hamburger + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          type="button"
          onClick={onOpenMobileMenu}
          style={{
            display: 'none',
            padding: '8px',
            color: 'var(--text-main)',
          }}
          className="mobile-menu-btn"
          aria-label="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1
            style={{
              fontSize: '17px',
              fontWeight: 700,
              letterSpacing: '-0.3px',
              color: 'var(--text-main)',
            }}
          >
            {getPageTitle(currentRoute)}
          </h1>
        </div>
      </div>

      {/* Right Area: Search, Offline Status, AI Triggers, Theme */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Offline-first status indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '999px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}
          className="offline-pill"
          title="All company data is persisted locally in browser IndexedDB"
        >
          <Database size={12} />
          <span>Local Data: Available Offline</span>
        </div>

        {/* AI CEO Background Execution Indicator */}
        {anyActive && (
          <button
            type="button"
            onClick={() => {
              if (onNavigateToAi) {
                onNavigateToAi();
              } else {
                onOpenAiCopilot();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '999px',
              backgroundColor: 'rgba(0, 80, 255, 0.16)',
              color: 'var(--brand-accent)',
              border: '1px solid rgba(0, 80, 255, 0.45)',
              cursor: 'pointer',
              boxShadow: '0 0 14px rgba(0, 80, 255, 0.3)',
              transition: 'all 0.2s ease',
            }}
            title="AI CEO is working in background. Click to view."
          >
            <Loader2 size={12} className="animate-spin" />
            <span>
              ⚡ AI CEO: {aiStatus ? (aiStatus.length > 28 ? aiStatus.slice(0, 28) + '...' : aiStatus) : 'Working...'}
            </span>
            <span style={{ textDecoration: 'underline', opacity: 0.9, fontSize: '10px' }}>
              View
            </span>
          </button>
        )}

        {/* Command Palette Trigger Button */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="btn-secondary"
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          title="Search & Commands (Ctrl+K)"
        >
          <Search size={14} color="var(--brand-accent)" />
          <span className="search-label">Search...</span>
          <kbd
            style={{
              padding: '1px 5px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-faint)',
              fontSize: '10px',
              color: 'var(--text-dim)',
            }}
          >
            Ctrl K
          </kbd>
        </button>

        {/* Generate Founder Briefing CTA */}
        <button
          type="button"
          onClick={onGenerateBriefing}
          className="btn-secondary"
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          title="Generate Today's Founder Briefing"
        >
          <FileCheck size={14} color="var(--brand-accent)" />
          <span className="briefing-label">Daily Briefing</span>
        </button>

        {/* Download Desktop App CTA */}
        {!isDesktop && (
          <button
            type="button"
            onClick={handleDownloadDesktop}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: downloadStatus !== 'idle' ? 'var(--brand-accent)' : undefined,
              backgroundColor: downloadStatus !== 'idle' ? 'rgba(0, 80, 255, 0.08)' : undefined,
              transition: 'all 0.2s ease',
            }}
            title="Download FounderOS Native Desktop App for Windows (.exe setup)"
          >
            {downloadStatus === 'downloading' ? (
              <Loader2 size={14} className="animate-spin" color="var(--brand-accent)" />
            ) : downloadStatus === 'done' ? (
              <Check size={14} color="#10b981" />
            ) : (
              <MonitorDown size={14} color="var(--brand-accent)" />
            )}
            <span className="desktop-download-label">
              {downloadStatus === 'downloading'
                ? 'Downloading...'
                : downloadStatus === 'done'
                ? 'Setup Ready!'
                : 'Download Desktop'}
            </span>
            <span
              style={{
                fontSize: '9px',
                padding: '1px 5px',
                borderRadius: '4px',
                backgroundColor: 'rgba(0, 80, 255, 0.15)',
                color: 'var(--brand-accent)',
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              EXE
            </span>
          </button>
        )}

        {/* Ask AI CEO Button */}
        <button
          type="button"
          onClick={onOpenAiCopilot}
          className="btn-primary"
          style={{
            padding: '6px 14px',
            fontSize: '12px',
          }}
          title="Open AI CEO (Ctrl+/)"
        >
          <Sparkles size={14} />
          <span>Ask AI CEO</span>
          <kbd
            style={{
              padding: '1px 5px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              fontSize: '10px',
              color: '#ffffff',
            }}
          >
            Ctrl /
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="btn-secondary"
          style={{
            padding: '7px',
            borderRadius: '999px',
            color: 'var(--text-muted)',
          }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
};
