import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

type QuickNavItem = {
  id: string;
  title: string;
  to: string;
  color?: string;
  subtitle?: string;
};

const DEFAULT_ITEMS: QuickNavItem[] = [
  { id: "home", title: "Portail", to: "/anime-moments", color: "linear-gradient(45deg, #22d3ee, #6366f1)", subtitle: "Accueil" },
  { id: "catalog", title: "Catalogue", to: "/anime-catalog", color: "linear-gradient(45deg, #fbbf24, #ef4444)", subtitle: "Trailers & fiches" },
  { id: "youtube", title: "YouTube", to: "/chaine-youtube", color: "linear-gradient(45deg, #4ade80, #059669)", subtitle: "Chaîne officielle" },
  { id: "shop", title: "Boutique", to: "/shop", color: "linear-gradient(45deg, #f472b6, #9333ea)", subtitle: "Produits" },
  { id: "tiktok", title: "TikTok", to: "/tiktok", color: "linear-gradient(45deg, #38bdf8, #2563eb)", subtitle: "Clips viraux" },
  { id: "leader", title: "Classement", to: "/leaderboard", color: "linear-gradient(45deg, #e879f9, #e11d48)", subtitle: "Top" },
];

export default function QuickNavCarousel({ items = DEFAULT_ITEMS, onClose }: { items?: QuickNavItem[]; onClose?: () => void }) {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const initialScroll = useRef(0);
  const [, redraw] = useState(0);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleDown = (event: MouseEvent | TouchEvent) => {
      dragging.current = true;
      startX.current = "touches" in event ? event.touches[0].pageX : event.pageX;
      initialScroll.current = carousel.scrollLeft;
      carousel.classList.add("cursor-grabbing");
    };
    const handleMove = (event: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const x = "touches" in event ? event.touches[0].pageX : event.pageX;
      carousel.scrollLeft = initialScroll.current - (x - startX.current);
      redraw((value) => value + 1);
    };
    const handleUp = () => {
      dragging.current = false;
      carousel.classList.remove("cursor-grabbing");
    };

    carousel.addEventListener("mousedown", handleDown);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    carousel.addEventListener("touchstart", handleDown, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleUp);
    return () => {
      carousel.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      carousel.removeEventListener("touchstart", handleDown);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, []);

  return (
    <div className="w-full py-6">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Navigation rapide</h3>
          <button type="button" onClick={onClose} aria-label="Fermer la navigation rapide" className="rounded-full bg-white/5 p-2 text-sm text-white/90 hover:bg-white/10">
            Fermer
          </button>
        </div>
        <div ref={carouselRef} className="no-scrollbar relative flex gap-4 overflow-x-auto px-2 py-4 will-change-transform" aria-label="Carrousel de navigation rapide">
          {items.map((item) => (
            <Link key={item.id} to={item.to} onClick={onClose} className="relative h-40 w-56 flex-shrink-0 overflow-hidden rounded-2xl p-4 text-white ring-1 ring-white/10 transition-transform duration-300 hover:scale-105 focus:scale-105" aria-label={item.title}>
              <div className="absolute inset-0 rounded-2xl backdrop-blur-md" style={{ background: "var(--nav-card-overlay, linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0.06)))" }} />
              <div className="relative flex h-full w-full flex-col justify-between rounded-xl p-3">
                <div className="z-10 text-sm font-semibold opacity-90">{item.subtitle}</div>
                <div className="z-10 mt-2 text-xl font-extrabold">{item.title}</div>
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: item.color }} />
                <div className="absolute bottom-3 left-3 z-10 text-xs text-white/90">Aller →</div>
                <div className="absolute bottom-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-md bg-white/5">
                  <svg className="h-6 w-6 animate-spin text-white/80 [animation-duration:4s]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="8" strokeOpacity="0.2" />
                    <path d="M12 4v4" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}