import { AIProviders } from './ai_providers.js';
import { MemoryManager } from './memory_manager.js';
import { TerminalObserver } from './terminal_observer.js';
import { DbStore } from '../storage/db_store.js';
import { ProtocolManager } from '../core/protocol_manager.js';
import { ChatMessage, AIProviderConfig } from '../storage/models.js';
import { Logger } from '../storage/logger.js';

export class AgentBrain {
  private static instance: AgentBrain;
  private memoryManager: MemoryManager;
  private terminalObserver: TerminalObserver;
  private dbStore: DbStore;
  private protocolManager: ProtocolManager;

  private constructor() {
    this.dbStore = DbStore.getInstance();
    this.memoryManager = new MemoryManager(this.dbStore);
    this.terminalObserver = TerminalObserver.getInstance();
    this.protocolManager = ProtocolManager.getInstance();
  }

  public static getInstance(): AgentBrain {
    if (!AgentBrain.instance) {
      AgentBrain.instance = new AgentBrain();
    }
    return AgentBrain.instance;
  }

  /**
   * Risk assessment heuristic for bash commands
   */
  public isDangerousCommand(command: string): boolean {
    const cmd = command.trim().toLowerCase();
    const dangerousPatterns = [
      /\brm\s+(-[rf]+|--recursive|--force)/,
      /\breboot\b/,
      /\bshutdown\b/,
      /\bpoweroff\b/,
      /\binit\s+0\b/,
      /\bmkfs\b/,
      /\bdd\s+if=/,
      /\bwipefs\b/,
      /\bfdisk\b/,
      /\bparted\b/,
      /\biptables\s+-F\b/,
      /\buci\s+commit\b/,
      /\bkill\s+-9\s+1\b/,
      /\bpasswd\b/,
      /\bchpasswd\b/,
      /\bformat\b/,
    ];

    return dangerousPatterns.some((pattern) => pattern.test(cmd));
  }

