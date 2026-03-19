// contentScript.js - Handles tooltip display

// Prevent duplicate initialisation when re-injected after extension update
if (window.__siderbarLoaded) {
  console.log('Content script already loaded, skipping re-init');
} else {
window.__siderbarLoaded = true;
console.log('Content script loaded');

/* ── Context health tracking ──────────────────────────── */
let contextAlive = true;

function isContextValid() {
  try {
    return !!(chrome.runtime && chrome.runtime.id);
  } catch { return false; }
}

function markContextDead() {
  if (!contextAlive) return;          // already handled
  contextAlive = false;
  console.warn('Siderbar: extension context invalidated — features disabled until page refresh');

  // Hide the inline translate button if it exists
  const btn = document.getElementById('tooltip-translator-inline-btn');
  if (btn) btn.style.display = 'none';
}

/** Safely send a message to the background service worker.
 *  Resolves with the response or rejects with a user-friendly message. */
function safeSendMessage(payload) {
  return new Promise((resolve, reject) => {
    if (!contextAlive || !isContextValid()) {
      markContextDead();
      reject(new Error('Extension was reloaded — please refresh this page (F5).'));
      return;
    }
    try {
      chrome.runtime.sendMessage(payload, (resp) => {
        try {
          if (chrome.runtime.lastError) {
            const msg = chrome.runtime.lastError.message || '';
            if (msg.includes('invalidated') || msg.includes('context')) {
              markContextDead();
              reject(new Error('Extension was reloaded — please refresh this page (F5).'));
            } else {
              reject(new Error(msg));
            }
          } else {
            resolve(resp);
          }
        } catch {
          markContextDead();
          reject(new Error('Extension was reloaded — please refresh this page (F5).'));
        }
      });
    } catch {
      markContextDead();
      reject(new Error('Extension was reloaded — please refresh this page (F5).'));
    }
  });
}

class TooltipManager {
  constructor() {
    this.tooltip = null;
    this.lastRequestTime = 0;
    this.requestThrottleMs = 500;
    this._hideTimer = null;
    this.initTooltip();
    this.setupListeners();
    this.pingBackground();
  }

  pingBackground() {
    safeSendMessage({ action: 'ping' })
      .then(r => console.log('Background ready:', r))
      .catch(() => {});   // silently ignore — context check already handled
  }

  initTooltip() {
    const existing = document.getElementById('tooltip-translator-tooltip');
    if (existing) {
      this.tooltip = existing;
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

    // Accessibility
    this.tooltip.setAttribute('role', 'status');
    this.tooltip.setAttribute('aria-live', 'polite');
    this.tooltip.setAttribute('aria-atomic', 'true');

    // Add content container
    const content = document.createElement('div');
    content.id = 'tooltip-translator-content';
    this.tooltip.appendChild(content);

    if (document.body) document.body.appendChild(this.tooltip);
  }

  ensureTooltipContent() {
    try {
      // Reacquire if the instance lost its reference across re-injections.
      if (!this.tooltip) {
        this.tooltip = document.getElementById('tooltip-translator-tooltip');
      }

      // Recreate if removed from DOM.
      if (!this.tooltip || !this.tooltip.isConnected) {
        this.initTooltip();
      }

      if (!this.tooltip) return null;

      // Ensure content container exists.
      let content = this.tooltip.querySelector('#tooltip-translator-content');
      if (!content) {
        content = document.createElement('div');
        content.id = 'tooltip-translator-content';
        this.tooltip.appendChild(content);
      }

      return content;
    } catch (e) {
      console.warn('ensureTooltipContent failed:', e);
      return null;
    }
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
    if (!contextAlive) return;         // dead context — silently do nothing

    // Inline input translation handles editable fields.
    const targetEl = event.target instanceof Element ? event.target : event.target?.parentElement;
    if (targetEl?.closest('input, textarea, [contenteditable], [role="textbox"]')) return;

    const now = Date.now();
    if (now - this.lastRequestTime < this.requestThrottleMs) {
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length >= 3 && selectedText.length <= 500) {
      this.lastRequestTime = now;
      this.requestTranslation(selectedText, event).catch(() => {});
    }
  }

  async requestTranslation(text, mouseEvent) {
    if (!contextAlive) return;

    try {
      this.showLoading(mouseEvent);

      const response = await safeSendMessage({ action: 'inlineTranslate', text });
      if (response?.translation) {
        this.showTranslation(response.translation, mouseEvent);
      } else {
        this.showError(response?.error || 'Translation failed', mouseEvent);
      }
    } catch (error) {
      try { this.showError(error.message, mouseEvent); } catch { /* DOM gone */ }
    }
  }

  showLoading(mouseEvent) {
    const content = this.ensureTooltipContent();
    if (!content) return;
    content.innerHTML = '<div style="display: flex; align-items: center;"><span style="margin-right: 8px;">🔄</span> Translating...</div>';
    this.positionTooltip(mouseEvent);
    this.show();
  }

  showTranslation(translation, mouseEvent) {
    const content = this.ensureTooltipContent();
    if (!content) return;
    content.innerHTML = `
      <div style="margin-bottom: 4px; color: #4CAF50; font-weight: 500;">📝 Translation:</div>
      <div>${this.escapeHtml(translation)}</div>
    `;
    this.positionTooltip(mouseEvent);
    this.show();

    clearTimeout(this._hideTimer);
    this._hideTimer = setTimeout(() => this.hideTooltip(), 5000);
  }

  showError(error, mouseEvent) {
    const content = this.ensureTooltipContent();
    if (!content) return;
    content.innerHTML = `
      <div style="margin-bottom: 4px; color: #ff6b6b; font-weight: 500;">❌ Error:</div>
      <div style="color: #ff9999;">${this.escapeHtml(error)}</div>
    `;
    this.positionTooltip(mouseEvent);
    this.show();

    clearTimeout(this._hideTimer);
    this._hideTimer = setTimeout(() => this.hideTooltip(), 4000);
  }

  positionTooltip(mouseEvent) {
    if (!this.tooltip || !mouseEvent) return;
    const x = (mouseEvent.clientX ?? mouseEvent.pageX) + 20;
    const y = (mouseEvent.clientY ?? mouseEvent.pageY) + 20;

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
    if (!this.tooltip) return;
    this.tooltip.style.display = 'block';
    setTimeout(() => {
      if (!this.tooltip) return;
      this.tooltip.style.opacity = '1';
    }, 10);
  }

  hideTooltip() {
    clearTimeout(this._hideTimer);
    this._hideTimer = null;
    if (!this.tooltip) return;
    this.tooltip.style.opacity = '0';
    setTimeout(() => {
      if (!this.tooltip) return;
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
    this._btnTimer = null;
    this.setupButton();
    this.setupListeners();
  }

  setupButton() {
    this.btn = document.createElement('button');
    this.btn.id = 'tooltip-translator-inline-btn';
    this.btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 0"/><path d="M4 14l6 0"/><path d="M8 4l0 12"/><path d="M13 18l3-6 3 6"/><path d="M14.5 15.5h5"/></svg>';
    this.btn.title = 'Translate selected text';
    this.btn.setAttribute('aria-label', 'Translate selected text');
    Object.assign(this.btn.style, {
      position: 'fixed',
      zIndex: '999998',
      width: '28px',
      height: '28px',
      padding: '0',
      background: '#2563eb',
      color: '#fff',
      border: 'none',
      borderRadius: '50%',
      fontSize: '11px',
      fontWeight: '600',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      display: 'none',
      lineHeight: '28px',
      textAlign: 'center',
      transition: 'background 0.15s, transform 0.1s, width 0.15s, border-radius 0.15s',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      alignItems: 'center',
      justifyContent: 'center'
    });
    this.btn.addEventListener('mouseenter', () => {
      if (!this.isTranslating) this.btn.style.background = '#1d4ed8';
    });
    this.btn.addEventListener('mouseleave', () => {
      if (!this.isTranslating) this.btn.style.background = '#2563eb';
    });
    this.btn.addEventListener('mousedown', () => { this.btn.style.transform = 'scale(0.96)'; });
    this.btn.addEventListener('mouseup', () => { this.btn.style.transform = 'scale(1)'; });
    // mousedown keeps input focused; translation fires before blur
    this.btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.triggerTranslation();
    });
    if (document.body) document.body.appendChild(this.btn);
  }

  isTranslatableField(el) {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    if (tag === 'textarea') return true;
    if (tag === 'input') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      return ['text', 'search', 'url', ''].includes(type);
    }
    // Support contentEditable elements (WhatsApp, Slack, etc.)
    if (el.isContentEditable) return true;
    // Support divs with role=textbox (WhatsApp Web)
    if (el.getAttribute('role') === 'textbox') return true;
    return false;
  }

  setupListeners() {
    document.addEventListener('focusin', (e) => {
      if (this.isTranslatableField(e.target)) {
        this.currentInput = e.target;
        this.refreshButtonVisibility();
      }
    });

    document.addEventListener('focusout', () => {
      // Delay so a click on the button doesn't hide it before mousedown fires
      setTimeout(() => {
        if (!contextAlive || !this.btn.matches(':hover')) {
          this.btn.style.display = 'none';
          this.currentInput = null;
        }
      }, 150);
    });

    // Show the icon only when text is actually selected inside the active field.
    document.addEventListener('selectionchange', () => {
      this.refreshButtonVisibility();
    });

    document.addEventListener('mouseup', () => {
      this.refreshButtonVisibility();
    });

    document.addEventListener('keyup', () => {
      this.refreshButtonVisibility();
    });

    window.addEventListener('scroll', () => {
      this.refreshButtonVisibility();
    }, { passive: true });

    window.addEventListener('resize', () => {
      this.refreshButtonVisibility();
    }, { passive: true });
  }

  hasSelectionInCurrentInput() {
    if (!this.currentInput) return false;

    const isEditable = this.currentInput.isContentEditable || this.currentInput.getAttribute('role') === 'textbox';
    if (isEditable) {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
      const range = sel.getRangeAt(0);
      return this.currentInput.contains(range.commonAncestorContainer) && sel.toString().trim().length > 0;
    }

    const start = Number.isInteger(this.currentInput.selectionStart) ? this.currentInput.selectionStart : 0;
    const end = Number.isInteger(this.currentInput.selectionEnd) ? this.currentInput.selectionEnd : 0;
    return end > start;
  }

  refreshButtonVisibility() {
    if (!contextAlive) {
      this.btn.style.display = 'none';
      return;
    }
    if (!this.currentInput || !this.isTranslatableField(this.currentInput)) {
      this.btn.style.display = 'none';
      return;
    }

    if (this.hasSelectionInCurrentInput()) {
      this.positionButton(this.currentInput);
      this.btn.style.display = 'flex';
    } else if (!this.isTranslating) {
      this.btn.style.display = 'none';
    }
  }

  /** Expand button to show text, then shrink back to circle after delay. */
  setButtonStatus(text, bg, durationMs = 2000) {
    clearTimeout(this._btnTimer);
    this._btnTimer = null;
    this.btn.innerHTML = '';
    this.btn.textContent = text;
    this.btn.style.width = 'auto';
    this.btn.style.paddingLeft = '8px';
    this.btn.style.paddingRight = '8px';
    this.btn.style.borderRadius = '14px';
    this.btn.style.background = bg;
    this.btn.style.display = 'flex';
    if (durationMs > 0) {
      this._btnTimer = setTimeout(() => this.resetButton(), durationMs);
    }
  }

  resetButton() {
    this._btnTimer = null;
    this.btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 0"/><path d="M4 14l6 0"/><path d="M8 4l0 12"/><path d="M13 18l3-6 3 6"/><path d="M14.5 15.5h5"/></svg>';
    this.btn.style.width = '28px';
    this.btn.style.paddingLeft = '0';
    this.btn.style.paddingRight = '0';
    this.btn.style.borderRadius = '50%';
    this.btn.style.background = '#2563eb';
    this.btn.style.cursor = 'pointer';
    this.isTranslating = false;
  }

  positionButton(el) {
    const rect = el.getBoundingClientRect();
    const btnW = 28;
    const btnH = 28;
    let top = rect.top - btnH - 6;
    let left = rect.right - btnW;
    // flip below if not enough space above
    if (top < 4) top = rect.bottom + 6;
    if (left < 4) left = 4;
    if (left + btnW > window.innerWidth - 4) left = window.innerWidth - btnW - 4;
    this.btn.style.top = top + 'px';
    this.btn.style.left = left + 'px';
  }

  getSelectionPayload(isEditable) {
    if (isEditable) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
        const range = sel.getRangeAt(0);
        if (this.currentInput.contains(range.commonAncestorContainer)) {
          const selectedText = sel.toString().trim();
          if (selectedText) {
            return { text: selectedText, kind: 'contenteditable-selection', range: range.cloneRange() };
          }
        }
      }
      return null;
    }

    const input = this.currentInput;
    const start = Number.isInteger(input.selectionStart) ? input.selectionStart : 0;
    const end = Number.isInteger(input.selectionEnd) ? input.selectionEnd : 0;
    if (end > start) {
      const selectedText = input.value.slice(start, end).trim();
      if (selectedText) {
        return { text: selectedText, kind: 'input-selection', start, end };
      }
    }
    return null;
  }

  applyTranslatedText(isEditable, payload, translated) {
    if (isEditable) {
      if (payload.kind === 'contenteditable-selection' && payload.range) {
        const range = payload.range;
        range.deleteContents();
        const node = document.createTextNode(translated);
        range.insertNode(node);
        range.setStartAfter(node);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
      this.currentInput.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
      this.currentInput.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    const input = this.currentInput;
    if (payload.kind === 'input-selection') {
      input.setRangeText(translated, payload.start, payload.end, 'end');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    // Non-selection paths are intentionally ignored in selection-only mode.
  }

  async triggerTranslation() {
    if (!this.currentInput || this.isTranslating) return;

    if (!contextAlive) {
      this.setButtonStatus('\u21bb Refresh', '#c62828', 0);
      return;
    }

    // Get text from either value (input/textarea) or textContent (contentEditable)
    const isEditable = this.currentInput.isContentEditable || this.currentInput.getAttribute('role') === 'textbox';
    const payload = this.getSelectionPayload(isEditable);
    if (!payload?.text) return;

    this.isTranslating = true;
    this.setButtonStatus('\u2026', '#888', 0);
    this.btn.style.cursor = 'wait';

    try {
      const response = await safeSendMessage({ action: 'inlineTranslate', text: payload.text, detectLang: true });

      if (response?.error) throw new Error(response.error);

      this.applyTranslatedText(isEditable, payload, response.translation || '');

      this.setButtonStatus('\u2713', '#16a34a', 1500);
    } catch (err) {
      console.error('[Tooltip Translator] Inline translate error:', err);
      this.setButtonStatus('\u2717', '#c62828', 2000);
    }
  }
}

// Listen for messages from sidebar/background
try {
  if (contextAlive) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'showTooltip' && message.text) {
        const mockEvent = {
          clientX: window.innerWidth / 2,
          clientY: window.innerHeight / 2,
          pageX: window.innerWidth / 2,
          pageY: window.innerHeight / 2
        };

        if (window.tooltipManager) {
          window.tooltipManager.showTranslation(message.text, mockEvent);
        }
        sendResponse({ status: 'tooltip_shown' });
        return true;
      }

      // Context menu result — show as a floating overlay near the selection
      if (message.action === 'showContextMenuResult' && message.text) {
        showContextMenuOverlay(message.text);
        sendResponse({ status: 'overlay_shown' });
        return true;
      }
    });
  }
} catch (e) {
  markContextDead();
}

