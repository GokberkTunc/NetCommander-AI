// Terminal Controller using xterm.js with Multi-Session Buffer Support
class TerminalController {
  constructor() {
    this.term = null;
    this.fitAddon = null;
    this.container = document.getElementById('terminal-view-container');
    this.activeSessionId = 'default';
    this.sessionBuffers = new Map(); // sessionId -> string buffer

    this.initTerminal();
    this.bindEvents();
  }

  initTerminal() {
    if (!window.Terminal) {
      console.error('xterm.js library is not loaded');
      return;
    }

    const themeColors = {
      background: '#000000',
      foreground: '#e2e8f0',
      cursor: '#00e676',
      selectionBackground: 'rgba(0, 230, 118, 0.3)',
      black: '#000000',
      red: '#ff5252',
      green: '#00e676',
      yellow: '#ffd600',
      blue: '#2979ff',
      magenta: '#e040fb',
      cyan: '#00e5ff',
      white: '#ffffff',
      brightBlack: '#546e7a',
      brightRed: '#ff8a80',
      brightGreen: '#b9f6ca',
      brightYellow: '#ffff8d',
      brightBlue: '#82b1ff',
      brightMagenta: '#ea80fc',
      brightCyan: '#84ffff',
      brightWhite: '#ffffff',
    };

    this.term = new window.Terminal({
      fontFamily: "'Consolas', 'Courier New', 'Fira Code', monospace",
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      theme: themeColors,
      scrollback: 5000,
      allowTransparency: false,
    });

    if (window.FitAddon && window.FitAddon.FitAddon) {
      this.fitAddon = new window.FitAddon.FitAddon();
      this.term.loadAddon(this.fitAddon);
    }

    if (window.WebLinksAddon && window.WebLinksAddon.WebLinksAddon) {
      this.term.loadAddon(new window.WebLinksAddon.WebLinksAddon());
    }

    if (this.container) {
      this.term.open(this.container);
      setTimeout(() => this.fit(), 100);
    }

    // Send user keystrokes to main process for active session
    this.term.onData((data) => {
      window.api.writeTerminal(data, this.activeSessionId);
    });

    // Receive terminal stdout from backend (unwraps both string and object payloads)
    window.api.onTerminalData((payload) => {
      let rawText = '';
      let sid = 'default';

      if (typeof payload === 'string') {
        rawText = payload;
      } else if (payload && typeof payload === 'object') {
        rawText = payload.data || '';
        sid = payload.sessionId || 'default';
      }

      if (!rawText) return;

      // Append to session buffer
      const currentBuf = this.sessionBuffers.get(sid) || '';
      // Limit buffer to 120KB per session
      const newBuf = (currentBuf + rawText).slice(-120000);
      this.sessionBuffers.set(sid, newBuf);

      // If active session, write directly to xterm
      if (sid === this.activeSessionId || sid === 'default') {
        this.term.write(rawText);
      }
    });
  }

  bindEvents() {
    document.getElementById('btn-term-clear')?.addEventListener('click', () => {
      this.term?.clear();
    });

    document.getElementById('btn-term-copy')?.addEventListener('click', () => {
      const selection = this.term?.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
      }
    });

    document.getElementById('btn-term-paste')?.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          window.api.writeTerminal(text, this.activeSessionId);
        }
      } catch {}
    });

    window.addEventListener('resize', () => {
      this.fit();
    });
  }

  switchSession(sessionId) {
    this.activeSessionId = sessionId;
    if (this.term) {
      this.term.reset();
      const buf = this.sessionBuffers.get(sessionId);
      if (buf) {
        this.term.write(buf);
      }
      setTimeout(() => this.fit(), 50);
    }
  }

  fit() {
    if (this.fitAddon && this.term && this.container && this.container.clientWidth > 0 && this.container.clientHeight > 0) {
      try {
        this.fitAddon.fit();
        window.api.resizeTerminal(this.term.cols, this.term.rows, this.activeSessionId);
      } catch (e) {
        console.warn('Failed to fit terminal:', e);
      }
    }
  }

  write(text) {
    if (this.term) {
      this.term.write(text);
    }
  }
}

window.terminalController = new TerminalController();
