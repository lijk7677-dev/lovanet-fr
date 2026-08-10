import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_BASE } from "@/lib/apiBase";

const TRANSLATION_CACHE_STORAGE_KEY = "lovanet.translation.cache.v1";

type TranslationCacheStore = Record<string, string>;

type TranslationApiItem = {
  original_text: string;
  translated_text: string;
  from_cache?: boolean;
  detected_source_lang?: string;
};

type TranslationApiResponse = {
  target_lang?: string;
  translations?: TranslationApiItem[];
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeTranslationText(value: string | null | undefined) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function translationCacheKey(text: string, targetLang = "fr") {
  return `${targetLang}:${normalizeTranslationText(text)}`;
}

function readTranslationCache(): TranslationCacheStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TRANSLATION_CACHE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeTranslationCache(store: TranslationCacheStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRANSLATION_CACHE_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore storage failures
  }
}

export function getCachedTranslation(text: string, targetLang = "fr") {
  const normalized = normalizeTranslationText(text);
  if (!normalized) return "";
  const cache = readTranslationCache();
  return cache[translationCacheKey(normalized, targetLang)] || "";
}

export async function translateTexts(texts: Array<string | null | undefined>, targetLang = "fr") {
  const normalizedTexts = Array.from(
    new Set(
      texts
        .map((value) => normalizeTranslationText(value))
        .filter(Boolean),
    ),
  );

  if (!normalizedTexts.length) return {} as Record<string, string>;

  const cache = readTranslationCache();
  const result: Record<string, string> = {};
  const missing = normalizedTexts.filter((text) => {
    const cached = cache[translationCacheKey(text, targetLang)];
    if (cached) {
      result[text] = cached;
      return false;
    }
    return true;
  });

  if (!missing.length) return result;

  const endpoint = `${API_BASE}/translate`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: missing, target_lang: targetLang, source_lang: "auto" }),
    });

    if (!response.ok) {
      throw new Error(`translation-http-${response.status}`);
    }

    const payload = (await response.json()) as TranslationApiResponse;
    const translations = Array.isArray(payload.translations) ? payload.translations : [];

    let cacheChanged = false;
    for (const item of translations) {
      const original = normalizeTranslationText(item.original_text);
      const translated = normalizeTranslationText(item.translated_text) || original;
      if (!original) continue;
      result[original] = translated;
      cache[translationCacheKey(original, targetLang)] = translated;
      cacheChanged = true;
    }

    if (cacheChanged) {
      writeTranslationCache(cache);
    }
  } catch (error) {
    console.error("Translation request failed", error);
    for (const text of missing) {
      result[text] = text;
    }
  }

  return result;
}
