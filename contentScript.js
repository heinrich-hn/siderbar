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
  });
} else {
  window.tooltipManager = new TooltipManager();
}