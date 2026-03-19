// worker.js - Siderbar background service worker

// Default API keys — leave empty here; users enter their own keys on the Options page.
const DEFAULT_KEYS = {
  openai:     '',
  openrouter: '',
  anthropic:  '',
  groq:       '',
  deepseek:   '',
  xai:        ''
};

const DEFAULT_PROVIDER = 'openai';
const DEFAULT_MODEL_ID = 'gpt-4.1-mini';

// Inline translation always uses OpenAI gpt-4.1
const INLINE_PROVIDER = 'openai';
const INLINE_MODEL_ID = 'gpt-4.1';

// Fallback model per provider (used when testKey is called without a modelId)
const DEFAULT_MODEL_PER_PROVIDER = {
  openai:     'gpt-4.1-mini',
  openrouter: 'openai/gpt-4o-mini',
  anthropic:  'claude-3-5-haiku-20241022',
  groq:       'llama-3.3-70b-versatile',
  deepseek:   'deepseek-chat',
  xai:        'grok-3-mini'
};

// Models that require max_completion_tokens instead of max_tokens
const USES_MAX_COMPLETION_TOKENS = new Set([
  'o1', 'o1-pro', 'o3', 'o3-mini', 'o3-mini-2025-01-31', 'o3-pro',
  'o4-mini', 'o4-mini-high',
  'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-mini-2025-04-14', 'gpt-4.1-nano', 'gpt-4.1-nano-2025-04-14',
  'gpt-5', 'gpt-5-2025-08-07', 'gpt-5-chat-latest', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5-nano-2025-08-07'
]);

function needsMaxCompletionTokens(modelId) {
  if (USES_MAX_COMPLETION_TOKENS.has(modelId)) return true;
  const base = modelId.replace(/^openai\//, '');
  return USES_MAX_COMPLETION_TOKENS.has(base);
}

/* ── Code action prompts ────────────────────────────────────────────────── */
const CODE_PROMPTS = {
  'explain':            'Explain the following code clearly and concisely. Use bullet points where appropriate.',
  'refactor':           'Refactor the following code for better readability, performance, and best practices. Return only the improved code with brief comments.',
  'find-bugs':          'Analyze the following code for bugs, security issues, and potential problems. List each issue with its location and a suggested fix.',
  'add-comments':       'Add clear, helpful comments to the following code. Return the full code with comments added.',
  'convert':            'Convert the following code to TARGET_LANG. Return only the converted code.',
  'translate-comments': 'Translate all comments in the following code from Afrikaans to English. Return the full code with translated comments.'
};

/* ── API service ─────────────────────────────────────────────────────────── */

class ApiService {
  constructor(storedKeys, provider, modelId, { temperature = 0.3, maxTokens = 2048 } = {}) {
    this.keys = { ...DEFAULT_KEYS };
    for (const [k, v] of Object.entries(storedKeys || {})) {
      if (v && v.trim()) this.keys[k] = v;
    }
    this.provider    = provider || DEFAULT_PROVIDER;
    this.modelId     = modelId  || DEFAULT_MODEL_ID;
    this.temperature = temperature;
    this.maxTokens   = maxTokens;
  }

  /** Send an array of {role, content} messages and get a string reply */
  async chat(messages) {
    if (!messages?.length) throw new Error('No messages');
    switch (this.provider) {
      case 'openai':
        return this._openAiCompat(messages, 'https://api.openai.com/v1/chat/completions', this.keys.openai);
      case 'openrouter':
        return this._openRouter(messages);
      case 'anthropic':
        return this._anthropic(messages);
      case 'groq':
        return this._openAiCompat(messages, 'https://api.groq.com/openai/v1/chat/completions', this.keys.groq);
      case 'deepseek':
        return this._openAiCompat(messages, 'https://api.deepseek.com/v1/chat/completions', this.keys.deepseek);
      case 'xai':
        return this._openAiCompat(messages, 'https://api.x.ai/v1/chat/completions', this.keys.xai);
      default:
        throw new Error('Unknown provider: ' + this.provider);
    }
  }

  /** Convenience: translate text from one language to another */
  async translate(text, sourceLang = 'Afrikaans', targetLang = 'English') {
    if (!text?.trim()) throw new Error('No text to translate');
    const prompt = `You are a professional translator. Translate the following ${sourceLang} text to ${targetLang}. Return only the translation, no explanations or extra text.`;
    return this.chat([
      { role: 'system', content: prompt },
      { role: 'user',   content: text }
    ]);
  }

  /** Code action: run a code-related prompt */
  async codeAction(code, action, targetLang) {
    if (!code?.trim()) throw new Error('No code provided');
    let prompt = CODE_PROMPTS[action] || CODE_PROMPTS['explain'];
    if (action === 'convert' && targetLang) {
      prompt = prompt.replace('TARGET_LANG', targetLang);
    }
    return this.chat([
      { role: 'system', content: prompt },
      { role: 'user',   content: code }
    ]);
  }

  /* ── Provider implementations ─────────────────────── */

  async _openAiCompat(messages, url, key) {
    if (!key) throw new Error('API key not configured for this provider');
    const body = {
      model: this.modelId,
      messages,
      temperature: this.temperature
    };
    if (needsMaxCompletionTokens(this.modelId)) {
      body.max_completion_tokens = this.maxTokens;
    } else {
      body.max_tokens = this.maxTokens;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error('API error ' + res.status + ': ' + (err.error?.message || res.statusText));
    }
    const data = await res.json();
    return data.choices[0]?.message?.content?.trim() || '';
  }

  async _openRouter(messages) {
    const key = this.keys.openrouter;
    if (!key) throw new Error('OpenRouter API key not configured');
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + key,
        'HTTP-Referer':  'https://tooltip-translator.extension',
        'X-Title':       'Siderbar'
      },
      body: JSON.stringify({
        model: this.modelId,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error('OpenRouter error ' + res.status + ': ' + (err.error?.message || res.statusText));
    }
    const data = await res.json();
    return data.choices[0]?.message?.content?.trim() || '';
  }

  async _anthropic(messages) {
    const key = this.keys.anthropic;
    if (!key) throw new Error('Anthropic API key not configured');
    // Anthropic needs system separated from messages
    const systemMsgs = messages.filter(m => m.role === 'system');
    const userMsgs   = messages.filter(m => m.role !== 'system');
    const systemText  = systemMsgs.map(m => m.content).join('\n') || '';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':                              key,
        'anthropic-version':                      '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model:      this.modelId,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        ...(systemText ? { system: systemText } : {}),
        messages:   userMsgs
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error('Anthropic error ' + res.status + ': ' + (err.error?.message || res.statusText));
    }
    const data = await res.json();
    return data.content?.[0]?.text?.trim() || '';
  }
}

