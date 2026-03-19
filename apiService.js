// apiService.js - Modular service for handling LLM API requests
// Supports OpenAI, OpenRouter, and Groq providers

class ApiService {
  constructor() {
    this.apiKeys = {
      openai: '',
      openrouter: '',
      groq: ''
    };
    this.selectedModel = 'openai'; // default
    this.openrouterModel = 'openai/gpt-3.5-turbo'; // default
  }

  setApiKeys(keys) {
    this.apiKeys = { ...this.apiKeys, ...keys };
  }

  setSelectedModel(model) {
    this.selectedModel = model;
  }

  setOpenrouterModel(model) {
    this.openrouterModel = model;
  }

  async translate(text, sourceLang, targetLang) {
    if (!text.trim()) {
      throw new Error('No text to translate');
    }

    // Validate that we have at least one API key
    const hasKeys = Object.values(this.apiKeys).some(key => key && key.trim() !== '');
    if (!hasKeys) {
      throw new Error('No API keys configured. Please set up API keys in the options page.');
    }

    switch (this.selectedModel) {
      case 'openai':
        return await this.translateWithOpenAI(text, sourceLang, targetLang);
      case 'openrouter':
        return await this.translateWithOpenRouter(text, sourceLang, targetLang);
      case 'groq':
        return await this.translateWithGroq(text, sourceLang, targetLang);
      default:
        throw new Error(`Unsupported model provider: ${this.selectedModel}`);
    }
  }

  async translateWithOpenAI(text, sourceLang, targetLang) {
    if (!this.apiKeys.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are a professional translator specializing in Afrikaans to English translation. Provide a direct, accurate translation suitable for a tooltip context. Be concise and avoid conversational filler. Translate the following Afrikaans text to English:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeys.openai}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3, // Lower temperature for more consistent translations
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
  }

  async translateWithOpenRouter(text, sourceLang, targetLang) {
    if (!this.apiKeys.openrouter) {
      throw new Error('OpenRouter API key not configured');
    }

    const systemPrompt = `You are a professional translator specializing in Afrikaans to English translation. Provide a direct, accurate translation suitable for a tooltip context. Be concise and avoid conversational filler. Translate the following Afrikaans text to English:`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeys.openrouter}`,
        'HTTP-Referer': 'https://tooltip-translator.local', // Optional, for OpenRouter stats
        'X-Title': 'Tooltip Translator' // Optional, for OpenRouter stats
      },
      body: JSON.stringify({
        model: this.openrouterModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
  }

  async translateWithGroq(text, sourceLang, targetLang) {
    if (!this.apiKeys.groq) {
      throw new Error('Groq API key not configured');
    }

    const systemPrompt = `You are a professional translator specializing in Afrikaans to English translation. Provide a direct, accurate translation suitable for a tooltip context. Be concise and avoid conversational filler. Translate the following Afrikaans text to English:`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeys.groq}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Using Llama 3 8B on Groq
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiService };
}