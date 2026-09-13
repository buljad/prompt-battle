/**
 * REVERSE PROMPT BATTLE – server.js
 * Production-ready Gateway:
 * 1. Safe Leet/Typo Normalization (preserves word boundaries)
 * 2. Pre-translation Semantic Regex Shield (real phrase extraction)
 * 3. Multi-tier Translation Engine (Lingva -> Google Alt -> Fallback Stemmer)
 * 4. Post-translation English Safety Filter
 * 5. Art-Anchored Generation Pipeline (Flux -> SDXL -> Turbo)
 * 6. Mutex Queue & Leaderboard API
 */

const http = require("http");
const fs   = require("fs");
const path = require("path");

const PORT    = 3000;
const DIR     = __dirname;
const LB_FILE = path.join(DIR, "art_leaderboard.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css" : "text/css",
  ".js"  : "application/javascript",
  ".json": "application/json",
  ".png" : "image/png",
  ".jpg" : "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg" : "image/svg+xml",
  ".ico" : "image/x-icon",
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function isGibberish(text) {
  const clean = text.trim();
  if (clean.length < 4) return true;
  const words = clean.split(/\s+/).filter((w) => w.length > 1);
  if (words.length < 2) return true;
  if (/(.)\1{4,}/i.test(clean)) return true;
  if (/[бвгджзйклмнпрстфхцчшщbcdfghjklmnpqrstvwxyz]{6,}/i.test(clean)) return true;
  return false;
}

// Корректная очистка без удаления пробелов между словами
function normalizeTyposAndLeet(rawText) {
  let text = rawText.toLowerCase().trim();

  // Удаляем только спецсимволы-разделители внутри слов, не трогая пробелы
  text = text.replace(/([а-яёa-z0-9])[\.\-_*\/\\|]+(?=[а-яёa-z0-9])/gi, "$1");
  text = text.replace(/\s+/g, " ");

  const leetMap = {
    a: "а", b: "в", e: "е", k: "к", m: "м",
    h: "н", o: "о", p: "р", c: "с", t: "т",
    y: "у", x: "х", 0: "о", 1: "и", 3: "з", 4: "ч",
  };

  text = text
    .split("")
    .map((ch) => leetMap[ch] || ch)
    .join("");

  return text.replace(/([а-яёa-z])\1{2,}/gi, "$1");
}

function detectViolations(rawText) {
  const norm = normalizeTyposAndLeet(rawText);
  const flagged = [];

  const maleRoots = "(мужчин|мужик|пар(ен|н)|пацан|мальчик|юнош|дед|старик|дяд|джентльмен|парней|мужиков|мужчинами|парнями)";
  const kissRoots = "(целу|поцелу|засос|лобза|чмок|обжим|присосал|целова)";
  const loveRoots = "(люб[яиеятл]|влюблен|романт|нежност|ласк|страст|обнима|объят)";
  const gayRoots  = "(ге[йиея]|гомосек[а-я]*|лгбт|gay|homo|mlm)";
  const eachOtherMask = "([дзж]?ру[гж][а-я]*\\s+[дзж]?ру[гж][а-я]*)";

  const maleIntimacyPatterns = [
    new RegExp(`${gayRoots}.*?(${kissRoots}|${loveRoots}|пляж|берег|постел|вместе|пара|парн|мужч)`, "i"),
    new RegExp(`(${kissRoots}|${loveRoots}).*?${gayRoots}`, "i"),
    new RegExp(`(дв[ауео]|пар[аеы]|обо[ихей]|вдвоем)\\s+([а-яё\\s]*\\s+)?${maleRoots}[а-яё]*.*?(${kissRoots}|${loveRoots})`, "i"),
    new RegExp(`(${kissRoots}|${loveRoots})[а-яё]*.*?(дв[ауео]|пар[аеы]|обо[ихей]|вдвоем)\\s+([а-яё\\s]*\\s+)?${maleRoots}`, "i"),
    new RegExp(`${maleRoots}[а-яё]*.*?${maleRoots}[а-яё]*.*?(${kissRoots}|${loveRoots})`, "i"),
    new RegExp(`${maleRoots}[а-яё]*.*?(${kissRoots}|${loveRoots})[а-яё]*.*?${maleRoots}`, "i"),
    new RegExp(`${maleRoots}[а-яё]*.*?(${kissRoots}|${loveRoots})[а-яё]*.*?${eachOtherMask}`, "i"),
    new RegExp(`${eachOtherMask}.*?(${kissRoots}|${loveRoots})[а-яё]*.*?${maleRoots}`, "i"),
  ];

  for (const pattern of maleIntimacyPatterns) {
    const m = rawText.match(pattern) || norm.match(pattern);
    if (m) {
      const matchStr = m[0].trim();
      if (!flagged.includes(matchStr)) flagged.push(matchStr);
      break;
    }
  }

  const anatomyAndFetishPatterns = [
    /(женск|больш|пышн|обнажен|открыт|красив|висяч|упруг|видет|виде|форм)[а-яё]*\s+груд[а-яё]*/gi,
    /груд[а-яё]*\s+(женщин|девушк|больш|пышн|размер)/gi,
    /вым[яе][а-яё]*/gi,
    /(женщин|девушк|человек|самк)[а-яё]*[\s\-]+(коров|кобыл|свин|лошад|псин|собак|животн)[а-яё]*/gi,
    /(коров|кобыл|свин|лошад)[а-яё]*[\s\-]+(женщин|девушк|телк)[а-яё]*/gi,
    /без\s+(одежды|белья|штанов|трусов)/gi,
    /половой\s+акт/gi,
    /занима(ются|ться|лись)\s+сексом/gi,
  ];

  anatomyAndFetishPatterns.forEach((p) => {
    const matches = rawText.match(p) || norm.match(p);
    if (matches) {
      matches.forEach((w) => {
        const clean = w.trim();
        if (!flagged.includes(clean)) flagged.push(clean);
      });
    }
  });

  const tokens = rawText.toLowerCase().split(/[^a-zа-яё0-9]+/i).filter((w) => w.length > 1);

  tokens.forEach((word) => {
    const safeEbRoots = /(греб|неб|хлеб|колеб|треб|сереб|хреб|стеб|лебед|дебат|ястреб|жереб|учеб|судеб|молеб|врачеб|плацеб)/i;
    if (/еб/i.test(word) && !safeEbRoots.test(word)) {
      if (/([а-яё]*[её]б(ать|ал|ала|али|ет|ут|учий|анн|аный|ло|лан|нутый|ля|у|ёшь|ете|ись)[а-яё]*|долбо[её]б[а-яё]*)/i.test(word)) {
        if (!flagged.includes(word)) flagged.push(word);
      }
    }

    if (/^(член|члена|членом|члены|пенис[а-яё]*|вагин[а-яё]*|соск[иао][а-яё]*|сосо[чк][а-яё]*|dick|penis|vagina)$/i.test(word)) {
      if (!flagged.includes(word)) flagged.push(word);
    }
    if (/^(сиськ[а-яё]*|сисе[кч][а-яё]*|жопа|жопы|жопу|жопой|жопе|asshole)$/i.test(word)) {
      if (!flagged.includes(word)) flagged.push(word);
    }
    if (/^(порно[а-яё]*|porno|минет[а-яё]*|куни[а-яё]*|трах[а-яё]*|дроч[а-яё]*|nude|naked|nudity|nsfw|топлесс?)$/i.test(word)) {
      if (!flagged.includes(word)) flagged.push(word);
    }
    if (/^(хентай|hentai|лоликон|фетиш[а-яё]*)$/i.test(word)) {
      if (!flagged.includes(word)) flagged.push(word);
    }
    if (/^(пизд[а-яё]*|ху[йяеёюи][а-яё]*|бл[яяа]д[а-яё]*)$/i.test(word)) {
      if (!flagged.includes(word)) flagged.push(word);
    }
  });

  return flagged;
}

function detectPostTranslationViolations(englishText) {
  const text = englishText.toLowerCase();

  const maleTerms = "(?:men|man|guys|guy|males|male|boys|boy|gentlemen|dudes)";
  const intimateTerms = "(?:kiss|kisses|kissing|smooch|smooches|smooching|make out|making out|love|loving|lovers|romantic|romance|embracing|cuddle|cuddling)";

  const englishPatterns = [
    // "two men kissing", "both guys are kissing"
    new RegExp(`\\b(?:two|2|both|pair of)\\s+${maleTerms}\\s+(?:\\w+\\s+)?${intimateTerms}\\b`, "i"),
    // "kissing between two men"
    new RegExp(`\\b${intimateTerms}\\s+.*?(?:two|2|both|between)\\s+${maleTerms}\\b`, "i"),
    // "man kisses a man / another man / him" — СТРОГИЙ \b перед второй частью!
    new RegExp(`\\b${maleTerms}\\s+(?:\\w+\\s+)?${intimateTerms}\\s+.*?(?:\\banother\\s+${maleTerms}|\\b${maleTerms}|\\beach other|\\bhim)\\b`, "i"),
    // Прямые маркеры
    new RegExp(`\\b(?:gay|gays|homosexual|mlm)\\s+.*?${intimateTerms}\\b`, "i"),
    new RegExp(`\\b${intimateTerms}\\s+.*?(?:gay|gays|homosexual|mlm)\\b`, "i"),
    new RegExp(`\\b(?:gay|gays|homosexual)\\s+.*?(?:beach|shore|bed|bedroom|together)\\b`, "i"),

    // Анатомия и фетиш
    /\b(udder|udders|nipple|nipples|boob|boobs|cleavage)\b/i,
    /\b(woman|women|female|girl)'?s?\s+(breast|breasts)\b/i,
    /\b(large|big|bare|naked)\s+breasts?\b/i,
    /\b(cow-girl|cowgirl|female cow)\b/i,
  ];

  return englishPatterns.some((pattern) => pattern.test(text));
}

function createCensoredPlaceholder() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">
    <rect width="100%" height="100%" fill="#130912"/>
    <defs>
      <pattern id="stripes" width="40" height="40" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="40" stroke="#e94560" stroke-width="16" opacity="0.25"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#stripes)"/>
    <circle cx="384" cy="300" r="100" fill="#e94560" opacity="0.15"/>
    <text x="384" y="325" font-family="sans-serif" font-size="80" text-anchor="middle" fill="#ff5271">⛔</text>
    <rect x="84" y="420" width="600" height="90" rx="16" fill="#e94560"/>
    <text x="384" y="478" font-family="Segoe UI, sans-serif" font-size="34" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="2">КОНТЕНТ ЗАБЛОКИРОВАН</text>
    <text x="384" y="560" font-family="Segoe UI, sans-serif" font-size="24" font-weight="600" text-anchor="middle" fill="#9ca3af">Обнаружено нарушение правил приличия стенда</text>
    <text x="384" y="600" font-family="Segoe UI, sans-serif" font-size="20" text-anchor="middle" fill="#e94560">Результат раунда аннулирован (0%)</text>
    <rect width="100%" height="100%" fill="none" stroke="#e94560" stroke-width="12"/>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function translateViaLingva(text) {
  const mirrors = [
    "https://lingva.ml/api/v1/ru/en/",
    "https://translate.plausibility.cloud/api/v1/ru/en/",
    "https://lingva.lunar.icu/api/v1/ru/en/",
  ];

  for (const mirror of mirrors) {
    try {
      const res = await fetch(`${mirror}${encodeURIComponent(text)}`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        signal: AbortSignal.timeout(2800),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.translation && data.translation.trim().length > 0) {
          return data.translation.trim();
        }
      }
    } catch {
      continue;
    }
  }
  throw new Error("Зеркала Lingva недоступны");
}

