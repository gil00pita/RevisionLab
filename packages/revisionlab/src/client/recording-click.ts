import type { RevisionLabClick } from "../server/types.js";
import { createElementAnchor, pickElement } from "./element-anchor.js";
import { captureDimensions } from "./recording.js";

export function recordedClick(
  event: MouseEvent | KeyboardEvent,
): RevisionLabClick | null {
  const element = pickElement(event.target);
  const target = element && createElementAnchor(element);
  if (!element || !target) return null;
  const rect = element.getBoundingClientRect();
  const { width, height } = captureDimensions();
  const keyboard =
    event instanceof KeyboardEvent ||
    (event.type === "click" && event.detail === 0);
  const x =
    (keyboard ? rect.x + rect.width / 2 : (event as MouseEvent).clientX) +
    scrollX;
  const y =
    (keyboard ? rect.y + rect.height / 2 : (event as MouseEvent).clientY) +
    scrollY;
  const left = Math.max(0, rect.left + scrollX),
    top = Math.max(0, rect.top + scrollY);
  const right = Math.min(width, rect.right + scrollX),
    bottom = Math.min(height, rect.bottom + scrollY);
  return {
    target,
    activation: keyboard ? "keyboard" : "pointer",
    point:
      x >= 0 && x <= width && y >= 0 && y <= height
        ? { x: x / width, y: y / height }
        : null,
    bounds:
      right > left && bottom > top
        ? {
            x: left / width,
            y: top / height,
            width: (right - left) / width,
            height: (bottom - top) / height,
          }
        : null,
  };
}
