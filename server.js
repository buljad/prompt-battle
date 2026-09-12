/**
 * REVERSE PROMPT BATTLE – server.js
 * Fail-Safe Anti-Frame, Anti-NSFW & Mutex Queue Pipeline
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
  '.svg' : 'image/svg+xml',
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

// Замена любых формулировок наготы на нейтральные описания античной ткани
function sanitizeModesty(rawText) {
  return rawText
    .replace(/\b(голая|голый|голые|обнаженная|обнаженный|обнаженные|нагая|нагой|нагие|без одежды|ню|сиськи|грудь|гениталии|попа|попка)\b/gi, 'в классических струящихся драпировках')
    .replace(/\b(nude|naked|nudity|bare|unclothed|nsfw|undressed|breasts|nipples|genitals)\b/gi, 'draped in classical robes');
}

async function translateToEnglish(rawText) {
  const sanitized = sanitizeModesty(rawText.trim());
  if (!/[а-яА-ЯёЁ]/.test(sanitized)) return sanitized;

  try {
    const memUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(sanitized)}&langpair=ru|en`;
    const res = await fetch(memUrl, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return sanitizeModesty(data.responseData.translatedText.trim());
      }
    }
  } catch (e) {
    console.warn('[Translate] Fallback to direct prompt pass-through');
  }
  return sanitized;
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

// Запасной холст при отказе всех внешних серверов
function createOfflineArtworkCanvas(prompt) {
  const hash = Array.from(prompt).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const h1 = hash % 360;
  const h2 = (h1 + 60) % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${h1}, 70%, 25%)"/>
        <stop offset="100%" stop-color="hsl(${h2}, 60%, 15%)"/>
      </linearGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="40" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <circle cx="384" cy="384" r="260" fill="hsl(${h2}, 80%, 65%)" opacity="0.4" filter="url(#grain)"/>
    <path d="M 0,550 Q 200,350 400,500 T 768,450 L 768,768 L 0,768 Z" fill="hsl(${h1}, 40%, 10%)" opacity="0.8" filter="url(#grain)"/>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function generateImageFree(userPrompt) {
  const englishPrompt = await translateToEnglish(userPrompt);

  // Промпт без слов "museum", "canvas", "frame" — только стиль самой картины в край изображения
  const neutralStyleWrapper = 'full bleed fine art, classical oil painting style, authentic traditional brushwork, edge to edge masterpiece';
  const finalPrompt = `${neutralStyleWrapper}, ${englishPrompt}`;
  const encodedPrompt = encodeURIComponent(finalPrompt);

  // Полное искоренение золотых рамок, стен галерей и фотографий картин
  const negativeParam = encodeURIComponent('frame, picture frame, ornate gold frame, wooden frame, gilded frame, border, white border, canvas edges, museum wall, art gallery, room, interior, photo of painting, 3d render, doll, toy, cosplay, figurine, mannequin, nudity, naked, nude, bare skin, nsfw, explicit, breasts, nipples, watermark, text');

  const modelCascade = [
    { name: 'sdxl',  model: 'sdxl',  timeout: 16000 },
    { name: 'turbo', model: 'turbo', timeout: 12000 },
    { name: 'base',  model: null,    timeout: 9000 }
  ];

  let lastError = null;

  for (let i = 0; i < modelCascade.length; i++) {
    const tier = modelCascade[i];
    const seed = Math.floor(Math.random() * 10000000);
    const modelParam = tier.model ? `&model=${tier.model}` : '';
    const targetUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=768&nologo=true&safe=true&seed=${seed}${modelParam}&negative=${negativeParam}`;

    console.log(`[AI Tier ${i + 1}/${modelCascade.length}] Запрос модели "${tier.name}"...`);

    try {
      const apiRes = await fetchWithTimeout(targetUrl, tier.timeout);

      if (apiRes.status === 429 || apiRes.status >= 500) {
        console.warn(`[AI Tier ${i + 1}] Статус ${apiRes.status} (лимит). Переключение на резервный уровень...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        continue;
      }

      if (!apiRes.ok) {
        const errText = await apiRes.text().catch(() => '');
        throw new Error(`HTTP ${apiRes.status}: ${errText.slice(0, 80)}`);
      }

      const contentType = apiRes.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await apiRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(`[AI Tier ${i + 1}] Успех! Модель: ${tier.name}, размер: ${Math.round(buffer.length / 1024)} KB`);
      return `data:${contentType};base64,${buffer.toString('base64')}`;

    } catch (err) {
      console.warn(`[AI Tier ${i + 1}] Ошибка (${err.message}). Попытка следующего уровня...`);
      lastError = err;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.warn('[AI Pipeline Fallback] Все онлайн-модели перегружены. Задействован запасной холст.');
  return createOfflineArtworkCanvas(userPrompt);
}

// ── Очередь запросов с интервалом безопасности против 429 ──
const MIN_API_INTERVAL_MS = 3500;
let lastApiCallTimestamp = 0;
let generationQueue = Promise.resolve();

function enqueueGeneration(prompt) {
  generationQueue = generationQueue.catch(() => {}).then(async () => {
    const now = Date.now();
    const elapsed = now - lastApiCallTimestamp;
    
    if (elapsed < MIN_API_INTERVAL_MS) {
      const waitTime = MIN_API_INTERVAL_MS - elapsed;
      console.log(`[Queue] Пауза безопасности: ${waitTime} мс...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    try {
      const result = await generateImageFree(prompt);
      lastApiCallTimestamp = Date.now();
      return result;
    } catch (err) {
      lastApiCallTimestamp = Date.now();
      throw err;
    }
  });

  return generationQueue;
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

        const imageBase64 = await enqueueGeneration(prompt);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ image: imageBase64 }));
      } catch (err) {
        console.error('[AI Pipeline Recovery]:', err.message);
        const fallback = createOfflineArtworkCanvas(prompt || 'Classical painting');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ image: fallback }));
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