async function translateViaGoogleAlt(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ru&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "AndroidTranslate/6.20.0 (Linux; U; Android 11)" },
    signal: AbortSignal.timeout(2500),
  });
  if (!res.ok) throw new Error(`Google Alt status ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data?.[0])) {
    return data[0].map((chunk) => chunk[0]).join("").trim();
  }
  throw new Error("Google Alt parse error");
}

function smartMorphologicalFallback(text) {
  const lower = text.toLowerCase();
  const extracted = [];

  const semanticRules = [
    { match: /женщин|девушк|дама/i, tag: "portrait of a noble woman" },
    { match: /мужчин|парен|странник|человек/i, tag: "figure of a man standing" },
    { match: /улыб/i, tag: "subtle enigmatic smile" },
    { match: /взгляд|смотр/i, tag: "looking at viewer" },
    { match: /рук|кист|ладон/i, tag: "hands gently folded" },
    { match: /сидит|сидя/i, tag: "seated half-length portrait pose" },
    { match: /спин|сзад/i, tag: "view from behind, back turned" },
    { match: /боком/i, tag: "three-quarter turn angle" },
    { match: /крич|рот/i, tag: "screaming expressive face with open mouth" },
    { match: /обнима|поцелу|пара/i, tag: "embracing figures" },
    { match: /темн.*одежд|черн.*плать|одежд|костюм/i, tag: "dark tailored historical suit" },
    { match: /вуал|накидк|плат/i, tag: "sheer delicate veil" },
    { match: /пальто|сюртук|плащ/i, tag: "dark tailored frock coat" },
    { match: /гор|утес|скал|пик/i, tag: "distant misty jagged mountain cliffs" },
    { match: /рек|вод|озер/i, tag: "winding river valley flowing into distance" },
    { match: /волн|гребен|шторм/i, tag: "colossal crested ocean wave" },
    { match: /пен|капл|брызг/i, tag: "frothing claw-like white sea foam" },
    { match: /лодк|греб/i, tag: "narrow wooden boats with rowers" },
    { match: /туман|дымк|облак/i, tag: "dense sea of billowing fog" },
    { match: /неб/i, tag: "dramatic atmospheric sky" },
    { match: /закат|оранжев|красн.*неб/i, tag: "fiery vibrant orange sunset" },
    { match: /звезд|вихр|ноч/i, tag: "swirling starry night sky, glowing celestial light" },
    { match: /лун|месяц/i, tag: "glowing crescent moon" },
    { match: /кипарис|дерев/i, tag: "dark towering cypress silhouette" },
    { match: /час|циферблат/i, tag: "surreal melting soft clocks" },
    { match: /полян|цвет/i, tag: "vibrant flower meadow" },
    { match: /фон/i, tag: "soft sfumato atmospheric background" },
    { match: /лазур|син/i, tag: "deep Prussian blue tones" },
    { match: /золот|желт/i, tag: "luminous warm golden palette" },
  ];

  semanticRules.forEach((rule) => {
    if (rule.match.test(lower)) {
      extracted.push(rule.tag);
    }
  });

  if (extracted.length > 0) {
    return Array.from(new Set(extracted)).join(", ");
  }

  return "classical fine art masterpiece, scenic composition";
}

async function translateToEnglish(rawText) {
  const text = rawText.trim();
  console.log(`\n--------------------------------------------------`);
  console.log(`[Промпт от игрока (RU)]: "${text}"`);

  if (!/[а-яА-ЯёЁ]/.test(text)) {
    console.log(`[Translate]: Текст на латинице. Перевод не требуется.`);
    return text;
  }

  try {
    const result = await translateViaLingva(text);
    if (result && result.length > 0) {
      console.log(`[Translate: Tier 1 (Lingva Proxy)]: УСПЕХ -> "${result}"`);
      return result;
    }
  } catch (err) {
    console.warn(`[Translate: Tier 1 ОШИБКА]: ${err.message}`);
  }

  try {
    const result = await translateViaGoogleAlt(text);
    if (result && result.length > 0) {
      console.log(`[Translate: Tier 2 (Google Alt)]: УСПЕХ -> "${result}"`);
      return result;
    }
  } catch (err) {
    console.warn(`[Translate: Tier 2 ОШИБКА]: ${err.message}`);
  }

  const fallbackResult = smartMorphologicalFallback(text);
  console.warn(`[Translate: Tier 3 (Стеммер)]: -> "${fallbackResult}"`);
  return fallbackResult;
}

async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function generateImageFree(userPrompt) {
  const englishPrompt = await translateToEnglish(userPrompt);

  if (detectPostTranslationViolations(englishPrompt)) {
    console.warn(`[Security Intervention Post-Translate]: Заблокировано на английском -> "${englishPrompt}"`);
    throw new Error("VIOLATION_DETECTED");
  }

  const artAnchor = "historical fine art oil painting, masterpiece, museum classical art style";
  const inlineAntiFrame = "no frame, no picture border, no museum wall";

  const finalPrompt = `${englishPrompt}, ${artAnchor}, ${inlineAntiFrame}`;
  const encodedPrompt = encodeURIComponent(finalPrompt);

  console.log(`[AI Итоговый промпт]: "${finalPrompt}"`);

  const negativeParam = encodeURIComponent(
    "photograph, realistic photo, modern camera, explicit, nudity, nude, pornographic, lingerie, underwear, 3d render"
  );

  const modelCascade = [
    { name: "flux", model: "flux", timeout: 18000 },
    { name: "sdxl", model: "sdxl", timeout: 14000 },
    { name: "turbo", model: "turbo", timeout: 10000 },
  ];

  let lastError = null;

  for (let i = 0; i < modelCascade.length; i++) {
    const tier = modelCascade[i];
    const seed = Math.floor(Math.random() * 10000000);
    const modelParam = tier.model ? `&model=${tier.model}` : "";
    const targetUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=768&nologo=true&safe=true&seed=${seed}${modelParam}&negative=${negativeParam}`;

    console.log(`[AI Tier ${i + 1}/${modelCascade.length}] Запрос модели "${tier.name}"...`);

    try {
      const apiRes = await fetchWithTimeout(targetUrl, tier.timeout);

      if (apiRes.status === 429 || apiRes.status >= 500) {
        console.warn(`[AI Tier ${i + 1}] Статус ${apiRes.status}. Переключение модели...`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

      if (!apiRes.ok) {
        const errText = await apiRes.text().catch(() => "");
        throw new Error(`HTTP ${apiRes.status}: ${errText.slice(0, 80)}`);
      }

      const contentType = apiRes.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await apiRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(`[AI Tier ${i + 1}] Успех! Модель: ${tier.name}, размер: ${Math.round(buffer.length / 1024)} KB`);
      console.log(`--------------------------------------------------\n`);
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    } catch (err) {
      if (err.message === "VIOLATION_DETECTED") throw err;
      console.warn(`[AI Tier ${i + 1}] Сбой (${err.message})...`);
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`Все модели перегружены: ${lastError?.message || "Сервер недоступен"}`);
}

const MIN_API_INTERVAL_MS = 3000;
let lastApiCallTimestamp = 0;
let generationQueue = Promise.resolve();

function enqueueGeneration(prompt) {
  generationQueue = generationQueue
    .catch(() => {})
    .then(async () => {
      const now = Date.now();
      const elapsed = now - lastApiCallTimestamp;

      if (elapsed < MIN_API_INTERVAL_MS) {
        const waitTime = MIN_API_INTERVAL_MS - elapsed;
        console.log(`[Queue] Пауза безопасности: ${waitTime} мс...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlPath = req.url.split("?")[0];

  if (req.method === "GET" && urlPath === "/api/leaderboard") {
    if (!fs.existsSync(LB_FILE)) {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end("[]");
      return;
    }
    fs.readFile(LB_FILE, "utf8", (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end("Server error");
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(!data || !data.trim() ? "[]" : data);
    });
    return;
  }

  if (req.method === "POST" && urlPath === "/api/leaderboard") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const parsed = JSON.parse(body || "[]");
        fs.writeFile(LB_FILE, JSON.stringify(parsed, null, 2), "utf8", (err) => {
          if (err) {
            res.writeHead(500);
            res.end("Write error");
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end('{"ok":true}');
        });
      } catch {
        res.writeHead(400);
        res.end("Invalid JSON");
      }
    });
    return;
  }

  if (req.method === "POST" && urlPath === "/api/generate") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", async () => {
      try {
        const { prompt } = JSON.parse(body || "{}");

        if (!prompt || isGibberish(prompt)) {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ error: "Промпт не содержит осмысленного описания картины" }));
          return;
        }

        const flaggedWords = detectViolations(prompt);
        if (flaggedWords.length > 0) {
          console.warn(`[Security Intervention Pre-Translate]: Заблокировано -> ${flaggedWords.join(", ")}`);
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({
            violation: true,
            flaggedWords: flaggedWords,
            image: createCensoredPlaceholder(),
          }));
          return;
        }

        try {
          const imageBase64 = await enqueueGeneration(prompt);
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ image: imageBase64 }));
        } catch (genErr) {
          if (genErr.message === "VIOLATION_DETECTED") {
            res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({
              violation: true,
              flaggedWords: [prompt.trim()],
              image: createCensoredPlaceholder(),
            }));
            return;
          }
          throw genErr;
        }
      } catch (err) {
        console.error("[AI Pipeline Error]:", err.message);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({
          violation: false,
          image: createCensoredPlaceholder(),
        }));
      }
    });
    return;
  }

  const filePath = path.join(DIR, urlPath === "/" ? "index.html" : urlPath);
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