import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useGamification } from "@/contexts/GamificationContext";

export const CartDrawer = () => {
  const { items, open, setOpen, remove, setQty, clear, total, count } = useCart();
  const { incrementEpic } = useGamification();
  
  const handleCheckout = () => {
    if (!items.length) return;
    incrementEpic("epic_shop_purchase", 1);
    incrementEpic("epic_shop_vip", 1);
    incrementEpic("epic_shop_whale", Math.round(total));
    clear();
    toast({ title: "Commande validée !", description: `Vos ${count} article(s) sont en cours de préparation.` });
    setOpen(false);
  };
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="mnav-shell !inset-y-auto !bottom-4 !right-3 !top-auto !h-auto !w-[min(88vw,300px)] !max-h-[58vh] flex flex-col gap-0 rounded-2xl border border-white/15 bg-transparent p-3 shadow-2xl backdrop-blur-xl sm:!max-w-none"
      >
        <SheetHeader className="space-y-0">
          <SheetTitle className="mnav-text flex items-center gap-2 font-display text-sm">
            <ShoppingBag className="w-4 h-4 text-primary" />
            Panier · {count} article{count > 1 ? "s" : ""}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-2 space-y-2">
          {items.length === 0 && <p className="mnav-text text-xs opacity-70 py-6 text-center">Votre panier est vide.</p>}
          {items.map((i) => (
            <div key={i.id} className="mnav-section flex items-start gap-2 rounded-lg border border-white/10 p-2">
              <div className="flex-1 min-w-0">
                <p className="mnav-text font-medium text-xs leading-snug line-clamp-2">{i.name}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button onClick={() => setQty(i.id, i.qty - 1)} className="mnav-text w-6 h-6 rounded-md border border-white/20 grid place-items-center" aria-label="Diminuer"><Minus className="w-3 h-3" /></button>
                  <span className="mnav-text text-xs font-semibold min-w-[1.25rem] text-center">{i.qty}</span>
                  <button onClick={() => setQty(i.id, i.qty + 1)} className="mnav-text w-6 h-6 rounded-md border border-white/20 grid place-items-center" aria-label="Augmenter"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
              <div className="text-right">
                <p className="mnav-text font-display font-bold text-xs">{(i.qty * i.price).toFixed(2)} €</p>
                <button onClick={() => remove(i.id)} className="mnav-text mt-1.5 opacity-70 hover:text-destructive" aria-label="Retirer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/15 pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="mnav-text text-xs opacity-80">Total</span>
            <span className="font-display text-lg font-extrabold gradient-text">{total.toFixed(2)} €</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={clear} disabled={!items.length}>Vider</Button>
            <Button size="sm" className="flex-1" disabled={!items.length} onClick={handleCheckout}>
              Commander
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
