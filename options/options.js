/* ═══════════════════════════════════════════════════════
   Siderbar — Options Page JS
   ═══════════════════════════════════════════════════════ */

// Default keys are intentionally empty — users enter their own on this page.
const DEFAULT_KEYS = {
  openai:     '',
  openrouter: '',
  anthropic:  '',
  groq:       '',
  deepseek:   '',
  xai:        ''
};

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
    { id: 'o1', label: 'o1' },
    { id: 'o1-mini', label: 'o1-mini' }
  ],
  anthropic: [
    { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { id: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
    { id: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet' },
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet v2' },
    { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
    { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
    { id: 'llama3-70b-8192', label: 'Llama 3 70B' },
    { id: 'gemma2-9b-it', label: 'Gemma 2 9B' },
    { id: 'qwen-qwq-32b', label: 'Qwen QWQ 32B' },
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
    { id: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
    { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { id: 'google/gemini-2.5-pro-preview', label: 'Gemini 2.5 Pro' },
    { id: 'google/gemini-2.5-flash-preview', label: 'Gemini 2.5 Flash' },
    { id: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick' },
    { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
    { id: 'mistralai/mistral-large-2411', label: 'Mistral Large' },
    { id: 'x-ai/grok-3-beta', label: 'Grok 3 Beta' }
  ]
};

const DEFAULT_PROVIDER = 'openai';
const DEFAULT_MODEL_ID = 'gpt-4.1-mini';

class OptionsManager {
  constructor() {
    this.providerSelect = document.getElementById('providerSelect');
    this.modelSelect    = document.getElementById('modelSelect');
    this.saveBtn        = document.getElementById('saveBtn');
    this.testAllBtn     = document.getElementById('testAllBtn');
    this.status         = document.getElementById('status');

    // Templates
    this.templateList       = document.getElementById('templateList');
    this.newTemplateName    = document.getElementById('newTemplateName');
    this.newTemplateContent = document.getElementById('newTemplateContent');
    this.addTemplateBtn     = document.getElementById('addTemplateBtn');

    // Import/Export
    this.exportBtn  = document.getElementById('exportBtn');
    this.importBtn  = document.getElementById('importBtn');
    this.importFile = document.getElementById('importFile');

    this.templates = []; // { id, name, content }

    this.init();
  }

  async init() {
    this.bindEvents();
    this.rebuildModelDropdown(DEFAULT_MODEL_ID);
    await this.loadSettings();
  }

  bindEvents() {
    this.providerSelect.addEventListener('change', () => this.rebuildModelDropdown());
    this.saveBtn.addEventListener('click', () => this.save());
    this.testAllBtn.addEventListener('click', () => this.testAllKeys());

    // Show/hide key toggles
    document.querySelectorAll('.show-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    });

    // Individual test buttons
    document.querySelectorAll('.test-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const provider = btn.dataset.provider;
        const key = document.getElementById(btn.dataset.keyField).value.trim();
        this.testKey(provider, key);
      });
    });

    // Templates
    this.addTemplateBtn.addEventListener('click', () => this.addTemplate());

    // Import/Export
    this.exportBtn.addEventListener('click', () => this.exportSettings());
    this.importBtn.addEventListener('click', () => this.importFile.click());
    this.importFile.addEventListener('change', (e) => this.importSettings(e));
  }

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

  /* ── Load settings ────────────────────────────── */
  async loadSettings() {
    try {
      const data = await chrome.storage.sync.get(['apiKeys', 'selectedModel', 'selectedModelId', 'promptTemplates']);

      const keys = data.apiKeys || DEFAULT_KEYS;
      document.getElementById('openaiKey').value     = keys.openai     || '';
      document.getElementById('openrouterKey').value  = keys.openrouter || '';
      document.getElementById('anthropicKey').value   = keys.anthropic  || '';
      document.getElementById('groqKey').value        = keys.groq       || '';
      document.getElementById('deepseekKey').value    = keys.deepseek   || '';
      document.getElementById('xaiKey').value         = keys.xai        || '';

      if (data.selectedModel && PROVIDER_MODELS[data.selectedModel]) {
        this.providerSelect.value = data.selectedModel;
        this.rebuildModelDropdown(data.selectedModelId || DEFAULT_MODEL_ID);
      }

      this.templates = data.promptTemplates || [];
      this.renderTemplates();
    } catch (e) {
      this.rebuildModelDropdown(DEFAULT_MODEL_ID);
    }
  }

  /* ── Save settings ────────────────────────────── */
  async save() {
    const apiKeys = {
      openai:     document.getElementById('openaiKey').value.trim(),
      openrouter: document.getElementById('openrouterKey').value.trim(),
      anthropic:  document.getElementById('anthropicKey').value.trim(),
      groq:       document.getElementById('groqKey').value.trim(),
      deepseek:   document.getElementById('deepseekKey').value.trim(),
      xai:        document.getElementById('xaiKey').value.trim()
    };

    // Fill empty with defaults
    for (const [k, v] of Object.entries(apiKeys)) {
      if (!v) apiKeys[k] = DEFAULT_KEYS[k] || '';
    }

    await chrome.storage.sync.set({
      apiKeys,
      selectedModel:   this.providerSelect.value,
      selectedModelId: this.modelSelect.value,
      promptTemplates: this.templates
    });

    this.showStatus('Settings saved ✓', 'success');
  }

  /* ── Key testing ──────────────────────────────── */
  async testKey(provider, key) {
    const statusEl = document.getElementById(provider + 'Status');
    if (!key) { statusEl.textContent = 'No key'; statusEl.className = 'test-status fail'; return; }
    statusEl.textContent = 'Testing…'; statusEl.className = 'test-status';

    try {
      const resp = await chrome.runtime.sendMessage({ action: 'testKey', provider, key });
      statusEl.textContent = resp.success ? resp.message : '✗ ' + resp.message;
      statusEl.className = 'test-status ' + (resp.success ? 'pass' : 'fail');
    } catch (err) {
      statusEl.textContent = '✗ ' + err.message;
      statusEl.className = 'test-status fail';
    }
  }

  async testAllKeys() {
    const providers = ['openai', 'openrouter', 'anthropic', 'groq', 'deepseek', 'xai'];
    const fields    = ['openaiKey', 'openrouterKey', 'anthropicKey', 'groqKey', 'deepseekKey', 'xaiKey'];
    for (let i = 0; i < providers.length; i++) {
      await this.testKey(providers[i], document.getElementById(fields[i]).value.trim());
    }
  }

  /* ── Prompt templates ─────────────────────────── */
  addTemplate() {
    const name = this.newTemplateName.value.trim();
    const content = this.newTemplateContent.value.trim();
    if (!name || !content) return;
    this.templates.push({ id: Date.now(), name, content });
    this.newTemplateName.value = '';
    this.newTemplateContent.value = '';
    this.renderTemplates();
  }

  deleteTemplate(id) {
    this.templates = this.templates.filter(t => t.id !== id);
    this.renderTemplates();
  }

  renderTemplates() {
    this.templateList.innerHTML = '';
    if (this.templates.length === 0) {
      this.templateList.innerHTML = '<div class="hint" style="padding:8px 0;">No templates yet.</div>';
      return;
    }
    this.templates.forEach(t => {
      const div = document.createElement('div');
      div.className = 'template-item';
      div.innerHTML = `
        <div class="template-item-header">
          <strong>${this.escapeHtml(t.name)}</strong>
          <button class="delete-template-btn" title="Delete">✕</button>
        </div>
        <div class="template-item-content">${this.escapeHtml(t.content)}</div>`;
      div.querySelector('.delete-template-btn').addEventListener('click', () => this.deleteTemplate(t.id));
      this.templateList.appendChild(div);
    });
  }

  /* ── Import / Export ──────────────────────────── */
  async exportSettings() {
    const data = await chrome.storage.sync.get(null);
    const localData = await chrome.storage.local.get('translationHistory');
    const exportData = { ...data, translationHistory: localData.translationHistory || [] };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'siderbar-settings-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    this.showStatus('Settings exported ✓', 'success');
  }

  async importSettings(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object') throw new Error('Invalid format');

      // Separate history (local) from sync data
      const history = data.translationHistory;
      delete data.translationHistory;

      await chrome.storage.sync.set(data);
      if (history) await chrome.storage.local.set({ translationHistory: history });

      this.showStatus('Settings imported ✓ — Reloading…', 'success');
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      this.showStatus('Import failed: ' + err.message, 'error');
    }
    // Reset file input
    this.importFile.value = '';
  }

  /* ── Utilities ────────────────────────────────── */
  showStatus(msg, type) {
    this.status.textContent = msg;
    this.status.className = type || '';
    if (type) setTimeout(() => { this.status.textContent = ''; this.status.className = ''; }, 4000);
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

document.addEventListener('DOMContentLoaded', () => new OptionsManager());
