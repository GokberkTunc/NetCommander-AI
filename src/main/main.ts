import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import { ProtocolManager } from '../core/protocol_manager.js';
import { DbStore } from '../storage/db_store.js';
import { AppTray } from './tray.js';
import { TerminalObserver } from '../ai/terminal_observer.js';
import { AgentBrain } from '../ai/agent_brain.js';
import { AIProviders } from '../ai/ai_providers.js';
import { WebSessionManager } from '../ai/web_session.js';
import { Logger } from '../storage/logger.js';
import { DeviceConnectionConfig, AppSettings, AIProviderConfig, ChatMessage, AIProviderType } from '../storage/models.js';

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let filesWindow: BrowserWindow | null = null;
let isQuitting = false;

const logger = Logger.getInstance();
logger.info('Main', 'NetCommander AI başlatılıyor...');

// Catch unhandled errors
process.on('uncaughtException', (err) => {
  logger.error('Main', 'Uncaught Exception yakalandı', err);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Main', 'Unhandled Rejection yakalandı', reason);
});

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  logger.warn('Main', 'Başka bir örnek zaten çalışıyor, çıkış yapılıyor.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createMainWindow(): BrowserWindow {
  const dbStore = DbStore.getInstance();
  const settings = dbStore.getSettings();

  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 640,
    title: 'NetCommander AI - Windows SSH & Telnet Network Manager',
    backgroundColor: '#0F141C',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const indexPath = path.join(__dirname, '..', 'ui', 'index.html');
  win.loadFile(indexPath);

  win.on('close', (event: any) => {
    const currentSettings = dbStore.getSettings();
    if (!isQuitting && currentSettings.tray.closeToTray) {
      event.preventDefault();
      win.hide();
      AppTray.showNotification(
        'NetCommander AI Arka Planda',
        'Uygulama sistem tepsisinde çalışmaya devam ediyor.'
      );
    }
  });

  win.on('minimize', () => {
    const currentSettings = dbStore.getSettings();
    if (currentSettings.tray.minimizeToTray) {
      win.hide();
    }
  });

  return win;
}

function openSettingsWindow(): BrowserWindow {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return settingsWindow;
  }

  settingsWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 800,
    minHeight: 560,
    title: 'NetCommander AI - Ayarlar & Cihaz Yöneticisi',
    backgroundColor: '#0F141C',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, '..', 'ui', 'settings.html'));
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  return settingsWindow;
}

function openFilesWindow(): BrowserWindow {
  if (filesWindow && !filesWindow.isDestroyed()) {
    filesWindow.show();
    filesWindow.focus();
    return filesWindow;
  }

  filesWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    minWidth: 850,
    minHeight: 550,
    title: 'NetCommander AI - Dosya Gezgini (SFTP / Shell)',
    backgroundColor: '#0F141C',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  filesWindow.loadFile(path.join(__dirname, '..', 'ui', 'files.html'));
  filesWindow.on('closed', () => {
    filesWindow = null;
  });

  return filesWindow;
}

