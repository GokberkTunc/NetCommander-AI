import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import {
  DeviceConnectionConfig,
  DeviceBlueprint,
  MemoryLogEntry,
  AppSettings,
  ChatMessage,
  AIProviderName,
} from './models.js';
import { CryptoVault } from './crypto_vault.js';

interface DatabaseSchema {
  version: number;
  devices: Record<string, DeviceConnectionConfig>;
  blueprints: Record<string, DeviceBlueprint>;
  memoryLogs: Record<string, MemoryLogEntry[]>;
  chatHistories: Record<string, ChatMessage[]>;
  settings: AppSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'tr',
  executionMode: 'autonomous',
  activeProvider: 'google_web_session',
  providers: {
    google_web_session: {
      model: 'gemini-pro',
    },
    lmstudio: {
      endpoint: 'http://localhost:1234/v1',
      model: 'local-model',
    },
    ollama: {
      endpoint: 'http://localhost:11434',
      model: 'llama3.2',
    },
    custom_openai: {
      endpoint: 'http://localhost:8000/v1',
      apiKey: '',
      model: 'default',
    },
    gemini: {
      apiKey: '',
      model: 'gemini-2.5-flash',
    },
    deepseek: {
      apiKey: '',
      model: 'deepseek-chat',
      endpoint: 'https://api.deepseek.com/v1',
    },
    groq: {
      apiKey: '',
      model: 'llama-3.3-70b-versatile',
      endpoint: 'https://api.groq.com/openai/v1',
    },
    openrouter: {
      apiKey: '',
      model: 'meta-llama/llama-3.3-70b-instruct',
      endpoint: 'https://openrouter.ai/api/v1',
    },
    openai: {
      apiKey: '',
      model: 'gpt-4o-mini',
    },
    anthropic: {
      apiKey: '',
      model: 'claude-3-5-sonnet-20241022',
    },
    mistral: {
      apiKey: '',
      model: 'mistral-large-latest',
      endpoint: 'https://api.mistral.ai/v1',
    },
  },
  tray: {
    minimizeToTray: true,
    closeToTray: true,
    startMinimized: false,
  },
  terminal: {
    fontSize: 13,
    fontFamily: "'Consolas', 'Courier New', 'Fira Code', monospace",
    theme: 'retro-dark',
  },
};

export class DbStore {
  private static instance: DbStore;
  private dbFilePath: string;
  private data: DatabaseSchema;

  private constructor() {
    let baseDir = process.cwd();
    try {
      if (app && typeof app.getPath === 'function') {
        baseDir = app.getPath('userData');
      }
    } catch {
      baseDir = path.join(process.env.APPDATA || process.cwd(), 'NetCommanderAI');
    }

    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    this.dbFilePath = path.join(baseDir, 'netcommander_vault.json');
    this.data = this.loadDatabase();
  }

  public static getInstance(): DbStore {
    if (!DbStore.instance) {
      DbStore.instance = new DbStore();
    }
    return DbStore.instance;
  }

