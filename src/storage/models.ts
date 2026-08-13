export type ProtocolType = 'ssh' | 'telnet';

export type AuthType = 'password' | 'privateKey' | 'none';

export type DeviceCategory = 'openwrt' | 'raspberrypi' | 'linux_server' | 'router' | 'custom';

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
  openWrtConfigs?: {
    system?: string;
    network?: string;
    wireless?: string;
  };
  runningServices?: string[];
  installedPackagesCount?: number;
  summary: string;
}

export interface MemoryLogEntry {
  id: string;
  deviceId: string;
  timestamp: string;
  action: string;
  commandExecuted?: string;
  resultSummary?: string;
  aiNotes?: string;
}

export type AIProviderName = 'openai' | 'anthropic' | 'gemini' | 'google_web_session' | 'lmstudio';

export interface AIProviderConfig {
  provider: AIProviderName;
  apiKey?: string;
  model: string;
  customEndpoint?: string;
  enabled: boolean;
  autoApproveSafeCommands: boolean;
  temperature?: number;
}

export interface AppSettings {
  activeProvider: AIProviderName;
  providers: Record<AIProviderName, AIProviderConfig>;
  tray: {
    minimizeToTray: boolean;
    closeToTray: boolean;
    showNotifications: boolean;
  };
  terminal: {
    fontSize: number;
    fontFamily: string;
    theme: 'retro-dark' | 'retro-amber' | 'retro-matrix' | 'classic-light';
    cursorBlink: boolean;
    scrollback: number;
  };
  masterPasswordHash?: string;
  masterSalt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  deviceId?: string;
  commandSuggestion?: {
    command: string;
    description: string;
    isDangerous: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
    output?: string;
  };
}

export interface SFTPFileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifyTime: number;
  accessTime: number;
  permissions: string;
  owner?: number;
  group?: number;
}
