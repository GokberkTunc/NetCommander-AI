// Standalone File Explorer Controller with Complete i18n
class FilesStandaloneController {
  constructor() {
    this.currentPath = '/';
    this.tableBody = document.getElementById('sftp-files-tbody');
    this.pathInput = document.getElementById('sftp-current-path');
    this.deviceBadge = document.getElementById('files-active-device-badge');

    this.init();
  }

  async init() {
    if (window.i18n) {
      await window.i18n.init();
    }
    this.bindEvents();
    this.checkActiveDeviceAndLoad();
  }

  bindEvents() {
    document.getElementById('btn-sftp-refresh')?.addEventListener('click', () => {
      this.loadDirectory(this.currentPath);
    });

    document.getElementById('btn-sftp-up')?.addEventListener('click', () => {
      this.goUpDirectory();
    });

    document.getElementById('btn-sftp-go')?.addEventListener('click', () => {
      const p = this.pathInput.value.trim() || '/';
      this.loadDirectory(p);
    });

    this.pathInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.loadDirectory(this.pathInput.value.trim() || '/');
      }
    });

    // Quick access path buttons
    document.querySelectorAll('.quick-path-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-path');
        if (p) this.loadDirectory(p);
      });
    });

    // New folder
    document.getElementById('btn-sftp-mkdir')?.addEventListener('click', async () => {
      const promptText = window.i18n ? window.i18n.t('prompt_new_folder') : 'Yeni klasör adı:';
      const name = prompt(promptText);
      if (name) {
        const newPath = (this.currentPath.endsWith('/') ? this.currentPath : this.currentPath + '/') + name;
        try {
          await window.api.createSFTPDir(newPath);
          this.loadDirectory(this.currentPath);
        } catch (err) {
          alert('Error: ' + err.message);
        }
      }
    });

    // New file
    document.getElementById('btn-sftp-newfile')?.addEventListener('click', async () => {
      const name = prompt(window.i18n && window.i18n.currentLang === 'en' ? 'New file name:' : 'Yeni Dosya Adı:');
      if (name) {
        const newPath = (this.currentPath.endsWith('/') ? this.currentPath : this.currentPath + '/') + name;
        try {
          await window.api.writeSFTPFile(newPath, '');
          this.loadDirectory(this.currentPath);
        } catch (err) {
          alert('Error: ' + err.message);
        }
      }
    });

    // Upload file
    document.getElementById('btn-sftp-upload')?.addEventListener('click', async () => {
      try {
        const result = await window.api.uploadSFTP(this.currentPath);
        if (result && result.success) {
          this.loadDirectory(this.currentPath);
        }
      } catch (err) {
        alert('Upload Error: ' + err.message);
      }
    });

    // Editor close
    document.querySelectorAll('.btn-close-editor').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.getElementById('modal-file-editor')?.classList.remove('active');
      });
    });

    // Save editor content
    document.getElementById('btn-save-remote-file')?.addEventListener('click', async () => {
      const filePath = this.editingPath;
      const content = document.getElementById('remote-file-editor-text')?.value;
      if (!filePath) return;

      try {
        await window.api.writeSFTPFile(filePath, content);
        alert(window.i18n ? window.i18n.t('msg_file_saved') : '✓ Dosya başarıyla kaydedildi.');
        document.getElementById('modal-file-editor')?.classList.remove('active');
        this.loadDirectory(this.currentPath);
      } catch (err) {
        alert('Save Error: ' + err.message);
      }
    });
  }

  async checkActiveDeviceAndLoad() {
    try {
      const dev = await window.api.getActiveDevice();
      if (dev) {
        if (this.deviceBadge) {
          this.deviceBadge.textContent = `${dev.name} (${dev.host})`;
        }
        this.loadDirectory('/');
      } else {
        if (this.deviceBadge) {
          this.deviceBadge.textContent = window.i18n ? window.i18n.t('no_connection') : 'Bağlı Cihaz Yok';
        }
        this.tableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; color: var(--accent-amber); padding: 36px;">
              ⚠️ ${window.i18n && window.i18n.currentLang === 'en' ? 'No active device connection found. Please connect to a device on the main screen or in Settings.' : 'Aktif bir cihaz bağlantısı bulunamadı. Lütfen ana ekrandan veya Ayarlar\'dan bir cihaza bağlanın.'}
            </td>
          </tr>
        `;
      }
    } catch (err) {
      console.error(err);
    }
  }

  async loadDirectory(dirPath) {
    this.tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--accent-cyan); padding: 24px;">
          ⏳ ${dirPath} ${window.i18n ? window.i18n.t('msg_dir_loading') : 'dizini listeleniyor...'}
        </td>
      </tr>
    `;

    try {
      const files = await window.api.listSFTP(dirPath);
      this.currentPath = dirPath;
      this.pathInput.value = dirPath;
      this.renderFiles(files);
    } catch (err) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--accent-rose); padding: 24px;">
            ❌ ${err.message}
          </td>
        </tr>
      `;
    }
  }

  goUpDirectory() {
    if (this.currentPath === '/' || !this.currentPath) return;
    const parts = this.currentPath.split('/').filter(Boolean);
    parts.pop();
    const upPath = '/' + parts.join('/');
    this.loadDirectory(upPath);
  }

  renderFiles(files) {
    this.tableBody.innerHTML = '';

    if (!files || files.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-dim); padding: 24px;">
            (${window.i18n && window.i18n.currentLang === 'en' ? 'Empty Directory' : 'Boş Klasör'})
          </td>
        </tr>
      `;
      return;
    }

    // Sort: directories first, then files alphabetically
    const sorted = [...files].sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    const isEn = window.i18n && window.i18n.currentLang === 'en';

    for (const item of sorted) {
      const tr = document.createElement('tr');
      const icon = item.isDirectory ? '📁' : item.isSymlink ? '🔗' : '📄';

      tr.innerHTML = `
        <td>
          <div class="file-name-cell">
            <span>${icon}</span>
            <strong>${item.name}</strong>
          </div>
        </td>
        <td style="font-family: var(--font-mono); color: var(--text-dim); font-size: 11px;">
          ${item.isDirectory ? '-' : this.formatBytes(item.size)}
        </td>
        <td style="font-family: var(--font-mono); color: var(--text-dim); font-size: 11px;">
          ${item.permissions}
        </td>
        <td style="font-size: 11px; color: var(--text-dim);">
          ${new Date(item.modifyTime).toLocaleString(isEn ? 'en-US' : 'tr-TR')}
        </td>
        <td>
          <div style="display: flex; gap: 4px;">
            ${!item.isDirectory ? `<button class="btn btn-sm btn-edit-file" title="${isEn ? 'Edit' : 'Düzenle'}">✏️</button>` : ''}
            ${!item.isDirectory ? `<button class="btn btn-sm btn-dl-file" title="${isEn ? 'Download' : 'İndir'}">⬇️</button>` : ''}
            <button class="btn btn-sm btn-danger btn-del-file" title="${isEn ? 'Delete' : 'Sil'}">🗑️</button>
          </div>
        </td>
      `;

      // Directory click to open
      tr.querySelector('.file-name-cell')?.addEventListener('click', () => {
        if (item.isDirectory) {
          const nextPath = (this.currentPath.endsWith('/') ? this.currentPath : this.currentPath + '/') + item.name;
          this.loadDirectory(nextPath);
        } else {
          this.openFileEditor(item);
        }
      });

      // Actions
      tr.querySelector('.btn-edit-file')?.addEventListener('click', () => {
        this.openFileEditor(item);
      });

      tr.querySelector('.btn-dl-file')?.addEventListener('click', async () => {
        const filePath = (this.currentPath.endsWith('/') ? this.currentPath : this.currentPath + '/') + item.name;
        try {
          await window.api.downloadSFTP(filePath);
        } catch (err) {
          alert('Download Error: ' + err.message);
        }
      });

      tr.querySelector('.btn-del-file')?.addEventListener('click', async () => {
        const filePath = (this.currentPath.endsWith('/') ? this.currentPath : this.currentPath + '/') + item.name;
        const confirmMsg = window.i18n ? window.i18n.t('confirm_delete_file', { name: item.name }) : `'${item.name}' silinecek. Emin misiniz?`;
        if (confirm(confirmMsg)) {
          try {
            await window.api.deleteSFTP(filePath, item.isDirectory);
            this.loadDirectory(this.currentPath);
          } catch (err) {
            alert('Delete Error: ' + err.message);
          }
        }
      });

      this.tableBody.appendChild(tr);
    }
  }

  async openFileEditor(item) {
    const filePath = (this.currentPath.endsWith('/') ? this.currentPath : this.currentPath + '/') + item.name;
    this.editingPath = filePath;

    const modal = document.getElementById('modal-file-editor');
    const titleEl = document.getElementById('editor-file-title');
    const editorText = document.getElementById('remote-file-editor-text');

    const isEn = window.i18n && window.i18n.currentLang === 'en';
    if (titleEl) titleEl.textContent = `${isEn ? 'File Editor' : 'Dosya Düzenleyici'}: ${item.name} (${filePath})`;
    if (editorText) editorText.value = isEn ? 'Downloading and reading remote file...' : 'Dosya indiriliyor ve okunuyor...';

    modal?.classList.add('active');

    try {
      const content = await window.api.readSFTPFile(filePath);
      if (editorText) editorText.value = content;
    } catch (err) {
      if (editorText) editorText.value = 'Read Error: ' + err.message;
    }
  }

  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

window.filesStandalone = new FilesStandaloneController();
