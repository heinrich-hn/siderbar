# Tooltip Translator

A browser extension sidebar tool for translating Afrikaans to English using various LLM providers (OpenAI, OpenRouter, Groq) with tooltip functionality.

## Features

- Sidebar panel interface for easy access and manual translation
- **Tooltip functionality**: Automatically shows translations when text is selected
- Support for multiple LLM providers (OpenAI, OpenRouter, Groq)
- Secure API key storage (no hardcoded keys)
- Model selection flexibility
- Clean, minimalist UI
- Error handling and user feedback
- Works across all domains and survives tab changes

## How It Works

1. **Sidebar Panel**: Accessible via browser side panel for manual translation and configuration
2. **Content Script**: Runs on all web pages to detect text selection and show tooltips
3. **Background Service Worker**: Handles translation requests to LLM APIs
4. **Communication**: Message passing between content script, sidebar, and background service

## Installation

### As a Chrome/Edge Extension

1. Download or clone this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/` or `edge://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `translater` directory (the folder containing this README)
5. The extension should now be installed and accessible via the sidebar

## Usage

### Manual Translation (Sidebar)
1. Click the extension icon in your toolbar to open the sidebar
2. Enter Afrikaans text in the input area
3. Click "Translate to English" to get the translation
4. View the English translation in the output area
5. Translation also appears as a tooltip near your cursor

### Tooltip Translation (Automatic)
1. Select any Afrikaans text on a webpage (highlight with mouse)
2. After a brief delay, a tooltip will appear near your cursor with the English translation
3. Tooltip automatically hides after 8 seconds or can be closed with the × button
4. Works on Gmail, Outlook, any website, and survives tab changes

## Configuration

Before using the translator, you need to configure your API keys:

1. Click the extension icon and select "Options" (or right-click the icon and choose "Options")
2. Enter your API keys for the providers you wish to use:
   - **OpenAI**: Get your key from [platform.openai.com](https://platform.openai.com/api-keys)
   - **OpenRouter**: Get your key from [openrouter.ai](https://openrouter.ai/keys)
   - **Groq**: Get your key from [console.groq.com](https://console.groq.com/keys)
3. Select your preferred model provider
4. If using OpenRouter, also select a specific model
5. Click "Save Settings"

## Project Structure

```
translater/
├── manifest.json          # Extension manifest with side panel and content scripts
├── background.js          # Service worker handling translation requests
├── contentScript.js       # Handles tooltip display and text selection detection
├── apiService.js          # Modular API service for LLM providers
├── sidebar/               # Sidebar UI
│   ├── sidebar.html       # Sidebar structure
│   ├── sidebar.css        # Sidebar styling
│   └── sidebar.js         # Sidebar logic
├── options/               # Options page
│   ├── options.html       # Options structure
│   ├── options.css        # Options styling
│   └── options.js         # Options logic
└── icons/                 # Extension icons
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Security Notes

- API keys are stored securely in Chrome's storage API and are not transmitted to any external servers
- All translation requests go directly from your browser to the selected LLM provider
- No usage data is collected or stored by this extension
- Content script runs in isolated world to prevent conflicts with page scripts

## Troubleshooting

- **Translation fails**: Check that you've entered valid API keys in the options
- **Tooltip not showing**: Make sure you've selected at least 3 characters of text
- **Provider not working**: Verify your API key has sufficient credits/quota
- **Extension not loading**: Ensure you're using a Chrome/Edge-based browser with developer mode enabled
- **Slow responses**: Try switching to Groq for faster inference speeds

## Supported Models

- **OpenAI**: gpt-3.5-turbo
- **OpenRouter**: Multiple models including GPT-3.5, GPT-4, Claude 2, PaLM 2
- **Groq**: llama3-8b-8192 (fast inference)

## License

MIT