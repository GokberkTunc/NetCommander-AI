import { Client, ClientChannel, SFTPWrapper } from 'ssh2';
import { EventEmitter } from 'events';
import { DeviceConnectionConfig } from '../storage/models.js';

export interface SSHClientEvents {
  data: (chunk: string) => void;
  error: (err: Error) => void;
  close: (hadError: boolean) => void;
  status: (status: 'connecting' | 'connected' | 'disconnected' | 'error', message?: string) => void;
}

export class SSHClient extends EventEmitter {
  private client: Client | null = null;
  private shellStream: ClientChannel | null = null;
  private sftpWrapper: SFTPWrapper | null = null;
  private config: DeviceConnectionConfig | null = null;
  private isConnected: boolean = false;
  private terminalCols: number = 80;
  private terminalRows: number = 24;

  constructor() {
    super();
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public getConfig(): DeviceConnectionConfig | null {
    return this.config;
  }

  public connect(config: DeviceConnectionConfig, cols: number = 80, rows: number = 24): Promise<void> {
    this.config = config;
    this.terminalCols = cols;
    this.terminalRows = rows;

    return new Promise((resolve, reject) => {
      this.disconnect();

      this.client = new Client();
      this.emit('status', 'connecting', `Connecting to ${config.host}:${config.port}...`);

      const connectConfig: any = {
        host: config.host,
        port: config.port || 22,
        username: config.username || 'root',
        readyTimeout: 20000,
        keepaliveInterval: 10000,
        keepaliveCountMax: 3,
      };

      if (config.authType === 'password' && config.password) {
        connectConfig.password = config.password;
      } else if (config.authType === 'privateKey' && config.privateKey) {
        connectConfig.privateKey = config.privateKey;
        if (config.passphrase) {
          connectConfig.passphrase = config.passphrase;
        }
      } else if (config.password) {
        connectConfig.password = config.password;
      }

      this.client.on('ready', () => {
        this.isConnected = true;
        this.emit('status', 'connected', `SSH connection established to ${config.host}`);

        // Open interactive PTY shell
        this.client!.shell(
          {
            term: 'xterm-256color',
            cols: this.terminalCols,
            rows: this.terminalRows,
          },
          (err, stream) => {
            if (err) {
              this.emit('error', err);
              this.emit('status', 'error', err.message);
              reject(err);
              return;
            }

            this.shellStream = stream;

            stream.on('data', (data: Buffer) => {
              const text = data.toString('utf8');
              this.emit('data', text);
            });

            stream.on('close', () => {
              this.shellStream = null;
              this.isConnected = false;
              this.emit('status', 'disconnected', 'Shell closed');
              this.emit('close', false);
            });

            stream.stderr.on('data', (data: Buffer) => {
              this.emit('data', data.toString('utf8'));
            });

            resolve();
          }
        );
      });

      this.client.on('error', (err: Error) => {
        this.isConnected = false;
        this.emit('error', err);
        this.emit('status', 'error', err.message);
        reject(err);
      });

      (this.client as any).on('close', (hadError: boolean) => {
        this.isConnected = false;
        this.emit('status', 'disconnected', hadError ? 'Connection closed with error' : 'Disconnected');
        this.emit('close', hadError);
      });

      try {
        this.client.connect(connectConfig);
      } catch (err: any) {
        this.isConnected = false;
        this.emit('status', 'error', err.message);
        reject(err);
      }
    });
  }

  public write(data: string): void {
    if (this.shellStream && this.isConnected) {
      this.shellStream.write(data);
    }
  }

  public resize(cols: number, rows: number): void {
    this.terminalCols = cols;
    this.terminalRows = rows;
    if (this.shellStream && (this.shellStream as any).setWindow) {
      try {
        (this.shellStream as any).setWindow(rows, cols, 0, 0);
      } catch (err) {
        console.error('Failed to resize terminal:', err);
      }
    }
  }

  /**
   * Execute a single command and return stdout/stderr without interfering with shell
   */
  public execCommand(command: string, timeoutMs: number = 15000): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.isConnected) {
        return reject(new Error('SSH client is not connected'));
      }

      let stdout = '';
      let stderr = '';
      let isResolved = false;

      const timer = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          resolve({ stdout, stderr: stderr + '\n[Command timed out]', code: -1 });
        }
      }, timeoutMs);

      this.client.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timer);
          return reject(err);
        }

        stream.on('data', (data: Buffer) => {
          stdout += data.toString('utf8');
        });

        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString('utf8');
        });

        stream.on('close', (code: number) => {
          clearTimeout(timer);
          if (!isResolved) {
            isResolved = true;
            resolve({ stdout, stderr, code: code || 0 });
          }
        });
      });
    });
  }

  /**
   * Get or initialize SFTP subsystem
   */
  public getSFTP(): Promise<SFTPWrapper> {
    return new Promise((resolve, reject) => {
      if (this.sftpWrapper) {
        return resolve(this.sftpWrapper);
      }

      if (!this.client || !this.isConnected) {
        return reject(new Error('SSH client is not connected'));
      }

      this.client.sftp((err, sftp) => {
        if (err) {
          return reject(err);
        }
        this.sftpWrapper = sftp;
        resolve(sftp);
      });
    });
  }

  public disconnect(): void {
    if (this.shellStream) {
      try {
        this.shellStream.end();
      } catch {}
      this.shellStream = null;
    }

    if (this.sftpWrapper) {
      try {
        this.sftpWrapper.end();
      } catch {}
      this.sftpWrapper = null;
    }

    if (this.client) {
      try {
        this.client.end();
        this.client.destroy();
      } catch {}
      this.client = null;
    }

    this.isConnected = false;
  }
}
