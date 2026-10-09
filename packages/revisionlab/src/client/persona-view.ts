import { useState, useSyncExternalStore } from "react";
export type PersonaView = "cards" | "list";
const preferenceKey = "revisionlab-persona-view";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(preferenceKey, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(preferenceKey, callback);
  };
}
function savedView(): PersonaView {
  try {
    return localStorage.getItem(preferenceKey) === "list" ? "list" : "cards";
  } catch {
    return "cards";
  }
}
export function usePersonaView() {
  const stored = useSyncExternalStore(
    subscribe,
    savedView,
    (): PersonaView => "cards",
  );
  const [temporary, setTemporary] = useState<PersonaView | null>(null);
  function changeView(view: PersonaView) {
    try {
      localStorage.setItem(preferenceKey, view);
      window.dispatchEvent(new Event(preferenceKey));
    } catch {
      setTemporary(view);
    }
  }
  return { view: temporary ?? stored, changeView };
}
