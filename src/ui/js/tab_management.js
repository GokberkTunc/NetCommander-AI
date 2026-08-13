// Tab 1: Ana Yönetim & AI Odası Controller with Execution Modes (Autonomous, Co-Pilot, Advisory) & i18n
class ManagementTabController {
  constructor() {
    this.chatBox = document.getElementById('ai-chat-box');
    this.inputField = document.getElementById('ai-input-text');
    this.sendBtn = document.getElementById('btn-ai-send');
    this.scanBtn = document.getElementById('btn-scan-device');
    this.clearChatBtn = document.getElementById('btn-clear-chat');
    
    this.activeDeviceId = null;
    this.activeDevice = null;
    this.executionMode = 'autonomous'; // 'autonomous' | 'copilot' | 'advisory'

    this.bindEvents();
  }

  setExecutionMode(mode) {
    this.executionMode = mode;
    const badge = document.getElementById('active-mode-badge');
    if (badge) {
      if (mode === 'autonomous') {
        badge.style.background = '#064e3b';
        badge.style.color = '#34d399';
        badge.textContent = window.i18n ? window.i18n.t('badge_autonomous') : '⚡ Otonom Ajan';
      } else if (mode === 'copilot') {
        badge.style.background = '#1e3a8a';
        badge.style.color = '#60a5fa';
        badge.textContent = window.i18n ? window.i18n.t('badge_copilot') : '🛡️ Co-Pilot';
      } else {
        badge.style.background = '#374151';
        badge.style.color = '#9ca3af';
        badge.textContent = '📖 Danışman';
      }
    }
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
      this.addAssistantMessage(window.i18n ? window.i18n.t('welcome_message') : 'Sohbet temizlendi.');
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
        window.i18n ? window.i18n.t('welcome_message') : 'Merhaba! Başlamak için üstteki "+ Yeni Bağlantı" butonuna tıklayın.'
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
          `🟢 **${device.name}** (${device.host}:${device.port} - ${device.protocol.toUpperCase()}) oturumundasınız.\n\nİstediğiniz görevi yazarak cihazınızı yönetebilirsiniz.`
        );
      }
    } catch (err) {
      console.warn('Chat history load error:', err);
    }
  }

  /**
   * Handle sending message with Autonomous vs. Co-Pilot branching
   */
  async handleSendMessage(customPrompt = null) {
    const text = (customPrompt || this.inputField.value).trim();
    if (!text) return;

    if (!customPrompt) {
      this.inputField.value = '';
      this.addUserMessage(text);
    }

    const loadingId = this.addLoadingMessage(
      window.i18n ? window.i18n.t('ai_thinking') : 'NetCommander AI düşünüyor ve komutu hazırlıyor...'
    );

    try {
      let currentResponse = await window.api.sendAIMessage(text);
      this.removeLoadingMessage(loadingId);
      this.renderAssistantMessage(currentResponse);

      // Branch based on Execution Mode
      if (this.executionMode === 'advisory') {
        // Advisory mode does not execute commands
        return;
      }

      if (this.executionMode === 'copilot') {
        // Co-Pilot mode waits for user to click Run on the card
        return;
      }

      // FULL AUTONOMOUS (Zero-Click) Loop
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
          break;
        }

        iteration++;
        const cmd = suggestion.command;

        if (cmd === prevCmd && prevOutput === '') {
          break;
        }
        prevCmd = cmd;

        const loopLoadingId = this.addLoadingMessage(
          `⚡ [Adım ${iteration}] \`${cmd.substring(0, 45)}...\` ${window.i18n ? window.i18n.t('step_indicator') : 'çalıştırıldı, terminal çıktısı analiz ediliyor...'}`
        );

        await new Promise((r) => setTimeout(r, 1800));

        let lastOutput = '';
        try {
          lastOutput = await window.api.getLastTerminalOutput(40);
        } catch (e) {}

        prevOutput = lastOutput ? lastOutput.trim() : '';

        if (!lastOutput || lastOutput.trim().length === 0) {
          this.removeLoadingMessage(loopLoadingId);
          break;
        }

        const isEnglish = window.i18n && window.i18n.currentLang === 'en';
        const feedbackPrompt = isEnglish
          ? `The terminal output for \`${cmd}\` is shown below:\n\n\`\`\`\n${lastOutput.trim()}\n\`\`\`\nIf this output is sufficient to fulfill the user's request, provide a clear, concise summary. If the command errored or additional diagnostic commands are needed, suggest the next command wrapped in [KOMUT]...[/KOMUT] tags.`
          : `Az önce çalıştırılan \`${cmd}\` komutunun terminal çıktısı aşağıdadır:\n\n\`\`\`\n${lastOutput.trim()}\n\`\`\`\nEğer bu çıktı hedeflenen bilgiyi sağlamaya yettiyse veya işlem tamamlandıysa sonucu net, sade ve anlaşılır bir Türkçe özetle açıkla. Eğer komut hata verdiyse veya ilave bir komut çalıştırmak gerekiyorsa yeni komutu [KOMUT]...[/KOMUT] etiketleri içinde öner.`;

        try {
          currentResponse = await window.api.sendAIMessage(feedbackPrompt);
          this.removeLoadingMessage(loopLoadingId);
          this.renderAssistantMessage(currentResponse);
        } catch (feedbackErr) {
          this.removeLoadingMessage(loopLoadingId);
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
    if (progressStep) progressStep.textContent = window.i18n ? window.i18n.t('scan_checking') : 'Bağlantı kontrol ediliyor...';

    const unbind = window.api.onScanProgress(({ step, percent }) => {
      if (progressStep) progressStep.textContent = step;
      if (progressBar) progressBar.style.width = `${percent}%`;
    });

    try {
      const blueprint = await window.api.scanDevice();
      unbind();
      setTimeout(() => {
        modal?.classList.remove('active');
        
        let report = `🔍 **${window.i18n ? window.i18n.t('scan_completed_title') : 'Kapsamlı Cihaz Tanıma & Teşhis Raporu Tamamlandı!'}**\n\n`;
        report += `**Sistem Özeti:** ${blueprint.summary}\n\n`;
        report += `- **OS / Distro:** ${blueprint.distro} (${blueprint.architecture})\n`;
        report += `- **Kernel:** \`${blueprint.kernel}\`\n`;
        report += `- **Hostname:** \`${blueprint.hostname}\`\n`;
        report += `- **CPU:** ${blueprint.cpuModel} (${blueprint.cpuCores} Cores)\n`;
        report += `- **RAM:** Total ${blueprint.ramTotalMb} MB (Free: ${blueprint.ramFreeMb} MB)\n`;
        
        if (blueprint.networkInterfaces && blueprint.networkInterfaces.length > 0) {
          report += `- **Interfaces:** ${blueprint.networkInterfaces.map(n => `\`${n.name}\` (${n.status}${n.ip4 ? ` - ${n.ip4}` : ''})`).join(', ')}\n`;
        }

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
    header.innerHTML = `<span>${window.i18n ? window.i18n.t('you') : '👤 Siz'}</span>`;

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
    header.innerHTML = `<span>${window.i18n ? window.i18n.t('assistant') : '🤖 NetCommander AI'}</span>`;

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
    header.innerHTML = `<span>${window.i18n ? window.i18n.t('assistant') : '🤖 NetCommander AI'}</span>`;

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

    const isAutoExecuted = this.executionMode === 'autonomous' && suggestion.status === 'executed';

    const header = document.createElement('div');
    header.className = 'command-card-header';
    header.innerHTML = `
      <span><strong>Komut:</strong> ${suggestion.description || 'Önerilen sistem komutu'}</span>
      <div style="display: flex; gap: 6px; align-items: center;">
        ${isAutoExecuted ? `<span class="brand-badge" style="background: #064e3b; color: #34d399; font-weight: bold;">${window.i18n ? window.i18n.t('badge_auto_executed') : '⚡ Otomatik Çalıştırıldı'}</span>` : ''}
        ${!isAutoExecuted && this.executionMode === 'copilot' ? `<span class="brand-badge" style="background: #1e3a8a; color: #60a5fa; font-weight: bold;">${window.i18n ? window.i18n.t('badge_awaiting_approval') : '⏳ Onay Bekliyor'}</span>` : ''}
        <span class="risk-badge ${suggestion.isDangerous ? 'risk-dangerous' : 'risk-safe'}">
          ${suggestion.isDangerous ? (window.i18n ? window.i18n.t('risk_dangerous') : '⚠️ TEHLİKELİ / ONAY GEREKLİ') : (window.i18n ? window.i18n.t('risk_safe') : '✅ GÜVENLİ KOMUT')}
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
    copyBtn.textContent = window.i18n ? window.i18n.t('btn_copy') : '📋 Kopyala';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(suggestion.command);
      copyBtn.textContent = window.i18n ? window.i18n.t('btn_copied') : 'Kopyalandı!';
      setTimeout(() => (copyBtn.textContent = window.i18n ? window.i18n.t('btn_copy') : '📋 Kopyala'), 1500);
    };

    const runBtn = document.createElement('button');
    runBtn.className = suggestion.isDangerous ? 'btn btn-danger btn-sm' : 'btn btn-success btn-sm';
    runBtn.textContent = isAutoExecuted ? (window.i18n ? window.i18n.t('btn_sent_to_term') : '✓ Terminale Gönderildi') : (window.i18n ? window.i18n.t('btn_run_terminal') : '▶️ Terminalde Çalıştır');
    if (isAutoExecuted) runBtn.disabled = true;

    runBtn.onclick = async () => {
      try {
        await window.api.executeCommand(suggestion.command);
        runBtn.disabled = true;
        runBtn.textContent = window.i18n ? window.i18n.t('btn_sent_to_term') : '✓ Gönderildi';

        // In Co-Pilot mode, after running, optionally trigger feedback loop
        if (this.executionMode === 'copilot') {
          await new Promise((r) => setTimeout(r, 1800));
          const lastOutput = await window.api.getLastTerminalOutput(40);
          if (lastOutput && lastOutput.trim().length > 0) {
            const isEnglish = window.i18n && window.i18n.currentLang === 'en';
            const feedbackPrompt = isEnglish
              ? `The user approved and executed \`${suggestion.command}\`. Terminal output:\n\n\`\`\`\n${lastOutput.trim()}\n\`\`\`\nPlease analyze this output.`
              : `Kullanıcı \`${suggestion.command}\` komutunu onaylayıp çalıştırdı. Terminal çıktısı:\n\n\`\`\`\n${lastOutput.trim()}\n\`\`\`\nLütfen bu çıktıyı inceleyip sonucu Türkçe olarak özetle.`;
            
            const nextResp = await window.api.sendAIMessage(feedbackPrompt);
            this.renderAssistantMessage(nextResp);
          }
        }
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