/* ── Runtime setup ───────────────────────────────────────────────────────── */

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
/* ── Service worker lifecycle ────────────────────────────────────────────── */

self.addEventListener('install', () => {
  console.log('Siderbar SW: installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Siderbar SW: activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Siderbar SW: unhandled rejection:', event.reason);
  event.preventDefault();
});
/* ── Context menu ────────────────────────────────────────────────────────── */

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed/updated:', details.reason);
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

  // Create context menu
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'translate-selection',
      title: 'Translate "%s"',
      contexts: ['selection']
    });
    chrome.contextMenus.create({
      id: 'explain-selection',
      title: 'Explain selected code',
      contexts: ['selection']
    });
  });

  // Merge API keys
  const existing   = await chrome.storage.sync.get(['apiKeys', 'selectedModel', 'selectedModelId']);
  const storedKeys = existing.apiKeys || {};
  const mergedKeys = { ...DEFAULT_KEYS };
  for (const [k, v] of Object.entries(storedKeys)) {
    if (v && v.trim()) mergedKeys[k] = v;
  }

  // Validate stored model ID against known defaults
  let provider = existing.selectedModel || DEFAULT_PROVIDER;
  let modelId  = existing.selectedModelId || DEFAULT_MODEL_ID;
  if (!DEFAULT_MODEL_PER_PROVIDER[provider]) provider = DEFAULT_PROVIDER;
  // Reset stale model IDs to provider default
  if (modelId && !Object.values(DEFAULT_MODEL_PER_PROVIDER).includes(modelId)) {
    modelId = DEFAULT_MODEL_PER_PROVIDER[provider] || DEFAULT_MODEL_ID;
  }

  await chrome.storage.sync.set({
    apiKeys:         mergedKeys,
    selectedModel:   provider,
    selectedModelId: modelId
  });
  console.log('Settings initialised');

  // Re-inject content script into all existing tabs so stale orphaned scripts are replaced
  try {
    const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
    for (const tab of tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['contentScript.js']
      }).catch(() => {}); // ignore tabs where injection isn't allowed
    }
    console.log(`Re-injected content script into ${tabs.length} tab(s)`);
  } catch (e) {
    console.log('Could not re-inject content scripts:', e);
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const text = (info.selectionText || '').trim();
  if (!text) return;

  const result = await chrome.storage.sync.get(['apiKeys', 'selectedModel', 'selectedModelId', 'temperature', 'maxTokens', 'sourceLang', 'targetLang']);
  const provider = result.selectedModel   || DEFAULT_PROVIDER;
  const modelId  = result.selectedModelId || DEFAULT_MODEL_ID;
  const temp     = typeof result.temperature === 'number' ? result.temperature : 0.3;
  const tokens   = typeof result.maxTokens   === 'number' ? result.maxTokens   : 2048;
  const service  = new ApiService(result.apiKeys || {}, provider, modelId, { temperature: temp, maxTokens: tokens });

  try {
    let reply;
    if (info.menuItemId === 'translate-selection') {
      const srcLang = result.sourceLang || 'Afrikaans';
      const tgtLang = result.targetLang || 'English';
      reply = await service.translate(text, srcLang, tgtLang);
    } else if (info.menuItemId === 'explain-selection') {
      reply = await service.codeAction(text, 'explain');
    }
    if (reply && tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'showContextMenuResult', text: reply })
        .catch(err => console.log('Could not relay context menu result:', err));
    }
  } catch (err) {
    console.error('Context menu action failed:', err);
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'showContextMenuResult', text: '✗ ' + err.message })
        .catch(() => {});
    }
  }
});

