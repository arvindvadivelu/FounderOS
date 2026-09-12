import { contextBridge, ipcRenderer } from 'electron';

export interface DesktopBridge {
  isDesktop: boolean;
  platform: string;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  showNotification: (options: { title: string; body: string }) => void;
  openExternal: (url: string) => void;
  onNavigate: (callback: (route: string) => void) => () => void;
}

const desktopBridge: DesktopBridge = {
  isDesktop: true,
  platform: process.platform,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  showNotification: (options) => ipcRenderer.send('show-notification', options),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  onNavigate: (callback) => {
    const subscription = (_event: any, route: string) => callback(route);
    ipcRenderer.on('navigate-to', subscription);
    return () => ipcRenderer.removeListener('navigate-to', subscription);
  },
};

contextBridge.exposeInMainWorld('desktopBridge', desktopBridge);
