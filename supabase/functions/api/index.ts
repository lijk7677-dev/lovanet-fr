// Lovanet API edge function: translation, news feeds, multilingual trailers.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/* ---------------------------------- cache --------------------------------- */
const cache = new Map<string, { at: number; value: any }>();
function getCache<T>(key: string, ttlMs: number): T | null {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  return null;
}
function setCache(key: string, value: any) {
  cache.set(key, { at: Date.now(), value });
}

/* -------------------------------- translate ------------------------------- */
async function aiTranslateBatch(texts: string[], target: string): Promise<string[]> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("missing-ai-key");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content:
            `Translate each input string into ${target}. Reply ONLY with a JSON array of translated strings, same length and order, no extra text.`,
        },
        { role: "user", content: JSON.stringify(texts) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`ai-${res.status}`);
  const data = await res.json();
  const raw = String(data?.choices?.[0]?.message?.content || "");
  const match = raw.match(/\[[\s\S]*\]/);
  const parsed = JSON.parse(match ? match[0] : raw);
  if (!Array.isArray(parsed) || parsed.length !== texts.length) throw new Error("ai-shape");
  return parsed.map((value: unknown, index: number) => String(value || texts[index]));
}

async function translateOne(text: string, target: string): Promise<string> {
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(target)}&dt=t&q=` +
    encodeURIComponent(text.slice(0, 4500));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`gtx-${res.status}`);
  const data = await res.json();
  const chunks = Array.isArray(data?.[0]) ? data[0] : [];
  const out = chunks.map((c: any) => (Array.isArray(c) ? c[0] : "")).join("");
  if (!out || out.trim() === text.trim()) throw new Error("gtx-noop");
  return out;
}

async function handleTranslate(req: Request) {
  const body = await req.json().catch(() => ({}));
  const texts: string[] = Array.isArray(body?.texts) ? body.texts : body?.text ? [body.text] : [];
  const target = String(body?.target_lang || body?.target || "fr").toLowerCase();
  const clean = Array.from(new Set(texts.map((t) => String(t || "").trim()).filter(Boolean))).slice(0, 60);
  if (!clean.length) return json({ translations: [] });

  const translations: Array<{ original_text: string; translated_text: string }> = [];
  for (let i = 0; i < clean.length; i += 8) {
    const slice = clean.slice(i, i + 8);
    const pending: string[] = [];
    const done = await Promise.all(
      slice.map(async (text) => {
        const key = `tr:${target}:${text}`;
        const cached = getCache<string>(key, 86_400_000);
        if (cached) return { original_text: text, translated_text: cached };
        try {
          const translated = await translateOne(text, target);
          setCache(key, translated);
          return { original_text: text, translated_text: translated };
        } catch {
          pending.push(text);
          return { original_text: text, translated_text: text };
        }
      }),
    );
    if (pending.length) {
      try {
        const aiOut = await aiTranslateBatch(pending, target);
        pending.forEach((text, index) => {
          const translated = aiOut[index] || text;
          setCache(`tr:${target}:${text}`, translated);
          const row = done.find((entry) => entry.original_text === text);
          if (row) row.translated_text = translated;
        });
      } catch (error) {
        console.error("ai translate fallback failed", error);
      }
    }
    translations.push(...done);
  }
  return json({ translations, target_lang: target });
}

/* --------------------------- multilingual trailers ------------------------ */
type TrailerHit = { id: string; title: string; source: string };

function classifyVersion(title: string, channel: string): string | null {
  const t = `${title} ${channel}`.toLowerCase();
  if (/\bvf\b|version fran|doubl(é|e) fran|french dub/.test(t)) return "vf";
  if (/vostfr|sous-titr|vost fr|bande[- ]annonce/.test(t)) return "vostfr";
  if (/english dub|dub\b|doublage anglais/.test(t)) return "endub";
  if (/english sub|eng sub|subtitled/.test(t)) return "ensub";
  if (/pv|予告|trailer|teaser|official/.test(t)) return "vo";
  return null;
}

async function ytScrapeSearch(query: string): Promise<TrailerHit[]> {
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) {
      console.error("youtube scrape http", res.status);
      return [];
    }
    const html = await res.text();
    const unescape = (value: string) =>
      value.replace(/\\u0026/g, "&").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    const chunks = html.split('"videoRenderer":{"videoId":"').slice(1);
    const hits: TrailerHit[] = [];
    const seen = new Set<string>();
    for (const chunk of chunks) {
      const id = chunk.slice(0, 11);
      if (!/^[\w-]{11}$/.test(id) || seen.has(id)) continue;
      const window = chunk.slice(0, 3000);
      const title = window.match(/"title":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/)?.[1];
      const channel =
        window.match(/"longBylineText":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/)?.[1] ||
        window.match(/"ownerText":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"/)?.[1] ||
        "YouTube";
      if (!title) continue;
      seen.add(id);
      hits.push({ id, title: unescape(title), source: unescape(channel) });
      if (hits.length >= 8) break;
    }
    return hits;
  } catch (error) {
    console.error("youtube scrape failed", error);
    return [];
  }
}

async function ytApiSearch(query: string, key: string): Promise<TrailerHit[]> {
  const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&videoEmbeddable=true&q=` +
    `${encodeURIComponent(query)}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("youtube search failed", res.status, await res.text().catch(() => ""));
    return [];
  }
  const data = await res.json();
  return (data?.items || [])
    .map((item: any) => ({
      id: item?.id?.videoId,
      title: item?.snippet?.title || "",
      source: item?.snippet?.channelTitle || "YouTube",
    }))
    .filter((hit: TrailerHit) => Boolean(hit.id));
}

async function ytSearch(query: string, key?: string): Promise<TrailerHit[]> {
  const scraped = await ytScrapeSearch(query);
  if (scraped.length) return scraped;
  if (!key) return [];
  return await ytApiSearch(query, key);
}

async function handleMultilingualTrailers(url: URL) {
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return json({ results: {} });
  const cacheKey = `mt:${q.toLowerCase()}`;
  const cached = getCache<any>(cacheKey, 6 * 3600_000);
  if (cached) return json({ results: cached, cached: true });

  const key = Deno.env.get("YOUTUBE_API_KEY") || undefined;

  const queries: Array<[string, string]> = [
    ["vostfr", `${q} bande annonce VOSTFR`],
    ["vf", `${q} bande annonce VF officielle`],
    ["vo", `${q} anime official trailer PV`],
    ["ensub", `${q} official trailer english subtitles`],
    ["endub", `${q} english dub trailer`],
  ];

  const results: Record<string, TrailerHit[]> = {};
  const searched = await Promise.all(queries.map(([code, query]) => ytSearch(query, key).then((hits) => [code, hits] as const)));
  for (const [code, hits] of searched) {
    const strict = hits.filter((hit) => classifyVersion(hit.title, hit.source) === code);
    const chosen = (strict.length ? strict : code === "vo" ? hits : []).slice(0, 4);
    if (chosen.length) results[code] = chosen;
  }
  setCache(cacheKey, results);
  return json({ results });
}

/* ----------------------------------- news --------------------------------- */
const NEWS_SOURCES = [
  { id: "ann", name: "Anime News Network", url: "https://www.animenewsnetwork.com/all/rss.xml", categories: ["anime"], group: "International", language: "en" },
  { id: "crunchyroll", name: "Crunchyroll News", url: "https://www.crunchyroll.com/newsrss", categories: ["anime"], group: "Streaming", language: "en" },
  { id: "manga-news", name: "Manga News", url: "https://www.manga-news.com/index.php/rss/news", categories: ["manga"], group: "France", language: "fr" },
  { id: "journaldujapon", name: "Journal du Japon", url: "https://www.journaldujapon.com/feed/", categories: ["pop-culture"], group: "France", language: "fr" },
  { id: "gematsu", name: "Gematsu", url: "https://www.gematsu.com/feed", categories: ["gaming"], group: "Gaming", language: "en" },
  { id: "siliconera", name: "Siliconera", url: "https://www.siliconera.com/feed/", categories: ["gaming"], group: "Gaming", language: "en" },
];

type NewsItem = Record<string, any>;

function decodeEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&");
}

function tag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return match ? decodeEntities(match[1]).trim() : "";
}

function stripHtml(value: string) {
  return decodeEntities(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90);
}

function extractImage(block: string) {
  const media =
    block.match(/<media:(?:content|thumbnail)[^>]*url="([^"]+)"/i) ||
    block.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i) ||
    block.match(/<img[^>]*src="([^"]+)"/i) ||
    block.match(/&lt;img[^&]*src=&quot;([^&]+)&quot;/i);
  return media ? decodeEntities(media[1]) : null;
}

async function fetchFeed(source: (typeof NEWS_SOURCES)[number]): Promise<NewsItem[]> {
  try {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LovanetBot/1.0)", Accept: "application/rss+xml, application/xml, text/xml" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const blocks = xml.match(/<(item|entry)[\s\S]*?<\/(item|entry)>/gi) || [];
    return blocks.slice(0, 30).map((block) => {
      const title = stripHtml(tag(block, "title"));
      const linkTag = tag(block, "link");
      const link = linkTag || (block.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? "");
      const description = stripHtml(tag(block, "description") || tag(block, "summary") || tag(block, "content:encoded"));
      const published = tag(block, "pubDate") || tag(block, "updated") || tag(block, "published");
      const publishedAt = published ? new Date(published) : new Date();
      return {
        id: `${source.id}-${slugify(title)}`,
        slug: `${slugify(title)}-${source.id}`,
        title,
        description: description.slice(0, 480),
        excerpt: description.slice(0, 220),
        content: description,
        image: extractImage(block),
        published_at: (isNaN(publishedAt.getTime()) ? new Date() : publishedAt).toISOString(),
        source_name: source.name,
        source_group: source.group,
        source_id: source.id,
        source_path: link,
        source_domain: (() => {
          try {
            return new URL(link).hostname;
          } catch {
            return "";
          }
        })(),
        categories: source.categories,
        categoryLabels: source.categories,
        verified: true,
        is_breaking: false,
        trending_score: 0,
      } as NewsItem;
    }).filter((item) => item.title);
  } catch {
    return [];
  }
}

async function loadNews(force = false): Promise<NewsItem[]> {
  const cached = getCache<NewsItem[]>("news:all", force ? 0 : 10 * 60_000);
  if (cached) return cached;
  const lists = await Promise.all(NEWS_SOURCES.map(fetchFeed));
  const items = lists.flat().sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)));
  items.forEach((item, index) => {
    item.trending_score = Math.max(1, 100 - index);
    item.is_featured = index < 8;
    item.is_breaking = index < 3;
  });
  setCache("news:all", items);
  return items;
}

function sourcesPayload(items: NewsItem[]) {
  return NEWS_SOURCES.map((source) => {
    const count = items.filter((item) => item.source_id === source.id).length;
    return {
      id: source.id,
      name: source.name,
      source_group: source.group,
      categories: source.categories,
      priority: 1,
      status: count ? "ok" : "empty",
      last_success_at: new Date().toISOString(),
      last_count: count,
      last_error: count ? null : "no-items",
      site_url: source.url,
      language: source.language,
      region: source.language === "fr" ? "FR" : "INT",
    };
  });
}

async function handleNewsHome() {
  const items = await loadNews();
  const byCategory = (cat: string) => items.filter((item) => (item.categories || []).includes(cat)).slice(0, 14);
  return json({
    hero: items.slice(0, 5),
    featured: items.slice(0, 10),
    latest: items.slice(0, 24),
    rails: {
      anime: byCategory("anime"),
      manga: byCategory("manga"),
      gaming: byCategory("gaming"),
      "pop-culture": byCategory("pop-culture"),
    },
    trending: [...items].sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0)).slice(0, 12),
    calendar: items.slice(0, 12),
    sources: sourcesPayload(items),
    updated_at: new Date().toISOString(),
  });
}

async function handleNewsList(url: URL) {
  const items = await loadNews();
  const limit = Math.min(60, Number(url.searchParams.get("limit") || 24));
  const offset = Number(url.searchParams.get("offset") || 0);
  const category = url.searchParams.get("category");
  const source = url.searchParams.get("source");
  const sort = url.searchParams.get("sort") || "recent";
  const q = (url.searchParams.get("q") || "").toLowerCase().trim();

  let filtered = items;
  if (category && category !== "all") filtered = filtered.filter((item) => (item.categories || []).includes(category));
  if (source && source !== "all") filtered = filtered.filter((item) => item.source_id === source);
  if (q) filtered = filtered.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(q));
  if (sort === "trending") filtered = [...filtered].sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0));

  return json({
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    offset,
    limit,
    source: source || "all",
    categories: [
      { id: "anime", label: "Anime" },
      { id: "manga", label: "Manga" },
      { id: "gaming", label: "Gaming" },
      { id: "pop-culture", label: "Culture pop japonaise" },
    ],
  });
}

async function handleNewsDetail(slug: string) {
  const items = await loadNews();
  const item = items.find((entry) => entry.slug === slug);
  if (!item) return json({ error: "not-found" }, 404);
  const related = items
    .filter((entry) => entry.slug !== slug && (entry.categories || []).some((cat: string) => (item.categories || []).includes(cat)))
    .slice(0, 8);
  return json({ item, related, source: item.source_id });
}

async function handleImageProxy(url: URL) {
  const target = url.searchParams.get("url");
  if (!target) return json({ error: "missing-url" }, 400);
  try {
    const res = await fetch(target, { headers: { "User-Agent": "Mozilla/5.0 (compatible; LovanetBot/1.0)" } });
    if (!res.ok) return json({ error: "upstream" }, 502);
    const body = await res.arrayBuffer();
    return new Response(body, {
      headers: {
        ...corsHeaders,
        "Content-Type": res.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return json({ error: "proxy-failed" }, 502);
  }
}

/* ---------------------------------- router -------------------------------- */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1/, "").replace(/^\/api/, "").replace(/^\/?api/, "");
  const route = path.replace(/^\/?api\b/, "").replace(/^\//, "").replace(/^api\//, "");

  try {
    if (route === "translate" && req.method === "POST") return await handleTranslate(req);
    if (route === "prime/multilingual-trailers") return await handleMultilingualTrailers(url);
    if (route === "news/home") return await handleNewsHome();
    if (route === "news/image-proxy") return await handleImageProxy(url);
    if (route === "image-proxy") return await handleImageProxy(url);
    if (route === "sync/news" && req.method === "POST") {
      const items = await loadNews(true);
      return json({ ok: true, count: items.length, updated_at: new Date().toISOString() });
    }
    if (route === "news") return await handleNewsList(url);
    if (route.startsWith("news/")) return await handleNewsDetail(route.slice("news/".length));
    return json({ error: "not-found", route }, 404);
  } catch (error) {
    console.error("api error", route, error);
    return json({ error: String((error as Error)?.message || error) }, 500);
  }
});