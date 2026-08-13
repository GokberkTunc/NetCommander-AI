export type ProtocolType = 'ssh' | 'telnet';

export type AuthType = 'password' | 'privateKey' | 'none';

export type DeviceCategory = 'openwrt' | 'raspberrypi' | 'linux_server' | 'router' | 'custom';

export type LanguageType = 'tr' | 'en';

export type ExecutionModeType = 'autonomous' | 'copilot' | 'advisory';

export type AIProviderType =
  | 'google_web_session'
  | 'lmstudio'
  | 'ollama'
  | 'custom_openai'
  | 'gemini'
  | 'deepseek'
  | 'groq'
  | 'openrouter'
  | 'openai'
  | 'anthropic'
  | 'mistral';

export type AIProviderName = AIProviderType;

export interface DeviceConnectionConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: ProtocolType;
  authType: AuthType;
  username: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
  tags?: string[];
  category?: DeviceCategory;
  lastConnected?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NetworkInterfaceInfo {
  name: string;
  ip4?: string;
  mac?: string;
  type?: string;
  status?: string;
}

export interface StorageDiskInfo {
  filesystem: string;
  size: string;
  used: string;
  available: string;
  usePercent: string;
  mount: string;
}

export interface DeviceBlueprint {
  deviceId: string;
  scannedAt: string;
  hostname: string;
  os: string;
  distro: string;
  kernel: string;
  architecture: string;
  cpuModel: string;
  cpuCores: number;
  ramTotalMb: number;
  ramFreeMb: number;
  disks: StorageDiskInfo[];
  networkInterfaces: NetworkInterfaceInfo[];
  isOpenWrt: boolean;
  openWrtVersion?: string;
  summary: string;
  openWrtConfigs?: {
    system?: string;
    network?: string;
    wireless?: string;
    firewall?: string;
  };
}

export interface MemoryLogEntry {
  id: string;
  deviceId: string;
  timestamp: string;
  action: string;
  resultSummary?: string;
  commandExecuted?: string;
}

export interface DeviceMemoryLog {
  id: string;
  deviceId: string;
  timestamp: string;
  eventType: 'scan' | 'command_execution' | 'config_change' | 'diagnostic';
  title: string;
  content: string;
}

export interface SFTPFileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  type?: 'd' | '-' | 'l';
  size: number;
  modifyTime: number;
  accessTime?: number;
  permissions?: string;
  owner?: number;
  group?: number;
}

export interface AIProviderConfig {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  customEndpoint?: string;
  enabled?: boolean;
  autoApproveSafeCommands?: boolean;
  temperature?: number;
  provider?: string;
}

export interface AppSettings {
  language: LanguageType;
  executionMode: ExecutionModeType;
  activeProvider: AIProviderType;
  providers: Record<string, AIProviderConfig>;
  tray: {
    closeToTray: boolean;
    minimizeToTray: boolean;
    startMinimized?: boolean;
    showNotifications?: boolean;
  };
  terminal: {
    theme: string;
    fontSize: number;
    fontFamily: string;
    cursorBlink?: boolean;
    scrollback?: number;
  };
}

export interface ChatMessage {
  id: string;
  deviceId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  commandSuggestion?: {
    command: string;
    description: string;
    isDangerous: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
  };
}
