import React from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { useDesktopBridge } from './useDesktopBridge';
import founderosLogo from '../assets/founderos-logo.jpg';

export const DesktopTitlebar: React.FC = () => {
  const { isDesktop, isMaximized, minimize, maximize, close } = useDesktopBridge();

  if (!isDesktop) return null;

  return (
    <div
      style={{
        height: '36px',
        backgroundColor: '#030712',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '16px',
        paddingRight: '0',
        userSelect: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        WebkitAppRegion: 'drag',
      } as React.CSSProperties & { WebkitAppRegion?: string }}
    >
      {/* Left: App Emblem & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img
          src={founderosLogo}
          alt="Logo"
          style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover' }}
        />
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
          FounderOS
        </span>
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 600,
            padding: '1px 6px',
            borderRadius: '999px',
            backgroundColor: 'rgba(0, 80, 255, 0.18)',
            color: 'var(--brand-accent)',
            border: '1px solid rgba(0, 80, 255, 0.3)',
          }}
        >
          Desktop Edition
        </span>
      </div>

      {/* Center: Global Hotkey Tip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.65, fontSize: '11px' }}>
        <span>Global Summon:</span>
        <kbd
          style={{
            padding: '1px 5px',
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            fontSize: '10px',
            color: 'var(--text-dim)',
          }}
        >
          Ctrl+Shift+O
        </kbd>
      </div>

      {/* Right: Window Controls (Non-draggable) */}
      <div style={{ display: 'flex', height: '100%', WebkitAppRegion: 'no-drag' } as React.CSSProperties & { WebkitAppRegion?: string }}>
        {/* Minimize Button */}
        <button
          type="button"
          onClick={minimize}
          style={{
            width: '46px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title="Minimize"
          aria-label="Minimize Window"
        >
          <Minus size={13} />
        </button>

        {/* Maximize / Restore Button */}
        <button
          type="button"
          onClick={maximize}
          style={{
            width: '46px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          title={isMaximized ? 'Restore' : 'Maximize'}
          aria-label="Maximize Window"
        >
          {isMaximized ? <Copy size={12} /> : <Square size={12} />}
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={close}
          style={{
            width: '46px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
          title="Close to System Tray"
          aria-label="Close Window"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
