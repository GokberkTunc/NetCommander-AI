import { EventEmitter } from 'events';
import { SSHClient } from './ssh_client.js';
import { TelnetClient } from './telnet_client.js';
import { DeviceScanner } from './device_scanner.js';
import { SFTPManager } from './sftp_manager.js';
import { DeviceConnectionConfig, DeviceBlueprint } from '../storage/models.js';
import { Logger } from '../storage/logger.js';

export interface SessionInstance {
  id: string;
  config: DeviceConnectionConfig;
  protocol: 'ssh' | 'telnet';
  sshClient?: SSHClient;
  telnetClient?: TelnetClient;
  sftpManager: SFTPManager;
  isConnected: boolean;
}

export class ProtocolManager extends EventEmitter {
  private static instance: ProtocolManager;
  private sessions: Map<string, SessionInstance> = new Map();
  private activeSessionId: string = 'default';

  private constructor() {
    super();
  }

  public static getInstance(): ProtocolManager {
    if (!ProtocolManager.instance) {
      ProtocolManager.instance = new ProtocolManager();
    }
    return ProtocolManager.instance;
  }

  public getActiveSession(): SessionInstance | undefined {
    return this.sessions.get(this.activeSessionId);
  }

  public getActiveSessionId(): string {
    return this.activeSessionId;
  }

  public getActiveConfig(): DeviceConnectionConfig | null {
    const session = this.getActiveSession();
    return session && session.isConnected ? session.config : null;
  }

  public isConnected(): boolean {
    const session = this.getActiveSession();
    return session ? session.isConnected : false;
  }

  public getSFTP(): SFTPManager {
    const session = this.getActiveSession();
    if (!session) {
      throw new Error('Aktif bir oturum bulunmuyor.');
    }
    return session.sftpManager;
  }

  public switchSession(sessionId: string): SessionInstance | undefined {
    const logger = Logger.getInstance();
    logger.info('ProtocolManager', `Oturum değiştirildi: ${sessionId}`);
    this.activeSessionId = sessionId;
    const session = this.sessions.get(sessionId);
    if (session) {
      this.emit('session-switched', { sessionId, session });
    }
    return session;
  }

  public getSessions(): { id: string; name: string; host: string; isConnected: boolean }[] {
    const list: { id: string; name: string; host: string; isConnected: boolean }[] = [];
    for (const [id, s] of this.sessions.entries()) {
      list.push({
        id,
        name: s.config.name,
        host: s.config.host,
        isConnected: s.isConnected,
      });
    }
    return list;
  }

  public async connect(
    config: DeviceConnectionConfig,
    cols: number = 80,
    rows: number = 24,
    sessionId: string = config.id || 'default'
  ): Promise<void> {
    const logger = Logger.getInstance();
    logger.info('ProtocolManager', `Yeni oturum bağlanıyor: [${sessionId}] ${config.name} (${config.host}:${config.port})`);

    // Disconnect existing session with this ID if any
    if (this.sessions.has(sessionId)) {
      this.closeSession(sessionId);
    }

    const sftpManager = new SFTPManager();
    const sessionInstance: SessionInstance = {
      id: sessionId,
      config,
      protocol: config.protocol || 'ssh',
      sftpManager,
      isConnected: false,
    };

    if (sessionInstance.protocol === 'ssh') {
      const sshClient = new SSHClient();
      sessionInstance.sshClient = sshClient;
      sftpManager.setSSHClient(sshClient);

      sshClient.on('data', (data: string) => {
        this.emit('terminal-data', { sessionId, data });
      });

      sshClient.on('status', (status: string, message?: string) => {
        if (status === 'connected') {
          sessionInstance.isConnected = true;
        }
        this.emit('status', { sessionId, status, message, device: config });
      });

      sshClient.on('error', (err: Error) => {
        sessionInstance.isConnected = false;
        this.emit('error', { sessionId, protocol: 'ssh', error: err.message });
      });

      sshClient.on('close', () => {
        sessionInstance.isConnected = false;
        this.emit('disconnected', { sessionId, protocol: 'ssh', device: config });
      });

      this.sessions.set(sessionId, sessionInstance);
      this.activeSessionId = sessionId;

      await sshClient.connect(config, cols, rows);
      try {
        const sftp = await sshClient.getSFTP();
        sftpManager.setSFTP(sftp);
      } catch (sftpErr) {
        logger.warn('ProtocolManager', 'Native SFTP bulunamadı, Shell Fallback aktif');
        sftpManager.setSFTP(null);
      }
    } else {
      const telnetClient = new TelnetClient();
      sessionInstance.telnetClient = telnetClient;

      telnetClient.on('data', (data: string) => {
        this.emit('terminal-data', { sessionId, data });
      });

      telnetClient.on('status', (status: string, message?: string) => {
        if (status === 'connected') {
          sessionInstance.isConnected = true;
        }
        this.emit('status', { sessionId, status, message, device: config });
      });

      telnetClient.on('error', (err: Error) => {
        sessionInstance.isConnected = false;
        this.emit('error', { sessionId, protocol: 'telnet', error: err.message });
      });

      this.sessions.set(sessionId, sessionInstance);
      this.activeSessionId = sessionId;

      await telnetClient.connect(config, cols, rows);
    }
  }

  public disconnect(sessionId?: string): void {
    const targetId = sessionId || this.activeSessionId;
    this.closeSession(targetId);
  }

  public closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isConnected = false;
      if (session.sshClient) {
        session.sshClient.disconnect();
      }
      if (session.telnetClient) {
        session.telnetClient.disconnect();
      }
      this.sessions.delete(sessionId);
      this.emit('session-closed', { sessionId });

      // If active session closed, switch to another
      if (this.activeSessionId === sessionId) {
        const remainingKeys = Array.from(this.sessions.keys());
        if (remainingKeys.length > 0) {
          this.switchSession(remainingKeys[remainingKeys.length - 1]);
        } else {
          this.activeSessionId = 'default';
        }
      }
    }
  }

  public writeTerminal(data: string, sessionId?: string): void {
    const targetId = sessionId || this.activeSessionId;
    const session = this.sessions.get(targetId);
    if (session && session.isConnected) {
      if (session.sshClient) {
        session.sshClient.write(data);
      } else if (session.telnetClient) {
        session.telnetClient.write(data);
      }
    }
  }

  public resizeTerminal(cols: number, rows: number, sessionId?: string): void {
    const targetId = sessionId || this.activeSessionId;
    const session = this.sessions.get(targetId);
    if (session && session.isConnected) {
      if (session.sshClient) {
        session.sshClient.resize(cols, rows);
      }
    }
  }

  public async scanDevice(onProgress?: (step: string, percent: number) => void): Promise<DeviceBlueprint> {
    const session = this.getActiveSession();
    if (!session || !session.isConnected || !session.sshClient) {
      throw new Error('Aktif bir SSH cihaz bağlantısı bulunamadı.');
    }
    const scanner = new DeviceScanner(session.sshClient);
    return await scanner.scanDevice(session.config.id, onProgress);
  }
}
