import { useCallback, useEffect, useRef, useState } from "react";
import { pageContentSignature } from "../../../client/interaction-snapshot.js";
import {
  rememberAccessibility,
  runAccessibilityScan,
  summarizeAccessibility,
} from "../../../client/accessibility-scan.js";
import {
  isHostMutation,
  waitForPageSettled,
} from "../../../client/page-settled.js";

export interface AccessibilityFinding {
  id: string;
  help: string;
  helpUrl: string;
  count: number;
  targets: { label: string; element: HTMLElement | null }[];
}
export interface PageAccessibility {
  status:
    | "stopped"
    | "waiting"
    | "checking"
    | "passed"
    | "issues"
    | "review"
    | "stale"
    | "error";
  issues: AccessibilityFinding[];
  incomplete: number;
  checkedAt?: string;
  error?: string;
}

export function usePageAccessibility(
  route: string,
  enabled: boolean,
  suspended: boolean,
) {
  const [result, setResult] = useState<PageAccessibility & { route?: string }>({
    status: "waiting",
    issues: [],
    incomplete: 0,
  });
  const [stopped, setStopped] = useState(false);
  const activeScan = useRef<AbortController | null>(null);
  const stop = useCallback(() => {
    activeScan.current?.abort();
    setStopped(true);
  }, []);
  const [revision, setRevision] = useState(0);
  const rerun = useCallback(() => {
    setStopped(false);
    setRevision((value) => value + 1);
  }, []);
  useEffect(() => {
    if (!enabled || stopped) return;
    const controller = new AbortController();
    activeScan.current = controller;
    let timer: ReturnType<typeof setTimeout>;
    let running = false;
    let dirty = false;
    const publish = (next: PageAccessibility) => {
      if (!controller.signal.aborted) setResult({ ...next, route });
    };
    const observer = new MutationObserver((records) => {
      if (controller.signal.aborted || !records.some(isHostMutation)) return;
      dirty = true;
      if (!running) {
        setResult((previous) => ({ ...previous, status: "stale" }));
        clearTimeout(timer);
        timer = setTimeout(() => void scan(), 1800);
      }
    });
    async function scan() {
      if (controller.signal.aborted || suspended) return;
      running = true;
      dirty = false;
      publish({ status: "checking", issues: [], incomplete: 0 });
      try {
        await waitForPageSettled(controller.signal);
        dirty = false;
        const signature = pageContentSignature();
        const scanResult = await runAccessibilityScan(
          () => controller.signal.aborted,
        );
        if (!scanResult) return;
        if (
          !dirty &&
          !controller.signal.aborted &&
          signature === pageContentSignature()
        )
          rememberAccessibility(signature, summarizeAccessibility(scanResult));
        publish({
          status: dirty
            ? "stale"
            : scanResult.violations.length
              ? "issues"
              : scanResult.incomplete.length
                ? "review"
                : "passed",
          issues: scanResult.violations.map((issue) => ({
            id: issue.id,
            help: issue.help,
            helpUrl: issue.helpUrl,
            count: issue.nodes.length,
            targets: issue.nodes.map((node) => ({
              label: node.target.join(" > "),
              element: node.element ?? null,
            })),
          })),
          incomplete: scanResult.incomplete.length,
          checkedAt: new Date().toISOString(),
        });
      } catch (cause) {
        publish({
          status: "error",
          issues: [],
          incomplete: 0,
          error:
            cause instanceof Error
              ? cause.message
              : "Accessibility check failed.",
        });
      } finally {
        running = false;
        if (dirty && !controller.signal.aborted)
          timer = setTimeout(() => void scan(), 1800);
      }
    }
    // Defer state updates and scans until the committed host page is available.
    timer = setTimeout(() => {
      if (controller.signal.aborted) return;
      // Review UI does not invalidate a completed host-page scan.
      // Keep observing while paused so real host changes still mark it stale.
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
      });
      observer.observe(document.documentElement, { attributes: true });
      if (!suspended) void scan();
    }, 0);
    return () => {
      controller.abort();
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [route, enabled, suspended, revision, stopped]);
  const current: PageAccessibility = stopped
    ? { status: "stopped", issues: [], incomplete: 0 }
    : enabled && result.route === route
      ? suspended && result.status === "checking"
        ? { ...result, status: "stale" }
        : result
      : { status: "waiting", issues: [], incomplete: 0 };
  return { result: current, rerun, stop };
}
