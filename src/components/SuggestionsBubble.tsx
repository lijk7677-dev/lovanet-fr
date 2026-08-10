import { useEffect, useState } from "react";
import { NavSuggestionsIndicator } from "@/components/NavSuggestionsIndicator";

export const SUGGESTIONS_TOGGLE_EVENT = "lovanet:toggle-suggestions";
export const SUGGESTIONS_STATE_EVENT = "lovanet:suggestions-state";

export function SuggestionsBubble() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const onState = (e: Event) => setIsActive(Boolean((e as CustomEvent).detail?.open));
    window.addEventListener(SUGGESTIONS_STATE_EVENT, onState as EventListener);
    return () => window.removeEventListener(SUGGESTIONS_STATE_EVENT, onState as EventListener);
  }, []);

  return (
    <NavSuggestionsIndicator
      isActive={isActive}
      onClick={() => window.dispatchEvent(new CustomEvent(SUGGESTIONS_TOGGLE_EVENT))}
    />
  );
}

export default SuggestionsBubble;
