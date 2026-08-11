import { useEffect, useState } from "react";
import { Layers, X } from "lucide-react";

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

const apply = (s: Skin) => {
  const r = document.documentElement.style;
  r.setProperty("--card-skin-bg", s.bg);
  r.setProperty("--card-skin-fg", s.fg);
  r.setProperty("--card-skin-border", s.border);
};

export const CardSkinBubble = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("white");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE) ?? "white";
    const s = SKINS.find((x) => x.key === saved) ?? SKINS[0];
    apply(s);
    setActive(s.key);
  }, []);

  const pick = (s: Skin) => {
    apply(s);
    localStorage.setItem(STORAGE, s.key);
    setActive(s.key);
  };

  return (
    <div className="fixed bottom-5 left-4 z-[60] flex flex-col items-start gap-3 sm:left-5">
      {open && (
        <div className="w-[min(90vw,300px)] rounded-2xl border border-white/40 bg-white/20 p-3 text-white shadow-[0_20px_56px_rgba(0,0,0,0.3)] backdrop-blur-2xl animate-scale-in sm:w-[280px]">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2 px-1">
            Apparence des cartes
          </p>
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-6">
            {SKINS.map((s) => (
              <button
                key={s.key}
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
          <p className="text-[10px] text-muted-foreground mt-2 px-1">
            {SKINS.find((s) => s.key === active)?.label}
          </p>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Apparence des cartes"
        className="relative w-12 h-12 rounded-full shadow-[0_10px_30px_hsl(var(--primary)/0.45)] border border-border bg-card/90 backdrop-blur-xl hover:scale-110 transition-all flex items-center justify-center"
      >
        {open ? <X className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default CardSkinBubble;