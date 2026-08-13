// Standalone Settings & Device Manager Window Controller
class SettingsStandaloneController {
  constructor() {
    this.initSubtabs();
    this.bindEvents();
    this.loadAllSettings();
    this.loadDevices();
    this.checkGoogleSession();
  }

  initSubtabs() {
    document.querySelectorAll('.settings-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-subtab');
        
        document.querySelectorAll('.settings-nav-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.settings-subtab-pane').forEach((pane) => {
          pane.style.display = pane.id === targetId ? 'block' : 'none';
        });

        if (targetId === 'tab-debug-logs') {
          this.loadLogs();
        } else if (targetId === 'tab-devices') {
          this.loadDevices();
        }
      });
    });
  }

  bindEvents() {
    // Save Settings Button
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      this.saveSettings();
    });

    // Test AI Buttons
    document.querySelectorAll('.btn-test-ai').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const provider = btn.getAttribute('data-provider');
        const feedbackEl = document.getElementById(`test-result-${provider}`);
        if (feedbackEl) {
          feedbackEl.style.color = 'var(--accent-amber)';
          feedbackEl.textContent = 'Test ediliyor...';
        }

        try {
          let testCfg = {};
          if (provider === 'gemini') {
            testCfg = {
              apiKey: document.getElementById('cfg-gemini-key').value,
              model: document.getElementById('cfg-gemini-model').value,
            };
          } else if (provider === 'openai') {
            testCfg = {
              apiKey: document.getElementById('cfg-openai-key').value,
              model: document.getElementById('cfg-openai-model').value,
            };
          } else if (provider === 'anthropic') {
            testCfg = {
              apiKey: document.getElementById('cfg-anthropic-key').value,
              model: document.getElementById('cfg-anthropic-model').value,
            };
          } else if (provider === 'lmstudio') {
            testCfg = {
              endpoint: document.getElementById('cfg-lmstudio-endpoint').value,
              model: document.getElementById('cfg-lmstudio-model').value,
            };
          }

          const res = await window.api.testAIProvider(provider, testCfg);
          if (feedbackEl) {
            if (res.success) {
              feedbackEl.style.color = 'var(--accent-emerald)';
              feedbackEl.textContent = `✓ Başarılı: ${res.response.substring(0, 30)}...`;
            } else {
              feedbackEl.style.color = 'var(--accent-rose)';
              feedbackEl.textContent = `✗ Hata: ${res.error}`;
            }
          }
        } catch (err) {
          if (feedbackEl) {
            feedbackEl.style.color = 'var(--accent-rose)';
            feedbackEl.textContent = `✗ Hata: ${err.message}`;
          }
        }
      });
    });

    // Google Web Session Login & Clear
    document.getElementById('btn-google-login')?.addEventListener('click', async () => {
      const statusEl = document.getElementById('google-session-status');
      if (statusEl) statusEl.textContent = 'Giriş penceresi açıldı, bekleniyor...';
      const status = await window.api.openGoogleLogin();
      this.updateGoogleStatusUI(status);
    });

    document.getElementById('btn-google-clear')?.addEventListener('click', async () => {
      await window.api.clearGoogleSession();
      this.checkGoogleSession();
    });

    // Debug logs buttons
    document.getElementById('btn-refresh-logs')?.addEventListener('click', () => this.loadLogs());
    document.getElementById('btn-copy-logs')?.addEventListener('click', () => {
      const consoleEl = document.getElementById('debug-log-console');
      if (consoleEl) {
        navigator.clipboard.writeText(consoleEl.textContent);
        alert('Loglar panoya kopyalandı.');
      }
    });
    document.getElementById('btn-open-log-folder')?.addEventListener('click', () => {
      window.api.openLogFolder();
    });
    document.getElementById('btn-clear-logs')?.addEventListener('click', async () => {
      await window.api.clearLogs();
      this.loadLogs();
    });

    // Device dialog events
    document.getElementById('btn-add-device-dialog')?.addEventListener('click', () => {
      this.openDeviceDialog();
    });

    document.querySelectorAll('.btn-close-device-dialog').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.getElementById('modal-device-dialog')?.classList.remove('active');
      });
    });

    document.getElementById('dev-form-auth-type')?.addEventListener('change', (e) => {
      const val = e.target.value;
      const passBlock = document.getElementById('dev-auth-password-block');
      const keyBlock = document.getElementById('dev-auth-key-block');
      if (passBlock) passBlock.style.display = val === 'password' ? 'block' : 'none';
      if (keyBlock) keyBlock.style.display = val === 'privateKey' ? 'block' : 'none';
    });

    document.getElementById('btn-save-device-submit')?.addEventListener('click', () => {
      this.handleSaveDeviceSubmit();
    });
  }

  async loadAllSettings() {
    try {
      const settings = await window.api.getSettings();
      if (!settings) return;

      document.getElementById('settings-active-provider').value = settings.activeProvider || 'google_web_session';

      if (settings.providers?.gemini) {
        document.getElementById('cfg-gemini-key').value = settings.providers.gemini.apiKey || '';
        document.getElementById('cfg-gemini-model').value = settings.providers.gemini.model || 'gemini-2.5-flash';
      }

      if (settings.providers?.openai) {
        document.getElementById('cfg-openai-key').value = settings.providers.openai.apiKey || '';
        document.getElementById('cfg-openai-model').value = settings.providers.openai.model || 'gpt-4o-mini';
      }

      if (settings.providers?.anthropic) {
        document.getElementById('cfg-anthropic-key').value = settings.providers.anthropic.apiKey || '';
        document.getElementById('cfg-anthropic-model').value = settings.providers.anthropic.model || 'claude-3-5-sonnet-20241022';
      }

      if (settings.providers?.lmstudio) {
        document.getElementById('cfg-lmstudio-endpoint').value = settings.providers.lmstudio.endpoint || 'http://localhost:1234/v1';
        document.getElementById('cfg-lmstudio-model').value = settings.providers.lmstudio.model || 'local-model';
      }

      if (settings.tray) {
        document.getElementById('cfg-close-to-tray').checked = settings.tray.closeToTray ?? true;
        document.getElementById('cfg-minimize-to-tray').checked = settings.tray.minimizeToTray ?? true;
      }

      if (settings.terminal) {
        document.getElementById('cfg-terminal-theme').value = settings.terminal.theme || 'retro-dark';
        document.getElementById('cfg-terminal-fontsize').value = settings.terminal.fontSize || 13;
      }
    } catch (err) {
      console.error('Ayarlar yüklenemedi:', err);
    }
  }

  async saveSettings() {
    const feedback = document.getElementById('settings-save-feedback');
    if (feedback) feedback.textContent = 'Kaydediliyor...';

    const updatedSettings = {
      activeProvider: document.getElementById('settings-active-provider').value,
      providers: {
        gemini: {
          apiKey: document.getElementById('cfg-gemini-key').value.trim(),
          model: document.getElementById('cfg-gemini-model').value,
        },
        openai: {
          apiKey: document.getElementById('cfg-openai-key').value.trim(),
          model: document.getElementById('cfg-openai-model').value,
        },
        anthropic: {
          apiKey: document.getElementById('cfg-anthropic-key').value.trim(),
          model: document.getElementById('cfg-anthropic-model').value,
        },
        lmstudio: {
          endpoint: document.getElementById('cfg-lmstudio-endpoint').value.trim(),
          model: document.getElementById('cfg-lmstudio-model').value.trim(),
        },
      },
      tray: {
        closeToTray: document.getElementById('cfg-close-to-tray').checked,
        minimizeToTray: document.getElementById('cfg-minimize-to-tray').checked,
        startMinimized: false,
      },
      terminal: {
        theme: document.getElementById('cfg-terminal-theme').value,
        fontSize: parseInt(document.getElementById('cfg-terminal-fontsize').value, 10) || 13,
      },
    };

    try {
      await window.api.saveSettings(updatedSettings);
      if (feedback) feedback.textContent = '✓ Ayarlar başarıyla kaydedildi.';
      setTimeout(() => {
        if (feedback) feedback.textContent = '';
      }, 2500);
    } catch (err) {
      if (feedback) {
        feedback.style.color = 'var(--accent-rose)';
        feedback.textContent = '✗ Kaydetme hatası: ' + err.message;
      }
    }
  }

  async checkGoogleSession() {
    const status = await window.api.getGoogleSessionStatus();
    this.updateGoogleStatusUI(status);
  }

  updateGoogleStatusUI(status) {
    const statusEl = document.getElementById('google-session-status');
    if (!statusEl) return;
    if (status.isLoggedIn) {
      statusEl.style.color = 'var(--accent-emerald)';
      statusEl.textContent = `🟢 Oturum Açık (${status.cookiesCount} çerez aktif)`;
    } else {
      statusEl.style.color = 'var(--accent-rose)';
      statusEl.textContent = '🔴 Oturum Kapalı. Lütfen giriş yapın.';
    }
  }

  async loadLogs() {
    const consoleEl = document.getElementById('debug-log-console');
    if (!consoleEl) return;
    try {
      const logs = await window.api.getLogs();
      consoleEl.textContent = logs || 'Log kaydı bulunamadı.';
      consoleEl.scrollTop = consoleEl.scrollHeight;
    } catch (err) {
      consoleEl.textContent = 'Loglar yüklenemedi: ' + err.message;
    }
  }

  // --- Devices Subtab ---
  async loadDevices() {
    const grid = document.getElementById('devices-grid');
    if (!grid) return;

    try {
      const devices = await window.api.getDevices();
      grid.innerHTML = '';

      if (!devices || devices.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 28px; color: var(--text-muted);">
            Kayıtlı ağ cihazı bulunamadı. Cihaz eklemek için yukarıdaki <strong>"Yeni Cihaz Ekle"</strong> butonunu kullanın.
          </div>
        `;
        return;
      }

      for (const dev of devices) {
        const card = document.createElement('div');
        card.className = 'device-card';

        card.innerHTML = `
          <div class="device-card-header">
            <div>
              <strong style="font-size: 13px;">${dev.name}</strong>
              <span class="brand-badge" style="margin-left: 6px;">${dev.protocol.toUpperCase()}</span>
            </div>
            <span style="font-size: 11px; color: var(--text-dim); font-family: var(--font-mono);">${dev.host}:${dev.port}</span>
          </div>

          <div style="font-size: 11px; color: var(--text-muted);">
            <span>Kullanıcı: <strong>${dev.username}</strong></span> &bull;
            <span>Kategori: <strong>${dev.category || 'Genel'}</strong></span>
          </div>

          <div class="device-card-actions">
            <button class="btn btn-sm btn-edit-dev" title="Düzenle">✏️</button>
            <button class="btn btn-sm btn-danger btn-del-dev" title="Sil">🗑️</button>
            <button class="btn btn-primary btn-sm btn-connect-dev">⚡ Ana Ekranda Bağlan</button>
          </div>
        `;

        card.querySelector('.btn-edit-dev')?.addEventListener('click', () => {
          this.openDeviceDialog(dev);
        });

        card.querySelector('.btn-del-dev')?.addEventListener('click', async () => {
          if (confirm(`'${dev.name}' cihazını silmek istediğinizden emin misiniz?`)) {
            await window.api.deleteDevice(dev.id);
            this.loadDevices();
          }
        });

        card.querySelector('.btn-connect-dev')?.addEventListener('click', async () => {
          const connectBtn = card.querySelector('.btn-connect-dev');
          if (connectBtn) {
            connectBtn.textContent = 'Bağlanıyor...';
            connectBtn.disabled = true;
          }
          try {
            await window.api.connect(dev, 80, 24, dev.id);
            if (connectBtn) {
              connectBtn.textContent = '✓ Bağlandı (Ana Pencerede Aktif)';
              connectBtn.style.background = '#059669';
              setTimeout(() => {
                connectBtn.textContent = '⚡ Ana Ekranda Bağlan';
                connectBtn.style.background = '';
                connectBtn.disabled = false;
              }, 3000);
            }
          } catch (err) {
            alert('Bağlantı hatası: ' + err.message);
            if (connectBtn) {
              connectBtn.textContent = '⚡ Ana Ekranda Bağlan';
              connectBtn.disabled = false;
            }
          }
        });

        grid.appendChild(card);
      }
    } catch (err) {
      grid.innerHTML = `<p style="color: var(--accent-rose);">Cihazlar listelenemedi: ${err.message}</p>`;
    }
  }

  openDeviceDialog(device = null) {
    const modal = document.getElementById('modal-device-dialog');
    const titleEl = document.getElementById('dialog-device-title');

    if (device) {
      if (titleEl) titleEl.textContent = `Cihazı Düzenle: ${device.name}`;
      document.getElementById('dev-form-id').value = device.id;
      document.getElementById('dev-form-name').value = device.name;
      document.getElementById('dev-form-host').value = device.host;
      document.getElementById('dev-form-port').value = device.port;
      document.getElementById('dev-form-protocol').value = device.protocol;
      document.getElementById('dev-form-category').value = device.category || 'openwrt';
      document.getElementById('dev-form-username').value = device.username;
      document.getElementById('dev-form-auth-type').value = device.authType || 'password';
      document.getElementById('dev-form-password').value = device.password || '';
      document.getElementById('dev-form-private-key').value = device.privateKey || '';
    } else {
      if (titleEl) titleEl.textContent = 'Yeni Cihaz Bağlantısı';
      document.getElementById('dev-form-id').value = '';
      document.getElementById('dev-form-name').value = '';
      document.getElementById('dev-form-host').value = '';
      document.getElementById('dev-form-port').value = '22';
      document.getElementById('dev-form-protocol').value = 'ssh';
      document.getElementById('dev-form-category').value = 'openwrt';
      document.getElementById('dev-form-username').value = 'root';
      document.getElementById('dev-form-auth-type').value = 'password';
      document.getElementById('dev-form-password').value = '';
      document.getElementById('dev-form-private-key').value = '';
    }

    document.getElementById('dev-form-auth-type')?.dispatchEvent(new Event('change'));
    modal?.classList.add('active');
  }

  async handleSaveDeviceSubmit() {
    const id = document.getElementById('dev-form-id').value || 'dev_' + Date.now();
    const name = document.getElementById('dev-form-name').value.trim();
    const host = document.getElementById('dev-form-host').value.trim();
    const port = parseInt(document.getElementById('dev-form-port').value, 10) || 22;
    const protocol = document.getElementById('dev-form-protocol').value;
    const category = document.getElementById('dev-form-category').value;
    const username = document.getElementById('dev-form-username').value.trim();
    const authType = document.getElementById('dev-form-auth-type').value;
    const password = document.getElementById('dev-form-password').value;
    const privateKey = document.getElementById('dev-form-private-key').value;

    if (!name || !host || !username) {
      alert('Lütfen Cihaz Adı, Host/IP ve Kullanıcı Adı alanlarını doldurun.');
      return;
    }

    const deviceObj = {
      id,
      name,
      host,
      port,
      protocol,
      category,
      username,
      authType,
      password: authType === 'password' ? password : undefined,
      privateKey: authType === 'privateKey' ? privateKey : undefined,
      tags: [],
    };

    try {
      await window.api.saveDevice(deviceObj);
      document.getElementById('modal-device-dialog')?.classList.remove('active');
      this.loadDevices();
    } catch (err) {
      alert('Cihaz kaydedilemedi: ' + err.message);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.settingsCtrl = new SettingsStandaloneController();
});
