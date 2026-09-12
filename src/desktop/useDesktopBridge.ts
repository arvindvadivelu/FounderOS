import { useState, useEffect } from 'react';

declare global {
  interface Window {
    desktopBridge?: {
      isDesktop: boolean;
      platform: string;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      showNotification: (options: { title: string; body: string }) => void;
      openExternal: (url: string) => void;
      onNavigate: (callback: (route: string) => void) => () => void;
    };
  }
}

export function useDesktopBridge() {
  const [isMaximized, setIsMaximized] = useState(false);
  const isDesktop = typeof window !== 'undefined' && Boolean(window.desktopBridge?.isDesktop);

  useEffect(() => {
    if (!isDesktop || !window.desktopBridge) return;

    // Check initial maximized state
    window.desktopBridge.isMaximized().then(setIsMaximized).catch(() => {});

    // Poll periodically or update on resize
    const handleResize = () => {
      window.desktopBridge?.isMaximized().then(setIsMaximized).catch(() => {});
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDesktop]);

  const minimize = () => {
    window.desktopBridge?.minimize();
  };

  const maximize = async () => {
    window.desktopBridge?.maximize();
    if (window.desktopBridge?.isMaximized) {
      const next = await window.desktopBridge.isMaximized();
      setIsMaximized(next);
    }
  };

  const close = () => {
    window.desktopBridge?.close();
  };

  const showNotification = (title: string, body: string) => {
    if (isDesktop && window.desktopBridge?.showNotification) {
      window.desktopBridge.showNotification({ title, body });
    }
  };

  return {
    isDesktop,
    platform: window.desktopBridge?.platform || 'web',
    isMaximized,
    minimize,
    maximize,
    close,
    showNotification,
  };
}
