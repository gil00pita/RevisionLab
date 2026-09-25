import { useEffect, useRef } from "react";
import {
  captureDimensions,
  loadRecording,
  saveRecording,
} from "../../../client/recording.js";
import type { RevisionLabCapture } from "../../../server/types.js";
import type { AutomaticCaptureRequest } from "../../../client/recording-capture.js";
import { captureExcluded } from "../../../client/interaction-snapshot.js";
import { prepareInteractionSnapshots } from "../../../client/prepare-interaction.js";

export function useAutomaticCapture({
  flowId,
  route,
  enabled,
  paused,
  capture,
  busy,
}: {
  flowId?: string;
  route: string;
  enabled: boolean;
  paused: boolean;
  capture: (request: AutomaticCaptureRequest) => Promise<boolean>;
  busy: () => boolean;
}) {
  const callbacks = useRef({ capture, busy });
  useEffect(() => {
    callbacks.current = { capture, busy };
  }, [capture, busy]);
  useEffect(() => {
    if (!flowId || !enabled || paused) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let running = false;
    let dirty = false;
    let reason: RevisionLabCapture["reason"] = "page";
    let fieldChanged = false;
    let before: ReturnType<NonNullable<AutomaticCaptureRequest["before"]>>;
    const start = performance.now();
    let lastSample = 0;
    let points: { x: number; y: number; t: number; click?: number }[] = [];
    const active = () => {
      const current = loadRecording();
      return (
        current?.flowId === flowId &&
        !current.finishRequested &&
        !current.discardRequested &&
        !controller.signal.aborted
      );
    };
    const sample = (event: MouseEvent, click?: number) => {
      const now = performance.now();
      if (!click && now - lastSample < 100) return;
      lastSample = now;
      points.push({
        x: event.clientX + scrollX,
        y: event.clientY + scrollY,
        t: Math.min(86_400_000, Math.round(now - start)),
        ...(click ? { click } : {}),
      });
      // Keep click evidence when reducing long paths; never store unbounded movement.
      if (points.length > 200) {
        const removable = points.findIndex((point) => !point.click);
        points.splice(removable < 0 ? 0 : removable, 1);
      }
    };
    const evidence = (width: number, height: number) =>
      points
        .filter(
          (point) =>
            point.x >= 0 &&
            point.x <= width &&
            point.y >= 0 &&
            point.y <= height,
        )
        .map((point) => ({
          ...point,
          x: point.x / width,
          y: point.y / height,
        }));
    async function run() {
      if (!active() || running) return;
      if (callbacks.current.busy()) {
        timer = setTimeout(() => void run(), 300);
        return;
      }
      running = true;
      dirty = false;
      const needsPage = loadRecording()?.lastRoute !== route;
      let consumed = 0;
      const snapshot = before;
      before = undefined;
      const captured = await callbacks.current.capture({
        signal: controller.signal,
        before: () => before ?? snapshot,
        evidence: () => {
          consumed = points.length;
          dirty = false;
          before = undefined;
          const { width, height } = captureDimensions();
          const captureReason = needsPage
            ? "page"
            : fieldChanged
              ? "change"
              : reason;
          fieldChanged = false;
          return {
            width,
            height,
            reason: captureReason,
            cursor: evidence(width, height),
          };
        },
      });
      if (captured)
        points = points
          .slice(Math.max(0, consumed - 1))
          .map((point, index) =>
            index === 0 ? { x: point.x, y: point.y, t: point.t } : point,
          );
      running = false;
      if (dirty && active()) timer = setTimeout(() => void run(), 300);
    }
    const interaction = (event: Event) => {
      if (
        !event.isTrusted ||
        !active() ||
        !(event.target instanceof Element) ||
        event.target.closest(captureExcluded)
      )
        return;
      if (event.type === "click" && snapshots.skipClick()) return;
      if (event.type !== "change" && event instanceof MouseEvent) {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.altKey ||
          event.shiftKey
        )
          return;
        const current = loadRecording()!;
        const click = Math.min(1_000_000, (current.clickCount ?? 0) + 1);
        saveRecording({ ...current, clickCount: click });
        // Keyboard activation has no pointer position; use the control's center.
        if (event.type === "click" && event.detail === 0) {
          const rect = event.target.getBoundingClientRect();
          sample(
            new MouseEvent("click", {
              clientX: rect.x + rect.width / 2,
              clientY: rect.y + rect.height / 2,
            }),
            click,
          );
        } else sample(event, click);
        if (!before) {
          const snapshot = snapshots.consume();
          if (snapshot)
            before = {
              ...snapshot,
              cursor: evidence(snapshot.width, snapshot.height),
            };
        }
      }
      reason = event.type === "change" ? "change" : "click";
      if (event.type === "change") fieldChanged = true;
      dirty = true;
      clearTimeout(timer);
      void run();
    };
    const snapshots = prepareInteractionSnapshots(
      () => active() && !before,
      interaction,
    );
    const move = (event: PointerEvent) => {
      if (
        active() &&
        event.target instanceof Element &&
        !event.target.closest(captureExcluded)
      )
        sample(event);
    };
    window.addEventListener("pointermove", move, true);
    window.addEventListener("click", interaction, true);
    window.addEventListener("change", interaction, true);
    if (loadRecording()?.lastRoute !== route)
      timer = setTimeout(() => void run(), 0);
    return () => {
      controller.abort();
      snapshots.dispose();
      clearTimeout(timer);
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("click", interaction, true);
      window.removeEventListener("change", interaction, true);
    };
  }, [flowId, route, enabled, paused]);
}
