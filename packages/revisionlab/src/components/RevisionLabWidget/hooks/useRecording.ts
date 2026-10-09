"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../../../client/api.js";
import { flowNameConflicts } from "../../../client/flow-name-conflicts.js";
import { finishPendingRecording } from "../../../client/recording-finish.js";
import {
  loadRecording,
  saveRecording,
  type ActiveRecording,
} from "../../../client/recording.js";
import { recordingJournal } from "../../../client/recording-journal/journal.js";
import type { JournalStatus } from "../../../client/recording-journal/types.js";
import {
  defaultWcagSettings,
  type WcagSettings,
} from "../../../wcag-settings.js";
import { useAutomaticCapture } from "./useAutomaticCapture.js";

type RecordingOperation = "capture" | "start" | "finish" | "discard" | null;

export function useRecording(
  apiPath: string,
  route: string,
  enabled: boolean,
  paused = false,
  standard: WcagSettings = defaultWcagSettings,
  auditRecordings = true,
) {
  const [recording, setRecording] = useState<ActiveRecording | null>(null);
  const [operation, setOperation] = useState<RecordingOperation>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savedRecording, setSavedRecording] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const activeOperation = useRef<RecordingOperation>(null);
  const [progress, setProgress] = useState<JournalStatus>({ pending: 0, phase: "Ready", error: "", warning: "" });

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

  useEffect(() => {
    const sync = () => {
      const active = loadRecording();
      if (active) setProgress(recordingJournal(apiPath, active.flowId).status());
      else setProgress({ pending: 0, phase: "Ready", error: "", warning: "" });
    };
    sync();
    window.addEventListener("revisionlab:recording-progress", sync);
    window.addEventListener("revisionlab:recording", sync);
    return () => {
      window.removeEventListener("revisionlab:recording-progress", sync);
      window.removeEventListener("revisionlab:recording", sync);
    };
  }, [apiPath]);

  const manualCapture = useAutomaticCapture({ apiPath, standard, flowId: recording?.flowId, route, enabled, paused, auditRecordings });
  const capture = (_active?: ActiveRecording, title?: string) => Promise.resolve(manualCapture.current(title));
  const retry = async () => {
    const active = loadRecording();
    if (!active) return;
    await recordingJournal(apiPath, active.flowId).retry();
  };

  async function start(
    name: string,
    personaId: string,
    replaceFlowId?: string,
  ) {
    if (activeOperation.current || loadRecording()) return;
    updateOperation("start");
    setSavedRecording(null);
    setError("");
    setNotice("");
    try {
      const { id, persona } = await apiRequest<{ id: string; persona: string }>(
        apiPath,
        "flows",
        {
          method: "POST",
          body: JSON.stringify({ name, personaId, route, replaceFlowId }),
        },
      );
      saveRecording({ flowId: id, name, persona, count: 0, lastRoute: "" });
      setNotice(
        "Recording started. The first screen will be captured automatically.",
      );
      return true;
    } catch (cause) {
      const conflicts = flowNameConflicts(cause);
      if (conflicts) return { conflicts };
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not start this recording.",
      );
      return false;
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
      const result = await finishPendingRecording(
        apiPath,
        null,
        () => recordingJournal(apiPath, target.flowId).drain(),
      );
      if (!result) return false;
      recordingJournal(apiPath, target.flowId).clear();
      setError("");
      setSavedRecording(
        result.outcome === "saved" ? { id: result.id, name: result.name } : null,
      );
      setNotice(
        result.outcome === "saved"
          ? "Recording ended and saved."
          : "Recording stopped. No screens were captured, so nothing was saved.",
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
    updateOperation("discard");
    setError("");
    try {
      // A failed response can mean the draft is already removed but cleanup needs retry.
      saveRecording({ ...target, discardRequested: true });
      // Include an upload already underway in the server's durable cleanup queue.
      await recordingJournal(apiPath, target.flowId).discard();
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
      enabled && !progress.limited && !recording?.discardRequested && !recording?.finishRequested,
    error: error || progress.error,
    progress,
    retry,
    notice,
    savedRecording,
    dismissSaved: () => {
      setSavedRecording(null);
      setNotice("");
    },
    start,
    capture,
    finish,
    discard,
  };
}
