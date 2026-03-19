/* ═══════════════════════════════════════════════════════
   Siderbar — Sidebar JS (Translate · Chat · Code)
   ═══════════════════════════════════════════════════════ */

/* ── PROVIDER MODELS ──────────────────────────────────── */
const PROVIDER_MODELS = {
  openai: [
    { id: 'gpt-4.1', label: 'GPT-4.1' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    { id: 'gpt-4.1-nano', label: 'GPT-4.1 Nano' },
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { id: 'gpt-4', label: 'GPT-4' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { id: 'o4-mini', label: 'o4-mini' },
    { id: 'o3', label: 'o3' },
    { id: 'o3-mini', label: 'o3-mini' },
    { id: 'o3-pro', label: 'o3 Pro' },
    { id: 'o1', label: 'o1' },
    { id: 'o1-mini', label: 'o1-mini' },
    { id: 'o1-pro', label: 'o1 Pro' },
    { id: 'gpt-4.5-preview', label: 'GPT-4.5 Preview' },
    { id: 'gpt-4o-search-preview', label: 'GPT-4o Search Preview' },
    { id: 'gpt-4o-mini-search-preview', label: 'GPT-4o Mini Search' }
  ],
  anthropic: [
    { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { id: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
    { id: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet' },
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet v2' },
    { id: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
    { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
    { id: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
    { id: 'llama3-70b-8192', label: 'Llama 3 70B' },
    { id: 'llama3-8b-8192', label: 'Llama 3 8B' },
    { id: 'gemma2-9b-it', label: 'Gemma 2 9B' },
    { id: 'qwen-qwq-32b', label: 'Qwen QWQ 32B' },
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B' },
    { id: 'mistral-saba-24b', label: 'Mistral Saba 24B' },
    { id: 'compound-beta', label: 'Compound Beta' },
    { id: 'compound-beta-mini', label: 'Compound Beta Mini' },
    { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 70B' }
  ],
  deepseek: [
    { id: 'deepseek-chat', label: 'DeepSeek V3 Chat' },
    { id: 'deepseek-reasoner', label: 'DeepSeek R1 Reasoner' }
  ],
  xai: [
    { id: 'grok-3', label: 'Grok 3' },
    { id: 'grok-3-mini', label: 'Grok 3 Mini' },
    { id: 'grok-3-fast', label: 'Grok 3 Fast' }
  ],
  openrouter: [
    { id: 'openai/gpt-4.1', label: 'OpenAI GPT-4.1' },
    { id: 'openai/gpt-4.1-mini', label: 'OpenAI GPT-4.1 Mini' },
    { id: 'openai/gpt-4.1-nano', label: 'OpenAI GPT-4.1 Nano' },
    { id: 'openai/o4-mini', label: 'OpenAI o4-mini' },
    { id: 'openai/o3', label: 'OpenAI o3' },
    { id: 'openai/o3-mini', label: 'OpenAI o3-mini' },
    { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
    { id: 'anthropic/claude-opus-4', label: 'Claude Opus 4' },
    { id: 'anthropic/claude-3.7-sonnet', label: 'Claude 3.7 Sonnet' },
    { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { id: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku' },
    { id: 'google/gemini-2.5-pro-preview', label: 'Gemini 2.5 Pro' },
    { id: 'google/gemini-2.5-flash-preview', label: 'Gemini 2.5 Flash' },
    { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
    { id: 'google/gemini-2.0-flash-lite-001', label: 'Gemini 2.0 Flash Lite' },
    { id: 'google/gemma-3-27b-it', label: 'Gemma 3 27B' },
    { id: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick' },
    { id: 'meta-llama/llama-4-scout', label: 'Llama 4 Scout' },
    { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
    { id: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B' },
    { id: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
    { id: 'deepseek/deepseek-chat-v3-0324', label: 'DeepSeek V3 0324' },
    { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
    { id: 'deepseek/deepseek-r1-0528', label: 'DeepSeek R1 0528' },
    { id: 'mistralai/mistral-large-2411', label: 'Mistral Large' },
    { id: 'mistralai/mistral-small-3.1-24b-instruct', label: 'Mistral Small 3.1' },
    { id: 'mistralai/codestral-2501', label: 'Codestral' },
    { id: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B' },
    { id: 'qwen/qwen-2.5-coder-32b-instruct', label: 'Qwen 2.5 Coder 32B' },
    { id: 'qwen/qwq-32b', label: 'QWQ 32B' },
    { id: 'microsoft/mai-ds-r1', label: 'MS MAI DS R1' },
    { id: 'microsoft/phi-4', label: 'MS Phi-4' },
    { id: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Nemotron 70B' },
    { id: 'cohere/command-r-plus-08-2024', label: 'Command R+' },
    { id: 'cohere/command-a', label: 'Command A' },
    { id: 'x-ai/grok-3-beta', label: 'Grok 3 Beta' },
    { id: 'x-ai/grok-3-mini-beta', label: 'Grok 3 Mini Beta' },
    { id: 'perplexity/sonar-pro', label: 'Sonar Pro' },
    { id: 'perplexity/sonar', label: 'Sonar' }
  ]
};

const DEFAULT_PROVIDER = 'openai';
const DEFAULT_MODEL_ID = 'gpt-4.1-mini';

/* ── ROUGH TOKEN ESTIMATOR ─────────────────────────── */
function estimateTokens(text) {
  if (!text) return 0;
  // ~4 chars per token (rough average for English)
  return Math.ceil(text.length / 4);
}

/* ── APP ──────────────────────────────────────────── */
class SidebarApp {
  constructor() {
    /* DOM refs — header */
    this.optionsLink = document.getElementById('optionsLink');
    this.historyBtn  = document.getElementById('historyBtn');

    /* DOM refs — model/params */
    this.providerSelect   = document.getElementById('providerSelect');
    this.modelSelect      = document.getElementById('modelSelect');
    this.temperatureRange  = document.getElementById('temperatureRange');
    this.temperatureValue  = document.getElementById('temperatureValue');
    this.maxTokensInput    = document.getElementById('maxTokensInput');

    /* DOM refs — translate */
    this.sourceLang      = document.getElementById('sourceLang');
    this.targetLang      = document.getElementById('targetLang');
    this.swapLangs       = document.getElementById('swapLangs');
    this.translateInput  = document.getElementById('translateInput');
    this.charCount       = document.getElementById('charCount');
    this.translateBtn    = document.getElementById('translateBtn');
    this.translateOutput = document.getElementById('translateOutput');
    this.copyTranslateBtn = document.getElementById('copyTranslateBtn');
    this.translateStatus  = document.getElementById('translateStatus');

    /* DOM refs — chat */
    this.toggleSystemPrompt = document.getElementById('toggleSystemPrompt');
    this.systemPrompt    = document.getElementById('systemPrompt');
    this.chatMessages    = document.getElementById('chatMessages');
    this.chatInput       = document.getElementById('chatInput');
    this.chatSendBtn     = document.getElementById('chatSendBtn');
    this.chatClearBtn    = document.getElementById('chatClearBtn');
    this.chatStatus      = document.getElementById('chatStatus');

    /* DOM refs — code */
    this.codeAction      = document.getElementById('codeAction');
    this.codeTargetLang  = document.getElementById('codeTargetLang');
    this.codeInput       = document.getElementById('codeInput');
    this.codeRunBtn      = document.getElementById('codeRunBtn');
    this.codeOutput      = document.getElementById('codeOutput');
    this.copyCodeBtn     = document.getElementById('copyCodeBtn');
    this.codeStatus      = document.getElementById('codeStatus');

    /* DOM refs — history */
    this.historyPanel    = document.getElementById('historyPanel');
    this.historySearch   = document.getElementById('historySearch');
    this.historyList     = document.getElementById('historyList');
    this.closeHistoryBtn = document.getElementById('closeHistoryBtn');
    this.exportHistoryBtn = document.getElementById('exportHistoryBtn');

    /* State */
    this.chatHistory = []; // {role, content}
    this.translationHistory = []; // loaded from storage
    this.activeTab = 'translate';
    this.streamPort = null;

    this.init();
  }

  /* ── INIT ──────────────────────────────────────── */
  async init() {
    this.bindEvents();
    this.rebuildModelDropdown(DEFAULT_MODEL_ID);
    await this.loadSettings();
    await this.loadHistory();
  }

  /* ── EVENTS ────────────────────────────────────── */
  bindEvents() {
    /* Options link */
    this.optionsLink.addEventListener('click', e => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });

    /* Tabs */
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    /* Model/params */
    this.providerSelect.addEventListener('change', () => {
      this.rebuildModelDropdown();
      this.saveSettings();
    });
    this.modelSelect.addEventListener('change', () => this.saveSettings());
    this.temperatureRange.addEventListener('input', () => {
      this.temperatureValue.textContent = this.temperatureRange.value;
      this.saveSettings();
    });
    this.maxTokensInput.addEventListener('change', () => this.saveSettings());

    /* Translate */
    this.translateInput.addEventListener('input', () => {
      this.charCount.textContent = this.translateInput.value.length;
    });
    this.swapLangs.addEventListener('click', () => {
      const s = this.sourceLang.value;
      this.sourceLang.value = this.targetLang.value;
      this.targetLang.value = s;
      this.saveSettings();
    });
    this.sourceLang.addEventListener('change', () => this.saveSettings());
    this.targetLang.addEventListener('change', () => this.saveSettings());
    this.translateBtn.addEventListener('click', () => this.doTranslate());
    this.copyTranslateBtn.addEventListener('click', () =>
      this.copyText(this.translateOutput.value, this.copyTranslateBtn));
    this.translateInput.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key === 'Enter') this.doTranslate();
    });

    /* Chat */
    this.toggleSystemPrompt.addEventListener('click', () => {
      this.systemPrompt.classList.toggle('hidden');
      this.toggleSystemPrompt.textContent =
        this.systemPrompt.classList.contains('hidden') ? 'System prompt ▾' : 'System prompt ▴';
    });
    this.chatSendBtn.addEventListener('click', () => this.doChat());
    this.chatClearBtn.addEventListener('click', () => this.clearChat());
    this.chatInput.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key === 'Enter') this.doChat();
    });

    /* Code */
    this.codeAction.addEventListener('change', () => {
      this.codeTargetLang.classList.toggle('hidden', this.codeAction.value !== 'convert');
    });
    this.codeRunBtn.addEventListener('click', () => this.doCodeAction());
    this.copyCodeBtn.addEventListener('click', () =>
      this.copyText(this.codeOutput.textContent, this.copyCodeBtn));
    this.codeInput.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key === 'Enter') this.doCodeAction();
    });

    /* History */
    this.historyBtn.addEventListener('click', () => this.showHistory());
    this.closeHistoryBtn.addEventListener('click', () => this.hideHistory());
    this.exportHistoryBtn.addEventListener('click', () => this.exportHistory());
    this.historySearch.addEventListener('input', () => this.renderHistory());
    document.querySelectorAll('.history-tab').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('.history-tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        this.renderHistory();
      });
    });

    /* Keyboard shortcuts from background */
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === 'commandTriggered') {
        if (msg.command === 'toggle-translate') this.switchTab('translate');
        else if (msg.command === 'toggle-chat') this.switchTab('chat');
        else if (msg.command === 'toggle-code') this.switchTab('code');
      }
    });
  }

  /* ── TAB SWITCHING ─────────────────────────────── */
  switchTab(name) {
    this.activeTab = name;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === name));
  }

  /* ── MODEL DROPDOWN ────────────────────────────── */
  rebuildModelDropdown(preselect) {
    const provider = this.providerSelect.value;
    const models = PROVIDER_MODELS[provider] || [];
    this.modelSelect.innerHTML = '';
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.label;
      this.modelSelect.appendChild(opt);
    });
    if (preselect) {
      const exists = models.some(m => m.id === preselect);
      if (exists) this.modelSelect.value = preselect;
    }
  }

  /* ── SETTINGS ──────────────────────────────────── */
  async loadSettings() {
    try {
      const data = await chrome.storage.sync.get([
        'selectedModel', 'selectedModelId', 'temperature', 'maxTokens',
        'sourceLang', 'targetLang', 'systemPrompt'
      ]);
      if (data.selectedModel && PROVIDER_MODELS[data.selectedModel]) {
        this.providerSelect.value = data.selectedModel;
        // Validate model ID exists for this provider
        const models = PROVIDER_MODELS[data.selectedModel] || [];
        const validModelId = models.some(m => m.id === data.selectedModelId)
          ? data.selectedModelId
          : (models[0]?.id || DEFAULT_MODEL_ID);
        this.rebuildModelDropdown(validModelId);
        // Persist corrected model ID if it was stale
        if (validModelId !== data.selectedModelId) {
          chrome.storage.sync.set({ selectedModelId: validModelId });
        }
      }
      if (data.temperature != null) {
        this.temperatureRange.value = data.temperature;
        this.temperatureValue.textContent = data.temperature;
      }
      if (data.maxTokens != null) this.maxTokensInput.value = data.maxTokens;
      if (data.sourceLang) this.sourceLang.value = data.sourceLang;
      if (data.targetLang) this.targetLang.value = data.targetLang;
      if (data.systemPrompt) this.systemPrompt.value = data.systemPrompt;
    } catch (e) { /* ignore */ }
  }

  saveSettings() {
    chrome.storage.sync.set({
      selectedModel: this.providerSelect.value,
      selectedModelId: this.modelSelect.value,
      temperature: parseFloat(this.temperatureRange.value),
      maxTokens: parseInt(this.maxTokensInput.value, 10),
      sourceLang: this.sourceLang.value,
      targetLang: this.targetLang.value,
      systemPrompt: this.systemPrompt.value
    });
  }

  getModelParams() {
    return {
      provider: this.providerSelect.value,
      modelId: this.modelSelect.value,
      temperature: parseFloat(this.temperatureRange.value),
      maxTokens: parseInt(this.maxTokensInput.value, 10)
    };
  }

  /* ── TRANSLATE ─────────────────────────────────── */
  async doTranslate() {
    const text = this.translateInput.value.trim();
    if (!text) return;
    const params = this.getModelParams();
    const srcLang = this.sourceLang.value;
    const tgtLang = this.targetLang.value;

    this.translateBtn.disabled = true;
    this.translateOutput.value = '';
    this.setStatus(this.translateStatus, `Translating… (~${estimateTokens(text)} tokens)`, '');

    try {
      const resp = await chrome.runtime.sendMessage({
        action: 'translateText',
        text,
        sourceLang: srcLang,
        targetLang: tgtLang,
        ...params
      });
      if (resp?.error) throw new Error(resp.error);
      this.translateOutput.value = resp?.translation || '';
      this.setStatus(this.translateStatus, 'Done ✓', 'success');
      this.addHistoryEntry(text, resp?.translation || '', srcLang, tgtLang);
    } catch (err) {
      this.setStatus(this.translateStatus, `✗ ${this._contextErrMsg(err)}`, 'error');
    } finally {
      this.translateBtn.disabled = false;
    }
  }

  /* ── CHAT ──────────────────────────────────────── */
  async doChat() {
    const text = this.chatInput.value.trim();
    if (!text) return;
    const params = this.getModelParams();

    this.chatInput.value = '';
    this.chatHistory.push({ role: 'user', content: text });
    this.appendChatBubble('user', text);
    this.chatSendBtn.disabled = true;

    const typingEl = this.appendTypingIndicator();

    const messages = [];
    const sysPr = this.systemPrompt.value.trim();
    if (sysPr) messages.push({ role: 'system', content: sysPr });
    messages.push(...this.chatHistory);

    try {
      const resp = await chrome.runtime.sendMessage({
        action: 'chatMessage',
        messages,
        ...params
      });
      typingEl.remove();
      if (resp?.error) throw new Error(resp.error);
      const reply = resp?.reply || '';
      this.chatHistory.push({ role: 'assistant', content: reply });
      this.appendChatBubble('assistant', reply);
    } catch (err) {
      typingEl.remove();
      this.setStatus(this.chatStatus, `✗ ${this._contextErrMsg(err)}`, 'error');
    } finally {
      this.chatSendBtn.disabled = false;
    }
  }

  appendChatBubble(role, text) {
    // Remove empty state
    const empty = this.chatMessages.querySelector('.chat-empty');
    if (empty) empty.remove();

    const div = document.createElement('div');
    div.className = `chat-bubble chat-bubble--${role}`;
    div.textContent = text;
    this.chatMessages.appendChild(div);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  appendTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'chat-bubble chat-bubble--assistant typing-indicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    this.chatMessages.appendChild(div);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    return div;
  }

  clearChat() {
    this.chatHistory = [];
    this.chatMessages.innerHTML = '<div class="chat-empty">Start a conversation…</div>';
    this.setStatus(this.chatStatus, '', '');
  }

  /* ── CODE ──────────────────────────────────────── */
  async doCodeAction() {
    const code = this.codeInput.value.trim();
    if (!code) return;
    const params = this.getModelParams();
    const action = this.codeAction.value;
    const targetLang = action === 'convert' ? this.codeTargetLang.value : null;

    this.codeRunBtn.disabled = true;
    const codeEl = this.codeOutput?.querySelector('code');
    if (codeEl) codeEl.textContent = 'Processing…';
    this.setStatus(this.codeStatus, `Running ${action}… (~${estimateTokens(code)} tokens)`, '');

    try {
      const resp = await chrome.runtime.sendMessage({
        action: 'codeAction',
        code,
        codeAction: action,
        targetLang,
        ...params
      });
      if (resp?.error) throw new Error(resp.error);
      if (codeEl) codeEl.textContent = resp?.result || '';
      this.setStatus(this.codeStatus, 'Done ✓', 'success');
    } catch (err) {
      if (codeEl) codeEl.textContent = '';
      this.setStatus(this.codeStatus, `✗ ${this._contextErrMsg(err)}`, 'error');
    } finally {
      this.codeRunBtn.disabled = false;
    }
  }

  /* ── HISTORY ───────────────────────────────────── */
  async loadHistory() {
    try {
      const data = await chrome.storage.local.get('translationHistory');
      this.translationHistory = data.translationHistory || [];
    } catch (e) {
      this.translationHistory = [];
    }
  }

  async saveHistory() {
    // Keep max 200 entries
    if (this.translationHistory.length > 200) {
      this.translationHistory = this.translationHistory.slice(-200);
    }
    await chrome.storage.local.set({ translationHistory: this.translationHistory });
  }

  addHistoryEntry(input, output, srcLang, tgtLang) {
    const entry = {
      id: Date.now(),
      input,
      output,
      srcLang,
      tgtLang,
      timestamp: new Date().toISOString(),
      starred: false
    };
    this.translationHistory.push(entry);
    this.saveHistory();
  }

  showHistory() {
    this.renderHistory();
    this.historyPanel.classList.remove('hidden');
  }

  hideHistory() {
    this.historyPanel.classList.add('hidden');
  }

  renderHistory() {
    const query = this.historySearch.value.toLowerCase();
    const starredOnly = document.querySelector('.history-tab.active')?.dataset.htab === 'starred';

    let items = [...this.translationHistory].reverse();
    if (starredOnly) items = items.filter(i => i.starred);
    if (query) items = items.filter(i =>
      i.input.toLowerCase().includes(query) || i.output.toLowerCase().includes(query));

    this.historyList.innerHTML = '';
    if (items.length === 0) {
      this.historyList.innerHTML = '<div style="color:var(--text-dim);text-align:center;padding:20px;">No entries</div>';
      return;
    }

    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <div class="history-item-header">
          <span class="history-item-date">${new Date(item.timestamp).toLocaleString()}</span>
          <button class="history-star-btn ${item.starred ? 'starred' : ''}" data-id="${item.id}">★</button>
        </div>
        <div class="history-item-text">${this.escapeHtml(item.input)}</div>
        <div class="history-item-result">${this.escapeHtml(item.output)}</div>`;

      div.querySelector('.history-star-btn').addEventListener('click', e => {
        e.stopPropagation();
        this.toggleStar(item.id);
      });
      div.addEventListener('click', () => {
        this.translateInput.value = item.input;
        this.translateOutput.value = item.output;
        this.charCount.textContent = item.input.length;
        if (item.srcLang) this.sourceLang.value = item.srcLang;
        if (item.tgtLang) this.targetLang.value = item.tgtLang;
        this.switchTab('translate');
        this.hideHistory();
      });
      this.historyList.appendChild(div);
    });
  }

  toggleStar(id) {
    const entry = this.translationHistory.find(e => e.id === id);
    if (entry) {
      entry.starred = !entry.starred;
      this.saveHistory();
      this.renderHistory();
    }
  }

  exportHistory() {
    const json = JSON.stringify(this.translationHistory, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `siderbar-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── UTILITIES ─────────────────────────────────── */
  async copyText(text, btn) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = orig, 1500);
    } catch { /* ignore */ }
  }

  setStatus(el, msg, type) {
    el.textContent = msg;
    el.className = 'status' + (type ? ` ${type}` : '');
    if (msg && type) setTimeout(() => { el.textContent = ''; el.className = 'status'; }, 5000);
  }

  /** Returns a user-friendly message, calling out extension reload specifically. */
  _contextErrMsg(err) {
    const msg = err?.message || 'Unknown error';
    if (
      msg.includes('Extension context invalidated') ||
      msg.includes('Receiving end does not exist') ||
      msg.includes('Could not establish connection')
    ) {
      return 'Extension reloaded — please refresh this page (F5).';
    }
    return msg;
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

/* ── BOOT ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => new SidebarApp());
