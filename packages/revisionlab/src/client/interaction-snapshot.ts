import html2canvas from "html2canvas-pro";
import { captureDimensions } from "./recording.js";
import type { RevisionLabClick } from "../server/types.js";

export const captureExcluded =
  '[data-revisionlab-ui], [data-revisionlab-private], nextjs-portal, .html2canvas-container, input[type="password"], input[autocomplete="one-time-code"]';

export interface InteractionSnapshot {
  signature: string;
  width: number;
  height: number;
  title: string;
  interaction?: RevisionLabClick | null;
  image: Promise<{ screenshot: string } | { error: Error }>;
}

/** Compare host content without retaining its text or form values as metadata. */
export function pageContentSignature(): string {
  let hash = 2166136261;
  const add = (value: string) => {
    for (let index = 0; index < value.length; index++)
      hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
    hash = Math.imul(hash ^ 0, 16777619);
  };
  const visit = (node: Node) => {
    if (node instanceof Element) {
      if (node.matches(`${captureExcluded}, script, style, link, noscript`))
        return;
      add(node.tagName);
      for (const attribute of node.attributes) {
        add(attribute.name);
        add(attribute.value);
      }
      const style = getComputedStyle(node);
      add(style.display);
      add(style.visibility);
      if (
        node instanceof HTMLInputElement ||
        node instanceof HTMLTextAreaElement ||
        node instanceof HTMLSelectElement
      )
        add(node.value);
      if (node instanceof HTMLInputElement) add(String(node.checked));
      for (const child of node.childNodes) visit(child);
      add("/");
    } else if (node.nodeType === Node.TEXT_NODE) add(node.textContent ?? "");
  };
  visit(document.body);
  add(String(document.documentElement.clientWidth));
  return (hash >>> 0).toString(16);
}

export function takeInteractionSnapshot(): InteractionSnapshot {
  const dimensions = captureDimensions();
  const signature = pageContentSignature();
  const title =
    document.querySelector("main h1")?.textContent?.trim() || document.title;
  // html2canvas clones synchronously before its first await. Host handlers may
  // now remove the original dialog; rendering only reads the detached copy.
  const containers = new Set(
    document.querySelectorAll(".html2canvas-container"),
  );
  const render = html2canvas(document.body, {
    ...dimensions,
    scale: 1,
    logging: false,
    useCORS: true,
    ignoreElements: (element) => element.matches(captureExcluded),
  });
  const ownedContainers = [
    ...document.querySelectorAll(".html2canvas-container"),
  ].filter((container) => !containers.has(container));
  for (const container of ownedContainers)
    container.setAttribute("data-revisionlab-ui", "");
  const image = render
    .then((canvas) => {
      const screenshot = canvas.toDataURL("image/png");
      if (screenshot.length > 4_000_000)
        throw new Error("The pre-interaction screen exceeds 3 MB.");
      return { screenshot };
    })
    .catch((cause: unknown) => ({
      error: cause instanceof Error ? cause : new Error(String(cause)),
    }))
    .finally(() => {
      // The renderer removes its iframe on success, but not every failure path.
      for (const container of ownedContainers) container.remove();
    });
  return { ...dimensions, signature, title, image };
}
