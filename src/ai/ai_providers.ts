import { AIProviderConfig } from '../storage/models.js';
import { WebSessionManager } from './web_session.js';

export interface AIResponse {
  text: string;
  suggestedCommand?: {
    command: string;
    description: string;
    isDangerous: boolean;
  };
}

export class AIProviders {
  /**
   * Test API connectivity and validate key/server
   */
  public static async testConnection(config: AIProviderConfig): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const startTime = Date.now();
    try {
      if (config.provider === 'lmstudio') {
        const endpoint = config.customEndpoint || 'http://localhost:1234/v1';
        const url = `${endpoint.replace(/\/+$/, '')}/models`;
        const res = await fetch(url);
        const latencyMs = Date.now() - startTime;
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const modelsList = data.data ? data.data.map((m: any) => m.id).join(', ') : '';
          return {
            success: true,
            message: `LM Studio bağlantısı başarılı (${latencyMs}ms)${modelsList ? ` - Yüklü Modeller: ${modelsList}` : ''}`,
            latencyMs,
          };
        } else {
          return {
            success: false,
            message: `LM Studio sunucusuna ulaşılamadı (${res.status}): ${res.statusText}. LM Studio'da Yerel Sunucunun (Local Server) başlatıldığından emin olun.`,
            latencyMs,
          };
        }
      }

      if (config.provider === 'google_web_session') {
        const status = await WebSessionManager.getSessionStatus();
        const latencyMs = Date.now() - startTime;
        if (status.isLoggedIn) {
          return {
            success: true,
            message: `Google AI Pro / Gemini Web oturumu aktif (${status.cookiesCount} çerez doğrulandı)`,
            latencyMs,
          };
        } else {
          return {
            success: false,
            message: 'Google hesabı oturumu bulunamadı. Lütfen "Google Hesabı ile Giriş Yap" butonuna tıklayarak giriş yapın.',
            latencyMs,
          };
        }
      }

      if (!config.apiKey) {
        return { success: false, message: 'API anahtarı boş olamaz.', latencyMs: 0 };
      }

      if (config.provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
          },
        });
        const latencyMs = Date.now() - startTime;
        if (res.ok) {
          return { success: true, message: `OpenAI bağlantısı başarılı (${latencyMs}ms)`, latencyMs };
        } else {
          const errData = await res.json().catch(() => ({}));
          return { success: false, message: `OpenAI Hatası: ${(errData as any).error?.message || res.statusText}`, latencyMs };
        }
      }

      if (config.provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': config.apiKey || '',
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: config.model || 'claude-3-5-sonnet-20241022',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'ping' }],
          }),
        });
        const latencyMs = Date.now() - startTime;
        if (res.ok) {
          return { success: true, message: `Anthropic Claude bağlantısı başarılı (${latencyMs}ms)`, latencyMs };
        } else {
          const errData = await res.json().catch(() => ({}));
          return { success: false, message: `Anthropic Hatası: ${(errData as any).error?.message || res.statusText}`, latencyMs };
        }
      }

      if (config.provider === 'gemini') {
        const model = config.model || 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'ping' }] }],
          }),
        });
        const latencyMs = Date.now() - startTime;
        if (res.ok) {
          return { success: true, message: `Google Gemini API bağlantısı başarılı (${latencyMs}ms)`, latencyMs };
        } else {
          const errData = await res.json().catch(() => ({}));
          return { success: false, message: `Gemini Hatası: ${(errData as any).error?.message || res.statusText}`, latencyMs };
        }
      }

      return { success: false, message: 'Bilinmeyen sağlayıcı', latencyMs: 0 };
    } catch (err: any) {
      return { success: false, message: `Bağlantı hatası: ${err.message}`, latencyMs: Date.now() - startTime };
    }
  }

  /**
   * Send prompt with system context to configured provider
   */
  public static async generateResponse(
    config: AIProviderConfig,
    systemPrompt: string,
    userPrompt: string,
    chatHistory: { role: string; content: string }[] = []
  ): Promise<string> {
    if (config.provider === 'google_web_session') {
      return await WebSessionManager.executePrompt(systemPrompt, userPrompt);
    } else if (config.provider === 'lmstudio') {
      return await this.callLMStudio(config, systemPrompt, userPrompt, chatHistory);
    } else if (config.provider === 'gemini') {
      return await this.callGemini(config, systemPrompt, userPrompt, chatHistory);
    } else if (config.provider === 'openai') {
      return await this.callOpenAI(config, systemPrompt, userPrompt, chatHistory);
    } else if (config.provider === 'anthropic') {
      return await this.callAnthropic(config, systemPrompt, userPrompt, chatHistory);
    } else {
      throw new Error(`Desteklenmeyen veya yapılandırılmamış sağlayıcı: ${config.provider}`);
    }
  }

  private static async callLMStudio(
    config: AIProviderConfig,
    systemPrompt: string,
    userPrompt: string,
    chatHistory: { role: string; content: string }[]
  ): Promise<string> {
    const endpoint = config.customEndpoint || 'http://localhost:1234/v1';
    const url = `${endpoint.replace(/\/+$/, '')}/chat/completions`;
    const model = config.model || 'local-model';

    const messages: any[] = [{ role: 'system', content: systemPrompt }];

    for (const msg of chatHistory.slice(-10)) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }

    messages.push({ role: 'user', content: userPrompt });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: config.temperature ?? 0.2,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`LM Studio Hatası (${res.status}): ${(err as any).error?.message || res.statusText}. LM Studio sunucusunun açık olduğundan emin olun.`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private static async callGemini(
    config: AIProviderConfig,
    systemPrompt: string,
    userPrompt: string,
    chatHistory: { role: string; content: string }[]
  ): Promise<string> {
    const model = config.model || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

    const contents: any[] = [];

    const reqBody: any = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [],
      generationConfig: {
        temperature: config.temperature ?? 0.2,
      },
    };

    for (const msg of chatHistory.slice(-10)) {
      reqBody.contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    reqBody.contents.push({
      role: 'user',
      parts: [{ text: userPrompt }],
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Gemini API Hatası (${res.status}): ${(err as any).error?.message || res.statusText}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      throw new Error('Gemini API boş yanıt döndürdü');
    }

    return candidate.content.parts[0].text;
  }

  private static async callOpenAI(
    config: AIProviderConfig,
    systemPrompt: string,
    userPrompt: string,
    chatHistory: { role: string; content: string }[]
  ): Promise<string> {
    const model = config.model || 'gpt-4o-mini';
    const messages: any[] = [{ role: 'system', content: systemPrompt }];

    for (const msg of chatHistory.slice(-10)) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }

    messages.push({ role: 'user', content: userPrompt });

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: config.temperature ?? 0.2,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenAI API Hatası (${res.status}): ${(err as any).error?.message || res.statusText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private static async callAnthropic(
    config: AIProviderConfig,
    systemPrompt: string,
    userPrompt: string,
    chatHistory: { role: string; content: string }[]
  ): Promise<string> {
    const model = config.model || 'claude-3-5-sonnet-20241022';
    const messages: any[] = [];

    for (const msg of chatHistory.slice(-10)) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }

    messages.push({ role: 'user', content: userPrompt });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        max_tokens: 2048,
        messages,
        temperature: config.temperature ?? 0.2,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Anthropic Hatası (${res.status}): ${(err as any).error?.message || res.statusText}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text || '';
  }
}