  /**
   * Multi-pattern command extractor supporting [KOMUT] tags, markdown, and Gemini Web plain text
   */
  public extractSuggestedCommand(responseText: string): { command: string; description: string; isDangerous: boolean } | undefined {
    if (!responseText) return undefined;

    // Pattern 1: Explicit [KOMUT]...[/KOMUT] or [EXEC]...[/EXEC]
    const tagMatch = responseText.match(/\[(?:KOMUT|EXEC)\]\s*([\s\S]*?)\s*\[\/(?:KOMUT|EXEC)\]/i);
    if (tagMatch && tagMatch[1]) {
      const rawCmd = tagMatch[1].trim();
      if (rawCmd && !rawCmd.startsWith('#')) {
        return {
          command: rawCmd,
          description: 'AI Ajanı tarafından önerilen komut',
          isDangerous: this.isDangerousCommand(rawCmd),
        };
      }
    }

    // Pattern 2: Markdown ```bash ... ```
    const bashMatch = responseText.match(/```(?:bash|sh|shell)?\s*\n([\s\S]*?)\n```/i);
    if (bashMatch && bashMatch[1]) {
      const rawCmd = bashMatch[1].trim();
      if (rawCmd && !rawCmd.startsWith('#') && rawCmd.split('\n').length <= 15) {
        return {
          command: rawCmd,
          description: 'AI Ajanı tarafından önerilen komut',
          isDangerous: this.isDangerousCommand(rawCmd),
        };
      }
    }

    // Pattern 3: Gemini Web Plain Text format "Bash\n<command>"
    const geminiPlainMatch = responseText.match(/(?:^|\n)(?:Bash|bash|Shell|shell|SH|sh)\s*\n+([\s\S]+?)(?=(?:\n\s*\n|\n[A-ZÇĞİÖŞÜa-zçğıöşü]+:|\n\[KOMUT\]|$))/);
    if (geminiPlainMatch && geminiPlainMatch[1]) {
      const rawCmd = geminiPlainMatch[1].trim();
      if (rawCmd && rawCmd.length > 2 && !rawCmd.startsWith('#') && !rawCmd.startsWith('Detaylar')) {
        return {
          command: rawCmd,
          description: 'AI Ajanı tarafından önerilen komut',
          isDangerous: this.isDangerousCommand(rawCmd),
        };
      }
    }

    // Pattern 4: Inline code `uptime ...` or single obvious command line
    const inlineMatch = responseText.match(/`((?:uptime|free|df|ip|ifconfig|uci|ps|top|dmesg|logread|cat|ls|ping|traceroute|iwinfo|echo)[^`]+)`/);
    if (inlineMatch && inlineMatch[1]) {
      const rawCmd = inlineMatch[1].trim();
      return {
        command: rawCmd,
        description: 'AI Ajanı tarafından önerilen komut',
        isDangerous: this.isDangerousCommand(rawCmd),
      };
    }

    return undefined;
  }

  /**
   * Process user chat message through active AI model
   */
  public async processUserMessage(userText: string): Promise<ChatMessage> {
    const logger = Logger.getInstance();
    const settings = this.dbStore.getSettings();
    const activeProviderName = settings.activeProvider;
    const providerConfig = settings.providers[activeProviderName];

    if (!providerConfig || (!providerConfig.apiKey && activeProviderName !== 'google_web_session' && activeProviderName !== 'lmstudio')) {
      throw new Error(`AI Sağlayıcısı (${activeProviderName}) için API anahtarı girilmemiş. Lütfen Ayarlar sekmesinden API anahtarınızı tanımlayın.`);
    }

    const activeDevice = this.protocolManager.getActiveConfig();
    const deviceId = activeDevice ? activeDevice.id : 'global';
    const terminalContext = this.terminalObserver.getTerminalContext(40);

    const systemPrompt = this.memoryManager.buildContextPrompt(activeDevice, terminalContext);
    const rawHistory = this.dbStore.getChatHistory(deviceId);
    const formattedHistory = rawHistory.map((m) => ({ role: m.role, content: m.content }));

    const rawResponse = await AIProviders.generateResponse(
      providerConfig,
      systemPrompt,
      userText,
      formattedHistory
    );

    const suggested = this.extractSuggestedCommand(rawResponse);
    let executionStatus: 'pending' | 'executed' | 'approved' | 'rejected' = 'pending';

    logger.info('AgentBrain', `AI Yanıtı alındı. Komut algılandı mı: ${suggested ? suggested.command : 'Hayır'}`);

    // Auto-execution logic (Auto-Pilot for safe commands)
    if (suggested && !suggested.isDangerous && providerConfig.autoApproveSafeCommands && this.protocolManager.isConnected()) {
      logger.info('AgentBrain', `[Auto-Pilot] Güvenli komut otomatik olarak terminale gönderiliyor: ${suggested.command}`);
      try {
        await this.executeCommand(suggested.command);
        executionStatus = 'executed';
      } catch (execErr) {
        logger.error('AgentBrain', 'Otomatik komut çalıştırma hatası', execErr);
      }
    }

    const assistantMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'assistant',
      content: rawResponse,
      timestamp: new Date().toISOString(),
      deviceId,
      commandSuggestion: suggested
        ? {
            command: suggested.command,
            description: suggested.description,
            isDangerous: suggested.isDangerous,
            status: executionStatus,
          }
        : undefined,
    };

    this.dbStore.saveChatMessage(assistantMsg, deviceId);
    return assistantMsg;
  }

  /**
   * Execute suggested command via terminal
   */
  public async executeCommand(command: string): Promise<void> {
    const logger = Logger.getInstance();
    if (!this.protocolManager.isConnected()) {
      logger.warn('AgentBrain', 'Komut çalıştırılamadı: Cihaz bağlantısı aktif değil.');
      throw new Error('Cihaz bağlantısı aktif değil. Lütfen önce Cihaz Yöneticisi sekmesinden cihazınıza bağlanın.');
    }

    logger.info('AgentBrain', `Terminalde komut çalıştırılıyor: ${command}`);
    // Write command directly to terminal stream with newline
    this.protocolManager.writeTerminal(command.trim() + '\r\n');

    // Record in memory log
    const activeDevice = this.protocolManager.getActiveConfig();
    if (activeDevice) {
      this.dbStore.addMemoryLog({
        id: 'mem_' + Date.now(),
        deviceId: activeDevice.id,
        timestamp: new Date().toISOString(),
        action: 'Komut Çalıştırıldı',
        commandExecuted: command,
        resultSummary: 'Terminale gönderildi',
      });
    }
  }
}
