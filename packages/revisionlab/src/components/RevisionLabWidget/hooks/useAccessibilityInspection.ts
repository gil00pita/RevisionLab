import { useEffect, useState } from "react";
import {
  inspectableElement,
  visibleBounds,
  type AccessibilityTarget,
} from "../accessibility-targets.js";
import type { AccessibilityFinding } from "./usePageAccessibility.js";

export function useAccessibilityInspection(issues: AccessibilityFinding[]) {
  const [selected, setSelected] = useState<AccessibilityTarget | null>(null);
  const [, refresh] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => refresh((value) => value + 1));
    };
    const timer = setInterval(update, 250);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      clearInterval(timer);
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, []);

  const groups = new Map<HTMLElement, AccessibilityTarget[]>();
  for (const issue of issues) {
    issue.targets.forEach((_, index) => {
      const target = { issue, index };
      const element = inspectableElement(target);
      if (!element) return;
      groups.set(element, [...(groups.get(element) ?? []), target]);
    });
  }
  const markers = [...groups].flatMap(([element, targets]) => {
    const bounds = visibleBounds(element);
    return bounds ? [{ targets, bounds }] : [];
  });
  const active =
    selected && issues.includes(selected.issue) && inspectableElement(selected)
      ? selected
      : null;
  const element = active ? inspectableElement(active) : null;
  const highlight = element ? visibleBounds(element) : null;
  function select(target: AccessibilityTarget) {
    const element = inspectableElement(target);
    if (!element) return;
    setSelected(target);
    // Instant scrolling also respects reduced motion and reveals nested scrollers.
    element.scrollIntoView({
      behavior: "instant",
      block: "center",
      inline: "nearest",
    });
  }
  return { active, highlight, markers, select, clear: () => setSelected(null) };
}
