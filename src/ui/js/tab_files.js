// Tab 2: Windows Explorer Tarzı Dosya Gezgini Controller
class FilesTabController {
  constructor() {
    this.currentPathInput = document.getElementById('sftp-current-path');
    this.tableBody = document.getElementById('sftp-files-tbody');
    this.currentPath = '/';
    this.editingFilePath = '';

    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('btn-sftp-refresh')?.addEventListener('click', () => this.loadDirectory(this.currentPath));
    document.getElementById('btn-sftp-go')?.addEventListener('click', () => {
      this.loadDirectory(this.currentPathInput.value.trim() || '/');
    });
    this.currentPathInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.loadDirectory(this.currentPathInput.value.trim() || '/');
      }
    });

    document.getElementById('btn-sftp-up')?.addEventListener('click', () => {
      const parts = this.currentPath.split('/').filter(Boolean);
      if (parts.length > 0) {
        parts.pop();
        const parentPath = '/' + parts.join('/');
        this.loadDirectory(parentPath || '/');
      }
    });

    // Quick Path Buttons (Hızlı Erişim)
    document.querySelectorAll('.quick-path-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const path = btn.getAttribute('data-path');
        if (path) {
          document.querySelectorAll('.quick-path-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.loadDirectory(path);
        }
      });
    });

    // Upload
    document.getElementById('btn-sftp-upload')?.addEventListener('click', async () => {
      try {
        const localPath = await window.api.showOpenFileDialog();
        if (localPath) {
          const fileName = localPath.split(/[\\/]/).pop();
          const remoteDest = (this.currentPath.endsWith('/') ? this.currentPath : this.currentPath + '/') + fileName;
          await window.api.sftpUpload(localPath, remoteDest);
          this.loadDirectory(this.currentPath);
        }
      } catch (err) {
        alert('Dosya yükleme hatası: ' + err.message);
      }
    });

    // New Folder
    document.getElementById('btn-sftp-mkdir')?.addEventListener('click', async () => {
      const folderName = prompt('Yeni Klasör Adı:');
      if (folderName) {
        try {
          const remoteDest = (this.currentPath.endsWith('/') ? this.currentPath : this.currentPath + '/') + folderName;
          await window.api.sftpMkdir(remoteDest);
          this.loadDirectory(this.currentPath);
        } catch (err) {
          alert('Klasör oluşturma hatası: ' + err.message);
        }
      }
    });

    // New File
    document.getElementById('btn-sftp-newfile')?.addEventListener('click', async () => {
      const fileName = prompt('Yeni Dosya Adı:');
      if (fileName) {
        try {
          const remoteDest = (this.currentPath.endsWith('/') ? this.currentPath : this.currentPath + '/') + fileName;
          await window.api.sftpWriteFileText(remoteDest, '');
          this.loadDirectory(this.currentPath);
        } catch (err) {
          alert('Dosya oluşturma hatası: ' + err.message);
        }
      }
    });

    // Save Remote File from Editor Modal
    document.getElementById('btn-save-remote-file')?.addEventListener('click', async () => {
      if (!this.editingFilePath) return;
      const content = document.getElementById('remote-file-editor-text').value;
      try {
        await window.api.sftpWriteFileText(this.editingFilePath, content);
        document.getElementById('modal-file-editor')?.classList.remove('active');
        this.loadDirectory(this.currentPath);
      } catch (err) {
        alert('Dosya kaydetme hatası: ' + err.message);
      }
    });
  }

  refreshCurrent() {
    this.loadDirectory(this.currentPath || '/');
  }

  async loadDirectory(path) {
    this.currentPath = path || '/';
    this.currentPathInput.value = this.currentPath;

    this.tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">
          Dizin taranıyor: ${this.currentPath}...
        </td>
      </tr>
    `;

    try {
      const items = await window.api.sftpListDir(this.currentPath);
      this.renderItems(items);
    } catch (err) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--accent-rose); padding: 20px;">
            ⚠️ ${err.message || 'Dizin okunamadı'}
          </td>
        </tr>
      `;
    }
  }

  renderItems(items) {
    if (!items || items.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">
            Bu klasör boş.
          </td>
        </tr>
      `;
      return;
    }

    this.tableBody.innerHTML = '';

    for (const item of items) {
      const tr = document.createElement('tr');

      const nameTd = document.createElement('td');
      nameTd.className = 'file-name-cell';
      nameTd.innerHTML = `<span>${item.isDirectory ? '📁' : '📄'}</span> <strong>${item.name}</strong>`;

      nameTd.onclick = () => {
        if (item.isDirectory) {
          this.loadDirectory(item.path);
        } else {
          this.openFileEditor(item.path, item.name);
        }
      };

      const sizeTd = document.createElement('td');
      sizeTd.style.fontFamily = 'var(--font-mono)';
      sizeTd.textContent = item.isDirectory ? '<DİZİN>' : this.formatSize(item.size);

      const permTd = document.createElement('td');
      permTd.style.fontFamily = 'var(--font-mono)';
      permTd.textContent = item.permissions;

      const dateTd = document.createElement('td');
      dateTd.style.fontSize = '11px';
      dateTd.textContent = new Date(item.modifyTime).toLocaleString();

      const actionsTd = document.createElement('td');
      actionsTd.innerHTML = `
        <div style="display: flex; gap: 4px;">
          ${!item.isDirectory ? `<button class="btn btn-sm btn-action-download" title="İndir">💾</button>` : ''}
          ${!item.isDirectory ? `<button class="btn btn-sm btn-action-edit" title="Düzenle">✏️</button>` : ''}
          <button class="btn btn-sm btn-danger btn-action-delete" title="Sil">🗑️</button>
        </div>
      `;

      // Action Handlers
      actionsTd.querySelector('.btn-action-download')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.downloadFile(item.path, item.name);
      });

      actionsTd.querySelector('.btn-action-edit')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openFileEditor(item.path, item.name);
      });

      actionsTd.querySelector('.btn-action-delete')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`'${item.name}' öğesini silmek istediğinizden emin misiniz?`)) {
          try {
            if (item.isDirectory) {
              await window.api.sftpRmdir(item.path);
            } else {
              await window.api.sftpUnlink(item.path);
            }
            this.loadDirectory(this.currentPath);
          } catch (err) {
            alert('Silme hatası: ' + err.message);
          }
        }
      });

      tr.appendChild(nameTd);
      tr.appendChild(sizeTd);
      tr.appendChild(permTd);
      tr.appendChild(dateTd);
      tr.appendChild(actionsTd);

      this.tableBody.appendChild(tr);
    }
  }

  async openFileEditor(remotePath, fileName) {
    this.editingFilePath = remotePath;
    const modal = document.getElementById('modal-file-editor');
    const titleEl = document.getElementById('editor-file-title');
    const textEl = document.getElementById('remote-file-editor-text');

    if (titleEl) titleEl.textContent = `Dosya Düzenleyici: ${remotePath}`;
    if (textEl) textEl.value = 'Dosya içeriği okunuyor...';
    modal?.classList.add('active');

    try {
      const content = await window.api.sftpReadFileText(remotePath);
      if (textEl) textEl.value = content;
    } catch (err) {
      if (textEl) textEl.value = `Hata: ${err.message}`;
    }
  }

  async downloadFile(remotePath, fileName) {
    try {
      const localDest = await window.api.showSaveFileDialog(fileName);
      if (localDest) {
        await window.api.sftpDownload(remotePath, localDest);
        alert(`'${fileName}' başarıyla indirildi.`);
      }
    } catch (err) {
      alert('İndirme hatası: ' + err.message);
    }
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

window.filesTab = new FilesTabController();
