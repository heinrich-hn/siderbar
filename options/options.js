// options.js - Handles options page
console.log('Options script loaded');

class OptionsManager {
  constructor() {
    this.elements = {
      openaiKey: document.getElementById('openaiKey'),
      openrouterKey: document.getElementById('openrouterKey'),
      groqKey: document.getElementById('groqKey'),
      modelSelect: document.getElementById('modelSelect'),
      openrouterModelSelect: document.getElementById('openrouterModelSelect'),
      openrouterModelField: document.getElementById('openrouterModelField'),
      saveBtn: document.getElementById('saveBtn'),
      status: document.getElementById('status')
    };

    this.init();
  }

  init() {
    this.elements.modelSelect.addEventListener('change', () => this.toggleOpenRouterField());
    this.elements.saveBtn.addEventListener('click', () => this.saveSettings());

    this.loadSettings();
    this.toggleOpenRouterField();
  }

  toggleOpenRouterField() {
    if (this.elements.modelSelect) {
      this.elements.openrouterModelField.style.display =
        this.elements.modelSelect.value === 'openrouter' ? 'block' : 'none';
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['apiKeys', 'selectedModel', 'openrouterModel']);

      if (result.apiKeys) {
        this.elements.openaiKey.value = result.apiKeys.openai || '';
        this.elements.openrouterKey.value = result.apiKeys.openrouter || '';
        this.elements.groqKey.value = result.apiKeys.groq || '';
      }

      if (result.selectedModel) {
        this.elements.modelSelect.value = result.selectedModel;
      }

      if (result.openrouterModel) {
        this.elements.openrouterModelSelect.value = result.openrouterModel;
      }

      // Update field visibility after settings are loaded
      this.toggleOpenRouterField();
    } catch (error) {
      console.log('Could not load settings:', error);
    }
  }

  async saveSettings() {
    const apiKeys = {
      openai: this.elements.openaiKey.value.trim(),
      openrouter: this.elements.openrouterKey.value.trim(),
      groq: this.elements.groqKey.value.trim()
    };

    const settings = {
      apiKeys,
      selectedModel: this.elements.modelSelect.value
    };

    if (settings.selectedModel === 'openrouter') {
      settings.openrouterModel = this.elements.openrouterModelSelect.value;
    }

    try {
      await chrome.storage.sync.set(settings);
      this.setStatus('Settings saved successfully!', 'success');
    } catch (error) {
      this.setStatus('Error saving settings: ' + error.message, 'error');
    }
  }

  setStatus(message, type) {
    if (this.elements.status) {
      this.elements.status.textContent = message;
      this.elements.status.className = type;

      setTimeout(() => {
        this.elements.status.textContent = '';
        this.elements.status.className = '';
      }, 3000);
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});