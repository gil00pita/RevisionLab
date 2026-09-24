import type { RevisionLabElementAnchor } from "../server/types.js";

const excluded =
  '[data-revisionlab-ui], [data-revisionlab-private], input[type="password"], input[autocomplete="one-time-code"], [contenteditable]:not([contenteditable="false"]), nextjs-portal, script, style, iframe, canvas';
export const elementCandidates =
  'a, button, input, select, textarea, label, h1, h2, h3, h4, h5, h6, p, img, li, [role="button"], [data-testid], [data-revisionlab-anchor]';

export function eligibleElement(element: Element): boolean {
  if (
    !element.isConnected ||
    element.closest(excluded) ||
    element === document.body ||
    element === document.documentElement
  )
    return false;
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== "hidden" &&
    style.display !== "none"
  );
}

function elementLabel(element: Element): string {
  const explicit =
    element.getAttribute("aria-label") || element.getAttribute("alt");
  if (explicit)
    return (
      explicit.replace(/\s+/g, " ").trim().slice(0, 160) || element.localName
    );
  // Read text nodes only: never input values, private descendants, or embedded review UI.
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest(`${excluded}, input, textarea, select`)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  let text = "";
  while (text.length < 160 && walker.nextNode())
    text += ` ${walker.currentNode.textContent ?? ""}`;
  return text.replace(/\s+/g, " ").trim().slice(0, 160) || element.localName;
}

export function createElementAnchor(
  element: Element,
): RevisionLabElementAnchor | null {
  if (!eligibleElement(element)) return null;
  const path: string[] = [];
  for (
    let current: Element | null = element;
    current && current !== document.body;
    current = current.parentElement
  ) {
    let stable = "";
    for (const attribute of ["data-revisionlab-anchor", "id", "data-testid"]) {
      const value = current.getAttribute(attribute);
      if (!value) continue;
      const selector = `[${attribute}=${CSS.escape(value)}]`;
      if (document.querySelectorAll(selector).length === 1) {
        stable = selector;
        break;
      }
    }
    if (stable) {
      path.unshift(stable);
      break;
    }
    const siblings = current.parentElement
      ? [...current.parentElement.children].filter(
          (sibling) => sibling.localName === current!.localName,
        )
      : [current];
    path.unshift(
      `${CSS.escape(current.localName)}:nth-of-type(${siblings.indexOf(current) + 1})`,
    );
  }
  const selector = path.join(" > ");
  if (!selector || selector.length > 2000) return null;
  const anchor = {
    selector,
    tag: element.localName,
    label: elementLabel(element),
  };
  return resolveElementAnchor(anchor) === element ? anchor : null;
}

export function resolveElementAnchor(
  anchor: RevisionLabElementAnchor,
): Element | null {
  try {
    const matches = document.querySelectorAll(anchor.selector);
    if (matches.length !== 1) return null;
    const element = matches[0];
    return eligibleElement(element) &&
      element.localName === anchor.tag &&
      elementLabel(element) === anchor.label
      ? element
      : null;
  } catch {
    return null;
  }
}

export function pickElement(target: EventTarget | null): Element | null {
  if (!(target instanceof Element) || target.closest(excluded)) return null;
  const element = target.closest('button, a, label, [role="button"]') ?? target;
  return eligibleElement(element) ? element : null;
}
