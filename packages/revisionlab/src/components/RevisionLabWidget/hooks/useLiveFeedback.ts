import { useState } from "react";
import type { RevisionLabElementAnchor } from "../../../server/types.js";

export function useLiveFeedback(route: string, showByDefault: boolean) {
  const [context, setContext] = useState(route);
  const [picking, setPicking] = useState(false);
  const [anchor, setAnchor] = useState<RevisionLabElementAnchor | null>(null);
  const [commenting, setCommenting] = useState(false);
  const [showBalloons, setShowBalloons] = useState<boolean | null>(null);
  if (context !== route) {
    setContext(route);
    setPicking(false);
    setCommenting(false);
    setAnchor(null);
    setShowBalloons(null);
  }
  return {
    picking,
    setPicking,
    anchor,
    setAnchor,
    commenting,
    setCommenting,
    showBalloons: showBalloons ?? showByDefault,
    setShowBalloons,
  };
}
