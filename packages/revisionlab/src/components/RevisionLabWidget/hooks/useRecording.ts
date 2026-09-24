"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../../../client/api.js";
import {
  captureScreen,
  loadRecording,
  saveRecording,
  type ActiveRecording,
} from "../../../client/recording.js";

type RecordingOperation = "capture" | "start" | "finish" | "discard" | null;

export function useRecording(apiPath: string, route: string, enabled: boolean) {
  const [recording, setRecording] = useState<ActiveRecording | null>(null);
  const [operation, setOperation] = useState<RecordingOperation>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const activeOperation = useRef<RecordingOperation>(null);
  const generation = useRef(0);
  const pendingCapture = useRef<Promise<boolean> | null>(null);

  const updateOperation = useCallback((next: RecordingOperation) => {
    activeOperation.current = next;
    setOperation(next);
  }, []);

  useEffect(() => {
    const sync = () => setRecording(loadRecording());
    sync();
    window.addEventListener("revisionlab:recording", sync);
    return () => window.removeEventListener("revisionlab:recording", sync);
  }, []);

  const capture = useCallback(
    (active?: ActiveRecording, title?: string): Promise<boolean> => {
      const target = active ?? loadRecording();
      if (
        !target ||
        target.discardRequested ||
        target.finishRequested ||
        activeOperation.current ||
        !enabled
      )
        return Promise.resolve(false);
      const captureGeneration = generation.current;
      const isCurrent = () =>
        generation.current === captureGeneration &&
        loadRecording()?.flowId === target.flowId &&
        !loadRecording()?.discardRequested;
      updateOperation("capture");
      setError("");
      const task = (async () => {
        try {
          const screenshot = await captureScreen();
          if (!isCurrent()) return false;
          await apiRequest(apiPath, `flows/${target.flowId}/steps`, {
            method: "POST",
            body: JSON.stringify({
              title: (
                title?.trim() ||
                document.querySelector("main h1")?.textContent?.trim() ||
                document.title ||
                route
              ).slice(0, 160),
              route,
              screenshot,
            }),
          });
          // A delayed capture must never restore a discarded browser session.
          if (!isCurrent()) return false;
          const current = loadRecording()!;
          saveRecording({
            ...current,
            count: current.count + 1,
            lastRoute: route,
          });
          setNotice(
            `Screen ${target.count + 1} captured. Stop recording to save.`,
          );
          return true;
        } catch (cause) {
          if (isCurrent())
            setError(
              cause instanceof Error
                ? cause.message
                : "Could not capture this screen. Try again.",
            );
          return false;
        } finally {
          if (
            generation.current === captureGeneration &&
            activeOperation.current === "capture"
          )
            updateOperation(null);
        }
      })();
      pendingCapture.current = task;
      return task;
    },
    [apiPath, enabled, route, updateOperation],
  );

  useEffect(() => {
    if (
      !recording ||
      recording.discardRequested ||
      recording.finishRequested ||
      !enabled ||
      recording.lastRoute === route
    )
      return;
    const timeout = window.setTimeout(() => void capture(), 900);
    return () => window.clearTimeout(timeout);
  }, [capture, enabled, recording, route]);

  async function start(name: string, personaId: string) {
    if (activeOperation.current || loadRecording()) return;
    updateOperation("start");
    setError("");
    setNotice("");
    try {
      const { id, persona } = await apiRequest<{ id: string; persona: string }>(
        apiPath,
        "flows",
        {
          method: "POST",
          body: JSON.stringify({ name, personaId, route }),
        },
      );
      generation.current += 1;
      saveRecording({ flowId: id, name, persona, count: 0, lastRoute: "" });
      setNotice(
        "Recording started. The first screen will be captured automatically.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not start this recording.",
      );
    } finally {
      updateOperation(null);
    }
  }

  async function finish(): Promise<boolean> {
    const target = loadRecording();
    if (
      !target ||
      target.discardRequested ||
      (activeOperation.current && activeOperation.current !== "capture")
    )
      return false;
    updateOperation("finish");
    setError("");
    try {
      saveRecording({ ...target, finishRequested: true });
      // Stop accepting captures immediately, then finish the one already underway.
      await pendingCapture.current;
      if (loadRecording()?.flowId !== target.flowId) return false;
      if (!loadRecording()?.count)
        throw new Error(
          "Recording has no captured screens. Discard it and start a new recording.",
        );
      await apiRequest(apiPath, `flows/${target.flowId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "complete" }),
      });
      generation.current += 1;
      saveRecording(null);
      setNotice(
        "Recording stopped and saved. Open the workspace to review your screens.",
      );
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save this recording. Try again.",
      );
      return false;
    } finally {
      updateOperation(null);
    }
  }

  async function discard(): Promise<boolean> {
    const target = loadRecording();
    if (!target) return true;
    if (target.finishRequested && target.count > 0) {
      setError(
        "Saving was already requested. Stay on this page and retry saving before leaving.",
      );
      return false;
    }
    if (activeOperation.current && activeOperation.current !== "capture")
      return false;
    generation.current += 1;
    updateOperation("discard");
    setError("");
    try {
      // A failed response can mean the draft is already removed but cleanup needs retry.
      saveRecording({ ...target, discardRequested: true });
      // Include an upload already underway in the server's durable cleanup queue.
      await pendingCapture.current;
      await apiRequest(apiPath, `flows/${target.flowId}/discard`, {
        method: "POST",
        body: "{}",
      });
      if (loadRecording()?.flowId === target.flowId) saveRecording(null);
      setNotice("Recording discarded. It has not been saved.");
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not discard this recording. Stay here and try again.",
      );
      return false;
    } finally {
      updateOperation(null);
    }
  }

  return {
    recording,
    busy: operation !== null,
    operation,
    canCapture:
      enabled && !recording?.discardRequested && !recording?.finishRequested,
    error,
    notice,
    start,
    capture,
    finish,
    discard,
  };
}
