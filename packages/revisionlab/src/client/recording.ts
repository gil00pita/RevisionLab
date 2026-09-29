import type { RevisionLabClick } from "../server/types.js";

export interface ActiveRecording {
  flowId: string;
  name: string;
  persona: string;
  count: number;
  lastRoute: string;
  discardRequested?: boolean;
  finishRequested?: boolean;
  clickCount?: number;
  lastStepId?: string;
  lastSignature?: string;
  pendingClick?: {
    id: string;
    sourceStepId: string;
    sourceRoute: string;
    signature: string;
    interaction: RevisionLabClick;
  };
}

const storageKey = "revisionlab.recording";
let volatileRecording: ActiveRecording | null | undefined;

export function loadRecording(): ActiveRecording | null {
  if (volatileRecording !== undefined) return volatileRecording;
  try {
    const item = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
    if (
      item &&
      typeof item.flowId === "string" &&
      typeof item.name === "string" &&
      typeof item.count === "number" &&
      typeof item.persona === "string"
    )
      return item;
  } catch {
    /* Storage can be unavailable in a privacy-restricted browser. */
  }
  return null;
}

export function saveRecording(recording: ActiveRecording | null) {
  try {
    if (recording)
      sessionStorage.setItem(storageKey, JSON.stringify(recording));
    else sessionStorage.removeItem(storageKey);
    volatileRecording = undefined;
  } catch {
    // A privacy/quota error must not undo a completed server save or discard.
    volatileRecording = recording;
  }
  window.dispatchEvent(new Event("revisionlab:recording"));
}

export function safePrototypeRoute(route: string, basePath: string): string {
  if (
    !route.startsWith("/") ||
    route.startsWith("//") ||
    route.includes("\\") ||
    route.startsWith(basePath) ||
    route.startsWith("/api/")
  )
    return "/";
  return route;
}

export function captureDimensions() {
  return {
    width: document.documentElement.clientWidth,
    height: Math.min(
      Math.max(document.body.scrollHeight, window.innerHeight),
      4000,
    ),
  };
}

export async function captureScreen(): Promise<string> {
  const { toPng } = await import("html-to-image");
  await document.fonts.ready;
  // Private controls never enter the cloned document. Hosts can redact whole regions.
  const screenshot = await toPng(document.body, {
    pixelRatio: 1,
    ...captureDimensions(),
    filter: (node) =>
      !(
        node instanceof Element &&
        (node.hasAttribute("data-revisionlab-ui") ||
          node.hasAttribute("data-revisionlab-private") ||
          node.matches(
            'nextjs-portal, .html2canvas-container, input[type="password"], input[autocomplete="one-time-code"]',
          ))
      ),
  });
  if (screenshot.length > 4_000_000)
    throw new Error(
      "This screen exceeds 3 MB. Try a smaller browser window and capture again.",
    );
  return screenshot;
}
