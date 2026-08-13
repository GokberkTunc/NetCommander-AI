// App Master Controller with Standalone Windows & Multi-Session Isolated Chat
class AppController {
  constructor() {
    this.sessionTabsContainer = document.getElementById('device-session-tabs');
    this.statusDot = document.getElementById('header-status-dot');
    this.statusText = document.getElementById('header-status-text');
    this.disconnectBtn = document.getElementById('btn-header-disconnect');
    this.addTabBtn = document.getElementById('btn-header-add-tab');
    this.settingsBtn = document.getElementById('btn-open-settings-modal');
    this.filesBtn = document.getElementById('btn-open-files-modal');
    this.terminalPane = document.getElementById('terminal-pane');
    this.resizer = document.getElementById('chat-term-resizer');
    this.collapseBtn = document.getElementById('btn-term-toggle-collapse');

    this.activeSessionId = 'default';
    this.sessions = new Map(); // id -> { id, name, host, device }

    this.bindEvents();
    this.initResizer();
    this.initTheme();
  }

  bindEvents() {
    // Open Standalone Settings & Device Manager Window
    this.settingsBtn?.addEventListener('click', () => {
      window.api.openSettingsWindow();
    });

    // Add Tab Button -> Opens Standalone Settings Window
    this.addTabBtn?.addEventListener('click', () => {
      window.api.openSettingsWindow();
    });

    // Open Standalone Files Explorer Window
    this.filesBtn?.addEventListener('click', () => {
      window.api.openFilesWindow();
    });

    // Language Switcher (TR / EN)
    document.getElementById('btn-lang-switch')?.addEventListener('click', () => {
      window.i18n.toggleLanguage();
      this.updateHeaderAndFooter();
    });

    // Execution Mode Select
    const modeSelect = document.getElementById('execution-mode-select');
    modeSelect?.addEventListener('change', async (e) => {
      const mode = e.target.value;
      window.managementTab?.setExecutionMode(mode);
      await window.api.saveSettings({ executionMode: mode });
    });

    // Header Disconnect Button
    this.disconnectBtn?.addEventListener('click', async () => {
      await window.api.disconnect(this.activeSessionId);
      this.closeSessionTab(this.activeSessionId);
    });

    // Terminal Collapse / Expand Toggle
    this.collapseBtn?.addEventListener('click', () => {
      const isCollapsed = this.terminalPane.classList.toggle('collapsed');
      this.collapseBtn.textContent = isCollapsed ? '🔼' : '🔽';
      setTimeout(() => window.terminalController?.fit(), 100);
    });

    // Backend IPC events
    window.api.onStatusChange((statusObj) => {
      const sid = statusObj.sessionId || 'default';
      if (statusObj.status === 'connected') {
        this.setSessionConnected(sid, statusObj.device);
      } else if (statusObj.status === 'disconnected') {
        this.setSessionDisconnected(sid);
      }
    });

    window.api.onDeviceTabAdded(({ device, sessionId }) => {
      this.addSessionTab(device, sessionId);
      this.switchSessionTab(sessionId);
    });

    window.api.onQuickConnect(async (deviceId) => {
      const devices = await window.api.getDevices();
      const dev = devices.find((d) => d.id === deviceId);
      if (dev) {
        this.connectDeviceInNewTab(dev);
      }
    });
  }

  async connectDeviceInNewTab(device) {
    const sessionId = device.id || 'dev_' + Date.now();
    this.addSessionTab(device, sessionId);

    try {
      await window.api.connect(device, 80, 24, sessionId);
      window.managementTab?.addAssistantMessage(
        `🟢 **${device.name}** (${device.host}:${device.port} - ${device.protocol.toUpperCase()}) bağlantısı başarıyla kuruldu! Cihazı yönetmek için doğrudan komut veya sorunuzu yazabilirsiniz.`
      );
    } catch (err) {
      alert(`Bağlantı hatası (${device.name}): ` + err.message);
      this.closeSessionTab(sessionId);
    }
  }

