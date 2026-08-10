import { useCallback, useState } from "react";

import { API_BASE as API } from "@/lib/apiBase";

const memoryCache: Record<string, Record<string, string>> = {};

function cacheKey(target: string, text: string) {
  return `${target}::${text}`;
}

function readSession(target: string, text: string): string | null {
  if (typeof window === "undefined") return null;
  const key = cacheKey(target, text);
  if (memoryCache[target]?.[text]) return memoryCache[target][text];
  try {
    const raw = window.sessionStorage.getItem(`lovanet.tr.${key}`);
    if (raw) {
      memoryCache[target] = memoryCache[target] || {};
      memoryCache[target][text] = raw;
      return raw;
    }
  } catch (_) {
    /* ignore */
  }
  return null;
}

function writeSession(target: string, text: string, translated: string) {
  memoryCache[target] = memoryCache[target] || {};
  memoryCache[target][text] = translated;
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(`lovanet.tr.${cacheKey(target, text)}`, translated);
    }
  } catch (_) {
    /* ignore */
  }
}

/**
 * On-demand translator for a set of texts. No auto-run — the caller triggers `translate()`.
 * Uses the free `/api/translate` endpoint (deep-translator / Google).
 */
export function useCardTranslator(defaultLang: string = "fr") {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [targetLang, setTargetLang] = useState(defaultLang);

  const translate = useCallback(
    async (texts: string[], targetOverride?: string) => {
      const target = (targetOverride || targetLang || "fr").toLowerCase();
      const clean = Array.from(new Set(texts.map((t) => (t || "").trim()).filter(Boolean)));
      if (!clean.length) return {} as Record<string, string>;

      const missing: string[] = [];
      const local: Record<string, string> = {};
      for (const txt of clean) {
        const cached = readSession(target, txt);
        if (cached) {
          local[txt] = cached;
        } else {
          missing.push(txt);
        }
      }

      let fresh: Record<string, string> = {};
      if (missing.length) {
        setLoading(true);
        try {
          const res = await fetch(`${API}/translate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texts: missing, target_lang: target }),
          });
          const json = await res.json();
          const rows: Array<{ original_text: string; translated_text: string }> = json?.translations || [];
          for (const row of rows) {
            fresh[row.original_text] = row.translated_text;
            writeSession(target, row.original_text, row.translated_text);
          }
        } catch (e) {
          console.warn("translate failed", e);
        } finally {
          setLoading(false);
        }
      }

      const merged = { ...local, ...fresh };
      setTranslations((current) => ({ ...current, ...merged }));
      return merged;
    },
    [targetLang],
  );

  const getText = useCallback(
    (original?: string | null) => {
      const key = (original || "").trim();
      if (!key) return "";
      return translations[key] || key;
    },
    [translations],
  );

  const clear = useCallback(() => setTranslations({}), []);

  return { translate, getText, loading, targetLang, setTargetLang, clear, translations };
}
