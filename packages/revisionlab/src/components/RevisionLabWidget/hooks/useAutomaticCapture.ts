import type { WcagSettings } from "../../../wcag-settings.js";
import { useLayoutEffect, useRef } from "react";
import { captureDimensions, loadRecording, saveRecording } from "../../../client/recording.js";
import type { RevisionLabCapture } from "../../../server/types.js";
import { captureExcluded, pageContentSignature, takeInteractionSnapshot, type InteractionSnapshot } from "../../../client/interaction-snapshot.js";
import { prepareInteractionSnapshots } from "../../../client/prepare-interaction.js";
import { recordedClick } from "../../../client/recording-click.js";
import { waitForPageSettled } from "../../../client/page-settled.js";
import { captureAccessibility } from "../../../client/recording-accessibility.js";
import type { JournalEntry } from "../../../client/recording-journal/types.js";
import { recordingJournal } from "../../../client/recording-journal/journal.js";
import { unavailableAccessibility } from "../../../accessibility.js";

// Frozen DOM rendering has a global bound across route effects.
let rendering = 0;
export function useAutomaticCapture({ apiPath, standard, flowId, route, enabled, paused, auditRecordings }: {
  apiPath: string;
  standard: WcagSettings;
  flowId?: string;
  route: string;
  enabled: boolean;
  paused: boolean;
  auditRecordings: boolean;
}) {
  const manual = useRef<(title?: string) => boolean>(() => false);
  const { wcagVersion, wcagLevel } = standard;
  useLayoutEffect(() => {
    if (!flowId || !enabled) return;
    const journal = recordingJournal(apiPath, flowId);
    const activeRecording = loadRecording();
    if (!activeRecording || activeRecording.finishRequested || activeRecording.discardRequested) return;
    let disposed = false;
    let controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let reason: RevisionLabCapture["reason"] = "page";
    let dirty = false;
    const start = performance.now();
    let lastSample = 0;
    let points: RevisionLabCapture["cursor"] = [];
    const active = () => !disposed && !journal.data.limitReached && journal.active() && !loadRecording()?.finishRequested;
    const evidence = (): RevisionLabCapture => {
      const { width, height } = captureDimensions();
      return { width, height, reason, cursor: points.filter((point) => point.x >= 0 && point.y >= 0 && point.x <= width && point.y <= height).map((point) => ({ ...point, x: point.x / width, y: point.y / height })), accessibility: unavailableAccessibility("not-scanned") };
    };
    const title = () => document.querySelector("main h1")?.textContent?.trim() || document.title || route;
    // Preserve a recovered visit; another mounted effect is not another navigation.
    const last = journal.data.entries.at(-1);
    let entry: JournalEntry;
    try {
      entry = last?.route === route && activeRecording.lastRoute === route ? last : journal.append(route, title(), evidence());
    } catch { return; }
    saveRecording({ ...activeRecording, lastRoute: route });
    const freeze = (snapshot?: InteractionSnapshot, audit = false) => {
      if (!active()) return;
      if (!snapshot) {
        if (rendering >= 2) { journal.unavailable(entry, "failed"); return; }
        rendering += 1;
        snapshot = takeInteractionSnapshot({ wcagVersion, wcagLevel });
        void snapshot.image.then(() => { rendering -= 1; });
      }
      if (entry.signature && entry.signature !== snapshot.signature) {
        try { entry = journal.append(route, title(), evidence()); } catch { return; }
      }
      if (["saved", "rendering"].includes(entry.state)) return;
      const report = audit && auditRecordings ? captureAccessibility(snapshot.signature, () => disposed || location.pathname !== route || !journal.active(), { wcagVersion, wcagLevel }) : undefined;
      if (!auditRecordings) snapshot = { ...snapshot, accessibility: unavailableAccessibility("not-scanned") };
      journal.freeze(entry, snapshot, evidence(), report);
      dirty = false;
      points = [];
    };
    const settle = async () => {
      controller.abort();
      controller = new AbortController();
      const signal = controller.signal;
      try {
        await waitForPageSettled(signal);
        if (active() && !signal.aborted && (!entry.signature || dirty || entry.state === "unavailable" || reason === "page")) {
          if (entry.signature !== pageContentSignature() || entry.state === "unavailable") freeze(undefined, true);
          else dirty = false;
        }
      } catch {
        if (active() && !signal.aborted) {
          journal.unavailable(entry, "not-ready");
          // Late host readiness can repair this visit without waiting for another click.
          timer = setTimeout(() => void settle(), 1000);
        }
      }
    };
    const sample = (event: MouseEvent, click?: number) => {
      const now = performance.now();
      if (!click && now - lastSample < 100) return;
      lastSample = now;
      points.push({ x: event.clientX + scrollX, y: event.clientY + scrollY, t: Math.min(86_400_000, Math.round(now - start)), ...(click ? { click } : {}) });
      if (points.length > 200) { const index = points.findIndex((point) => !point.click); points.splice(index < 0 ? 0 : index, 1); }
    };
    const interaction = (event: Event) => {
      if (paused || !event.isTrusted || !active() || !(event.target instanceof Element) || event.target.closest(captureExcluded)) return;
      if (event.type === "click" && snapshots.skipClick()) return;
      if (event instanceof MouseEvent && (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)) return;
      if (event.type !== "change") {
        const current = loadRecording()!;
        const click = Math.min(1_000_000, (current.clickCount ?? 0) + 1);
        saveRecording({ ...current, clickCount: click });
        if (event instanceof MouseEvent) sample(event.detail === 0 ? new MouseEvent("click", { clientX: event.target.getBoundingClientRect().x, clientY: event.target.getBoundingClientRect().y }) : event, click);
        const snapshot = snapshots.consume();
        if (snapshot && (entry.state === "waiting" || entry.state === "unavailable" || entry.signature !== snapshot.signature)) freeze(snapshot);
        journal.click(entry, event.type === "pointerup" ? snapshot?.interaction ?? null : (event instanceof MouseEvent || event instanceof KeyboardEvent ? recordedClick(event) : null) ?? snapshot?.interaction ?? null);
      }
      reason = event.type === "change" ? "change" : "click";
      dirty = true;
      clearTimeout(timer);
      void settle();
    };
    const snapshots = prepareInteractionSnapshots(() => !paused && active() && rendering < 2, interaction, { wcagVersion, wcagLevel });
    const move = (event: PointerEvent) => { if (!paused && active() && event.target instanceof Element && !event.target.closest(captureExcluded)) sample(event); };
    const stopped = () => { if (loadRecording()?.finishRequested) { controller.abort(); journal.unavailable(entry, "not-ready"); } };
    window.addEventListener("pointermove", move, true);
    window.addEventListener("click", interaction, true);
    window.addEventListener("change", interaction, true);
    window.addEventListener("revisionlab:recording", stopped);
    manual.current = (label) => { if (!active()) return false; reason = "manual"; if (entry.signature) { try { entry = journal.append(route, label || title(), evidence()); } catch { return false; } } freeze(undefined, true); if (label?.trim()) entry.title = label.trim().slice(0, 160); return true; };
    if (!paused) void settle();
    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(timer);
      snapshots.dispose();
      // Only readiness is cancelled. Frozen copies and uploads outlive this effect.
      if (location.pathname !== route) journal.unavailable(entry, "left-before-ready");
      manual.current = () => false;
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("click", interaction, true);
      window.removeEventListener("change", interaction, true);
      window.removeEventListener("revisionlab:recording", stopped);
    };
  }, [apiPath, flowId, route, enabled, paused, wcagVersion, wcagLevel, auditRecordings]);
  return manual;
}
