import { useState } from "react";
import type { RevisionLabElementAnchor } from "../../../server/types.js";

export function useLiveFeedback(route: string) {
  const [context, setContext] = useState(route);
  const [picking, setPicking] = useState(false);
  const [anchor, setAnchor] = useState<RevisionLabElementAnchor | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showPins, setShowPins] = useState(true);
  if (context !== route) {
    setContext(route);
    setPicking(false);
    setAnchor(null);
    setSelected(null);
  }
  return {
    picking,
    setPicking,
    anchor,
    setAnchor,
    selected,
    setSelected,
    showPins,
    setShowPins,
  };
}
