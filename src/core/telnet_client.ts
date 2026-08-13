import * as net from 'net';
import { EventEmitter } from 'events';
import { DeviceConnectionConfig } from '../storage/models.js';

// Telnet Command Constants (RFC 854)
const IAC = 255;  // Interpret As Command
const DONT = 254;
const DO = 253;
const WONT = 252;
const WILL = 251;
const SB = 250;   // Subnegotiation
const SE = 240;   // Subnegotiation End

// Telnet Option Constants
const OPT_ECHO = 1;
const OPT_SUPPRESS_GO_AHEAD = 3;
const OPT_TERMINAL_TYPE = 24;
const OPT_NAWS = 31; // Negotiate About Window Size

export class TelnetClient extends EventEmitter {
  private socket: net.Socket | null = null;
  private config: DeviceConnectionConfig | null = null;
  private isConnected: boolean = false;
  private terminalCols: number = 80;
  private terminalRows: number = 24;
  private subnegBuffer: number[] = [];
  private inSubnegotiation: boolean = false;

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

      this.emit('status', 'connecting', `Connecting to Telnet ${config.host}:${config.port}...`);
      this.socket = new net.Socket();

      let hasResolved = false;

      this.socket.connect(config.port || 23, config.host, () => {
        this.isConnected = true;
        this.emit('status', 'connected', `Telnet connection established to ${config.host}:${config.port}`);
        if (!hasResolved) {
          hasResolved = true;
          resolve();
        }

        // Send initial auto-login credentials if provided
        if (config.username) {
          setTimeout(() => {
            if (this.isConnected && this.socket) {
              // Wait slightly for banner before sending username
              this.socket.write(config.username + '\r\n');
              if (config.password) {
                setTimeout(() => {
                  if (this.isConnected && this.socket && config.password) {
                    this.socket.write(config.password + '\r\n');
                  }
                }, 800);
              }
            }
          }, 600);
        }
      });

      this.socket.on('data', (data: Buffer) => {
        const processed = this.handleTelnetOptions(data);
        if (processed.length > 0) {
          this.emit('data', processed.toString('utf8'));
        }
      });

      this.socket.on('error', (err: Error) => {
        this.isConnected = false;
        this.emit('error', err);
        this.emit('status', 'error', err.message);
        if (!hasResolved) {
          hasResolved = true;
          reject(err);
        }
      });

      this.socket.on('close', (hadError: boolean) => {
        this.isConnected = false;
        this.emit('status', 'disconnected', hadError ? 'Telnet closed with error' : 'Telnet disconnected');
        this.emit('close', hadError);
      });

      this.socket.setTimeout(20000, () => {
        if (!this.isConnected) {
          this.disconnect();
          const timeoutErr = new Error('Telnet connection timed out');
          this.emit('error', timeoutErr);
          if (!hasResolved) {
            hasResolved = true;
            reject(timeoutErr);
          }
        }
      });
    });
  }

  /**
   * Parse Telnet IAC sequences and respond to option negotiations
   */
  private handleTelnetOptions(buffer: Buffer): Buffer {
    const output: number[] = [];
    let i = 0;

    while (i < buffer.length) {
      const byte = buffer[i];

      if (this.inSubnegotiation) {
        if (byte === IAC && i + 1 < buffer.length && buffer[i + 1] === SE) {
          this.inSubnegotiation = false;
          this.subnegBuffer = [];
          i += 2;
        } else {
          this.subnegBuffer.push(byte);
          i++;
        }
        continue;
      }

      if (byte === IAC) {
        if (i + 1 >= buffer.length) {
          i++;
          continue;
        }

        const cmd = buffer[i + 1];

        if (cmd === IAC) {
          // Escaped IAC
          output.push(IAC);
          i += 2;
          continue;
        }

        if (cmd === SB) {
          this.inSubnegotiation = true;
          this.subnegBuffer = [];
          i += 2;
          continue;
        }

        if (i + 2 < buffer.length) {
          const opt = buffer[i + 2];

          // Handle negotiations
          if (cmd === DO) {
            if (opt === OPT_TERMINAL_TYPE || opt === OPT_SUPPRESS_GO_AHEAD || opt === OPT_NAWS) {
              this.sendNegotiation(WILL, opt);
              if (opt === OPT_NAWS) {
                this.sendWindowSize();
              }
            } else {
              this.sendNegotiation(WONT, opt);
            }
          } else if (cmd === DONT) {
            this.sendNegotiation(WONT, opt);
          } else if (cmd === WILL) {
            if (opt === OPT_ECHO || opt === OPT_SUPPRESS_GO_AHEAD) {
              this.sendNegotiation(DO, opt);
            } else {
              this.sendNegotiation(DONT, opt);
            }
          } else if (cmd === WONT) {
            this.sendNegotiation(DONT, opt);
          }

          i += 3;
          continue;
        }

        i += 2;
        continue;
      }

      output.push(byte);
      i++;
    }

    return Buffer.from(output);
  }

  private sendNegotiation(cmd: number, opt: number): void {
    if (this.socket && !this.socket.destroyed) {
      this.socket.write(Buffer.from([IAC, cmd, opt]));
    }
  }

  private sendWindowSize(): void {
    if (this.socket && !this.socket.destroyed) {
      const buf = Buffer.alloc(9);
      buf[0] = IAC;
      buf[1] = SB;
      buf[2] = OPT_NAWS;
      buf.writeUInt16BE(this.terminalCols, 3);
      buf.writeUInt16BE(this.terminalRows, 5);
      buf[7] = IAC;
      buf[8] = SE;
      this.socket.write(buf);
    }
  }

  public write(data: string): void {
    if (this.socket && this.isConnected && !this.socket.destroyed) {
      this.socket.write(data);
    }
  }

  public resize(cols: number, rows: number): void {
    this.terminalCols = cols;
    this.terminalRows = rows;
    this.sendWindowSize();
  }

  public disconnect(): void {
    if (this.socket) {
      try {
        this.socket.end();
        this.socket.destroy();
      } catch {}
      this.socket = null;
    }
    this.isConnected = false;
  }
}
