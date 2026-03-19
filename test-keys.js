#!/usr/bin/env node
// test-keys.js — Test all API keys from .env
// Usage: node test-keys.js
// Requires Node.js 18+ (built-in fetch)

const fs   = require('fs');
const path = require('path');

// ── Parse .env ──────────────────────────────────────────────────────────────

function parseEnv(filePath) {
  try {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    const env   = {};
    for (const line of lines) {
      const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
    return env;
  } catch {
    return {};
  }
}

const env = parseEnv(path.join(__dirname, '.env'));

const KEYS = {
  openai:     env.OPENAI_API_KEY     || '',
  openrouter: env.OPENROUTER_API_KEY || '',
  anthropic:  env.ANTHROPIC_API_KEY  || '',
  groq:       env.GROQ_API_KEY       || '',
  deepseek:   env.DEEPSEEK_API_KEY   || '',
  xai:        env.xAI_API_KEY        || ''
};

// ── Test helpers ─────────────────────────────────────────────────────────────

async function openAiCompat(url, key, model) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Reply with only the word "OK".' }],
      max_tokens: 5
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || res.statusText);
  return data.choices?.[0]?.message?.content?.trim() || '(empty)';
}

async function testAnthropic(key) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model:      'claude-3-5-haiku-20241022',
      max_tokens: 5,
      messages:   [{ role: 'user', content: 'Reply with only the word "OK".' }]
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || res.statusText);
  return data.content?.[0]?.text?.trim() || '(empty)';
}

// ── Test definitions ──────────────────────────────────────────────────────────

const TESTS = [
  {
    name:  'OpenAI',
    key:   KEYS.openai,
    model: 'gpt-4.1-mini',
    run:   (k) => openAiCompat('https://api.openai.com/v1/chat/completions', k, 'gpt-4.1-mini')
  },
  {
    name:  'OpenRouter',
    key:   KEYS.openrouter,
    model: 'openai/gpt-4o-mini',
    run:   async (k) => {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${k}`,
          'HTTP-Referer':  'https://tooltip-translator.extension'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [{ role: 'user', content: 'Reply with only the word "OK".' }],
          max_tokens: 5
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || res.statusText);
      return data.choices?.[0]?.message?.content?.trim() || '(empty)';
    }
  },
  {
    name:  'Anthropic',
    key:   KEYS.anthropic,
    model: 'claude-3-5-haiku-20241022',
    run:   testAnthropic
  },
  {
    name:  'Groq',
    key:   KEYS.groq,
    model: 'llama-3.3-70b-versatile',
    run:   (k) => openAiCompat('https://api.groq.com/openai/v1/chat/completions', k, 'llama-3.3-70b-versatile')
  },
  {
    name:  'DeepSeek',
    key:   KEYS.deepseek,
    model: 'deepseek-chat',
    run:   (k) => openAiCompat('https://api.deepseek.com/v1/chat/completions', k, 'deepseek-chat')
  },
  {
    name:  'xAI / Grok',
    key:   KEYS.xai,
    model: 'grok-3-mini',
    run:   (k) => openAiCompat('https://api.x.ai/v1/chat/completions', k, 'grok-3-mini')
  }
];

// ── Runner ───────────────────────────────────────────────────────────────────

async function run() {
  const nodeVer = parseInt(process.version.slice(1).split('.')[0], 10);
  if (nodeVer < 18) {
    console.error(`Node.js 18+ required for built-in fetch. Found: ${process.version}`);
    process.exit(1);
  }

  console.log('=== Tooltip Translator — API Key Tests ===\n');

  let passed = 0, failed = 0, skipped = 0;

  for (const t of TESTS) {
    const col = t.name.padEnd(13);
    if (!t.key) {
      console.log(`${col} SKIP     — no key in .env`);
      skipped++;
      continue;
    }
    try {
      const result = await t.run(t.key);
      console.log(`${col} \x1b[32m✓ OK\x1b[0m     (${t.model}) → "${result}"`);
      passed++;
    } catch (err) {
      console.log(`${col} \x1b[31m✗ FAIL\x1b[0m   (${t.model}) → ${err.message}`);
      failed++;
    }
  }

  console.log(`\n─────── ${passed} passed · ${failed} failed · ${skipped} skipped ───────`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => { console.error(err); process.exit(1); });
