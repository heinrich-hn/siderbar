# Siderbar Extension — 10 Improvements Plan

## Current State

The extension is a Chrome Manifest V3 sidebar that translates Afrikaans → English using 6 LLM providers (OpenAI, OpenRouter, Anthropic, Groq, DeepSeek, xAI). It has a content script for inline tooltip translation, an options page for API key management, and a sidebar with provider/model selectors.

---

## 1. Chat Mode

**What:** A full conversational chat interface in the sidebar — talk to the selected LLM with ongoing context, not just one-shot translate.

**How:**
- Add a **tab bar** at the top of the sidebar: `Translate | Chat | Code` — three modes sharing the same sidebar panel.
- **Chat tab** renders a scrollable message list (`div.chat-messages`) with user/assistant bubbles and a fixed input bar at the bottom.
- Messages stored in an array in memory (`this.chatHistory`), sent as the full `messages[]` array to the LLM on each turn.
- `worker.js` gets a new `chatMessage` action that accepts `{ messages: [...], provider, modelId }` and returns the assistant reply.
- Add a **Clear Chat** button and a **system prompt** textarea (collapsed by default) so users can steer the conversation.
- The translation prompt is not injected in chat mode — pure open-ended conversation.

**Files changed:** `sidebar/sidebar.html` (tab bar + chat markup), `sidebar/sidebar.js` (ChatMode class), `sidebar/sidebar.css` (chat bubble styles), `worker.js` (new `chatMessage` handler).

---

## 2. Code Mode

**What:** A dedicated code panel — paste code, pick an action (Explain, Refactor, Convert Language, Add Comments, Find Bugs), get structured output with syntax highlighting.

