import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut, shell, Notification } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Enforce single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

function getAppLogoPath(): string {
  const candidates = [
    path.join(__dirname, '../dist/founderos-logo.jpg'),
    path.join(__dirname, '../public/founderos-logo.jpg'),
    path.join(app.getAppPath(), 'dist/founderos-logo.jpg'),
    path.join(app.getAppPath(), 'public/founderos-logo.jpg'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return '';
}

function createWindow() {
  const iconPath = getAppLogoPath();
  const appIcon = iconPath ? nativeImage.createFromPath(iconPath) : undefined;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: '#030712',
    frame: false, // Custom sleek glassmorphic titlebar
    show: false, // Show gracefully when ready-to-show
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Smooth appearance
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Determine if running in development mode
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || (process.argv.includes('--dev') ? 'http://localhost:5173' : null);

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    // Production build
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadURL('http://localhost:5173');
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createTray() {
  const iconPath = getAppLogoPath();
  if (!iconPath) return;

  const trayImage = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(trayImage);
  tray.setToolTip('FounderOS — Autonomous Founder Operating System');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open FounderOS',
      click: () => {
        if (mainWindow) {
          if (!mainWindow.isVisible()) mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      },
    },
    {
      label: '☀️ Morning Intelligence',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send('navigate-to', '/morning-intelligence');
        }
      },
    },
    {
      label: '⚡ Ask AI CEO',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send('navigate-to', '/ai');
        }
      },
    },
    {
      label: '💰 Financial Health & Runway',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send('navigate-to', '/finance');
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit FounderOS',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

// Window Controls IPC Handlers
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

ipcMain.on('show-notification', (_event, { title, body }) => {
  const iconPath = getAppLogoPath();
  new Notification({
    title: title || 'FounderOS',
    body: body || '',
    icon: iconPath || undefined,
  }).show();
});

ipcMain.on('open-external', (_event, url) => {
  if (url && typeof url === 'string') {
    shell.openExternal(url);
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Global shortcut to summon FounderOS from anywhere in OS
  try {
    globalShortcut.register('CommandOrControl+Shift+O', () => {
      if (mainWindow) {
        if (mainWindow.isFocused()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      } else {
        createWindow();
      }
    });
  } catch (err) {
    console.error('Failed to register global shortcut:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
