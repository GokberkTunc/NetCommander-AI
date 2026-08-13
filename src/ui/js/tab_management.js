// Tab 1: Ana Yönetim & AI Odası Controller with Fully Autonomous Loop & Per-Device Isolated Chat
class ManagementTabController {
  constructor() {
    this.chatBox = document.getElementById('ai-chat-box');
    this.inputField = document.getElementById('ai-input-text');
    this.sendBtn = document.getElementById('btn-ai-send');
    this.scanBtn = document.getElementById('btn-scan-device');
    this.clearChatBtn = document.getElementById('btn-clear-chat');
    this.activeAiBadge = document.getElementById('active-ai-badge');
    
    this.activeDeviceId = null;
    this.activeDevice = null;

    this.bindEvents();
    this.updateActiveAIBadge();
  }

  async updateActiveAIBadge() {
    try {
      const settings = await window.api.getSettings();
      const provider = settings.activeProvider;
      if (this.activeAiBadge) {
        if (provider === 'google_web_session') {
          this.activeAiBadge.textContent = 'Google AI Pro (Web)';
        } else if (provider === 'lmstudio') {
          this.activeAiBadge.textContent = `LM Studio (${settings.providers.lmstudio?.model || 'local'})`;
        } else {
          const model = settings.providers[provider]?.model || provider;
          this.activeAiBadge.textContent = `${provider.toUpperCase()} (${model})`;
        }
      }
    } catch {}
  }

