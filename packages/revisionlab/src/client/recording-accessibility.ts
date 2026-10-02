import { defaultWcagSettings, type WcagSettings } from "../wcag-settings.js";
import {
  unavailableAccessibility,
  type AccessibilityReport,
} from "../accessibility.js";
import {
  rememberAccessibility,
  runAccessibilityScan,
  summarizeAccessibility,
} from "./accessibility-scan.js";
import { pageContentSignature } from "./interaction-snapshot.js";
import { isHostMutation } from "./page-settled.js";

export async function captureAccessibility(
  signature: string,
  cancelled: () => boolean,
  standard: WcagSettings = defaultWcagSettings,
): Promise<AccessibilityReport> {
  let expired = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const route = location.href;
  const language = document.documentElement.lang;
  let changed = signature !== pageContentSignature();
  const observer = new MutationObserver((records) => {
    if (records.some(isHostMutation)) changed = true;
  });
  observer.observe(document.body, {
    subtree: true,
    attributes: true,
    childList: true,
    characterData: true,
  });
  observer.observe(document.documentElement, { attributes: true });
  try {
    const scan = await Promise.race([
      runAccessibilityScan(
        () => expired || cancelled() || location.href !== route,
        standard,
      ),
      new Promise<null>((resolve) => {
        timer = setTimeout(() => {
          expired = true;
          resolve(null);
        }, 10000);
      }),
    ]);
    if (!scan || cancelled()) return unavailableAccessibility("failed");
    if (
      changed ||
      observer.takeRecords().some(isHostMutation) ||
      location.href !== route ||
      document.documentElement.lang !== language ||
      signature !== pageContentSignature()
    )
      return unavailableAccessibility("changed");
    const report = summarizeAccessibility(scan, standard);
    rememberAccessibility(signature, report);
    return report;
  } catch {
    return unavailableAccessibility("failed");
  } finally {
    observer.disconnect();
    clearTimeout(timer);
  }
}
