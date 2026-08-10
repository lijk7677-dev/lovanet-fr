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
const TEXT_STORAGE = "lovanet:preview-text-color";

/** 50 couleurs applicables au texte sous les cartes de preview. */
const TEXT_COLORS: { key: string; label: string; value: string }[] = [
  { key: "white", label: "Blanc fort", value: "#ffffff" },
  { key: "snow", label: "Neige", value: "#f8fafc" },
  { key: "silver", label: "Argent", value: "#e2e8f0" },
  { key: "platinum", label: "Platine", value: "#cbd5e1" },
  { key: "ivory", label: "Ivoire", value: "#fffbe6" },
  { key: "cream", label: "Crème", value: "#f5e6c8" },
  { key: "sand", label: "Sable", value: "#eadfc0" },
  { key: "gold", label: "Or", value: "#ffd700" },
  { key: "amber", label: "Ambre", value: "#fbbf24" },
  { key: "orange", label: "Orange", value: "#fb923c" },
  { key: "tangerine", label: "Mandarine", value: "#ff6700" },
  { key: "coral", label: "Corail", value: "#ff7f6b" },
  { key: "salmon", label: "Saumon", value: "#fda4af" },
  { key: "red", label: "Rouge", value: "#ef4444" },
  { key: "crimson", label: "Cramoisi", value: "#dc2626" },
  { key: "neonred", label: "Rouge néon", value: "#ff073a" },
  { key: "pink", label: "Rose", value: "#f472b6" },
  { key: "hotpink", label: "Rose vif", value: "#ff2d95" },
  { key: "fuchsia", label: "Fuchsia", value: "#ff00d4" },
  { key: "magenta", label: "Magenta", value: "#ff00ff" },
  { key: "orchid", label: "Orchidée", value: "#da70d6" },
  { key: "purple", label: "Violet", value: "#a855f7" },
  { key: "neonpurple", label: "Violet néon", value: "#bf00ff" },
  { key: "lavender", label: "Lavande", value: "#c4b5fd" },
  { key: "indigo", label: "Indigo", value: "#818cf8" },
  { key: "violetdeep", label: "Violet profond", value: "#7c3aed" },
  { key: "blue", label: "Bleu", value: "#3b82f6" },
  { key: "royal", label: "Bleu roi", value: "#2563eb" },
  { key: "sky", label: "Ciel", value: "#38bdf8" },
  { key: "azure", label: "Azur", value: "#7dd3fc" },
  { key: "cyan", label: "Cyan", value: "#00ffff" },
  { key: "teal", label: "Sarcelle", value: "#14b8a6" },
  { key: "turquoise", label: "Turquoise", value: "#40e0d0" },
  { key: "aqua", label: "Aqua", value: "#7df9ff" },
  { key: "mint", label: "Menthe", value: "#00ff9f" },
  { key: "emerald", label: "Émeraude", value: "#10b981" },
  { key: "green", label: "Vert", value: "#22c55e" },
  { key: "neongreen", label: "Vert néon", value: "#39ff14" },
  { key: "lime", label: "Lime", value: "#ccff00" },
  { key: "olive", label: "Olive", value: "#a3b18a" },
  { key: "yellow", label: "Jaune", value: "#facc15" },
  { key: "neonyellow", label: "Jaune néon", value: "#ffff33" },
  { key: "peach", label: "Pêche", value: "#ffd9c0" },
  { key: "rose-gold", label: "Or rose", value: "#f7cac9" },
  { key: "beige", label: "Beige", value: "#d8c3a5" },
  { key: "slate", label: "Ardoise", value: "#94a3b8" },
  { key: "steel", label: "Acier", value: "#7dd3c0" },
  { key: "graphite", label: "Graphite", value: "#4b5563" },
  { key: "ink", label: "Encre", value: "#1f2937" },
  { key: "black", label: "Noir", value: "#0a0a0a" },
];

const apply = (s: Skin) => {
  const r = document.documentElement.style;
  r.setProperty("--card-skin-bg", s.bg);
  r.setProperty("--card-skin-fg", s.fg);
  r.setProperty("--card-skin-border", s.border);
};

const applyTextColor = (value: string) => {
  document.documentElement.style.setProperty("--preview-text-color", value);
};

export const CardSkinBubble = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("white");
  const [textColor, setTextColor] = useState<string>("#ffffff");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE) ?? "white";
    const s = SKINS.find((x) => x.key === saved) ?? SKINS[0];
    apply(s);
    setActive(s.key);
    const savedText = localStorage.getItem(TEXT_STORAGE) ?? "#ffffff";
    applyTextColor(savedText);
    setTextColor(savedText);
  }, []);

  const pick = (s: Skin) => {
    apply(s);
    localStorage.setItem(STORAGE, s.key);
    setActive(s.key);
  };

  const pickText = (value: string) => {
    applyTextColor(value);
    localStorage.setItem(TEXT_STORAGE, value);
    setTextColor(value);
  };

  return (
    <div className="relative flex items-center">
      {open && (
        <div className="absolute bottom-full left-0 mb-3 z-[10000] rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-3 shadow-2xl animate-scale-in w-[280px] max-h-[60vh] overflow-y-auto">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2 px-1">
            Apparence des cartes
          </p>
          <div className="grid grid-cols-6 gap-2">
            {SKINS.map((s) => (
              <button
                key={s.key}
                onClick={() => pick(s)}
                title={s.label}
                aria-label={s.label}
                className={`relative w-9 h-9 rounded-full border border-border/60 transition-transform hover:scale-110 ${
                  active === s.key ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""
                }`}
                style={{ background: s.swatch }}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 px-1">
            {SKINS.find((s) => s.key === active)?.label}
          </p>

          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-4 mb-2 px-1">
            Couleur du texte (50)
          </p>
          <div className="grid grid-cols-8 gap-1.5">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.key}
                onClick={() => pickText(c.value)}
                title={c.label}
                aria-label={c.label}
                className={`w-6 h-6 rounded-full border border-border/60 transition-transform hover:scale-110 ${
                  textColor.toLowerCase() === c.value.toLowerCase()
                    ? "ring-2 ring-primary ring-offset-1 ring-offset-card"
                    : ""
                }`}
                style={{ background: c.value }}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 px-1">
            Texte : {TEXT_COLORS.find((c) => c.value.toLowerCase() === textColor.toLowerCase())?.label ?? "Personnalisé"}
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