  initResizer() {
    if (!this.resizer || !this.terminalPane) return;

    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    this.resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      this.resizer.classList.add('resizing');
      startY = e.clientY;
      startHeight = this.terminalPane.offsetHeight;
      document.body.style.cursor = 'row-resize';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const deltaY = startY - e.clientY;
      const newHeight = Math.max(60, Math.min(window.innerHeight * 0.7, startHeight + deltaY));
      this.terminalPane.style.height = `${newHeight}px`;
      window.terminalController?.fit();
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        this.resizer.classList.remove('resizing');
        document.body.style.cursor = '';
        window.terminalController?.fit();
      }
    });
  }

  async initTheme() {
    try {
      await window.i18n?.init();
      const settings = await window.api.getSettings();
      if (settings?.terminal?.theme) {
        document.body.setAttribute('data-theme', settings.terminal.theme);
      }
      if (settings?.executionMode) {
        const modeSelect = document.getElementById('execution-mode-select');
        if (modeSelect) modeSelect.value = settings.executionMode;
        window.managementTab?.setExecutionMode(settings.executionMode);
      }
    } catch {}
  }

  addSessionTab(device, sessionId) {
    const sid = sessionId || device.id || 'session_' + Date.now();
    this.sessions.set(sid, { id: sid, name: device.name, host: device.host, device });

    this.renderTabs();
    this.switchSessionTab(sid);
  }

  switchSessionTab(sessionId) {
    this.activeSessionId = sessionId;
    window.api.switchSession(sessionId);

    this.renderTabs();
    this.updateHeaderAndFooter();

    const session = this.sessions.get(sessionId);
    const termTitle = document.getElementById('terminal-device-title');
    if (termTitle) {
      termTitle.textContent = session
        ? (window.i18n ? window.i18n.t('terminal_connected', { name: session.name, host: session.host }) : `[Canlı Terminal - ${session.name} (${session.host})]`)
        : (window.i18n ? window.i18n.t('terminal_idle') : '[Canlı Terminal - Boşta]');
    }

    // Switch terminal stream buffer
    window.terminalController?.switchSession(sessionId);

    // Switch chat history to this device
    window.managementTab?.switchDeviceSession(sessionId, session ? session.device : null);
  }

  closeSessionTab(sessionId) {
    this.sessions.delete(sessionId);
    window.api.disconnect(sessionId);

    if (this.sessions.size === 0) {
      this.activeSessionId = 'default';
      this.switchSessionTab('default');
    } else if (this.activeSessionId === sessionId) {
      const remaining = Array.from(this.sessions.keys());
      this.activeSessionId = remaining[remaining.length - 1];
      this.switchSessionTab(this.activeSessionId);
    }

    this.renderTabs();
    this.updateHeaderAndFooter();
  }

  renderTabs() {
    if (!this.sessionTabsContainer) return;
    this.sessionTabsContainer.innerHTML = '';

    if (this.sessions.size === 0) {
      const defaultTab = document.createElement('div');
      defaultTab.className = 'device-tab-item active';
      defaultTab.innerHTML = `<span>🖥️</span> <span>${window.i18n ? window.i18n.t('no_connection') : 'Bağlantı Yok'}</span>`;
      this.sessionTabsContainer.appendChild(defaultTab);
      return;
    }

    for (const [sid, session] of this.sessions.entries()) {
      const tab = document.createElement('div');
      tab.className = `device-tab-item ${sid === this.activeSessionId ? 'active' : ''}`;
      
      tab.innerHTML = `
        <span>🖥️</span>
        <span class="device-tab-title">${session.name}</span>
        <span class="device-tab-close" title="${window.i18n ? window.i18n.t('btn_disconnect') : 'Kapat'}">&times;</span>
      `;

      tab.addEventListener('click', (e) => {
        if (e.target.classList.contains('device-tab-close')) {
          e.stopPropagation();
          this.closeSessionTab(sid);
        } else {
          this.switchSessionTab(sid);
        }
      });

      this.sessionTabsContainer.appendChild(tab);
    }
  }

  setSessionConnected(sessionId, device) {
    this.sessions.set(sessionId, { id: sessionId, name: device.name, host: device.host, device });
    if (this.activeSessionId === sessionId || this.activeSessionId === 'default') {
      this.activeSessionId = sessionId;
    }
    this.renderTabs();
    this.updateHeaderAndFooter();
    window.terminalController?.switchSession(sessionId);
    window.managementTab?.switchDeviceSession(sessionId, device);
  }

  setSessionDisconnected(sessionId) {
    this.sessions.delete(sessionId);
    if (this.activeSessionId === sessionId) {
      const remaining = Array.from(this.sessions.keys());
      this.activeSessionId = remaining.length > 0 ? remaining[remaining.length - 1] : 'default';
    }
    this.renderTabs();
    this.updateHeaderAndFooter();
    window.terminalController?.switchSession(this.activeSessionId);
    window.managementTab?.switchDeviceSession(this.activeSessionId, null);
  }

  getActiveSessionDevice() {
    const session = this.sessions.get(this.activeSessionId);
    return session ? session.device : null;
  }

  updateHeaderAndFooter() {
    const session = this.sessions.get(this.activeSessionId);
    const device = session ? session.device : null;

    if (device) {
      this.statusDot.className = 'status-indicator connected';
      this.statusText.textContent = `${device.name} (${device.host}:${device.port})`;
      this.disconnectBtn.style.display = 'inline-flex';
      this.disconnectBtn.textContent = window.i18n ? window.i18n.t('btn_disconnect') : 'Kes';
    } else {
      this.statusDot.className = 'status-indicator';
      this.statusText.textContent = window.i18n ? window.i18n.t('status_idle') : 'SSH / Telnet Boşta';
      this.disconnectBtn.style.display = 'none';
    }

    const footSession = document.getElementById('footer-session-title');
    const footProto = document.getElementById('footer-protocol');
    if (footSession) footSession.textContent = device ? device.name : (window.i18n ? window.i18n.t('no_connection') : 'Bağlantı Yok');
    if (footProto) footProto.textContent = device ? device.protocol.toUpperCase() : '-';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