function showContextMenuOverlay(text) {
  // Remove any existing overlay
  const existing = document.getElementById('siderbar-ctx-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'siderbar-ctx-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    zIndex: '999999',
    maxWidth: '400px',
    maxHeight: '300px',
    overflowY: 'auto',
    padding: '14px 18px',
    backgroundColor: '#1a1d27',
    color: '#e2e4ed',
    borderRadius: '10px',
    fontSize: '13px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
    border: '1px solid #2e3348',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    top: '20%',
    right: '20px',
    opacity: '0',
    transition: 'opacity 0.2s ease'
  });

  // Accessibility
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-live', 'assertive');
  overlay.setAttribute('aria-atomic', 'true');

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Dismiss');
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '6px',
    right: '8px',
    background: 'none',
    border: 'none',
    color: '#8b8fa7',
    fontSize: '14px',
    cursor: 'pointer'
  });

  // Auto-dismiss after 15s; cancel the timer if dismissed manually first.
  const dismissTimer = setTimeout(() => {
    if (overlay.parentNode) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 200);
    }
  }, 15000);
  const dismissOverlay = () => {
    clearTimeout(dismissTimer);
    overlay.remove();
  };
  closeBtn.addEventListener('click', dismissOverlay);

  const body = document.createElement('div');
  body.textContent = text;
  body.style.paddingRight = '20px';

  overlay.appendChild(closeBtn);
  overlay.appendChild(body);
  if (document.body) document.body.appendChild(overlay);

  requestAnimationFrame(() => { overlay.style.opacity = '1'; });

  // Dismiss on Escape
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      dismissOverlay();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

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

// Catch any unhandled promise rejections caused by context loss (e.g. a
// queued micro-task firing after markContextDead already ran).
window.addEventListener('unhandledrejection', (event) => {
  if (!event.reason) return;
  const msg = event.reason?.message || String(event.reason);
  if (
    msg.includes('Extension context invalidated') ||
    msg.includes('Receiving end does not exist') ||
    msg.includes('Could not establish connection')
  ) {
    event.preventDefault(); // suppress console noise
    markContextDead();
  }
});

// Catch sync errors surfaced through window.onerror for the same case.
window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (
    msg.includes('Extension context invalidated') ||
    msg.includes('Receiving end does not exist')
  ) {
    event.preventDefault();
    markContextDead();
  }
});

// Clean up on page unload so stale listeners don't accumulate across
// soft-navigations (SPAs) or bfcache restores.
window.addEventListener('pagehide', () => {
  if (window.tooltipManager?.tooltip?.parentNode) {
    window.tooltipManager.tooltip.remove();
  }
  if (window.inputTranslateManager?.btn?.parentNode) {
    window.inputTranslateManager.btn.remove();
  }
  window.__siderbarLoaded = false;
});

} // end of __siderbarLoaded guard