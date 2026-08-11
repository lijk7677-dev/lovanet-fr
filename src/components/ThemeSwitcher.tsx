import { useState, useEffect, useRef } from "react";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type ThemeDef = {
  id: string;
  label: string;
  bg: string;
  preview: [string, string, string];
  auto?: boolean;
};

const THEMES: ThemeDef[] = [
  { id: "menthe-vibrant-cypher", label: "Menthe Vibrant Cypher", bg: "#06120d", preview: ["#00ff9d", "#22d3ee", "#10b981"] },
  { id: "default-blue", label: "Anime Moments", bg: "#020617", preview: ["#38bdf8", "#f472b6", "#8b5cf6"] },
  { id: "cyberpunk", label: "Cyberpunk", bg: "#09090b", preview: ["#22c55e", "#facc15", "#ef4444"] },
  { id: "kawaii", label: "Kawaii Pink", bg: "#fff0f5", preview: ["#ff69b4", "#ff1493", "#ba55d3"] },
  { id: "samurai", label: "Samurai Red", bg: "#1a0f14", preview: ["#dc2626", "#b91c1c", "#eab308"] },
  { id: "aurora", label: "Aurora N\u00e9on", bg: "#071a1c", preview: ["#2dd4bf", "#22d3ee", "#818cf8"] },
  { id: "auto", label: "Auto Jour / Nuit", bg: "#0a1020", preview: ["#fcd34d", "#38bdf8", "#0f172a"], auto: true },
];

const REAL_THEME_IDS = ["dark", "cyberpunk", "kawaii", "samurai", "aurora", "menthe-vibrant-cypher"];

function isDaytime(): boolean {
  const h = new Date().getHours();
  return h >= 7 && h < 19;
}

function resolveEffective(id: string): string {
  if (id === "auto") return isDaytime() ? "aurora" : "dark";
  return id;
}

let currentEffective = "dark";

function applyClasses(effectiveId: string) {
  const root = document.documentElement;
  REAL_THEME_IDS.forEach((id) => root.classList.remove(`theme-${id}`));
  if (effectiveId !== "dark") root.classList.add(`theme-${effectiveId}`);
}

// Douce transition crossfade lors d'un changement de th\u00e8me (ou bascule jour/nuit).
function withThemeTransition(apply: () => void, fromBg: string) {
  if (typeof document === "undefined") {
    apply();
    return;
  }
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    apply();
    return;
  }
  let veil = document.getElementById("fx-theme-veil") as HTMLDivElement | null;
  if (!veil) {
    veil = document.createElement("div");
    veil.id = "fx-theme-veil";
    veil.className = "fx-theme-veil";
    document.body.appendChild(veil);
  }
  veil.style.background = fromBg;
  veil.style.transition = "none";
  veil.style.opacity = "0.85";
  void veil.offsetWidth; // reflow
  apply();
  requestAnimationFrame(() => {
    if (!veil) return;
    veil.style.transition = "opacity 0.7s ease";
    veil.style.opacity = "0";
  });
}

function setEffective(effectiveId: string, animate: boolean) {
  if (effectiveId === currentEffective) return;
  const fromBg = THEMES.find((t) => t.id === currentEffective)?.bg || "#0a1020";
  const doApply = () => {
    applyClasses(effectiveId);
    currentEffective = effectiveId;
  };
  if (animate) withThemeTransition(doApply, fromBg);
  else doApply();
}

