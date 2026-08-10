import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, GripVertical, Maximize2, ShoppingCart, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type MiniItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
export type MiniGroup = { id: string; label: string; items: MiniItem[] };

const POS_KEY = "lovanet.mnav.mini.pos";
const RETRACT_KEY = "lovanet.mnav.mini.retracted";

type Props = {
  items: MiniItem[];
  groups?: MiniGroup[];
  cartCount?: number;
  onOpenCart?: () => void;
  onExpand: () => void;
  onClose: () => void;
};

export const MobileMenuMiniWindow = ({ items, groups, cartCount = 0, onOpenCart, onExpand, onClose }: Props) => {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* noop */ }
    return { x: 16, y: Math.max(80, window.innerHeight - 200) };
  });
  const [retracted, setRetracted] = useState<boolean>(() => localStorage.getItem(RETRACT_KEY) === "1");
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch { /* noop */ }
  }, [pos]);
  useEffect(() => {
    localStorage.setItem(RETRACT_KEY, retracted ? "1" : "0");
  }, [retracted]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const width = retracted ? 60 : 320;
    const x = Math.min(Math.max(4, e.clientX - dragRef.current.dx), window.innerWidth - width);
    const y = Math.min(Math.max(4, e.clientY - dragRef.current.dy), window.innerHeight - 80);
    setPos({ x, y });
  }, [retracted]);

  const endDrag = useCallback(() => { dragRef.current = null; }, []);

  const scrollBy = (delta: number) => scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });

  return (
    <div
      className="fixed z-[70] select-none"
      style={{ left: pos.x, top: pos.y, touchAction: "none" }}
      data-testid="mobile-menu-mini-window"
    >
      <div className="mnav-shell flex items-stretch gap-1 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl">
        <button
          type="button"
          className="mnav-text flex w-6 cursor-grab items-center justify-center rounded-lg active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          aria-label="Déplacer la fenêtre du menu"
        >
          <GripVertical className="h-4 w-4 opacity-70" />
        </button>

        <button
          type="button"
          onClick={() => setRetracted((v) => !v)}
          className="mnav-section mnav-text flex w-7 items-center justify-center rounded-lg"
          aria-label={retracted ? "Déplier le menu réduit" : "Rétracter le menu réduit"}
        >
          {retracted ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {!retracted && (
          <>
            <button
              type="button"
              onClick={() => scrollBy(-140)}
              className="mnav-section mnav-text hidden w-7 items-center justify-center rounded-lg sm:flex"
              aria-label="Défiler à gauche"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex max-w-[min(72vw,340px)] flex-col gap-1.5">
              {(groups?.length ? groups : [{ id: "all", label: "Menu", items }]).map((group, gi) => (
                <div key={`mini-group-${group.id}`} className="flex flex-col gap-1">
                  {groups?.length ? (
                    <span className="mnav-text px-1 text-[9px] font-black uppercase tracking-widest opacity-70">
                      {group.label}
                    </span>
                  ) : null}
                  <div
                    ref={gi === 0 ? scrollerRef : undefined}
                    className="no-scrollbar flex items-center gap-2 overflow-x-auto px-1"
                    style={{ touchAction: "pan-x" }}
                  >
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={`mini-${group.id}-${item.to}`}
                          to={item.to}
                          className={cn(
                            "mnav-section mnav-text flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold uppercase tracking-wide",
                            "transition-transform hover:scale-105 active:scale-95",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="line-clamp-1">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {onOpenCart && (
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="mnav-section mnav-text mx-1 flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest"
                  aria-label="Ouvrir le panier"
                >
                  <span className="inline-flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Panier</span>
                  <span className="rounded-full bg-amber-400 px-2 text-[10px] font-black text-black">{cartCount}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => scrollBy(140)}
              className="mnav-section mnav-text hidden w-7 items-center justify-center rounded-lg sm:flex"
              aria-label="Défiler à droite"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onExpand}
          className="mnav-section mnav-text flex w-8 items-center justify-center rounded-lg"
          aria-label="Rouvrir le menu complet"
          data-testid="mobile-menu-mini-expand"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mnav-section mnav-text flex w-8 items-center justify-center rounded-lg"
          aria-label="Fermer la fenêtre réduite"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default MobileMenuMiniWindow;
