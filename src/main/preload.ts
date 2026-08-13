import { contextBridge, ipcRenderer } from 'electron';
import {
  DeviceConnectionConfig,
  AppSettings,
  ChatMessage,
  AIProviderConfig,
} from '../storage/models.js';

export const api = {
  // --- Terminal & Protocols ---
  connect: (config: DeviceConnectionConfig, cols: number, rows: number, sessionId?: string) =>
    ipcRenderer.invoke('protocol:connect', config, cols, rows, sessionId),
  disconnect: (sessionId?: string) => ipcRenderer.invoke('protocol:disconnect', sessionId),
  switchSession: (sessionId: string) => ipcRenderer.invoke('protocol:switchSession', sessionId),
  getSessions: () => ipcRenderer.invoke('protocol:getSessions'),
  getActiveDevice: () => ipcRenderer.invoke('protocol:getActiveDevice'),
  getLastTerminalOutput: (linesCount?: number) => ipcRenderer.invoke('terminal:getLastOutput', linesCount),
  writeTerminal: (data: string, sessionId?: string) => ipcRenderer.send('terminal:write', data, sessionId),
  resizeTerminal: (cols: number, rows: number, sessionId?: string) => ipcRenderer.send('terminal:resize', cols, rows, sessionId),
  onTerminalData: (callback: (data: string) => void) => {
    const handler = (_: any, data: string) => callback(data);
    ipcRenderer.on('terminal:data', handler);
    return () => ipcRenderer.removeListener('terminal:data', handler);
  },
  onStatusChange: (callback: (status: any) => void) => {
    const handler = (_: any, status: any) => callback(status);
    ipcRenderer.on('protocol:status', handler);
    return () => ipcRenderer.removeListener('protocol:status', handler);
  },
  onQuickConnect: (callback: (deviceId: string) => void) => {
    const handler = (_: any, id: string) => callback(id);
    ipcRenderer.on('quick-connect-device', handler);
    return () => ipcRenderer.removeListener('quick-connect-device', handler);
  },
  onDeviceTabAdded: (callback: (data: { device: DeviceConnectionConfig; sessionId: string }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('device:tab-added', handler);
    return () => ipcRenderer.removeListener('device:tab-added', handler);
  },
  onNavigateTab: (callback: (tabId: string) => void) => {
    const handler = (_: any, id: string) => callback(id);
    ipcRenderer.on('navigate-tab', handler);
    return () => ipcRenderer.removeListener('navigate-tab', handler);
  },

  // --- Device Management ---
  getDevices: () => ipcRenderer.invoke('db:getDevices'),
  saveDevice: (device: DeviceConnectionConfig) => ipcRenderer.invoke('db:saveDevice', device),
  deleteDevice: (id: string) => ipcRenderer.invoke('db:deleteDevice', id),
  scanDevice: () => ipcRenderer.invoke('device:scan'),
  onScanProgress: (callback: (data: { step: string; percent: number }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('device:scanProgress', handler);
    return () => ipcRenderer.removeListener('device:scanProgress', handler);
  },
  getBlueprint: (deviceId: string) => ipcRenderer.invoke('db:getBlueprint', deviceId),
  getMemoryLogs: (deviceId: string) => ipcRenderer.invoke('db:getMemoryLogs', deviceId),

  // --- SFTP File Manager ---
  listSFTP: (remotePath: string) => ipcRenderer.invoke('sftp:listDir', remotePath),
  readSFTPFile: (remotePath: string) => ipcRenderer.invoke('sftp:readFileText', remotePath),
  writeSFTPFile: (remotePath: string, content: string) => ipcRenderer.invoke('sftp:writeFileText', remotePath, content),
  createSFTPDir: (remotePath: string) => ipcRenderer.invoke('sftp:mkdir', remotePath),
  deleteSFTP: async (remotePath: string, isDirectory?: boolean) => {
    if (isDirectory) return ipcRenderer.invoke('sftp:rmdir', remotePath);
    return ipcRenderer.invoke('sftp:unlink', remotePath);
  },
  downloadSFTP: async (remotePath: string) => {
    const filename = remotePath.split('/').pop() || 'downloaded_file';
    const localSavePath = await ipcRenderer.invoke('dialog:saveFile', filename);
    if (localSavePath) {
      return ipcRenderer.invoke('sftp:download', remotePath, localSavePath);
    }
  },
  uploadSFTP: async (remoteDestDir: string) => {
    const localSrcPath = await ipcRenderer.invoke('dialog:openFile');
    if (localSrcPath) {
      const filename = localSrcPath.replace(/\\/g, '/').split('/').pop() || 'uploaded_file';
      const remoteDestPath = (remoteDestDir.endsWith('/') ? remoteDestDir : remoteDestDir + '/') + filename;
      await ipcRenderer.invoke('sftp:upload', localSrcPath, remoteDestPath);
      return { success: true };
    }
  },

  sftpListDir: (remotePath: string) => ipcRenderer.invoke('sftp:listDir', remotePath),
  sftpReadFileText: (remotePath: string) => ipcRenderer.invoke('sftp:readFileText', remotePath),
  sftpWriteFileText: (remotePath: string, content: string) => ipcRenderer.invoke('sftp:writeFileText', remotePath, content),
  sftpDownload: (remotePath: string, localDestPath: string) => ipcRenderer.invoke('sftp:download', remotePath, localDestPath),
  sftpUpload: (localSrcPath: string, remoteDestPath: string) => ipcRenderer.invoke('sftp:upload', localSrcPath, remoteDestPath),
  sftpMkdir: (remotePath: string) => ipcRenderer.invoke('sftp:mkdir', remotePath),
  sftpUnlink: (remotePath: string) => ipcRenderer.invoke('sftp:unlink', remotePath),
  sftpRmdir: (remotePath: string) => ipcRenderer.invoke('sftp:rmdir', remotePath),
  sftpRename: (oldPath: string, newPath: string) => ipcRenderer.invoke('sftp:rename', oldPath, newPath),
  sftpChmod: (remotePath: string, mode: number) => ipcRenderer.invoke('sftp:chmod', remotePath, mode),

  // --- Dialogs ---
  showOpenFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  showSaveFileDialog: (defaultName: string) => ipcRenderer.invoke('dialog:saveFile', defaultName),

  // --- AI & Chat ---
  getChatHistory: (deviceId?: string) => ipcRenderer.invoke('db:getChatHistory', deviceId),
  saveChatMessage: (message: ChatMessage, deviceId?: string) => ipcRenderer.invoke('db:saveChatMessage', message, deviceId),
  clearChatHistory: (deviceId?: string) => ipcRenderer.invoke('db:clearChatHistory', deviceId),
  sendAIMessage: (text: string) => ipcRenderer.invoke('ai:sendMessage', text),
  executeCommand: (command: string) => ipcRenderer.invoke('ai:executeCommand', command),
  testAIConnection: (config: AIProviderConfig, provider?: string) => ipcRenderer.invoke('ai:testConnection', config, provider),
  testAIProvider: (config: AIProviderConfig, provider?: string) => ipcRenderer.invoke('ai:testConnection', config, provider),
  openGoogleLogin: () => ipcRenderer.invoke('ai:openGoogleLogin'),
  getGoogleSessionStatus: () => ipcRenderer.invoke('ai:getGoogleSessionStatus'),
  clearGoogleSession: () => ipcRenderer.invoke('ai:clearGoogleSession'),

  // --- Logger & Debugging ---
  getLogs: () => ipcRenderer.invoke('app:getLogs'),
  clearLogs: () => ipcRenderer.invoke('app:clearLogs'),
  openLogFolder: () => ipcRenderer.invoke('app:openLogFolder'),

  // --- Settings ---
  getSettings: () => ipcRenderer.invoke('db:getSettings'),
  saveSettings: (settings: Partial<AppSettings>) => ipcRenderer.invoke('db:saveSettings', settings),

  // --- Standalone Windows ---
  openSettingsWindow: () => ipcRenderer.invoke('window:openSettings'),
  openFilesWindow: () => ipcRenderer.invoke('window:openFiles'),

  // --- Window Controls ---
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
};

contextBridge.exposeInMainWorld('api', api);
