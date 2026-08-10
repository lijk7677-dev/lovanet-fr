/**
 * Verrou global de lecture de trailer.
 * Tant qu'au moins un lecteur est en lecture "declenchee par l'utilisateur"
 * (typiquement un tap sur mobile), toute rotation automatique de selection
 * doit etre mise en pause totale.
 */
import { useEffect, useState } from "react";

let count = 0;
const listeners = new Set<(locked: boolean) => void>();

const emit = () => {
  const locked = count > 0;
  listeners.forEach((l) => l(locked));
};

export const acquireTrailerLock = () => {
  count += 1;
  emit();
};

export const releaseTrailerLock = () => {
  count = Math.max(0, count - 1);
  emit();
};

export const isTrailerLocked = () => count > 0;

export const useTrailerPlaybackLock = () => {
  const [locked, setLocked] = useState(isTrailerLocked());
  useEffect(() => {
    const l = (v: boolean) => setLocked(v);
    listeners.add(l);
    setLocked(isTrailerLocked());
    return () => {
      listeners.delete(l);
    };
  }, []);
  return locked;
};
