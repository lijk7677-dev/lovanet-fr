import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavSuggestionsIndicator } from "@/components/NavSuggestionsIndicator";

export const SUGGESTIONS_TOGGLE_EVENT = "lovanet:toggle-suggestions";
export const SUGGESTIONS_STATE_EVENT = "lovanet:suggestions-state";

type Suggestion = { to: string; label: string; emoji: string };

const BASE: Suggestion[] = [
  { to: "/", label: "Portail", emoji: "🏠" },
  { to: "/anime-catalog", label: "Catalogue", emoji: "📺" },
  { to: "/prime-video", label: "Prime Vidéo", emoji: "🎬" },
  { to: "/chaine-youtube", label: "YouTube", emoji: "▶️" },
  { to: "/tiktok", label: "TikTok", emoji: "🎵" },
  { to: "/actualites", label: "Actualités", emoji: "📰" },
  { to: "/decouvrir", label: "Découvrir", emoji: "🌍" },
  { to: "/shop", label: "Boutique", emoji: "🛍️" },
  { to: "/leaderboard", label: "Classement", emoji: "🏆" },
];

export function SuggestionsBubble() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onToggle = () => setOpen((o) => !o);
    window.addEventListener(SUGGESTIONS_TOGGLE_EVENT, onToggle);
    return () => window.removeEventListener(SUGGESTIONS_TOGGLE_EVENT, onToggle);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(SUGGESTIONS_STATE_EVENT, { detail: { open } }));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = BASE.filter((s) => s.to !== pathname);

  return (
    <div ref={wrapRef} className="relative">
      <NavSuggestionsIndicator isActive={open} onClick={() => setOpen((o) => !o)} />

      {open && (
        <div style={{ zIndex: 10030 }}
          className="dock-popup absolute bottom-full left-0 mb-3 w-[280px] rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-xl animate-scale-in">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Accès rapide
          </p>
          <div className="grid grid-cols-3 gap-2">
            {items.map((s) => (
              <button
                key={s.to}
                type="button"
                onClick={() => {
                  navigate(s.to);
                  setOpen(false);
                }}
                className="flex min-h-[66px] flex-col items-center justify-center gap-1 rounded-xl border border-border/60 bg-background/60 px-1 py-2 text-center transition-colors hover:bg-accent"
              >
                <span className="text-lg">{s.emoji}</span>
                <span className="text-[10px] font-semibold leading-tight text-foreground">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SuggestionsBubble;
