// Tab 3: Cihaz Yöneticisi Controller (Ayarlar Modalı İçinde)
class DevicesTabController {
  constructor() {
    this.gridContainer = document.getElementById('devices-grid-list');
    this.openAddBtn = document.getElementById('btn-open-add-device');
    this.saveDeviceSubmitBtn = document.getElementById('btn-save-device-submit');
    this.authTypeSelect = document.getElementById('dev-form-auth-type');

    this.bindEvents();
    this.loadDevices();
  }

  bindEvents() {
    this.openAddBtn?.addEventListener('click', () => {
      this.openDeviceForm();
    });

    this.authTypeSelect?.addEventListener('change', () => {
      const val = this.authTypeSelect.value;
      const passBlock = document.getElementById('dev-auth-password-block');
      const keyBlock = document.getElementById('dev-auth-key-block');
      if (passBlock) passBlock.style.display = val === 'password' ? 'block' : 'none';
      if (keyBlock) keyBlock.style.display = val === 'privateKey' ? 'block' : 'none';
    });

    this.saveDeviceSubmitBtn?.addEventListener('click', () => {
      this.handleSaveDevice();
    });
  }

  async loadDevices() {
    if (!this.gridContainer) return;
    try {
      const devices = await window.api.getDevices();
      this.renderDevices(devices);
    } catch (err) {
      this.gridContainer.innerHTML = `<p style="color: var(--accent-rose);">Cihazlar yüklenemedi: ${err.message}</p>`;
    }
  }

  renderDevices(devices) {
    this.gridContainer.innerHTML = '';
    if (!devices || devices.length === 0) {
      this.gridContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 24px; color: var(--text-muted);">
          Henüz kayıtlı cihaz bulunmuyor. Yeni bir cihaz eklemek için <strong>"Yeni Cihaz Ekle"</strong> butonunu kullanın.
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
          <span>Tür: <strong>${dev.category || 'Genel'}</strong></span>
        </div>

        <div class="device-card-actions">
          <button class="btn btn-sm btn-edit-dev" title="Düzenle">✏️</button>
          <button class="btn btn-sm btn-danger btn-del-dev" title="Sil">🗑️</button>
          <button class="btn btn-primary btn-sm btn-connect-dev">⚡ Sekmede Bağlan</button>
        </div>
      `;

      card.querySelector('.btn-edit-dev')?.addEventListener('click', () => {
        this.openDeviceForm(dev);
      });

      card.querySelector('.btn-del-dev')?.addEventListener('click', async () => {
        if (confirm(`'${dev.name}' cihazını silmek istediğinizden emin misiniz?`)) {
          await window.api.deleteDevice(dev.id);
          this.loadDevices();
        }
      });

      card.querySelector('.btn-connect-dev')?.addEventListener('click', () => {
        this.connectDeviceInNewTab(dev);
      });

      this.gridContainer.appendChild(card);
    }
  }

  async connectDeviceInNewTab(device) {
    const sessionId = device.id || 'dev_' + Date.now();
    
    // Close Settings modal
    document.getElementById('modal-settings')?.classList.remove('active');

    // Add Session Tab in Header
    window.app?.addSessionTab(device, sessionId);

    try {
      await window.api.connect(device, 80, 24, sessionId);
      window.managementTab?.addAssistantMessage(
        `🟢 **${device.name}** (${device.host}:${device.port} - ${device.protocol.toUpperCase()}) bağlantısı başarıyla kuruldu! Cihazı yönetmek için doğrudan komutunuzu veya sorunuzu yazabilirsiniz.`
      );
    } catch (err) {
      alert(`Bağlantı hatası (${device.name}): ` + err.message);
      window.app?.closeSessionTab(sessionId);
    }
  }

  openDeviceForm(device = null) {
    const modal = document.getElementById('modal-device');
    const titleEl = document.getElementById('modal-device-title');

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
      document.getElementById('dev-form-tags').value = (device.tags || []).join(', ');
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
      document.getElementById('dev-form-tags').value = '';
    }

    this.authTypeSelect?.dispatchEvent(new Event('change'));
    modal?.classList.add('active');
  }

  async handleSaveDevice() {
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
    const tags = document.getElementById('dev-form-tags').value.split(',').map((s) => s.trim()).filter(Boolean);

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
      tags,
    };

    try {
      await window.api.saveDevice(deviceObj);
      document.getElementById('modal-device')?.classList.remove('active');
      this.loadDevices();
    } catch (err) {
      alert('Cihaz kaydedilemedi: ' + err.message);
    }
  }
}

window.devicesTab = new DevicesTabController();
