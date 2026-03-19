// background.js - Tooltip Translator
// Service worker for handling extension events and translation requests

console.log('Tooltip Translator background service worker started');

// ApiService class for handling translations
class ApiService {
  constructor() {
    this.apiKeys = {
      openai: '',
      openrouter: '',
      groq: ''
    };
    this.selectedModel = 'openai';
    this.openrouterModel = 'openai/gpt-3.5-turbo';
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

  async translate(text) {
    if (!text || !text.trim()) {
      throw new Error('No text to translate');
    }

    const hasKeys = Object.values(this.apiKeys).some(key => key && key.trim() !== '');
    if (!hasKeys) {
      throw new Error('No API keys configured. Please set up API keys in the options page.');
    }

    switch (this.selectedModel) {
      case 'openai':
        return await this.translateWithOpenAI(text);
      case 'openrouter':
        return await this.translateWithOpenRouter(text);
      case 'groq':
        return await this.translateWithGroq(text);
      default:
        throw new Error(`Unsupported model provider: ${this.selectedModel}`);
    }
  }

  async translateWithOpenAI(text) {
    if (!this.apiKeys.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeys.openai}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate the following Afrikaans text to English accurately and concisely:'
          },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
  }

  async translateWithOpenRouter(text) {
    if (!this.apiKeys.openrouter) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeys.openrouter}`,
        'HTTP-Referer': 'https://tooltip-translator.extension',
        'X-Title': 'Tooltip Translator'
      },
      body: JSON.stringify({
        model: this.openrouterModel,
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate the following Afrikaans text to English accurately and concisely:'
          },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
  }

  async translateWithGroq(text) {
    if (!this.apiKeys.groq) {
      throw new Error('Groq API key not configured');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKeys.groq}`
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate the following Afrikaans text to English accurately and concisely:'
          },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || '';
  }
}

// Check if chrome.runtime is available
if (!chrome.runtime) {
  console.error('CRITICAL: chrome.runtime is not available!');
} else {
  console.log('chrome.runtime is available, setting up listeners...');

  // Open the side panel when the extension action icon is clicked
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

  chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ tabId: tab.id }).catch(console.error);
  });

  // Handle extension installed or updated
  chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed/updated:', details.reason);

    // Always ensure panel opens on action click
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

    if (details.reason === 'install') {
      console.log('Setting default values');
      chrome.storage.sync.set({
        apiKeys: {
          openai: '',
          openrouter: '',
          groq: ''
        },
        selectedModel: 'openai',
        openrouterModel: 'openai/gpt-3.5-turbo'
      }, () => {
        console.log('Default settings saved');
      });
    }
  });

  // Handle messages from content script or sidebar
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message.action);

    // Handle ping requests (for testing)
    if (message.action === 'ping') {
      sendResponse({ status: 'ok' });
      return true;
    }

    // Handle translation requests
    if (message.action === 'translateText') {
      handleTranslation(message)
        .then(translation => {
          sendResponse({ translation: translation });
        })
        .catch(error => {
          console.error('Translation error:', error);
          sendResponse({ error: error.message });
        });
      return true;
    }

    // Handle requests to show tooltip from sidebar
    if (message.action === 'showTooltip') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'showTooltip',
            text: message.text
          }).catch(err => {
            console.log('Could not send to content script:', err);
          });
        }
      });
      sendResponse({ status: 'tooltip_requested' });
      return true;
    }

    // Handle status requests
    if (message.action === 'getStatus') {
      sendResponse({ status: 'ready' });
      return true;
    }
  });

  console.log('All listeners set up successfully');
}

// Main translation function
async function handleTranslation(message) {
  // Get API keys and settings from storage
  const result = await new Promise((resolve) => {
    chrome.storage.sync.get(['apiKeys', 'selectedModel', 'openrouterModel'], (data) => {
      resolve(data);
    });
  });

  const apiKeys = result.apiKeys || {
    openai: '',
    openrouter: '',
    groq: ''
  };
  const selectedModel = result.selectedModel || 'openai';
  const openrouterModel = result.openrouterModel || 'openai/gpt-3.5-turbo';

  // Create API service instance
  const apiService = new ApiService();
  apiService.setApiKeys(apiKeys);
  apiService.setSelectedModel(selectedModel);
  if (selectedModel === 'openrouter') {
    apiService.setOpenrouterModel(openrouterModel);
  }

  // Perform translation
  return await apiService.translate(message.text);
}

console.log('Background service worker initialization complete');