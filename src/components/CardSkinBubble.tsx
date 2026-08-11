import { useEffect, useRef, useState } from "react";
import { Layers, Move, X } from "lucide-react";

/**
 * Floating bubble (bottom-left) that themes catalog/preview CARDS.
 * Sets CSS variables --card-skin-bg / --card-skin-fg / --card-skin-border
 * which the AnimeCatalog cards consume. Default: white bg, black text.
 */
type Skin = {
  key: string;
  label: string;
  bg: string;
  fg: string;
  border: string;
  swatch: string;
};

const SKINS: Skin[] = [
  { key: "white",   label: "Blanc",    bg: "#ffffff", fg: "#0a0a0a", border: "rgba(0,0,0,0.12)", swatch: "#ffffff" },
  { key: "ivory",   label: "Ivoire",   bg: "#fffbe6", fg: "#1a1a00", border: "rgba(0,0,0,0.15)", swatch: "#fffbe6" },
  { key: "black",   label: "Noir",     bg: "#0a0a0a", fg: "#fafafa", border: "rgba(255,255,255,0.15)", swatch: "#0a0a0a" },
  { key: "graphite",label: "Graphite", bg: "#1c1c22", fg: "#f1f1f5", border: "rgba(255,255,255,0.12)", swatch: "#1c1c22" },
  { key: "cream",   label: "Crème",    bg: "#f5e6c8", fg: "#2a1a05", border: "rgba(0,0,0,0.15)", swatch: "#f5e6c8" },
  { key: "rose",    label: "Rose",     bg: "#ffe0ec", fg: "#3a0a20", border: "rgba(236,72,153,0.35)", swatch: "#ffe0ec" },
  { key: "sky",     label: "Ciel",     bg: "#e0f2ff", fg: "#06243d", border: "rgba(59,130,246,0.35)", swatch: "#e0f2ff" },
  { key: "mint",    label: "Menthe",   bg: "#e0ffe9", fg: "#063a1a", border: "rgba(34,197,94,0.35)", swatch: "#e0ffe9" },
  { key: "lavender",label: "Lavande",  bg: "#ece0ff", fg: "#1a0a3a", border: "rgba(139,92,246,0.35)", swatch: "#ece0ff" },
  { key: "fluo-pink",  label: "Fluo Rose",  bg: "#ff00d4", fg: "#ffffff", border: "rgba(255,0,212,0.7)", swatch: "#ff00d4" },
  { key: "fluo-cyan",  label: "Fluo Cyan",  bg: "#00ffff", fg: "#001a1a", border: "rgba(0,255,255,0.7)", swatch: "#00ffff" },
  { key: "fluo-green", label: "Fluo Vert",  bg: "#39ff14", fg: "#001a00", border: "rgba(57,255,20,0.7)", swatch: "#39ff14" },
  { key: "fluo-yellow",label: "Fluo Jaune", bg: "#ffff33", fg: "#1a1a00", border: "rgba(255,255,51,0.7)", swatch: "#ffff33" },
  {
    key: "holo",
    label: "Holo",
    bg: "linear-gradient(135deg,#ff71ce,#01cdfe,#05ffa1,#b967ff,#ff71ce)",
    fg: "#0a0a0a",
    border: "rgba(255,255,255,0.5)",
    swatch: "linear-gradient(135deg,#ff71ce,#01cdfe,#05ffa1,#b967ff)",
  },
  {
    key: "gold",
    label: "Or",
    bg: "linear-gradient(135deg,#fde68a,#f59e0b,#fde68a)",
    fg: "#2a1a00",
    border: "rgba(245,158,11,0.6)",
    swatch: "linear-gradient(135deg,#fde68a,#f59e0b)",
  },
  {
    key: "rgb",
    label: "RGB",
    bg: "linear-gradient(135deg,#ff0080,#7928ca,#0070f3,#00d4ff,#39ff14,#ffd700,#ff0080)",
    fg: "#ffffff",
    border: "rgba(255,255,255,0.5)",
    swatch: "conic-gradient(from 0deg,#ff0080,#7928ca,#0070f3,#00d4ff,#39ff14,#ffd700,#ff0080)",
  },
];

const STORAGE = "lovanet:card-skin";
const POSITION_STORAGE = "lovanet:card-skin-position";

const apply = (s: Skin) => {
  const r = document.documentElement.style;
  r.setProperty("--card-skin-bg", s.bg);
  r.setProperty("--card-skin-fg", s.fg);
  r.setProperty("--card-skin-border", s.border);
};

export const CardSkinBubble = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("white");
  const [panelPos, setPanelPos] = useState({ x: 12, y: 80 });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE) ?? "white";
    const s = SKINS.find((x) => x.key === saved) ?? SKINS[0];
    apply(s);
    setActive(s.key);

    const savedPos = localStorage.getItem(POSITION_STORAGE);
    if (savedPos) {
      try {
        const p = JSON.parse(savedPos) as { x?: number; y?: number };
        if (typeof p.x === "number" && typeof p.y === "number") {
          setPanelPos({ x: p.x, y: p.y });
          return;
        }
      } catch { /* ignore */ }
    }
    // Default: upper-right, clear of the bottom-left settings panel
    setPanelPos({ x: Math.max(8, window.innerWidth - 310), y: Math.max(8, Math.round(window.innerHeight * 0.12)) });
  }, []);

  const pick = (s: Skin) => {
    apply(s);
    localStorage.setItem(STORAGE, s.key);
    setActive(s.key);
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest("button")) return;
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    isDraggingRef.current = true;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !dragOffsetRef.current || !panelRef.current) return;
    const m = 8;
    const nx = Math.min(Math.max(e.clientX - dragOffsetRef.current.x, m), window.innerWidth - panelRef.current.offsetWidth - m);
    const ny = Math.min(Math.max(e.clientY - dragOffsetRef.current.y, m), window.innerHeight - panelRef.current.offsetHeight - m);
    setPanelPos({ x: nx, y: ny });
    localStorage.setItem(POSITION_STORAGE, JSON.stringify({ x: nx, y: ny }));
  };

  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.currentTarget as HTMLDivElement).hasPointerCapture(e.pointerId))
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    isDraggingRef.current = false;
    dragOffsetRef.current = null;
  };

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          className="fixed z-[9980] touch-none rounded-2xl border border-white/40 bg-white/20 p-3 text-white shadow-[0_20px_56px_rgba(0,0,0,0.3)] backdrop-blur-2xl w-[min(90vw,290px)]"
          style={{ left: `${panelPos.x}px`, top: `${panelPos.y}px` }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <div className="mb-2 flex cursor-grab select-none items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.25em] text-white/70">
              <Move className="h-3.5 w-3.5" />
              Apparence des cartes
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le panneau apparence des cartes"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white/90 transition-colors hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-6">
            {SKINS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => pick(s)}
                title={s.label}
                aria-label={s.label}
                className={`relative h-10 w-10 rounded-full border border-white/35 transition-transform hover:scale-110 sm:h-9 sm:w-9 ${
                  active === s.key ? "ring-2 ring-white ring-offset-2 ring-offset-transparent" : ""
                }`}
                style={{ background: s.swatch }}
              />
            ))}
          </div>
          <p className="mt-2 px-1 text-[10px] text-white/60">
            {SKINS.find((s) => s.key === active)?.label}
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Apparence des cartes"
        className="fixed bottom-5 left-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/90 shadow-[0_10px_30px_hsl(var(--primary)/0.45)] backdrop-blur-xl transition-all hover:scale-110 sm:left-5"
      >
        {open ? <X className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
      </button>
    </>
  );
};

export default CardSkinBubble;