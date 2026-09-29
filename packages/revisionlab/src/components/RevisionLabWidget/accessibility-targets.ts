import type { AccessibilityFinding } from "./hooks/usePageAccessibility.js";

export interface AccessibilityTarget {
  issue: AccessibilityFinding;
  index: number;
}

function parentElement(element: Element): Element | null {
  const root = element.getRootNode();
  return element.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
}

export function inspectableElement(target: AccessibilityTarget) {
  const element = target.issue.targets[target.index]?.element;
  if (!element?.isConnected || element.ownerDocument !== document) return null;
  let ancestor: Element | null = element;
  while (ancestor) {
    if (
      ancestor.matches(
        '[data-revisionlab-ui], [data-revisionlab-private], nextjs-portal, input[type="password"], [autocomplete="one-time-code"]',
      )
    )
      return null;
    ancestor = parentElement(ancestor);
  }
  if (
    !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
  )
    return null;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? element : null;
}

export function visibleBounds(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  let left = Math.max(0, rect.left);
  let top = Math.max(0, rect.top);
  let right = Math.min(window.innerWidth, rect.right);
  let bottom = Math.min(window.innerHeight, rect.bottom);
  let ancestor = parentElement(element);
  while (ancestor) {
    const css = getComputedStyle(ancestor);
    const clip = ancestor.getBoundingClientRect();
    if (/(auto|scroll|hidden|clip)/.test(css.overflowX)) {
      left = Math.max(left, clip.left);
      right = Math.min(right, clip.right);
    }
    if (/(auto|scroll|hidden|clip)/.test(css.overflowY)) {
      top = Math.max(top, clip.top);
      bottom = Math.min(bottom, clip.bottom);
    }
    ancestor = parentElement(ancestor);
  }
  return right > left && bottom > top
    ? { x: left, y: top, width: right - left, height: bottom - top }
    : null;
}
