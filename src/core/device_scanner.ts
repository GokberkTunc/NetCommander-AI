import { SSHClient } from './ssh_client.js';
import { DeviceBlueprint, NetworkInterfaceInfo, StorageDiskInfo } from '../storage/models.js';

export class DeviceScanner {
  private sshClient: SSHClient;

  constructor(sshClient: SSHClient) {
    this.sshClient = sshClient;
  }

  /**
   * Run comprehensive automated discovery and deep diagnostic probe on connected remote device
   */
  public async scanDevice(
    deviceId: string,
    onProgress?: (step: string, percent: number) => void
  ): Promise<DeviceBlueprint> {
    if (!this.sshClient.getIsConnected()) {
      throw new Error('Cihaz SSH ile bağlı değil. Lütfen önce bağlanın.');
    }

    if (onProgress) onProgress('İşletim sistemi, çekirdek ve sürüm bilgileri alınıyor...', 10);
    const unameRes = await this.sshClient.execCommand('uname -a');
    const osReleaseRes = await this.sshClient.execCommand(
      'cat /etc/os-release 2>/dev/null || cat /etc/openwrt_release 2>/dev/null || cat /etc/issue 2>/dev/null'
    );
    const hostnameRes = await this.sshClient.execCommand('hostname 2>/dev/null || cat /proc/sys/kernel/hostname');
    const uptimeRes = await this.sshClient.execCommand('uptime 2>/dev/null || cat /proc/uptime');

    if (onProgress) onProgress('İşlemci mimarisi, çekirdekler ve frekans durumu taranıyor...', 25);
    const cpuinfoRes = await this.sshClient.execCommand(
      "cat /proc/cpuinfo 2>/dev/null | grep -E 'model name|system type|Hardware|Processor|cpu model|BogoMIPS|cpu MHz' | head -n 8"
    );
    const cpuCoresRes = await this.sshClient.execCommand('grep -c ^processor /proc/cpuinfo 2>/dev/null || echo 1');

    if (onProgress) onProgress('Bellek (RAM & Swap) dağılımı sorgulanıyor...', 40);
    const meminfoRes = await this.sshClient.execCommand('cat /proc/meminfo 2>/dev/null || free -m');

    if (onProgress) onProgress('Disk bölümleri, Flash MTD yerleşimi ve mount noktaları kontrol ediliyor...', 55);
    const dfRes = await this.sshClient.execCommand('df -h 2>/dev/null');
    const mtdRes = await this.sshClient.execCommand('cat /proc/mtd 2>/dev/null || echo "No MTD"');

    if (onProgress) onProgress('Ağ arayüzleri, IP/IPv6 adresleri ve yönlendirme tablosu alınıyor...', 70);
    const ipAddrRes = await this.sshClient.execCommand('ip -brief addr 2>/dev/null || ifconfig -a 2>/dev/null');
    const ipRouteRes = await this.sshClient.execCommand('ip route 2>/dev/null || route -n 2>/dev/null');
    const ip6RouteRes = await this.sshClient.execCommand('ip -6 route 2>/dev/null');

    if (onProgress) onProgress('OpenWrt Ubus, WiFi Radyoları ve Güvenlik Duvarı taranıyor...', 85);
    const ubusBoardRes = await this.sshClient.execCommand('which ubus >/dev/null 2>&1 && ubus call system board 2>/dev/null');
    const ubusInfoRes = await this.sshClient.execCommand('which ubus >/dev/null 2>&1 && ubus call system info 2>/dev/null');
    const wifiInfoRes = await this.sshClient.execCommand('which iwinfo >/dev/null 2>&1 && (iwinfo wl0 info || iwinfo ra0 info || iwinfo wlan0 info || iwinfo phy0-ap0 info) 2>/dev/null');
    const wifiAssocRes = await this.sshClient.execCommand('which iwinfo >/dev/null 2>&1 && (iwinfo wl0 assoclist || iwinfo ra0 assoclist || iwinfo wlan0 assoclist) 2>/dev/null');
    const portsRes = await this.sshClient.execCommand('netstat -tuln 2>/dev/null || ss -tuln 2>/dev/null');
    const psRes = await this.sshClient.execCommand('ps w 2>/dev/null | head -n 30 || ps 2>/dev/null | head -n 30');
    const pkgCountRes = await this.sshClient.execCommand(
      'opkg list-installed 2>/dev/null | wc -l || dpkg -l 2>/dev/null | grep -c "^ii" || apk list -I 2>/dev/null | wc -l || echo 0'
    );

    if (onProgress) onProgress('Derinlemesine cihaz hafızası ve teşhis profili oluşturuluyor...', 95);

    // Parse OS & Distro
    const uname = unameRes.stdout.trim();
    const osRelease = osReleaseRes.stdout;
    const hostname = hostnameRes.stdout.trim() || 'unknown-host';

    let distro = 'Linux';
    let isOpenWrt = false;
    let openWrtVersion = '';

    if (osRelease.includes('OpenWrt') || uname.includes('OpenWrt') || ubusBoardRes.stdout.includes('OpenWrt')) {
      isOpenWrt = true;
      distro = 'OpenWrt';
      const verMatch = osRelease.match(/DISTRIB_RELEASE=['"]?([^'"\n]+)/i) || osRelease.match(/PRETTY_NAME=['"]?([^'"\n]+)/i);
      if (verMatch) openWrtVersion = verMatch[1];
    } else if (osRelease.includes('Raspbian') || osRelease.includes('Raspberry')) {
      distro = 'Raspberry Pi OS';
    } else if (osRelease.includes('Ubuntu')) {
      distro = 'Ubuntu';
    } else if (osRelease.includes('Debian')) {
      distro = 'Debian';
    } else if (osRelease.includes('Alpine')) {
      distro = 'Alpine Linux';
    }

    // Architecture & Kernel
    const archMatch = uname.match(/(x86_64|aarch64|armv\d+l?|mips\w*|i\d86)/i);
    const architecture = archMatch ? archMatch[1] : 'unknown-arch';
    const kernelMatch = uname.match(/Linux\s+[^\s]+\s+([^\s]+)/);
    const kernel = kernelMatch ? kernelMatch[1] : uname.split(' ')[2] || 'unknown-kernel';

    // CPU Model & Cores
    const cpuInfo = cpuinfoRes.stdout;
    let cpuModel = 'Bilinmeyen İşlemci';
    const modelMatch = cpuInfo.match(/(?:model name|system type|Hardware|Processor|cpu model)\s*:\s*([^\n]+)/i);
    if (modelMatch) cpuModel = modelMatch[1].trim();
    const cpuCores = parseInt(cpuCoresRes.stdout.trim(), 10) || 1;

    // RAM Parsing
    let ramTotalMb = 0;
    let ramFreeMb = 0;
    const memTotalMatch = meminfoRes.stdout.match(/MemTotal:\s*(\d+)\s*kB/i);
    const memAvailMatch = meminfoRes.stdout.match(/MemAvailable:\s*(\d+)\s*kB/i) || meminfoRes.stdout.match(/MemFree:\s*(\d+)\s*kB/i);
    if (memTotalMatch) {
      ramTotalMb = Math.round(parseInt(memTotalMatch[1], 10) / 1024);
    }
    if (memAvailMatch) {
      ramFreeMb = Math.round(parseInt(memAvailMatch[1], 10) / 1024);
    }

    // Storage / Disks Parsing
    const disks: StorageDiskInfo[] = [];
    const dfLines = dfRes.stdout.split('\n');
    for (const line of dfLines.slice(1)) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 6) {
        disks.push({
          filesystem: parts[0],
          size: parts[1],
          used: parts[2],
          available: parts[3],
          usePercent: parts[4],
          mount: parts[5],
        });
      }
    }

    // Network Interfaces Parsing
    const networkInterfaces: NetworkInterfaceInfo[] = [];
    const ipLines = ipAddrRes.stdout.split('\n');
    for (const line of ipLines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const name = parts[0];
        const status = parts[1] || 'UNKNOWN';
        const ip4 = parts[2] ? parts[2].split('/')[0] : undefined;
        networkInterfaces.push({ name, status, ip4 });
      }
    }

    // Package count
    const installedPackagesCount = parseInt(pkgCountRes.stdout.trim(), 10) || 0;

    // Summary Formulation
    let summary = `${distro} (${architecture}) - Kernel: ${kernel} - Hostname: ${hostname}. `;
    summary += `CPU: ${cpuModel} (${cpuCores} Çekirdek). `;
    summary += `RAM: ${ramTotalMb} MB (Boş: ${ramFreeMb} MB). `;
    if (networkInterfaces.length > 0) {
      summary += `Arayüzler: ${networkInterfaces.map((n) => `${n.name}${n.ip4 ? ` [${n.ip4}]` : ''}`).join(', ')}. `;
    }
    if (installedPackagesCount > 0) {
      summary += `Yüklü Paket Sayısı: ${installedPackagesCount}. `;
    }
    if (wifiInfoRes.stdout.trim().length > 10) {
      summary += `WiFi / Kablosuz Donanım: Aktif. `;
    }

    const blueprint: DeviceBlueprint = {
      deviceId,
      scannedAt: new Date().toISOString(),
      hostname,
      os: distro,
      distro,
      kernel,
      architecture,
      cpuModel,
      cpuCores,
      ramTotalMb,
      ramFreeMb,
      disks,
      networkInterfaces,
      isOpenWrt,
      openWrtVersion,
      summary,
      openWrtConfigs: {
        system: ubusBoardRes.stdout ? `UBUS Board: ${ubusBoardRes.stdout}\nUBUS Info: ${ubusInfoRes.stdout}` : undefined,
        wireless: wifiInfoRes.stdout ? `WiFi Info:\n${wifiInfoRes.stdout}\nWiFi Clients:\n${wifiAssocRes.stdout}` : undefined,
        network: `Route Table:\n${ipRouteRes.stdout}\nIPv6 Route:\n${ip6RouteRes.stdout}\nPorts:\n${portsRes.stdout}`,
      },
    };

    return blueprint;
  }
}