app.whenReady().then(() => {
  const dbStore = DbStore.getInstance();
  const protocolManager = ProtocolManager.getInstance();
  const terminalObserver = TerminalObserver.getInstance();
  const agentBrain = AgentBrain.getInstance();

  mainWindow = createMainWindow();
  AppTray.init(mainWindow);

  // Bind protocol streams to renderer
  protocolManager.on('terminal-data', (payload: { sessionId: string; data: string } | string) => {
    const rawData = typeof payload === 'string' ? payload : payload.data;
    const sessionId = typeof payload === 'string' ? 'default' : payload.sessionId;
    terminalObserver.feedChunk(rawData);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('terminal:data', { sessionId, data: rawData });
    }
  });

  protocolManager.on('status', (status) => {
    logger.info('Protocol', `Durum Değişikliği: ${status.status} - ${status.message || ''}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('protocol:status', status);
    }
  });

  protocolManager.on('disconnected', (info) => {
    logger.info('Protocol', 'Bağlantı kesildi', info);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('protocol:status', { status: 'disconnected', ...info });
    }
  });

  // --- IPC Handlers: Protocols & Multi-Session Terminal ---
  ipcMain.handle('protocol:connect', async (_, config: DeviceConnectionConfig, cols: number, rows: number, sessionId?: string) => {
    const sid = sessionId || config.id || 'session_' + Date.now();
    logger.info('Protocol', `Bağlantı isteği [${sid}]: ${config.name} (${config.host}:${config.port} - ${config.protocol})`);
    terminalObserver.clear();
    await protocolManager.connect(config, cols, rows, sid);
    config.lastConnected = new Date().toISOString();
    dbStore.saveDevice(config);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('device:tab-added', { device: config, sessionId: sid });
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
    return { success: true, sessionId: sid };
  });

  ipcMain.handle('protocol:disconnect', async (_, sessionId?: string) => {
    logger.info('Protocol', `Kullanıcı bağlantıyı kesti: ${sessionId || 'aktif'}`);
    protocolManager.disconnect(sessionId);
    return { success: true };
  });

  ipcMain.handle('protocol:switchSession', async (_, sessionId: string) => {
    logger.info('Protocol', `Oturum geçişi: ${sessionId}`);
    const session = protocolManager.switchSession(sessionId);
    return { success: !!session, session: session ? { id: session.id, config: session.config } : null };
  });

  ipcMain.handle('protocol:getSessions', async () => {
    return protocolManager.getSessions();
  });

  ipcMain.handle('protocol:getActiveDevice', async () => {
    return protocolManager.getActiveConfig();
  });

  ipcMain.handle('terminal:getLastOutput', async (_, linesCount?: number) => {
    return terminalObserver.getTerminalContext(linesCount || 35);
  });

  ipcMain.on('terminal:write', (_, data: string, sessionId?: string) => {
    protocolManager.writeTerminal(data, sessionId);
  });

  ipcMain.on('terminal:resize', (_, cols: number, rows: number, sessionId?: string) => {
    protocolManager.resizeTerminal(cols, rows, sessionId);
  });

  // --- IPC Handlers: Device Management & Scanner ---
  ipcMain.handle('db:getDevices', async () => {
    return dbStore.getDevices();
  });

  ipcMain.handle('db:saveDevice', async (_, device: DeviceConnectionConfig) => {
    return dbStore.saveDevice(device);
  });

  ipcMain.handle('db:deleteDevice', async (_, id: string) => {
    return dbStore.deleteDevice(id);
  });

  ipcMain.handle('device:scan', async () => {
    logger.info('DeviceScanner', 'Cihaz tanıma taraması başlatıldı');
    const blueprint = await protocolManager.scanDevice((step, percent) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('device:scanProgress', { step, percent });
      }
    });

    dbStore.saveBlueprint(blueprint);
    dbStore.addMemoryLog({
      id: 'scan_' + Date.now(),
      deviceId: blueprint.deviceId,
      timestamp: new Date().toISOString(),
      action: 'Cihaz Tanıma Taraması',
      resultSummary: blueprint.summary,
    });

    logger.info('DeviceScanner', 'Cihaz başarıyla tanımlandı', { summary: blueprint.summary });
    return blueprint;
  });

  ipcMain.handle('db:getBlueprint', async (_, deviceId: string) => {
    return dbStore.getBlueprint(deviceId);
  });

  ipcMain.handle('db:getMemoryLogs', async (_, deviceId: string) => {
    return dbStore.getMemoryLogs(deviceId);
  });

  // --- IPC Handlers: SFTP File Manager ---
  ipcMain.handle('sftp:listDir', async (_, remotePath: string) => {
    logger.debug('SFTP', `Dizin listeleme: ${remotePath}`);
    return await protocolManager.getSFTP().listDir(remotePath);
  });

  ipcMain.handle('sftp:readFileText', async (_, remotePath: string) => {
    logger.debug('SFTP', `Dosya okuma: ${remotePath}`);
    return await protocolManager.getSFTP().readFileText(remotePath);
  });

  ipcMain.handle('sftp:writeFileText', async (_, remotePath: string, content: string) => {
    logger.info('SFTP', `Dosya yazma: ${remotePath} (${content.length} bayt)`);
    return await protocolManager.getSFTP().writeFileText(remotePath, content);
  });

  ipcMain.handle('sftp:download', async (_, remotePath: string, localDestPath: string) => {
    logger.info('SFTP', `Dosya indirme: ${remotePath} -> ${localDestPath}`);
    return await protocolManager.getSFTP().downloadFile(remotePath, localDestPath);
  });

  ipcMain.handle('sftp:upload', async (_, localSrcPath: string, remoteDestPath: string) => {
    logger.info('SFTP', `Dosya yükleme: ${localSrcPath} -> ${remoteDestPath}`);
    return await protocolManager.getSFTP().uploadFile(localSrcPath, remoteDestPath);
  });

  ipcMain.handle('sftp:mkdir', async (_, remotePath: string) => {
    logger.info('SFTP', `Klasör oluşturma: ${remotePath}`);
    return await protocolManager.getSFTP().mkdir(remotePath);
  });

  ipcMain.handle('sftp:unlink', async (_, remotePath: string) => {
    logger.info('SFTP', `Dosya silme: ${remotePath}`);
    return await protocolManager.getSFTP().unlink(remotePath);
  });

  ipcMain.handle('sftp:rmdir', async (_, remotePath: string) => {
    logger.info('SFTP', `Dizin silme: ${remotePath}`);
    return await protocolManager.getSFTP().rmdir(remotePath);
  });

  ipcMain.handle('sftp:rename', async (_, oldPath: string, newPath: string) => {
    logger.info('SFTP', `Yeniden adlandırma: ${oldPath} -> ${newPath}`);
    return await protocolManager.getSFTP().rename(oldPath, newPath);
  });

  ipcMain.handle('sftp:chmod', async (_, remotePath: string, mode: number) => {
    logger.info('SFTP', `İzin değiştirme: ${remotePath} -> ${mode}`);
    return await protocolManager.getSFTP().chmod(remotePath, mode);
  });

  // --- IPC Handlers: Dialogs ---
  ipcMain.handle('dialog:openFile', async () => {
    if (!mainWindow) return null;
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
    });
    return res.canceled ? null : res.filePaths[0];
  });

  ipcMain.handle('dialog:saveFile', async (_, defaultName: string) => {
    if (!mainWindow) return null;
    const res = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
    });
    return res.canceled ? null : res.filePath;
  });

  // --- IPC Handlers: AI & Chat ---
  ipcMain.handle('db:getChatHistory', async (_, deviceId?: string) => {
    return dbStore.getChatHistory(deviceId);
  });

  ipcMain.handle('db:saveChatMessage', async (_, message: ChatMessage, deviceId?: string) => {
    dbStore.saveChatMessage(message, deviceId);
    return true;
  });

  ipcMain.handle('db:clearChatHistory', async (_, deviceId?: string) => {
    dbStore.clearChatHistory(deviceId);
    return true;
  });

  ipcMain.handle('ai:sendMessage', async (_, text: string) => {
    logger.info('AI', `Kullanıcı mesajı alındı: ${text.substring(0, 80)}...`);
    try {
      const response = await agentBrain.processUserMessage(text);
      logger.info('AI', 'AI yanıtı başarıyla üretildi');
      return response;
    } catch (err: any) {
      logger.error('AI', 'AI mesaj işleme hatası', err);
      throw err;
    }
  });

  ipcMain.handle('ai:executeCommand', async (_, command: string) => {
    logger.info('AI', `Terminalde komut çalıştırılıyor: ${command}`);
    await agentBrain.executeCommand(command);
    return true;
  });

  ipcMain.handle('ai:testConnection', async (_, config: AIProviderConfig, provider?: AIProviderType) => {
    const prov = (provider || (config as any).provider || 'google_web_session') as AIProviderType;
    logger.info('AI', `Bağlantı testi: ${prov}`);
    return await AIProviders.testConnection(prov, config);
  });

  ipcMain.handle('ai:openGoogleLogin', async () => {
    return await WebSessionManager.openGoogleLoginWindow();
  });

  ipcMain.handle('ai:getGoogleSessionStatus', async () => {
    return await WebSessionManager.getSessionStatus();
  });

  ipcMain.handle('ai:clearGoogleSession', async () => {
    await WebSessionManager.clearSession();
    return true;
  });

  // --- IPC Handlers: Logger & Debugging ---
  ipcMain.handle('app:getLogs', async () => {
    return logger.getRecentLogs();
  });

  ipcMain.handle('app:clearLogs', async () => {
    logger.clearLogs();
    return true;
  });

  ipcMain.handle('app:openLogFolder', async () => {
    const logPath = logger.getLogFilePath();
    shell.showItemInFolder(logPath);
    return true;
  });

  // --- IPC Handlers: Settings ---
  ipcMain.handle('db:getSettings', async () => {
    return dbStore.getSettings();
  });

  ipcMain.handle('db:saveSettings', async (_, settings: Partial<AppSettings>) => {
    logger.info('Settings', 'Ayarlar kaydedildi');
    return dbStore.saveSettings(settings);
  });

  // --- Window Controls & Standalone Windows ---
  ipcMain.handle('window:openSettings', () => openSettingsWindow());
  ipcMain.handle('window:openFiles', () => openFilesWindow());
  
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => mainWindow?.close());
});

app.on('before-quit', () => {
  isQuitting = true;
  AppTray.destroy();
});

app.on('window-all-closed', () => {
  const settings = DbStore.getInstance().getSettings();
  if (isQuitting || !settings.tray.closeToTray) {
    app.quit();
  }
});
