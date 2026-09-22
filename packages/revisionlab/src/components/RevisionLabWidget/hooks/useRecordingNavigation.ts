"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadRecording } from "../../../client/recording.js";
import {
  classifyRecordingNavigation,
  recordingNavigationEvent,
  type RecordingNavigationRequest,
} from "../../../client/recording-navigation.js";

interface RecordingNavigationOptions {
  active: boolean;
  allowContinue: boolean;
  capturing: boolean;
  basePath: string;
  onDiscard: () => Promise<boolean>;
  busy?: boolean;
}

interface PendingNavigation {
  href: string | null;
  canContinue: boolean;
}

interface NavigationRequest extends PendingNavigation {
  complete: (allowed: boolean) => void;
}

export function useRecordingNavigation(options: RecordingNavigationOptions) {
  const [pending, setPending] = useState<PendingNavigation | null>(null);
  const latest = useRef(options);
  const request = useRef<NavigationRequest | null>(null);
  const replaying = useRef<HTMLAnchorElement | null>(null);
  const discarding = useRef(false);
  const approvedUnload = useRef(false);
  const approvalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latest.current = options;
  }, [options]);

  const finishRequest = useCallback((allowed: boolean) => {
    const current = request.current;
    request.current = null;
    setPending(null);
    current?.complete(allowed);
  }, []);

  useEffect(() => {
    // Discard owns its pending navigation until the server result is known.
    if (!options.active && !discarding.current) finishRequest(false);
  }, [options.active, finishRequest]);

  const allowNextUnload = useCallback(() => {
    approvedUnload.current = true;
    if (approvalTimer.current) clearTimeout(approvalTimer.current);
    // A host can cancel the replayed link. Approval must not survive indefinitely.
    approvalTimer.current = setTimeout(() => {
      approvedUnload.current = false;
      approvalTimer.current = null;
    }, 1000);
  }, []);

  const beginRequest = useCallback((next: NavigationRequest) => {
    if (request.current) {
      next.complete(false);
      return;
    }
    request.current = next;
    setPending({ href: next.href, canContinue: next.canContinue });
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = event
        .composedPath()
        .find(
          (node): node is HTMLAnchorElement =>
            node instanceof HTMLAnchorElement,
        );
      if (!anchor) return;
      if (replaying.current === anchor) {
        replaying.current = null;
        return;
      }
      approvedUnload.current = false;
      if (
        !loadRecording() ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target.toLowerCase() !== "_self")
      )
        return;
      const destination = classifyRecordingNavigation(
        anchor.href,
        window.location.href,
        latest.current.basePath,
      );
      if (!destination?.changesPage) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      beginRequest({
        href: destination.href,
        canContinue: destination.canContinue && latest.current.allowContinue,
        complete: (allowed) => {
          if (!allowed) return;
          allowNextUnload();
          if (anchor.href !== destination.href) {
            window.location.assign(destination.href);
            return;
          }
          replaying.current = anchor;
          try {
            // Replay once so Next Link and host handlers retain their semantics.
            anchor.click();
          } finally {
            replaying.current = null;
          }
        },
      });
    };
    const onRequest = (event: Event) => {
      const detail = (event as CustomEvent<RecordingNavigationRequest>).detail;
      if (!detail || detail.handled || typeof detail.resolve !== "function")
        return;
      detail.handled = true;
      const destination = classifyRecordingNavigation(
        detail.href,
        window.location.href,
        latest.current.basePath,
      );
      if (!destination) {
        detail.resolve(false);
      } else if (!loadRecording() || !destination.changesPage) {
        detail.resolve(true);
      } else {
        beginRequest({
          href: destination.href,
          canContinue: destination.canContinue && latest.current.allowContinue,
          complete: (allowed) => {
            if (allowed) allowNextUnload();
            detail.resolve(allowed);
          },
        });
      }
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener(recordingNavigationEvent, onRequest);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(recordingNavigationEvent, onRequest);
      if (approvalTimer.current) clearTimeout(approvalTimer.current);
      const current = request.current;
      request.current = null;
      current?.complete(false);
    };
  }, [allowNextUnload, beginRequest]);

  useEffect(() => {
    if (!options.active) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      // Saving/discarding clears storage before React removes this listener.
      if (!loadRecording()) return;
      if (approvedUnload.current) {
        approvedUnload.current = false;
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [options.active]);

  function cancel() {
    if (!discarding.current) finishRequest(false);
  }

  function continueRecording() {
    const recording = loadRecording();
    if (
      !request.current?.canContinue ||
      !latest.current.allowContinue ||
      !recording ||
      recording.discardRequested ||
      recording.finishRequested ||
      latest.current.capturing ||
      latest.current.busy ||
      discarding.current
    )
      return;
    finishRequest(true);
  }

  async function discardAndLeave(): Promise<boolean> {
    const current = request.current;
    if (!current || latest.current.busy || discarding.current) return false;
    discarding.current = true;
    try {
      if (!(await latest.current.onDiscard()) || request.current !== current)
        return false;
      finishRequest(true);
      return true;
    } catch {
      return false;
    } finally {
      discarding.current = false;
      if (!latest.current.active && request.current === current) {
        finishRequest(false);
      }
    }
  }

  function requestDiscard() {
    if (!latest.current.active) return;
    beginRequest({ href: null, canContinue: false, complete: () => undefined });
  }

  return {
    pending: pending
      ? {
          ...pending,
          canContinue: pending.canContinue && options.allowContinue,
        }
      : null,
    cancel,
    continueRecording,
    discardAndLeave,
    requestDiscard,
  };
}