  bindEvents() {
    this.sendBtn?.addEventListener('click', () => this.handleSendMessage());
    this.inputField?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });

    this.clearChatBtn?.addEventListener('click', async () => {
      if (this.activeDeviceId) {
        await window.api.clearChatHistory(this.activeDeviceId);
      }
      this.chatBox.innerHTML = '';
      this.addAssistantMessage('Sohbet geçmişi temizlendi. Cihazınız hakkında bir soru veya görev yazabilirsiniz.');
    });

    // Quick Action Chips
    document.querySelectorAll('.chip-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        if (prompt) {
          this.inputField.value = prompt;
          this.handleSendMessage();
        }
      });
    });

    // Cihazı Tanı
    this.scanBtn?.addEventListener('click', () => this.handleScanDevice());
  }

  /**
   * Switch active device session - Loads isolated chat history for this device
   */
  async switchDeviceSession(sessionId, device) {
    this.activeDevice = device;
    this.activeDeviceId = device ? device.id : null;
    this.chatBox.innerHTML = '';

    if (!device) {
      this.addAssistantMessage(
        `Merhaba! SSH veya Telnet üzerinden bağlandığınız cihazı <strong>tam otonom olarak</strong> yönetebilirim. Başlamak için üstteki <strong>"+ Yeni Bağlantı"</strong> butonuna tıklayın.`
      );
      return;
    }

    try {
      const history = await window.api.getChatHistory(device.id);
      if (history && history.length > 0) {
        for (const msg of history) {
          if (msg.role === 'user') {
            this.addUserMessage(msg.content);
          } else {
            this.renderAssistantMessage(msg);
          }
        }
      } else {
        this.addAssistantMessage(
          `🟢 **${device.name}** (${device.host}:${device.port} - ${device.protocol.toUpperCase()}) oturumundasınız.\n\nİstediğiniz görevi yazdığınızda komutlar **otomatik olarak terminale gönderilecek**, çıktıları arka planda **otomatik analiz edilip** sade bir Türkçe özet olarak sunulacaktır.`
        );
      }
    } catch (err) {
      console.warn('Chat history load error:', err);
    }
  }

  /**
   * Multi-Step Self-Correcting Autonomous Loop:
   * Supports sequential command executions (e.g. initial command fails -> Gemini self-corrects with alternative command -> auto-runs -> analyzes -> outputs final summary)
   */
  async handleSendMessage(customPrompt = null) {
    const text = (customPrompt || this.inputField.value).trim();
    if (!text) return;

    if (!customPrompt) {
      this.inputField.value = '';
      this.addUserMessage(text);
    }

    const loadingId = this.addLoadingMessage('NetCommander AI düşünüyor ve komutu hazırlıyor...');

    try {
      let currentResponse = await window.api.sendAIMessage(text);
      this.removeLoadingMessage(loadingId);
      this.renderAssistantMessage(currentResponse);

      let iteration = 0;
      let prevCmd = '';
      let prevOutput = '';

      while (
        currentResponse &&
        currentResponse.commandSuggestion &&
        currentResponse.commandSuggestion.command
      ) {
        const suggestion = currentResponse.commandSuggestion;
        if (suggestion.isDangerous) {
          // Desteklenen güvenli sınır: Tehlikeli komutlarda kullanıcı onayı beklenir
          break;
        }

        iteration++;
        const cmd = suggestion.command;

        // Sonsuz döngü koruması: Eğer model aynı komutu aynı boş çıktı ile üst üste çalıştırıyorsa kır
        if (cmd === prevCmd && prevOutput === '') {
          console.warn('Aynı komut boş çıktı ile tekrarlandı, döngü sonlandırılıyor.');
          break;
        }
        prevCmd = cmd;

        const loopLoadingId = this.addLoadingMessage(
          `⚡ [Adım ${iteration}] \`${cmd.substring(0, 45)}...\` çalıştırıldı, terminal çıktısı analiz ediliyor...`
        );

        // Terminal çıktısının PTY üzerinden akması için bekleme
        await new Promise((r) => setTimeout(r, 1800));

        let lastOutput = '';
        try {
          lastOutput = await window.api.getLastTerminalOutput(40);
        } catch (e) {
          console.warn('Terminal output read error:', e);
        }

        prevOutput = lastOutput ? lastOutput.trim() : '';

        if (!lastOutput || lastOutput.trim().length === 0) {
          this.removeLoadingMessage(loopLoadingId);
          break;
        }

        const feedbackPrompt = `Az önce çalıştırılan \`${cmd}\` komutunun terminal çıktısı aşağıdadır:\n\n\`\`\`\n${lastOutput.trim()}\n\`\`\`\nEğer bu çıktı hedeflenen bilgiyi sağlamaya yettiyse veya işlem tamamlandıysa sonucu net, sade ve anlaşılır bir Türkçe özetle açıkla. Eğer komut hata verdiyse (command not found, permission denied vb.) veya ilave bir teşhis/işlem komutu çalıştırmak gerekiyorsa yeni komutu [KOMUT]...[/KOMUT] etiketleri içinde öner.`;

        try {
          currentResponse = await window.api.sendAIMessage(feedbackPrompt);
          this.removeLoadingMessage(loopLoadingId);
          this.renderAssistantMessage(currentResponse);
        } catch (feedbackErr) {
          this.removeLoadingMessage(loopLoadingId);
          console.warn('Otomatik geri besleme hatası:', feedbackErr);
          break;
        }
      }
    } catch (err) {
      this.removeLoadingMessage(loadingId);
      this.addAssistantMessage(`❌ **Hata:** ${err.message || 'AI yanıtı alınamadı'}`);
    }
  }

  async handleScanDevice() {
    const modal = document.getElementById('modal-scan-progress');
    const progressBar = document.getElementById('scan-progress-bar');
    const progressStep = document.getElementById('scan-progress-step');

    modal?.classList.add('active');
    if (progressBar) progressBar.style.width = '10%';
    if (progressStep) progressStep.textContent = 'Bağlantı kontrol ediliyor...';

    const unbind = window.api.onScanProgress(({ step, percent }) => {
      if (progressStep) progressStep.textContent = step;
      if (progressBar) progressBar.style.width = `${percent}%`;
    });

    try {
      const blueprint = await window.api.scanDevice();
      unbind();
      setTimeout(() => {
        modal?.classList.remove('active');
        
        let report = `🔍 **Kapsamlı Cihaz Tanıma & Teşhis Raporu Tamamlandı!**\n\n`;
        report += `**Sistem Özeti:** ${blueprint.summary}\n\n`;
        report += `- **İşletim Sistemi / Dağıtım:** ${blueprint.distro} (${blueprint.architecture})\n`;
        report += `- **Kernel / Çekirdek:** \`${blueprint.kernel}\`\n`;
        report += `- **Hostname:** \`${blueprint.hostname}\`\n`;
        report += `- **İşlemci (CPU):** ${blueprint.cpuModel} (${blueprint.cpuCores} Çekirdek)\n`;
        report += `- **RAM Durumu:** Toplam ${blueprint.ramTotalMb} MB (Kullanılabilir Boş: ${blueprint.ramFreeMb} MB)\n`;
        
        if (blueprint.networkInterfaces && blueprint.networkInterfaces.length > 0) {
          report += `- **Ağ Arayüzleri:** ${blueprint.networkInterfaces.map(n => `\`${n.name}\` (${n.state}${n.ip4 ? ` - ${n.ip4}` : ''})`).join(', ')}\n`;
        }

        if (blueprint.disks && blueprint.disks.length > 0) {
          report += `- **Disk / Flash Bölümleri:**\n`;
          for (const d of blueprint.disks.slice(0, 5)) {
            report += `  - \`${d.mount}\`: ${d.used}/${d.size} (%${d.usePercent})\n`;
          }
        }

        if (blueprint.openWrtConfigs?.wireless) {
          report += `- **WiFi & Radyo:** Kablosuz radyo ve bağlı istemci taraması hafızaya alındı.\n`;
        }

        report += `\n*Tüm bu derinlemesine teşhis verileri cihaz hafızasına işlendi. AI artık cihazınızı %100 tanıyor.*`;

        this.addAssistantMessage(report);
        window.app?.updateHeaderAndFooter();
      }, 500);
    } catch (err) {
      unbind();
      modal?.classList.remove('active');
      this.addAssistantMessage(`❌ **Cihaz Tanıma Hatası:** ${err.message}`);
    }
  }

  addUserMessage(text) {
    const row = document.createElement('div');
    row.className = 'chat-row chat-row-user';

    const header = document.createElement('div');
    header.className = 'chat-bubble-header';
    header.innerHTML = `<span>👤 Siz</span>`;

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-bubble-user';
    bubble.textContent = text;

    row.appendChild(header);
    row.appendChild(bubble);
    this.chatBox.appendChild(row);
    this.scrollToBottom();
  }

  addAssistantMessage(text) {
    const row = document.createElement('div');
    row.className = 'chat-row chat-row-assistant';

    const header = document.createElement('div');
    header.className = 'chat-bubble-header';
    header.innerHTML = `<span>🤖 NetCommander AI</span> <span class="brand-badge" style="background: #064e3b; color: #34d399; font-size: 9px; margin-left: 4px;">⚡ Otonom Ajan</span>`;

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-bubble-assistant';
    bubble.innerHTML = this.formatMarkdown(text);

    row.appendChild(header);
    row.appendChild(bubble);
    this.chatBox.appendChild(row);
    this.scrollToBottom();
  }

  renderAssistantMessage(message) {
    const row = document.createElement('div');
    row.className = 'chat-row chat-row-assistant';

    const header = document.createElement('div');
    header.className = 'chat-bubble-header';
    header.innerHTML = `<span>🤖 NetCommander AI</span> <span class="brand-badge" style="background: #064e3b; color: #34d399; font-size: 9px; margin-left: 4px;">⚡ Otonom Ajan</span>`;

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-bubble-assistant';
    bubble.innerHTML = this.formatMarkdown(message.content);

    if (message.commandSuggestion) {
      const card = this.createCommandCard(message.commandSuggestion);
      bubble.appendChild(card);
    }

    row.appendChild(header);
    row.appendChild(bubble);
    this.chatBox.appendChild(row);
    this.scrollToBottom();
  }

  createCommandCard(suggestion) {
    const card = document.createElement('div');
    card.className = 'command-card';

    const isAutoExecuted = suggestion.status === 'executed';

    const header = document.createElement('div');
    header.className = 'command-card-header';
    header.innerHTML = `
      <span><strong>Komut:</strong> ${suggestion.description || 'Önerilen sistem komutu'}</span>
      <div style="display: flex; gap: 6px; align-items: center;">
        ${isAutoExecuted ? `<span class="brand-badge" style="background: #064e3b; color: #34d399; font-weight: bold;">⚡ Otomatik Çalıştırıldı</span>` : ''}
        <span class="risk-badge ${suggestion.isDangerous ? 'risk-dangerous' : 'risk-safe'}">
          ${suggestion.isDangerous ? '⚠️ TEHLİKELİ / ONAY GEREKLİ' : '✅ GÜVENLİ KOMUT'}
        </span>
      </div>
    `;

    const codeBox = document.createElement('div');
    codeBox.className = 'command-code-box';
    codeBox.textContent = suggestion.command;

    const actions = document.createElement('div');
    actions.className = 'command-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-sm';
    copyBtn.textContent = '📋 Kopyala';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(suggestion.command);
      copyBtn.textContent = 'Kopyalandı!';
      setTimeout(() => (copyBtn.textContent = '📋 Kopyala'), 1500);
    };

    const runBtn = document.createElement('button');
    runBtn.className = suggestion.isDangerous ? 'btn btn-danger btn-sm' : 'btn btn-success btn-sm';
    runBtn.textContent = isAutoExecuted ? '✓ Terminale Gönderildi' : '▶️ Terminalde Çalıştır';
    if (isAutoExecuted) runBtn.disabled = true;

    runBtn.onclick = async () => {
      try {
        await window.api.executeCommand(suggestion.command);
        runBtn.disabled = true;
        runBtn.textContent = '✓ Gönderildi';
      } catch (err) {
        alert('Komut çalıştırma hatası: ' + err.message);
      }
    };

    actions.appendChild(copyBtn);
    actions.appendChild(runBtn);

    card.appendChild(header);
    card.appendChild(codeBox);
    card.appendChild(actions);

    return card;
  }

  addLoadingMessage(text = 'NetCommander AI düşünüyor ve terminali inceliyor...') {
    const id = 'loading_' + Date.now();
    const bubble = document.createElement('div');
    bubble.id = id;
    bubble.className = 'chat-bubble chat-bubble-assistant';
    bubble.innerHTML = `<em>${text}</em>`;
    this.chatBox.appendChild(bubble);
    this.scrollToBottom();
    return id;
  }

  removeLoadingMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  formatMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Convert [KOMUT]...[/KOMUT] tags into formatted code blocks
    html = html.replace(/\[(?:KOMUT|EXEC)\]([\s\S]*?)\[\/(?:KOMUT|EXEC)\]/gi, (match, cmd) => {
      return `<pre><code class="language-bash">${cmd.trim()}</code></pre>`;
    });

    // Code blocks ```bash ... ```
    html = html.replace(/```([a-zA-Z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });

    // Inline code `...`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic *text*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Line breaks
    html = html.replace(/\n/g, '<br/>');

    return html;
  }

  scrollToBottom() {
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  }
}

window.managementTab = new ManagementTabController();
