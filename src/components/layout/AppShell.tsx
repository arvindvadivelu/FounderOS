import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AmbientOrbs } from '../common/AmbientOrbs';
import { CommandPalette } from '../command/CommandPalette';
import { AICopilotDrawer } from '../ai/AICopilotDrawer';
import { DesktopTitlebar } from '../../desktop/DesktopTitlebar';
import { updateSettings } from '../../db/services/companyService';
import type { Company, AppSettings } from '../../types';

interface AppShellProps {
  children: React.ReactNode;
  currentRoute: string;
  onNavigate: (route: string) => void;
  onRequestCreateTask?: () => void;
  onRequestCreateCustomer?: () => void;
  onRequestCreateExpense?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  currentRoute,
  onNavigate,
  onRequestCreateTask,
  onRequestCreateCustomer,
  onRequestCreateExpense,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);

  // Live query for company & settings & task count
  const company = useLiveQuery<Company | undefined>(async () => {
    const list = await db.companies.toArray();
    return list[0];
  }, []);

  const settings = useLiveQuery<AppSettings | undefined>(async () => {
    return await db.settings.get('singleton');
  }, []);

  const openTaskCount = useLiveQuery<number>(async () => {
    return await db.tasks.where('status').notEqual('done').count();
  }, []);

  // Apply dark theme permanently to HTML attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K, Cmd+K, Ctrl+/, Cmd+/)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Ctrl+/ or Cmd+/: AI Copilot
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsAiCopilotOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);


  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-page)',
        color: 'var(--text-main)',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Native Desktop Titlebar (Electron Only) */}
      <DesktopTitlebar />

      {/* Background ambient lighting */}
      <AmbientOrbs />

      {/* Persistent Left Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        company={company || null}
        taskCount={openTaskCount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Layout Container */}
      <div
        className="main-content-layout"
        style={{
          marginLeft: '260px',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          transition: 'margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <Topbar
          currentRoute={currentRoute}
          company={company || null}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenAiCopilot={() => setIsAiCopilotOpen(true)}
          onNavigateToAi={() => onNavigate('/ai')}
          onGenerateBriefing={() => {
            setIsAiCopilotOpen(true);
          }}
        />

        {/* Dynamic Page Content */}
        <main style={{ flex: 1, padding: '24px' }}>
          {children}
        </main>
      </div>

      {/* Global Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={onNavigate}
        onOpenAi={() => setIsAiCopilotOpen(true)}
        onCreateTask={() => onRequestCreateTask?.()}
        onCreateCustomer={() => onRequestCreateCustomer?.()}
        onCreateExpense={() => onRequestCreateExpense?.()}
        onGenerateBriefing={() => {
          setIsAiCopilotOpen(true);
        }}
      />

      {/* Global AI Copilot Slide-Over Drawer */}
      <AICopilotDrawer
        isOpen={isAiCopilotOpen}
        onClose={() => setIsAiCopilotOpen(false)}
        onNavigateToFullAi={() => onNavigate('/ai')}
      />
    </div>
  );
};
