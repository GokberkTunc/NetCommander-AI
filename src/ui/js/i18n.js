// NetCommander AI - Complete Multi-Language (i18n) Engine (TR / EN)
const I18N_DICTIONARY = {
  tr: {
    // Brand & Header
    brand_title: 'NETCOMMANDER',
    brand_badge: 'AI v1.1',
    no_connection: 'Bağlantı Yok',
    add_tab_btn: '+ Yeni Bağlantı',
    status_idle: 'SSH / Telnet Boşta',
    btn_disconnect: 'Kes',
    btn_files: '📁 Dosya Gezgini',
    btn_settings: '⚙️ Ayarlar',
    
    // Execution Modes
    mode_autonomous: '⚡ Tam Otonom (Zero-Click)',
    mode_copilot: '🛡️ Onaylı (Co-Pilot)',
    mode_advisory: '📖 Yalnızca Danışman',
    mode_title: 'AI Ajanı Çalışma Modu',

    // Quick Action Chips
    chip_ram_disk: '📊 RAM & Disk',
    chip_net_ip: '🌐 Ağ & IP',
    chip_uci: '📡 UCI',
    chip_wifi: '📶 WiFi',
    prompt_ram_disk: 'Cihazın CPU, RAM ve Disk kullanım durumunu detaylı incele.',
    prompt_net_ip: 'Aktif ağ arayüzlerini, IP adreslerini ve routing tablosunu analiz et.',
    prompt_uci: 'OpenWrt UCI yapılandırmasını (system, network, wireless) kontrol et.',
    prompt_wifi: 'Kablosuz ağları (WiFi) ve bağlı olan kablosuz istemcileri listele.',

    // Chat Area
    ai_agent_title: 'AI Ağ Ajanı',
    btn_scan_device: '🔍 Cihazı Tanı',
    btn_clear_chat: 'Temizle',
    input_placeholder: 'AI Ajanına bir görev verin (örn: cihaz ne zamandır açık, kablosuz ağları listele)...',
    btn_send: 'Gönder',
    welcome_message: 'Merhaba! SSH veya Telnet üzerinden bağlandığınız cihazı <strong>tam otonom veya onaylı</strong> olarak yönetebilirim. Başlamak için üstteki <strong>"+ Yeni Bağlantı"</strong> butonuna tıklayın.',
    you: '👤 Siz',
    assistant: '🤖 NetCommander AI',
    badge_autonomous: '⚡ Otonom Ajan',
    badge_copilot: '🛡️ Co-Pilot',
    badge_advisory: '📖 Danışman',
    badge_auto_executed: '⚡ Otomatik Çalıştırıldı',
    badge_awaiting_approval: '⏳ Onay Bekliyor',
    risk_safe: '✅ GÜVENLİ KOMUT',
    risk_dangerous: '⚠️ TEHLİKELİ / ONAY GEREKLİ',
    cmd_label: 'Komut:',
    cmd_default_desc: 'Önerilen sistem komutu',
    btn_copy: '📋 Kopyala',
    btn_copied: 'Kopyalandı!',
    btn_run_terminal: '▶️ Terminalde Çalıştır',
    btn_sent_to_term: '✓ Terminale Gönderildi',
    ai_thinking: 'NetCommander AI düşünüyor ve komutu hazırlıyor...',
    step_indicator: 'çalıştırıldı, terminal çıktısı analiz ediliyor...',
    chat_cleared: 'Sohbet geçmişi temizlendi.',
    session_active_msg: '🟢 **{name}** ({host}:{port} - {protocol}) oturumundasınız.\n\nİstediğiniz görevi yazarak cihazınızı yönetebilirsiniz.',

    // Terminal Pane
    terminal_idle: '[Canlı Terminal - Boşta]',
    terminal_connected: '[Canlı Terminal - {name} ({host})]',
    btn_term_clear: 'Temizle',
    btn_term_copy: 'Kopyala',
    btn_term_paste: 'Yapıştır',
    btn_term_toggle: 'Terminali Küçült / Genişlet',

    // Footer
    footer_session: 'Aktif Oturum:',
    footer_protocol: 'Protokol:',
    footer_memory: 'Hafıza Kaydı:',

    // Scan Modal
    scan_title: '🔍 Cihaz Tanıma Taraması',
    scan_checking: 'Bağlantı ve sistem bilgileri kontrol ediliyor...',
    scan_completed_title: '🔍 Kapsamlı Cihaz Tanıma & Teşhis Raporu Tamamlandı!',
    scan_summary: 'Sistem Özeti:',
    scan_error: 'Cihaz Tanıma Hatası:',

    // Settings Window
    settings_title: 'NetCommander AI - Ayarlar & Cihaz Yöneticisi',
    nav_devices: '🖥️ Cihaz Yöneticisi',
    nav_ai_providers: '🤖 AI Sağlayıcıları (Tümü)',
    nav_google_session: '🌐 Google AI Pro (Web)',
    nav_local_llms: '💻 Yerel Modeller (LM Studio & Ollama)',
    nav_preferences: '🛡️ Tercihler & Dil',
    nav_debug_logs: '📜 Hata Ayıklama & Loglar',

    // Settings - Devices Subtab
    devices_header_title: 'Kayıtlı Ağ Cihazları',
    devices_header_desc: 'Cihazlarınıza tek tıkla bağlanabilir, düzenleyebilir veya yeni cihaz ekleyebilirsiniz.',
    btn_add_device: '➕ Yeni Cihaz Ekle',
    devices_loading: 'Cihazlar yükleniyor...',
    devices_empty: 'Henüz kayıtlı cihaz yok. "Yeni Cihaz Ekle" butonunu kullanın.',
    btn_connect_main: '⚡ Ana Ekranda Bağlan',
    btn_edit: '✏️ Düzenle',
    btn_delete: '🗑️',
    confirm_delete_device: "'{name}' cihazını silmek istediğinize emin misiniz?",
    btn_connecting: 'Bağlanıyor...',
    btn_connected_active: '✓ Bağlandı (Ana Pencerede Aktif)',

    // Device Dialog Modal
    dialog_new_device: 'Yeni Cihaz Bağlantısı',
    dialog_edit_device: 'Cihazı Düzenle',
    lbl_device_name: 'Cihaz / Bağlantı Adı',
    ph_device_name: 'Örn: Ev OpenWrt Router',
    lbl_ip_host: 'IP Adresi / Hostname',
    lbl_port: 'Port',
    lbl_protocol: 'Protokol',
    lbl_category: 'Cihaz Kategorisi',
    lbl_username: 'Kullanıcı Adı',
    lbl_auth_type: 'Kimlik Doğrulama Türü',
    opt_auth_password: 'Şifre (Password)',
    opt_auth_key: 'SSH Private Key',
    opt_auth_none: 'Şifresiz',
    lbl_password: 'Şifre',
    lbl_private_key: 'SSH Private Key',
    btn_cancel: 'İptal',
    btn_save: 'Kaydet',

    // Settings - AI Providers Subtab
    lbl_active_ai_engine: 'Aktif Yapay Zeka Motoru',
    opt_ai_google_web: '🌐 Google AI Pro / Gemini Web (API Key Gerekmez)',
    opt_ai_lmstudio: '💻 LM Studio (Yerel - localhost:1234)',
    opt_ai_ollama: '🦙 Ollama (Yerel - localhost:11434)',
    opt_ai_custom: '⚙️ Özel OpenAI Uyumlu Yerel/Uzak Uç Nokta',
    opt_ai_deepseek: '🐋 DeepSeek API (DeepSeek-V3 & R1)',
    opt_ai_groq: '⚡ Groq API (Ultra Hızlı Llama 3.3)',
    opt_ai_openrouter: '🔀 OpenRouter API (Yüzlerce Model)',
    opt_ai_gemini: 'Google Gemini API',
    opt_ai_openai: 'OpenAI (ChatGPT API)',
    opt_ai_anthropic: 'Anthropic Claude API',
    opt_ai_mistral: 'Mistral AI API',
    lbl_api_key: 'API Anahtarı',
    lbl_model: 'Model',
    lbl_endpoint_url: 'Uç Nokta URL',
    btn_test_connection: 'Bağlantıyı Test Et',
    testing_connection: '⏳ Test ediliyor...',

    // Settings - Google Session Subtab
    google_session_title: 'Google AI Pro / Gemini Advanced Web Oturumu',
    google_session_desc: 'Herhangi bir API anahtarı gerekmeden, mevcut <strong>Google Hesabınız / Google AI Pro (Gemini Advanced)</strong> aboneliğiniz ile doğrudan giriş yaparak NetCommander AI\'ı tam yetkiyle kullanabilirsiniz.',
    btn_google_login: 'Google Hesabı ile Giriş Yap',
    btn_google_logout: 'Oturumu Kapat',
    lbl_google_session_status: 'Oturum Durumu:',
    status_google_logged_in: '🟢 Giriş Yapıldı ({count} çerez)',
    status_google_logged_out: '🔴 Oturum Kapalı / Giriş Yapılmadı',

    // Settings - Local LLMs Subtab
    lmstudio_title: '💻 LM Studio (Local Inference)',
    lmstudio_desc: 'LM Studio\'da yerel sunucuyu başlattıktan sonra bu adresten internetsiz LLM çalıştırabilirsiniz.',
    ollama_title: '🦙 Ollama (Local Inference)',
    ollama_desc: 'Bilgisayarınızdaki Ollama servisi (`ollama serve`) üzerinden Llama 3.2, Qwen2.5, DeepSeek R1 modellerini çalıştırın.',

    // Settings - Preferences Subtab
    lbl_app_language: 'Uygulama Dili / Language',
    lbl_default_exec_mode: 'Varsayılan AI Ajanı Çalışma Modu',
    opt_mode_auto: '⚡ Tam Otonom (Zero-Click - Otomatik İcra & Analiz)',
    opt_mode_copilot: '🛡️ Onaylı Co-Pilot (Kullanıcıdan Komut Onayı Bekler)',
    opt_mode_advisory: '📖 Yalnızca Danışman (Komut Çalıştırmaz)',
    lbl_close_to_tray: 'Pencere kapatıldığında sistem tepsisinde (Tray) çalışmaya devam et',
    lbl_minimize_to_tray: 'Simge durumuna küçültüldüğünde tepsiye gizle',
    lbl_terminal_theme: 'Terminal Teması',
    lbl_terminal_font_size: 'Terminal Yazı Boyutu',
    btn_save_all_settings: 'Ayarları Kaydet',
    settings_saved_success: '✓ Ayarlar başarıyla kaydedildi.',

    // Settings - Debug Logs Subtab
    logs_title: 'Sistem Hata Ayıklama Günlüğü (debug.log)',
    logs_location: 'Konum: logs/debug.log',
    btn_refresh_logs: '🔄 Yenile',
    btn_copy_logs: '📋 Kopyala',
    btn_open_log_folder: '📁 Klasörü Aç',
    btn_clear_logs: '🗑️ Temizle',
    logs_copied_alert: 'Loglar panoya kopyalandı.',
    logs_empty: 'Henüz log kaydı bulunmuyor.',

    // Files Explorer (SFTP) Window
    files_window_title: 'NetCommander AI - Dosya Gezgini (SFTP / Shell)',
    files_header_title: 'Dosya Gezgini (SFTP & Dropbear)',
    lbl_path: 'Konum:',
    btn_files_refresh: '🔄 Yenile',
    btn_files_new_folder: '📁 Yeni Klasör',
    btn_files_upload: '⬆️ Dosya Yükle',
    col_name: 'Ad',
    col_type: 'Tür',
    col_size: 'Boyut',
    col_modified: 'Değiştirilme',
    col_permissions: 'İzinler',
    col_actions: 'İşlemler',
    action_open: 'Aç',
    action_download: 'İndir',
    action_delete: 'Sil',
    btn_editor_save: '💾 Kaydet',
    btn_editor_close: 'Kapat',
    msg_dir_loading: 'Dizin listeleniyor...',
    msg_file_saved: '✓ Dosya başarıyla kaydedildi.',
    confirm_delete_file: "'{name}' öğesini silmek istediğinize emin misiniz?",
    prompt_new_folder: 'Yeni klasör adı:',
  },
  en: {
    // Brand & Header
    brand_title: 'NETCOMMANDER',
    brand_badge: 'AI v1.1',
    no_connection: 'No Connection',
    add_tab_btn: '+ New Connection',
    status_idle: 'SSH / Telnet Idle',
    btn_disconnect: 'Disconnect',
    btn_files: '📁 File Explorer',
    btn_settings: '⚙️ Settings',

    // Execution Modes
    mode_autonomous: '⚡ Full Autonomous (Zero-Click)',
    mode_copilot: '🛡️ Interactive Co-Pilot',
    mode_advisory: '📖 Advisory Only',
    mode_title: 'AI Agent Execution Mode',

    // Quick Action Chips
    chip_ram_disk: '📊 RAM & Disks',
    chip_net_ip: '🌐 Network & IP',
    chip_uci: '📡 UCI',
    chip_wifi: '📶 WiFi',
    prompt_ram_disk: 'Investigate CPU, RAM, and Disk usage details.',
    prompt_net_ip: 'Analyze active network interfaces, IP addresses, and routing table.',
    prompt_uci: 'Inspect OpenWrt UCI configuration (system, network, wireless).',
    prompt_wifi: 'List wireless networks (WiFi) and connected wireless clients.',

    // Chat Area
    ai_agent_title: 'AI Network Agent',
    btn_scan_device: '🔍 Identify Device',
    btn_clear_chat: 'Clear',
    input_placeholder: 'Assign a task to AI Agent (e.g. check system uptime, list wireless clients)...',
    btn_send: 'Send',
    welcome_message: 'Hello! I can manage your connected SSH or Telnet devices <strong>fully autonomously or with interactive approval</strong>. Click <strong>"+ New Connection"</strong> above to get started.',
    you: '👤 You',
    assistant: '🤖 NetCommander AI',
    badge_autonomous: '⚡ Autonomous Agent',
    badge_copilot: '🛡️ Co-Pilot',
    badge_advisory: '📖 Advisor',
    badge_auto_executed: '⚡ Auto-Executed',
    badge_awaiting_approval: '⏳ Awaiting Approval',
    risk_safe: '✅ SAFE COMMAND',
    risk_dangerous: '⚠️ DANGEROUS / CONFIRMATION REQUIRED',
    cmd_label: 'Command:',
    cmd_default_desc: 'Suggested system command',
    btn_copy: '📋 Copy',
    btn_copied: 'Copied!',
    btn_run_terminal: '▶️ Run in Terminal',
    btn_sent_to_term: '✓ Sent to Terminal',
    ai_thinking: 'NetCommander AI is thinking and preparing commands...',
    step_indicator: 'executed, analyzing output...',
    chat_cleared: 'Chat history cleared.',
    session_active_msg: '🟢 Connected to **{name}** ({host}:{port} - {protocol}).\n\nEnter any command or task to begin managing your device.',

    // Terminal Pane
    terminal_idle: '[Live Terminal - Idle]',
    terminal_connected: '[Live Terminal - {name} ({host})]',
    btn_term_clear: 'Clear',
    btn_term_copy: 'Copy',
    btn_term_paste: 'Paste',
    btn_term_toggle: 'Minimize / Expand Terminal',

    // Footer
    footer_session: 'Active Session:',
    footer_protocol: 'Protocol:',
    footer_memory: 'Memory Records:',

    // Scan Modal
    scan_title: '🔍 Device Discovery Scan',
    scan_checking: 'Checking connection and system probes...',
    scan_completed_title: '🔍 Deep Device Discovery & Diagnostic Report Completed!',
    scan_summary: 'System Summary:',
    scan_error: 'Device Discovery Error:',

    // Settings Window
    settings_title: 'NetCommander AI - Settings & Device Manager',
    nav_devices: '🖥️ Device Manager',
    nav_ai_providers: '🤖 AI Providers (All)',
    nav_google_session: '🌐 Google AI Pro (Web)',
    nav_local_llms: '💻 Local LLMs (LM Studio & Ollama)',
    nav_preferences: '🛡️ Preferences & Language',
    nav_debug_logs: '📜 Debug Logs',

    // Settings - Devices Subtab
    devices_header_title: 'Registered Network Devices',
    devices_header_desc: 'Connect in one click, edit device configurations, or register new SSH/Telnet hosts.',
    btn_add_device: '➕ Add New Device',
    devices_loading: 'Loading devices...',
    devices_empty: 'No registered devices found. Click "Add New Device" to create one.',
    btn_connect_main: '⚡ Connect on Main Screen',
    btn_edit: '✏️ Edit',
    btn_delete: '🗑️',
    confirm_delete_device: "Are you sure you want to delete '{name}'?",
    btn_connecting: 'Connecting...',
    btn_connected_active: '✓ Connected (Active on Main)',

    // Device Dialog Modal
    dialog_new_device: 'Add New Device Connection',
    dialog_edit_device: 'Edit Device Connection',
    lbl_device_name: 'Device / Connection Name',
    ph_device_name: 'e.g., Home OpenWrt Router',
    lbl_ip_host: 'IP Address / Hostname',
    lbl_port: 'Port',
    lbl_protocol: 'Protocol',
    lbl_category: 'Device Category',
    lbl_username: 'Username',
    lbl_auth_type: 'Authentication Type',
    opt_auth_password: 'Password',
    opt_auth_key: 'SSH Private Key',
    opt_auth_none: 'None',
    lbl_password: 'Password',
    lbl_private_key: 'SSH Private Key',
    btn_cancel: 'Cancel',
    btn_save: 'Save',

    // Settings - AI Providers Subtab
    lbl_active_ai_engine: 'Active AI Engine',
    opt_ai_google_web: '🌐 Google AI Pro / Gemini Web (No API Key Required)',
    opt_ai_lmstudio: '💻 LM Studio (Local - localhost:1234)',
    opt_ai_ollama: '🦙 Ollama (Local - localhost:11434)',
    opt_ai_custom: '⚙️ Custom OpenAI-Compatible Local/Remote Endpoint',
    opt_ai_deepseek: '🐋 DeepSeek API (DeepSeek-V3 & R1)',
    opt_ai_groq: '⚡ Groq API (Ultra-Fast Llama 3.3)',
    opt_ai_openrouter: '🔀 OpenRouter API (Hundreds of Models)',
    opt_ai_gemini: 'Google Gemini API',
    opt_ai_openai: 'OpenAI (ChatGPT API)',
    opt_ai_anthropic: 'Anthropic Claude API',
    opt_ai_mistral: 'Mistral AI API',
    lbl_api_key: 'API Key',
    lbl_model: 'Model',
    lbl_endpoint_url: 'Endpoint URL',
    btn_test_connection: 'Test Connection',
    testing_connection: '⏳ Testing connection...',

    // Settings - Google Session Subtab
    google_session_title: 'Google AI Pro / Gemini Advanced Web Session',
    google_session_desc: 'Log in directly with your existing <strong>Google Account / Google AI Pro (Gemini Advanced)</strong> subscription without needing any API keys for unlimited, zero-cost intelligence.',
    btn_google_login: 'Log in with Google Account',
    btn_google_logout: 'Sign Out',
    lbl_google_session_status: 'Session Status:',
    status_google_logged_in: '🟢 Logged In ({count} cookies active)',
    status_google_logged_out: '🔴 Logged Out / Not Connected',

    // Settings - Local LLMs Subtab
    lmstudio_title: '💻 LM Studio (Local Inference)',
    lmstudio_desc: 'Run privacy-first local LLMs offline without internet by starting the Local Server in LM Studio.',
    ollama_title: '🦙 Ollama (Local Inference)',
    ollama_desc: 'Run local models such as Llama 3.2, Qwen2.5, and DeepSeek R1 via your local Ollama daemon (`ollama serve`).',

    // Settings - Preferences Subtab
    lbl_app_language: 'Application Language / Dil',
    lbl_default_exec_mode: 'Default AI Agent Execution Mode',
    opt_mode_auto: '⚡ Full Autonomous (Zero-Click - Auto-Executes & Analyzes)',
    opt_mode_copilot: '🛡️ Interactive Co-Pilot (Waits for User Command Approval)',
    opt_mode_advisory: '📖 Advisory Only (Never Executes Commands)',
    lbl_close_to_tray: 'Keep running in Windows System Tray when window is closed',
    lbl_minimize_to_tray: 'Minimize to tray icon when minimized',
    lbl_terminal_theme: 'Terminal Theme',
    lbl_terminal_font_size: 'Terminal Font Size',
    btn_save_all_settings: 'Save Settings',
    settings_saved_success: '✓ Settings saved successfully.',

    // Settings - Debug Logs Subtab
    logs_title: 'System Debugging Log (debug.log)',
    logs_location: 'Location: logs/debug.log',
    btn_refresh_logs: '🔄 Refresh',
    btn_copy_logs: '📋 Copy',
    btn_open_log_folder: '📁 Open Folder',
    btn_clear_logs: '🗑️ Clear',
    logs_copied_alert: 'Logs copied to clipboard.',
    logs_empty: 'No logs recorded yet.',

    // Files Explorer (SFTP) Window
    files_window_title: 'NetCommander AI - File Explorer (SFTP / Shell)',
    files_header_title: 'File Explorer (SFTP & Dropbear)',
    lbl_path: 'Path:',
    btn_files_refresh: '🔄 Refresh',
    btn_files_new_folder: '📁 New Folder',
    btn_files_upload: '⬆️ Upload File',
    col_name: 'Name',
    col_type: 'Type',
    col_size: 'Size',
    col_modified: 'Modified',
    col_permissions: 'Permissions',
    col_actions: 'Actions',
    action_open: 'Open',
    action_download: 'Download',
    action_delete: 'Delete',
    btn_editor_save: '💾 Save',
    btn_editor_close: 'Close',
    msg_dir_loading: 'Listing directory...',
    msg_file_saved: '✓ File saved successfully.',
    confirm_delete_file: "Are you sure you want to delete '{name}'?",
    prompt_new_folder: 'New folder name:',
  },
};

