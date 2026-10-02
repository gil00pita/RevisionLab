import { apiRequest, ApiError } from "../../client/api.js";
import { captureDimensions, captureScreen } from "../../client/recording.js";
import {
  captureExcluded,
  pageContentSignature,
} from "../../client/interaction-snapshot.js";
import {
  testKeys,
  type TestEvent,
  type TestSession,
} from "../../test-sessions.js";

/** One recorder per origin, acquired by the participant component with Web Locks. */
export function recordTest(
  apiPath: string,
  session: TestSession,
  serverNow: number,
  onError: (message: string) => void,
  onEnd: (endSession?: boolean) => void,
) {
  const storageKey = `revisionlab.test.events.${session.id}`;
  const clockOffset = serverNow - Date.now();
  const elapsed = () =>
    Math.max(0, Math.round(Date.now() + clockOffset - session.startedAt!));
  let events: TestEvent[] = [];
  try {
    events = JSON.parse(sessionStorage.getItem(storageKey) ?? "[]");
  } catch {
    /* Memory queue still works. */
  }
  let stopped = false,
    flushing = false,
    capturing = false,
    screenId: string | undefined;
  let lastRoute = "",
    signature = "",
    lastMove = 0,
    lastCapture = 0;
  const persist = () => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(events));
    } catch {
      onError(
        "Browser storage is unavailable. Keep this tab open until recording is saved.",
      );
    }
  };
  const add = (type: TestEvent["type"], extra: Partial<TestEvent> = {}) => {
    if (stopped || elapsed() >= session.maxMinutes * 60000) return;
    if (events.length >= 5000) {
      onError(
        "Recording paused: too many unsaved events. Restore the connection and reload to resume.",
      );
      onEnd(true);
      return;
    }
    events.push({
      id: crypto.randomUUID(),
      t: elapsed(),
      type,
      route: location.pathname,
      ...(lastRoute === location.pathname ? { screenId } : {}),
      ...extra,
    });
  };
  const flush = async () => {
    if (flushing || !events.length) return;
    flushing = true;
    const batch = events.slice(0, 64);
    let saved = false;
    persist();
    try {
      await apiRequest(apiPath, "test-participant/events", {
        method: "POST",
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      });
      saved = true;
      events = events.slice(batch.length);
      persist();
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Could not save recording. Retrying…",
      );
      if (
        error instanceof ApiError &&
        [401, 403, 409, 410].includes(error.status)
      )
        onEnd(error.status === 409);
    } finally {
      flushing = false;
      if (saved && events.length) void flush();
    }
  };
  const snapshot = async () => {
    if (capturing || stopped || Date.now() - lastCapture < 400) return;
    const route = location.pathname;
    const nextSignature = `${route}:${pageContentSignature()}:${scrollX}:${scrollY}`;
    if (signature === nextSignature) return;
    capturing = true;
    lastCapture = Date.now();
    const t = elapsed();
    try {
      const dimensions = captureDimensions();
      const screenshot = await captureScreen(true);
      if (stopped || location.pathname !== route) return;
      const saved = await apiRequest<{ id: string }>(
        apiPath,
        "test-participant/screens",
        {
          method: "POST",
          body: JSON.stringify({
            title: (document.title || route).slice(0, 160),
            route,
            screenshot,
            reuse: true,
            capture: { ...dimensions, reason: "page", cursor: [] },
          }),
        },
      );
      screenId = saved.id;
      lastRoute = route;
      signature = nextSignature;
      add("screen", { screenId, route, t });
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Could not capture this screen.",
      );
      if (
        error instanceof ApiError &&
        [401, 403, 409, 410].includes(error.status)
      )
        onEnd(error.status === 409);
    } finally {
      capturing = false;
    }
  };
  const excluded = (target: EventTarget | null) =>
    target instanceof Element && Boolean(target.closest(captureExcluded));
  const pointer = (event: MouseEvent) => {
    if (excluded(event.target)) return;
    if (event.type === "mousemove" && Date.now() - lastMove < 100) return;
    lastMove = Date.now();
    const dimensions = captureDimensions();
    add(event.type === "click" ? "click" : "move", {
      x: Math.max(0, Math.min(1, (event.clientX + scrollX) / dimensions.width)),
      y: Math.max(
        0,
        Math.min(1, (event.clientY + scrollY) / dimensions.height),
      ),
    });
  };
  const keyboard = (event: KeyboardEvent) => {
    if (excluded(event.target)) return;
    const key = testKeys.find((key) => key === event.key) ?? "[masked]";
    add("key", { key });
  };
  const scroll = () =>
    add("scroll", {
      x: Math.min(
        1,
        scrollX / Math.max(1, document.documentElement.scrollWidth),
      ),
      y: Math.min(
        1,
        scrollY / Math.max(1, document.documentElement.scrollHeight),
      ),
    });
  let snapshotTimer: ReturnType<typeof setTimeout>;
  const scheduleSnapshot = () => {
    clearTimeout(snapshotTimer);
    snapshotTimer = setTimeout(() => void snapshot(), 450);
  };
  const observer = new MutationObserver((records) => {
    if (records.some((record) => !excluded(record.target))) scheduleSnapshot();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });
  document.addEventListener("click", scheduleSnapshot, true);
  document.addEventListener("change", scheduleSnapshot, true);
  const pagehide = () => {
    persist();
    void flush();
  };
  document.addEventListener("mousemove", pointer, true);
  document.addEventListener("click", pointer, true);
  document.addEventListener("keydown", keyboard, true);
  window.addEventListener("scroll", scroll, { passive: true });
  window.addEventListener("pagehide", pagehide);
  const timer = window.setInterval(() => {
    void flush();
    void snapshot();
    if (elapsed() >= session.maxMinutes * 60000) onEnd();
  }, 1000);
  add("screen");
  void snapshot();
  return () => {
    stopped = true;
    clearTimeout(snapshotTimer);
    observer.disconnect();
    document.removeEventListener("click", scheduleSnapshot, true);
    document.removeEventListener("change", scheduleSnapshot, true);
    clearInterval(timer);
    document.removeEventListener("mousemove", pointer, true);
    document.removeEventListener("click", pointer, true);
    document.removeEventListener("keydown", keyboard, true);
    window.removeEventListener("scroll", scroll);
    window.removeEventListener("pagehide", pagehide);
    persist();
    void flush();
  };
}
