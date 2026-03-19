// sidebar.js - Handles sidebar UI
console.log('Sidebar script loaded');

class SidebarTranslator {
  constructor() {
    this.afrikaansInput = document.getElementById('afrikaansInput');
    this.englishOutput = document.getElementById('englishOutput');
    this.translateBtn = document.getElementById('translateBtn');
    this.statusElement = document.getElementById('status');
    this.charCountEl = document.getElementById('charCount');
    this.optionsLink = document.getElementById('optionsLink');
    this.hasKeys = null;

    this.init();
  }

  async init() {
    if (this.optionsLink) {
      this.optionsLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
      });
    }

    if (this.afrikaansInput && this.charCountEl) {
      this.afrikaansInput.addEventListener('input', () => {
        const len = this.afrikaansInput.value.length;
        this.charCountEl.textContent = len;
        const counter = this.charCountEl.closest('.char-count');
        if (counter) {
          counter.className = 'char-count' +
            (len >= 2000 ? ' at-limit' : len >= 1800 ? ' near-limit' : '');
        }
      });
    }

    this.translateBtn.addEventListener('click', () => this.translate());

    // Check connection to background
    this.checkBackgroundConnection();

    // Load settings
    await this.loadSettings();
  }

  async checkBackgroundConnection() {
    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
      this.setStatus('Connected', 'success');
    } catch (error) {
      this.setStatus('Background service not ready', 'error');
      console.log('Background connection check failed:', error);
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['apiKeys', 'selectedModel']);
      this.hasKeys = !!(result.apiKeys && Object.values(result.apiKeys).some(key => key && key.trim()));

      if (!this.hasKeys) {
        this.setStatus('Please configure API keys in options', 'info');
      }
    } catch (error) {
      console.log('Could not load settings:', error);
    }
  }

  async translate() {
    const text = this.afrikaansInput.value.trim();

    if (!text) {
      this.setStatus('Please enter text to translate', 'error');
      return;
    }

    if (this.hasKeys === null) {
      await this.loadSettings();
    }

    if (!this.hasKeys) {
      this.setStatus('Please configure API keys in options', 'error');
      return;
    }

    this.setStatus('Translating...', 'info');
    this.translateBtn.disabled = true;

    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: 'translateText', text },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else if (!response) {
              reject(new Error('No response from background service'));
            } else if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          }
        );
      });

      this.englishOutput.value = response.translation;
      this.setStatus('Translation complete', 'success');
    } catch (error) {
      this.setStatus('Error: ' + error.message, 'error');
      console.error('Translation error:', error);
    } finally {
      this.translateBtn.disabled = false;
    }
  }

  setStatus(message, type = 'info') {
    if (this.statusElement) {
      this.statusElement.textContent = message;
      this.statusElement.className = `status ${type}`;

      if (type === 'success') {
        setTimeout(() => {
          this.statusElement.textContent = '';
          this.statusElement.className = 'status';
        }, 5000);
      }
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new SidebarTranslator();
});