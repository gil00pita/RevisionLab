import { useCallback, useEffect, useState } from "react";
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
    "waiting" | "checking" | "passed" | "issues" | "review" | "stale" | "error";
  issues: AccessibilityFinding[];
  incomplete: number;
  checkedAt?: string;
  error?: string;
}
// axe has one document-wide runner. Serialize remounts and route changes.
let scanQueue: Promise<unknown> = Promise.resolve();

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
  const [revision, setRevision] = useState(0);
  const rerun = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let running = false;
    let dirty = false;
    const publish = (next: PageAccessibility) => {
      if (!controller.signal.aborted) setResult({ ...next, route });
    };
    const observer = new MutationObserver((records) => {
      if (!records.some(isHostMutation)) return;
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
        const task = scanQueue
          .catch(() => undefined)
          .then(async () => {
            if (controller.signal.aborted) return null;
            const axe = (await import("axe-core")).default;
            return axe.run(
              {
                exclude: [
                  "[data-revisionlab-ui]",
                  "[data-revisionlab-private]",
                  "nextjs-portal",
                  ".html2canvas-container",
                ],
              },
              {
                elementRef: true,
                runOnly: {
                  type: "tag",
                  values: [
                    "wcag2a",
                    "wcag2aa",
                    "wcag21a",
                    "wcag21aa",
                    "wcag22aa",
                  ],
                },
                resultTypes: ["violations", "incomplete"],
              },
            );
          });
        scanQueue = task;
        const scanResult = await task;
        if (!scanResult) return;
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
  }, [route, enabled, suspended, revision]);
  const current: PageAccessibility =
    enabled && result.route === route
      ? result
      : { status: "waiting", issues: [], incomplete: 0 };
  return { result: current, rerun };
}
