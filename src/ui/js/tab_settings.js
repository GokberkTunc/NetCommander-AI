// Tab 4: Ayarlar & Yapay Zeka Controller (Bağımsız Modal Pencere)
class SettingsTabController {
  constructor() {
    this.providerSelect = document.getElementById('settings-active-provider');
    this.saveBtn = document.getElementById('btn-save-settings');
    this.googleLoginBtn = document.getElementById('btn-google-login');
    this.googleClearBtn = document.getElementById('btn-google-clear');
    this.googleStatusEl = document.getElementById('google-session-status');
    this.logConsole = document.getElementById('debug-log-console');

    this.bindEvents();
    this.loadSettings();
  }

  bindEvents() {
    // Ayarlar İç Sekme Geçişleri
    document.querySelectorAll('.settings-subtab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetSubtab = btn.getAttribute('data-subtab');
        if (targetSubtab) {
          this.switchSubtab(targetSubtab);
        }
      });
    });

    this.saveBtn?.addEventListener('click', () => {
      this.handleSaveSettings();
    });
  }

  switchSubtab(targetSubtab) {
    document.querySelectorAll('.settings-subtab-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-subtab') === targetSubtab);
    });

    document.querySelectorAll('.settings-subtab-content').forEach((pane) => {
      pane.style.display = pane.id === targetSubtab ? 'block' : 'none';
    });

    if (targetSubtab === 'subtab-debug-logs') {
      this.loadLogs();
    } else if (targetSubtab === 'subtab-devices') {
      window.devicesTab?.loadDevices();
    }
  }

    // Test AI Buttons (Gemini, OpenAI, Claude, LM Studio)
    document.querySelectorAll('.btn-test-ai').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const provider = btn.getAttribute('data-provider');
        const feedbackEl = document.getElementById(`test-result-${provider}`);
        if (feedbackEl) {
          feedbackEl.style.color = 'var(--text-muted)';
          feedbackEl.textContent = 'Bağlantı test ediliyor...';
        }

        const config = this.getProviderConfig(provider);

        try {
          const res = await window.api.testAIProvider(config);
          if (feedbackEl) {
            feedbackEl.style.color = res.success ? 'var(--accent-emerald)' : 'var(--accent-rose)';
            feedbackEl.textContent = res.message;
          }
        } catch (err) {
          if (feedbackEl) {
            feedbackEl.style.color = 'var(--accent-rose)';
            feedbackEl.textContent = `Hata: ${err.message}`;
          }
        }
      });
    });

    // Google Session Login
    this.googleLoginBtn?.addEventListener('click', async () => {
      if (this.googleStatusEl) this.googleStatusEl.textContent = 'Giriş penceresi açıldı, oturum bekleniyor...';
      try {
        const status = await window.api.openGoogleLogin();
        this.updateGoogleStatus(status);
      } catch (err) {
        if (this.googleStatusEl) this.googleStatusEl.textContent = `Hata: ${err.message}`;
      }
    });

    this.googleClearBtn?.addEventListener('click', async () => {
      await window.api.clearGoogleSession();
      this.checkGoogleSession();
    });

    // Logger UI Events
    document.getElementById('btn-refresh-logs')?.addEventListener('click', () => {
      this.loadLogs();
    });

    document.getElementById('btn-copy-logs')?.addEventListener('click', () => {
      if (this.logConsole) {
        navigator.clipboard.writeText(this.logConsole.innerText || this.logConsole.textContent || '');
        const btn = document.getElementById('btn-copy-logs');
        if (btn) {
          btn.textContent = 'Kopyalandı!';
          setTimeout(() => (btn.textContent = '📋 Kopyala'), 1500);
        }
      }
    });

    document.getElementById('btn-open-log-folder')?.addEventListener('click', async () => {
      try {
        await window.api.openLogFolder();
      } catch (err) {
        alert('Klasör açma hatası: ' + err.message);
      }
    });

    document.getElementById('btn-clear-logs')?.addEventListener('click', async () => {
      if (confirm('Tüm hata ayıklama günlüklerini temizlemek istediğinizden emin misiniz?')) {
        await window.api.clearLogs();
        this.loadLogs();
      }
    });
  }

  async loadLogs() {
    if (!this.logConsole) return;
    this.logConsole.textContent = 'Günlükler yükleniyor...';
    try {
      const logs = await window.api.getLogs();
      this.logConsole.textContent = logs || '[Henüz bir log kaydı bulunmuyor]';
      this.logConsole.scrollTop = this.logConsole.scrollHeight;
    } catch (err) {
      this.logConsole.textContent = `Loglar okunamadı: ${err.message}`;
    }
  }

  getProviderConfig(provider) {
    if (provider === 'lmstudio') {
      return {
        provider: 'lmstudio',
        customEndpoint: document.getElementById('cfg-lmstudio-endpoint').value.trim() || 'http://localhost:1234/v1',
        model: document.getElementById('cfg-lmstudio-model').value.trim() || 'local-model',
        enabled: true,
        autoApproveSafeCommands: true,
      };
    } else if (provider === 'gemini') {
      return {
        provider: 'gemini',
        apiKey: document.getElementById('cfg-gemini-key').value.trim(),
        model: document.getElementById('cfg-gemini-model').value,
        enabled: true,
        autoApproveSafeCommands: true,
      };
    } else if (provider === 'openai') {
      return {
        provider: 'openai',
        apiKey: document.getElementById('cfg-openai-key').value.trim(),
        model: document.getElementById('cfg-openai-model').value,
        enabled: true,
        autoApproveSafeCommands: true,
      };
    } else if (provider === 'anthropic') {
      return {
        provider: 'anthropic',
        apiKey: document.getElementById('cfg-anthropic-key').value.trim(),
        model: document.getElementById('cfg-anthropic-model').value,
        enabled: true,
        autoApproveSafeCommands: true,
      };
    } else {
      return {
        provider: 'google_web_session',
        model: 'gemini-pro',
        enabled: true,
        autoApproveSafeCommands: true,
      };
    }
  }

  async loadSettings() {
    try {
      const settings = await window.api.getSettings();

      if (this.providerSelect) this.providerSelect.value = settings.activeProvider;

      // Gemini
      if (settings.providers.gemini) {
        document.getElementById('cfg-gemini-key').value = settings.providers.gemini.apiKey || '';
        document.getElementById('cfg-gemini-model').value = settings.providers.gemini.model || 'gemini-2.5-flash';
      }

      // OpenAI
      if (settings.providers.openai) {
        document.getElementById('cfg-openai-key').value = settings.providers.openai.apiKey || '';
        document.getElementById('cfg-openai-model').value = settings.providers.openai.model || 'gpt-4o-mini';
      }

      // Anthropic
      if (settings.providers.anthropic) {
        document.getElementById('cfg-anthropic-key').value = settings.providers.anthropic.apiKey || '';
        document.getElementById('cfg-anthropic-model').value = settings.providers.anthropic.model || 'claude-3-5-sonnet-20241022';
      }

      // LM Studio
      if (settings.providers.lmstudio) {
        document.getElementById('cfg-lmstudio-endpoint').value = settings.providers.lmstudio.customEndpoint || 'http://localhost:1234/v1';
        document.getElementById('cfg-lmstudio-model').value = settings.providers.lmstudio.model || 'local-model';
      }

      // Tray & App
      document.getElementById('cfg-close-to-tray').checked = settings.tray?.closeToTray !== false;
      document.getElementById('cfg-minimize-to-tray').checked = settings.tray?.minimizeToTray !== false;

      // Terminal
      document.getElementById('cfg-terminal-theme').value = settings.terminal?.theme || 'retro-dark';
      document.getElementById('cfg-terminal-fontsize').value = settings.terminal?.fontSize || 13;

      this.checkGoogleSession();
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }

  async checkGoogleSession() {
    try {
      const status = await window.api.getGoogleSessionStatus();
      this.updateGoogleStatus(status);
    } catch {
      this.updateGoogleStatus({ isLoggedIn: false, cookiesCount: 0 });
    }
  }

  updateGoogleStatus(status) {
    if (!this.googleStatusEl) return;
    if (status.isLoggedIn) {
      this.googleStatusEl.style.color = 'var(--accent-emerald)';
      this.googleStatusEl.textContent = `🟢 Oturum Açık (${status.cookiesCount} çerez doğrulandı)`;
    } else {
      this.googleStatusEl.style.color = 'var(--accent-rose)';
      this.googleStatusEl.textContent = '⚪ Oturum Açılmadı (Giriş yapmanız gerekiyor)';
    }
  }

  async handleSaveSettings() {
    const activeProvider = this.providerSelect.value;
    const settings = {
      activeProvider,
      providers: {
        gemini: this.getProviderConfig('gemini'),
        openai: this.getProviderConfig('openai'),
        anthropic: this.getProviderConfig('anthropic'),
        lmstudio: this.getProviderConfig('lmstudio'),
        google_web_session: this.getProviderConfig('google_web_session'),
      },
      tray: {
        closeToTray: document.getElementById('cfg-close-to-tray').checked,
        minimizeToTray: document.getElementById('cfg-minimize-to-tray').checked,
        showNotifications: true,
      },
      terminal: {
        theme: document.getElementById('cfg-terminal-theme').value,
        fontSize: parseInt(document.getElementById('cfg-terminal-fontsize').value, 10) || 13,
        fontFamily: "'Consolas', 'Courier New', 'Fira Code', monospace",
        cursorBlink: true,
        scrollback: 5000,
      },
    };

    try {
      await window.api.saveSettings(settings);
      document.body.setAttribute('data-theme', settings.terminal.theme);

      const feedback = document.getElementById('settings-save-feedback');
      if (feedback) {
        feedback.textContent = 'Ayarlar kaydedildi!';
        setTimeout(() => (feedback.textContent = ''), 3000);
      }

      window.managementTab?.updateActiveAIBadge();
    } catch (err) {
      alert('Ayarlar kaydedilemedi: ' + err.message);
    }
  }
}

window.settingsTab = new SettingsTabController();
