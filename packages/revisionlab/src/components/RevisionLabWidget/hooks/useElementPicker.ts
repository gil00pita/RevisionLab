import { useCallback, useEffect, useRef, useState } from "react";
import {
  createElementAnchor,
  elementCandidates,
  eligibleElement,
  pickElement,
} from "../../../client/element-anchor.js";
import type { RevisionLabElementAnchor } from "../../../server/types.js";

export function useElementPicker(
  onSelect: (anchor: RevisionLabElementAnchor) => void,
  onCancel: () => void,
) {
  const [target, setTarget] = useState<Element | null>(null);
  const callbacks = useRef({ onSelect, onCancel });
  useEffect(() => {
    callbacks.current = { onSelect, onCancel };
  }, [onSelect, onCancel]);

  const select = useCallback((element: Element | null) => {
    const anchor = element && createElementAnchor(element);
    if (anchor) callbacks.current.onSelect(anchor);
  }, []);

  useEffect(() => {
    const hover = (event: Event) => {
      const element = pickElement(event.target);
      if (element) setTarget(element);
    };
    const block = (event: Event) => {
      if (
        !(event.target instanceof Element) ||
        event.target.closest("[data-revisionlab-ui]")
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.type === "click") select(pickElement(event.target));
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        callbacks.current.onCancel();
      } else if (
        (event.key === "Enter" || event.key === " ") &&
        event.target instanceof Element &&
        !event.target.closest("[data-revisionlab-ui]")
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        select(pickElement(event.target));
      }
    };
    window.addEventListener("pointermove", hover, true);
    window.addEventListener("focusin", hover, true);
    window.addEventListener("keydown", key, true);
    // Capture before delegated host handlers so choosing a control cannot activate it.
    const blockedEvents = [
      "pointerdown",
      "pointerup",
      "mousedown",
      "mouseup",
      "click",
      "dblclick",
      "contextmenu",
    ];
    blockedEvents.forEach((name) => window.addEventListener(name, block, true));
    return () => {
      window.removeEventListener("pointermove", hover, true);
      window.removeEventListener("focusin", hover, true);
      window.removeEventListener("keydown", key, true);
      blockedEvents.forEach((name) =>
        window.removeEventListener(name, block, true),
      );
    };
  }, [select]);

  function move(direction: number) {
    const elements = [...document.querySelectorAll(elementCandidates)].filter(
      eligibleElement,
    );
    if (!elements.length) return;
    const index = target ? elements.indexOf(target) : -1;
    const nextIndex =
      index < 0
        ? direction > 0
          ? 0
          : elements.length - 1
        : (index + direction + elements.length) % elements.length;
    const next = elements[nextIndex];
    next.scrollIntoView({ block: "center", behavior: "instant" });
    setTarget(next);
  }
  return { target, move, confirm: () => select(target) };
}