  private loadDatabase(): DatabaseSchema {
    if (!fs.existsSync(this.dbFilePath)) {
      const initialDb: DatabaseSchema = {
        version: 1,
        devices: {},
        blueprints: {},
        memoryLogs: {},
        chatHistories: {},
        settings: DEFAULT_SETTINGS,
      };
      this.saveDatabase(initialDb);
      return initialDb;
    }

    try {
      const raw = fs.readFileSync(this.dbFilePath, 'utf8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      // Merge with default settings if keys are missing
      parsed.settings = {
        ...DEFAULT_SETTINGS,
        ...parsed.settings,
        providers: {
          ...DEFAULT_SETTINGS.providers,
          ...(parsed.settings ? parsed.settings.providers : {}),
        },
        tray: {
          ...DEFAULT_SETTINGS.tray,
          ...(parsed.settings ? parsed.settings.tray : {}),
        },
        terminal: {
          ...DEFAULT_SETTINGS.terminal,
          ...(parsed.settings ? parsed.settings.terminal : {}),
        },
      };
      return parsed;
    } catch (err) {
      console.error('Failed to parse database file, recovering with defaults:', err);
      return {
        version: 1,
        devices: {},
        blueprints: {},
        memoryLogs: {},
        chatHistories: {},
        settings: DEFAULT_SETTINGS,
      };
    }
  }

  private saveDatabase(dataToSave?: DatabaseSchema): void {
    const data = dataToSave || this.data;
    try {
      const tempPath = `${this.dbFilePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.dbFilePath);
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // --- Device Connections ---
  public getDevices(): DeviceConnectionConfig[] {
    return Object.values(this.data.devices).map((dev) => ({
      ...dev,
      password: dev.password ? CryptoVault.decrypt(dev.password) : undefined,
      privateKey: dev.privateKey ? CryptoVault.decrypt(dev.privateKey) : undefined,
      passphrase: dev.passphrase ? CryptoVault.decrypt(dev.passphrase) : undefined,
    }));
  }

  public getDeviceById(id: string): DeviceConnectionConfig | undefined {
    const dev = this.data.devices[id];
    if (!dev) return undefined;
    return {
      ...dev,
      password: dev.password ? CryptoVault.decrypt(dev.password) : undefined,
      privateKey: dev.privateKey ? CryptoVault.decrypt(dev.privateKey) : undefined,
      passphrase: dev.passphrase ? CryptoVault.decrypt(dev.passphrase) : undefined,
    };
  }

  public saveDevice(device: DeviceConnectionConfig): DeviceConnectionConfig {
    const clone = { ...device };
    if (!clone.id) {
      clone.id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      clone.createdAt = new Date().toISOString();
    }
    clone.updatedAt = new Date().toISOString();

    // Encrypt sensitive fields before saving
    const encryptedToStore: DeviceConnectionConfig = {
      ...clone,
      password: clone.password ? CryptoVault.encrypt(clone.password) : undefined,
      privateKey: clone.privateKey ? CryptoVault.encrypt(clone.privateKey) : undefined,
      passphrase: clone.passphrase ? CryptoVault.encrypt(clone.passphrase) : undefined,
    };

    this.data.devices[clone.id] = encryptedToStore;
    this.saveDatabase();
    return clone;
  }

  public deleteDevice(id: string): boolean {
    if (this.data.devices[id]) {
      delete this.data.devices[id];
      delete this.data.blueprints[id];
      delete this.data.memoryLogs[id];
      delete this.data.chatHistories[id];
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // --- Device Blueprint & Memory ---
  public saveBlueprint(blueprint: DeviceBlueprint): void {
    this.data.blueprints[blueprint.deviceId] = blueprint;
    this.saveDatabase();
  }

  public getBlueprint(deviceId: string): DeviceBlueprint | undefined {
    return this.data.blueprints[deviceId];
  }

  public addMemoryLog(entry: MemoryLogEntry): void {
    if (!this.data.memoryLogs[entry.deviceId]) {
      this.data.memoryLogs[entry.deviceId] = [];
    }
    this.data.memoryLogs[entry.deviceId].unshift(entry);
    // Keep max 100 entries per device
    if (this.data.memoryLogs[entry.deviceId].length > 100) {
      this.data.memoryLogs[entry.deviceId] = this.data.memoryLogs[entry.deviceId].slice(0, 100);
    }
    this.saveDatabase();
  }

  public getMemoryLogs(deviceId: string): MemoryLogEntry[] {
    return this.data.memoryLogs[deviceId] || [];
  }

  // --- Chat Histories ---
  public getChatHistory(deviceId: string = 'global'): ChatMessage[] {
    return this.data.chatHistories[deviceId] || [];
  }

  public saveChatMessage(message: ChatMessage, deviceId: string = 'global'): void {
    if (!this.data.chatHistories[deviceId]) {
      this.data.chatHistories[deviceId] = [];
    }
    this.data.chatHistories[deviceId].push(message);
    // Keep max 200 messages per conversation
    if (this.data.chatHistories[deviceId].length > 200) {
      this.data.chatHistories[deviceId] = this.data.chatHistories[deviceId].slice(-200);
    }
    this.saveDatabase();
  }

  public clearChatHistory(deviceId: string = 'global'): void {
    this.data.chatHistories[deviceId] = [];
    this.saveDatabase();
  }

  // --- App Settings ---
  public getSettings(): AppSettings {
    const settings = { ...this.data.settings };
    // Decrypt API keys for runtime use
    for (const p of Object.keys(settings.providers) as AIProviderName[]) {
      const pConfig = settings.providers[p];
      if (pConfig && pConfig.apiKey) {
        pConfig.apiKey = CryptoVault.decrypt(pConfig.apiKey);
      }
    }
    return settings;
  }

  public saveSettings(newSettings: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated: AppSettings = {
      ...current,
      ...newSettings,
      providers: {
        ...current.providers,
        ...(newSettings.providers || {}),
      },
      tray: {
        ...current.tray,
        ...(newSettings.tray || {}),
      },
      terminal: {
        ...current.terminal,
        ...(newSettings.terminal || {}),
      },
    };

    // Encrypt API keys before writing to disk
    const storedSettings = JSON.parse(JSON.stringify(updated)) as AppSettings;
    for (const p of Object.keys(storedSettings.providers) as AIProviderName[]) {
      const pConfig = storedSettings.providers[p];
      if (pConfig && pConfig.apiKey) {
        pConfig.apiKey = CryptoVault.encrypt(pConfig.apiKey);
      }
    }

    this.data.settings = storedSettings;
    this.saveDatabase();
    return updated;
  }
}
