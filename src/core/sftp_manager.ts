import { SFTPWrapper } from 'ssh2';
import * as fs from 'fs';
import { SFTPFileItem } from '../storage/models.js';
import { SSHClient } from './ssh_client.js';

export class SFTPManager {
  private sftp: SFTPWrapper | null = null;
  private sshClient: SSHClient | null = null;

  constructor(sftp: SFTPWrapper | null = null, sshClient: SSHClient | null = null) {
    this.sftp = sftp;
    this.sshClient = sshClient;
  }

  public setSFTP(sftp: SFTPWrapper | null): void {
    this.sftp = sftp;
  }

  public setSSHClient(sshClient: SSHClient | null): void {
    this.sshClient = sshClient;
  }

  /**
   * Format POSIX numeric permissions mode (e.g. 33188 -> -rw-r--r--)
   */
  private formatPermissions(mode: number): string {
    const isDir = (mode & 0o40000) === 0o40000;
    const isLink = (mode & 0o120000) === 0o120000;
    const type = isDir ? 'd' : (isLink ? 'l' : '-');

    const flags = [
      (mode & 0o400) ? 'r' : '-',
      (mode & 0o200) ? 'w' : '-',
      (mode & 0o100) ? 'x' : '-',
      (mode & 0o40) ? 'r' : '-',
      (mode & 0o20) ? 'w' : '-',
      (mode & 0o10) ? 'x' : '-',
      (mode & 0o4) ? 'r' : '-',
      (mode & 0o2) ? 'w' : '-',
      (mode & 0o1) ? 'x' : '-',
    ].join('');

    return type + flags;
  }

  /**
   * List files and folders in a remote directory
   * Uses Native SFTP when available, falls back to SSH Shell command on OpenWrt/Dropbear
   */
  public async listDir(remotePath: string = '/'): Promise<SFTPFileItem[]> {
    const cleanPath = remotePath.replace(/\\/g, '/') || '/';

    // 1. Try Native SFTP if initialized
    if (this.sftp) {
      try {
        return await new Promise<SFTPFileItem[]>((resolve, reject) => {
          this.sftp!.readdir(cleanPath, (err, list) => {
            if (err) return reject(err);

            const items: SFTPFileItem[] = list.map((item) => {
              const isDirectory = (item.attrs.mode & 0o40000) === 0o40000;
              const fullItemPath = cleanPath.endsWith('/')
                ? `${cleanPath}${item.filename}`
                : `${cleanPath}/${item.filename}`;

              return {
                name: item.filename,
                path: fullItemPath,
                isDirectory,
                size: item.attrs.size || 0,
                modifyTime: (item.attrs.mtime || 0) * 1000,
                accessTime: (item.attrs.atime || 0) * 1000,
                permissions: this.formatPermissions(item.attrs.mode || 0),
                owner: item.attrs.uid,
                group: item.attrs.gid,
              };
            });

            items.sort((a, b) => {
              if (a.isDirectory && !b.isDirectory) return -1;
              if (!a.isDirectory && b.isDirectory) return 1;
              return a.name.localeCompare(b.name);
            });

            resolve(items);
          });
        });
      } catch (sftpErr) {
        console.warn('Native SFTP readdir failed, switching to SSH shell fallback:', sftpErr);
      }
    }

    // 2. SSH Shell Fallback (Works on Dropbear / OpenWrt / BusyBox / Minimal Linux)
    if (this.sshClient && this.sshClient.getIsConnected()) {
      return await this.listDirViaShell(cleanPath);
    }

    throw new Error('Dosya Gezgini için aktif bir SSH bağlantısı bulunamadı. Lütfen önce bir cihaza bağlanın.');
  }