**How:**
- Third tab in the sidebar: **Code**.
- UI: a `<textarea>` with monospace font for code input, a dropdown of actions (`Explain | Refactor | Convert to [language] | Add Comments | Find Bugs | Translate Comments AF→EN`), and an output pane.
- Each action maps to a carefully crafted system prompt sent to `worker.js`.
- Output rendered inside a `<pre><code>` block. Include a lightweight syntax highlighter — bundle **highlight.js** (9 KB gzipped core + a single theme) or use a minimal CSS-only approach.
- "Convert to" shows a secondary language picker (Python, JavaScript, TypeScript, Rust, Go, Java, C#, etc.).
- `worker.js` gets a new `codeAction` handler: `{ action: 'codeAction', code, task, targetLang? }`.

**Files changed:** `sidebar/sidebar.html`, `sidebar/sidebar.js` (CodeMode class), `sidebar/sidebar.css`, `worker.js`, possibly `manifest.json` (bundle highlight.js).

---

## 3. Multi-Language Support

**What:** Translate between *any* language pair, not just Afrikaans → English.

**How:**
- Replace the hard-coded Afrikaans→English labels with two language dropdowns: **Source** and **Target**.
- Populate both with a curated list of ~30 languages (Afrikaans, English, French, German, Spanish, Portuguese, Mandarin, Japanese, Korean, Arabic, Hindi, Dutch, Zulu, Xhosa, Sotho, etc.).
- Add a **swap ⇄ button** between them.
- The `TRANSLATION_PROMPT` in `worker.js` becomes dynamic: `"Translate the following {source} text to {target}."`.
- `translateText` message gains `sourceLang` and `targetLang` fields.
- Default remains Afrikaans → English so existing UX is unchanged for the primary user.
- Save the last-used language pair in `chrome.storage.sync`.

**Files changed:** `sidebar/sidebar.html` (language dropdowns), `sidebar/sidebar.js`, `worker.js` (dynamic prompt).

---

## 4. Translation History & Favourites

**What:** Persist past translations so users can search, re-use, export, or star favourites.

**How:**
- Use `chrome.storage.local` (up to 10 MB) to store a `translationHistory[]` array of `{ id, source, target, sourceLang, targetLang, provider, model, timestamp, starred }`.
- Add a **History** icon button in the sidebar header. Clicking it opens a slide-over panel listing recent translations, newest first, with a search/filter input.
- Each history item shows a truncated preview, the model used, and the date. Click to re-load into the translate fields.
- **Star/favourite** toggle on each item — starred items appear in a separate "Favourites" tab.
- **Export** button: downloads history as JSON or CSV.
- Auto-prune: keep the last 500 entries, deletable manually.

**Files changed:** `sidebar/sidebar.html` (history slide-over markup), `sidebar/sidebar.js` (HistoryManager class), `sidebar/sidebar.css`, `worker.js` (storage helpers).

---

## 5. Context Menu & Selection Translation

**What:** Right-click any selected text on a web page → "Translate with Siderbar" → result appears in a floating popup or the sidebar.

**How:**
- Register a context menu item via `chrome.contextMenus.create()` in `worker.js` `onInstalled`.
- On click, grab `info.selectionText`, run translation via the existing `ApiService`, and either:
  - (a) Open the side panel and populate the input/output fields, or
  - (b) Show a floating notification popup on the page via `chrome.scripting.executeScript` injecting a small result overlay.
- Add `"contextMenus"` to `manifest.json` permissions.
- Support both the translate and chat actions from the context menu.

**Files changed:** `manifest.json` (permission), `worker.js` (context menu registration + handler), `contentScript.js` (result overlay).

---

## 6. Streaming Responses

**What:** Show LLM output token-by-token as it's generated instead of waiting for the full response.

**How:**
- Refactor `ApiService` methods to use **streaming** (`stream: true` in the request body).
- Read the response as an `EventSource` / `ReadableStream`, parsing SSE `data:` chunks.
- Use a persistent connection from sidebar → worker via `chrome.runtime.connect()` (port-based messaging) instead of one-shot `sendMessage`, so intermediate chunks can be pushed to the sidebar.
- Sidebar JS listens on the port and appends each token to the output textarea / chat bubble in real-time.
- Add a **Stop** button that closes the port to abort generation mid-stream.
- Works for Translate, Chat, and Code modes.

**Files changed:** `worker.js` (streaming fetch + port messaging), `sidebar/sidebar.js` (port listener + progressive rendering).

---

## 7. Keyboard Shortcuts & Quick Actions

**What:** Global and in-extension hotkeys for power users.

**How:**
- Declare shortcuts in `manifest.json` `"commands"`:
  - `Alt+Shift+T` — toggle the sidebar open/closed.
  - `Alt+Shift+C` — capture selected text on the page, open sidebar, paste into input.
- Inside the sidebar:
  - `Ctrl+Enter` — translate (already done).
  - `Ctrl+Shift+C` — copy output.
  - `Ctrl+L` — clear input.
  - `Tab` between Translate / Chat / Code modes.
  - `Escape` — cancel in-flight request (ties into streaming Stop).
- `worker.js` handles `chrome.commands.onCommand` to open the side panel and optionally inject selected text.

**Files changed:** `manifest.json` (commands), `worker.js` (command handler), `sidebar/sidebar.js` (keyboard listener).

---

## 8. Prompt Templates & Custom Instructions

**What:** Let users create, save, and quickly apply reusable prompt templates for any mode.

**How:**
- New section in Options page or a dropdown in the sidebar: **Prompt Templates**.
- Pre-loaded templates: "Formal Translation", "Casual Translation", "Technical Translation", "Summarise", "Explain Like I'm 5", "Proofread", "Rewrite for Clarity".
- Users can **add custom templates** with a name + system prompt text.
- Templates stored in `chrome.storage.sync` under `promptTemplates[]`.
- In Chat mode, selecting a template pre-fills the system prompt.
- In Translate mode, the template is prepended to the translation system prompt.
- In Code mode, templates like "Senior Dev Review" or "Security Audit" override the default code prompt.

**Files changed:** `options/options.html` (template editor UI), `options/options.js`, `sidebar/sidebar.js` (template picker), `worker.js` (template injection into prompts).

---

## 9. Token & Cost Estimation

**What:** Show estimated token count and cost before and after each request.

**How:**
- Bundle a lightweight tokenizer approximation (character-count heuristic: ~4 chars per token for English, ~2.5 for Afrikaans — or use `gpt-tokenizer` npm package, 15 KB).
- Before sending: show "~X input tokens" below the input field.
- After response: show "~X input + Y output = Z total tokens" and estimated cost based on published per-token pricing for the selected model.
- Maintain a running **session cost counter** in the sidebar footer.
- Store a simple pricing table in a `pricing.js` config file, updatable.
- Show a warning badge when approaching known rate limits (e.g., Groq free tier).

**Files changed:** New `pricing.js`, `sidebar/sidebar.js` (token counter UI), `sidebar/sidebar.html` (token display elements), `sidebar/sidebar.css`.

---

## 10. Import / Export & Sync Settings

**What:** One-click export/import of all settings, keys, templates, and history — plus optional cross-device sync.

**How:**
- **Export**: gather all `chrome.storage.sync` + `chrome.storage.local` data, serialise to a single encrypted JSON file (AES-256 with a user-provided passphrase via Web Crypto API). Download via `Blob` + `URL.createObjectURL`.
- **Import**: file picker → decrypt → validate schema → merge into storage.
- Add Export / Import buttons to the Options page.
- **Sync indicator**: show a badge in the sidebar when storage is synced across Chrome profiles (leveraging `chrome.storage.sync`'s built-in cross-device sync).
- Schema versioning: include a `schemaVersion` field so future imports can migrate data.

**Files changed:** `options/options.html` (export/import buttons), `options/options.js` (export/import logic + encryption), `sidebar/sidebar.html` (sync indicator).

---

## Implementation Priority

| # | Feature | Effort | Impact | Priority |
|---|---------|--------|--------|----------|
| 1 | Chat Mode | Medium | High | **P0 — do first** |
| 2 | Code Mode | Medium | High | **P0 — do first** |
| 3 | Multi-Language | Low | High | **P1** |
| 6 | Streaming Responses | Medium | High | **P1** |
| 5 | Context Menu | Low | Medium | **P2** |
| 7 | Keyboard Shortcuts | Low | Medium | **P2** |
| 4 | Translation History | Medium | Medium | **P2** |
| 8 | Prompt Templates | Medium | Medium | **P3** |
| 9 | Token & Cost Estimation | Low | Low | **P3** |
| 10 | Import / Export | Medium | Low | **P4** |

### Suggested Build Order

**Phase 1 — Core new modes (Chat + Code + Streaming):**
1. Add tab system to sidebar (Translate | Chat | Code)
2. Implement Chat mode + `chatMessage` worker handler
3. Implement Code mode + `codeAction` worker handler
4. Add streaming support (port-based messaging)

**Phase 2 — Language & access expansion:**
5. Multi-language support (language pair dropdowns)
6. Context menu integration
7. Keyboard shortcuts (`manifest.json` commands)

**Phase 3 — Power features:**
8. Translation history & favourites
9. Prompt templates
10. Token/cost estimation + Import/Export