export function ThemeSwitcher({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState("menthe-vibrant-cypher");
  const [hovered, setHovered] = useState<ThemeDef | null>(null);
  const autoTimer = useRef<number | null>(null);

  const selectTheme = (id: string) => {
    localStorage.setItem("lovanet.theme", id);
    setActiveTheme(id);
    setEffective(resolveEffective(id), true);
  };

  useEffect(() => {
    // Défaut Menthe Vibrant Cypher ; respecte la préférence sauvegardée si elle existe.
    const saved = localStorage.getItem("lovanet.theme") || "menthe-vibrant-cypher";
    setActiveTheme(saved);
    currentEffective = "__init__"; // force premi\u00e8re application (sans animation)
    setEffective(resolveEffective(saved), false);
  }, []);

  useEffect(() => {
    if (autoTimer.current) {
      window.clearInterval(autoTimer.current);
      autoTimer.current = null;
    }
    if (activeTheme === "auto") {
      autoTimer.current = window.setInterval(() => {
        setEffective(resolveEffective("auto"), true);
      }, 60 * 1000);
    }
    return () => {
      if (autoTimer.current) window.clearInterval(autoTimer.current);
    };
  }, [activeTheme]);

  // Aper\u00e7u : pour \"auto\", montre l'ambiance r\u00e9elle du moment.
  const previewTheme: ThemeDef | null = hovered
    ? hovered.id === "auto"
      ? {
          ...hovered,
          bg: isDaytime() ? "#071a1c" : "#0a1020",
          preview: (isDaytime()
            ? ["#2dd4bf", "#22d3ee", "#818cf8"]
            : ["#38bdf8", "#f472b6", "#8b5cf6"]) as [string, string, string],
        }
      : hovered
    : null;
  const light = previewTheme?.id === "kawaii";

  return (
    <div className={cn("relative z-50", className)}>
      <motion.button
        whileHover={{ scale: 1.1, rotateY: 15, rotateX: -15, z: 10 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl border-2 transition-all duration-300 transform-style-3d shadow-xl relative overflow-hidden",
          open 
            ? "border-[var(--nav-theme-accent)] bg-black/60 shadow-[0_0_20px_var(--nav-theme-accent)]" 
            : "border-white/10 bg-black/40 hover:border-white/30 hover:bg-white/10"
        )}
        style={{
          boxShadow: open ? "0 10px 25px -5px var(--nav-theme-accent)" : "0 10px 25px -5px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1)"
        }}
        aria-label="Changer le thème"
        data-testid="theme-switcher-button"
      >
        <motion.div
           animate={{
              rotateZ: open ? 180 : 0,
              color: open ? "var(--nav-theme-accent)" : "#ffffff",
              filter: open ? "drop-shadow(0 0 8px var(--nav-theme-accent))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
           }}
           transition={{ duration: 0.4 }}
           className="relative z-10"
        >
          <Palette className="h-5 w-5" strokeWidth={2.5} />
        </motion.div>
        
        {/* Lueur 3D interne au hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-0 hover:opacity-100 transition-opacity" />
      </motion.button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-white/10 bg-black/90 p-2 shadow-xl backdrop-blur-xl"
          onMouseLeave={() => setHovered(null)}
        >
          {/* Mini aper\u00e7u live du site */}
          {previewTheme && (
            <div
              className="pointer-events-none absolute right-full top-0 mr-3 hidden w-52 rounded-xl border border-white/15 p-3 shadow-2xl backdrop-blur-xl sm:block"
              style={{ background: previewTheme.bg }}
              data-testid="theme-preview-panel"
            >
              <div
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5"
                style={{ background: light ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.07)" }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: previewTheme.preview[0] }} />
                <span
                  className="h-1.5 flex-1 rounded"
                  style={{ background: light ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.16)" }}
                />
                <span className="h-1.5 w-4 rounded" style={{ background: previewTheme.preview[1] }} />
              </div>
              <div
                className="mt-2 h-10 rounded-md"
                style={{
                  background: `linear-gradient(135deg, ${previewTheme.preview[0]}, ${previewTheme.preview[1]} 55%, ${previewTheme.preview[2]})`,
                }}
              />
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <div
                  className="h-7 rounded-md"
                  style={{
                    background: light ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${previewTheme.preview[2]}55`,
                  }}
                />
                <div
                  className="h-7 rounded-md"
                  style={{
                    background: light ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${previewTheme.preview[0]}55`,
                  }}
                />
              </div>
              <div
                className="mt-2 text-center text-[9px]"
                style={{ color: light ? "#7a2c4d" : "rgba(255,255,255,0.6)" }}
              >
                Aper\u00e7u live \u00b7 {previewTheme.label}
              </div>
            </div>
          )}

          {THEMES.map((t) => {
            const active = activeTheme === t.id;
            return (
              <button
                key={t.id}
                onMouseEnter={() => setHovered(t)}
                onFocus={() => setHovered(t)}
                onClick={() => {
                  selectTheme(t.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sky-500/20 text-sky-300"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
                data-testid={`theme-option-${t.id}`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full ring-1 ring-white/25 shadow-[0_0_8px_rgba(255,255,255,0.18)]"
                    style={{
                      background: `linear-gradient(135deg, ${t.preview[0]} 0%, ${t.preview[1]} 50%, ${t.preview[2]} 100%)`,
                    }}
                    aria-hidden="true"
                  />
                  <span className="flex flex-col items-start leading-tight">
                    <span>{t.label}</span>
                    {t.auto && (
                      <span className="text-[10px] text-white/40">
                        {isDaytime() ? "Jour \u00b7 Aurora" : "Nuit \u00b7 Deep Space"}
                      </span>
                    )}
                  </span>
                </span>
                {active && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