  private async listDirViaShell(cleanPath: string): Promise<SFTPFileItem[]> {
    // Run ls -la
    const cmd = `ls -la --time-style=+%s "${cleanPath}" 2>/dev/null || ls -la "${cleanPath}" 2>/dev/null`;
    const res = await this.sshClient!.execCommand(cmd);

    if (res.code !== 0 && res.stderr) {
      throw new Error(`Dizin listelenemedi: ${res.stderr}`);
    }

    const lines = res.stdout.split('\n').filter((l) => l.trim().length > 0);
    const items: SFTPFileItem[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('total ') || trimmed.startsWith('toplam ')) continue;

      const parts = trimmed.split(/\s+/);
      if (parts.length < 8) continue;

      const permissions = parts[0];
      const isDirectory = permissions.startsWith('d');
      const size = parseInt(parts[4], 10) || 0;
      
      // Determine filename (could have spaces)
      let name = '';
      let mtime = Date.now();

      // Check if parts[5] is epoch timestamp (from --time-style=+%s)
      if (/^\d{9,12}$/.test(parts[5])) {
        mtime = parseInt(parts[5], 10) * 1000;
        name = parts.slice(6).join(' ');
      } else {
        name = parts.slice(8).join(' ');
      }

      if (name === '.' || name === '..' || !name) continue;

      // Handle symlink target display
      const cleanName = name.split(' -> ')[0];
      const fullItemPath = cleanPath.endsWith('/')
        ? `${cleanPath}${cleanName}`
        : `${cleanPath}/${cleanName}`;

      items.push({
        name: cleanName,
        path: fullItemPath,
        isDirectory,
        size,
        modifyTime: mtime,
        accessTime: mtime,
        permissions,
      });
    }

    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return items;
  }

  /**
   * Read remote file content as UTF-8 string (for configuration editing)
   */
  public async readFileText(remoteFilePath: string, maxBytes: number = 2 * 1024 * 1024): Promise<string> {
    const cleanPath = remoteFilePath.replace(/\\/g, '/');

    if (this.sftp) {
      try {
        return await new Promise<string>((resolve, reject) => {
          this.sftp!.stat(cleanPath, (err, stats) => {
            if (err) return reject(err);
            if (stats.size > maxBytes) {
              return reject(new Error(`Dosya boyutu (${(stats.size / 1024 / 1024).toFixed(2)} MB) maksimum düzenleme sınırını (2 MB) aşıyor.`));
            }

            const chunks: Buffer[] = [];
            const stream = this.sftp!.createReadStream(cleanPath);

            stream.on('data', (chunk: Buffer) => chunks.push(chunk));
            stream.on('error', (streamErr: any) => reject(streamErr));
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
          });
        });
      } catch (sftpErr) {
        console.warn('Native SFTP read failed, falling back to shell cat:', sftpErr);
      }
    }

    if (this.sshClient && this.sshClient.getIsConnected()) {
      const res = await this.sshClient.execCommand(`cat "${cleanPath}"`);
      if (res.code === 0) {
        return res.stdout;
      }
      throw new Error(`Dosya okunamadı: ${res.stderr}`);
    }

    throw new Error('Aktif bir SSH bağlantısı bulunamadı.');
  }

  /**
   * Write text content to a remote file (for saving edited configs)
   */
  public async writeFileText(remoteFilePath: string, content: string): Promise<void> {
    const cleanPath = remoteFilePath.replace(/\\/g, '/');

    if (this.sftp) {
      try {
        await new Promise<void>((resolve, reject) => {
          const stream = this.sftp!.createWriteStream(cleanPath, { encoding: 'utf8', mode: 0o644 });
          stream.on('error', (err: any) => reject(err));
          stream.on('finish', () => resolve());
          stream.write(content);
          stream.end();
        });
        return;
      } catch (sftpErr) {
        console.warn('Native SFTP write failed, falling back to shell:', sftpErr);
      }
    }

    if (this.sshClient && this.sshClient.getIsConnected()) {
      // Safe base64 write to prevent shell escaping corruption
      const base64Data = Buffer.from(content, 'utf8').toString('base64');
      const cmd = `echo "${base64Data}" | base64 -d > "${cleanPath}" || cat << 'NETCOMMANDER_EOF' > "${cleanPath}"\n${content}\nNETCOMMANDER_EOF`;
      const res = await this.sshClient.execCommand(cmd);
      if (res.code === 0) {
        return;
      }
      throw new Error(`Dosya kaydedilemedi: ${res.stderr}`);
    }

    throw new Error('Aktif bir SSH bağlantısı bulunamadı.');
  }

  /**
   * Download a remote file to local computer
   */
  public async downloadFile(
    remotePath: string,
    localDestPath: string,
    onProgress?: (transferred: number, total: number) => void
  ): Promise<void> {
    const cleanRemote = remotePath.replace(/\\/g, '/');

    if (this.sftp) {
      try {
        await new Promise<void>((resolve, reject) => {
          this.sftp!.fastGet(
            cleanRemote,
            localDestPath,
            {
              step: (total_transferred, chunk, total) => {
                if (onProgress) onProgress(total_transferred, total);
              },
            },
            (err) => {
              if (err) return reject(err);
              resolve();
            }
          );
        });
        return;
      } catch (sftpErr) {
        console.warn('Native SFTP fastGet failed, falling back to shell cat:', sftpErr);
      }
    }

    if (this.sshClient && this.sshClient.getIsConnected()) {
      const res = await this.sshClient.execCommand(`cat "${cleanRemote}"`);
      if (res.code === 0) {
        fs.writeFileSync(localDestPath, res.stdout, 'utf8');
        return;
      }
      throw new Error(`İndirme başarısız: ${res.stderr}`);
    }

    throw new Error('Aktif bir SSH bağlantısı bulunamadı.');
  }

  /**
   * Upload a local file to remote device
   */
  public async uploadFile(
    localSrcPath: string,
    remoteDestPath: string,
    onProgress?: (transferred: number, total: number) => void
  ): Promise<void> {
    const cleanRemote = remoteDestPath.replace(/\\/g, '/');

    if (this.sftp) {
      try {
        await new Promise<void>((resolve, reject) => {
          this.sftp!.fastPut(
            localSrcPath,
            cleanRemote,
            {
              step: (total_transferred, chunk, total) => {
                if (onProgress) onProgress(total_transferred, total);
              },
            },
            (err) => {
              if (err) return reject(err);
              resolve();
            }
          );
        });
        return;
      } catch (sftpErr) {
        console.warn('Native SFTP fastPut failed, falling back to shell base64 upload:', sftpErr);
      }
    }

    if (this.sshClient && this.sshClient.getIsConnected()) {
      const fileBuffer = fs.readFileSync(localSrcPath);
      const base64Data = fileBuffer.toString('base64');
      const cmd = `echo "${base64Data}" | base64 -d > "${cleanRemote}"`;
      const res = await this.sshClient.execCommand(cmd);
      if (res.code === 0) {
        return;
      }
      throw new Error(`Yükleme başarısız: ${res.stderr}`);
    }

    throw new Error('Aktif bir SSH bağlantısı bulunamadı.');
  }

  public async mkdir(remotePath: string): Promise<void> {
    const cleanPath = remotePath.replace(/\\/g, '/');
    if (this.sftp) {
      try {
        await new Promise<void>((resolve, reject) => {
          this.sftp!.mkdir(cleanPath, (err) => (err ? reject(err) : resolve()));
        });
        return;
      } catch {}
    }

    if (this.sshClient && this.sshClient.getIsConnected()) {
      const res = await this.sshClient.execCommand(`mkdir -p "${cleanPath}"`);
      if (res.code === 0) return;
      throw new Error(res.stderr);
    }
  }

  public async unlink(remotePath: string): Promise<void> {
    const cleanPath = remotePath.replace(/\\/g, '/');
    if (this.sftp) {
      try {
        await new Promise<void>((resolve, reject) => {
          this.sftp!.unlink(cleanPath, (err) => (err ? reject(err) : resolve()));
        });
        return;
      } catch {}
    }

    if (this.sshClient && this.sshClient.getIsConnected()) {
      const res = await this.sshClient.execCommand(`rm -f "${cleanPath}"`);
      if (res.code === 0) return;
      throw new Error(res.stderr);
    }
  }

  public async rmdir(remotePath: string): Promise<void> {
    const cleanPath = remotePath.replace(/\\/g, '/');
    if (this.sftp) {
      try {
        await new Promise<void>((resolve, reject) => {
          this.sftp!.rmdir(cleanPath, (err) => (err ? reject(err) : resolve()));
        });
        return;
      } catch {}
    }

    if (this.sshClient && this.sshClient.getIsConnected()) {
      const res = await this.sshClient.execCommand(`rm -rf "${cleanPath}"`);
      if (res.code === 0) return;
      throw new Error(res.stderr);
    }
  }

  public async rename(oldPath: string, newPath: string): Promise<void> {
    const cleanOld = oldPath.replace(/\\/g, '/');
    const cleanNew = newPath.replace(/\\/g, '/');
    if (this.sftp) {
      try {
        await new Promise<void>((resolve, reject) => {
          this.sftp!.rename(cleanOld, cleanNew, (err) => (err ? reject(err) : resolve()));
        });
        return;
      } catch {}
    }

    if (this.sshClient && this.sshClient.getIsConnected()) {
      const res = await this.sshClient.execCommand(`mv "${cleanOld}" "${cleanNew}"`);
      if (res.code === 0) return;
      throw new Error(res.stderr);
    }
  }

  public async chmod(remotePath: string, mode: number): Promise<void> {
    const cleanPath = remotePath.replace(/\\/g, '/');
    if (this.sftp) {
      try {
        await new Promise<void>((resolve, reject) => {
          this.sftp!.chmod(cleanPath, mode, (err) => (err ? reject(err) : resolve()));
        });
        return;
      } catch {}
    }

    if (this.sshClient && this.sshClient.getIsConnected()) {
      const octal = (mode & 0o777).toString(8);
      const res = await this.sshClient.execCommand(`chmod ${octal} "${cleanPath}"`);
      if (res.code === 0) return;
      throw new Error(res.stderr);
    }
  }
}
