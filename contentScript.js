// contentScript.js - Handles tooltip display
console.log('Content script loaded');

class TooltipManager {
  constructor() {
    this.tooltip = null;
    this.lastRequestTime = 0;
    this.requestThrottleMs = 500;
    this.initTooltip();
    this.setupListeners();
    this.pingBackground();
  }

  pingBackground() {
    try {
      chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
          console.log('Background not ready yet');
        } else {
          console.log('Background ready:', response);
        }
      });
    } catch (error) {
      console.log('Error pinging background:', error);
    }
  }

  initTooltip() {
    if (document.getElementById('tooltip-translator-tooltip')) {
      return;
    }

    this.tooltip = document.createElement('div');
    this.tooltip.id = 'tooltip-translator-tooltip';

    // Styles
    const styles = {
      position: 'fixed',
      zIndex: '999999',
      maxWidth: '300px',
      padding: '12px 16px',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      pointerEvents: 'none',
      transition: 'opacity 0.2s ease',
      opacity: '0',
      display: 'none',
      border: '1px solid #333',
      lineHeight: '1.5'
    };

    Object.assign(this.tooltip.style, styles);

    // Add content container
    const content = document.createElement('div');
    content.id = 'tooltip-translator-content';
    this.tooltip.appendChild(content);

    document.body.appendChild(this.tooltip);
  }

  setupListeners() {
    document.addEventListener('mouseup', (e) => this.handleTextSelection(e));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideTooltip();
      }
    });
  }

  handleTextSelection(event) {
    const now = Date.now();
    if (now - this.lastRequestTime < this.requestThrottleMs) {
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length >= 3 && selectedText.length <= 500) {
      this.lastRequestTime = now;
      this.requestTranslation(selectedText, event);
    }
  }

  async requestTranslation(text, mouseEvent) {
    this.showLoading(mouseEvent);

    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            action: 'translateText',
            text: text,
            sourceLang: 'af',
            targetLang: 'en'
          },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          }
        );
      });

      if (response.translation) {
        this.showTranslation(response.translation, mouseEvent);
      } else {
        this.showError(response.error || 'Translation failed', mouseEvent);
      }
    } catch (error) {
      console.error('Translation error:', error);
      this.showError(error.message, mouseEvent);
    }
  }

  showLoading(mouseEvent) {
    const content = this.tooltip.querySelector('#tooltip-translator-content');
    content.innerHTML = '<div style="display: flex; align-items: center;"><span style="margin-right: 8px;">🔄</span> Translating...</div>';
    this.positionTooltip(mouseEvent);
    this.show();
  }

  showTranslation(translation, mouseEvent) {
    const content = this.tooltip.querySelector('#tooltip-translator-content');
    content.innerHTML = `
      <div style="margin-bottom: 4px; color: #4CAF50; font-weight: 500;">📝 Translation:</div>
      <div>${this.escapeHtml(translation)}</div>
    `;
    this.positionTooltip(mouseEvent);
    this.show();

    setTimeout(() => this.hideTooltip(), 5000);
  }

  showError(error, mouseEvent) {
    const content = this.tooltip.querySelector('#tooltip-translator-content');
    content.innerHTML = `
      <div style="margin-bottom: 4px; color: #ff6b6b; font-weight: 500;">❌ Error:</div>
      <div style="color: #ff9999;">${this.escapeHtml(error)}</div>
    `;
    this.positionTooltip(mouseEvent);
    this.show();

    setTimeout(() => this.hideTooltip(), 4000);
  }

  positionTooltip(mouseEvent) {
    const x = mouseEvent.pageX + 20;
    const y = mouseEvent.pageY + 20;

    const tooltipRect = this.tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let finalX = x;
    let finalY = y;

    if (x + tooltipRect.width > viewportWidth - 20) {
      finalX = viewportWidth - tooltipRect.width - 20;
    }

    if (y + tooltipRect.height > viewportHeight - 20) {
      finalY = viewportHeight - tooltipRect.height - 20;
    }

    finalX = Math.max(10, finalX);
    finalY = Math.max(10, finalY);

    this.tooltip.style.left = finalX + 'px';
    this.tooltip.style.top = finalY + 'px';
  }

  show() {
    this.tooltip.style.display = 'block';
    setTimeout(() => {
      this.tooltip.style.opacity = '1';
    }, 10);
  }

  hideTooltip() {
    this.tooltip.style.opacity = '0';
    setTimeout(() => {
      this.tooltip.style.display = 'none';
    }, 200);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

class InputTranslateManager {
  constructor() {
    this.btn = null;
    this.currentInput = null;
    this.isTranslating = false;
    this.setupButton();
    this.setupListeners();
  }

  setupButton() {
    this.btn = document.createElement('button');
    this.btn.id = 'tooltip-translator-inline-btn';
    this.btn.textContent = 'Translate AF\u2192EN';
    Object.assign(this.btn.style, {
      position: 'fixed',
      zIndex: '999998',
      padding: '4px 10px',
      background: '#4CAF50',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      display: 'none',
      lineHeight: '1.6',
      transition: 'background 0.15s'
    });
    this.btn.addEventListener('mouseenter', () => {
      if (!this.isTranslating) this.btn.style.background = '#388e3c';
    });
    this.btn.addEventListener('mouseleave', () => {
      if (!this.isTranslating) this.btn.style.background = '#4CAF50';
    });
    // mousedown keeps input focused; translation fires before blur
    this.btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.triggerTranslation();
    });
    document.body.appendChild(this.btn);
  }

  isTranslatableField(el) {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    if (tag === 'textarea') return true;
    if (tag === 'input') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      return ['text', 'search', 'url', ''].includes(type);
    }
    return false;
  }

  setupListeners() {
    document.addEventListener('focusin', (e) => {
      if (this.isTranslatableField(e.target)) {
        this.currentInput = e.target;
        this.positionButton(e.target);
        this.btn.style.display = 'block';
      }
    });

    document.addEventListener('focusout', () => {
      // Delay so a click on the button doesn't hide it before mousedown fires
      setTimeout(() => {
        if (!this.btn.matches(':hover')) {
          this.btn.style.display = 'none';
          this.currentInput = null;
        }
      }, 150);
    });

    window.addEventListener('scroll', () => {
      if (this.currentInput && this.btn.style.display !== 'none') {
        this.positionButton(this.currentInput);
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (this.currentInput && this.btn.style.display !== 'none') {
        this.positionButton(this.currentInput);
      }
    }, { passive: true });
  }

  positionButton(el) {
    const rect = el.getBoundingClientRect();
    const btnW = 130;
    const btnH = 26;
    let top = rect.top - btnH - 6;
    let left = rect.right - btnW;
    // flip below if not enough space above
    if (top < 4) top = rect.bottom + 6;
    if (left < 4) left = 4;
    if (left + btnW > window.innerWidth - 4) left = window.innerWidth - btnW - 4;
    this.btn.style.top = top + 'px';
    this.btn.style.left = left + 'px';
  }

  async triggerTranslation() {
    if (!this.currentInput || this.isTranslating) return;
    const text = this.currentInput.value.trim();
    if (!text) return;

    this.isTranslating = true;
    const original = this.btn.textContent;
    this.btn.textContent = 'Translating\u2026';
    this.btn.style.background = '#888';
    this.btn.style.cursor = 'wait';

    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: 'translateText', text, sourceLang: 'af', targetLang: 'en' },
          (resp) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else if (!resp) {
              reject(new Error('No response from background'));
            } else {
              resolve(resp);
            }
          }
        );
      });

      if (response.error) throw new Error(response.error);

      const input = this.currentInput;
      const proto = input.tagName.toLowerCase() === 'textarea'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(input, response.translation);
      } else {
        input.value = response.translation;
      }
      // Fire input/change so React, Vue, Angular frameworks pick up the update
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      this.btn.textContent = '\u2713 Done';
      this.btn.style.background = '#388e3c';
      setTimeout(() => {
        this.btn.textContent = original;
        this.btn.style.background = '#4CAF50';
        this.btn.style.cursor = 'pointer';
        this.isTranslating = false;
      }, 2000);
    } catch (err) {
      console.error('[Tooltip Translator] Inline translate error:', err);
      this.btn.textContent = '\u2717 Error';
      this.btn.style.background = '#c62828';
      setTimeout(() => {
        this.btn.textContent = original;
        this.btn.style.background = '#4CAF50';
        this.btn.style.cursor = 'pointer';
        this.isTranslating = false;
      }, 2500);
    }
  }
}

// Listen for messages from sidebar/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showTooltip' && message.text) {
    const mockEvent = {
      pageX: window.innerWidth / 2,
      pageY: window.innerHeight / 2
    };

    if (window.tooltipManager) {
      window.tooltipManager.showTranslation(message.text, mockEvent);
    }
    sendResponse({ status: 'tooltip_shown' });
    return true;
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.tooltipManager = new TooltipManager();
    window.inputTranslateManager = new InputTranslateManager();
  });
} else {
  window.tooltipManager = new TooltipManager();
  window.inputTranslateManager = new InputTranslateManager();
}