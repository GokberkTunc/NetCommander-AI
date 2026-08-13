import { DbStore } from '../storage/db_store.js';
import { DeviceBlueprint, MemoryLogEntry, DeviceConnectionConfig } from '../storage/models.js';

export class MemoryManager {
  private dbStore: DbStore;

  constructor(dbStore?: DbStore) {
    this.dbStore = dbStore || DbStore.getInstance();
  }

  /**
   * Build contextual system prompt for the AI Agent
   */
  public buildContextPrompt(
    activeDevice?: DeviceConnectionConfig | null,
    terminalContext?: string
  ): string {
    let context = `Sen NetCommander AI adında, Linux, OpenWrt, Raspberry Pi ve ağ cihazları konusunda uzmanlaşmış bir Sistem Yöneticisi ve Ağ Asistanısın.\n`;
    context += `Kullanıcıyla birlikte çalışan bir terminal arkadaşısın. Hem Türkçe hem İngilizceye hakimsin ve açıklamalarını net, teknik açıdan doğru, güvenli ve sade yaparsın.\n\n`;

    if (activeDevice) {
      context += `### BAĞLI AKTİF CİHAZ BİLGİLERİ:\n`;
      context += `- Cihaz Adı: ${activeDevice.name}\n`;
      context += `- Protokol: ${activeDevice.protocol.toUpperCase()}\n`;
      context += `- Host/IP: ${activeDevice.host}:${activeDevice.port}\n`;
      context += `- Kullanıcı: ${activeDevice.username}\n`;
      if (activeDevice.tags && activeDevice.tags.length > 0) {
        context += `- Etiketler: ${activeDevice.tags.join(', ')}\n`;
      }

      // Check for saved blueprint in memory
      const blueprint: DeviceBlueprint | undefined = this.dbStore.getBlueprint(activeDevice.id);
      if (blueprint) {
        context += `\n### CİHAZ PROFİLİ VE DONANIM BİLGİLERİ (HAFIZADAN):\n`;
        context += `- Dağıtım / OS: ${blueprint.distro} (${blueprint.architecture}) - Kernel: ${blueprint.kernel}\n`;
        context += `- Hostname: ${blueprint.hostname}\n`;
        context += `- CPU: ${blueprint.cpuModel} (${blueprint.cpuCores} Çekirdek)\n`;
        context += `- RAM: ${blueprint.ramTotalMb} MB (Kullanılabilir: ${blueprint.ramFreeMb} MB)\n`;
        if (blueprint.isOpenWrt) {
          context += `- OpenWrt Sürümü: ${blueprint.openWrtVersion || 'Mevcut'}\n`;
          if (blueprint.openWrtConfigs?.wireless) {
            context += `- Kablosuz Yapılandırma Özeti: Mevcut (UCI)\n`;
          }
        }

        if (blueprint.networkInterfaces && blueprint.networkInterfaces.length > 0) {
          context += `- Ağ Arayüzleri: ${blueprint.networkInterfaces.map((n) => `${n.name} (${n.ip4 || 'No IP'})`).join(', ')}\n`;
        }

        if (blueprint.disks && blueprint.disks.length > 0) {
          context += `- Disk Bölümleri: ${blueprint.disks.map((d) => `${d.mount}: ${d.used}/${d.size} (${d.usePercent})`).join(', ')}\n`;
        }
      } else {
        context += `\n(Not: Bu cihaz için henüz "Cihazı Tanı" taraması yapılmadı.)\n`;
      }

      // Past memory logs
      const logs: MemoryLogEntry[] = this.dbStore.getMemoryLogs(activeDevice.id);
      if (logs && logs.length > 0) {
        context += `\n### BU CİHAZDA DAHA ÖNCE YAPILAN İŞLEMLER (HAFIZA):\n`;
        for (const log of logs.slice(0, 5)) {
          context += `- [${new Date(log.timestamp).toLocaleDateString()}] ${log.action}: ${log.commandExecuted || ''} -> ${log.resultSummary || ''}\n`;
        }
      }
    } else {
      context += `(Şu anda herhangi bir aktif SSH/Telnet cihazına bağlı değilsin. Genel ağ/sistem sorularını yanıtlayabilirsin.)\n`;
    }

    if (terminalContext && terminalContext.trim().length > 0) {
      context += `\n### CANLI TERMİNAL ÇIKTISI (SON AKAN VERİLER):\n\`\`\`\n${terminalContext.slice(-2500)}\n\`\`\`\n`;
    }

    context += `\n### KRİTİK KOMUT FORMATI VE YANIT KURALLARI:\n`;
    context += `1. Kullanıcının isteğini yerine getirecek veya bilgi toplayacak bir komut öneriyorsan, bu komutu MUTLAKA şu formatta ver:\n`;
    context += `[KOMUT] çalıştırılacak_komut [/KOMUT]\n`;
    context += `Ayrıca komutu markdown \`\`\`bash bloğu içine de koyabilirsin.\n`;
    context += `Örnek:\n`;
    context += `[KOMUT] uptime && uptime -s 2>/dev/null || busybox uptime [/KOMUT]\n\n`;
    context += `2. Bu etiket sayesinde NetCommander uygulaması komutu otomatik olarak algılayıp kullanıcının terminaline doğrudan gönderecektir.\n`;
    context += `3. Tehlikeli veya sistemi durdurabilecek komutlar (rm -rf, reboot, mkfs, dd, iptables -F, uci commit && reload) konusunda kullanıcıyı mutlaka uyar.\n`;
    context += `4. Cevapların doğrudan konuya odaklı, profesyonel ve sade olsun.\n`;

    return context;
  }
}
