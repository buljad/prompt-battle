/**
 * REVERSE PROMPT BATTLE – server.js
 * Production-ready zero-leakage pipeline with multi-tier 429 fallback
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT    = 3000;
const DIR     = __dirname;
const LB_FILE = path.join(DIR, 'art_leaderboard.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css',
  '.js'  : 'application/javascript',
  '.json': 'application/json',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico' : 'image/x-icon'
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) { 
      res.writeHead(404); 
      res.end('Not found'); 
      return; 
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function isGibberish(text) {
  const clean = text.trim();
  if (clean.length < 5) return true;
  const words = clean.split(/\s+/).filter(w => w.length > 1);
  if (words.length < 2) return true;
  if (/(.)\1{4,}/i.test(clean)) return true;
  if (/[бвгджзйклмнпрстфхцчшщbcdfghjklmnpqrstvwxyz]{6,}/i.test(clean)) return true;
  return false;
}

async function translateToEnglish(rawText) {
  const text = rawText.trim();
  if (!/[а-яА-ЯёЁ]/.test(text)) return text;

  try {
    const memUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ru|en`;
    const res = await fetch(memUrl, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return data.responseData.translatedText.trim();
      }
    }
  } catch (e) {
    console.warn('[Translate] Fallback to direct prompt pass-through');
  }
  return text;
}

async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
      },
      signal: controller.signal
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function generateImageFree(userPrompt) {
  const englishPrompt = await translateToEnglish(userPrompt);

  const neutralStyleWrapper = 'Fine art oil painting on canvas, museum masterpiece, expressive impressionist brushstrokes';
  const finalPrompt = `${neutralStyleWrapper}, ${englishPrompt}`;
  const encodedPrompt = encodeURIComponent(finalPrompt);

  // Каскад фолбэков на случай лимитов (429) или зависаний воркеров
  const modelCascade = [
    { name: 'sdxl',  model: 'sdxl',  timeout: 18000 },
    { name: 'turbo', model: 'turbo', timeout: 12000 },
    { name: 'base',  model: null,    timeout: 10000 }
  ];

  let lastError = null;

  for (let i = 0; i < modelCascade.length; i++) {
    const tier = modelCascade[i];
    const seed = Math.floor(Math.random() * 10000000);
    const modelParam = tier.model ? `&model=${tier.model}` : '';
    const targetUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=768&nologo=true&safe=true&seed=${seed}${modelParam}`;

    console.log(`[AI Tier ${i + 1}/${modelCascade.length}] Requesting model "${tier.name}"...`);

    try {
      const apiRes = await fetchWithTimeout(targetUrl, tier.timeout);

      if (apiRes.status === 429 || apiRes.status >= 500) {
        console.warn(`[AI Tier ${i + 1}] Received status ${apiRes.status}. Switching to next tier...`);
        await new Promise(resolve => setTimeout(resolve, 1200));
        continue;
      }

      if (!apiRes.ok) {
        const errText = await apiRes.text().catch(() => '');
        throw new Error(`HTTP ${apiRes.status}: ${errText.slice(0, 80)}`);
      }

      const contentType = apiRes.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await apiRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(`[AI Tier ${i + 1}] Success! Model: ${tier.name}, size: ${Math.round(buffer.length / 1024)} KB`);
      return `data:${contentType};base64,${buffer.toString('base64')}`;

    } catch (err) {
      console.warn(`[AI Tier ${i + 1}] Failed (${err.message}). Trying fallback...`);
      lastError = err;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`Все модели генерации перегружены (429/timeout): ${lastError?.message || 'Сервер недоступен'}`);
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { 
    res.writeHead(204); 
    res.end(); 
    return; 
  }

  const urlPath = req.url.split('?')[0];

  if (req.method === 'GET' && urlPath === '/api/leaderboard') {
    if (!fs.existsSync(LB_FILE)) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end('[]');
      return;
    }
    fs.readFile(LB_FILE, 'utf8', (err, data) => {
      if (err) { 
        res.writeHead(500); 
        res.end('Server error'); 
        return; 
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end((!data || !data.trim()) ? '[]' : data);
    });
    return;
  }

  if (req.method === 'POST' && urlPath === '/api/leaderboard') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '[]');
        fs.writeFile(LB_FILE, JSON.stringify(parsed, null, 2), 'utf8', (err) => {
          if (err) { 
            res.writeHead(500); 
            res.end('Write error'); 
            return; 
          }
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end('{"ok":true}');
        });
      } catch {
        res.writeHead(400); 
        res.end('Invalid JSON');
      }
    });
    return;
  }

  if (req.method === 'POST' && urlPath === '/api/generate') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { prompt } = JSON.parse(body || '{}');

        if (!prompt || isGibberish(prompt)) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Промпт не содержит осмысленного описания картины' }));
          return;
        }

        const imageBase64 = await generateImageFree(prompt);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ image: imageBase64 }));
      } catch (err) {
        console.error('[AI Pipeline Error]:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message || 'Generation failed' }));
      }
    });
    return;
  }

  const filePath = path.join(DIR, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(DIR)) { 
    res.writeHead(403); 
    res.end(); 
    return; 
  }
  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`\n  Reverse Prompt Battle Gateway running on http://localhost:${PORT}\n`);
});