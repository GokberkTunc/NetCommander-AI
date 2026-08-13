// Standalone Settings & Device Manager Controller for NetCommander AI v1.1 with Complete i18n
class SettingsStandaloneController {
  constructor() {
    this.currentSettings = null;
    this.init();
  }

  async init() {
    if (window.i18n) {
      await window.i18n.init();
    }
    this.initSubtabs();
    this.bindEvents();
    await this.loadAllData();
  }

  initSubtabs() {
    document.querySelectorAll('.settings-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const subtabId = btn.getAttribute('data-subtab');
        document.querySelectorAll('.settings-nav-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.settings-subtab-pane').forEach((p) => (p.style.display = 'none'));

        btn.classList.add('active');
        const targetPane = document.getElementById(subtabId);
        if (targetPane) targetPane.style.display = 'block';

        if (subtabId === 'tab-debug-logs') {
          this.loadLogs();
        }
      });
    });
  }

  bindEvents() {
    // Save Settings Button
    document.getElementById('btn-save-settings')?.addEventListener('click', () => this.saveAllSettings());

    // Language selector change in Preferences -> Live UI translation
    document.getElementById('cfg-app-language')?.addEventListener('change', async (e) => {
      const newLang = e.target.value;
      if (window.i18n) {
        await window.i18n.setLanguage(newLang);
        this.loadDevices();
        this.checkGoogleSession();
      }
    });

    // Google Session Buttons
    document.getElementById('btn-google-login')?.addEventListener('click', async () => {
      await window.api.openGoogleLogin();
      this.checkGoogleSession();
    });

    document.getElementById('btn-google-clear')?.addEventListener('click', async () => {
      await window.api.clearGoogleSession();
      this.checkGoogleSession();
    });

    // Test AI Buttons
    document.querySelectorAll('.btn-test-ai').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const provider = btn.getAttribute('data-provider');
        const resultSpan = document.getElementById(`test-result-${provider}`);
        if (resultSpan) {
          resultSpan.textContent = window.i18n ? window.i18n.t('testing_connection') : '⏳ Test ediliyor...';
          resultSpan.style.color = 'var(--text-muted)';
        }

        try {
          const config = this.getProviderConfigFromUI(provider);
          const res = await window.api.testAIConnection(config, provider);
          if (resultSpan) {
            resultSpan.textContent = res.success ? `✓ ${res.message}` : `✗ ${res.message}`;
            resultSpan.style.color = res.success ? 'var(--accent-emerald)' : 'var(--accent-rose)';
          }
        } catch (err) {
          if (resultSpan) {
            resultSpan.textContent = `✗ Hata: ${err.message}`;
            resultSpan.style.color = 'var(--accent-rose)';
          }
        }
      });
    });

    // Log Buttons
    document.getElementById('btn-refresh-logs')?.addEventListener('click', () => this.loadLogs());
    document.getElementById('btn-clear-logs')?.addEventListener('click', async () => {
      await window.api.clearLogs();
      this.loadLogs();
    });
    document.getElementById('btn-copy-logs')?.addEventListener('click', () => {
      const text = document.getElementById('debug-log-console')?.textContent || '';
      navigator.clipboard.writeText(text);
      alert(window.i18n ? window.i18n.t('logs_copied_alert') : 'Loglar panoya kopyalandı.');
    });
    document.getElementById('btn-open-log-folder')?.addEventListener('click', () => {
      window.api.openLogFolder();
    });

    // Device Manager Modal Events
    document.getElementById('btn-add-device-dialog')?.addEventListener('click', () => this.openDeviceDialog());
    document.querySelectorAll('.btn-close-device-dialog').forEach((b) => {
      b.addEventListener('click', () => this.closeDeviceDialog());
    });
    document.getElementById('dev-form-auth-type')?.addEventListener('change', (e) => {
      const type = e.target.value;
      const passBlock = document.getElementById('dev-auth-password-block');
      const keyBlock = document.getElementById('dev-auth-key-block');
      if (passBlock) passBlock.style.display = type === 'password' ? 'block' : 'none';
      if (keyBlock) keyBlock.style.display = type === 'privateKey' ? 'block' : 'none';
    });
    document.getElementById('btn-save-device-submit')?.addEventListener('click', () => this.saveDeviceFromDialog());
  }

  async loadAllData() {
    await this.loadSettings();
    await this.loadDevices();
    this.checkGoogleSession();
  }

  async loadSettings() {
    try {
      this.currentSettings = await window.api.getSettings();
      const s = this.currentSettings || {};
      const provs = s.providers || {};

      // Active Provider & Preferences
      const activeProv = document.getElementById('settings-active-provider');
      if (activeProv && s.activeProvider) activeProv.value = s.activeProvider;

      const langSelect = document.getElementById('cfg-app-language');
      if (langSelect && s.language) langSelect.value = s.language;

      const execSelect = document.getElementById('cfg-default-exec-mode');
      if (execSelect && s.executionMode) execSelect.value = s.executionMode;

      // LM Studio & Ollama
      if (provs.lmstudio?.endpoint) document.getElementById('cfg-lmstudio-endpoint').value = provs.lmstudio.endpoint;
      if (provs.lmstudio?.model) document.getElementById('cfg-lmstudio-model').value = provs.lmstudio.model;

      if (provs.ollama?.endpoint) document.getElementById('cfg-ollama-endpoint').value = provs.ollama.endpoint;
      if (provs.ollama?.model) document.getElementById('cfg-ollama-model').value = provs.ollama.model;

      // Cloud APIs
      if (provs.deepseek?.apiKey) document.getElementById('cfg-deepseek-key').value = provs.deepseek.apiKey;
      if (provs.deepseek?.model) document.getElementById('cfg-deepseek-model').value = provs.deepseek.model;

      if (provs.groq?.apiKey) document.getElementById('cfg-groq-key').value = provs.groq.apiKey;
      if (provs.groq?.model) document.getElementById('cfg-groq-model').value = provs.groq.model;

      if (provs.openrouter?.apiKey) document.getElementById('cfg-openrouter-key').value = provs.openrouter.apiKey;
      if (provs.openrouter?.model) document.getElementById('cfg-openrouter-model').value = provs.openrouter.model;

      if (provs.gemini?.apiKey) document.getElementById('cfg-gemini-key').value = provs.gemini.apiKey;
      if (provs.gemini?.model) document.getElementById('cfg-gemini-model').value = provs.gemini.model;

      if (provs.openai?.apiKey) document.getElementById('cfg-openai-key').value = provs.openai.apiKey;
      if (provs.openai?.model) document.getElementById('cfg-openai-model').value = provs.openai.model;

      if (provs.anthropic?.apiKey) document.getElementById('cfg-anthropic-key').value = provs.anthropic.apiKey;
      if (provs.anthropic?.model) document.getElementById('cfg-anthropic-model').value = provs.anthropic.model;

      if (provs.mistral?.apiKey) document.getElementById('cfg-mistral-key').value = provs.mistral.apiKey;
      if (provs.mistral?.model) document.getElementById('cfg-mistral-model').value = provs.mistral.model;

      if (provs.custom_openai?.endpoint) document.getElementById('cfg-custom-endpoint').value = provs.custom_openai.endpoint;
      if (provs.custom_openai?.model) document.getElementById('cfg-custom-model').value = provs.custom_openai.model;
      if (provs.custom_openai?.apiKey) document.getElementById('cfg-custom-key').value = provs.custom_openai.apiKey;

      // Terminal Settings
      if (s.terminal?.theme) document.getElementById('cfg-terminal-theme').value = s.terminal.theme;
      if (s.terminal?.fontSize) document.getElementById('cfg-terminal-fontsize').value = s.terminal.fontSize;
    } catch (err) {
      console.error('Settings load error:', err);
    }
  }

  getProviderConfigFromUI(provider) {
    switch (provider) {
      case 'lmstudio':
        return {
          endpoint: document.getElementById('cfg-lmstudio-endpoint')?.value,
          model: document.getElementById('cfg-lmstudio-model')?.value,
        };
      case 'ollama':
        return {
          endpoint: document.getElementById('cfg-ollama-endpoint')?.value,
          model: document.getElementById('cfg-ollama-model')?.value,
        };
      case 'deepseek':
        return {
          apiKey: document.getElementById('cfg-deepseek-key')?.value,
          model: document.getElementById('cfg-deepseek-model')?.value,
        };
      case 'groq':
        return {
          apiKey: document.getElementById('cfg-groq-key')?.value,
          model: document.getElementById('cfg-groq-model')?.value,
        };
      case 'openrouter':
        return {
          apiKey: document.getElementById('cfg-openrouter-key')?.value,
          model: document.getElementById('cfg-openrouter-model')?.value,
        };
      case 'gemini':
        return {
          apiKey: document.getElementById('cfg-gemini-key')?.value,
          model: document.getElementById('cfg-gemini-model')?.value,
        };
      case 'openai':
        return {
          apiKey: document.getElementById('cfg-openai-key')?.value,
          model: document.getElementById('cfg-openai-model')?.value,
        };
      case 'anthropic':
        return {
          apiKey: document.getElementById('cfg-anthropic-key')?.value,
          model: document.getElementById('cfg-anthropic-model')?.value,
        };
      case 'mistral':
        return {
          apiKey: document.getElementById('cfg-mistral-key')?.value,
          model: document.getElementById('cfg-mistral-model')?.value,
        };
      case 'custom_openai':
        return {
          endpoint: document.getElementById('cfg-custom-endpoint')?.value,
          model: document.getElementById('cfg-custom-model')?.value,
          apiKey: document.getElementById('cfg-custom-key')?.value,
        };
      default:
        return {};
    }
  }

  async saveAllSettings() {
    const feedback = document.getElementById('settings-save-feedback');
    if (feedback) feedback.textContent = '...';

    const newSettings = {
      activeProvider: document.getElementById('settings-active-provider')?.value,
      language: document.getElementById('cfg-app-language')?.value,
      executionMode: document.getElementById('cfg-default-exec-mode')?.value,
      providers: {
        google_web_session: { model: 'gemini-pro' },
        lmstudio: this.getProviderConfigFromUI('lmstudio'),
        ollama: this.getProviderConfigFromUI('ollama'),
        deepseek: this.getProviderConfigFromUI('deepseek'),
        groq: this.getProviderConfigFromUI('groq'),
        openrouter: this.getProviderConfigFromUI('openrouter'),
        gemini: this.getProviderConfigFromUI('gemini'),
        openai: this.getProviderConfigFromUI('openai'),
        anthropic: this.getProviderConfigFromUI('anthropic'),
        mistral: this.getProviderConfigFromUI('mistral'),
        custom_openai: this.getProviderConfigFromUI('custom_openai'),
      },
      tray: {
        closeToTray: document.getElementById('cfg-close-to-tray')?.checked ?? true,
        minimizeToTray: document.getElementById('cfg-minimize-to-tray')?.checked ?? true,
      },
      terminal: {
        theme: document.getElementById('cfg-terminal-theme')?.value || 'retro-dark',
        fontSize: parseInt(document.getElementById('cfg-terminal-fontsize')?.value || '13', 10),
      },
    };

    try {
      await window.api.saveSettings(newSettings);
      if (feedback) {
        feedback.textContent = window.i18n ? window.i18n.t('settings_saved_success') : '✓ Ayarlar başarıyla kaydedildi.';
        setTimeout(() => (feedback.textContent = ''), 2500);
      }
    } catch (err) {
      if (feedback) {
        feedback.textContent = '❌ ' + err.message;
      }
    }
  }

  async checkGoogleSession() {
    const statusEl = document.getElementById('google-session-status');
    if (!statusEl) return;
    try {
      const status = await window.api.getGoogleSessionStatus();
      if (status.isLoggedIn) {
        statusEl.textContent = window.i18n
          ? window.i18n.t('status_google_logged_in', { count: status.cookiesCount })
          : `🟢 Giriş Yapıldı (${status.cookiesCount} çerez)`;
        statusEl.style.color = 'var(--accent-emerald)';
      } else {
        statusEl.textContent = window.i18n
          ? window.i18n.t('status_google_logged_out')
          : '🔴 Oturum Kapalı / Giriş Yapılmadı';
        statusEl.style.color = 'var(--accent-rose)';
      }
    } catch {
      statusEl.textContent = '-';
    }
  }

  async loadDevices() {
    const grid = document.getElementById('devices-grid');
    if (!grid) return;
    grid.innerHTML = `<div style="color: var(--text-dim);">${window.i18n ? window.i18n.t('devices_loading') : 'Cihazlar yükleniyor...'}</div>`;

    try {
      const devices = await window.api.getDevices();
      grid.innerHTML = '';
      if (!devices || devices.length === 0) {
        grid.innerHTML = `<div style="color: var(--text-muted); font-size: 13px;">${window.i18n ? window.i18n.t('devices_empty') : 'Henüz kayıtlı cihaz yok.'}</div>`;
        return;
      }

      devices.forEach((dev) => {
        const card = document.createElement('div');
        card.className = 'device-card';
        card.innerHTML = `
          <div class="device-card-header">
            <div>
              <div class="device-card-title">${dev.name}</div>
              <div class="device-card-meta">${dev.host}:${dev.port} • ${dev.protocol.toUpperCase()} • ${dev.username}</div>
            </div>
            <span class="brand-badge">${dev.category || 'Device'}</span>
          </div>
          <div style="display: flex; gap: 6px; margin-top: 10px;">
            <button class="btn btn-primary btn-sm btn-connect-dev">${window.i18n ? window.i18n.t('btn_connect_main') : '⚡ Ana Ekranda Bağlan'}</button>
            <button class="btn btn-sm btn-edit-dev">${window.i18n ? window.i18n.t('btn_edit') : '✏️ Düzenle'}</button>
            <button class="btn btn-danger btn-sm btn-del-dev">🗑️</button>
          </div>
        `;

        card.querySelector('.btn-connect-dev')?.addEventListener('click', async () => {
          const connectBtn = card.querySelector('.btn-connect-dev');
          if (connectBtn) {
            connectBtn.textContent = window.i18n ? window.i18n.t('btn_connecting') : 'Bağlanıyor...';
            connectBtn.disabled = true;
          }
          try {
            await window.api.connect(dev, 80, 24, dev.id);
            if (connectBtn) {
              connectBtn.textContent = window.i18n ? window.i18n.t('btn_connected_active') : '✓ Bağlandı (Ana Pencerede Aktif)';
              connectBtn.style.background = '#059669';
              setTimeout(() => {
                connectBtn.textContent = window.i18n ? window.i18n.t('btn_connect_main') : '⚡ Ana Ekranda Bağlan';
                connectBtn.style.background = '';
                connectBtn.disabled = false;
              }, 3000);
            }
          } catch (err) {
            alert('Bağlantı hatası: ' + err.message);
            if (connectBtn) {
              connectBtn.textContent = window.i18n ? window.i18n.t('btn_connect_main') : '⚡ Ana Ekranda Bağlan';
              connectBtn.disabled = false;
            }
          }
        });

        card.querySelector('.btn-edit-dev')?.addEventListener('click', () => this.openDeviceDialog(dev));
        card.querySelector('.btn-del-dev')?.addEventListener('click', async () => {
          const confirmMsg = window.i18n ? window.i18n.t('confirm_delete_device', { name: dev.name }) : `'${dev.name}' cihazını silmek istediğinize emin misiniz?`;
          if (confirm(confirmMsg)) {
            await window.api.deleteDevice(dev.id);
            this.loadDevices();
          }
        });

        grid.appendChild(card);
      });
    } catch (err) {
      grid.innerHTML = `<div style="color: var(--accent-rose);">Error: ${err.message}</div>`;
    }
  }

  openDeviceDialog(dev = null) {
    const modal = document.getElementById('modal-device-dialog');
    document.getElementById('dialog-device-title').textContent = dev
      ? (window.i18n ? window.i18n.t('dialog_edit_device') : 'Cihazı Düzenle')
      : (window.i18n ? window.i18n.t('dialog_new_device') : 'Yeni Cihaz Bağlantısı');
    document.getElementById('dev-form-id').value = dev ? dev.id : '';
    document.getElementById('dev-form-name').value = dev ? dev.name : '';
    document.getElementById('dev-form-host').value = dev ? dev.host : '';
    document.getElementById('dev-form-port').value = dev ? dev.port : 22;
    document.getElementById('dev-form-protocol').value = dev ? dev.protocol : 'ssh';
    document.getElementById('dev-form-category').value = dev ? dev.category || 'openwrt' : 'openwrt';
    document.getElementById('dev-form-username').value = dev ? dev.username : 'root';
    document.getElementById('dev-form-auth-type').value = dev ? dev.authType : 'password';
    document.getElementById('dev-form-password').value = dev ? dev.password || '' : '';
    document.getElementById('dev-form-private-key').value = dev ? dev.privateKey || '' : '';

    const passBlock = document.getElementById('dev-auth-password-block');
    const keyBlock = document.getElementById('dev-auth-key-block');
    if (passBlock) passBlock.style.display = (!dev || dev.authType === 'password') ? 'block' : 'none';
    if (keyBlock) keyBlock.style.display = (dev && dev.authType === 'privateKey') ? 'block' : 'none';

    modal?.classList.add('active');
  }

  closeDeviceDialog() {
    document.getElementById('modal-device-dialog')?.classList.remove('active');
  }

  async saveDeviceFromDialog() {
    const id = document.getElementById('dev-form-id').value;
    const name = document.getElementById('dev-form-name').value.trim();
    const host = document.getElementById('dev-form-host').value.trim();
    const port = parseInt(document.getElementById('dev-form-port').value, 10);
    const protocol = document.getElementById('dev-form-protocol').value;
    const category = document.getElementById('dev-form-category').value;
    const username = document.getElementById('dev-form-username').value.trim();
    const authType = document.getElementById('dev-form-auth-type').value;
    const password = document.getElementById('dev-form-password').value;
    const privateKey = document.getElementById('dev-form-private-key').value;

    if (!name || !host || !username) {
      alert('Lütfen gerekli alanları doldurun / Please fill in all required fields.');
      return;
    }

    const dev = {
      id: id || 'dev_' + Date.now(),
      name,
      host,
      port,
      protocol,
      category,
      username,
      authType,
      password,
      privateKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await window.api.saveDevice(dev);
      this.closeDeviceDialog();
      this.loadDevices();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  async loadLogs() {
    const consoleEl = document.getElementById('debug-log-console');
    if (!consoleEl) return;
    try {
      const logs = await window.api.getLogs(300);
      consoleEl.textContent = logs || (window.i18n ? window.i18n.t('logs_empty') : 'Henüz log kaydı bulunmuyor.');
      consoleEl.scrollTop = consoleEl.scrollHeight;
    } catch (err) {
      consoleEl.textContent = 'Log error: ' + err.message;
    }
  }
}

window.settingsStandalone = new SettingsStandaloneController();
