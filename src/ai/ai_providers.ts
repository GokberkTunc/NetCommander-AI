import { AIProviderConfig, AIProviderType } from '../storage/models.js';
import { WebSessionManager } from './web_session.js';
import { Logger } from '../storage/logger.js';

export interface AIResponse {
  text: string;
}

export class AIProviders {
  /**
   * Helper: Standard OpenAI-compatible Chat Completions call
   */
  private static async callOpenAICompatible(
    endpoint: string,
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    const cleanEndpoint = endpoint.replace(/\/+$/, '');
    const url = cleanEndpoint.endsWith('/chat/completions')
      ? cleanEndpoint
      : `${cleanEndpoint}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const body = {
      model: model || 'default',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error((errData as any).error?.message || `HTTP ${res.status}: ${res.statusText}`);
    }

    const data: any = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Geçerli bir yapay zeka metin yanıtı alınamadı.');
    }
    return content;
  }

  /**
   * Test API connectivity and validate key/server
   */
  public static async testConnection(
    provider: AIProviderType,
    config: AIProviderConfig
  ): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const startTime = Date.now();
    try {
      if (provider === 'google_web_session') {
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

      if (provider === 'lmstudio') {
        const endpoint = config.endpoint || 'http://localhost:1234/v1';
        const url = `${endpoint.replace(/\/+$/, '')}/models`;
        const res = await fetch(url);
        const latencyMs = Date.now() - startTime;
        if (res.ok) {
          const data: any = await res.json().catch(() => ({}));
          const modelsList = data.data ? data.data.map((m: any) => m.id).join(', ') : '';
          return {
            success: true,
            message: `LM Studio bağlantısı başarılı (${latencyMs}ms)${modelsList ? ` - Yüklü Modeller: ${modelsList}` : ''}`,
            latencyMs,
          };
        }
        return {
          success: false,
          message: `LM Studio sunucusuna ulaşılamadı (${res.status}): ${res.statusText}. LM Studio'da Local Server'ın başlatıldığından emin olun.`,
          latencyMs,
        };
      }

      if (provider === 'ollama') {
        const endpoint = config.endpoint || 'http://localhost:11434';
        const url = `${endpoint.replace(/\/+$/, '')}/api/tags`;
        const res = await fetch(url);
        const latencyMs = Date.now() - startTime;
        if (res.ok) {
          const data: any = await res.json().catch(() => ({}));
          const modelsList = data.models ? data.models.map((m: any) => m.name).join(', ') : '';
          return {
            success: true,
            message: `Ollama bağlantısı başarılı (${latencyMs}ms)${modelsList ? ` - Modeller: ${modelsList}` : ''}`,
            latencyMs,
          };
        }
        return {
          success: false,
          message: `Ollama sunucusuna ulaşılamadı (${res.status}). Ollama servisinin çalıştığından emin olun.`,
          latencyMs,
        };
      }

      if (provider === 'custom_openai') {
        if (!config.endpoint) {
          return { success: false, message: 'Özel uç nokta URL adresi belirtilmedi.', latencyMs: 0 };
        }
        const text = await this.callOpenAICompatible(config.endpoint, config.apiKey || '', config.model || 'default', 'Test', 'ping');
        const latencyMs = Date.now() - startTime;
        return { success: true, message: `Özel uç nokta bağlantısı başarılı (${latencyMs}ms): ${text.substring(0, 30)}...`, latencyMs };
      }

      if (!config.apiKey) {
        return { success: false, message: 'API anahtarı boş olamaz.', latencyMs: 0 };
      }

      if (provider === 'gemini') {
        const model = config.model || 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Ping test' }] }],
          }),
        });
        const latencyMs = Date.now() - startTime;
        if (res.ok) {
          return { success: true, message: `Gemini API bağlantısı başarılı (${latencyMs}ms)`, latencyMs };
        } else {
          const errData: any = await res.json().catch(() => ({}));
          return { success: false, message: `Gemini Hatası: ${errData.error?.message || res.statusText}`, latencyMs };
        }
      }

      if (provider === 'deepseek') {
        const text = await this.callOpenAICompatible('https://api.deepseek.com/v1', config.apiKey, config.model || 'deepseek-chat', 'Test', 'ping');
        const latencyMs = Date.now() - startTime;
        return { success: true, message: `DeepSeek API bağlantısı başarılı (${latencyMs}ms)`, latencyMs };
      }

      if (provider === 'groq') {
        const text = await this.callOpenAICompatible('https://api.groq.com/openai/v1', config.apiKey, config.model || 'llama-3.3-70b-versatile', 'Test', 'ping');
        const latencyMs = Date.now() - startTime;
        return { success: true, message: `Groq API bağlantısı başarılı (${latencyMs}ms)`, latencyMs };
      }

      if (provider === 'openrouter') {
        const text = await this.callOpenAICompatible('https://openrouter.ai/api/v1', config.apiKey, config.model || 'meta-llama/llama-3.3-70b-instruct', 'Test', 'ping');
        const latencyMs = Date.now() - startTime;
        return { success: true, message: `OpenRouter bağlantısı başarılı (${latencyMs}ms)`, latencyMs };
      }

      if (provider === 'openai') {
        const text = await this.callOpenAICompatible('https://api.openai.com/v1', config.apiKey, config.model || 'gpt-4o-mini', 'Test', 'ping');
        const latencyMs = Date.now() - startTime;
        return { success: true, message: `OpenAI bağlantısı başarılı (${latencyMs}ms)`, latencyMs };
      }

      if (provider === 'mistral') {
        const text = await this.callOpenAICompatible('https://api.mistral.ai/v1', config.apiKey, config.model || 'mistral-large-latest', 'Test', 'ping');
        const latencyMs = Date.now() - startTime;
        return { success: true, message: `Mistral AI bağlantısı başarılı (${latencyMs}ms)`, latencyMs };
      }

      if (provider === 'anthropic') {
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
          const errData: any = await res.json().catch(() => ({}));
          return { success: false, message: `Anthropic Hatası: ${errData.error?.message || res.statusText}`, latencyMs };
        }
      }

      return { success: false, message: `Bilinmeyen sağlayıcı türü: ${provider}`, latencyMs: 0 };
    } catch (err: any) {
      return {
        success: false,
        message: `Bağlantı hatası: ${err.message}`,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute prompt across any active provider
   */
  public static async execute(
    provider: AIProviderType,
    config: AIProviderConfig,
    systemPrompt: string,
    userPrompt: string
  ): Promise<AIResponse> {
    const logger = Logger.getInstance();
    logger.info('AIProviders', `İstek gönderiliyor -> Sağlayıcı: ${provider}`);

    // 1. Google Web Session
    if (provider === 'google_web_session') {
      const text = await WebSessionManager.executePrompt(systemPrompt, userPrompt);
      return { text };
    }

    // 2. LM Studio
    if (provider === 'lmstudio') {
      const endpoint = config.endpoint || 'http://localhost:1234/v1';
      const text = await this.callOpenAICompatible(endpoint, '', config.model || 'local-model', systemPrompt, userPrompt);
      return { text };
    }

    // 3. Ollama
    if (provider === 'ollama') {
      const endpoint = config.endpoint ? `${config.endpoint.replace(/\/+$/, '')}/v1` : 'http://localhost:11434/v1';
      const text = await this.callOpenAICompatible(endpoint, '', config.model || 'llama3.2', systemPrompt, userPrompt);
      return { text };
    }

    // 4. Custom OpenAI
    if (provider === 'custom_openai') {
      if (!config.endpoint) throw new Error('Özel uç nokta URL adresi tanımlı değil.');
      const text = await this.callOpenAICompatible(config.endpoint, config.apiKey || '', config.model || 'default', systemPrompt, userPrompt);
      return { text };
    }

    // 5. DeepSeek
    if (provider === 'deepseek') {
      if (!config.apiKey) throw new Error('DeepSeek API anahtarı girilmedi.');
      const text = await this.callOpenAICompatible('https://api.deepseek.com/v1', config.apiKey, config.model || 'deepseek-chat', systemPrompt, userPrompt);
      return { text };
    }

    // 6. Groq
    if (provider === 'groq') {
      if (!config.apiKey) throw new Error('Groq API anahtarı girilmedi.');
      const text = await this.callOpenAICompatible('https://api.groq.com/openai/v1', config.apiKey, config.model || 'llama-3.3-70b-versatile', systemPrompt, userPrompt);
      return { text };
    }

    // 7. OpenRouter
    if (provider === 'openrouter') {
      if (!config.apiKey) throw new Error('OpenRouter API anahtarı girilmedi.');
      const text = await this.callOpenAICompatible('https://openrouter.ai/api/v1', config.apiKey, config.model || 'meta-llama/llama-3.3-70b-instruct', systemPrompt, userPrompt);
      return { text };
    }

    // 8. OpenAI
    if (provider === 'openai') {
      if (!config.apiKey) throw new Error('OpenAI API anahtarı girilmedi.');
      const text = await this.callOpenAICompatible('https://api.openai.com/v1', config.apiKey, config.model || 'gpt-4o-mini', systemPrompt, userPrompt);
      return { text };
    }

    // 9. Mistral
    if (provider === 'mistral') {
      if (!config.apiKey) throw new Error('Mistral API anahtarı girilmedi.');
      const text = await this.callOpenAICompatible('https://api.mistral.ai/v1', config.apiKey, config.model || 'mistral-large-latest', systemPrompt, userPrompt);
      return { text };
    }

    // 10. Gemini API
    if (provider === 'gemini') {
      if (!config.apiKey) throw new Error('Google Gemini API anahtarı girilmedi.');
      const model = config.model || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      });

      if (!res.ok) {
        const errData: any = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Gemini API Hatası: ${res.statusText}`);
      }

      const data: any = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Gemini API geçerli bir metin yanıtı döndürmedi.');
      return { text };
    }

    // 11. Anthropic Claude
    if (provider === 'anthropic') {
      if (!config.apiKey) throw new Error('Anthropic API anahtarı girilmedi.');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!res.ok) {
        const errData: any = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Anthropic Hatası: ${res.statusText}`);
      }

      const data: any = await res.json();
      const text = data.content?.[0]?.text;
      if (!text) throw new Error('Anthropic geçerli bir metin yanıtı döndürmedi.');
      return { text };
    }

    throw new Error(`Desteklenmeyen veya yapılandırılmamış AI sağlayıcısı: ${provider}`);
  }
}