class I18nManager {
  constructor() {
    this.currentLang = 'tr';
  }

  async init() {
    try {
      const settings = await window.api.getSettings();
      if (settings && settings.language) {
        this.currentLang = settings.language;
      }
    } catch {}
    this.applyTranslations();
  }

  t(key, replacements = {}) {
    const dict = I18N_DICTIONARY[this.currentLang] || I18N_DICTIONARY.tr;
    let text = dict[key] !== undefined ? dict[key] : (I18N_DICTIONARY.en[key] !== undefined ? I18N_DICTIONARY.en[key] : key);
    for (const [k, v] of Object.entries(replacements)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return text;
  }

  async setLanguage(lang) {
    this.currentLang = lang === 'en' ? 'en' : 'tr';
    try {
      await window.api.saveSettings({ language: this.currentLang });
    } catch {}
    this.applyTranslations();
  }

  toggleLanguage() {
    const nextLang = this.currentLang === 'tr' ? 'en' : 'tr';
    this.setLanguage(nextLang);
    return nextLang;
  }

  applyTranslations() {
    // 1. Text Content
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    // 2. Inner HTML Content (for elements with <strong> etc.)
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      if (key) {
        el.innerHTML = this.t(key);
      }
    });

    // 3. Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', this.t(key));
      }
    });

    // 4. Tooltip Titles
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.setAttribute('title', this.t(key));
      }
    });

    // 5. Select Options
    document.querySelectorAll('option[data-i18n]').forEach((opt) => {
      const key = opt.getAttribute('data-i18n');
      if (key) {
        opt.textContent = this.t(key);
      }
    });

    // 6. Language Button Text
    const langBtn = document.getElementById('btn-lang-switch');
    if (langBtn) {
      langBtn.textContent = this.currentLang === 'tr' ? '🌐 TR' : '🌐 EN';
      langBtn.title = this.currentLang === 'tr' ? 'Switch to English' : 'Türkçe Dilini Seç';
    }

    // 7. Execution Mode Dropdown text sync
    const modeSelect = document.getElementById('execution-mode-select');
    if (modeSelect) {
      const optAuto = modeSelect.querySelector('option[value="autonomous"]');
      if (optAuto) optAuto.textContent = this.t('mode_autonomous');
      const optCo = modeSelect.querySelector('option[value="copilot"]');
      if (optCo) optCo.textContent = this.t('mode_copilot');
      const optAdv = modeSelect.querySelector('option[value="advisory"]');
      if (optAdv) optAdv.textContent = this.t('mode_advisory');
    }

    // 8. Dynamic quick prompt updates
    document.querySelectorAll('.chip-btn').forEach((btn) => {
      const key = btn.getAttribute('data-i18n');
      if (key === 'chip_ram_disk') btn.setAttribute('data-prompt', this.t('prompt_ram_disk'));
      if (key === 'chip_net_ip') btn.setAttribute('data-prompt', this.t('prompt_net_ip'));
      if (key === 'chip_uci') btn.setAttribute('data-prompt', this.t('prompt_uci'));
      if (key === 'chip_wifi') btn.setAttribute('data-prompt', this.t('prompt_wifi'));
    });
  }
}

window.i18n = new I18nManager();
