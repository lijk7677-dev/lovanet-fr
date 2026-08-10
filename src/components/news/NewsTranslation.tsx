import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { API_BASE as API } from "@/lib/apiBase";

export const NEWS_LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
];

type Ctx = {
  lang: string;
  setLang: (lang: string) => void;
  translating: boolean;
  t: (text?: string) => string;
};

const NewsTranslationContext = createContext<Ctx>({
  lang: "fr",
  setLang: () => {},
  translating: false,
  t: (text) => text || "",
});

export function useNewsTranslation() {
  return useContext(NewsTranslationContext);
}

export function NewsTranslationProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<string>(() => localStorage.getItem("lovanet.news.lang") || "fr");
  const [dict, setDict] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);
  const queue = useRef<Set<string>>(new Set());
  const requested = useRef<Set<string>>(new Set());
  const timer = useRef<number | undefined>(undefined);

  const setLang = useCallback((next: string) => {
    setLangState(next);
    localStorage.setItem("lovanet.news.lang", next);
  }, []);

  useEffect(() => {
    queue.current.clear();
    requested.current.clear();
  }, [lang]);

  const flush = useCallback(async () => {
    const texts = Array.from(queue.current).slice(0, 60);
    if (!texts.length || lang === "fr") return;
    texts.forEach((text) => queue.current.delete(text));
    setTranslating(true);
    try {
      const res = await fetch(`${API}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts, target_lang: lang }),
      });
      if (!res.ok) throw new Error(`translate-${res.status}`);
      const data = await res.json();
      const next: Record<string, string> = {};
      (data.translations || []).forEach((row: { original_text: string; translated_text: string }) => {
        next[`${lang}::${row.original_text}`] = row.translated_text;
      });
      setDict((prev) => ({ ...prev, ...next }));
    } catch (error) {
      console.error("news translation failed", error);
    } finally {
      setTranslating(false);
      if (queue.current.size) window.setTimeout(flush, 200);
    }
  }, [lang]);

  const schedule = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 320);
  }, [flush]);

  const t = useCallback(
    (text?: string) => {
      const value = (text || "").trim();
      if (!value || lang === "fr") return text || "";
      const key = `${lang}::${value}`;
      const cached = dict[key];
      if (cached) return cached;
      if (!requested.current.has(key)) {
        requested.current.add(key);
        queue.current.add(value);
        schedule();
      }
      return text || "";
    },
    [dict, lang, schedule],
  );

  const value = useMemo(() => ({ lang, setLang, translating, t }), [lang, setLang, translating, t]);

  return <NewsTranslationContext.Provider value={value}>{children}</NewsTranslationContext.Provider>;
}

export function NewsLanguageBar({ className = "" }: { className?: string }) {
  const { lang, setLang, translating } = useNewsTranslation();
  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-[1.4rem] border border-[var(--theme-border-soft)] bg-[rgba(255,255,255,0.04)] px-4 py-3 ${className}`}
      data-testid="news-language-bar"
    >
      <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-white/60">
        {translating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
        Lire dans une autre langue
      </span>
      <div className="flex flex-wrap gap-2">
        {NEWS_LANGUAGES.map((option) => (
          <button
            key={option.code}
            type="button"
            onClick={() => setLang(option.code)}
            className={`rounded-full border px-3 py-1 text-[11px] transition-all ${
              lang === option.code
                ? "border-sky-400 bg-sky-400/20 text-sky-200"
                : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10"
            }`}
            data-testid={`news-language-${option.code}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