/* ── Keyboard shortcuts ──────────────────────────────────────────────────── */

chrome.commands.onCommand.addListener((command) => {
  // Forward command to sidebar
  chrome.runtime.sendMessage({ action: 'commandTriggered', command }).catch(() => {});
});

/* ── Message handler ─────────────────────────────────────────────────────── */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message.action);

  if (message.action === 'ping') {
    sendResponse({ status: 'ok' });
    return true;
  }

  if (message.action === 'translateText') {
    handleTranslation(message)
      .then(translation => sendResponse({ translation }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (message.action === 'inlineTranslate') {
    handleInlineTranslation(message)
      .then(translation => sendResponse({ translation }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (message.action === 'chatMessage') {
    handleChat(message)
      .then(reply => sendResponse({ reply }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (message.action === 'codeAction') {
    handleCodeAction(message)
      .then(result => sendResponse({ result }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (message.action === 'testKey') {
    testProviderKey(message.provider, message.key, message.modelId)
      .then(msg  => sendResponse({ success: true,  message: msg }))
      .catch(err => sendResponse({ success: false, message: err.message }));
    return true;
  }

  if (message.action === 'showTooltip') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'showTooltip', text: message.text })
          .catch(err => console.log('Could not send to content script:', err));
      }
    });
    sendResponse({ status: 'tooltip_requested' });
    return true;
  }

  if (message.action === 'getStatus') {
    sendResponse({ status: 'ready' });
    return true;
  }
});

console.log('Siderbar service worker ready');

/* ── Handlers ────────────────────────────────────────────────────────────── */

async function handleTranslation(message) {
  const result   = await chrome.storage.sync.get(['apiKeys', 'selectedModel', 'selectedModelId', 'temperature', 'maxTokens']);
  const provider = message.provider   || result.selectedModel   || DEFAULT_PROVIDER;
  const modelId  = message.modelId    || result.selectedModelId || DEFAULT_MODEL_ID;
  const temp     = message.temperature ?? (typeof result.temperature === 'number' ? result.temperature : 0.3);
  const tokens   = message.maxTokens   ?? (typeof result.maxTokens   === 'number' ? result.maxTokens   : 2048);
  const srcLang  = message.sourceLang || 'Afrikaans';
  const tgtLang  = message.targetLang || 'English';

  const service = new ApiService(result.apiKeys || {}, provider, modelId, { temperature: temp, maxTokens: tokens });
  return service.translate(message.text, srcLang, tgtLang);
}

async function handleInlineTranslation(message) {
  const result = await chrome.storage.sync.get(['apiKeys', 'sourceLang', 'targetLang']);
  const srcLang = result.sourceLang || 'Afrikaans';
  const tgtLang = result.targetLang || 'English';
  const service = new ApiService(result.apiKeys || {}, INLINE_PROVIDER, INLINE_MODEL_ID, { temperature: 0.3, maxTokens: 1024 });
  return service.translate(message.text, srcLang, tgtLang);
}

async function handleChat(message) {
  const result   = await chrome.storage.sync.get(['apiKeys', 'selectedModel', 'selectedModelId', 'temperature', 'maxTokens']);
  const provider = message.provider   || result.selectedModel   || DEFAULT_PROVIDER;
  const modelId  = message.modelId    || result.selectedModelId || DEFAULT_MODEL_ID;
  const temp     = message.temperature ?? (typeof result.temperature === 'number' ? result.temperature : 0.3);
  const tokens   = message.maxTokens   ?? (typeof result.maxTokens   === 'number' ? result.maxTokens   : 2048);

  const service = new ApiService(result.apiKeys || {}, provider, modelId, { temperature: temp, maxTokens: tokens });
  return service.chat(message.messages);
}

async function handleCodeAction(message) {
  const result   = await chrome.storage.sync.get(['apiKeys', 'selectedModel', 'selectedModelId', 'temperature', 'maxTokens']);
  const provider = message.provider   || result.selectedModel   || DEFAULT_PROVIDER;
  const modelId  = message.modelId    || result.selectedModelId || DEFAULT_MODEL_ID;
  const temp     = message.temperature ?? (typeof result.temperature === 'number' ? result.temperature : 0.3);
  const tokens   = message.maxTokens   ?? (typeof result.maxTokens   === 'number' ? result.maxTokens   : 4096);

  const service = new ApiService(result.apiKeys || {}, provider, modelId, { temperature: temp, maxTokens: tokens });
  return service.codeAction(message.code, message.codeAction, message.targetLang);
}

/* ── Key tester ──────────────────────────────────────────────────────────── */

async function testProviderKey(provider, key, modelId) {
  if (!key?.trim()) throw new Error('No key provided');
  const effectiveModelId = modelId || DEFAULT_MODEL_PER_PROVIDER[provider] || DEFAULT_MODEL_ID;
  const service = new ApiService({ [provider]: key }, provider, effectiveModelId);
  const result  = await service.translate('Hallo');
  return '✓ "' + result + '"';
}
