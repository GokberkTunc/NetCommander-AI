import { BrowserWindow, session } from 'electron';
import { Logger } from '../storage/logger.js';

export interface GoogleSessionStatus {
  isLoggedIn: boolean;
  userEmail?: string;
  cookiesCount: number;
  lastChecked: string;
}

export class WebSessionManager {
  private static readonly SESSION_PARTITION = 'persist:google_ai_session';
  private static loginWindow: BrowserWindow | null = null;
  private static bgWindow: BrowserWindow | null = null;

  public static async openGoogleLoginWindow(): Promise<GoogleSessionStatus> {
    const logger = Logger.getInstance();
    logger.info('WebSession', 'Google Giriş Penceresi açılıyor...');

    return new Promise((resolve) => {
      if (this.loginWindow && !this.loginWindow.isDestroyed()) {
        this.loginWindow.focus();
        return;
      }

      const ses = session.fromPartition(this.SESSION_PARTITION);

      this.loginWindow = new BrowserWindow({
        width: 900,
        height: 750,
        title: 'Google AI Pro / Gemini Hesabına Giriş Yap',
        autoHideMenuBar: true,
        webPreferences: {
          session: ses,
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      this.loginWindow.loadURL('https://gemini.google.com/app');

      const checkLogin = async () => {
        const cookies = await ses.cookies.get({ domain: '.google.com' });
        const hasAuthCookie = cookies.some((c) => c.name.includes('SID') || c.name.includes('SSID'));
        logger.debug('WebSession', `Çerez kontrolü: Toplam ${cookies.length} çerez, Oturum: ${hasAuthCookie}`);
        if (hasAuthCookie) {
          const status: GoogleSessionStatus = {
            isLoggedIn: true,
            cookiesCount: cookies.length,
            lastChecked: new Date().toISOString(),
          };
          resolve(status);
        }
      };

      this.loginWindow.webContents.on('did-navigate', checkLogin);
      this.loginWindow.webContents.on('did-navigate-in-page', checkLogin);

      this.loginWindow.on('closed', async () => {
        this.loginWindow = null;
        const status = await this.getSessionStatus();
        logger.info('WebSession', 'Google Giriş Penceresi kapatıldı.', status);
        resolve(status);
      });
    });
  }

  public static async getSessionStatus(): Promise<GoogleSessionStatus> {
    const logger = Logger.getInstance();
    try {
      const ses = session.fromPartition(this.SESSION_PARTITION);
      const cookies = await ses.cookies.get({ domain: '.google.com' });
      const hasAuthCookie = cookies.some((c) => c.name.includes('SID') || c.name.includes('SSID'));

      return {
        isLoggedIn: hasAuthCookie,
        cookiesCount: cookies.length,
        lastChecked: new Date().toISOString(),
      };
    } catch (err) {
      logger.error('WebSession', 'Oturum durumu kontrolünde hata oluştu', err);
      return {
        isLoggedIn: false,
        cookiesCount: 0,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  public static async clearSession(): Promise<void> {
    const logger = Logger.getInstance();
    logger.info('WebSession', 'Google oturum çerezleri temizleniyor...');
    const ses = session.fromPartition(this.SESSION_PARTITION);
    await ses.clearStorageData();
    if (this.bgWindow && !this.bgWindow.isDestroyed()) {
      this.bgWindow.close();
      this.bgWindow = null;
    }
  }

  /**
   * Get or initialize background Gemini Web browser instance
   */
  private static async getBackgroundWindow(): Promise<BrowserWindow> {
    const logger = Logger.getInstance();
    if (this.bgWindow && !this.bgWindow.isDestroyed()) {
      return this.bgWindow;
    }

    logger.info('WebSession', 'Arka plan Gemini Web oturum penceresi hazırlanıyor...');
    const ses = session.fromPartition(this.SESSION_PARTITION);

    this.bgWindow = new BrowserWindow({
      width: 1280,
      height: 900,
      show: false, // Arka planda çalışır
      webPreferences: {
        session: ses,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    await this.bgWindow.loadURL('https://gemini.google.com/app');
    logger.info('WebSession', 'Gemini Web yüklendi, DOM başlatma bekleniyor...');
    await new Promise((r) => setTimeout(r, 2000));

    return this.bgWindow;
  }

  /**
   * Execute prompt directly in Gemini Web session DOM with Action-Bar Synchronized Instant Detection
   */
  public static async executePrompt(systemPrompt: string, userPrompt: string): Promise<string> {
    const logger = Logger.getInstance();
    logger.info('WebSession', `Prompt çalıştırma başlatıldı: ${userPrompt.substring(0, 60)}...`);

    const status = await this.getSessionStatus();
    if (!status.isLoggedIn) {
      logger.warn('WebSession', 'Google oturumu bulunamadı');
      throw new Error('Google hesabı oturumu bulunamadı. Lütfen Ayarlar sekmesinden "Google Hesabı ile Giriş Yap" butonuna tıklayarak oturum açın.');
    }

    const win = await this.getBackgroundWindow();
    const currentUrl = win.webContents.getURL();
    logger.debug('WebSession', `Mevcut URL: ${currentUrl}`);

    if (!currentUrl.includes('gemini.google.com')) {
      logger.info('WebSession', 'Gemini adresine yeniden yönlendiriliyor...');
      await win.loadURL('https://gemini.google.com/app');
      await new Promise((r) => setTimeout(r, 2000));
    }

    const fullPrompt = `${systemPrompt}\n\nKullanıcı İsteği: ${userPrompt}`;

    // Step 1: Record initial count of responses
    const initialCount: number = await win.webContents.executeJavaScript(`
      (() => {
        const responses = document.querySelectorAll('.model-response-text, message-content, [data-test-id="model-response"]');
        return responses.length;
      })()
    `);
    logger.debug('WebSession', `Önceki mevcut yanıt sayısı: ${initialCount}`);

    // Step 2: Focus input editor and clear any existing draft
    logger.debug('WebSession', 'Girdi alanı aranıyor ve odaklanıyor...');
    const focusSuccess = await win.webContents.executeJavaScript(`
      (() => {
        const editor = document.querySelector('rich-textarea .ql-editor') ||
                       document.querySelector('div[contenteditable="true"]') ||
                       document.querySelector('textarea');
                       
        if (!editor) return false;
        editor.focus();
        
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editor);
        selection.removeAllRanges();
        selection.addRange(range);
        
        return true;
      })()
    `);

    if (!focusSuccess) {
      logger.error('WebSession', 'Gemini mesaj giriş alanı bulunamadı');
      throw new Error('Gemini mesaj kutusu bulunamadı. Lütfen oturumun açık olduğundan emin olun.');
    }

    // Step 3: Native Electron text insertion (Bypasses TrustedHTML restrictions)
    logger.debug('WebSession', 'Native webContents.insertText ile metin yazılıyor...');
    try {
      await win.webContents.insertText(fullPrompt);
    } catch (insertErr) {
      await win.webContents.executeJavaScript(`
        (() => {
          document.execCommand('insertText', false, ${JSON.stringify(fullPrompt)});
        })()
      `);
    }

    await new Promise((r) => setTimeout(r, 300));

    // Step 4: Click Send Button
    logger.debug('WebSession', 'Gönder butonu tetikleniyor...');
    await win.webContents.executeJavaScript(`
      (() => {
        const editor = document.querySelector('rich-textarea .ql-editor') ||
                       document.querySelector('div[contenteditable="true"]') ||
                       document.querySelector('textarea');

        if (editor) {
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          editor.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const sendBtn = document.querySelector('button[aria-label*="Send"], button[aria-label*="Gönder"], button.send-button, button[mattooltip*="Send"]');
        if (sendBtn && !sendBtn.disabled) {
          sendBtn.click();
        } else if (editor) {
          const enterEvent = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Enter',
            code: 'Enter',
            keyCode: 13
          });
          editor.dispatchEvent(enterEvent);
        }
      })()
    `);

    // Step 5: Action-Bar Synchronized Stream Tracker
    logger.info('WebSession', 'Gemini yanıt akışı dinleniyor (Aksiyon Çubuğu Senkronize Motoru)...');

    const script = `
      (async () => {
        const targetIndex = ${initialCount};
        const maxWaitMs = 60000;
        const startTime = Date.now();
        
        let lastText = '';
        let stableCount = 0;
        let finalResponseText = '';

        // Wait up to 5s for the new response element to appear in DOM
        while (Date.now() - startTime < 5000) {
          const allResponses = document.querySelectorAll('.model-response-text, message-content, [data-test-id="model-response"]');
          if (allResponses.length > targetIndex) {
            break;
          }
          await new Promise(r => setTimeout(r, 150));
        }

        // Fast 200ms polling loop
        while (Date.now() - startTime < maxWaitMs) {
          await new Promise(r => setTimeout(r, 200));

          const allResponses = document.querySelectorAll('.model-response-text, message-content, [data-test-id="model-response"]');
          if (allResponses.length === 0) continue;

          // Target specifically the response created for this prompt
          const targetEl = allResponses[targetIndex] || allResponses[allResponses.length - 1];
          
          let currentText = '';
          if (targetEl) {
            currentText = targetEl.innerText || targetEl.textContent || '';
          }

          // Check if specific stop button inside bottom prompt bar is present
          const promptStopBtn = document.querySelector('.input-area-container button[aria-label*="Stop"], .input-area-container button[aria-label*="Durdur"], rich-textarea ~ button[aria-label*="Stop"], rich-textarea ~ button[aria-label*="Durdur"]');
          const isStopBtnVisible = promptStopBtn !== null;

          // Check if THIS SPECIFIC response container has rendered its finished action buttons (Copy / Thumbs up / Share)
          let hasOwnActionButtons = false;
          let searchNode = targetEl;
          for (let level = 0; level < 4 && searchNode; level++) {
            if (searchNode.querySelector('message-actions, .response-actions, button[aria-label*="Copy"], button[aria-label*="Kopyala"], button[aria-label*="Good response"], button[aria-label*="İyi yanıt"], button[aria-label*="Share"], button[aria-label*="Paylaş"], [data-test-id="copy-button"]')) {
              hasOwnActionButtons = true;
              break;
            }
            searchNode = searchNode.parentElement;
          }

          if (currentText.trim().length > 30) {
            if (currentText === lastText && !isStopBtnVisible) {
              stableCount++;
            } else {
              stableCount = 0;
            }
          }

          lastText = currentText;

          // BULLETPROOF COMPLETION CRITERIA:
          // 1. If this message's OWN action bar (Copy button / Thumbs up) has rendered and no stop button:
          //    -> The model is 100% DONE! Exit immediately with zero extra delay!
          // 2. Fallback: If text hasn't grown for 2.4s (12 * 200ms) and text > 60 chars and no stop button:
          //    -> Exit!
          if ((currentText.trim().length > 40 && hasOwnActionButtons && !isStopBtnVisible) ||
              (currentText.trim().length > 60 && !isStopBtnVisible && stableCount >= 12)) {
            finalResponseText = currentText.trim();
            break;
          }
        }

        if (!finalResponseText && lastText) {
          finalResponseText = lastText.trim();
        }

        if (!finalResponseText) {
          throw new Error('Gemini Web yanıtı belirlenen sürede tamamlanamadı.');
        }

        return finalResponseText;
      })();
    `;

    try {
      const responseText = await win.webContents.executeJavaScript(script, true);
      logger.info('WebSession', `Tam yanıt eksiksiz ve anında alındı (${responseText.length} karakter)`);
      logger.debug('WebSession', `Tam Yanıt:\n${responseText}`);
      return responseText;
    } catch (err: any) {
      logger.error('WebSession', 'Gemini Web yanıt alma hatası', err);
      throw new Error(`Google Web Oturumu Hatası: ${err.message}`);
    }
  }
}
