import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export class Logger {
  private static instance: Logger;
  private projectLogPath: string;
  private appDataLogPath: string;
  private memoryLogs: string[] = [];
  private readonly MAX_MEMORY_LOGS = 500;

  private constructor() {
    // 1. Direct Project logs folder
    this.projectLogPath = 'c:\\Users\\gokbe\\Desktop\\SSH\\logs\\debug.log';
    try {
      const dir = path.dirname(this.projectLogPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch {}

    // 2. AppData logs fallback
    try {
      const userDataDir = app ? app.getPath('userData') : process.cwd();
      this.appDataLogPath = path.join(userDataDir, 'debug.log');
    } catch {
      this.appDataLogPath = this.projectLogPath;
    }

    this.info('Logger', '=== NetCommander AI Hata Ayıklama Günlüğü Başlatıldı ===');
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: LogLevel, module: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    let metaStr = '';
    if (meta !== undefined) {
      if (meta instanceof Error) {
        metaStr = ` | Error: ${meta.message}\nStack: ${meta.stack}`;
      } else if (typeof meta === 'object') {
        try {
          metaStr = ` | Meta: ${JSON.stringify(meta)}`;
        } catch {
          metaStr = ` | Meta: [Unserializable Object]`;
        }
      } else {
        metaStr = ` | ${String(meta)}`;
      }
    }
    return `[${timestamp}] [${level}] [${module}] ${message}${metaStr}`;
  }

  private writeLog(level: LogLevel, module: string, message: string, meta?: any): void {
    const formatted = this.formatMessage(level, module, message, meta);

    // 1. Memory buffer
    this.memoryLogs.push(formatted);
    if (this.memoryLogs.length > this.MAX_MEMORY_LOGS) {
      this.memoryLogs.shift();
    }

    // 2. Console output
    if (level === 'ERROR') {
      console.error(formatted);
    } else if (level === 'WARN') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }

    // 3. File writes (both project and appdata)
    try {
      fs.appendFileSync(this.projectLogPath, formatted + '\n', 'utf8');
    } catch {}

    if (this.appDataLogPath !== this.projectLogPath) {
      try {
        fs.appendFileSync(this.appDataLogPath, formatted + '\n', 'utf8');
      } catch {}
    }
  }

  public debug(module: string, message: string, meta?: any): void {
    this.writeLog('DEBUG', module, message, meta);
  }

  public info(module: string, message: string, meta?: any): void {
    this.writeLog('INFO', module, message, meta);
  }

  public warn(module: string, message: string, meta?: any): void {
    this.writeLog('WARN', module, message, meta);
  }

  public error(module: string, message: string, error?: any): void {
    this.writeLog('ERROR', module, message, error);
  }

  public getRecentLogs(): string {
    if (fs.existsSync(this.projectLogPath)) {
      try {
        const fileContent = fs.readFileSync(this.projectLogPath, 'utf8');
        const lines = fileContent.split('\n');
        return lines.slice(-350).join('\n');
      } catch {}
    }
    return this.memoryLogs.join('\n');
  }

  public clearLogs(): void {
    this.memoryLogs = [];
    try {
      fs.writeFileSync(this.projectLogPath, `[${new Date().toISOString()}] [INFO] [Logger] Günlükler temizlendi.\n`, 'utf8');
    } catch {}
  }

  public getLogFilePath(): string {
    return this.projectLogPath;
  }
}
