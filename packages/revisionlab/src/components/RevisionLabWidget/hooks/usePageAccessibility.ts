import { wcagLabel, type WcagSettings } from "../../../wcag-settings.js";
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
  standard?: WcagSettings;
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

function createScheduler() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    schedule(callback: () => void, delay: number) {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        callback();
      }, delay);
    },
    cancel() {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    },
  };
}

export function usePageAccessibility(
  route: string,
  enabled: boolean,
  suspended: boolean,
  standard: WcagSettings,
) {
  const { wcagVersion, wcagLevel } = standard;
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
    const scheduler = createScheduler();
    let running = false;
    let dirty = false;
    const publish = (next: PageAccessibility) => {
      if (!controller.signal.aborted)
        setResult({ ...next, route, standard: { wcagVersion, wcagLevel } });
    };
    const observer = new MutationObserver((records) => {
      if (controller.signal.aborted || !records.some(isHostMutation)) return;
      dirty = true;
      if (!running) {
        setResult((previous) => ({ ...previous, status: "stale" }));
        scheduler.schedule(() => void scan(), 1800);
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
          { wcagVersion, wcagLevel },
        );
        if (!scanResult) return;
        if (
          !dirty &&
          !controller.signal.aborted &&
          signature === pageContentSignature()
        )
          rememberAccessibility(
            signature,
            summarizeAccessibility(scanResult, { wcagVersion, wcagLevel }),
          );
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
          scheduler.schedule(() => void scan(), 1800);
      }
    }
    // Defer state updates and scans until the committed host page is available.
    scheduler.schedule(() => {
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
      scheduler.cancel();
      observer.disconnect();
    };
  }, [route, enabled, suspended, revision, stopped, wcagVersion, wcagLevel]);
  const current: PageAccessibility = stopped
    ? { status: "stopped", issues: [], incomplete: 0 }
    : enabled &&
        result.route === route &&
        result.standard &&
        wcagLabel(result.standard) === wcagLabel(standard)
      ? suspended && result.status === "checking"
        ? { ...result, status: "stale" }
        : result
      : { status: "waiting", issues: [], incomplete: 0 };
  return {
    result: { ...current, standard: { wcagVersion, wcagLevel } },
    rerun,
    stop,
  };
}
