import { loadRecording } from "./recording.js";

export const recordingNavigationEvent = "revisionlab:confirm-navigation";

export interface RecordingNavigationRequest {
  href: string;
  handled: boolean;
  resolve: (allowed: boolean) => void;
}

export interface RecordingNavigationTarget {
  href: string;
  changesPage: boolean;
  canContinue: boolean;
}

export function classifyRecordingNavigation(
  href: string,
  currentHref: string,
  basePath: string,
): RecordingNavigationTarget | null {
  try {
    const current = new URL(currentHref);
    const destination = new URL(href, current);
    if (!["http:", "https:"].includes(destination.protocol)) return null;
    const sameOrigin = destination.origin === current.origin;
    const root = basePath.replace(/\/$/, "") || "/";
    const workspace =
      root === "/" ||
      destination.pathname === root ||
      destination.pathname.startsWith(`${root}/`);
    const api =
      destination.pathname === "/api" ||
      destination.pathname.startsWith("/api/");
    return {
      href: destination.href,
      changesPage:
        !sameOrigin ||
        destination.pathname !== current.pathname ||
        destination.search !== current.search,
      canContinue: sameOrigin && !workspace && !api,
    };
  } catch {
    return null;
  }
}

/** Await immediately before a host router push/replace or location assignment. */
export function confirmRecordingNavigation(href: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const destination = classifyRecordingNavigation(
    href,
    window.location.href,
    "/revisionlab",
  );
  if (!destination) return Promise.resolve(false);
  if (!destination.changesPage) return Promise.resolve(true);
  return new Promise((resolve) => {
    const detail: RecordingNavigationRequest = {
      href: destination.href,
      handled: false,
      resolve,
    };
    window.dispatchEvent(
      new CustomEvent<RecordingNavigationRequest>(recordingNavigationEvent, {
        detail,
      }),
    );
    // An active draft without its mounted guard must not silently allow leaving.
    if (!detail.handled) resolve(!loadRecording());
  });
}
